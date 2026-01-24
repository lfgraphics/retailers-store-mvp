'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  name?: string;
  email?: string;
  username?: string;
  role: 'customer' | 'retailer';
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<{ accessToken: string; refreshToken: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    console.log('AuthContext: Loading from localStorage...');
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');

    console.log('AuthContext: storedUser:', storedUser ? 'EXISTS' : 'NULL');
    console.log('AuthContext: storedToken:', storedToken ? 'EXISTS' : 'NULL');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
      console.log('AuthContext: User and token loaded successfully');
    } else {
      console.log('AuthContext: No stored credentials found');
    }

    setIsLoading(false);
  }, []);

  // Initialize API client with auth callbacks
  useEffect(() => {
    apiClient.initialize(refreshAccessToken, logout);
  }, []);

  const login = (token: string, refresh: string, userData: User) => {
    console.log('AuthContext: Login called with user:', userData.id, 'role:', userData.role);
    setUser(userData);
    setAccessToken(token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refresh);
    console.log('AuthContext: Credentials stored in localStorage');
  };

  const logout = () => {
    console.log('AuthContext: Logout called');
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const refreshAccessToken = async (): Promise<{ accessToken: string; refreshToken: string }> => {
    console.log('AuthContext: Refreshing access token...');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (!storedRefreshToken) {
      console.error('AuthContext: No refresh token found');
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // Update stored tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setAccessToken(data.accessToken);

      console.log('AuthContext: Token refreshed successfully');

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
    } catch (error) {
      console.error('AuthContext: Token refresh failed:', error);
      // Logout on refresh failure
      logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
