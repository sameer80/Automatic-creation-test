# API Test Farm — Step-by-Step Help

**Live URL:** [http://144.91.113.113:5050/api-farm](http://144.91.113.113:5050/api-farm)  
**Home / login:** [http://144.91.113.113:5050](http://144.91.113.113:5050)

Use this guide to send API calls, save them, chain login → next APIs, and run a suite with a report.

---

## Step 1 — Open and sign in

1. Open [http://144.91.113.113:5050](http://144.91.113.113:5050) in your browser.
2. Choose **Language** and **User Role** (Tester / Admin / Guest).
3. Enter your username and password.
4. After login, click **API Test** in the top bar  
   **or** go directly to:  
   [http://144.91.113.113:5050/api-farm](http://144.91.113.113:5050/api-farm)

Default admin (if still enabled on this server): `admin` / `admin123`

---

## Step 2 — Know the screen layout

| Area | What it does |
|------|----------------|
| **Parameters & timestamps** | Collection variables like `{{baseUrl}}`, `{{token}}` |
| **Import OpenAPI / Postman** | Load APIs from Swagger/OpenAPI or Postman JSON |
| **Request builder** | Method, URL, auth, headers, body, extractors, asserts |
| **Live response** | Status, time, body, extracted values after Send |
| **Saved API tests** | Your collection — **order = run / chain order** |
| **Run all saved APIs** | Runs the suite top → bottom |
| **Open last report** | HTML report with pass/fail |

---

## Step 3 — Send your first API (quick test)

1. In **Request builder**:
   - **Name:** `Get post`
   - **Method:** `GET`
   - **URL:** `https://jsonplaceholder.typicode.com/posts/1`
   - **Expected status:** `200`
2. Click **Send request**.
3. Check **Live response**:
   - Pill should show PASS
   - Status `200` and JSON body appear
4. Click **Save to collection** to keep it in **Saved API tests**.

You have now hit a live API and saved it.

---

## Step 4 — Set parameters (`{{var}}`)

1. Scroll to **Parameters & timestamps**.
2. Enter JSON, for example:

```json
{
  "baseUrl": "https://api.example.com",
  "username": "demo",
  "password": "secret"
}
```

3. Click **Save parameters**.

Use them anywhere in URL / body / headers / auth:

| Place | Example |
|--------|---------|
| URL | `{{baseUrl}}/login` |
| Body | `{"username":"{{username}}","password":"{{password}}"}` |
| Header | `{"Authorization":"Bearer {{token}}"}` |
| Bearer token | `{{token}}` |

### Built-in placeholders (no setup)

| Placeholder | Meaning |
|-------------|---------|
| `{{timestamp}}` | Unix seconds |
| `{{timestamp_ms}}` | Unix milliseconds |
| `{{date}}` | `YYYY-MM-DD` |
| `{{datetime}}` | Local datetime |
| `{{datetime_utc}}` | UTC datetime |
| `{{uuid}}` / `{{guid}}` | Random UUID |

---

## Step 5 — Auth presets

In **Auth preset**, pick a type:

| Type | When to use |
|------|-------------|
| **None** | Public APIs |
| **Bearer Token** | JWT / access token — paste value or `{{token}}` |
| **Basic Auth** | Username + password |
| **API Key header** | Custom header (e.g. `X-API-Key`) |

You can also put auth in **Headers (JSON)** manually.

---

## Step 6 — Chain login → next APIs (most important)

### A) Create Login API (must be #1)

1. **Name:** `Login`  
2. **Method:** `POST`  
3. **URL:** e.g. `{{baseUrl}}/auth/login`  
4. **Body:** credentials JSON  
5. **Expected status:** `200` (or `201`)  
6. In **Extractors (JSON array)** save values from the response:

```json
[
  {"name": "token", "path": "access_token", "source": "json"},
  {"name": "userId", "path": "user.id", "source": "json"}
]
```

| Field | Meaning |
|--------|---------|
| `name` | Variable used later as `{{token}}` |
| `path` | JSON path in response (`access_token`, `data.token`, `user.id`) |
| `source` | `json` (usual), or `header` / `status` / `body` |

7. Click **Save to collection**.  
8. In **Saved API tests**, use **↑** so Login is **#1**.

Tip: Click **Send request** on Login alone first. Under Live response you should see **Extracted for next APIs**.

### B) Create next API that uses login values

1. **Method** e.g. `GET`  
2. **URL** e.g. `{{baseUrl}}/users/{{userId}}`  
3. Auth → **Bearer Token** → `{{token}}`  
   **or** Headers:

```json
{"Authorization": "Bearer {{token}}"}
```

4. Save — keep it **after** Login (#2, #3, …).

### C) Run the chain

1. Confirm order: Login first, then dependent APIs (**↑ / ↓**).  
2. Click **Run all saved APIs**.  
3. Click **Open last report** for pass/fail and extracted values.

---

## Step 7 — Add assertions (operators)

In **Operator asserts (JSON array)**:

```json
[
  {"kind": "status", "operator": "eq", "expected": "200"},
  {"kind": "json_path", "path": "status", "operator": "eq", "expected": "success"},
  {"kind": "json_path", "path": "data.id", "operator": "gt", "expected": "0"},
  {"kind": "body", "operator": "contains", "expected": "token"}
]
```

**Operators:** `eq`, `ne`, `contains`, `not_contains`, `gt`, `gte`, `lt`, `lte`, `regex`, `exists`, `not_exists`

**kind values:**

| kind | Checks |
|------|--------|
| `status` | HTTP status code |
| `json_path` | JSON field (`data.token`, `user.id`) |
| `body` | Full response text |
| `header` | Response header (`path` = header name) |

Optional: **Assert body contains** for a simple text check.

---

## Step 8 — Import OpenAPI / Postman

1. In **Import OpenAPI / Postman**:
   - Upload a `.json` file **or** paste JSON  
2. Optional: set **Base URL override** (OpenAPI).  
3. Click **Import into collection**.  
4. Edit extractors, auth, and order as needed.

Supported: OpenAPI 3 / Swagger 2, Postman Collection v2.x.

---

## Step 9 — Positive / negative cases

| Button | Result |
|--------|--------|
| **+/-** on a row | Adds `[POS]` and `[NEG]` for that request |
| **Save + POS/NEG** | Saves current request, then generates POS/NEG |
| **Generate POS/NEG for all** | Expands the whole collection |

Negative cases usually expect 4xx (bad body / path / token).

---

## Step 10 — End-to-end checklist

1. Open [http://144.91.113.113:5050](http://144.91.113.113:5050) → sign in  
2. Go to [API Test Farm](http://144.91.113.113:5050/api-farm)  
3. Set **Parameters** (`baseUrl`, …) → **Save parameters**  
4. Create **Login** + extractors for `token` → **Save**  
5. Create next API with `{{token}}` → **Save**  
6. Order list: Login = #1  
7. **Run all saved APIs**  
8. **Open last report** → confirm PASS  

---

## Troubleshooting

| Problem | What to check |
|---------|----------------|
| Page won’t open | Confirm server is up; try [http://144.91.113.113:5050](http://144.91.113.113:5050) |
| Cannot login | Wrong role/user/password; ask admin for access |
| `{{token}}` not replaced | Extractor `path` must match real JSON; Login must run first and PASS |
| 401 on second API | Wrong token path, or Bearer not set to `{{token}}` |
| Wrong order | Use ↑ ↓ so Login is #1 |
| Import fails | Valid OpenAPI/Postman JSON; try Base URL override |
| UI looks stale | Hard refresh **Ctrl+F5** |

---

## Direct links (this server)

| Page | URL |
|------|-----|
| Login / Home | http://144.91.113.113:5050 |
| API Test Farm | http://144.91.113.113:5050/api-farm |
| Last API report | http://144.91.113.113:5050/api-farm/report |

---

*UTS API Test Farm — step-by-step help for http://144.91.113.113:5050/api-farm*
