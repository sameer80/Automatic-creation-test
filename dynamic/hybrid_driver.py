"""Hybrid Driver — Keyword-Driven steps + Data-Driven rows (reusable business components)."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from dynamic.data_driver import (
    apply_data_to_step,
    expand_scenario_with_rows,
    is_data_driven_enabled,
    load_drivers_config,
    load_testdata,
    resolve_placeholders,
)
from dynamic.discovery import ScenarioDef, StepDef

ROOT = Path(__file__).resolve().parent.parent
GENERATED_DIR = ROOT / "generated"
KEYWORDS_FILE = GENERATED_DIR / "hybrid-keywords.json"
COMPONENTS_FILE = GENERATED_DIR / "hybrid-components.json"

# Built-in keywords → canonical UI / workflow actions
BUILTIN_KEYWORDS: dict[str, dict[str, Any]] = {
    "OpenApp": {"action": "Navigate", "object": "Application URL", "value_from": "URL"},
    "Navigate": {"action": "Navigate", "object": "URL", "value_from": "URL"},
    "EnterText": {"action": "SetText", "object_from": "Object", "value_from": "Value"},
    "EnterPassword": {"action": "SetPassword", "object_from": "Object", "value_from": "Password"},
    "Click": {"action": "PerformClick", "object_from": "Object"},
    "Select": {"action": "PerformSelect", "object_from": "Object", "value_from": "Value"},
    "Verify": {"action": "Verify", "object_from": "Object", "value_from": "Expected"},
    "VerifyText": {"action": "Verify", "object_from": "Object", "value_from": "Expected"},
    "Login": {
        "component": "BC_Login",
        "description": "Enter username, password and click login",
    },
    "Logout": {"action": "PerformClick", "object": "Logout"},
    "Wait": {"action": "Delay", "value_from": "Seconds"},
    "SetVariable": {"action": "Variable", "object_from": "Name", "value_from": "Value"},
    "GetData": {"action": "GetData", "object_from": "Sheet", "value_from": "Row"},
    "CallComponent": {"action": "CallComponent", "object_from": "Component"},
    "End": {"action": "End"},
}


def is_hybrid_enabled() -> bool:
    return bool(load_drivers_config().get("hybrid_enabled", True))


def load_keyword_catalog() -> dict[str, dict[str, Any]]:
    catalog = dict(BUILTIN_KEYWORDS)
    if KEYWORDS_FILE.is_file():
        try:
            raw = json.loads(KEYWORDS_FILE.read_text(encoding="utf-8-sig"))
            if isinstance(raw, dict):
                catalog.update(raw)
        except Exception:  # noqa: BLE001
            pass
    return catalog


def load_components() -> dict[str, list[dict[str, Any]]]:
    """Business components: name → list of step dicts with {{placeholders}}."""
    defaults = {
        "BC_Login": [
            {
                "action": "SetText",
                "object_name": "Username",
                "input_value": "{{Username}}",
                "expected": "Username entered",
            },
            {
                "action": "SetPassword",
                "object_name": "Password",
                "input_value": "{{Password}}",
                "expected": "Password entered",
            },
            {
                "action": "PerformClick",
                "object_name": "Login",
                "input_value": "",
                "expected": "Login submitted",
            },
        ],
        "BC_NavigateModule": [
            {
                "action": "PerformClick",
                "object_name": "{{Module}}",
                "input_value": "",
                "expected": "Module opened",
            },
        ],
        "BC_FillAndSave": [
            {
                "action": "SetText",
                "object_name": "{{Field}}",
                "input_value": "{{Value}}",
                "expected": "Value entered",
            },
            {
                "action": "PerformClick",
                "object_name": "Save",
                "input_value": "",
                "expected": "Saved",
            },
        ],
    }
    if COMPONENTS_FILE.is_file():
        try:
            raw = json.loads(COMPONENTS_FILE.read_text(encoding="utf-8-sig"))
            if isinstance(raw, dict):
                defaults.update(raw)
        except Exception:  # noqa: BLE001
            pass
    return defaults


def save_keyword_catalog(catalog: dict[str, Any] | None = None) -> Path:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    payload = catalog or load_keyword_catalog()
    KEYWORDS_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return KEYWORDS_FILE


def save_components(components: dict[str, Any] | None = None) -> Path:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    payload = components or load_components()
    COMPONENTS_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return COMPONENTS_FILE


def _normalize_keyword(name: str) -> str:
    return re.sub(r"[\s_\-]+", "", (name or "").strip()).lower()


def resolve_keyword(keyword: str, data: dict[str, Any] | None = None) -> list[StepDef]:
    """Expand one keyword (or component) into concrete StepDef list."""
    data = data or {}
    catalog = load_keyword_catalog()
    components = load_components()

    # Direct component call
    if keyword in components or keyword.startswith("BC_"):
        return _component_to_steps(keyword, components, data)

    # Lookup by exact then normalized name
    entry = catalog.get(keyword)
    if not entry:
        key_norm = _normalize_keyword(keyword)
        for name, meta in catalog.items():
            if _normalize_keyword(name) == key_norm:
                entry = meta
                keyword = name
                break

    if not entry:
        # Treat unknown keyword as PerformClick on that label
        return [
            StepDef(
                step_no=1,
                action="PerformClick",
                object_name=resolve_placeholders(keyword, data),
                input_value="",
                expected=f"Clicked {keyword}",
            )
        ]

    if entry.get("component"):
        return _component_to_steps(str(entry["component"]), components, data)

    action = str(entry.get("action") or "PerformClick")
    object_name = str(entry.get("object") or "")
    input_value = str(entry.get("value") or "")
    expected = str(entry.get("expected") or "")

    if entry.get("object_from"):
        object_name = str(data.get(entry["object_from"], object_name or entry["object_from"]))
    if entry.get("value_from"):
        input_value = str(data.get(entry["value_from"], data.get("Value", input_value)))
    if entry.get("expected_from"):
        expected = str(data.get(entry["expected_from"], expected))

    object_name = resolve_placeholders(object_name, data)
    input_value = resolve_placeholders(input_value, data)
    expected = resolve_placeholders(expected, data)

    return [
        StepDef(
            step_no=1,
            action=action,
            object_name=object_name,
            input_value=input_value,
            expected=expected or f"{action} {object_name}",
        )
    ]


def _component_to_steps(
    name: str,
    components: dict[str, list[dict[str, Any]]],
    data: dict[str, Any],
) -> list[StepDef]:
    raw_steps = components.get(name) or components.get(name.replace("BC_", "")) or []
    steps: list[StepDef] = []
    for index, raw in enumerate(raw_steps, start=1):
        if not isinstance(raw, dict):
            continue
        step = StepDef(
            step_no=index,
            action=str(raw.get("action") or "Verify"),
            object_name=resolve_placeholders(str(raw.get("object_name") or ""), data),
            input_value=resolve_placeholders(str(raw.get("input_value") or ""), data),
            locator_by=str(raw.get("locator_by") or ""),
            locator_value=resolve_placeholders(str(raw.get("locator_value") or ""), data),
            expected=resolve_placeholders(str(raw.get("expected") or ""), data),
        )
        steps.append(step)
    return steps


def keyword_script_to_scenario(
    script: list[dict[str, Any]] | list[str],
    *,
    scenario_id: str = "TC_HYBRID",
    title: str = "Hybrid scenario",
    module: str = "",
    data: dict[str, Any] | None = None,
) -> ScenarioDef:
    """
    Convert a keyword script into one ScenarioDef.

    Script item formats:
      - "Login"
      - {"keyword": "EnterText", "Object": "Username", "Value": "{{Username}}"}
      - {"action": "SetText", "object_name": "Username", "input_value": "{{Username}}"}
    """
    data = data or {}
    steps: list[StepDef] = []
    for item in script:
        if isinstance(item, str):
            steps.extend(resolve_keyword(item, data))
            continue
        if not isinstance(item, dict):
            continue
        if item.get("keyword") or item.get("Keyword"):
            kw = str(item.get("keyword") or item.get("Keyword"))
            merged = {**data, **{k: v for k, v in item.items() if k.lower() not in {"keyword"}}}
            steps.extend(resolve_keyword(kw, merged))
            continue
        # Already a concrete step
        steps.append(
            StepDef(
                step_no=len(steps) + 1,
                action=str(item.get("action") or "Verify"),
                object_name=resolve_placeholders(str(item.get("object_name") or ""), data),
                input_value=resolve_placeholders(str(item.get("input_value") or ""), data),
                locator_by=str(item.get("locator_by") or ""),
                locator_value=str(item.get("locator_value") or ""),
                expected=resolve_placeholders(str(item.get("expected") or ""), data),
            )
        )

    for i, st in enumerate(steps, start=1):
        st.step_no = i

    sc = ScenarioDef(
        id=scenario_id,
        type="hybrid",
        title=title,
        steps=steps,
        module=module,
    )
    sc._driver = "hybrid"  # type: ignore[attr-defined]
    if data:
        sc._data_row = data  # type: ignore[attr-defined]
    return sc


def build_hybrid_scenarios(
    script: list[dict[str, Any]] | list[str],
    *,
    scenario_id: str = "TC_HYBRID",
    title: str = "Hybrid scenario",
    module: str = "",
    data_path: Path | str | None = None,
    sheet: str | None = None,
    rows: list[dict[str, Any]] | None = None,
) -> list[ScenarioDef]:
    """Hybrid = one keyword script × N data rows."""
    if not is_hybrid_enabled():
        return [
            keyword_script_to_scenario(
                script, scenario_id=scenario_id, title=title, module=module
            )
        ]

    data_rows = list(rows) if rows is not None else load_testdata(data_path, sheet)
    if not data_rows:
        return [
            keyword_script_to_scenario(
                script, scenario_id=scenario_id, title=title, module=module
            )
        ]

    # Build template with unresolved placeholders, then expand per row
    template = keyword_script_to_scenario(
        script, scenario_id=scenario_id, title=title, module=module, data={}
    )
    # Keep placeholders in steps for expand_scenario_with_rows
    # Re-build without resolving from empty data — keyword_script already resolved empty.
    # Better: expand by re-resolving script per row
    out: list[ScenarioDef] = []
    for idx, row in enumerate(data_rows, start=1):
        label = str(row.get("TestCase") or row.get("Name") or idx)
        sc = keyword_script_to_scenario(
            script,
            scenario_id=f"{scenario_id}_D{idx}",
            title=f"{title} [Data {idx}: {label}]",
            module=module,
            data=row,
        )
        sc.type = "automation"
        sc._driver = "hybrid"  # type: ignore[attr-defined]
        out.append(sc)
    return out


def expand_test_case_hybrid(
    steps: list[dict[str, Any]],
    *,
    scenario_id: str,
    title: str,
    module: str = "",
    data_rows: list[dict[str, Any]] | None = None,
    data_path: Path | str | None = None,
    sheet: str | None = None,
) -> list[ScenarioDef]:
    """
    Hybrid expansion for stored test cases.

    Steps may mix:
      - concrete actions (SetText / PerformClick)
      - keyword / component names in action field (Login, BC_Login, EnterText)
    """
    script: list[dict[str, Any]] = []
    for st in steps:
        if not isinstance(st, dict):
            continue
        action = str(st.get("action") or "").strip()
        catalog = load_keyword_catalog()
        components = load_components()
        is_kw = (
            action in catalog
            or action in components
            or action.startswith("BC_")
            or _normalize_keyword(action) in {_normalize_keyword(k) for k in catalog}
        )
        if is_kw and action.lower() not in {
            "navigate",
            "settext",
            "setpassword",
            "performclick",
            "click",
            "performselect",
            "verify",
        }:
            script.append(
                {
                    "keyword": action,
                    "Object": st.get("object_name") or "",
                    "Value": st.get("input_value") or "",
                    "Expected": st.get("expected") or "",
                    "Password": st.get("input_value") or "",
                }
            )
        else:
            script.append(st)

    return build_hybrid_scenarios(
        script,
        scenario_id=scenario_id,
        title=title,
        module=module,
        data_path=data_path,
        sheet=sheet,
        rows=data_rows,
    )


def ensure_hybrid_artifacts() -> dict[str, Path]:
    """Write default keyword catalog + components + sample TestData if missing."""
    from dynamic.data_driver import write_sample_testdata, DEFAULT_TESTDATA

    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    paths = {
        "keywords": save_keyword_catalog(),
        "components": save_components(),
    }
    if not DEFAULT_TESTDATA.is_file():
        paths["testdata"] = write_sample_testdata()
    else:
        paths["testdata"] = DEFAULT_TESTDATA
    return paths
