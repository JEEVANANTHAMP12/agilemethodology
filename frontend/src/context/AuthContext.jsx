import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rover_auth_token');
    const storedUser = localStorage.getItem('rover_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Verify with /me
        api.auth.me()
          .then((u) => setUser(u))
          .catch(() => {
            // Token might be expired, clear session
            localStorage.removeItem('rover_auth_token');
            localStorage.removeItem('rover_user');
            setUser(null);
          })
          .finally(() => setLoading(false));
      } catch (e) {
        setUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const data = await api.auth.login(username, password);
    localStorage.setItem('rover_auth_token', data.access_token);
    localStorage.setItem('rover_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await api.auth.register(userData);
    localStorage.setItem('rover_auth_token', data.access_token);
    localStorage.setItem('rover_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('rover_auth_token');
    localStorage.removeItem('rover_user');
    setUser(null);
    try {
      api.auth.logout();
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
