import { createContext, useCallback, useEffect, useState } from "react";

import { authService } from "../../services/authService";
import { authStorage } from "../../utils/storage";
import { toast } from "../../utils/toast";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authStorage.getUser());
  const [token, setToken] = useState(authStorage.getToken());
  const [loading, setLoading] = useState(Boolean(authStorage.getToken()));

  const syncUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      authStorage.setUser(nextUser);
    } else {
      authStorage.clear();
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authService.me();
        syncUser(currentUser);
      } catch (_error) {
        syncUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  const login = async (payload) => {
    const data = await authService.login(payload);
    syncUser(data.user);
    setToken(data.token);
    authStorage.setToken(data.token);
    toast.success("Logged in successfully");
    return data;
  };

  const logout = () => {
    syncUser(null);
    setToken(null);
    toast.success("Logged out successfully");
  };

  const touchLastSeen = useCallback((lastSeenAt = new Date().toISOString()) => {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      const nextUser = {
        ...currentUser,
        lastSeenAt,
      };

      authStorage.setUser(nextUser);
      return nextUser;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token),
        login,
        logout,
        touchLastSeen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

