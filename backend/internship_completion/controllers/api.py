# -*- coding: utf-8 -*-
import logging
import base64
from datetime import date
from odoo import http
from odoo.http import request
from odoo.addons.internship_completion.services.auth import get_internship_role
from odoo.addons.internship_completion.services.student_identity import resolve_academic_profile
from .http_utils import json_params, role_domain

_logger = logging.getLogger(__name__)

def api_ok(data=None):
    return {'status': 'success', 'data': data}

def api_error(message, code=400):
    return {'status': 'error', 'error': message, 'code': code}


_resolve_academic_profile = resolve_academic_profile


def find_eligible_placement(sid):
    """Dean-approved internship request whose internship has actually finished.

    A student can only request a completion certificate for an internship
    they've finished — approval alone (which happens before the internship
    starts) isn't enough. 'collected' (the physical Letter of Internship was
    picked up) still counts as approved — that pickup can happen long before
    the internship itself is over.
    """
    return request.env['internship.request'].sudo().search([
        ('student_id', '=', sid),
        ('state', 'in', ('approved', 'collected')),
        ('internship_end_date', '<=', date.today()),
    ], order='id desc', limit=1)


def serialize_completion_request(req):
    return {
        'id': req.id,
        'student_id': req.student_id,
        'full_name': req.full_name or '',
        'dob': str(req.dob) if req.dob else '',
        'place_of_birth': req.place_of_birth or '',
        'state': req.state,
        'request_date': str(req.request_date) if req.request_date else '',
        'rejection_reason': req.rejection_reason or '',
        'enrolled_date': str(req.enrolled_date) if req.enrolled_date else '',
        'graduated_date': str(req.graduated_date) if req.graduated_date else '',
        'internship_start_date': str(req.internship_start_date) if req.internship_start_date else '',
        'internship_end_date': str(req.internship_end_date) if req.internship_end_date else '',
        'is_transfer_student': bool(req.is_transfer_student),
        'transferred_university': req.transferred_university or '',
        'faculty': req.faculty or '',
        'department': req.department or '',
        'degree': req.degree or '',
        'internship_type': req.internship_type or '',
        'internship_type_other': req.internship_type_other or '',
        'internship_type_display': (
            req.internship_type_other if req.internship_type == 'other'
            else 'MBChB Internship' if req.internship_type == 'mbchb' else ''
        ),
        'has_certificate': bool(req.certificate_attachment),
        'certificate_filename': req.certificate_filename or '',
        'request_kind': 'completion',
    }


