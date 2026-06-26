import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshAdmin() {
    const res = await api.get('/auth/me');
    setAdmin(res.data.admin);
    return res.data.admin;
  }

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setLoading(false);
      return;
    }

    refreshAdmin()
      .catch(() => localStorage.removeItem('adminToken'))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    admin,
    loading,
    refreshAdmin,
    async login(email, password) {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('adminToken', res.data.token);
      setAdmin(res.data.admin);
      return res.data.admin;
    },
    async updateProfile(payload) {
      const res = await api.put('/auth/profile', payload);
      setAdmin(res.data.admin);
      return res.data;
    },
    logout() {
      localStorage.removeItem('adminToken');
      setAdmin(null);
    }
  }), [admin, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
