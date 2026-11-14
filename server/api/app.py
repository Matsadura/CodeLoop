#!/usr/bin/env python3
"""Flask application factory.

Production:  gunicorn --config gunicorn.conf.py "api.app:create_app()"
Development: APP_ENV=development python3 -m api.app
"""
import logging
import os
import sys

from api.config import ConfigError, load_settings
from api.errors import register_error_handlers
from api.judge0 import Judge0Client
from api.views import app_views
from api.views.auth import jwt
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from models import storage

HOST = "0.0.0.0"
PORT = 5000


def create_app(settings=None):
    """Create and configure the Flask application"""
    if settings is None:
        load_dotenv()
        settings = load_settings()

    logging.basicConfig(
        level=settings.log_level,
        format='%(asctime)s %(levelname)s %(name)s: %(message)s')

    app = Flask(__name__)
    # Configuration must be complete before extensions are initialised.
    app.config.update(
        JWT_SECRET_KEY=settings.jwt_secret_key,
        JWT_ACCESS_TOKEN_EXPIRES=settings.jwt_access_token_expires,
        JWT_TOKEN_LOCATION=['headers'],
        MAX_CONTENT_LENGTH=settings.max_content_length,
        TESTING=settings.env == 'testing',
        DEBUG=False,
    )
    app.extensions['codeloop_settings'] = settings
    app.extensions['judge0_client'] = Judge0Client(settings.judge0)

    storage.configure(settings.database_url)
    jwt.init_app(app)
    # Tokens travel in the Authorization header (no cookies), so
    # credentials are not needed; origins come from an explicit allowlist.
    CORS(app,
         resources={r'/api/*': {'origins': list(settings.cors_origins)}},
         supports_credentials=False,
         allow_headers=['Authorization', 'Content-Type'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         max_age=600)
    app.url_map.strict_slashes = False
    app.register_blueprint(app_views)
    register_error_handlers(app)

    @app.route('/health')
    def root_health():
        """Readiness probe outside the /api prefix (load balancers)"""
        from api.views.index import health
        return health()

    @app.teardown_appcontext
    def teardown_db(exception):
        """ Closes the storage session """
        storage.close()

    return app


def main():
    """Run the Flask development server (never used in production)"""
    load_dotenv()
    try:
        settings = load_settings()
    except ConfigError as error:
        print(error, file=sys.stderr)
        sys.exit(1)
    if settings.env != 'development':
        print('The Flask development server only runs with '
              'APP_ENV=development. Use gunicorn in production:\n'
              '  gunicorn --config gunicorn.conf.py "api.app:create_app()"',
              file=sys.stderr)
        sys.exit(1)
    app = create_app(settings)
    host = os.getenv("CODE_API_HOST", HOST)
    port = int(os.getenv("CODE_API_PORT", PORT))
    app.run(host=host, port=port, threaded=True, debug=True)


if __name__ == "__main__":
    main()
