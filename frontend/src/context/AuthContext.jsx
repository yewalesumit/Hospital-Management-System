import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from localStorage (no network call)
  // The JWT will be validated naturally on the first protected API call.
  // If expired, the 401 interceptor will clear session and redirect to /login.
  useEffect(() => {
    try {
      const token  = localStorage.getItem('token');
      const stored = localStorage.getItem('user');
      if (token && stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      // Corrupted localStorage — clear it
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    // Backend returns { jwt, userId, roles }
    const data = await authService.login(username, password);
    localStorage.setItem('token', data.jwt);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  // Used by OAuth2Callback — data already in localStorage, just sync state
  const loginWithData = (data) => {
    localStorage.setItem('token', data.jwt);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  };

  const signup = async (userData) => {
    return await authService.signup(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const hasRole = (role) => user?.roles?.includes(role);

  const isAdmin   = () => hasRole('ADMIN');
  const isDoctor  = () => hasRole('DOCTOR');
  const isPatient = () => hasRole('PATIENT');

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, loginWithData, signup, logout,
      hasRole, isAdmin, isDoctor, isPatient,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
