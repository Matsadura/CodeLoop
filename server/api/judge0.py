"""Minimal client for a Judge0-compatible code execution API.

Works with a self-hosted Judge0 CE instance and with hosted Judge0
(e.g. RapidAPI), depending on ``Judge0Settings``. Every HTTP call has a
timeout and a bounded number of retries, so no request can hang forever.
"""
import base64
import logging

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

# https://ce.judge0.com/#statuses-and-languages-status-get
STATUS_IN_QUEUE = 1
STATUS_PROCESSING = 2
STATUS_ACCEPTED = 3
STATUS_WRONG_ANSWER = 4
PENDING_STATUSES = (STATUS_IN_QUEUE, STATUS_PROCESSING)

RESULT_FIELDS = 'token,stdout,stderr,compile_output,message,status,time'


class Judge0Error(Exception):
    """The execution service returned an unexpected response"""


class Judge0Unavailable(Judge0Error):
    """The execution service could not be reached or is overloaded"""


def _b64encode(value):
    if value is None:
        return None
    return base64.b64encode(value.encode('utf-8')).decode('ascii')


def _b64decode(value):
    if value is None:
        return None
    try:
        return base64.b64decode(value).decode('utf-8', errors='replace')
    except (ValueError, TypeError):
        return value


class Judge0Client:
    """Thin wrapper around the Judge0 batch submission endpoints"""

    def __init__(self, settings, session=None):
        self.settings = settings
        self.session = session or requests.Session()
        # Retry connection failures for every method, but only retry
        # gateway errors for idempotent GETs so a POST never creates
        # duplicate executions.
        retry = Retry(total=settings.max_retries,
                      connect=settings.max_retries,
                      read=0,
                      status=settings.max_retries,
                      status_forcelist=(502, 503, 504),
                      allowed_methods=frozenset({'GET'}),
                      backoff_factor=0.3,
                      raise_on_status=False)
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)
        self.session.headers.update(settings.headers())

    def _request(self, method, path, **kwargs):
        url = f'{self.settings.url}{path}'
        try:
            response = self.session.request(
                method, url, timeout=self.settings.request_timeout, **kwargs)
        except requests.RequestException as error:
            logger.warning('Judge0 %s %s failed: %s', method, path,
                           error.__class__.__name__)
            raise Judge0Unavailable(
                'Code execution service is unreachable') from error
        if response.status_code in (429, 502, 503, 504):
            raise Judge0Unavailable(
                f'Code execution service is busy (HTTP '
                f'{response.status_code})')
        if response.status_code >= 400:
            logger.warning('Judge0 %s %s returned HTTP %s', method, path,
                           response.status_code)
            raise Judge0Error(
                f'Code execution service rejected the request (HTTP '
                f'{response.status_code})')
        try:
            return response.json()
        except ValueError as error:
            raise Judge0Error(
                'Code execution service returned invalid JSON') from error

    def language_id(self, language):
        """Judge0 language id for ``language`` or None if unsupported"""
        return self.settings.language_ids.get(language)

    def submit_batch(self, items):
        """Create executions; ``items`` are dicts with ``source_code``,
        ``language_id``, ``stdin`` and ``expected_output``.

        Returns the list of tokens in the same order.
        """
        tokens = []
        size = self.settings.batch_size
        for start in range(0, len(items), size):
            chunk = items[start:start + size]
            payload = {'submissions': [{
                'source_code': _b64encode(item['source_code']),
                'language_id': item['language_id'],
                'stdin': _b64encode(item.get('stdin')),
                'expected_output': _b64encode(item.get('expected_output')),
            } for item in chunk]}
            data = self._request('POST', '/submissions/batch',
                                 params={'base64_encoded': 'true'},
                                 json=payload)
            if not isinstance(data, list) or len(data) != len(chunk):
                raise Judge0Error('Unexpected batch submission response')
            for entry in data:
                token = entry.get('token') if isinstance(entry, dict) else None
                if not token:
                    raise Judge0Error('Code execution service rejected a '
                                      'test case')
                tokens.append(token)
        return tokens

    def get_batch(self, tokens):
        """Return ``{token: result}`` for ``tokens`` with decoded output"""
        results = {}
        size = self.settings.batch_size
        for start in range(0, len(tokens), size):
            chunk = tokens[start:start + size]
            data = self._request('GET', '/submissions/batch',
                                 params={'tokens': ','.join(chunk),
                                         'base64_encoded': 'true',
                                         'fields': RESULT_FIELDS})
            entries = data.get('submissions') if isinstance(data, dict) \
                else None
            if not isinstance(entries, list):
                raise Judge0Error('Unexpected batch result response')
            for entry in entries:
                if not isinstance(entry, dict) or not entry.get('token'):
                    continue
                for key in ('stdout', 'stderr', 'compile_output', 'message'):
                    entry[key] = _b64decode(entry.get(key))
                results[entry['token']] = entry
        return results
