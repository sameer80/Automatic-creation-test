"""Build mind-map intelligence from UTS project database models."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from dynamic.mind_map import build_mind_map_tree, write_mind_map_files


def build_mind_map_for_project(project, modules, objects, test_cases) -> dict[str, Any]:
    """Create mind-map tree from persisted project rows."""
    module_payload = [{"name": m.name, "id": m.external_key} for m in modules]

    pages: list[dict[str, Any]] = []
    for module in modules:
        for page in module.pages:
            pages.append(
                {
                    "module": module.name,
                    "sub_page": page.name,
                    "path": page.path,
                    "url": page.url,
                    "page_type": page.page_type,
                    "summary": page.summary,
                    "understood": bool(page.summary or page.url),
                    "field_count": len(page.objects),
                    "button_count": 0,
                    "fields": [
                        {
                            "label": o.name,
                            "type": o.object_type,
                            "tag": o.object_type,
                        }
                        for o in page.objects
                        if (o.object_type or "").lower() != "button"
                    ],
                    "buttons": [
                        {"label": o.name, "action": "PerformClick"}
                        for o in page.objects
                        if (o.object_type or "").lower() == "button"
                    ],
                }
            )

    object_payload = [
        {
            "name": o.name,
            "module": o.page.module.name if o.page and o.page.module else "Core",
            "object_type": o.object_type,
            "locator_by": o.locator_by,
            "locator_value": o.locator_value,
            "stable_score": o.stable_score,
        }
        for o in objects
    ]

    scenario_payload = [
        {
            "id": tc.external_key,
            "title": tc.name,
            "module": tc.module.name if tc.module else "Core",
            "type": tc.test_type,
            "steps": tc.automation_steps or tc.manual_steps or [],
        }
        for tc in test_cases
    ]

    return build_mind_map_tree(
        project.name,
        project.application_url,
        modules=module_payload,
        pages=pages,
        objects=object_payload,
        scenarios=scenario_payload,
    )


def save_project_mind_map(project_id: int, tree: dict[str, Any], root: Path) -> tuple[Path, Path]:
    base = root / "web-data" / "projects" / str(project_id)
    base.mkdir(parents=True, exist_ok=True)
    return write_mind_map_files(
        tree,
        json_path=base / "mind-map.json",
        html_path=base / "mind-map.html",
    )
