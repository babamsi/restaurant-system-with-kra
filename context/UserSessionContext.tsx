import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  role: string;
}

interface UserSessionContextType {
  user: User | null;
  loading: boolean;
  login: (user_id: string, passcode: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const UserSessionContext = createContext<UserSessionContextType | undefined>(undefined);

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    setUser(data.user || null);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const login = async (user_id: string, passcode: string) => {
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, passcode }),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      setLoading(false);
      return true;
    } else {
      setUser(null);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setLoading(false);
  };

  return (
    <UserSessionContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </UserSessionContext.Provider>
  );
}

export function useUserSession() {
  const ctx = useContext(UserSessionContext);
  if (!ctx) throw new Error('useUserSession must be used within UserSessionProvider');
  return ctx;
} 