"""Application settings loaded and validated from environment variables.

All configuration is read once at startup by ``load_settings``. Missing or
unsafe values raise ``ConfigError`` so a misconfigured deployment fails fast
instead of misbehaving at request time.
"""
import os
from dataclasses import dataclass, field
from datetime import timedelta
from typing import Dict, List, Mapping, Optional, Tuple

from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import ArgumentError

ENVIRONMENTS = ('development', 'testing', 'production')
DEFAULT_DEV_ORIGINS = 'http://localhost:3000,http://127.0.0.1:3000'
DEFAULT_LANGUAGE_IDS = 'python=71,c=50'
MIN_PRODUCTION_SECRET_LENGTH = 32


class ConfigError(RuntimeError):
    """Raised when the environment does not contain a valid configuration."""


@dataclass(frozen=True)
class Judge0Settings:
    """Settings for the Judge0-compatible code execution service."""
    url: str
    auth_token: Optional[str] = None
    rapidapi_key: Optional[str] = None
    rapidapi_host: Optional[str] = None
    request_timeout: float = 10.0
    max_retries: int = 2
    sync_wait: float = 15.0
    poll_interval: float = 1.0
    batch_size: int = 20
    language_ids: Dict[str, int] = field(default_factory=dict)

    def headers(self) -> Dict[str, str]:
        """Authentication headers to send with every Judge0 request."""
        headers = {}
        if self.auth_token:
            headers['X-Auth-Token'] = self.auth_token
        if self.rapidapi_key:
            headers['X-RapidAPI-Key'] = self.rapidapi_key
            headers['X-RapidAPI-Host'] = (self.rapidapi_host or
                                          make_host(self.url))
        return headers


@dataclass(frozen=True)
class Settings:
    """Validated application settings."""
    env: str
    database_url: str
    jwt_secret_key: str
    jwt_access_token_expires: timedelta
    cors_origins: Tuple[str, ...]
    judge0: Judge0Settings
    max_content_length: int = 1024 * 1024
    log_level: str = 'INFO'

    @property
    def is_production(self) -> bool:
        return self.env == 'production'


def make_host(url: str) -> str:
    """Return the host part of a URL (used for the RapidAPI host header)."""
    without_scheme = url.split('://', 1)[-1]
    return without_scheme.split('/', 1)[0]


def _get(env: Mapping[str, str], name: str) -> Optional[str]:
    value = env.get(name)
    if value is None:
        return None
    value = value.strip()
    return value or None


def _get_float(env, name, default, minimum, errors):
    raw = _get(env, name)
    if raw is None:
        return default
    try:
        value = float(raw)
    except ValueError:
        errors.append(f'{name} must be a number')
        return default
    if value < minimum:
        errors.append(f'{name} must be >= {minimum}')
    return value


