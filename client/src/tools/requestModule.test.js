import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { request, requestJson, SESSION_EXPIRED_EVENT, TOKEN_KEY } from './requestModule';

function mockFetch(status, body, contentType = 'application/json') {
  const response = new Response(body, { status, headers: { 'Content-Type': contentType } });
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
}

describe('request', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('parses JSON and adds the bearer token', async () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    const fetchMock = mockFetch(200, JSON.stringify([{ id: 1 }]));
    const res = await requestJson('/tasks');
    expect(res).toEqual({ ok: true, status: 200, data: [{ id: 1 }] });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/tasks$/);
    expect(options.headers.Authorization).toBe('Bearer abc');
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('turns non-JSON error pages into a readable error', async () => {
    mockFetch(502, '<html>Bad Gateway</html>', 'text/html');
    const res = await request('/tasks');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(502);
    expect(res.data.error).toMatch(/unavailable/i);
  });

  it('handles empty successful bodies', async () => {
    mockFetch(204, null);
    const res = await request('/tasks/1', { method: 'DELETE' });
    expect(res).toEqual({ ok: true, status: 204, data: {} });
  });

  it('keeps API error messages and adds a fallback when missing', async () => {
    mockFetch(409, JSON.stringify({ error: 'Task name already exists' }));
    expect((await request('/tasks')).data.error).toBe('Task name already exists');
    mockFetch(500, JSON.stringify({ unexpected: true }));
    expect((await request('/tasks')).data.error).toMatch(/went wrong/i);
  });

  it('resolves (does not throw) when the API is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const res = await request('/tasks');
    expect(res).toEqual({ ok: false, status: 0, data: { error: expect.stringMatching(/reach the server/) } });
  });

  it('clears the token and emits an event when the session expired', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired');
    mockFetch(401, JSON.stringify({ error: 'Session expired, please log in again' }));
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);
    const res = await request('/users');
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
    expect(res.status).toBe(401);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not emit session-expired for anonymous 401s such as a failed login', async () => {
    mockFetch(401, JSON.stringify({ error: 'Invalid email or password' }));
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);
    const res = await requestJson('/login', 'POST', { email: 'a', password: 'b' });
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
    expect(res.data.error).toBe('Invalid email or password');
    expect(listener).not.toHaveBeenCalled();
  });
});
