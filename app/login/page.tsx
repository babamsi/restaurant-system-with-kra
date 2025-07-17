"use client";
import { useEffect, useState } from 'react';
import UserList from '@/components/UserList';
import PinPad from '@/components/PinPad';
import { useUserSession } from '@/context/UserSessionContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const { user, login, loading } = useUserSession();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data.users || []));
  }, []);

  useEffect(() => {
    if (user && !loading) router.replace('/');
  }, [user, loading, router]);

  const handleLogin = async () => {
    setError('');
    const ok = await login(selectedUser.id, passcode);
    if (!ok) setError('Invalid passcode');
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (!selectedUser) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Select User</h2>
        <UserList users={users} onSelect={setSelectedUser} />
      </div>
    );
  }

  return (
    <div className="max-w-xs mx-auto py-16 px-4">
      <button className="mb-4 text-sm underline" onClick={() => setSelectedUser(null)}>&larr; Back</button>
      <h2 className="text-xl font-semibold mb-2 text-center">Enter Passcode for {selectedUser.name}</h2>
      <PinPad value={passcode} onChange={setPasscode} onSubmit={handleLogin} length={6} />
      {error && <div className="text-red-600 text-center mt-2">{error}</div>}
    </div>
  );
} 