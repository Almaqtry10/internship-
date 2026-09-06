# -*- coding: utf-8 -*-
import logging
from odoo import http
from odoo.http import request
from odoo.addons.internship_completion.services.auth import get_internship_role
from odoo.addons.internship_completion.services.student_identity import resolve_academic_profile
from .api import api_ok, api_error
from .http_utils import json_params, role_domain

_logger = logging.getLogger(__name__)


def serialize_placement_request(req):
    return {
        'id': req.id,
        'student_id': req.student_id,
        'full_name': req.full_name or '',
        'faculty': req.faculty or '',
        'department': req.department or '',
        'degree': req.degree or '',
        'internship_type': req.internship_type or '',
        'internship_type_other': req.internship_type_other or '',
        'internship_type_display': (
            req.internship_type_other if req.internship_type == 'other'
            else 'MBChB Internship' if req.internship_type == 'mbchb' else ''
        ),
        'host_organization': req.host_organization or '',
        'supervisor_name': req.supervisor_name or '',
        'supervisor_contact': req.supervisor_contact or '',
        'internship_start_date': str(req.internship_start_date) if req.internship_start_date else '',
        'internship_end_date': str(req.internship_end_date) if req.internship_end_date else '',
        'request_date': str(req.request_date) if req.request_date else '',
        'state': req.state,
        'rejection_reason': req.rejection_reason or '',
        'request_kind': 'placement',
    }


class InternshipPlacementAPI(http.Controller):

    @http.route('/api/v1/internship/placement/submit', type='json', auth='user', methods=['POST'], csrf=False)
    def submit_placement_request(self, **kw):
        user = request.env.user.sudo()
        role = get_internship_role(user)
        if role != 'student':
            return api_error('Unauthorized', 401)
        params = json_params(kw)
        sid = user.internship_student_id or user.login

        internship_type = params.get('internship_type') or False
        if internship_type not in ('mbchb', 'other'):
            return api_error('Please choose an internship type.')
        internship_type_other = (params.get('internship_type_other') or '').strip()
        if internship_type == 'other' and not internship_type_other:
            return api_error('Please describe the internship type.')

        host_organization = (params.get('host_organization') or '').strip()
        if not host_organization:
            return api_error('Please provide the host organization for your internship.')
        start_date = params.get('internship_start_date') or False
        end_date = params.get('internship_end_date') or False
        if not start_date or not end_date:
            return api_error('Please provide the internship start and end dates.')

        academic = resolve_academic_profile(user)
        vals = {
            'student_id': sid,
            'registry_id': user.internship_registry_id.id if user.internship_registry_id else False,
            'full_name': academic['full_name'],
            'faculty': academic['faculty'],
            'department': academic['department'],
            'degree': academic['degree'],
            'internship_type': internship_type,
            'internship_type_other': internship_type_other if internship_type == 'other' else False,
            'host_organization': host_organization,
            'supervisor_name': params.get('supervisor_name') or False,
            'supervisor_contact': params.get('supervisor_contact') or False,
            'internship_start_date': start_date,
            'internship_end_date': end_date,
            'state': 'submitted',
        }
        try:
            req = request.env['internship.request'].sudo().create(vals)
            return api_ok({'id': req.id, 'state': req.state})
        except Exception as e:
            _logger.exception('Failed to create internship request')
            return api_error(str(e))

    @http.route('/api/v1/internship/placement/list', type='json', auth='user', methods=['POST'], csrf=False)
    def list_placement_requests(self, **kw):
        user = request.env.user.sudo()
        role = get_internship_role(user)
        if role not in ('student', 'dean', 'registrar_office', 'general_registrar', 'chief_registrar', 'admin'):
            return api_error('Unauthorized')
        domain = role_domain(role, user, kind='placement')
        reqs = request.env['internship.request'].sudo().search(domain, order='id desc')
        return api_ok([serialize_placement_request(req) for req in reqs])

    @http.route('/api/v1/internship/track', type='json', auth='user', methods=['POST'], csrf=False)
    def track_requests(self, **kw):
        from .api import serialize_completion_request
        user = request.env.user.sudo()
        role = get_internship_role(user)
        if role != 'student':
            return api_error('Unauthorized', 401)
        sid = user.internship_student_id or user.login
        placements = request.env['internship.request'].sudo().search([('student_id', '=', sid)], order='id desc')
        completions = request.env['internship.completion.request'].sudo().search([('student_id', '=', sid)], order='id desc')
        result = [serialize_placement_request(req) for req in placements]
        result += [serialize_completion_request(req) for req in completions]
        result.sort(key=lambda r: r.get('request_date') or '', reverse=True)
        return api_ok(result)

    @http.route('/api/v1/internship/placement/action', type='json', auth='user', methods=['POST'], csrf=False)
    def action_placement_request(self, **kw):
        user = request.env.user.sudo()
        role = get_internship_role(user)
        if role not in ('student', 'dean', 'admin'):
            return api_error('Unauthorized')
        params = json_params(kw)
        req_id = params.get('request_id')
        action = params.get('action')
        domain = role_domain(role, user, kind='placement')
        req = request.env['internship.request'].sudo().search(
            [('id', '=', req_id)] + domain, limit=1)
        if not req:
            return api_error('Not found', 404)
        if action == 'cancel' and role == 'student':
            req.action_cancel()
        elif action == 'approve' and role in ('dean', 'admin'):
            req.action_approve()
        elif action == 'reject' and role in ('dean', 'admin'):
            req.action_reject(reason=params.get('reason', ''))
        elif action == 'collect' and role in ('dean', 'admin'):
            req.action_collect()
        else:
            return api_error('Invalid action or unauthorized', 403)
        return api_ok({'id': req.id, 'state': req.state})
