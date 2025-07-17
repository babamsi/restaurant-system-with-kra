'use client'

import React, { ReactNode, useEffect } from 'react';
import { useUserSession } from '@/context/UserSessionContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useUserSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/login');
    }
  }, [user, loading, allowedRoles, router]);

  if (loading || !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="flex items-center justify-center h-screen">Access denied</div>;
  }
  return <>{children}</>;
};

export default ProtectedRoute; 