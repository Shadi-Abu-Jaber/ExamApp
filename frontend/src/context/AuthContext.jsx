import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { meRequest } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem('examflow_token');
    if (!token) {
      setLoading(false);
      return;
    }
    meRequest()
      .then((res) => setUser(res.data))
      .catch(() => {
        window.localStorage.removeItem('examflow_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (userData, token) => {
    window.localStorage.setItem('examflow_token', token);
    setUser(userData);
  };

  const logout = () => {
    window.localStorage.removeItem('examflow_token');
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout, isAuthenticated: !!user }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
