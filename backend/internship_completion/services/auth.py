# -*- coding: utf-8 -*-
import logging
from odoo.http import request

_logger = logging.getLogger(__name__)

GROUP_ROLE_MAP = {
    'internship_completion.group_chief_registrar': 'chief_registrar',
    'internship_completion.group_registrar_office': 'registrar_office',
    'internship_completion.group_general_registrar': 'general_registrar',
    'internship_completion.group_student': 'student',
}

def authenticate_session(login, password):
    try:
        uid = request.session.authenticate(request.env, {'type': 'password', 'login': login, 'password': password})
        return uid
    except Exception as e:
        _logger.warning('Authentication failed for %s: %s', login, e)
        return False

def logout_session():
    request.session.logout(keep_db=True)

def current_user():
    return request.env.user

def is_dean(user):
    """Reuse Transfer's per-faculty dean accounts — no separate dean login needed here."""
    group = request.env.ref('academic_request.group_dean', raise_if_not_found=False)
    return bool(group and user in group.user_ids)

def dean_faculty(user):
    """The faculty a dean is scoped to, from Transfer's own res.users field."""
    return getattr(user, 'academic_dean_faculty', '') or ''

def get_internship_role(user=None):
    if user is None:
        user = request.env.user
    if user._is_admin():
        return 'admin'
    for group_xml, role in GROUP_ROLE_MAP.items():
        try:
            group = request.env.ref(group_xml, raise_if_not_found=False)
            if group and user in group.user_ids:
                return role
        except Exception:
            pass
    if is_dean(user):
        return 'dean'
    return 'student'

def require_roles(*roles):
    user = current_user()
    role = get_internship_role(user)
    if role not in roles:
        return False
    return True

def student_login_key(user):
    return user.internship_student_id or user.login

def session_payload(user=None):
    if user is None:
        user = current_user()
    role = get_internship_role(user)
    return {
        'authenticated': True,
        'role': role,
        'login': user.login,
        'student_id': user.internship_student_id or user.login,
        'name': user.name,
        'uid': user.id,
    }
