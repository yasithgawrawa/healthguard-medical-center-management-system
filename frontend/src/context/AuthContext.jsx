import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/authApi.js";
import { setAuthToken } from "../services/apiClient.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("healthguard_token")));
  const [sessionVersion, setSessionVersion] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("healthguard_token");
    if (!token) {
      setAuthToken(null);
      setLoading(false);
      return;
    }

    setAuthToken(token);
    authApi
      .me()
      .then((currentUser) => {
        setUser(currentUser);
        setSessionVersion((version) => version + 1);
      })
      .catch(() => {
        localStorage.removeItem("healthguard_token");
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = useCallback((result) => {
    localStorage.setItem("healthguard_token", result.token);
    setAuthToken(result.token);
    setUser(result.user);
    setSessionVersion((version) => version + 1);
    setLoading(false);
    return result.user;
  }, []);

  const login = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        const result = await authApi.login(payload);
        return saveSession(result);
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  const registerPatient = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        const result = await authApi.registerPatient(payload);
        return saveSession(result);
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  const logout = useCallback(() => {
    sessionStorage.setItem("healthguard_logout_redirect", "1");
    localStorage.removeItem("healthguard_token");
    setAuthToken(null);
    setUser(null);
    setSessionVersion((version) => version + 1);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, registerPatient, logout, isAuthenticated: Boolean(user), sessionVersion }),
    [user, loading, login, registerPatient, logout, sessionVersion]
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
