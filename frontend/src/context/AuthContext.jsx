import { createContext, useContext, useEffect, useState } from "react";

import api from "../services/api";
import { loginUser, registerUser } from "../services/authService";

const AuthContext = createContext(null);
const STORAGE_KEY = "placement-assistant-auth-session";

const setAuthorizationToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

const isValidSession = (session) =>
  typeof session?.token === "string" &&
  session.token.length > 0 &&
  typeof session.user?.id === "string" &&
  typeof session.user?.fullName === "string" &&
  typeof session.user?.email === "string";

const getAuthSession = (response) => {
  const session = response?.data;

  if (response?.success !== true || !isValidSession(session)) {
    throw new Error("The authentication response was incomplete.");
  }

  return { token: session.token, user: session.user };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthorizationToken(null);

    try {
      const storedSession = window.localStorage.getItem(STORAGE_KEY);

      if (storedSession) {
        const session = JSON.parse(storedSession);

        if (isValidSession(session)) {
          setUser(session.user);
          setToken(session.token);
          setAuthorizationToken(session.token);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage can be unavailable in restricted browser contexts.
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const requestUrl = error?.config?.url || "";

        if (
          error?.response?.status === 401 &&
          !requestUrl.startsWith("/api/auth/")
        ) {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch {
            // Clear in-memory authentication if storage is unavailable.
          }

          setUser(null);
          setToken(null);
          setAuthorizationToken(null);
        }

        return Promise.reject(error);
      },
    );

    return () => api.interceptors.response.eject(interceptorId);
  }, []);

  const saveSession = (session) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setToken(session.token);
    setUser(session.user);
    setAuthorizationToken(session.token);
    return session.user;
  };

  const login = async (credentials) => {
    setLoading(true);

    try {
      const response = await loginUser(credentials);
      return saveSession(getAuthSession(response));
    } finally {
      setLoading(false);
    }
  };

  const register = async (userDetails) => {
    setLoading(true);

    try {
      const response = await registerUser(userDetails);
      return saveSession(getAuthSession(response));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Clear in-memory authentication even if browser storage is unavailable.
    }

    setUser(null);
    setToken(null);
    setAuthorizationToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
};
