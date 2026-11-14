# syntax=docker/dockerfile:1
# Self-built Piston (https://github.com/engineer-man/piston) with Python 3.12
# preinstalled. Works on amd64 and arm64: the official image is amd64-only
# and based on Debian buster (EOL), and its packages are x86-only.
#
# Host requirements: pure cgroup v2 and a privileged container (isolate).

ARG PISTON_COMMIT=de2b365ac759670a3a0d13ea208a0869a92c7e64
ARG ISOLATE_COMMIT=af6db68042c3aa0ded80787fbb78bc0846ea2114
ARG PYTHON_VERSION=3.12.0

# --- Piston API source, pinned ------------------------------------------
FROM debian:bookworm-slim AS source
ARG PISTON_COMMIT
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN git init -q /src && cd /src \
    && git remote add origin https://github.com/engineer-man/piston.git \
    && git fetch -q --depth 1 origin "$PISTON_COMMIT" \
    && git checkout -q FETCH_HEAD

# --- isolate sandbox (the fork Piston pins) ------------------------------
FROM buildpack-deps:bookworm AS isolate
ARG ISOLATE_COMMIT
RUN apt-get update && apt-get install -y --no-install-recommends libcap-dev \
    && rm -rf /var/lib/apt/lists/*
RUN git clone -q https://github.com/envicutor/isolate.git /tmp/isolate \
    && cd /tmp/isolate && git checkout -q "$ISOLATE_COMMIT" \
    && make -j"$(nproc)" install

# --- Python runtime built for this architecture ---------------------------
FROM buildpack-deps:bookworm AS python
ARG PYTHON_VERSION
ENV PREFIX=/piston/packages/python/${PYTHON_VERSION}
RUN curl -fsSL "https://www.python.org/ftp/python/${PYTHON_VERSION}/Python-${PYTHON_VERSION}.tgz" \
        -o /tmp/python.tgz \
    && mkdir /tmp/python && tar xzf /tmp/python.tgz -C /tmp/python --strip-components=1 \
    && cd /tmp/python \
    && ./configure --prefix "$PREFIX" --without-ensurepip >/dev/null \
    && make -j"$(nproc)" >/dev/null \
    && make install >/dev/null \
    && rm -rf /tmp/python /tmp/python.tgz \
    && find "$PREFIX" -name '__pycache__' -prune -exec rm -rf {} + \
    && rm -rf "$PREFIX"/lib/python3.*/test "$PREFIX"/lib/python3.*/idlelib

# --- Node dependencies (waitpid is a native module built with node-gyp) ----
FROM node:20-bookworm AS node_modules
WORKDIR /piston_api
COPY --from=source /src/api/package.json /src/api/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# --- Final image -----------------------------------------------------------
FROM node:20-bookworm-slim
ARG PYTHON_VERSION
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
        bash coreutils util-linux procps locales libcap2 \
        libssl3 zlib1g libffi8 libsqlite3-0 libbz2-1.0 liblzma5 libreadline8 \
        libncursesw6 libgdbm6 libuuid1 \
    && rm -rf /var/lib/apt/lists/* \
    && sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen >/dev/null \
    && useradd -M piston

COPY --from=isolate /usr/local/bin/isolate /usr/local/bin/isolate
COPY --from=isolate /usr/local/etc/isolate /usr/local/etc/isolate

WORKDIR /piston_api
COPY --from=node_modules /piston_api ./
COPY --from=source /src/api/src ./src

# Install Python as a Piston package: the same files `ppman` would create.
COPY --from=python /piston/packages/python /piston/packages/python
COPY --from=source /src/packages/python/3.12.0/run /src/packages/python/3.12.0/environment \
    /piston/packages/python/${PYTHON_VERSION}/
RUN cd /piston/packages/python/${PYTHON_VERSION} \
    && chmod +x run \
    && printf '{"language":"python","version":"%s","build_platform":"docker-%s","aliases":["py","py3","python3"]}\n' \
        "${PYTHON_VERSION}" "$(uname -m)" > pkg-info.json \
    && env -i bash -c 'cd /piston/packages/python/'"${PYTHON_VERSION}"'; source environment; env' \
        | grep -v -E '^(PWD|OLDPWD|_|SHLVL)=' > .env \
    && date +%s > .ppman-installed \
    && bash -c 'source environment && ./run -c "import sys, ssl, sqlite3; print(\"python\", sys.version.split()[0], \"ok\")"'

ENV PISTON_OUTPUT_MAX_SIZE=65536 \
    PISTON_MAX_CONCURRENT_JOBS=4 \
    PISTON_DISABLE_NETWORKING=true
EXPOSE 2000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:2000/api/v2/runtimes', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["/piston_api/src/docker-entrypoint.sh"]
