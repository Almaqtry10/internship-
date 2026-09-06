# -*- coding: utf-8 -*-
"""Locate the shared student registry row for a portal user.

bu_clearance owns clearance.student.registry. Internship Completion only
ever reads from it, and degrades gracefully when that addon is not
installed. Mirrors the same helper in the recommendation addon so all
three systems resolve a student's real faculty/department the same way.
"""


def find_clearance_registry(user):
    """Return the user's clearance.student.registry row, or False."""
    if not user:
        return False
    Registry = user.env.get('clearance.student.registry')
    if Registry is None:
        return False
    Registry = Registry.sudo()
    user = user.sudo()

    linked = getattr(user, 'clearance_registry_id', False)
    if linked and linked.exists():
        return linked.sudo()

    for attr in ('clearance_student_id', 'internship_student_id', 'login'):
        key = str(getattr(user, attr, None) or '').strip()
        if not key:
            continue
        if hasattr(Registry, 'find_by_login'):
            rec = Registry.find_by_login(key)
            if rec:
                return rec
        rec = Registry.search([
            '|',
            ('student_id', '=ilike', key),
            ('login_username', '=ilike', key),
        ], limit=1)
        if rec:
            return rec
    return False


def resolve_academic_profile(user):
    """Real faculty/department/degree from the shared bu_clearance registry.

    Internship Completion has no faculty concept of its own — it defers to
    the same shared registry Recommendation uses, so every faculty works,
    not just Medicine. Falls back to generic values only when bu_clearance
    isn't installed or the student has no registry row yet.
    """
    registry = find_clearance_registry(user)
    if registry:
        payload = {}
        try:
            payload = registry.get_profile_payload() or {}
        except Exception:
            payload = {}
        degree = payload.get('degree') or registry.degree or 'Bachelor'
        faculty = payload.get('faculty') or registry.faculty or ''
        is_postgrad = degree in ('Master', 'PhD')
        if is_postgrad:
            department = payload.get('master_program') or registry.master_program or ''
        else:
            department = (
                payload.get('department') or registry.department
                or payload.get('program') or registry.program or ''
            )
        return {
            'full_name': payload.get('full_name') or registry.full_name or user.name,
            'faculty': faculty,
            'department': department,
            'degree': degree,
            'dob': payload.get('dob') or (str(registry.dob) if registry.dob else ''),
            'place_of_birth': payload.get('place_of_birth') or registry.place_of_birth or '',
            'batch': payload.get('batch') or registry.batch or '',
            'semester': payload.get('current_semester') or registry.current_semester or '',
            'student_photo_url': payload.get('student_photo_url') or None,
        }
    return {
        'full_name': user.name,
        'faculty': '',
        'department': '',
        'degree': '',
        'dob': '',
        'place_of_birth': '',
        'batch': '',
        'semester': '',
        'student_photo_url': None,
    }
