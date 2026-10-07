import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('rideshare-user');
    return raw ? JSON.parse(raw) : null;
  });

  const [token, setToken] = useState(localStorage.getItem('rideshare-token') || '');

  const login = ({ userData, accessToken }) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('rideshare-user', JSON.stringify(userData));
    localStorage.setItem('rideshare-token', accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('rideshare-user');
    localStorage.removeItem('rideshare-token');
  };

  const value = useMemo(() => ({ user, token, login, logout, isAuthenticated: Boolean(token) }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
