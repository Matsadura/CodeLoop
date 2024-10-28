import { createContext, useState } from "react";

export const DataContext = createContext();

export const ContextProvider = ({ children }) => {
	const [isAuthenticated, setAuth] = useState(false);
	const [user, setUser] = useState(null);

	return (
		<DataContext.Provider value={{ setAuth, setUser, isAuthenticated, user }}>
			{children}
		</DataContext.Provider>
	);
};
