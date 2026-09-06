# Architecture reference

This document describes how the **existing** Internship Completion system is structured.

---

## Ownership boundaries

| Concern | Owner |
|---------|--------|
| Users, passwords, groups | Odoo (`res.users`, `security/`) |
| Internship Request ("Letter of Internship" stage) | `internship.request` |
| Internship Completion Request (certificate stage) | `internship.completion.request` |
| Internship-specific student registry (dates, degree) | `internship.student.registry` |
| Faculty/department/DOB/place of birth/photo/batch/semester | **Read-only** from bu_clearance's `clearance.student.registry`, via `services/student_identity.py`. Never stored or duplicated here. |
| Dean identity + faculty scoping | **Read-only** from Transfer's `academic_request.group_dean` group and `academic_dean_faculty` field on `res.users`, via `services/auth.py`. No dean accounts of this addon's own. |
| UI for students/staff portals | React under `frontend/src/components/internship-system/` |
| Serving the built portal | Odoo static files `backend/internship_completion/static/src/frontend/` |
| Admin / module configuration | Odoo backend menus (not React — this addon has no `views/`, it's API + React only) |

Both cross-module reads are **soft**: `env.get(...)` / `env.ref(..., raise_if_not_found=False)` at runtime, never a hard `depends` in `__manifest__.py`. If bu_clearance or academic_request aren't installed, this addon degrades gracefully (blank faculty/department, no dean role resolves) rather than failing to load.

---

## The two request types and who acts on them

This is the core design of the system: **each request type is owned end-to-end by one side of staff, and the other side can only monitor it.**

| | Internship Request (Letter of Internship) | Internship Completion Request (certificate) |
|---|---|---|
| **Purpose** | Register a placement *before* starting, get a letter as evidence for the host organization | Request the completion certificate *after* finishing |
| **Submitted by** | Student | Student — only once they have an approved Internship Request whose `internship_end_date` has passed |
| **Approves / marks ready** | **Dean** (matched to the student's faculty only) | **Chief Registrar**, **Registrar Office**, or **General Registrar** |
| **Marks collected** | **Dean** (same one) | **Chief Registrar**, **Registrar Office**, or **General Registrar** |
| **Monitor-only access** | Chief Registrar, Registrar Office, General Registrar (view everything, no faculty scoping, no action buttons) | Dean (view everything, no action buttons) |

A Dean can only see/act on Internship Requests where `faculty` matches their own `academic_dean_faculty` value — a Computer Science dean never sees a Medicine student's request. The three completion-side roles have no such scoping; they see every request.

---

## Workflow states

### `internship.request` (`models/internship_placement_request.py`)

| State | Meaning | Set by |
|-------|---------|--------|
| `submitted` | Student registered a placement | student create |
| `approved` | Dean approved — Letter of Internship is ready to collect | Dean (own faculty) / admin |
| `collected` | Student picked up the Letter of Internship | Dean (own faculty) / admin |
| `rejected` | Dean rejected, with a reason | Dean (own faculty) / admin |
| `cancelled` | Student withdrew it while still `submitted` | student |

### `internship.completion.request` (`models/internship_request.py` — filename predates the split, model is the completion stage)

| State | Meaning | Set by |
|-------|---------|--------|
| `draft` | Never used by the API path (`submit` always creates `submitted` directly); kept for admin/manual records | — |
| `submitted` | Student requested a completion certificate | student create |
| `approved` | Ready for collection | Chief Registrar / Registrar Office / General Registrar |
| `collected` | Certificate picked up | Chief Registrar / Registrar Office / General Registrar |
| `rejected` | Rejected, with a reason | Chief Registrar / Registrar Office / General Registrar |
| `cancelled` | Student withdrew it while still `submitted` | student |

`internship.completion.request.placement_request_id` is a required `Many2one` to the `internship.request` it was created from. `internship_type` / `internship_type_other` on the completion record are `related` (stored) fields pointing back at the placement — the type is only ever entered once, on the Internship Request.

Eligibility for submitting a completion request (`find_eligible_placement` in `controllers/api.py`) requires an `internship.request` for that student in state `approved` **or** `collected` (picking up the letter early doesn't un-approve it) whose `internship_end_date` has already passed — approval alone, before the internship even starts, isn't enough.

---

## HTTP / JSON API (React ↔ Odoo)

Base path: `/api/v1/internship`

All routes are Odoo `type='json'` endpoints except the document download. The React client (`api.ts`) POSTs JSON-RPC bodies and sends cookies with `credentials: 'include'`.

### Auth (`controllers/auth_api.py`)

| Route | Auth | Purpose |
|-------|------|---------|
| `/auth/login` | public | Portal login |
| `/auth/logout` | user | Logout |
| `/auth/session` | public | Current session / resolved role |
| `/auth/change_password` | user | Change password |

### Internship Completion Request (`controllers/api.py`)

| Route | Roles | Purpose |
|-------|-------|---------|
| `/profile` | student | Student's academic profile (from bu_clearance) + whether they have an eligible Internship Request + that request's details |
| `/submit` | student | Create a completion request; rejects if no eligible Internship Request exists |
| `/requests` | student, dean, registrar_office, general_registrar, chief_registrar, admin | List completion requests (student sees own; dean/chief see all, monitor-only; registrar roles see all, can act) |
| `/action` | student, registrar_office, general_registrar, chief_registrar, admin | `cancel` (student), `approve` / `reject` / `collect` (registrar_office, general_registrar, chief_registrar, admin) |
| `/document/<id>` | user (`type='http'`) | Stream the uploaded certificate/attachment |

### Internship Request (`controllers/placement_api.py`)

| Route | Roles | Purpose |
|-------|-------|---------|
| `/placement/submit` | student | Create an Internship Request |
| `/placement/list` | student, dean, registrar_office, general_registrar, chief_registrar, admin | List Internship Requests (student sees own; dean sees own faculty, can act; chief/registrar roles see all, monitor-only) |
| `/placement/action` | student, dean, admin | `cancel` (student), `approve` / `reject` / `collect` (dean matched to faculty, admin) |
| `/track` | student | Combined, sorted list of the student's own Internship Requests *and* Completion Requests, each tagged `request_kind` — powers the single "Track Request" screen |

`controllers/http_utils.py:role_domain(role, user, kind)` is the single place that turns a role into a search domain; `kind='placement'` vs `kind='completion'` is what makes Dean's faculty-scoping apply only to `internship.request`.

---

## Frontend module map

```
index.tsx                          Role router — student dashboard vs staff portal
student/StudentDashboard.tsx       Two cards: New Internship Request / New Completion Request (gated on eligibility)
student/NewPlacementRequestForm.tsx  Internship Request submit form
student/NewRequestForm.tsx         Completion Request submit form (reads the approved placement read-only)
student/RequestTracker.tsx         Unified tracker (calls /track), labels each row "New Internship Request" or
                                    "Internship Completion Request"
staff/StaffPortalRoot.tsx          Section switcher (Internship Requests / Internship Completion) shared by
                                    every staff role; role-aware default section + description text
staff/PlacementPanel.tsx           Internship Request table + tabs; canApprove/canCollect driven by role
staff/PlacementRequestModal.tsx    Approve/Reject (Dean) or Mark Collected (Dean) detail modal
staff/ChiefDashboard.tsx           Completion Request table + tabs; canProcess true for chief/registrar/general,
                                    false (monitor) for dean
staff/RequestModal.tsx             Approve/Reject/Collect detail modal + certificate viewer for Completion
```

---

## Demo data

`data/demo_registry.xml` seeds `internship.student.registry` rows for the same "2026 batch" shared cohort used by bu_clearance and Recommendation (one student per faculty) — enrolled/graduated/internship dates only; faculty/department are deliberately **not** stored there since they're resolved live from bu_clearance.

`services/bootstrap_users.py:bootstrap_portal_users(env)` creates/refreshes: the `chief` login, the `certificate` login (shared with bu_clearance's own Registrar Office account) added to `group_registrar_office`, a new `general_registrar` login, and a portal user for every `internship.student.registry` row. It does **not** create Dean accounts — those are Transfer's.
