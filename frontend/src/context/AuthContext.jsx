// Shared Authentication | Frontend Logic | Share the current user session and authentication actions across the frontend.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/authApi.js";
import { setAuthToken } from "../services/apiClient.js";

const AuthContext = createContext(null);

// Shared Authentication | Frontend Logic | Restore the saved session and expose authentication actions to descendant components.
export const AuthProvider = ({ children }) => {
  // Keep the current user in React state while the token is persisted in localStorage.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("healthguard_token")));
  // Increment the session version so dependent views can refresh after authentication changes.
  const [sessionVersion, setSessionVersion] = useState(0);

  // Restore the stored session on mount and clear invalid or expired authentication state.
  useEffect(() => {
    const token = localStorage.getItem("healthguard_token");
    if (!token) {
      setAuthToken(null);
      setLoading(false);
      return;
    }

    setAuthToken(token);
    // View Profile | Submit Logic | Call authApi.me for this feature.
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

  // Login | Submit Logic | Persist the token, configure API authorization, and update the current user session.
  // Patient Registration | Submit Logic | Persist the token, configure API authorization, and update the current user session.
  const saveSession = useCallback((result) => {
    localStorage.setItem("healthguard_token", result.token);
    setAuthToken(result.token);
    setUser(result.user);
    setSessionVersion((version) => version + 1);
    setLoading(false);
    return result.user;
  }, []);

  // Login | Frontend Logic | Authenticate credentials and save the resulting user and token in the shared session.
  const login = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        // Login | Submit Logic | Call authApi.login for this feature.
        const result = await authApi.login(payload);
        return saveSession(result);
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  // Patient Registration | Frontend Logic | Create a patient account and save the resulting authenticated session.
  const registerPatient = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        // Patient Registration | Submit Logic | Call authApi.registerPatient for this feature.
        const result = await authApi.registerPatient(payload);
        return saveSession(result);
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  // Logout | Frontend Logic | Remove the stored token, clear API authorization, and reset the current user.
  const logout = useCallback(() => {
    sessionStorage.setItem("healthguard_logout_redirect", "1");
    localStorage.removeItem("healthguard_token");
    setAuthToken(null);
    setUser(null);
    setSessionVersion((version) => version + 1);
  }, []);

  // Shared Authentication | Derived Data | Cache value until the listed source values change.
  const value = useMemo(
    () => ({ user, loading, login, registerPatient, logout, isAuthenticated: Boolean(user), sessionVersion }),
    [user, loading, login, registerPatient, logout, sessionVersion]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Shared Authentication | Frontend Logic | Read the shared authentication context and require an enclosing AuthProvider.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
