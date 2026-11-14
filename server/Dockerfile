# syntax=docker/dockerfile:1
# CodeLoop API image. Targets:
#   dev  - Flask development server with auto-reload (docker-compose.yml)
#   prod - Gunicorn, non-root, no build tools (default)
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

FROM base AS dev
COPY requirements-dev.txt .
RUN pip install -r requirements-dev.txt
COPY . .
ENV APP_ENV=development
EXPOSE 5000
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["python", "-m", "api.app"]

FROM base AS prod
RUN groupadd --system app && useradd --system --gid app --home /app app \
    && chown app:app /app
COPY --chown=app:app . .
USER app
ENV APP_ENV=production \
    PORT=5000
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python -c "import os,urllib.request; urllib.request.urlopen('http://127.0.0.1:%s/api/health' % os.environ.get('PORT', '5000'), timeout=4)"
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["gunicorn", "--config", "gunicorn.conf.py", "api.app:create_app()"]
