/**
 * Auth provider component that initializes auth state.
 */
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

export default AuthProvider;
