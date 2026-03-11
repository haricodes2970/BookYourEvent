import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

/**
 * Decode JWT payload without a library.
 * Returns null if the token is malformed.
 */
const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

/**
 * Returns true if the token is expired (or will expire within the
 * given bufferSeconds window — useful for proactive refresh).
 */
const isTokenExpired = (token, bufferSeconds = 0) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now() + bufferSeconds * 1000;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('token');
    // Immediately discard a token that's already expired on load
    if (stored && isTokenExpired(stored)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
    return stored || null;
  });

  // ── Auto-logout: schedule a timeout for when the token actually expires ──
  useEffect(() => {
    if (!token) return;

    const decoded = decodeToken(token);
    if (!decoded?.exp) return;

    const msUntilExpiry = decoded.exp * 1000 - Date.now();
    if (msUntilExpiry <= 0) {
      logout();
      return;
    }

    const timer = setTimeout(() => {
      console.info('[Auth] Token expired — logging out.');
      logout();
    }, msUntilExpiry);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback((userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  /**
   * Update only the stored user object (e.g. after a profile edit).
   * The token stays the same.
   */
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isTokenExpired }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { isTokenExpired };