def _get_int(env, name, default, minimum, errors):
    raw = _get(env, name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        errors.append(f'{name} must be an integer')
        return default
    if value < minimum:
        errors.append(f'{name} must be >= {minimum}')
    return value


def parse_language_ids(raw: str) -> Dict[str, int]:
    """Parse ``python=71,c=50`` into ``{'python': 71, 'c': 50}``."""
    result = {}
    for item in raw.split(','):
        item = item.strip()
        if not item:
            continue
        name, sep, value = item.partition('=')
        if not sep or not name.strip() or not value.strip().isdigit():
            raise ValueError(item)
        result[name.strip().lower()] = int(value)
    if not result:
        raise ValueError(raw)
    return result


def _database_url(env, errors) -> str:
    url = _get(env, 'DATABASE_URL')
    if url:
        try:
            parsed = make_url(url)
        except ArgumentError:
            errors.append('DATABASE_URL is not a valid SQLAlchemy URL')
            return ''
        # Managed providers usually hand out mysql://... URLs; use the
        # pure-python PyMySQL driver that ships with this project.
        if parsed.drivername == 'mysql':
            parsed = parsed.set(drivername='mysql+pymysql')
        return parsed.render_as_string(hide_password=False)

    names = ('CODE_DB_HOST', 'CODE_DB_USER', 'CODE_DB_PASSWORD',
             'CODE_DB_NAME')
    values = {name: _get(env, name) for name in names}
    missing = [name for name, value in values.items() if value is None]
    if missing:
        errors.append('Set DATABASE_URL or all of: ' + ', '.join(names) +
                      ' (missing: ' + ', '.join(missing) + ')')
        return ''
    port = _get_int(env, 'CODE_DB_PORT', 3306, 1, errors)
    return URL.create(
        'mysql+pymysql',
        username=values['CODE_DB_USER'],
        password=values['CODE_DB_PASSWORD'],
        host=values['CODE_DB_HOST'],
        port=port,
        database=values['CODE_DB_NAME'],
        query={'charset': 'utf8mb4'},
    ).render_as_string(hide_password=False)


def load_settings(env: Optional[Mapping[str, str]] = None) -> Settings:
    """Build ``Settings`` from ``env`` (defaults to ``os.environ``).

    Raises ``ConfigError`` listing every problem found.
    """
    if env is None:
        env = os.environ
    errors: List[str] = []

    app_env = (_get(env, 'APP_ENV') or 'production').lower()
    if app_env not in ENVIRONMENTS:
        errors.append(f'APP_ENV must be one of {", ".join(ENVIRONMENTS)}')
        app_env = 'production'
    production = app_env == 'production'

    database_url = _database_url(env, errors)

    jwt_secret = _get(env, 'JWT_SECRET_KEY')
    if not jwt_secret:
        errors.append('JWT_SECRET_KEY is required')
    elif production and len(jwt_secret) < MIN_PRODUCTION_SECRET_LENGTH:
        errors.append('JWT_SECRET_KEY must be at least '
                      f'{MIN_PRODUCTION_SECRET_LENGTH} characters in '
                      'production')

    expires_hours = _get_float(env, 'JWT_ACCESS_TOKEN_EXPIRES_HOURS', 24.0,
                               0.05, errors)

    raw_origins = _get(env, 'CORS_ORIGINS')
    if raw_origins is None and not production:
        raw_origins = DEFAULT_DEV_ORIGINS
    origins = tuple(o.strip().rstrip('/')
                    for o in (raw_origins or '').split(',') if o.strip())
    if production and '*' in origins:
        errors.append('CORS_ORIGINS must be an explicit allowlist in '
                      'production ("*" is not allowed)')

    judge0_url = _get(env, 'JUDGE0_URL')
    if judge0_url is None and not production:
        judge0_url = 'http://localhost:2358'
    if not judge0_url:
        errors.append('JUDGE0_URL is required')
    elif not judge0_url.startswith(('http://', 'https://')):
        errors.append('JUDGE0_URL must start with http:// or https://')

    try:
        language_ids = parse_language_ids(
            _get(env, 'JUDGE0_LANGUAGE_IDS') or DEFAULT_LANGUAGE_IDS)
    except ValueError:
        errors.append('JUDGE0_LANGUAGE_IDS must look like "python=71,c=50"')
        language_ids = parse_language_ids(DEFAULT_LANGUAGE_IDS)

    judge0 = Judge0Settings(
        url=(judge0_url or '').rstrip('/'),
        auth_token=_get(env, 'JUDGE0_AUTH_TOKEN'),
        rapidapi_key=_get(env, 'JUDGE0_RAPIDAPI_KEY'),
        rapidapi_host=_get(env, 'JUDGE0_RAPIDAPI_HOST'),
        request_timeout=_get_float(env, 'JUDGE0_REQUEST_TIMEOUT', 10.0, 0.1,
                                   errors),
        max_retries=_get_int(env, 'JUDGE0_MAX_RETRIES', 2, 0, errors),
        sync_wait=_get_float(env, 'JUDGE0_SYNC_WAIT', 15.0, 0, errors),
        poll_interval=_get_float(env, 'JUDGE0_POLL_INTERVAL', 1.0, 0.05,
                                 errors),
        batch_size=_get_int(env, 'JUDGE0_BATCH_SIZE', 20, 1, errors),
        language_ids=language_ids,
    )

    max_content_length = _get_int(env, 'MAX_CONTENT_LENGTH', 1024 * 1024,
                                  1024, errors)
    log_level = (_get(env, 'LOG_LEVEL') or 'INFO').upper()

    if errors:
        raise ConfigError('Invalid configuration:\n  - ' +
                          '\n  - '.join(errors))

    return Settings(
        env=app_env,
        database_url=database_url,
        jwt_secret_key=jwt_secret,
        jwt_access_token_expires=timedelta(hours=expires_hours),
        cors_origins=origins,
        judge0=judge0,
        max_content_length=max_content_length,
        log_level=log_level,
    )
