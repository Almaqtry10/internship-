# -*- coding: utf-8 -*-
from odoo import models, fields

class ResUsers(models.Model):
    _inherit = 'res.users'

    internship_student_id = fields.Char(string='Internship Student ID', index=True)
    internship_registry_id = fields.Many2one('internship.student.registry', string='Student Registry', ondelete='set null')
    internship_dob = fields.Date(string='Date of Birth')
    internship_place_of_birth = fields.Char(string='Place of Birth')
    internship_degree = fields.Char(string='Degree')
    internship_batch = fields.Char(string='Batch')
    internship_semester = fields.Char(string='Semester')
    internship_enrolled_date = fields.Date(string='Enrolled Date')
    internship_graduated_date = fields.Date(string='Graduated Date')
    internship_start_date = fields.Date(string='Internship Start Date')
    internship_end_date = fields.Date(string='Internship End Date')
