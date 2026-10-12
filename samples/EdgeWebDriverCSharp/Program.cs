using OpenQA.Selenium;

namespace EdgeWebDriverCSharp;

/// <summary>
/// Opens Microsoft Edge with cookies / SSO / proxy from the local user profile
/// (via a temp copy so WebDriver can attach DevTools).
///
/// Hand-off for the C# / Selenium team.
/// </summary>
internal static class Program
{
    // -------------------------------------------------------------------------
    // CONFIG — change these for your machine / environment
    // -------------------------------------------------------------------------

    /// <summary>URL to open after Edge starts.</summary>
    private const string TargetUrl =
        "https://uat-svb.uat.rosa-uat-de-aws-west1.zurich.com/applications/svb";

    /// <summary>
    /// Edge "User Data" folder (parent of Default / Profile 1 / …).
    /// Typical path:
    ///   C:\Users\&lt;username&gt;\AppData\Local\Microsoft\Edge\User Data
    /// Leave empty to use a fresh temporary profile instead.
    /// </summary>
    private static readonly string UserDataDir =
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Microsoft", "Edge", "User Data");

    /// <summary>
    /// Profile folder name inside User Data.
    /// Check edge://version → "Profile path" (last folder name).
    /// Usually "Default", sometimes "Profile 1", "Profile 2", …
    /// </summary>
    private const string ProfileDirectory = "Default";

    /// <summary>
    /// Optional corporate PAC URL (from edge://net-internals/#proxy on a working browser).
    /// Leave empty if the real profile already has proxy settings.
    /// </summary>
    private const string ProxyPacUrl = "";

    // -------------------------------------------------------------------------

    private static void Main()
    {
        Console.WriteLine("=== Edge WebDriver – open URL with real user profile ===");
        Console.WriteLine($"Source user data : {UserDataDir}");
        Console.WriteLine($"Profile          : {ProfileDirectory}");
        Console.WriteLine($"Target URL       : {TargetUrl}");
        Console.WriteLine($"Session timeout  : {EdgeDriverHelper.SessionTimeout.TotalSeconds:0}s");
        Console.WriteLine();
        Console.WriteLine("This sample copies the profile to %TEMP%\\EdgeWdProfile (non-default path),");
        Console.WriteLine("kills leftover msedge/msedgedriver if needed, then starts WebDriver.");
        Console.WriteLine();

        // Selenium 4.6+ Selenium Manager finds / downloads matching msedgedriver automatically.
        using IWebDriver driver = EdgeDriverHelper.Create(
            url: null,
            userDataDir: UserDataDir,
            profileDirectory: ProfileDirectory,
            proxyPacUrl: string.IsNullOrWhiteSpace(ProxyPacUrl) ? null : ProxyPacUrl,
            copyProfile: true,
            killEdgeIfRunning: true);

        try
        {
            driver.Manage().Window.Maximize();
            driver.Navigate().GoToUrl(TargetUrl);

            Console.WriteLine($"Opened: {driver.Url}");
            Console.WriteLine($"Title : {driver.Title}");
            Console.WriteLine();
            Console.WriteLine("Press Enter to quit and close the browser…");
            Console.ReadLine();
        }
        finally
        {
            driver.Quit();
        }
    }
}
