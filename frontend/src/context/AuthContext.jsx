import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('aetheris_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.error('Session validation error:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const handleAuthSuccess = (data) => {
    localStorage.setItem('aetheris_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success) {
      handleAuthSuccess(res);
      return { success: true };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const register = async (name, email, password) => {
    const res = await api.register({ name, email, password });
    if (res.success) {
      handleAuthSuccess(res);
      return { success: true };
    }
    return { success: false, message: res.message || 'Registration failed' };
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();
    if (res.success) {
      handleAuthSuccess(res);
      return { success: true };
    }
    return { success: false, message: res.message || 'Demo login failed' };
  };

  const logout = () => {
    localStorage.removeItem('aetheris_token');
    setToken(null);
    setUser(null);
  };

  const updatePreferences = async (prefs) => {
    try {
      const res = await api.updatePreferences(prefs);
      if (res.success && user) {
        setUser(prev => ({
          ...prev,
          preferences: { ...prev.preferences, ...prefs }
        }));
      }
      return res;
    } catch (err) {
      console.error('Preferences update error:', err);
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        updatePreferences
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
