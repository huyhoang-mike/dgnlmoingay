/**
 * Auth Context
 * Manages Google OAuth login, JWT storage, and user state.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { googleLogin as apiGoogleLogin, getMe } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('dgnl-token'));
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return null;
    }
    const response = await getMe(token);
    setUser(response.data);
    return response.data;
  }, [token]);

  // Verify stored token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        await refreshUser();
      } catch {
        localStorage.removeItem('dgnl-token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token, refreshUser]);

  const login = useCallback(async (credential) => {
    const response = await apiGoogleLogin(credential);
    const { access_token, user: userData } = response.data;
    localStorage.setItem('dgnl-token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dgnl-token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isEnrolled: user?.is_enrolled || user?.is_admin || false,
        isAdmin: user?.is_admin || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
