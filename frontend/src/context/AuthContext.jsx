import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getStoredUser,
  getStoredToken,
  saveAuthData,
  clearAuthData,
} from '../services/api';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  const isLoggedIn = !!token && !!user;
  const isHost = user?.host === true;
  const isAdmin = user?.role === 'ADMIN';

  const openAuthModal = useCallback((mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    saveAuthData(data);
    setToken(data.accessToken);
    setUser(data.user);
    closeAuthModal();
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    saveAuthData(data);
    setToken(data.accessToken);
    setUser(data.user);
    closeAuthModal();
    return data;
  };

  const logout = useCallback(() => {
    clearAuthData();
    setToken(null);
    setUser(null);
    window.location.href = '/';
  }, []);

  const becomeHost = async () => {
    await authService.becomeHost();
    const updated = await authService.me();
    setUser(updated);
    const existing = getStoredUser() || {};
    saveAuthData({ user: { ...existing, ...updated } });
    return updated;
  };

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      saveAuthData({ user: merged });
      return merged;
    });
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      openAuthModal('login');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [openAuthModal]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn,
        isHost,
        isAdmin,
        login,
        register,
        logout,
        becomeHost,
        updateUser,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
