// React context that represents the authentication state.
// Wraps AuthService and holds the logged-in user in state, so every component
// updates automatically on login/logout.

import { createContext, useContext, useState, useCallback } from 'react';
import { useServices } from './ServicesContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { auth } = useServices();
  const [user, setUser] = useState(() => auth.getCurrentUser());

  const login = useCallback(async (email, password) => {
    const profile = await auth.login(email, password);
    setUser(profile);
    return profile;
  }, [auth]);

  const register = useCallback(async (payload) => {
    const profile = await auth.register(payload);
    setUser(profile);
    return profile;
  }, [auth]);

  const logout = useCallback(() => {
    auth.logout();
    setUser(null);
  }, [auth]);

  const value = { user, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
