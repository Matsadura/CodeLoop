"""Gunicorn settings for the production API container.

Submissions wait up to JUDGE0_SYNC_WAIT seconds for Judge0, so the worker
timeout must comfortably exceed it. Threads keep other requests flowing
while one waits on Judge0.
"""
import multiprocessing
import os

bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
workers = int(os.getenv('WEB_CONCURRENCY',
                        min(4, multiprocessing.cpu_count() * 2 + 1)))
worker_class = 'gthread'
threads = int(os.getenv('GUNICORN_THREADS', '4'))
timeout = int(os.getenv('GUNICORN_TIMEOUT', '60'))
graceful_timeout = 30
keepalive = 5
accesslog = '-'
errorlog = '-'
loglevel = os.getenv('LOG_LEVEL', 'info').lower()
# Trust X-Forwarded-* only from the reverse proxy in front of the API.
forwarded_allow_ips = os.getenv('FORWARDED_ALLOW_IPS', '127.0.0.1')
