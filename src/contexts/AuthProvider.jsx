import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import { authService } from "../services/authService";

const TOKEN_KEY = "coventown_token";

function validRole(role) {
  return role === "admin" || role === "satpam";
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ token: null, user: null });
  const [loading, setLoading] = useState(() => Boolean(sessionStorage.getItem(TOKEN_KEY)));
  const [authError, setAuthError] = useState("");

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setSession({ token: null, user: null });
    setAuthError("");
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener("coventown:unauthorized", handleUnauthorized);

    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      return () => window.removeEventListener("coventown:unauthorized", handleUnauthorized);
    }

    let active = true;
    authService.me(token)
      .then((user) => {
        if (!active) return;
        if (!validRole(user?.role)) {
          clearSession();
          return;
        }
        setSession({ token, user });
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.status === 403) clearSession();
        else setAuthError(error.message || "Sesi tidak dapat diverifikasi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.removeEventListener("coventown:unauthorized", handleUnauthorized);
    };
  }, [clearSession]);

  const login = useCallback(async (username, pin) => {
    setAuthError("");
    const response = await authService.login(username, pin);
    const token = response?.token;
    if (typeof token !== "string" || !token) {
      throw new Error("API tidak mengembalikan token autentikasi.");
    }

    try {
      const user = await authService.me(token);
      if (!validRole(user?.role)) {
        throw new Error("Akun tidak memiliki role admin atau satpam.");
      }
      sessionStorage.setItem(TOKEN_KEY, token);
      setSession({ token, user });
      return user;
    } catch (error) {
      sessionStorage.removeItem(TOKEN_KEY);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const token = session.token;
    try {
      if (token) await authService.logout(token);
    } finally {
      clearSession();
    }
  }, [clearSession, session.token]);

  const value = useMemo(() => ({
    token: session.token,
    user: session.user,
    role: session.user?.role ?? null,
    loading,
    authError,
    login,
    logout,
  }), [session, loading, authError, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
