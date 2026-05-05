import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const STORAGE_KEY = "wardrobewiz-auth";

type AuthUser = {
  user_id: number;
  name: string;
  email: string;
  token: string;
};

type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // corrupted storage
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, message: data.detail ?? "Authentication failed." };
      }

      const data: AuthUser = await res.json();
      setUser(data);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return { success: true };
    } catch {
      return { success: false, message: "Unable to reach the server. Is the backend running?" };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, message: data.detail ?? "Registration failed." };
      }

      const data: AuthUser = await res.json();
      setUser(data);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return { success: true };
    } catch {
      return { success: false, message: "Unable to reach the server. Is the backend running?" };
    }
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
