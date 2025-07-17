import React from 'react';

interface User {
  id: string;
  name: string;
  role: string;
}

interface UserListProps {
  users: User[];
  onSelect: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onSelect }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
    {users.map(user => (
      <button
        key={user.id}
        className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted hover:bg-primary/10 transition border border-muted-foreground/10 shadow"
        onClick={() => onSelect(user)}
      >
        <div className="text-lg font-semibold mb-1">{user.name}</div>
        <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
      </button>
    ))}
  </div>
);

export default UserList; 