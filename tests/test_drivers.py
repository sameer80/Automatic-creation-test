"""Unit tests for Data-Driven and Hybrid drivers."""

from __future__ import annotations

from dynamic.data_driver import (
    apply_data_to_step,
    expand_scenario_with_rows,
    resolve_placeholders,
    write_sample_testdata,
)
from dynamic.discovery import ScenarioDef, StepDef
from dynamic.hybrid_driver import (
    build_hybrid_scenarios,
    keyword_script_to_scenario,
    resolve_keyword,
)


def test_resolve_placeholders():
    assert resolve_placeholders("Hello {{Name}}", {"Name": "Sameer"}) == "Hello Sameer"
    assert resolve_placeholders("User {Username}", {"Username": "Admin"}) == "User Admin"
    assert resolve_placeholders("{{Missing}}", {}) == "{{Missing}}"


def test_expand_data_driven(tmp_path):
    sc = ScenarioDef(
        id="TC_LOGIN",
        type="data_driven",
        title="Login",
        steps=[
            StepDef(1, "SetText", "Username", "{{Username}}"),
            StepDef(2, "SetPassword", "Password", "{{Password}}"),
        ],
        module="Login",
    )
    rows = [
        {"Username": "Admin", "Password": "a1", "TestCase": "Valid"},
        {"Username": "Bad", "Password": "x", "TestCase": "Invalid"},
    ]
    expanded = expand_scenario_with_rows(sc, rows)
    assert len(expanded) == 2
    assert expanded[0].id == "TC_LOGIN_D1"
    assert expanded[0].steps[0].input_value == "Admin"
    assert expanded[1].steps[1].input_value == "x"


def test_hybrid_login_component():
    steps = resolve_keyword("Login", {"Username": "Admin", "Password": "secret"})
    assert len(steps) == 3
    assert steps[0].action == "SetText"
    assert steps[0].input_value == "Admin"
    assert steps[1].action == "SetPassword"
    assert steps[2].action == "PerformClick"


def test_hybrid_build_with_rows():
    script = ["Login", {"keyword": "Verify", "Object": "Dashboard", "Expected": "{{Expected}}"}]
    rows = [
        {"Username": "A", "Password": "1", "Expected": "OK", "TestCase": "T1"},
        {"Username": "B", "Password": "2", "Expected": "Fail", "TestCase": "T2"},
    ]
    scenarios = build_hybrid_scenarios(script, scenario_id="TC_H", title="Hybrid login", rows=rows)
    assert len(scenarios) == 2
    assert "Admin" not in scenarios[0].steps[0].input_value or scenarios[0].steps[0].input_value == "A"
    assert scenarios[0].steps[0].input_value == "A"
    assert any("OK" in (st.input_value or st.expected or "") for st in scenarios[0].steps)


def test_sample_testdata(tmp_path):
    path = write_sample_testdata(tmp_path / "TestData.xlsx")
    assert path.is_file()
    from dynamic.data_driver import load_testdata

    rows = load_testdata(path, "Login")
    assert len(rows) >= 2
    assert "Username" in rows[0]
