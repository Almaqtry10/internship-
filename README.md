# Internship Completion System

Benadir University internship system: a **React/Vite** student & staff portal plus an **Odoo 19** addon (`internship_completion`) that owns authentication, permissions, workflow, and data.

Unlike its original scope (Medicine/Dentistry/Health Science only), this system now supports students from **every faculty**. It covers two linked stages of a student's internship:

1. **Internship Request** — a student registers their placement (host organization, supervisor, internship type, dates) *before* starting. Their faculty **Dean** approves it, which makes a **Letter of Internship** available — evidence the student can hand to their host organization. The Dean also marks it collected once the student picks up the letter.
2. **Internship Completion Request** — once the internship is finished, the student submits a certificate request (with proof of completion attached). **Chief Registrar**, **Registrar Office**, and **General Registrar** process it: mark it ready for collection, then mark it collected.

Each stage is owned end-to-end by one side of staff; the other side can only monitor it, not act on it.

---

## How the system works

1. **Odoo** is the backend: users, security groups, models, JSON/HTTP API, and serving the built SPA from `backend/internship_completion/static/src/frontend/`.
2. **React** is the internship UI for students and staff roles (Dean, Chief Registrar, Registrar Office, General Registrar).
3. The browser talks to Odoo with **session cookies** (`credentials: 'include'`). Login creates an Odoo session; the SPA then calls `/api/v1/internship/...`.
4. **Faculty/department/DOB/photo** are never stored here — they're resolved live from bu_clearance's shared `clearance.student.registry` (see `services/student_identity.py`), so every faculty works, not just Medicine.
5. **Dean identity is reused, not duplicated** — this addon has no dean accounts of its own. It reads the same per-faculty dean logins/groups already set up by the Transfer system (`academic_request.group_dean`), matching students to deans by faculty name.
6. There is **no React admin role**. Odoo backend/admin stays in Odoo.

### High-level request flow

```
Internship Request:    Student submits → Dean approves (own faculty only)
                          → Letter of Internship ready → Dean marks collected
                        (Chief Registrar / Registrar Office / General Registrar can only view this queue)

Internship Completion:  Requires an approved Internship Request whose end date has passed
                        Student submits certificate request
                          → Chief Registrar / Registrar Office / General Registrar mark ready
                          → mark collected
                        (Dean can only view this queue)
```

Rejected requests can be corrected and resubmitted by the student; submitted requests can be cancelled by the student.

---

## Repository structure

| Path | Purpose |
|------|---------|
| [`frontend/`](frontend/) | Vite/React source (UI source of truth) |
| [`backend/internship_completion/`](backend/internship_completion/) | Odoo 19 addon (API, models, security, static SPA) |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Models, API map, workflow states, ownership boundaries |
| [`build_and_deploy.ps1`](build_and_deploy.ps1) | Build frontend and copy into Odoo `static/src/frontend` |

### Frontend layout

```
frontend/src/components/internship-system/
  student/     StudentDashboard, NewPlacementRequestForm, NewRequestForm, RequestTracker
  staff/       StaffPortalRoot (section switcher), PlacementPanel + PlacementRequestModal (Internship Request),
               ChiefDashboard + RequestModal (Internship Completion), StaffArchiveReports
  shared/      printEngine
  api.ts       JSON-RPC client for /api/v1/internship/*
  auth.ts      Session helpers (localStorage cache of role/login, backed by the Odoo session cookie)
  types.ts     Shared TypeScript contracts
  styles/      tokens.css, shared.css, student.css, staff.css, login.css
  index.tsx    Role router: student dashboard vs staff portal
```

### Backend layout

```
backend/internship_completion/
  controllers/   auth_api (login/session), api (profile + completion request routes), placement_api (internship
                 request routes + combined /track), http_utils (json body parsing, role-scoped domains)
  models/        internship.student.registry, internship.request (the placement/"Letter of Internship" stage),
                 internship.completion.request (the certificate stage, links back via placement_request_id),
                 res.users extension fields
  services/      auth (role + dean resolution), bootstrap_users (demo account setup), student_identity (reads
                 bu_clearance's shared registry), validation
  security/      groups.xml, ir.model.access.csv
  data/          demo_registry.xml — shared "2026 batch" cohort registry rows
  static/src/frontend/  Built React SPA served by Odoo (do not hand-edit; rebuild instead)
```

---

## Prerequisites

- **Node.js 18+**
- **Odoo 19** with addons path including this repo's `backend/` folder (so `internship_completion` is discoverable)
- PostgreSQL database used by Odoo (this project commonly uses DB name `odoo_db` in local demos)
- For full faculty/department/photo/dob resolution and shared demo students: the `bu_clearance` addon installed in the same database (soft dependency — read only, no hard `depends`)
- For Dean login/approval: the `academic_request` (Transfer) addon installed in the same database (soft dependency, same reasoning)

---

## Setup (Odoo module)

1. Point Odoo `addons_path` at this repo's `backend` folder.
2. Update Apps list and install / upgrade **Internship Completion System** (`internship_completion`).
3. Restart Odoo after Python changes. Upgrade with `-u internship_completion` when model fields, security, or data files change.
4. Run `bootstrap_portal_users(env)` (via `odoo-bin shell`, or wire it to a button/cron) to create/refresh demo staff logins and link student registry rows to portal users.

Portal URL (after install): typically

`http://localhost:8069/internship_completion/static/src/frontend/index.html`

(Exact host/port follow your Odoo config.)

---

## Frontend local development

```powershell
cd frontend
npm install
npm run dev
```

- Dev server: default Vite port (see terminal output)
- Vite proxies API/session calls to your local Odoo instance so session cookies work — check `vite.config.ts` if you need to point it at a non-default Odoo port.

---

## Build & deploy into Odoo

From the **repository root**:

```powershell
.\build_and_deploy.ps1
```

Or from `frontend/`:

```powershell
npm run deploy
```

What it does:

1. `npm run build` (Vite production build)
2. Replaces `backend/internship_completion/static/src/frontend/` with `frontend/dist/*`

This only redeploys static assets — the browser can still serve a stale cached bundle after a redeploy; hard-reload (or cache-bust the URL) to pick up the new build. Restart Odoo separately whenever backend Python/security/data files changed.

---

## Demo logins

Same password for demo users (system parameter `internship_completion.bootstrap_password`, default **`1234`**):

| Role | Username | Password | Scope |
|------|----------|----------|-------|
| Chief Registrar | `chief` | `1234` | Monitors everything; acts on Completion Requests |
| Registrar Office | `certificate` | `1234` | Shared login with bu_clearance's own "Registrar Office" account; acts on Completion Requests |
| General Registrar | `general_registrar` | `1234` | Acts on Completion Requests (same permissions as Registrar Office) |
| Dean (example) | `computer` | `1234` | Shared login with the Transfer system; acts on Internship Requests for their own faculty only |
| Student | Student ID (e.g. `CS2026004`) | `1234` | The "2026 batch" shared cohort works across bu_clearance, Recommendation, and this system |

Demo data is seeded via `data/demo_registry.xml` and the bootstrap helper for exploration. Keep demo assets unless you intentionally purge a demo database.

---

Workflow, model, and API reference: **[ARCHITECTURE.md](ARCHITECTURE.md)**
