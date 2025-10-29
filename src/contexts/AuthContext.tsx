
// export default AuthContext;

// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, type ReactNode } from "react";
import axiosInstance from "../utils/axiosInstance";


// ✅ Define User type
interface User {
  id: string;
  username: string;
  role: string;
  allowed: boolean;
  is_blocked: boolean;
  [key: string]: any; // for any extra fields
}

// ✅ Define context type
interface AuthContextType {
  currentUser: User | null;
  permissions: string[];
  loading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  hasPermission: (perm: string) => boolean;
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
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        setCurrentUser(res.data.user);

        if (res.data.user?.id && res.data.user.role !== "admin") {
          const pRes = await axiosInstance.get(`/permissions/user/${res.data.user.id}`);
          setPermissions(pRes.data.map((p: any) => p.name));
        } else {
          setPermissions([]);
        }
      } catch {
        setCurrentUser(null);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

const login = async (username: string, password: string) => {
  try {
    setError(null);

    // CHANGED: authenticate first, but don't use the login payload for user
    await axiosInstance.post("/auth/login", { username, password });

    // CHANGED: fetch canonical user from /auth/me (has allowed & is_blocked)
    const me = await axiosInstance.get("/auth/me");
    const user = me.data.user; // <- use this, not res.data.user from /auth/login
    setCurrentUser(user);

    if (user.role !== "admin") {
      const pRes = await axiosInstance.get(`/permissions/user/${user.id}`);
      setPermissions(pRes.data.map((p: any) => p.name));
    } else {
      setPermissions([]);
    }

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
      setPermissions([]);
      window.location.href = "/login";
    }
  };

  const isAuthenticated = () => !!currentUser;
  const hasPermission = (perm: string) =>
    currentUser?.role === "admin" || permissions.includes(perm);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        permissions,
        loading,
        error,
        setError,
        login,
        logout,
        isAuthenticated,
        hasPermission,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
