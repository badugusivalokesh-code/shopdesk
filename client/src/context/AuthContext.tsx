import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  AUTH_EXPIRED_EVENT,
  apiClient,
  clearStoredAuth,
  getStoredAuthToken,
  setStoredAuthSession,
  setStoredAuthUser,
} from "@/api/client";
import {
  isCurrentUserResponse,
  isLoginResponse,
  toSafeUser,
  type CurrentUserResponse,
  type LoginRequest,
  type LoginResponse,
  type User,
} from "@/api/types";

interface AuthContextValue {
  authenticated: boolean;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  user: User | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const token = getStoredAuthToken();

    if (!token) {
      clearStoredAuth();
      setUser(null);
      return null;
    }

    try {
      const response = await apiClient.get<CurrentUserResponse>("/auth/me");

      if (!isCurrentUserResponse(response.data)) {
        throw new Error("The current user response was invalid.");
      }

      const nextUser = toSafeUser(response.data.user);

      if (!nextUser) {
        throw new Error("The current user response was invalid.");
      }

      if (getStoredAuthToken() !== token) {
        return null;
      }

      setStoredAuthUser(nextUser);
      setUser(nextUser);
      return nextUser;
    } catch (error: unknown) {
      if (getStoredAuthToken() === token) {
        clearStoredAuth();
        setUser(null);
      }
      throw error;
    }
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<User> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", {
      email: credentials.email.trim(),
      password: credentials.password,
    });

    if (!isLoginResponse(response.data)) {
      throw new Error("The login response was invalid.");
    }

    const nextUser = toSafeUser(response.data.user);

    if (!nextUser) {
      throw new Error("The login response was invalid.");
    }

    setStoredAuthSession(response.data.token, nextUser);
    setUser(nextUser);
    return nextUser;
  }, []);

  useEffect(() => {
    function handleAuthExpired() {
      clearStoredAuth();
      setUser(null);
      setLoading(false);
      navigate("/login", { replace: true });
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, [navigate]);

  useEffect(() => {
    let isCurrent = true;

    async function restoreSession() {
      if (!getStoredAuthToken()) {
        if (isCurrent) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        await refreshUser();
      } catch {
        // refreshUser already cleared a failed session when it was still current.
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isCurrent = false;
    };
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticated: user !== null,
      loading,
      login,
      logout,
      refreshUser,
      user,
    }),
    [loading, login, logout, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
