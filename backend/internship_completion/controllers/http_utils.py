# -*- coding: utf-8 -*-
from odoo.http import request
import json

def json_params(kw):
    raw = request.httprequest.data
    if raw:
        try:
            body = json.loads(raw)
            if isinstance(body, dict):
                return body.get('params', body)
        except Exception:
            pass
    return kw or {}

def role_domain(role, user, kind='completion'):
    """Restrict a list/action query to what this role is allowed to see.

    Dean owns Internship Requests end-to-end (scoped to their own faculty)
    and can only monitor (view, never act on) Completion Requests, which
    Chief Registrar / Registrar Office / General Registrar own instead —
    and vice versa, those three can only monitor Internship Requests.
    kind distinguishes which model is being queried since the scoping
    differs between them.
    """
    if role == 'student':
        sid = user.internship_student_id or user.login
        return [('student_id', '=', sid)]
    if role == 'dean' and kind == 'placement':
        from odoo.addons.internship_completion.services.auth import dean_faculty
        faculty = dean_faculty(user)
        return [('faculty', '=', faculty)] if faculty else [('id', '=', 0)]
    return []
