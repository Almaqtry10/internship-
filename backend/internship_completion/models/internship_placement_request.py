# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError


class InternshipRequest(models.Model):
    _name = 'internship.request'
    _description = 'Internship Request'
    _inherit = ['mail.thread']
    _order = 'id desc'

    student_id = fields.Char(string='Student ID', required=True, index=True)
    registry_id = fields.Many2one('internship.student.registry', string='Registry', ondelete='set null')
    full_name = fields.Char(string='Full Name')
    faculty = fields.Char(string='Faculty')
    department = fields.Char(string='Department')
    degree = fields.Char(string='Degree')
    internship_type = fields.Selection([
        ('mbchb', 'MBChB Internship'),
        ('other', 'Other'),
    ], string='Internship Type', required=True)
    internship_type_other = fields.Char(string='Internship Type (Specify)')
    host_organization = fields.Char(string='Host Organization', required=True)
    supervisor_name = fields.Char(string='Supervisor Name')
    supervisor_contact = fields.Char(string='Supervisor Contact')
    internship_start_date = fields.Date(string='Internship Start Date', required=True)
    internship_end_date = fields.Date(string='Internship End Date', required=True)
    request_date = fields.Date(string='Request Date', default=fields.Date.today)
    state = fields.Selection([
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('collected', 'Collected'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ], string='Status', default='submitted', required=True, tracking=True)
    rejection_reason = fields.Char(string='Rejection Reason')

    @api.constrains('internship_type', 'internship_type_other')
    def _check_internship_type_other(self):
        for rec in self:
            if rec.internship_type == 'other' and not (rec.internship_type_other or '').strip():
                raise ValidationError('Please describe the internship type when "Other" is selected.')

    def action_approve(self):
        self.state = 'approved'

    def action_collect(self):
        self.state = 'collected'

    def action_reject(self, reason=''):
        self.state = 'rejected'
        self.rejection_reason = reason

    def action_cancel(self):
        self.state = 'cancelled'
