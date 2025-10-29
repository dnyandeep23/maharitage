"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "../lib/api";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setUser(data.data);
        } else {
          setUser(null);
          localStorage.removeItem("auth-token");
        }
      } catch (error) {
        setUser(null);
        localStorage.removeItem("auth-token");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password, role) => {
    try {
      const data = await api.login(email, password, role);
      console.log("Login data:", data);
      setUser(data.user);
      const returnUrl = pathname || "/";
      router.replace(returnUrl);
    } catch (error) {
      if (
        error.message ===
        "Please verify your email. A new verification email has been sent."
      ) {
        router.replace("/email-sent?email=" + email);
      }
      setError(error.message);
      throw error;
    }
  };

  const register = async (username, email, password, role) => {
    try {
      const data = await api.register(username, email, password, role);
      console.log("Registration data:", data);
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth-token");
    setUser(null);
    router.push("/login");
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
