import { useEffect, useLayoutEffect, useState } from "react";

import api from "../services/api";
import { loginUser, registerUser } from "../services/authService";
import { AuthContext } from "./auth-context";

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

const readStoredSession = () => {
  try {
    const storedSession = window.localStorage.getItem(STORAGE_KEY);

    if (!storedSession) {
      return null;
    }

    const session = JSON.parse(storedSession);

    if (isValidSession(session)) {
      return { token: session.token, user: session.user };
    }

    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  }

  return null;
};

const getAuthSession = (response) => {
  const session = response?.data;

  if (response?.success !== true || !isValidSession(session)) {
    throw new Error("The authentication response was incomplete.");
  }

  return { token: session.token, user: session.user };
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(readStoredSession);
  const [loading, setLoading] = useState(false);
  const user = session?.user ?? null;
  const token = session?.token ?? null;

  useLayoutEffect(() => {
    setAuthorizationToken(token);
  }, [token]);

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

          setSession(null);
          setAuthorizationToken(null);
        }

        return Promise.reject(error);
      },
    );

    return () => api.interceptors.response.eject(interceptorId);
  }, []);

  const saveSession = (session) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setSession(session);
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

    setSession(null);
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
