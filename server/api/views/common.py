"""Helpers shared by the view modules"""
from flask import abort, jsonify, make_response
from models import storage


def fail(status, message):
    """Abort the request with ``{"error": message}`` and ``status``"""
    abort(make_response(jsonify({'error': message}), status))


def get_or_404(cls, object_id, message):
    """Return ``cls`` with ``object_id`` or abort with a 404"""
    obj = storage.get(cls, object_id)
    if obj is None:
        fail(404, message)
    return obj
