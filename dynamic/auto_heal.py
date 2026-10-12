"""Auto-heal: recover broken locators at runtime and persist working ones."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from automation.selenium_session import get_driver, load_selenium_config
from dynamic.discovery import StepDef

ROOT = Path(__file__).resolve().parent.parent
GENERATED_DIR = ROOT / "generated"
OBJECT_REPO_FILE = GENERATED_DIR / "object-repository.json"
HEAL_LOG_FILE = GENERATED_DIR / "auto-heal-log.json"

BY_MAP = {
    "id": By.ID,
    "name": By.NAME,
    "css": By.CSS_SELECTOR,
    "xpath": By.XPATH,
    "class": By.CLASS_NAME,
}


@dataclass
class HealResult:
    by: str
    value: str
    strategy: str
    healed: bool = False
    previous_by: str = ""
    previous_value: str = ""


@dataclass
class AutoHealState:
    heals: list[dict[str, Any]] = field(default_factory=list)

    def record(self, entry: dict[str, Any]) -> None:
        self.heals.append(entry)


_STATE = AutoHealState()


def reset_auto_heal_state() -> None:
    _STATE.heals.clear()


def auto_heal_summary() -> list[dict[str, Any]]:
    return list(_STATE.heals)


def is_auto_heal_enabled() -> bool:
    cfg = load_selenium_config()
    if "auto_heal_enabled" in cfg:
        return bool(cfg.get("auto_heal_enabled"))
    nested = cfg.get("auto_heal") or {}
    return bool(nested.get("enabled", True))


def should_persist_heals() -> bool:
    cfg = load_selenium_config()
    if "auto_heal_persist" in cfg:
        return bool(cfg.get("auto_heal_persist"))
    nested = cfg.get("auto_heal") or {}
    return bool(nested.get("persist_healed_locators", True))


def _normalize_name(name: str) -> str:
    text = (name or "").strip().lower()
    text = re.sub(r"^(el_|nav_|field_|btn_)", "", text)
    text = re.sub(r"[^a-z0-9]+", "", text)
    return text


def _text_candidates(label: str) -> list[str]:
    text = (label or "").strip()
    if not text:
        return []
    parts = [p for p in text.split() if p]
    out = [text]
    if len(parts) >= 2:
        out.append(parts[0])
        out.append(" ".join(parts[:2]))
    seen: set[str] = set()
    uniq: list[str] = []
    for item in out:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            uniq.append(item)
    return uniq


def load_object_repository() -> list[dict[str, Any]]:
    if not OBJECT_REPO_FILE.is_file():
        return []
    try:
        data = json.loads(OBJECT_REPO_FILE.read_text(encoding="utf-8-sig"))
    except Exception:  # noqa: BLE001
        return []
    return data if isinstance(data, list) else []


def _repo_matches(object_name: str, entry: dict[str, Any]) -> bool:
    obj_key = _normalize_name(object_name)
    if not obj_key:
        return False
    name_key = _normalize_name(str(entry.get("name") or ""))
    if not name_key:
        return False
    return obj_key == name_key or obj_key in name_key or name_key in obj_key


def _repo_locators(object_name: str, repo: list[dict[str, Any]]) -> list[tuple[str, str, str]]:
    """Return (by, value, label) candidates from object repository."""
    out: list[tuple[str, str, str]] = []
    for entry in repo:
        if not _repo_matches(object_name, entry):
            continue
        by = str(entry.get("locator_by") or entry.get("by") or "").strip()
        value = str(entry.get("locator_value") or entry.get("value") or "").strip()
        if by and value:
            out.append((by, value, "repository"))
        for alt in entry.get("alternate_locators") or []:
            if not isinstance(alt, dict):
                continue
            ab = str(alt.get("by") or "").strip()
            av = str(alt.get("value") or "").strip()
            if ab and av:
                out.append((ab, av, "repository_alt"))
    return out


def _visible(el) -> bool:
    try:
        return el is not None and el.is_displayed()
    except Exception:  # noqa: BLE001
        return False


def _try_locator(by_name: str, value: str, timeout: int = 8):
    driver = get_driver()
    by = BY_MAP.get((by_name or "").lower(), By.ID)
    try:
        el = WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )
        if _visible(el):
            return el
    except Exception:  # noqa: BLE001
        pass
    try:
        matches = [e for e in driver.find_elements(by, value) if _visible(e)]
        if matches:
            return matches[0]
        matches = driver.find_elements(by, value)
        if matches:
            return matches[0]
    except Exception:  # noqa: BLE001
        pass
    if (by_name or "").lower() == "id" and value:
        try:
            el = driver.find_element(By.CSS_SELECTOR, f"[id*='{value}']")
            if _visible(el):
                return el
        except Exception:  # noqa: BLE001
            pass
    return None


def _heal_by_text(object_name: str):
    driver = get_driver()
    for label in _text_candidates(object_name):
        safe = label.replace("'", "")
        xpaths = [
            f"//a[contains(normalize-space(.),'{safe}')]",
            f"//button[contains(normalize-space(.),'{safe}')]",
            f"//*[@role='link' or @role='menuitem' or @role='button'][contains(normalize-space(.),'{safe}')]",
            f"//label[contains(normalize-space(.),'{safe}')]/following::*[self::input or self::textarea][1]",
            f"//nav//*[contains(normalize-space(.),'{safe}')]",
            f"//header//*[contains(normalize-space(.),'{safe}')]",
        ]
        for xp in xpaths:
            try:
                matches = [e for e in driver.find_elements(By.XPATH, xp) if _visible(e)]
                if matches:
                    return matches[0], "text_xpath", xp
            except Exception:  # noqa: BLE001
                continue
        try:
            el = driver.find_element(By.PARTIAL_LINK_TEXT, label)
            if el:
                return el, "partial_link", label
        except Exception:  # noqa: BLE001
            pass
    return None, "", ""


def _heal_by_attributes(object_name: str, step: StepDef):
    driver = get_driver()
    obj = (object_name or "").strip().lower()
    tokens = [t for t in re.split(r"[^a-z0-9]+", obj) if len(t) > 2]
    if not tokens:
        return None, "", ""

    # Most specific first: match the object's own name/id/placeholder tokens
    # before falling back to generic input-type heuristics. Otherwise a broad
    # rule like "any email input" can steal the match away from the real
    # 'Username' field just because the word "user" appears in its name.
    selectors: list[str] = []
    for token in tokens[:3]:
        selectors.extend(
            [
                f"input[name*='{token}' i]",
                f"input[id*='{token}' i]",
                f"input[placeholder*='{token}' i]",
                f"textarea[placeholder*='{token}' i]",
                f"*[aria-label*='{token}' i]",
                f"//label[contains(normalize-space(.),'{token}')]/following::*[self::input or self::textarea][1]",
            ]
        )

    if any(h in obj for h in ("password", "pwd")):
        selectors.append("input[type='password']")
    if any(h in obj for h in ("user", "login")):
        selectors.extend(
            [
                "input[type='text'][name*='user' i]",
                "input[type='text'][id*='user' i]",
                "input[type='text'][name*='login' i]",
            ]
        )
    if "email" in obj:
        selectors.append("input[type='email']")

    if step.action.lower() in {"performclick", "click"}:
        for token in tokens[:2]:
            selectors.append(f"//button[contains(normalize-space(.),'{token}')]")
            selectors.append(f"//a[contains(normalize-space(.),'{token}')]")

    for sel in selectors:
        try:
            if sel.startswith("//") or sel.startswith(".//"):
                matches = [e for e in driver.find_elements(By.XPATH, sel) if _visible(e)]
            else:
                matches = [e for e in driver.find_elements(By.CSS_SELECTOR, sel) if _visible(e)]
            if matches:
                return matches[0], "attribute", sel
        except Exception:  # noqa: BLE001
            continue
    return None, "", ""


def _element_locator(el) -> tuple[str, str]:
    """Best-effort locator for a live element (for persistence)."""
    try:
        el_id = el.get_attribute("id") or ""
        if el_id:
            return "id", el_id
    except Exception:  # noqa: BLE001
        pass
    try:
        name = el.get_attribute("name") or ""
        if name:
            return "name", name
    except Exception:  # noqa: BLE001
        pass
    try:
        aria = el.get_attribute("aria-label") or ""
        if aria:
            safe = aria.replace("'", "")
            return "xpath", f"//*[@aria-label='{safe}']"
    except Exception:  # noqa: BLE001
        pass
    return "xpath", ""


def find_element_with_auto_heal(
    step: StepDef,
    locators: dict[str, dict[str, str]],
    timeout: int = 12,
    logger=None,
):
    """
    Find element using primary locator, repository alternates, then auto-heal strategies.
    Returns (element, HealResult | None).
    """
    repo = load_object_repository() if is_auto_heal_enabled() else []
    previous_by = step.locator_by or ""
    previous_value = step.locator_value or ""

    attempts: list[tuple[str, str, str]] = []
    if step.locator_by and step.locator_value:
        attempts.append((step.locator_by, step.locator_value, "primary"))
    attempts.extend(_repo_locators(step.object_name, repo))

    seen: set[tuple[str, str]] = set()
    for by, value, label in attempts:
        key = (by.lower(), value)
        if key in seen:
            continue
        seen.add(key)
        el = _try_locator(by, value, timeout=timeout)
        if el is not None:
            healed = label != "primary"
            if healed and is_auto_heal_enabled():
                result = HealResult(
                    by=by,
                    value=value,
                    strategy=label,
                    healed=True,
                    previous_by=previous_by,
                    previous_value=previous_value,
                )
                _apply_heal(step, result, locators, logger)
                return el, result
            return el, None

    # Legacy fallbacks from shared locator map
    for loc in locators.values():
        if not isinstance(loc, dict):
            continue
        by = str(loc.get("by") or "")
        value = str(loc.get("value") or "")
        key = (by.lower(), value)
        if not by or not value or key in seen:
            continue
        seen.add(key)
        el = _try_locator(by, value, timeout=min(timeout, 6))
        if el is not None and is_auto_heal_enabled():
            result = HealResult(by=by, value=value, strategy="shared_locator", healed=True,
                                previous_by=previous_by, previous_value=previous_value)
            _apply_heal(step, result, locators, logger)
            return el, result
        if el is not None:
            return el, None

    if not is_auto_heal_enabled():
        return None, None

    el, strategy, meta = _heal_by_text(step.object_name)
    if el is not None:
        by, value = _element_locator(el)
        if not value and meta:
            by, value = "xpath", meta
        result = HealResult(by=by, value=value, strategy=strategy or "text", healed=True,
                            previous_by=previous_by, previous_value=previous_value)
        _apply_heal(step, result, locators, logger)
        return el, result

    el, strategy, meta = _heal_by_attributes(step.object_name, step)
    if el is not None:
        by, value = _element_locator(el)
        if not value and meta:
            by, value = "css" if not meta.startswith("//") else "xpath", meta
        result = HealResult(by=by, value=value, strategy=strategy or "attribute", healed=True,
                            previous_by=previous_by, previous_value=previous_value)
        _apply_heal(step, result, locators, logger)
        return el, result

    return None, None


def _apply_heal(
    step: StepDef,
    result: HealResult,
    locators: dict[str, dict[str, str]],
    logger=None,
) -> None:
    if not result.healed or not result.value:
        return

    step.locator_by = result.by
    step.locator_value = result.value

    from automation.selenium_step_overlay import register_step_locator

    register_step_locator(step.object_name, result.by, result.value)

    entry = {
        "at": datetime.utcnow().isoformat(timespec="seconds"),
        "object": step.object_name,
        "action": step.action,
        "strategy": result.strategy,
        "previous": {"by": result.previous_by, "value": result.previous_value},
        "healed": {"by": result.by, "value": result.value},
    }
    _STATE.heals.append(entry)

    msg = (
        f"AUTO-HEAL '{step.object_name}': {result.previous_by}={result.previous_value} "
        f"→ {result.by}={result.value} ({result.strategy})"
    )
    if logger:
        logger.info(msg)

    if should_persist_heals():
        _persist_object_repo_heal(step.object_name, result)
        _append_heal_log(entry)


def _persist_object_repo_heal(object_name: str, result: HealResult) -> None:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    repo = load_object_repository()
    target = None
    for entry in repo:
        if _repo_matches(object_name, entry):
            target = entry
            break
    if target is None:
        target = {
            "name": object_name,
            "concept": "object",
            "locator_by": result.by,
            "locator_value": result.value,
            "page": "shared",
            "module": "",
            "stable_score": 70,
            "alternate_locators": [],
        }
        repo.append(target)
    else:
        old_by = str(target.get("locator_by") or "")
        old_val = str(target.get("locator_value") or "")
        if old_by and old_val and (old_by != result.by or old_val != result.value):
            alts = list(target.get("alternate_locators") or [])
            alts.append({"by": old_by, "value": old_val, "source": "auto_heal"})
            target["alternate_locators"] = alts[-8:]
        target["locator_by"] = result.by
        target["locator_value"] = result.value
        target["stable_score"] = max(int(target.get("stable_score") or 0), 70)
        target["last_healed_at"] = datetime.utcnow().isoformat(timespec="seconds")

    OBJECT_REPO_FILE.write_text(json.dumps(repo, indent=2, ensure_ascii=False), encoding="utf-8")


def _append_heal_log(entry: dict[str, Any]) -> None:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    rows: list[dict[str, Any]] = []
    if HEAL_LOG_FILE.is_file():
        try:
            rows = json.loads(HEAL_LOG_FILE.read_text(encoding="utf-8-sig"))
        except Exception:  # noqa: BLE001
            rows = []
    if not isinstance(rows, list):
        rows = []
    rows.append(entry)
    HEAL_LOG_FILE.write_text(json.dumps(rows[-500:], indent=2, ensure_ascii=False), encoding="utf-8")
