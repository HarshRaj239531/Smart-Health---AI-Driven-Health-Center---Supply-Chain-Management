import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Dynamically target backend from build-time environment variable, otherwise fallback to local hostname
const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
axios.defaults.baseURL = API_BASE;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Initialize Authorization Header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  const verifySession = async (authToken) => {
    try {
      setLoading(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      const res = await axios.get('/auth/me');
      setUser(res.data);
      setToken(authToken);
      localStorage.setItem('token', authToken);
    } catch (err) {
      console.error('Session validation failed:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      verifySession(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { token: authToken, user: userData } = res.data;
      localStorage.setItem('token', authToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      setUser(userData);
      setToken(authToken);
      return userData;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  const signup = async (name, email, password, role, healthCenterId) => {
    try {
      const res = await axios.post('/auth/signup', { name, email, password, role, healthCenterId });
      const { token: authToken, user: userData } = res.data;
      localStorage.setItem('token', authToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      setUser(userData);
      setToken(authToken);
      return userData;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, API_BASE }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export { API_BASE };
