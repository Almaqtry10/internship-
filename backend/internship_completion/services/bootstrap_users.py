import logging
import base64
from odoo.exceptions import UserError
from odoo.tools.misc import file_path

_logger = logging.getLogger(__name__)

def bootstrap_portal_users(env):
    ICP = env['ir.config_parameter'].sudo()
    pwd = ICP.get_param('internship_completion.bootstrap_password', '1234')

    ResUsers = env['res.users'].sudo()
    Registry = env['internship.student.registry'].sudo()

    # Create/update chief registrar user (monitor-only across the whole system)
    chief_group = env.ref('internship_completion.group_chief_registrar', raise_if_not_found=False)
    chief = ResUsers.search([('login', '=', 'chief')], limit=1)
    if not chief:
        chief = ResUsers.create({
            'name': 'Chief Registrar',
            'login': 'chief',
            'email': 'chief@bu.edu.so',
        })
    if chief_group:
        chief_group.user_ids = [(4, chief.id)]
    chief.password = pwd
    _logger.info('Bootstrap: chief user ready')

    # Create/update Registrar Office and General Registrar users — these two
    # process (ready/collect) both Internship Requests and Completion Requests.
    # Registrar Office reuses bu_clearance's own 'certificate' login (same
    # person, same shared identity — bu_clearance already names that account
    # "Registrar Office"); General Registrar has no equivalent elsewhere yet.
    for login, name, group_xmlid in (
        ('certificate', 'Registrar Office', 'internship_completion.group_registrar_office'),
        ('general_registrar', 'General Registrar', 'internship_completion.group_general_registrar'),
    ):
        group = env.ref(group_xmlid, raise_if_not_found=False)
        user = ResUsers.search([('login', '=', login)], limit=1)
        if not user:
            user = ResUsers.create({
                'name': name,
                'login': login,
                'email': f'{login}@bu.edu.so',
            })
        if group:
            group.user_ids = [(4, user.id)]
        user.password = pwd
        _logger.info('Bootstrap: %s user ready', login)

    # Create/update student users
    student_group = env.ref('internship_completion.group_student', raise_if_not_found=False)
    students = Registry.search([])
    for st in students:
        sid = st.student_id
        user = ResUsers.search([('login', '=', sid)], limit=1)
        if not user:
            try:
                user = ResUsers.create({
                    'name': st.full_name,
                    'login': sid,
                    'email': st.email or f'{sid}@student.bu.edu.so',
                    'internship_student_id': sid,
                    'internship_registry_id': st.id,
                })
            except Exception as e:
                _logger.warning('Could not create user for %s: %s', sid, e)
                continue
        else:
            user.write({
                'internship_student_id': sid,
                'internship_registry_id': st.id,
            })
        if student_group:
            student_group.user_ids = [(4, user.id)]
        user.password = pwd
        st.user_id = user.id
        _logger.info('Bootstrap: student user %s ready', sid)
