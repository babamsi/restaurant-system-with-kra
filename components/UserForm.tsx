import React, { useState } from 'react';
import PinPad from './PinPad';

interface User {
  id?: string;
  name: string;
  role: string;
  active?: boolean;
}

interface UserFormProps {
  user?: User;
  onSave: (user: { name: string; role: string; passcode?: string; active?: boolean }) => void;
  onCancel: () => void;
}

const roles = [
  { value: 'staff', label: 'Staff' },
  { value: 'manager', label: 'Manager' },
  { value: 'owner', label: 'Owner' },
];

const UserForm: React.FC<UserFormProps> = ({ user, onSave, onCancel }) => {
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'staff');
  const [passcode, setPasscode] = useState('');
  const [active, setActive] = useState(user?.active ?? true);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return setError('Name required');
    if (!role) return setError('Role required');
    if (!user && passcode.length !== 6) return setError('6-digit passcode required');
    onSave({ name, role, passcode: passcode || undefined, active });
  };

  return (
    <form className="space-y-4 max-w-xs mx-auto" onSubmit={handleSubmit}>
      <div>
        <label className="block mb-1 font-medium">Name</label>
        <input className="w-full px-3 py-2 rounded border" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label className="block mb-1 font-medium">Role</label>
        <select className="w-full px-3 py-2 rounded border" value={role} onChange={e => setRole(e.target.value)}>
          {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">{user ? 'New Passcode (optional)' : 'Passcode'}</label>
        <button type="button" className="w-full px-3 py-2 rounded border bg-muted" onClick={() => setShowPin(true)}>
          {passcode ? '●●●●●●' : 'Set Passcode'}
        </button>
        {showPin && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <PinPad value={passcode} onChange={setPasscode} onSubmit={() => setShowPin(false)} length={6} />
              <button className="mt-4 text-sm underline" type="button" onClick={() => setShowPin(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      {user && (
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} id="active" />
          <label htmlFor="active">Active</label>
        </div>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex gap-2 mt-4">
        <button type="submit" className="px-4 py-2 rounded bg-primary text-white font-semibold">Save</button>
        <button type="button" className="px-4 py-2 rounded bg-muted" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export default UserForm; 