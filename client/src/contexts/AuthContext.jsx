import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login, register, logout, getProfile } from '../services/auth.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = getCurrentUser();
      const token = localStorage.getItem('qube_token');

      if (token && storedUser) {
        setUser(storedUser);
        try {
          // Sync profile details in background
          const data = await getProfile();
          setUser(data.user);
        } catch (error) {
          console.error('Failed to sync user profile:', error.message);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const data = await login(email, password);
      setUser(data.session.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (email, password, name) => {
    setLoading(true);
    try {
      const data = await register(email, password, name);
      setUser(data.session.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    logout();
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const data = await getProfile();
      setUser(data.user);
      return data.user;
    } catch (e) {
      console.error('Error refreshing profile:', e.message);
    }
  };

  const value = {
    user,
    loading,
    loginUser,
    registerUser,
    logoutUser,
    refreshProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
