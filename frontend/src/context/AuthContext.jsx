import { createContext, useContext, useState } from 'react';
import { adminUser } from '../mock/users';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('kidroo_admin_auth') === 'true';
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kidroo_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (username, password) => {
    if (username === adminUser.username && password === adminUser.password) {
      setIsAuthenticated(true);
      setUser(adminUser);
      localStorage.setItem('kidroo_admin_auth', 'true');
      localStorage.setItem('kidroo_admin_user', JSON.stringify(adminUser));
      return { success: true };
    }
    return { success: false, error: 'Invalid username or password' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('kidroo_admin_auth');
    localStorage.removeItem('kidroo_admin_user');
  };

  const setAuthData = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('kidroo_admin_auth', 'true');
    localStorage.setItem('kidroo_admin_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
