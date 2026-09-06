# -*- coding: utf-8 -*-
import logging
from odoo import http
from odoo.http import request
from odoo.addons.internship_completion.services.auth import (
    authenticate_session, logout_session, session_payload, get_internship_role
)

_logger = logging.getLogger(__name__)

class InternshipAuthAPI(http.Controller):

    @http.route('/api/v1/internship/auth/login', type='json', auth='public', methods=['POST'], csrf=False)
    def login(self, **kw):
        params = request.get_json_data() or {}
        p = params.get('params', params)
        login = p.get('login', '')
        password = p.get('password', '')
        uid = authenticate_session(login, password)
        if not uid:
            return {'status': 'error', 'error': 'Invalid credentials', 'code': 401}
        user = request.env.user
        return {'status': 'success', 'data': session_payload(user)}

    @http.route('/api/v1/internship/auth/logout', type='json', auth='user', methods=['POST'], csrf=False)
    def logout(self, **kw):
        logout_session()
        return {'status': 'success', 'data': {}}

    @http.route('/api/v1/internship/auth/session', type='json', auth='public', methods=['POST', 'GET'], csrf=False)
    def session(self, **kw):
        user = request.env.user
        if not user or user._is_public():
            return {'status': 'success', 'data': {'authenticated': False}}
        return {'status': 'success', 'data': session_payload(user)}

    @http.route('/api/v1/internship/auth/change_password', type='json', auth='user', methods=['POST'], csrf=False)
    def change_password(self, **kw):
        params = request.get_json_data() or {}
        p = params.get('params', params)
        old_pwd = p.get('old_password', '')
        new_pwd = p.get('new_password', '')
        if not new_pwd or len(new_pwd) < 4:
            return {'status': 'error', 'error': 'Password too short', 'code': 400}
        try:
            request.env.user.sudo()._change_password(old_pwd, new_pwd)
            return {'status': 'success', 'data': {}}
        except Exception as e:
            return {'status': 'error', 'error': str(e), 'code': 400}
