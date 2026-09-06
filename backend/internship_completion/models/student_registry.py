# -*- coding: utf-8 -*-
from odoo import models, fields, api

class InternshipStudentRegistry(models.Model):
    _name = 'internship.student.registry'
    _description = 'Internship Student Registry'

    student_id = fields.Char(string='Student ID', required=True, index=True)
    full_name = fields.Char(string='Full Name', required=True)
    dob = fields.Date(string='Date of Birth')
    place_of_birth = fields.Char(string='Place of Birth')
    phone = fields.Char(string='Phone', default='+252 ')
    email = fields.Char(string='Email')
    enrolled_date = fields.Date(string='Enrolled Date')
    graduated_date = fields.Date(string='Graduated Date')
    degree = fields.Selection([
        ('Bachelor', 'MBChB Bachelor'),
        ('Postgraduate', 'Postgraduate'),
    ], string='Degree', default='Bachelor')
    internship_start_date = fields.Date(string='Internship Start Date')
    internship_end_date = fields.Date(string='Internship End Date')
    is_transfer_student = fields.Boolean(string='Transfer Student', default=False)
    transferred_university = fields.Char(string='Transferred University')
    user_id = fields.Many2one('res.users', string='Portal User', ondelete='set null')
    login_username = fields.Char(string='Login Username')


    def get_profile_payload(self):
        self.ensure_one()
        return {
            'student_id': self.student_id,
            'full_name': self.full_name,
            'dob': str(self.dob) if self.dob else '',
            'place_of_birth': self.place_of_birth or '',
            'phone': self.phone or '',
            'email': self.email or '',
            'enrolled_date': str(self.enrolled_date) if self.enrolled_date else '',
            'graduated_date': str(self.graduated_date) if self.graduated_date else '',
            'degree': self.degree or 'Bachelor',
            'internship_start_date': str(self.internship_start_date) if self.internship_start_date else '',
            'internship_end_date': str(self.internship_end_date) if self.internship_end_date else '',
            'is_transfer_student': self.is_transfer_student,
            'transferred_university': self.transferred_university or '',
        }
