import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataContext } from './dataContext';
import { clearToken, getToken, requestJson, setToken, SESSION_EXPIRED_EVENT } from '../tools/requestModule';

/**
 * Holds the authenticated user. The stored token is validated once on load
 * (GET /users); any later 401 response logs the user out through
 * SESSION_EXPIRED_EVENT.
 */
export const ContextProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [isLoading, setIsLoading] = useState(() => Boolean(getToken()));
	const [authError, setAuthError] = useState('');

	const loadUser = useCallback(async () => {
		const res = await requestJson('/users');
		if (res.ok) {
			setUser(res.data);
			setAuthError('');
		} else {
			setUser(null);
			if (res.status !== 401) {
				// Keep the token: the API may just be temporarily unreachable.
				setAuthError(res.data.error);
			}
		}
		setIsLoading(false);
		return res;
	}, []);

	useEffect(() => {
		if (getToken()) loadUser();
	}, [loadUser]);

	useEffect(() => {
		function onExpired() {
			setUser(null);
			setAuthError('Your session has expired. Please log in again.');
		}
		window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
		return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
	}, []);

	const login = useCallback(async (token) => {
		setToken(token);
		setIsLoading(true);
		return loadUser();
	}, [loadUser]);

	const logout = useCallback(() => {
		clearToken();
		setUser(null);
		setAuthError('');
	}, []);

	const value = useMemo(() => ({
		user,
		setUser,
		isAuthenticated: Boolean(user),
		setAuth: (authenticated) => { if (!authenticated) setUser(null); },
		isLoading,
		authError,
		login,
		logout,
	}), [user, isLoading, authError, login, logout]);

	return (
		<DataContext.Provider value={value}>
			{children}
		</DataContext.Provider>
	);
};
