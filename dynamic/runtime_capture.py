"""Capture visible fields and buttons at runtime during automation execution."""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from automation.selenium_session import get_driver, load_selenium_config
from dynamic.discovery import (
    _attr,
    _best_locator,
    _find_action_buttons,
    _find_form_fields,
    _label_for,
)
from dynamic.page_intelligence import analyze_current_page

ROOT = Path(__file__).resolve().parent.parent
GENERATED_DIR = ROOT / "generated"
CAPTURE_LOG_FILE = GENERATED_DIR / "runtime-capture-log.json"
PAGE_MAP_FILE = GENERATED_DIR / "page-map.json"
OBJECT_REPO_FILE = GENERATED_DIR / "object-repository.json"


class _CaptureState:
    def __init__(self) -> None:
        self.captures: list[dict[str, Any]] = []
        self.seen_urls: set[str] = set()

    def reset(self) -> None:
        self.captures.clear()
        self.seen_urls.clear()


_STATE = _CaptureState()


def reset_runtime_capture_state() -> None:
    _STATE.reset()


def runtime_capture_summary() -> list[dict[str, Any]]:
    return list(_STATE.captures)


def is_runtime_capture_enabled() -> bool:
    cfg = load_selenium_config()
    if "runtime_capture_enabled" in cfg:
        return bool(cfg.get("runtime_capture_enabled"))
    nested = cfg.get("runtime_capture") or {}
    return bool(nested.get("enabled", True))


def should_persist_runtime_capture() -> bool:
    cfg = load_selenium_config()
    if "runtime_capture_persist" in cfg:
        return bool(cfg.get("runtime_capture_persist"))
    nested = cfg.get("runtime_capture") or {}
    return bool(nested.get("persist", True))


def capture_on_navigation() -> bool:
    cfg = load_selenium_config()
    if "runtime_capture_on_navigation" in cfg:
        return bool(cfg.get("runtime_capture_on_navigation"))
    nested = cfg.get("runtime_capture") or {}
    return bool(nested.get("on_navigation", True))


def capture_after_click() -> bool:
    cfg = load_selenium_config()
    if "runtime_capture_after_click" in cfg:
        return bool(cfg.get("runtime_capture_after_click"))
    nested = cfg.get("runtime_capture") or {}
    return bool(nested.get("after_click", True))


def _slug(value: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "-" for ch in (value or "page")).strip("-") or "page"


def _repo_key(label: str, kind: str = "field") -> str:
    safe = re.sub(r"[^a-zA-Z0-9_]", "_", (label or kind).strip())[:40]
    return f"rt_{kind}_{safe}".lower()


def capture_current_page(
    driver=None,
    *,
    module: str = "",
    sub_page: str = "",
    trigger: str = "step",
    force: bool = False,
) -> dict[str, Any] | None:
    """Scan the live browser page and return captured fields/buttons with locators."""
    if not is_runtime_capture_enabled():
        return None

    driver = driver or get_driver()
    url = (driver.current_url or "").strip()
    if not url or url.startswith("data:"):
        return None

    url_key = url.split("#", 1)[0].rstrip("/")
    if not force and url_key in _STATE.seen_urls:
        return None

    module_name = (module or driver.title or "Runtime").strip() or "Runtime"
    sub = (sub_page or "").strip()
    profile = analyze_current_page(driver, module_name, sub)

    locators: dict[str, dict[str, str]] = {}
    fields_out: list[dict[str, Any]] = []
    for label, tag, el in _find_form_fields(driver, limit=25):
        _, by, value = _best_locator(el)
        key = _repo_key(label, "field")
        locators[key] = {"by": by, "value": value}
        fields_out.append(
            {
                "label": label,
                "type": _attr(el, "type") or tag,
                "tag": tag,
                "locator_by": by,
                "locator_value": value,
                "repository_key": key,
            }
        )

    buttons_out: list[dict[str, Any]] = []
    for label, el in _find_action_buttons(driver, limit=20):
        _, by, value = _best_locator(el)
        key = _repo_key(label, "btn")
        locators[key] = {"by": by, "value": value}
        buttons_out.append(
            {
                "label": label,
                "action": "PerformClick",
                "locator_by": by,
                "locator_value": value,
                "repository_key": key,
            }
        )

    # Password fields (often skipped by _find_form_fields)
    from selenium.webdriver.common.by import By

    from dynamic.discovery import _visible

    for el in _visible(driver.find_elements(By.CSS_SELECTOR, "input[type='password']"))[:3]:
        label = _label_for(el)
        _, by, value = _best_locator(el)
        key = _repo_key(label, "pwd")
        if key in locators:
            continue
        locators[key] = {"by": by, "value": value}
        fields_out.append(
            {
                "label": label,
                "type": "password",
                "tag": "input",
                "locator_by": by,
                "locator_value": value,
                "repository_key": key,
            }
        )

    capture = {
        "captured_at": datetime.now().isoformat(timespec="seconds"),
        "trigger": trigger,
        "url": url,
        "title": driver.title or "",
        "module": module_name,
        "sub_page": sub or profile.get("sub_page") or "(runtime)",
        "path": profile.get("path") or (module_name if not sub else f"{module_name} > {sub}"),
        "page_type": profile.get("page_type") or "runtime",
        "summary": profile.get("summary") or f"Runtime capture: {len(fields_out)} field(s), {len(buttons_out)} button(s)",
        "understood": True,
        "field_count": len(fields_out),
        "button_count": len(buttons_out),
        "fields": fields_out,
        "buttons": buttons_out,
        "locators": locators,
    }

    _STATE.seen_urls.add(url_key)
    _STATE.captures.append(capture)

    if should_persist_runtime_capture():
        _merge_capture_into_files(capture)

    return capture


