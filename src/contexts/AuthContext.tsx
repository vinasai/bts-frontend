// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, type ReactNode } from "react";
import axiosInstance from "../utils/axiosInstance";

// ✅ Define User type
interface User {
  id: string;
  username: string;
  role: string;
  is_allowed: boolean;
  is_blocked: boolean;
  [key: string]: any;
}

// ✅ Define context type
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
}

// ✅ Define provider props type
interface AuthProviderProps {
  children: ReactNode;
}

// ✅ Create context with proper type
const AuthContext = createContext<AuthContextType | null>(null);

// ✅ Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// ✅ Provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        setCurrentUser(res.data.user);
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setError(null);

      // Authenticate first
      await axiosInstance.post("/auth/login", { username, password });

      // Fetch canonical user from /auth/me (has is_allowed & is_blocked)
      const me = await axiosInstance.get("/auth/me");
      const user = me.data.user;
      setCurrentUser(user);

      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.error || "Login failed";
      setError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } finally {
      setCurrentUser(null);
      window.location.href = "/login";
    }
  };

  const isAuthenticated = () => !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        setError,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;