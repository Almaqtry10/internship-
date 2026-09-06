# Architecture reference

This document describes how the **existing** BU Clearance system is structured so integrators can plug into it without changing workflow rules.

---

## Ownership boundaries

| Concern | Owner |
|---------|--------|
| Users, passwords, groups, record rules | Odoo (`res.users`, `security/`) |
| Clearance application + status pipeline | `clearance.request` |
| Student identity cache (ID, name, faculty, …) | `clearance.student.registry` |
| Future external university API sync | `services/registry_sync.py` **only** |
| UI for students/staff portals | React under `frontend/src/components/clearance-system/` |
| Serving the built portal | Odoo static files `backend/bu_clearance/static/app/` |
| Odoo form live webcam widget | `backend/bu_clearance/static/src/` (OWL) |
| Admin / module configuration | Odoo backend menus (not React) |

Application workflow data must stay on the request, not be reinvented in the registry.

---

## Workflow states (backend truth)

Defined in `backend/bu_clearance/services/workflow.py`.

Student-facing “where is it waiting now” mapping:

| Odoo `state` | Student-facing bucket |
|--------------|----------------------|
| `submitted` | Certificate Office |
| `office_verified` | Finance |
| `finance_cleared` | Dean |
| `waiting_student_print` | Print / bring documents |
| `dean_approved` … physical stages | Processing (Chief / signs) |
| `ready` | Ready for collection |
| `collected` | Collected |
| `rejected` | Rejected |

Staff dashboards also use stage groups: inbox → digital → waiting docs → physical → collection → archive.

Staff pipeline labels (examples): “At Certificate Office”, “At Finance”, “At Dean”, “Waiting Student Documents”, “Ready for Chief Print”, …

---

## HTTP / JSON API (React ↔ Odoo)

Base path: `/api/v1/clearance`

Most JSON routes are Odoo `type='json'` endpoints. The React client (`shared/api.ts`) POSTs JSON-RPC bodies and sends cookies with `credentials: 'include'`.

### Auth

| Route | Auth | Purpose |
|-------|------|---------|
| `/api/v1/clearance/auth/login` | public | Portal login |
| `/api/v1/clearance/auth/logout` | user | Logout |
| `/api/v1/clearance/auth/session` | public | Current session / role |
| `/api/v1/clearance/auth/change_password` | user | Change password |

### Clearance data & actions

| Route | Auth | Purpose |
|-------|------|---------|
| `/api/v1/clearance/profile` | user | Student profile / autofill fields |
| `/api/v1/clearance/fees` | user | Fee info |
| `/api/v1/clearance/fees/update` | user | Fee update (authorized staff) |
| `/api/v1/clearance/submit` | user | Create / resubmit application |
| `/api/v1/clearance/requests` | user | List requests (role-scoped) |
| `/api/v1/clearance/requests/<id>` | user | Single request |
| `/api/v1/clearance/action` | user | Staff/student workflow actions |

### Documents & downloads

| Route | Auth | Purpose |
|-------|------|---------|
| `/api/v1/clearance/requests/<id>/documents` | user | Document metadata |
| `/api/v1/clearance/requests/<id>/documents/<field>` | user | Binary field download |
| `/api/v1/clearance/download_request_form` | user | Request form download helper |
| `/api/v1/clearance/download_temporary_letter` | user | Temporary letter download |
| `/bu_clearance/request_form/<id>` | user | Request form HTTP helper |

### Public verify

| Route | Auth | Purpose |
|-------|------|---------|
| `/verify/clearance/<uuid>` | public | Verification page |
| `/clearance/verify/<id>` | public | Verification by id |

Controllers live in:

- `backend/bu_clearance/controllers/auth_api.py`
- `backend/bu_clearance/controllers/api.py`
- `backend/bu_clearance/controllers/document_api.py`

---

## Key backend packages

| Path | Role |
|------|------|
| `models/clearance_request.py` + `models/clearance_request_parts/` | Request model and split helpers |
| `models/student_registry.py` | Registry cache |
| `services/validation.py` | Submit/action validation |
| `services/serializers.py` | API payloads |
| `services/request_queue.py` | Queue / waiting-time helpers for staff lists |
| `services/bootstrap_users.py` | Demo/staff password bootstrap |
| `hooks.py` | Module install/upgrade hooks |

Module version is declared in `__manifest__.py` (currently `1.151`).

---

## Frontend integration surface

Public re-exports and demo shell: `frontend/src/components/clearance-system/index.tsx`

API client: `frontend/src/components/clearance-system/shared/api.ts`

Types / status mapping: `shared/types.ts`, `shared/workflow.ts`

For embedding steps (what to copy per role, CSS, what to skip), see [`INTEGRATION.md`](INTEGRATION.md).

---

## Build artifact rule

- Edit UI in `frontend/src/...`
- Run `.\build_and_deploy.ps1` or `npm run deploy`
- Commit the refreshed `backend/bu_clearance/static/app/` so Odoo can serve the same build without a local Node rebuild

Do not treat hashed files under `static/app/assets/` as hand-maintained source.
