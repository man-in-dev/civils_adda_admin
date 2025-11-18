"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, setToken, removeToken } from "@/utils/api";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

type AdminAuthContextType = {
  user: AdminUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load token from localStorage on mount
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

    if (savedToken) {
      // Verify token by fetching user data
      api.auth.getMe()
        .then((response) => {
          if (response.success && response.data) {
            const userData = response.data.user;
            // Check if user is admin
            if (userData.isAdmin) {
              setUser({
                id: userData.id,
                email: userData.email,
                name: userData.name,
                isAdmin: userData.isAdmin,
              });
              setTokenState(savedToken);
            } else {
              // User is not admin
              removeToken();
            }
          } else {
            // Invalid token
            removeToken();
          }
        })
        .catch(() => {
          // Token invalid or expired
          removeToken();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.auth.login(email, password);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || "Login failed");
    }

    const { user: userData, token: newToken } = response.data;
    
    // Check if user is admin
    if (!userData.isAdmin) {
      throw new Error("Access denied. Admin privileges required.");
    }
    
    // Save to state and localStorage
    setUser({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      isAdmin: userData.isAdmin,
    });
    setTokenState(newToken);
    setToken(newToken);
  };

  const logout = () => {
    setTokenState(null);
    setUser(null);
    removeToken();
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token: token,
        loading,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

