import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/auth';
import { setAccessToken, setLogoutHandler } from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessTokenState, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
  }, []);

  // Register logout callback with axios interceptor
  useEffect(() => {
    setLogoutHandler(() => {
      logout();
    });
  }, [logout]);

  // Restore session on app load using refresh token
  useEffect(() => {
    async function restoreSession() {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await authApi.refresh(storedRefreshToken);
        setAccessToken(data.accessToken);
        setAccessTokenState(data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        setUser(data.user);
      } catch (err) {
        localStorage.removeItem('refreshToken');
        setAccessToken(null);
        setAccessTokenState(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async ({ email, password }) => {
    try {
      const data = await authApi.login({ email, password });
      setAccessToken(data.accessToken);
      setAccessTokenState(data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      return data;
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
      throw err;
    }
  };

  const register = async ({ name, email, password, phone }) => {
    try {
      const data = await authApi.register({ name, email, password, phone });
      setAccessToken(data.accessToken);
      setAccessTokenState(data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      toast.success('Registration successful! Welcome to CivicEye.');
      return data;
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
      throw err;
    }
  };

  const updateProfile = async (formData) => {
    try {
      const updatedUser = await authApi.updateProfile(formData);
      setUser((prev) => ({ ...prev, ...updatedUser }));
      toast.success('Profile updated successfully!');
      return updatedUser;
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
      throw err;
    }
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully. Please log in again.');
      await logout();
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
      throw err;
    }
  };

  const value = {
    user,
    accessToken: accessTokenState,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin' || user?.role === 'officer',
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

