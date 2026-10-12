using System.Diagnostics;
using OpenQA.Selenium;
using OpenQA.Selenium.Edge;

namespace EdgeWebDriverCSharp;

/// <summary>
/// Drop-in helper for the C# test framework.
/// Copy this class into your automation project and call <see cref="Create"/>.
/// </summary>
public static class EdgeDriverHelper
{
    /// <summary>How long Selenium waits for the initial /session handshake.</summary>
    public static TimeSpan SessionTimeout { get; set; } = TimeSpan.FromSeconds(180);

    private static readonly string[] SkipDirectoryNames =
    [
        "Cache",
        "Code Cache",
        "GPUCache",
        "GrShaderCache",
        "ShaderCache",
        "Service Worker",
        "blob_storage",
        "Session Storage",
        "VideoDecodeStats",
        "BrowserMetrics",
        "Crashpad",
        "optimization_guide_prediction_model_downloads",
        "component_crx_cache",
        "GraphiteDawnCache",
    ];

    private static readonly string[] LockFileNames =
    [
        "SingletonLock",
        "SingletonCookie",
        "SingletonSocket",
        "lockfile",
    ];

    /// <summary>
    /// Creates an Edge WebDriver session using cookies/SSO/proxy from the machine's
    /// Edge profile. By default copies that profile to a non-default temp folder
    /// (required for DevTools remote debugging) and refuses to start if Edge is open.
    /// </summary>
    /// <param name="url">Optional URL to navigate to after start.</param>
    /// <param name="userDataDir">
    /// Edge User Data folder. Default:
    /// %LOCALAPPDATA%\Microsoft\Edge\User Data
    /// </param>
    /// <param name="profileDirectory">Profile folder name, usually "Default".</param>
    /// <param name="proxyPacUrl">Optional PAC URL if profile proxy is not enough.</param>
    /// <param name="copyProfile">
    /// When true (default), copies the profile to a temp dir so WebDriver does not
    /// hit the live profile lock / "non-default data directory" DevTools issue.
    /// </param>
    /// <param name="killEdgeIfRunning">
    /// When true, ends leftover msedge / msedgedriver processes. When false, throws
    /// if any are still running.
    /// </param>
    /// <returns>Caller must dispose / Quit the driver.</returns>
    public static IWebDriver Create(
        string? url = null,
        string? userDataDir = null,
        string profileDirectory = "Default",
        string? proxyPacUrl = null,
        bool copyProfile = true,
        bool killEdgeIfRunning = true)
    {
        userDataDir ??= Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Microsoft", "Edge", "User Data");

        EnsureEdgeClosed(killEdgeIfRunning);

        var effectiveUserDataDir = userDataDir;
        if (copyProfile && !string.IsNullOrWhiteSpace(userDataDir))
        {
            effectiveUserDataDir = CopyProfileForWebDriver(userDataDir, profileDirectory);
            Console.WriteLine($"Using copied profile : {effectiveUserDataDir}");
        }

        var options = BuildOptions(effectiveUserDataDir, profileDirectory, proxyPacUrl);
        var service = EdgeDriverService.CreateDefaultService();
        IWebDriver driver = new EdgeDriver(service, options, SessionTimeout);

        driver.Manage().Timeouts().PageLoad = TimeSpan.FromSeconds(90);
        driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(5);

        if (!string.IsNullOrWhiteSpace(url))
        {
            driver.Navigate().GoToUrl(url);
        }

        return driver;
    }

    /// <summary>
    /// Builds EdgeOptions so WebDriver reuses profile cookies / network settings.
    /// Mirrors UTS automation/selenium_session.py network + profile flags.
    /// Prefer <see cref="Create"/> so profile copy + Edge-closed checks run first.
    /// </summary>
    public static EdgeOptions BuildOptions(
        string userDataDir,
        string profileDirectory = "Default",
        string? proxyPacUrl = null)
    {
        var options = new EdgeOptions
        {
            PageLoadStrategy = PageLoadStrategy.Eager
        };

        // Stability / automation flags
        options.AddArgument("--window-size=1280,900");
        options.AddArgument("--disable-gpu");
        options.AddArgument("--no-sandbox");
        options.AddArgument("--disable-dev-shm-usage");
        options.AddArgument("--no-first-run");
        options.AddArgument("--no-default-browser-check");
        options.AddArgument("--remote-allow-origins=*");
        options.AddArgument("--remote-debugging-port=0");

        // Combine features in one flag — a second --disable-features overrides the first.
        // DnsOverHttps: corporate / UAT hosts often fail with fresh Selenium profiles.
        options.AddArgument("--disable-features=TranslateUI,AutomationControlled,DnsOverHttps");
        options.AddArgument("--dns-over-https-mode=off");

        if (!string.IsNullOrWhiteSpace(proxyPacUrl))
        {
            options.AddArgument($"--proxy-pac-url={proxyPacUrl.Trim()}");
        }

        if (!string.IsNullOrWhiteSpace(userDataDir))
        {
            options.AddArgument($"--user-data-dir={userDataDir.Trim()}");
            options.AddArgument($"--profile-directory={profileDirectory.Trim()}");
        }

        options.AddAdditionalOption("excludeSwitches", new[] { "enable-automation", "enable-logging" });
        options.AddAdditionalOption("useAutomationExtension", false);

        return options;
    }

