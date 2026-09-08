import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/authApi.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("healthguard_token")));

  useEffect(() => {
    const token = localStorage.getItem("healthguard_token");
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("healthguard_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = useCallback((result) => {
    localStorage.setItem("healthguard_token", result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const login = useCallback(
    async (payload) => {
      const result = await authApi.login(payload);
      return saveSession(result);
    },
    [saveSession]
  );

  const registerPatient = useCallback(
    async (payload) => {
      const result = await authApi.registerPatient(payload);
      return saveSession(result);
    },
    [saveSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("healthguard_token");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, registerPatient, logout, isAuthenticated: Boolean(user) }),
    [user, loading, login, registerPatient, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
