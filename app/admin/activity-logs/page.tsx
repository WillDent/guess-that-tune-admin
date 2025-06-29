"use client"

import { useEffect, useState } from "react";
import { AdminRoute } from "@/components/auth/admin-route";
import { useRouter, useSearchParams } from 'next/navigation';

interface Log {
  id: string;
  user_id: string;
  action_type: string;
  details: any;
  created_at: string;
  ip_address: string;
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string>("");
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  useEffect(() => {
    // On mount, set userFilter from URL if present
    if (searchParams) {
      const user = searchParams.get('user');
      if (user) setUserFilter(user);
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const url = userFilter ? `/api/admin/activity-logs?user=${userFilter}` : "/api/admin/activity-logs";
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch logs");
        setLogs(data.logs);
        setUsersMap(data.usersMap || {});
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [userFilter]);

  return (
    <AdminRoute>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin: Activity Logs</h1>
        {Object.keys(usersMap).length > 0 && (
          <div className="mb-4">
            <label className="mr-2">Filter by user:</label>
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">All users</option>
              {Object.entries(usersMap).map(([id, email]) => (
                <option key={id} value={id}>{email}</option>
              ))}
            </select>
          </div>
        )}
        {loading && <div className="flex items-center gap-2 text-gray-400"><span className="animate-spin">⏳</span> Loading logs...</div>}
        {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">Error: {error}</div>}
        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-300">User</th>
                  <th className="px-4 py-2 text-left text-gray-300">Action</th>
                  <th className="px-4 py-2 text-left text-gray-300">Details</th>
                  <th className="px-4 py-2 text-left text-gray-300">Time</th>
                  <th className="px-4 py-2 text-left text-gray-300">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="even:bg-gray-900">
                    <td className="px-4 py-2">{usersMap[log.user_id] || log.user_id}</td>
                    <td className="px-4 py-2">{log.action_type}</td>
                    <td className="px-4 py-2">{typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}</td>
                    <td className="px-4 py-2">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2">{log.ip_address}</td>
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