    /// <summary>
    /// Ends or rejects leftover Edge / EdgeDriver processes that lock the profile.
    /// </summary>
    public static void EnsureEdgeClosed(bool killIfRunning = true)
    {
        var names = new[] { "msedge", "msedgedriver" };
        var running = names
            .SelectMany(Process.GetProcessesByName)
            .ToList();

        if (running.Count == 0)
        {
            return;
        }

        var summary = string.Join(", ",
            running.Select(p => $"{p.ProcessName} (pid {p.Id})"));

        if (!killIfRunning)
        {
            foreach (var p in running)
            {
                p.Dispose();
            }

            throw new InvalidOperationException(
                "Edge (or msedgedriver) is still running and locks the profile. " +
                "Close all Edge windows / end msedge.exe in Task Manager, then retry. " +
                $"Found: {summary}");
        }

        Console.WriteLine($"Closing leftover Edge processes: {summary}");
        foreach (var p in running)
        {
            try
            {
                if (!p.HasExited)
                {
                    p.Kill(entireProcessTree: true);
                    p.WaitForExit(10_000);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  Could not kill {p.ProcessName} (pid {p.Id}): {ex.Message}");
            }
            finally
            {
                p.Dispose();
            }
        }

        // Brief pause so Windows releases profile file locks.
        Thread.Sleep(1500);
    }

    /// <summary>
    /// Copies Local State + the chosen profile into a non-default temp folder so
    /// DevTools remote debugging can attach (Edge blocks that on the live default path).
    /// </summary>
    public static string CopyProfileForWebDriver(string sourceUserDataDir, string profileDirectory)
    {
        if (!Directory.Exists(sourceUserDataDir))
        {
            throw new DirectoryNotFoundException(
                $"Edge user data dir not found: {sourceUserDataDir}");
        }

        var sourceProfile = Path.Combine(sourceUserDataDir, profileDirectory);
        if (!Directory.Exists(sourceProfile))
        {
            throw new DirectoryNotFoundException(
                $"Edge profile folder not found: {sourceProfile}");
        }

        var destRoot = Path.Combine(Path.GetTempPath(), "EdgeWdProfile");
        var destProfile = Path.Combine(destRoot, profileDirectory);

        Console.WriteLine($"Copying Edge profile → {destRoot}");
        Console.WriteLine("  (caches skipped; first copy can take a minute…)");

        if (Directory.Exists(destRoot))
        {
            try
            {
                Directory.Delete(destRoot, recursive: true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  Warning: could not clear old copy ({ex.Message}); overwriting…");
            }
        }

        Directory.CreateDirectory(destRoot);

        // Root files Edge needs (especially Local State).
        foreach (var file in Directory.EnumerateFiles(sourceUserDataDir))
        {
            var name = Path.GetFileName(file);
            if (LockFileNames.Contains(name, StringComparer.OrdinalIgnoreCase))
            {
                continue;
            }

            File.Copy(file, Path.Combine(destRoot, name), overwrite: true);
        }

        CopyDirectory(sourceProfile, destProfile);

        // Ensure no lock leftovers in the copy.
        ClearLockFiles(destRoot);
        ClearLockFiles(destProfile);

        return destRoot;
    }

    private static void CopyDirectory(string sourceDir, string destDir)
    {
        Directory.CreateDirectory(destDir);

        foreach (var file in Directory.EnumerateFiles(sourceDir))
        {
            var name = Path.GetFileName(file);
            if (LockFileNames.Contains(name, StringComparer.OrdinalIgnoreCase))
            {
                continue;
            }

            try
            {
                File.Copy(file, Path.Combine(destDir, name), overwrite: true);
            }
            catch (IOException)
            {
                // Locked/in-use files are skipped; cookies / prefs usually copy fine.
            }
        }

        foreach (var dir in Directory.EnumerateDirectories(sourceDir))
        {
            var name = Path.GetFileName(dir);
            if (SkipDirectoryNames.Contains(name, StringComparer.OrdinalIgnoreCase))
            {
                continue;
            }

            CopyDirectory(dir, Path.Combine(destDir, name));
        }
    }

    private static void ClearLockFiles(string directory)
    {
        if (!Directory.Exists(directory))
        {
            return;
        }

        foreach (var name in LockFileNames)
        {
            var path = Path.Combine(directory, name);
            try
            {
                if (File.Exists(path))
                {
                    File.Delete(path);
                }
            }
            catch
            {
                // Best-effort.
            }
        }
    }
}
