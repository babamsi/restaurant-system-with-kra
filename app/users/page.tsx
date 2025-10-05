"use client";
import { useEffect, useState } from 'react';
import { useUserSession } from '@/context/UserSessionContext';
import UserForm from '@/components/UserForm';
// Auth temporarily disabled here to allow first-user bootstrap

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users || []);
  };
  useEffect(() => { loadUsers(); }, []);

  const handleSave = async (form: any) => {
    setError('');
    if (editing) {
      const res = await fetch(`/api/users/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setShowForm(false); setEditing(null); loadUsers();
      }
    } else {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setShowForm(false); loadUsers();
      }
    }
  };

  const handleDelete = async (u: any) => {
    if (!window.confirm('Disable this user?')) return;
    await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
    loadUsers();
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button className="px-4 py-2 rounded bg-primary text-white font-semibold" onClick={() => { setEditing(null); setShowForm(true); }}>Add User</button>
      </div>
      {showForm && (
        <div className="mb-8">
          <UserForm user={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
          {error && <div className="text-red-600 text-center mt-2">{error}</div>}
        </div>
      )}
      <table className="w-full border rounded shadow text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Active</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className={!u.active ? 'opacity-50' : ''}>
              <td className="p-2">{u.name}</td>
              <td className="p-2 capitalize">{u.role}</td>
              <td className="p-2">{u.active ? 'Yes' : 'No'}</td>
              <td className="p-2 text-right flex gap-2 justify-end">
                <button className="text-xs underline" onClick={() => { setEditing(u); setShowForm(true); }}>Edit</button>
                {u.active && <button className="text-xs underline text-red-600" onClick={() => handleDelete(u)}>Disable</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 