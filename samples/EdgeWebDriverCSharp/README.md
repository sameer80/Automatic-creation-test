# Edge WebDriver (C#) — open URL with the same Edge profile

Hand-off sample for the C# Selenium team.

Opens **Microsoft Edge** with cookies / SSO / corporate proxy / certificates from
the user's local profile. By default it **copies** that profile to
`%TEMP%\EdgeWdProfile` (a non-default path) so DevTools remote debugging can
attach — using the live default User Data path often hangs `/session` for 60s+.

---

## Why use a real profile?

A fresh Selenium profile often enables Secure DNS and ignores corporate PAC /
proxy settings. Internal UAT hostnames then fail with `ERR_NAME_NOT_RESOLVED`
even though the same URL opens when Edge is started manually.

Pointing WebDriver at a **copy** of the real profile inherits working network
settings without locking the interactive browser.

---

## Prerequisites

1. .NET 8 SDK  
2. Microsoft Edge installed  
3. Edge can be open when you start; the helper kills leftover `msedge` /
   `msedgedriver` by default (`killEdgeIfRunning: true`).

---

## NuGet

```xml
<PackageReference Include="Selenium.WebDriver" Version="4.27.0" />
```

Selenium 4.6+ includes **Selenium Manager** — it downloads a matching `msedgedriver` automatically. No manual driver path needed.

---

## How to find your profile path

1. Open Edge manually.  
2. Go to `edge://version`.  
3. Copy **Profile path**, e.g.  
   `C:\Users\sameer.shaikh\AppData\Local\Microsoft\Edge\User Data\Default`  
4. Split it:
   - **user-data-dir** = `...\Edge\User Data`  
   - **profile-directory** = `Default` (or `Profile 1`, etc.)

---

## Run this sample

```powershell
cd samples\EdgeWebDriverCSharp
dotnet restore
dotnet run
```

On start you should see:

1. Optional kill of leftover `msedge` / `msedgedriver`  
2. Profile copy → `%TEMP%\EdgeWdProfile` (caches skipped)  
3. Session create with a **180s** command timeout  
4. Navigation to `TargetUrl`

Edit `Program.cs` constants:

| Constant            | Purpose                                      |
|---------------------|----------------------------------------------|
| `TargetUrl`         | URL to open                                  |
| `UserDataDir`       | Source Edge User Data folder                 |
| `ProfileDirectory`  | `Default` / `Profile 1` / …                  |
| `ProxyPacUrl`       | Optional PAC from `edge://net-internals/#proxy` |

---

## Minimal code (copy into your framework)

```csharp
using var driver = EdgeDriverHelper.Create(
    url: "https://your-uat-url.example.com/",
    profileDirectory: "Default",
    copyProfile: true,          // required for reliable DevTools attach
    killEdgeIfRunning: true);   // or false to throw if Edge is open
```

`Create` will:

- close leftover Edge processes (or throw if `killEdgeIfRunning: false`)
- copy Local State + profile into `%TEMP%\EdgeWdProfile`
- strip profile lock files from the copy
- start `EdgeDriver` with a 180s session timeout

---

## Important notes for the team

1. Prefer **`copyProfile: true`** — live default User Data often logs  
   *DevTools remote debugging requires a non-default data directory* and then  
   times out on `http://localhost:<port>/session`.  
2. Do **not** run headless with a real interactive SSO profile unless you have validated it.  
3. The temp copy still contains cookies — treat the machine as sensitive; delete `%TEMP%\EdgeWdProfile` when done if needed.  
4. For CI / shared agents, copy the profile once to a dedicated folder and set `userDataDir` to that folder with `copyProfile: false`.  
5. Same flags exist in UTS Python: `automation/selenium_session.py` + `config/selenium.json` (`user_data_dir`, `profile_directory`).

---

## Equivalent UTS Python config

```json
{
  "browser": "edge",
  "user_data_dir": "C:\\Users\\<username>\\AppData\\Local\\Microsoft\\Edge\\User Data",
  "profile_directory": "Default",
  "disable_secure_dns": true,
  "proxy_pac_url": ""
}
```
