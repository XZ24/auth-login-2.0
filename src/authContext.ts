import { createContext, useContext } from 'react';
import type { AuthUser, Permission } from './auth';

export interface AuthContextValue {
  user: AuthUser | null;
  logout: () => Promise<void>;
  // Role-gating check. Currently permissive; wired so components can adopt it
  // without further plumbing once the permission matrix is defined.
  can: (permission: Permission) => boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  logout: async () => {},
  can: () => true,
});

export const useAuth = (): AuthContextValue => useContext(AuthContext);
