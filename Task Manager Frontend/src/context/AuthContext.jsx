import { createContext, useContext, useMemo, useState } from 'react';
import { loginUser, logoutUser, registerUser } from '../api/auth';
import { clearAccessToken, getAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAccessToken());
  const [isLoading] = useState(false);

  const login = async (credentials) => {
    const result = await loginUser(credentials);
    setToken(getAccessToken());
    return result;
  };

  const register = async (credentials) => {
    const result = await registerUser(credentials);
    return result;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.warn('Logout request failed:', error.message);
    } finally {
      clearAccessToken();
      setToken(null);
    }
  };

  const value = useMemo(() => ({
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    login,
    register,
    logout,
  }), [token, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
