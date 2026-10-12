"""Tests for auto-heal name matching and config."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from dynamic.auto_heal import (
    _heal_by_attributes,
    _normalize_name,
    _repo_locators,
    _repo_matches,
    is_auto_heal_enabled,
    should_persist_heals,
)
from dynamic.discovery import StepDef


def test_normalize_name_strips_prefixes():
    assert _normalize_name("el_LOGIN_LINK") == _normalize_name("loginlink")
    assert _normalize_name("Username") == "username"


def test_repo_matches_fuzzy():
    entry = {"name": "Login Link", "locator_by": "id", "locator_value": "LOGIN_LINK"}
    assert _repo_matches("Login Link", entry)
    assert _repo_matches("login link", entry)


def test_repo_locators_includes_alternates():
    repo = [
        {
            "name": "Password",
            "locator_by": "id",
            "locator_value": "pwd-new",
            "alternate_locators": [{"by": "id", "value": "pwd-old"}],
        }
    ]
    locs = _repo_locators("Password", repo)
    assert ("id", "pwd-new", "repository") in locs
    assert ("id", "pwd-old", "repository_alt") in locs


def test_auto_heal_config_defaults_enabled(tmp_path, monkeypatch):
    cfg = tmp_path / "selenium.json"
    cfg.write_text(json.dumps({"enabled": True}), encoding="utf-8")
    monkeypatch.setattr(
        "dynamic.auto_heal.load_selenium_config",
        lambda: json.loads(cfg.read_text(encoding="utf-8")),
    )
    assert is_auto_heal_enabled() is True
    assert should_persist_heals() is True


class _FakeElement:
    def __init__(self, name: str):
        self._name = name

    def is_displayed(self):
        return True

    def __repr__(self):
        return f"<FakeElement {self._name}>"


class _FakeDriver:
    """Selector -> element map so tests can assert *which* selector wins."""

    def __init__(self, selector_matches: dict[str, list[_FakeElement]]):
        self._selector_matches = selector_matches

    def find_elements(self, by, value):
        return self._selector_matches.get(value, [])


def test_heal_by_attributes_prefers_specific_name_over_generic_email(monkeypatch):
    # A page with both a real "username" field and an unrelated newsletter
    # email field. The 'Username' object must resolve to the name-matched
    # field, never to the generic input[type='email'] one.
    username_el = _FakeElement("username-field")
    email_el = _FakeElement("newsletter-email-field")
    driver = _FakeDriver(
        {
            "input[name*='username' i]": [username_el],
            "input[type='email']": [email_el],
        }
    )
    monkeypatch.setattr("dynamic.auto_heal.get_driver", lambda: driver)

    step = StepDef(step_no=1, action="SetText", object_name="Username")
    el, strategy, meta = _heal_by_attributes("Username", step)

    assert el is username_el
    assert meta == "input[name*='username' i]"


def test_heal_by_attributes_falls_back_to_email_type_when_object_is_email(monkeypatch):
    email_el = _FakeElement("email-field")
    driver = _FakeDriver({"input[type='email']": [email_el]})
    monkeypatch.setattr("dynamic.auto_heal.get_driver", lambda: driver)

    step = StepDef(step_no=1, action="SetText", object_name="Email")
    el, strategy, meta = _heal_by_attributes("Email", step)

    assert el is email_el
    assert meta == "input[type='email']"
