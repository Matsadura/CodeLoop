"""Consistent JSON error responses.

Every error leaves the API as ``{"error": "<message>"}`` with a matching HTTP
status. Unexpected exceptions are logged server side and reported to the
client as a generic 500 without stack traces or database details.
"""
import logging

from api.validation import ValidationError
from flask import jsonify, request
from models import storage
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import HTTPException, InternalServerError

logger = logging.getLogger(__name__)


def error_response(message, status, **extra):
    body = {'error': message}
    body.update(extra)
    return jsonify(body), status


def register_error_handlers(app):
    """Attach the JSON error handlers to ``app``"""

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify(error.to_dict()), error.status_code

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        # Unique/foreign-key violations that slipped past the explicit
        # checks (e.g. two concurrent requests). Do not echo the SQL.
        storage.rollback()
        logger.warning('Integrity error on %s %s', request.method,
                       request.path)
        return error_response('Conflicts with an existing record', 409)

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        if error.response is not None:
            # Raised through api.views.common.fail(): already JSON.
            return error.response
        if isinstance(error, InternalServerError):
            original = getattr(error, 'original_exception', None)
            if original is not None:
                logger.error('Unhandled exception',
                             exc_info=(type(original), original,
                                       original.__traceback__))
            storage.rollback()
            return error_response('Internal server error', 500)
        message = error.description or error.name
        if error.code == 404:
            message = 'Not found'
        elif error.code == 405:
            message = 'Method not allowed'
        elif error.code == 413:
            message = 'Request body too large'
        return error_response(message, error.code)
