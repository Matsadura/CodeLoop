/**
 * Thin fetch wrapper used by every API call.
 *
 * Always resolves (never throws) to `{ ok, status, data }`:
 * - `data` is the parsed JSON body, or `{ error }` when the body is empty or
 *   not JSON (e.g. an HTML error page from a proxy).
 * - Network failures resolve with `status: 0` and a readable error.
 * - A 401 on an authenticated request clears the stored token and emits
 *   SESSION_EXPIRED_EVENT so the app can send the user to the login page.
 */
export const TOKEN_KEY = '_token';
export const SESSION_EXPIRED_EVENT = 'codeloop:session-expired';
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const STATUS_MESSAGES = {
  0: 'Cannot reach the server. Check your connection and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You are not allowed to do that.',
  404: 'Not found.',
  413: 'The request is too large.',
  429: 'Too many requests. Please slow down.',
  500: 'Something went wrong on our side. Please try again.',
  502: 'The server is unavailable. Please try again shortly.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
  504: 'The server took too long to respond. Please try again.',
};

export function errorMessageFor(status) {
  return STATUS_MESSAGES[status] || (status >= 500 ? STATUS_MESSAGES[500] : 'Request failed.');
}

function safeStorage(action) {
  try {
    return action(window.localStorage);
  } catch {
    return null;
  }
}

export const getToken = () => safeStorage((s) => s.getItem(TOKEN_KEY));
export const setToken = (token) => safeStorage((s) => s.setItem(TOKEN_KEY, token));
export const clearToken = () => safeStorage((s) => s.removeItem(TOKEN_KEY));

async function parseBody(response) {
  let text = '';
  try {
    text = await response.text();
  } catch {
    text = '';
  }
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!response.ok) {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return { ...data, error: data.error || errorMessageFor(response.status) };
    }
    return { error: errorMessageFor(response.status) };
  }
  if (data === null) {
    return text ? { error: 'The server returned an unexpected response.' } : {};
  }
  return data;
}

export const request = async (url, options = {}) => {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
  } catch {
    return { ok: false, status: 0, data: { error: errorMessageFor(0) } };
  }

  const data = await parseBody(response);
  if (response.status === 401 && token) {
    clearToken();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  return { ok: response.ok, status: response.status, data };
};

/** Convenience helper for JSON requests. */
export const requestJson = (url, method = 'GET', body) => request(url, {
  method,
  headers: { 'Content-Type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
