#!/usr/bin/python3
"""Initialize the models package.

``storage`` is created unconfigured; the Flask app factory (or a management
command) calls ``storage.configure(database_url)`` before first use.
"""

from models.engine.db_storage import DBStorage


storage = DBStorage()
