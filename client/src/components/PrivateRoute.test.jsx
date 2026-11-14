import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ContextProvider } from './Context';
import { PrivateRoute } from './PrivateRoute';
import { requestJson, TOKEN_KEY } from '../tools/requestModule';

function renderAt(path) {
  return render(
    <ContextProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path='/login' element={<p>login page</p>} />
          <Route path='/secret' element={<PrivateRoute><p>secret page</p></PrivateRoute>} />
        </Routes>
      </MemoryRouter>
    </ContextProvider>,
  );
}

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('PrivateRoute', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('redirects anonymous visitors to the login page', () => {
    renderAt('/secret');
    expect(screen.getByText('login page')).toBeTruthy();
  });

  it('renders the page for a valid session', async () => {
    localStorage.setItem(TOKEN_KEY, 'valid');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, { id: 'u1', email: 'a@b.c' }));
    renderAt('/secret');
    expect(await screen.findByText('secret page')).toBeTruthy();
  });

  it('redirects to login once the token expires', async () => {
    localStorage.setItem(TOKEN_KEY, 'valid');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, { id: 'u1' }));
    renderAt('/secret');
    expect(await screen.findByText('secret page')).toBeTruthy();

    fetchMock.mockResolvedValue(json(401, { error: 'Session expired, please log in again' }));
    await act(() => requestJson('/tasks'));
    expect(await screen.findByText('login page')).toBeTruthy();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
