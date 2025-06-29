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

const ACTION_TYPES = [
  "login", "logout", "create_category", "update_category", "delete_category", "promote_user", "demote_user", "suspend_user", "activate_user", "other"
];

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [actionTypes, setActionTypes] = useState<string[]>(ACTION_TYPES);
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
        const params = new URLSearchParams();
        if (userFilter) params.set('user', userFilter);
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        if (action) params.set('action', action);
        if (q) params.set('q', q);
        const url = `/api/admin/activity-logs${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch logs");
        setLogs(data.logs);
        setUsersMap(data.usersMap || {});
        // Dynamically collect action types from logs if not present
        if (data.logs && data.logs.length > 0) {
          const types = Array.from(new Set(data.logs.map((l: Log) => String(l.action_type)).filter(Boolean))).map(String);
          setActionTypes(Array.from(new Set([...ACTION_TYPES, ...types])).map(String));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [userFilter, start, end, action, q]);

  function clearFilters() {
    setUserFilter("");
    setStart("");
    setEnd("");
    setAction("");
    setQ("");
  }

  return (
    <AdminRoute>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin: Activity Logs</h1>
        <div className="mb-4 flex flex-wrap gap-4 items-end">
          {Object.keys(usersMap).length > 0 && (
            <div>
              <label className="mr-2">User:</label>
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
          <div>
            <label className="mr-2">Start:</label>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div>
            <label className="mr-2">End:</label>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div>
            <label className="mr-2">Action:</label>
            <select value={action} onChange={e => setAction(e.target.value)} className="border rounded px-2 py-1">
              <option value="">All actions</option>
              {actionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mr-2">Keyword:</label>
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search details..."
              className="border rounded px-2 py-1"
            />
          </div>
          <button onClick={clearFilters} className="ml-2 px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-600 border">Clear</button>
        </div>
        {/* Show active filters */}
        {(userFilter || start || end || action || q) && (
          <div className="mb-2 text-xs text-gray-400">
            <span>Active filters: </span>
            {userFilter && <span className="mr-2">User: {usersMap[userFilter] || userFilter}</span>}
            {start && <span className="mr-2">Start: {start}</span>}
            {end && <span className="mr-2">End: {end}</span>}
            {action && <span className="mr-2">Action: {action}</span>}
            {q && <span className="mr-2">Keyword: "{q}"</span>}
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