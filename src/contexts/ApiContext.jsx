"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { ROLES, getDashboardPath } from '../lib/roles';

// Create the context
const ApiContext = createContext();

// Custom hook to use the API context
export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

// Provider component
export function ApiProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize user data from localStorage and validate token
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const storedRole = localStorage.getItem('user-role');
        
        if (!token || !storedRole) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Validate token and get user data
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success && data.data) {
          setUser(data.data);
          setIsAuthenticated(true);
        } else {
          // Clear invalid auth data
          localStorage.removeItem('auth-token');
          localStorage.removeItem('user-role');
          localStorage.removeItem('user-email');
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password, role) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store auth data
        localStorage.setItem('auth-token', data.data.token);
        localStorage.setItem('user-role', data.data.user.role);
        localStorage.setItem('user-email', data.data.user.email);

        setUser(data.data.user);
        setIsAuthenticated(true);

        // Return success data for UI handling
        return {
          success: true,
          user: data.data.user,
          message: `Welcome back! You have successfully logged in as a ${data.data.user.role}.`
        };
      }

      return {
        success: false,
        error: data.message || data.error || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An error occurred during login'
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth data regardless of API call success
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user-role');
      localStorage.removeItem('user-email');
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(prev => ({ ...prev, ...data.data }));
        return { success: true, data: data.data };
      }

      return {
        success: false,
        error: data.message || data.error || 'Failed to update profile'
      };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: 'An error occurred while updating profile'
      };
    }
  };

  // Get user's role-specific dashboard path
  const getDashboard = () => {
    if (!user || !user.role) return '/login';
    return getDashboardPath(user.role);
  };

  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateProfile,
    getDashboard
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
}