"""Application mind-map intelligence — visual map of modules, pages, objects, flows."""

from __future__ import annotations

import html
import json
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
GENERATED_DIR = ROOT / "generated"
REPORTS_DIR = ROOT / "reports"
MIND_MAP_JSON = GENERATED_DIR / "mind-map.json"
MIND_MAP_HTML = REPORTS_DIR / "app-mind-map.html"


def _node(
    node_id: str,
    label: str,
    node_type: str,
    *,
    meta: dict[str, Any] | None = None,
    children: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "id": node_id,
        "label": label,
        "type": node_type,
        "meta": meta or {},
        "children": children or [],
    }


def _slug(value: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "-" for ch in (value or "node")).strip("-") or "node"


def build_mind_map_tree(
    app_name: str,
    url: str,
    *,
    modules: list[dict[str, Any]] | None = None,
    pages: list[dict[str, Any]] | None = None,
    objects: list[dict[str, Any]] | None = None,
    scenarios: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Build hierarchical intelligence tree for mind-map visualization."""
    modules = modules or []
    pages = pages or []
    objects = objects or []
    scenarios = scenarios or []

    pages_by_module: dict[str, list[dict[str, Any]]] = {}
    for page in pages:
        mod = str(page.get("module") or "Core")
        pages_by_module.setdefault(mod, []).append(page)

    objects_by_module: dict[str, list[dict[str, Any]]] = {}
    for obj in objects:
        mod = str(obj.get("module") or obj.get("page") or "Core")
        objects_by_module.setdefault(mod, []).append(obj)

    scenarios_by_module: dict[str, list[dict[str, Any]]] = {}
    for sc in scenarios:
        mod = str(sc.get("module") or "Core")
        scenarios_by_module.setdefault(mod, []).append(sc)

    module_names = sorted(
        {
            *(str(m.get("name") or m.get("id") or "") for m in modules if m.get("name") or m.get("id")),
            *pages_by_module.keys(),
            *objects_by_module.keys(),
            *scenarios_by_module.keys(),
        },
        key=str.lower,
    )

    module_children: list[dict[str, Any]] = []
    for name in module_names:
        if not name:
            continue
        mod_pages = pages_by_module.get(name, [])
        mod_objects = objects_by_module.get(name, [])
        mod_scenarios = scenarios_by_module.get(name, [])

        page_nodes: list[dict[str, Any]] = []
        for page in mod_pages:
            sub = str(page.get("sub_page") or page.get("path") or "(main)")
            fields = page.get("fields") or []
            buttons = page.get("buttons") or []
            field_nodes = [
                _node(
                    f"field-{_slug(name)}-{_slug(sub)}-{_slug(str(f.get('label') or 'field'))}",
                    str(f.get("label") or "Field"),
                    "field",
                    meta={"field_type": f.get("type") or f.get("tag") or "text"},
                )
                for f in fields[:12]
            ]
            button_nodes = [
                _node(
                    f"btn-{_slug(name)}-{_slug(sub)}-{_slug(str(b.get('label') or 'btn'))}",
                    str(b.get("label") or "Button"),
                    "button",
                    meta={"action": b.get("action") or "PerformClick"},
                )
                for b in buttons[:12]
            ]
            page_nodes.append(
                _node(
                    f"page-{_slug(name)}-{_slug(sub)}",
                    sub,
                    "page",
                    meta={
                        "page_type": page.get("page_type") or "unknown",
                        "understood": bool(page.get("understood")),
                        "field_count": page.get("field_count", len(fields)),
                        "button_count": page.get("button_count", len(buttons)),
                        "summary": page.get("summary") or "",
                    },
                    children=field_nodes + button_nodes,
                )
            )

        object_nodes = [
            _node(
                f"obj-{_slug(name)}-{_slug(str(o.get('name') or 'object'))}",
                str(o.get("name") or "Object"),
                "object",
                meta={
                    "locator_by": o.get("locator_by") or "",
                    "locator_value": o.get("locator_value") or "",
                    "object_type": o.get("object_type") or o.get("concept") or "element",
                    "stable_score": o.get("stable_score") or 0,
                },
            )
            for o in mod_objects[:20]
        ]

        flow_nodes = [
            _node(
                f"flow-{_slug(name)}-{_slug(str(s.get('id') or s.get('title') or 'flow'))}",
                str(s.get("title") or s.get("id") or "Flow"),
                "flow",
                meta={
                    "id": s.get("id") or "",
                    "steps": len(s.get("steps") or []),
                    "type": s.get("type") or "automation",
                },
            )
            for s in mod_scenarios[:15]
        ]

        module_children.append(
            _node(
                f"mod-{_slug(name)}",
                name,
                "module",
                meta={
                    "pages": len(mod_pages),
                    "objects": len(mod_objects),
                    "flows": len(mod_scenarios),
                },
                children=page_nodes + object_nodes + flow_nodes,
            )
        )

    root = _node(
        "app-root",
        app_name or "Application",
        "application",
        meta={"url": url},
        children=module_children,
    )

    return {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "app_name": app_name,
        "url": url,
        "stats": {
            "modules": len(module_children),
            "pages": len(pages),
            "objects": len(objects),
            "flows": len(scenarios),
        },
        "root": root,
    }


def build_mind_map_from_page_map(page_map: dict[str, Any]) -> dict[str, Any]:
    modules = page_map.get("modules") or []
    if not modules and page_map.get("pages"):
        modules = [{"name": p.get("module") or "Core"} for p in page_map.get("pages") or []]
    return build_mind_map_tree(
        str(page_map.get("app_name") or "Application"),
        str(page_map.get("url") or ""),
        modules=modules,
        pages=page_map.get("pages") or [],
    )


def build_mind_map_from_flow_and_map(
    flow: dict[str, Any],
    page_map: dict[str, Any],
    object_repo: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    objects = list(object_repo or [])
    for obj in objects:
        if "module" not in obj:
            obj["module"] = obj.get("page") or "Core"
    return build_mind_map_tree(
        str(page_map.get("app_name") or flow.get("app_name") or "Application"),
        str(page_map.get("url") or flow.get("url") or ""),
        modules=flow.get("modules") or page_map.get("modules") or [],
        pages=page_map.get("pages") or [],
        objects=objects,
        scenarios=flow.get("scenarios") or [],
    )


def write_mind_map_files(
    tree: dict[str, Any],
    *,
    json_path: Path | None = None,
    html_path: Path | None = None,
) -> tuple[Path, Path]:
    json_path = json_path or MIND_MAP_JSON
    html_path = html_path or MIND_MAP_HTML
    json_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(tree, indent=2, ensure_ascii=False), encoding="utf-8")
    html_path.write_text(render_mind_map_html(tree), encoding="utf-8")
    return json_path, html_path


def render_mind_map_html(tree: dict[str, Any]) -> str:
    """Self-contained interactive mind-map HTML."""
    payload = json.dumps(tree, ensure_ascii=False)
    app = html.escape(str(tree.get("app_name") or "Application"))
    url = html.escape(str(tree.get("url") or ""))
    stats = tree.get("stats") or {}
    return f"""<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Mind Map Intelligence — {app}</title>
<style>
  :root {{
    --bg: #0f172a; --panel: #1e293b; --line: #334155; --text: #e2e8f0; --muted: #94a3b8;
    --app: #f59e0b; --module: #3b82f6; --page: #8b5cf6; --object: #10b981;
    --field: #06b6d4; --button: #ec4899; --flow: #f97316;
  }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; font-family: Segoe UI, Arial, sans-serif; background: var(--bg); color: var(--text); }}
  header {{ padding: 20px 24px; border-bottom: 1px solid var(--line); background: #111827; }}
  header h1 {{ margin: 0 0 6px; font-size: 1.4rem; }}
  header p {{ margin: 0; color: var(--muted); font-size: 0.92rem; }}
  .stats {{ display: flex; gap: 12px; flex-wrap: wrap; margin-top: 14px; }}
  .stat {{ background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 8px 14px; }}
  .stat b {{ color: #93c5fd; margin-right: 6px; }}
  main {{ display: grid; grid-template-columns: 1fr 340px; min-height: calc(100vh - 120px); }}
  #map {{ padding: 24px; overflow: auto; }}
  #details {{ border-left: 1px solid var(--line); background: #111827; padding: 20px; }}
  #details h2 {{ margin: 0 0 12px; font-size: 1rem; color: #93c5fd; }}
  #details .label {{ font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }}
  #details .type {{ display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; text-transform: uppercase; margin-bottom: 12px; }}
  #details dl {{ margin: 0; }}
  #details dt {{ color: var(--muted); font-size: 12px; margin-top: 10px; }}
  #details dd {{ margin: 4px 0 0; word-break: break-word; }}
  .tree {{ list-style: none; margin: 0; padding-left: 0; }}
  .tree ul {{ list-style: none; margin: 6px 0 6px 18px; padding-left: 14px; border-left: 2px solid var(--line); }}
  .node {{ display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; margin: 3px 0; border-radius: 8px; cursor: pointer; border: 1px solid transparent; }}
  .node:hover {{ background: rgba(255,255,255,.06); border-color: var(--line); }}
  .node.active {{ background: rgba(59,130,246,.18); border-color: #3b82f6; }}
  .dot {{ width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }}
  .type-application .dot {{ background: var(--app); }}
  .type-module .dot {{ background: var(--module); }}
  .type-page .dot {{ background: var(--page); }}
  .type-object .dot {{ background: var(--object); }}
  .type-field .dot {{ background: var(--field); }}
  .type-button .dot {{ background: var(--button); }}
  .type-flow .dot {{ background: var(--flow); }}
  .toggle {{ color: var(--muted); font-size: 11px; width: 14px; text-align: center; }}
  .empty {{ color: var(--muted); padding: 24px; }}
  @media (max-width: 900px) {{ main {{ grid-template-columns: 1fr; }} #details {{ border-left: 0; border-top: 1px solid var(--line); }} }}
</style></head>
<body>
<header>
  <h1>Mind Map Intelligence</h1>
  <p><strong>{app}</strong>{(' — ' + url) if url else ''}</p>
  <div class="stats">
    <div class="stat"><b>{stats.get('modules', 0)}</b>modules</div>
    <div class="stat"><b>{stats.get('pages', 0)}</b>pages</div>
    <div class="stat"><b>{stats.get('objects', 0)}</b>objects</div>
    <div class="stat"><b>{stats.get('flows', 0)}</b>flows / tests</div>
  </div>
</header>
<main>
  <div id="map"></div>
  <aside id="details"><h2>Node details</h2><div class="empty">Click a node in the map.</div></aside>
</main>
<script>
const TREE = {payload};

function renderNode(node, depth=0) {{
  const li = document.createElement('li');
  const row = document.createElement('div');
  row.className = 'node type-' + (node.type || 'module');
  row.dataset.id = node.id;
  const hasChildren = node.children && node.children.length;
  const toggle = document.createElement('span');
  toggle.className = 'toggle';
  toggle.textContent = hasChildren ? '▾' : '•';
  const dot = document.createElement('span');
  dot.className = 'dot';
  const label = document.createElement('span');
  label.textContent = node.label;
  row.appendChild(toggle);
  row.appendChild(dot);
  row.appendChild(label);
  row.onclick = (e) => {{
    e.stopPropagation();
    selectNode(node, row);
    if (hasChildren) {{
      ul.hidden = !ul.hidden;
      toggle.textContent = ul.hidden ? '▸' : '▾';
    }}
  }};
  li.appendChild(row);
  const ul = document.createElement('ul');
  (node.children || []).forEach(child => ul.appendChild(renderNode(child, depth + 1)));
  if (hasChildren) li.appendChild(ul);
  return li;
}}

function selectNode(node, el) {{
  document.querySelectorAll('.node.active').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  const panel = document.getElementById('details');
  const meta = node.meta || {{}};
  let rows = '';
  for (const [k,v] of Object.entries(meta)) {{
    if (v === '' || v === null || v === undefined) continue;
    rows += `<dt>${{k}}</dt><dd>${{String(v)}}</dd>`;
  }}
  panel.innerHTML = `
    <h2>Node details</h2>
    <div class="label">${{node.label}}</div>
    <span class="type type-${{node.type}}">${{node.type}}</span>
    <dl>${{rows || '<dd>No extra metadata</dd>'}}</dl>`;
}}

const root = document.getElementById('map');
const ul = document.createElement('ul');
ul.className = 'tree';
if (TREE.root) {{
  ul.appendChild(renderNode(TREE.root));
  root.appendChild(ul);
  const first = root.querySelector('.node');
  if (first) first.click();
}} else {{
  root.innerHTML = '<div class="empty">No mind-map data yet. Run Scan or AI Generate first.</div>';
}}
</script>
</body></html>"""


def create_mind_map_from_files(
    *,
    flow_path: Path | None = None,
    page_map_path: Path | None = None,
    object_repo_path: Path | None = None,
) -> dict[str, Any]:
    flow_path = flow_path or (GENERATED_DIR / "discovered-flow.json")
    page_map_path = page_map_path or (GENERATED_DIR / "page-map.json")
    object_repo_path = object_repo_path or (GENERATED_DIR / "object-repository.json")

    flow: dict[str, Any] = {}
    page_map: dict[str, Any] = {}
    object_repo: list[dict[str, Any]] = []

    if flow_path.is_file():
        flow = json.loads(flow_path.read_text(encoding="utf-8-sig"))
    if page_map_path.is_file():
        page_map = json.loads(page_map_path.read_text(encoding="utf-8-sig"))
    if object_repo_path.is_file():
        raw = json.loads(object_repo_path.read_text(encoding="utf-8-sig"))
        object_repo = raw if isinstance(raw, list) else []

    if flow or page_map.get("pages"):
        tree = build_mind_map_from_flow_and_map(flow, page_map, object_repo)
    else:
        tree = build_mind_map_from_page_map(page_map or {"app_name": "Application", "url": "", "pages": []})

    write_mind_map_files(tree)
    return tree