class InternshipAPI(http.Controller):

    @http.route('/api/v1/internship/profile', type='json', auth='user', methods=['POST'], csrf=False)
    def profile(self, **kw):
        user = request.env.user.sudo()
        role = get_internship_role(user)
        if role != 'student':
            return api_error('Unauthorized', 401)
        academic = _resolve_academic_profile(user)
        reg = user.internship_registry_id
        sid = user.internship_student_id or user.login
        placement = find_eligible_placement(sid)
        return api_ok({
            'student_id': user.internship_student_id or user.login,
            'full_name': academic['full_name'],
            'dob': academic['dob'] or (str(user.internship_dob) if user.internship_dob else ''),
            'place_of_birth': academic['place_of_birth'] or user.internship_place_of_birth or '',
            'faculty': academic['faculty'],
            'department': academic['department'],
            'degree': academic['degree'],
            'batch': academic['batch'] or user.internship_batch or '-',
            'semester': academic['semester'] or user.internship_semester or '-',
            'enrolled_date': str(reg.enrolled_date) if reg and reg.enrolled_date else (
                str(user.internship_enrolled_date) if user.internship_enrolled_date else ''),
            'graduated_date': str(reg.graduated_date) if reg and reg.graduated_date else (
                str(user.internship_graduated_date) if user.internship_graduated_date else ''),
            'internship_start_date': str(reg.internship_start_date) if reg and reg.internship_start_date else (
                str(user.internship_start_date) if user.internship_start_date else ''),
            'internship_end_date': str(reg.internship_end_date) if reg and reg.internship_end_date else (
                str(user.internship_end_date) if user.internship_end_date else ''),
            'student_photo_url': academic['student_photo_url'],
            'has_approved_internship_request': bool(placement),
            'approved_internship_request': {
                'host_organization': placement.host_organization or '',
                'internship_type_display': (
                    placement.internship_type_other if placement.internship_type == 'other'
                    else 'MBChB Internship' if placement.internship_type == 'mbchb' else ''
                ),
                'internship_start_date': str(placement.internship_start_date) if placement.internship_start_date else '',
                'internship_end_date': str(placement.internship_end_date) if placement.internship_end_date else '',
            } if placement else None,
        })

    @http.route('/api/v1/internship/submit', type='json', auth='user', methods=['POST'], csrf=False)
    def submit_request(self, **kw):
        user = request.env.user.sudo()
        role = get_internship_role(user)
        if role != 'student':
            return api_error('Unauthorized', 401)
        params = json_params(kw)
        sid = user.internship_student_id or user.login

        placement = find_eligible_placement(sid)
        if not placement:
            return api_error(
                'You need an approved Internship Request whose internship has finished '
                'before requesting a completion certificate.'
            )

        academic = _resolve_academic_profile(user)
        b64_data = params.get('certificate_attachment')
        if b64_data and ',' in b64_data:
            b64_data = b64_data.split(',')[1]
        vals = {
            'student_id': sid,
            'registry_id': user.internship_registry_id.id if user.internship_registry_id else False,
            'placement_request_id': placement.id,
            'full_name': academic['full_name'],
            'dob': academic['dob'] or False,
            'place_of_birth': academic['place_of_birth'] or False,
            'faculty': academic['faculty'],
            'department': academic['department'],
            'degree': academic['degree'],
            'enrolled_date': params.get('enrolled_date') or False,
            'graduated_date': params.get('graduated_date') or False,
            'is_transfer_student': bool(params.get('is_transfer_student')),
            'transferred_university': params.get('transferred_university') or False,
            'internship_start_date': placement.internship_start_date,
            'internship_end_date': placement.internship_end_date,
            'is_requesting': bool(params.get('is_requesting')),
            'state': 'submitted',
        }
        if b64_data:
            vals['certificate_attachment'] = b64_data
            vals['certificate_filename'] = params.get('certificate_filename') or 'certificate.pdf'
        try:
            req = request.env['internship.completion.request'].sudo().create(vals)
            return api_ok({'id': req.id, 'state': req.state})
        except Exception as e:
            _logger.exception('Failed to create request')
            return api_error(str(e))

    @http.route('/api/v1/internship/requests', type='json', auth='user', methods=['POST'], csrf=False)
    def list_requests(self, **kw):
        user = request.env.user.sudo()
        role = get_internship_role(user)
        if role not in ('student', 'dean', 'registrar_office', 'general_registrar', 'chief_registrar', 'admin'):
            return api_error('Unauthorized')
        domain = role_domain(role, user)
        reqs = request.env['internship.completion.request'].sudo().search(domain, order='id desc')
        return api_ok([serialize_completion_request(req) for req in reqs])

    @http.route('/api/v1/internship/action', type='json', auth='user', methods=['POST'], csrf=False)
    def action_request(self, **kw):
        user = request.env.user.sudo()
        role = get_internship_role(user)
        if role not in ('student', 'registrar_office', 'general_registrar', 'chief_registrar', 'admin'):
            return api_error('Unauthorized')
        params = json_params(kw)
        req_id = params.get('request_id')
        action = params.get('action')
        domain = role_domain(role, user)
        req = request.env['internship.completion.request'].sudo().search(
            [('id', '=', req_id)] + domain, limit=1)
        if not req:
            return api_error('Not found', 404)
        if action == 'cancel' and role == 'student':
            req.action_cancel(reason=params.get('reason', ''))
        elif action == 'approve' and role in ('registrar_office', 'general_registrar', 'chief_registrar', 'admin'):
            req.action_approve()
        elif action == 'reject' and role in ('registrar_office', 'general_registrar', 'chief_registrar', 'admin'):
            req.action_reject(reason=params.get('reason', ''))
        elif action == 'collect' and role in ('registrar_office', 'general_registrar', 'chief_registrar', 'admin'):
            req.action_collect()
        else:
            return api_error('Invalid action or unauthorized', 403)
        return api_ok({'id': req.id, 'state': req.state})

    @http.route('/api/v1/internship/document/<int:req_id>', type='http', auth='user', methods=['GET'], csrf=False)
    def download_document(self, req_id, **kw):
        user = request.env.user
        role = get_internship_role(user)
        domain = role_domain(role, user)
        req = request.env['internship.completion.request'].sudo().search(
            [('id', '=', req_id)] + domain, limit=1)
        if not req or not req.certificate_attachment:
            return request.not_found()
        filecontent = base64.b64decode(req.certificate_attachment)
        filename = req.certificate_filename or 'certificate.pdf'
        return request.make_response(filecontent, [
            ('Content-Type', 'application/pdf'),
            ('Content-Disposition', f'inline; filename="{filename}"')
        ])
