proxy_http_version 1.1;
# Send the upstream's own host name so the API can also live behind a PaaS
# router (e.g. API_UPSTREAM=https://codeloop-api.up.railway.app).
proxy_set_header Host $proxy_host;
proxy_ssl_server_name on;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
# Submissions may wait for Judge0 (JUDGE0_SYNC_WAIT).
proxy_read_timeout 75s;
