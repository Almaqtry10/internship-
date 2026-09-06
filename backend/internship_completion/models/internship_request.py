# -*- coding: utf-8 -*-
from odoo import models, fields, api

class InternshipCompletionRequest(models.Model):
    _name = 'internship.completion.request'
    _description = 'Internship Completion Request'
    _inherit = ['mail.thread']

    student_id = fields.Char(string='Student ID', required=True, index=True)
    registry_id = fields.Many2one('internship.student.registry', string='Registry', ondelete='set null')
    placement_request_id = fields.Many2one(
        'internship.request', string='Internship Request', required=True, ondelete='restrict',
        help='The approved Internship Request this completion certificate is for.',
    )
    full_name = fields.Char(string='Full Name')
    dob = fields.Date(string='Date of Birth')
    place_of_birth = fields.Char(string='Place of Birth')
    faculty = fields.Char(string='Faculty')
    department = fields.Char(string='Department')
    degree = fields.Char(string='Degree')
    internship_type = fields.Selection(
        related='placement_request_id.internship_type', string='Internship Type', store=True, readonly=True,
    )
    internship_type_other = fields.Char(
        related='placement_request_id.internship_type_other', string='Internship Type (Specify)',
        store=True, readonly=True,
    )
    enrolled_date = fields.Date(string='Enrolled Date')
    graduated_date = fields.Date(string='Graduated Date')
    is_transfer_student = fields.Boolean(string='Transfer Student', default=False)
    transferred_university = fields.Char(string='Transferred University')
    internship_start_date = fields.Date(string='Internship Start Date')
    internship_end_date = fields.Date(string='Internship End Date')
    is_requesting = fields.Boolean(string='Requesting Certificate', default=True)
    certificate_attachment = fields.Binary(string='Internship Certificate', attachment=True)
    certificate_filename = fields.Char(string='Certificate Filename')
    digital_signature = fields.Binary(string='Digital Signature', attachment=True)
    request_date = fields.Date(string='Request Date', default=fields.Date.today)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('collected', 'Collected'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ], string='Status', default='draft', tracking=True)
    rejection_reason = fields.Char(string='Rejection Reason')

    def action_submit(self):
        self.state = 'submitted'

    def action_approve(self):
        self.state = 'approved'

    def action_collect(self):
        self.state = 'collected'

    def action_reject(self, reason=''):
        self.state = 'rejected'
        self.rejection_reason = reason

    def action_cancel(self):
        self.state = 'cancelled'
