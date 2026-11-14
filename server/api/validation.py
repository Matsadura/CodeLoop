"""Small request validation helpers.

Each helper raises ``ValidationError`` which the app turns into a
``400 {"error": "...", "field": "..."}`` JSON response.
"""
import re
from urllib.parse import urlparse

from flask import request

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


class ValidationError(ValueError):
    """Invalid client input"""

    def __init__(self, message, field=None, status_code=400):
        super().__init__(message)
        self.message = message
        self.field = field
        self.status_code = status_code

    def to_dict(self):
        body = {'error': self.message}
        if self.field:
            body['field'] = self.field
        return body


def json_body():
    """Return the request JSON object or raise ``ValidationError``"""
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not data:
        raise ValidationError('Request body must be a non-empty JSON object')
    return data


def string(data, field, max_length, required=True, strip=True,
           allow_blank=False):
    """Return ``data[field]`` as a validated string (or None if optional
    and absent)."""
    value = data.get(field)
    if value is None:
        if required:
            raise ValidationError(f'Missing {field}', field)
        return None
    if not isinstance(value, str):
        raise ValidationError(f'{field} must be a string', field)
    if strip:
        value = value.strip()
    if not value and not allow_blank:
        raise ValidationError(f'{field} must not be empty', field)
    if len(value) > max_length:
        raise ValidationError(
            f'{field} must be at most {max_length} characters', field)
    return value


def choice(data, field, choices, required=True, case_insensitive=True):
    """Return ``data[field]`` normalized to one of ``choices``"""
    value = string(data, field, 64, required=required)
    if value is None:
        return None
    lookup = {(c.lower() if case_insensitive else c): c for c in choices}
    key = value.lower() if case_insensitive else value
    if key not in lookup:
        raise ValidationError(
            f'{field} must be one of: {", ".join(choices)}', field)
    return lookup[key]


def http_url(data, field, max_length, required=True):
    """Return ``data[field]`` if it is an http(s) URL"""
    value = string(data, field, max_length, required=required)
    if value is None:
        return None
    parsed = urlparse(value)
    if parsed.scheme not in ('http', 'https') or not parsed.netloc:
        raise ValidationError(f'{field} must be an http(s) URL', field)
    return value


def email(data, field='email'):
    """Return a normalized (lower-cased) email address"""
    value = string(data, field, 128)
    if not EMAIL_RE.match(value):
        raise ValidationError('Invalid email address', field)
    return value.lower()


def password(data, field='password', min_length=8):
    """Return a password that satisfies the minimum policy"""
    value = string(data, field, 128, strip=False)
    if len(value) < min_length:
        raise ValidationError(
            f'Password must be at least {min_length} characters', field)
    return value
