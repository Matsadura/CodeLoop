import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { DataContext } from './dataContext';
import PageStatus from './PageStatus';

/**
 * Renders `children` only for authenticated users; others are redirected
 * to /login and come back to the requested page after logging in.
 * With `open`, children always render (public pages).
 */
export const PrivateRoute = ({ open = false, children }) => {
	const { isAuthenticated, isLoading } = useContext(DataContext);
	const location = useLocation();

	if (open) return children;
	if (isLoading) return <PageStatus loading message='Checking your session...' />;
	if (!isAuthenticated) return <Navigate to='/login' replace state={{ from: location }} />;
	return children;
};
