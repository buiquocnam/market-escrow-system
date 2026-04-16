"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  userId: string;
  email: string;
  role: 'buyer' | 'seller';
  paymentWalletAddress: string;
  payoutAddress?: string;
}

export interface UserSession {
  userId: string;
  email: string;
  role: 'buyer' | 'seller';
  paymentWalletAddress: string;
  payoutAddress?: string;
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: UserSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem("user");
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch (e) {
        console.error("Failed to parse user session", e);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: UserSession) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
