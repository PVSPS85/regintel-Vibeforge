import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'Branch Manager' | 'Employee' | 'System Admin' | 'Team Leader';

export interface UserSession {
  name: string;
  initials: string;
  empId: string;
  role: UserRole;
  branch: string;
  branchFull: string;
  unreadNotifications: number;
}

const DEFAULT_USER: UserSession = {
  name: 'Arjun Mehta',
  initials: 'AM',
  empId: 'EMP-4821',
  role: 'Branch Manager',
  branch: 'Mumbai',
  branchFull: 'Fort Branch',
  unreadNotifications: 4,
};

interface AuthContextType {
  user: UserSession;
  isAdmin: boolean;
  toggleRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession>(DEFAULT_USER);

  const toggleRole = () => {
    setUser((prev) => ({
      ...prev,
      role: prev.role === 'Branch Manager' ? 'Employee' : 'Branch Manager',
    }));
  };

  const isAdmin = user.role === 'Branch Manager' || user.role === 'System Admin';

  return (
    <AuthContext.Provider value={{ user, isAdmin, toggleRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
