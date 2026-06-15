import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('farm_token');
        if (token) {
            api.getMe().then(data => {
                setUser(data.user);
                connectSocket(token);
            }).catch(() => localStorage.removeItem('farm_token')).finally(() => setLoading(false));
        } else setLoading(false);
    }, []);

    const login = async (username, password) => {
        const data = await api.login(username, password);
        localStorage.setItem('farm_token', data.token);
        setUser(data.user);
        connectSocket(data.token);
        return data;
    };

    const register = async (username, password) => {
        const data = await api.register(username, password);
        localStorage.setItem('farm_token', data.token);
        setUser(data.user);
        connectSocket(data.token);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('farm_token');
        disconnectSocket();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
