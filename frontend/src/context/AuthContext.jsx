import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const storedAdmin = localStorage.getItem('adminInfo');
      return storedAdmin ? JSON.parse(storedAdmin) : null;
    } catch (e) {
      console.error('Error parsing adminInfo from localStorage', e);
      localStorage.removeItem('adminInfo');
      return null;
    }
  });

  const login = async (username, password) => {
    const { data } = await api.post('/admin/login', { username, password });
    setAdmin(data);
    localStorage.setItem('adminInfo', JSON.stringify(data));
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('adminInfo');
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
