"""Tests for runtime field capture during automation."""

from __future__ import annotations

from dynamic.runtime_capture import (
    _merge_capture_into_files,
    _repo_key,
    reset_runtime_capture_state,
    runtime_capture_summary,
)


def test_repo_key_sanitizes_label():
    assert _repo_key("User Name", "field").startswith("rt_field_")


def test_merge_capture_into_files(tmp_path, monkeypatch):
    import dynamic.runtime_capture as rc

    monkeypatch.setattr(rc, "GENERATED_DIR", tmp_path)
    monkeypatch.setattr(rc, "CAPTURE_LOG_FILE", tmp_path / "runtime-capture-log.json")
    monkeypatch.setattr(rc, "PAGE_MAP_FILE", tmp_path / "page-map.json")
    monkeypatch.setattr(rc, "OBJECT_REPO_FILE", tmp_path / "object-repository.json")

    reset_runtime_capture_state()
    capture = {
        "captured_at": "2026-08-25T12:00:00",
        "url": "https://example.com/login",
        "module": "Login",
        "path": "Login",
        "sub_page": "(runtime)",
        "fields": [
            {
                "label": "Username",
                "type": "text",
                "tag": "input",
                "locator_by": "id",
                "locator_value": "user",
                "repository_key": "rt_field_username",
            }
        ],
        "buttons": [
            {
                "label": "Sign in",
                "locator_by": "id",
                "locator_value": "btn-login",
                "repository_key": "rt_btn_sign_in",
            }
        ],
    }
    _merge_capture_into_files(capture)

    log = (tmp_path / "runtime-capture-log.json").read_text(encoding="utf-8")
    assert "Username" in log
    page_map = (tmp_path / "page-map.json").read_text(encoding="utf-8")
    assert "Login" in page_map
    repo = (tmp_path / "object-repository.json").read_text(encoding="utf-8")
    assert "rt_field_username" in repo
    assert runtime_capture_summary() == []
