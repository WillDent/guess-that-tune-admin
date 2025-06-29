"use client"

import { useEffect, useState } from "react";
import { AdminRoute } from "@/components/auth/admin-route";
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  suspended_at: string | null;
  suspended_by: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [id: string]: boolean }>({});
  const [actionError, setActionError] = useState<{ [id: string]: string | null }>({});
  const { user: currentUser } = useUser();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch users");
        setUsers(data.users);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  async function handleAction(id: string, action: string) {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    setActionError((prev) => ({ ...prev, [id]: null }));
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
    } catch (err: any) {
      setActionError((prev) => ({ ...prev, [id]: err.message }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <AdminRoute>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin: User Management</h1>
        {loading && <div className="flex items-center gap-2 text-gray-400"><span className="animate-spin">⏳</span> Loading users...</div>}
        {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">Error: {error}</div>}
        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="border-b px-4 py-2 text-left text-gray-300">Email</th>
                  <th className="border-b px-4 py-2 text-left text-gray-300">Role</th>
                  <th className="border-b px-4 py-2 text-left text-gray-300">Status</th>
                  <th className="border-b px-4 py-2 text-left text-gray-300">Suspended At</th>
                  <th className="border-b px-4 py-2 text-left text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="even:bg-gray-900">
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.role}</td>
                    <td className="px-4 py-2">{user.status}</td>
                    <td className="px-4 py-2">{user.suspended_at ? new Date(user.suspended_at).toLocaleString() : "-"}</td>
                    <td className="px-4 py-2">
                      {currentUser?.id === user.id ? (
                        <span className="text-gray-400">(self)</span>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {user.role === 'user' ? (
                            <Button size="sm" disabled={actionLoading[user.id]} onClick={() => handleAction(user.id, 'promote')}>
                              Promote to Admin
                            </Button>
                          ) : (
                            <Button size="sm" disabled={actionLoading[user.id]} onClick={() => handleAction(user.id, 'demote')}>
                              Demote to User
                            </Button>
                          )}
                          {user.status === 'active' ? (
                            <Button size="sm" disabled={actionLoading[user.id]} onClick={() => handleAction(user.id, 'suspend')}>
                              Suspend
                            </Button>
                          ) : (
                            <Button size="sm" disabled={actionLoading[user.id]} onClick={() => handleAction(user.id, 'activate')}>
                              Activate
                            </Button>
                          )}
                          {actionError[user.id] && <div className="text-xs text-red-500 bg-red-100 rounded px-2 py-1 mt-1">{actionError[user.id]}</div>}
                          <Link href={`/admin/activity-logs?user=${user.id}`} className="text-xs text-blue-500 underline mt-1">
                            View Logs
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminRoute>
  );
} 