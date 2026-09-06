# -*- coding: utf-8 -*-
import base64
import logging

_logger = logging.getLogger(__name__)

def strip_base64_metadata(data_url):
    if data_url and ',' in data_url:
        return data_url.split(',')[1]
    return data_url

def decode_upload_bytes(data_url_or_b64):
    b64 = strip_base64_metadata(data_url_or_b64)
    if b64:
        try:
            return base64.b64decode(b64)
        except Exception:
            return None
    return None

def assert_pdf_upload(label, data):
    raw = decode_upload_bytes(data)
    if not raw:
        raise ValueError(f'{label}: no data provided')
    if not raw.startswith(b'%PDF'):
        raise ValueError(f'{label}: file must be a PDF')
    return raw

def api_ok(data=None):
    return {'status': 'success', 'data': data}

def api_error(message, code=400):
    return {'status': 'error', 'error': message, 'code': code}