def maybe_capture_after_step(action: str, module: str = "", sub_page: str = "") -> dict[str, Any] | None:
    """Capture page fields when configured triggers fire (navigate / click)."""
    if not is_runtime_capture_enabled():
        return None
    action = (action or "").lower()
    if action == "navigate" and capture_on_navigation():
        return capture_current_page(module=module, sub_page=sub_page, trigger="navigate")
    if action in {"performclick", "click"} and capture_after_click():
        return capture_current_page(module=module, sub_page=sub_page, trigger="click")
    return None


def _merge_capture_into_files(capture: dict[str, Any]) -> None:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)

    log: list[dict[str, Any]] = []
    if CAPTURE_LOG_FILE.is_file():
        try:
            raw = json.loads(CAPTURE_LOG_FILE.read_text(encoding="utf-8-sig"))
            log = raw if isinstance(raw, list) else list(raw.get("captures") or [])
        except Exception:  # noqa: BLE001
            log = []
    log.append(capture)
    CAPTURE_LOG_FILE.write_text(json.dumps(log[-200:], indent=2, ensure_ascii=False), encoding="utf-8")

    page_map: dict[str, Any] = {}
    if PAGE_MAP_FILE.is_file():
        try:
            page_map = json.loads(PAGE_MAP_FILE.read_text(encoding="utf-8-sig"))
        except Exception:  # noqa: BLE001
            page_map = {}

    pages = list(page_map.get("pages") or [])
    path = str(capture.get("path") or capture.get("url") or "")
    url = str(capture.get("url") or "")
    replaced = False
    for index, page in enumerate(pages):
        if str(page.get("url") or "").split("#")[0].rstrip("/") == url.split("#")[0].rstrip("/"):
            pages[index] = {**page, **capture, "runtime": True}
            replaced = True
            break
        if str(page.get("path") or "") == path:
            pages[index] = {**page, **capture, "runtime": True}
            replaced = True
            break
    if not replaced:
        pages.append({**capture, "runtime": True})

    page_map["pages"] = pages
    page_map["total_pages"] = len(pages)
    page_map["runtime_captures"] = sum(1 for p in pages if p.get("runtime"))
    page_map["generated_at"] = datetime.now().isoformat(timespec="seconds")
    PAGE_MAP_FILE.write_text(json.dumps(page_map, indent=2, ensure_ascii=False), encoding="utf-8")

    repo: list[dict[str, Any]] = []
    if OBJECT_REPO_FILE.is_file():
        try:
            raw = json.loads(OBJECT_REPO_FILE.read_text(encoding="utf-8-sig"))
            repo = raw if isinstance(raw, list) else []
        except Exception:  # noqa: BLE001
            repo = []

    by_key = {str(item.get("key") or item.get("name") or ""): item for item in repo if isinstance(item, dict)}
    for field in capture.get("fields") or []:
        key = str(field.get("repository_key") or _repo_key(str(field.get("label") or "field"), "field"))
        by_key[key] = {
            "key": key,
            "name": str(field.get("label") or key),
            "object_type": str(field.get("type") or "field"),
            "module": capture.get("module") or "Runtime",
            "page": capture.get("path") or "",
            "locator_by": field.get("locator_by") or "",
            "locator_value": field.get("locator_value") or "",
            "source": "runtime_capture",
            "captured_at": capture.get("captured_at"),
        }
    for button in capture.get("buttons") or []:
        key = str(button.get("repository_key") or _repo_key(str(button.get("label") or "button"), "btn"))
        by_key[key] = {
            "key": key,
            "name": str(button.get("label") or key),
            "object_type": "button",
            "module": capture.get("module") or "Runtime",
            "page": capture.get("path") or "",
            "locator_by": button.get("locator_by") or "",
            "locator_value": button.get("locator_value") or "",
            "source": "runtime_capture",
            "captured_at": capture.get("captured_at"),
        }

    OBJECT_REPO_FILE.write_text(
        json.dumps(list(by_key.values()), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
