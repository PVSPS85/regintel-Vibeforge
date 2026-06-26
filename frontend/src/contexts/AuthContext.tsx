import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { saveToken, clearToken, isAuthenticated } from '../lib/auth';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'Employee'
  | 'Team Leader'
  | 'Branch Manager'
  | 'Branch Admin'
  | 'Auditor'
  | 'System Admin';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: UserRole;
  empId: string;
  branch_id: string | null;
  branch: string;
  branchFull: string;
  unreadNotifications: number;
}

interface AuthContextType {
  user: UserSession | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helper: build initials from full name ───────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ─── Helper: map branch_id to a human-readable short name ────────────────────

function placeholderBranchName(branchId: string | null): { branch: string; branchFull: string } {
  if (!branchId) return { branch: 'HQ', branchFull: 'Head Office' };
  return { branch: 'Main', branchFull: 'Branch' };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Hydrate the user session from a stored JWT + /users/me call on app boot */
  const hydrateSession = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.get<{
        id: string;
        name: string;
        email: string;
        role: UserRole;
        branch_id: string | null;
      }>('/users/me');

      const { branch, branchFull } = placeholderBranchName(data.branch_id);

      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        initials: getInitials(data.name),
        role: data.role,
        empId: `EMP-${data.id.slice(0, 4).toUpperCase()}`,
        branch_id: data.branch_id,
        branch,
        branchFull,
        unreadNotifications: 0,
      });
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  /** Call POST /auth/login with OAuth2 form encoding (FastAPI's requirement) */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const { data } = await api.post<{ access_token: string; token_type: string }>(
      '/auth/login',
      formData,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    saveToken(data.access_token);
    await hydrateSession();
  }, [hydrateSession]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const isAdmin =
    user?.role === 'Branch Manager' ||
    user?.role === 'Branch Admin' ||
    user?.role === 'System Admin';

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
