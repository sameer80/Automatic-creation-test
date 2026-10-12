# Automate `window.showSaveFilePicker()` Save As Dialog (WebDriver / Selenium)

**Problem:** Application uses the File System Access API:

```js
const handle = await window.showSaveFilePicker({ suggestedName: "export.xlsx" });
const writable = await handle.createWritable();
await writable.write(blob);
await writable.close();
```

This opens a **native OS Save As dialog**. Selenium / WebDriver **cannot** click or type into that dialog because it is outside the browser DOM.

---

## What does NOT work

| Approach | Works? | Why |
|---|---|---|
| `driver.find_element(...)` / click | No | Dialog is OS-level, not DOM |
| `send_keys` to `<input type="file">` | No | Different API; no file input exists |
| CDP `Page.setInterceptFileChooserDialog` | No | Only intercepts `<input type="file">` choosers |
| Waiting for Save As window in browser | No | Not part of the page |

---

## Recommended solution: stub `showSaveFilePicker` before the save action

Inject a fake `window.showSaveFilePicker` so the app never opens the OS dialog. The stub writes data and triggers a normal browser download into a known folder.

### Step 1 – Configure Chrome download folder (no prompt)

```python
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

download_dir = Path(r"D:\downloads\uts-test")
download_dir.mkdir(parents=True, exist_ok=True)

options = Options()
prefs = {
    "download.default_directory": str(download_dir),
    "download.prompt_for_download": False,
    "download.directory_upgrade": True,
    "safebrowsing.enabled": True,
}
options.add_experimental_option("prefs", prefs)
driver = webdriver.Chrome(options=options)

# Optional (Selenium 4 CDP) – reinforce auto-download
driver.execute_cdp_cmd(
    "Page.setDownloadBehavior",
    {"behavior": "allow", "downloadPath": str(download_dir)},
)
```

### Step 2 – Install the stub BEFORE clicking Export / Save

```python
def stub_show_save_file_picker(driver, file_name: str = "export.xlsx") -> None:
    driver.execute_script(
        """
        const fileName = arguments[0];
        window.__saveAsDone = false;
        window.__saveAsError = null;

        window.showSaveFilePicker = async (opts = {}) => {
          const name = (opts && opts.suggestedName) || fileName;
          const chunks = [];

          return {
            name,
            kind: "file",
            async createWritable() {
              return {
                async write(data) {
                  // File System Access write() may receive Blob, buffer, string,
                  // or { type: 'write', data: ... }
                  let payload = data;
                  if (data && typeof data === "object" && "data" in data) {
                    payload = data.data;
                  }
                  if (payload instanceof Blob) {
                    chunks.push(await payload.arrayBuffer());
                  } else if (payload instanceof ArrayBuffer) {
                    chunks.push(payload);
                  } else if (ArrayBuffer.isView(payload)) {
                    chunks.push(payload.buffer.slice(
                      payload.byteOffset,
                      payload.byteOffset + payload.byteLength
                    ));
                  } else if (typeof payload === "string") {
                    chunks.push(new TextEncoder().encode(payload).buffer);
                  } else {
                    throw new Error("Unsupported write payload in stub");
                  }
                },
                async close() {
                  const blob = new Blob(chunks);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = name;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                  window.__saveAsDone = true;
                },
                async abort() {
                  window.__saveAsError = "aborted";
                }
              };
            },
            async getFile() {
              return new File(chunks, name);
            }
          };
        };
        """,
        file_name,
    )
```

### Step 3 – Trigger the app Save flow, then wait for the file

```python
import time

stub_show_save_file_picker(driver, "report.xlsx")

# Click the app button that calls showSaveFilePicker()
# driver.find_element(...).click()

# Wait until stub finished writing
deadline = time.time() + 30
while time.time() < deadline:
    if driver.execute_script("return window.__saveAsDone === true;"):
        break
    time.sleep(0.25)
else:
    raise TimeoutError("showSaveFilePicker stub did not complete")

# Wait for downloaded file on disk
expected = download_dir / "report.xlsx"
deadline = time.time() + 30
while time.time() < deadline:
    if expected.exists() and expected.stat().st_size > 0:
        break
    # Chrome may create *.crdownload while downloading
    time.sleep(0.25)
else:
    raise TimeoutError(f"Download not found: {expected}")

assert expected.exists()
```

---

## When to install the stub

- Install **after** page load / login.
- Install **before** the click that triggers Save As.
- If the app does a full page navigation / SPA remount that resets window APIs, re-install the stub.
- Prefer installing once per page context (same tab / same origin document).

---

## Alternative (not recommended for CI): OS-level automation

If you must exercise the real Windows Save As dialog:

- Tools: `pywinauto`, AutoIt, `pyautogui`
- Flow: click Save in app → find Save As window → type path → press Enter

**Downsides:** focus issues, locale differences, remote desktop, headless CI, flaky timing.

Use only when product owners require end-to-end coverage of the native dialog itself.

---

## Quick checklist for UTS / Selenium scripts

1. Set `download.default_directory` + disable download prompt.
2. Call `stub_show_save_file_picker(driver, file_name)` before Save.
3. Click the app Save / Export control.
4. Assert `window.__saveAsDone` (optional) and file exists under download dir.
5. Do **not** try to locate the native Save As window with Selenium.

---

## Notes

- `showSaveFilePicker` requires a **secure context** (HTTPS or localhost) and a user gesture in real browsers. In automation, the stub bypasses the gesture/dialog path.
- Same pattern works for `showOpenFilePicker` with a different stub that returns a readable `FileSystemFileHandle` / `File`.
- Edge (Chromium) uses the same prefs / CDP approach as Chrome.
