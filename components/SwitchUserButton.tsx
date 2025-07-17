import React from 'react';
import { useUserSession } from '@/context/UserSessionContext';
import { useRouter } from 'next/navigation';
import { User2 } from 'lucide-react';

const SwitchUserButton: React.FC = () => {
  const { user, logout, loading } = useUserSession();
  const router = useRouter();

  const handleSwitch = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <button
      className="flex items-center gap-2 px-3 py-2 rounded bg-muted hover:bg-primary/10 text-sm font-medium transition"
      onClick={handleSwitch}
      disabled={loading}
      title="Switch User"
    >
      <User2 className="w-4 h-4" />
      <span>{user.name} ({user.role})</span>
      <span className="ml-2 text-xs text-muted-foreground">Switch User</span>
    </button>
  );
};

export default SwitchUserButton; 