import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@api/services';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user on mount
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            authAPI.getProfile()
                .then((res) => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('accessToken');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await authAPI.login({ email, password });
        localStorage.setItem('accessToken', res.data.accessToken);
        setUser(res.data.user);
        toast.success('Welcome back! 🎉');
        return res.data;
    }, []);

    const register = useCallback(async (data) => {
        const res = await authAPI.register(data);
        localStorage.setItem('accessToken', res.data.accessToken);
        setUser(res.data.user);
        toast.success('Account created successfully! 🎉');
        return res.data;
    }, []);

    const logout = useCallback(async () => {
        try { await authAPI.logout(); } catch (e) { }
        localStorage.removeItem('accessToken');
        setUser(null);
        toast.success('Logged out');
    }, []);

    const updateProfile = useCallback(async (data) => {
        const res = await authAPI.updateProfile(data);
        setUser(res.data);
        toast.success('Profile updated');
        return res.data;
    }, []);

    const value = {
        user, loading, isAuthenticated: !!user,
        login, register, logout, updateProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
