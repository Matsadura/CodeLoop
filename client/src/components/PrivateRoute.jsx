import React, { useEffect, useState } from "react";
import { DataContext } from "./Context";
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { request } from "../tools/requestModule";

export const PrivateRoute = ({ open = false, children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const { setAuth, setUser, isAuthenticated } = useContext(DataContext);
    const token = localStorage.getItem("_token");

    if (!token && open) {
        return children
    }
    const headers = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    useEffect(() => {
        request("/users", headers)
            .then((res) => {
                if (res.status === 200) {
                    setUser(res.data);
                    setAuth(true);
                } else {
                    setAuth(false);
                    setUser(null);
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    if (isLoading) return null;

    if (open) {
        return children;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};
