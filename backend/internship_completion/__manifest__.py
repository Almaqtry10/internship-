# -*- coding: utf-8 -*-
{
    'name': 'Internship Completion System',
    'version': '19.0.1.0.0',
    'category': 'Education',
    'summary': 'Benadir University Internship Completion Request System',
    'author': 'BU Dev Team',
    'depends': ['base', 'web', 'mail'],
    'data': [
        'security/groups.xml',
        'security/ir.model.access.csv',
        'data/demo_registry.xml',
    ],
    'assets': {
        'web.assets_frontend': [],
    },
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
