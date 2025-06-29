"use client"

import { useEffect, useState } from "react";
import { AdminRoute } from "@/components/auth/admin-route";

interface Analytics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalGames: number;
  activeGames: number;
  totalQuestionSets: number;
  newUsers: number;
  newGames: number;
  newQuestionSets: number;
  usersSeries: { date: string; count: number }[];
  gamesSeries: { date: string; count: number }[];
  questionSetsSeries: { date: string; count: number }[];
  topUsers: { host_user_id: string; count: number; email: string }[];
  topCategories: { category_id: string; count: number; name: string }[];
}

function LineChart({ data, color = "#ec4899", label }: { data: { date: string; count: number }[], color?: string, label: string }) {
  if (!data || data.length === 0) return <div className="text-gray-400">No data</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  const width = 320, height = 80, pad = 24;
  const points = data.map((d, i) => {
    const x = pad + (i * (width - 2 * pad)) / (data.length - 1);
    const y = height - pad - ((d.count / max) * (height - 2 * pad));
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} className="block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
      {/* Y axis */}
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#888" strokeWidth="1" />
      {/* X axis */}
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#888" strokeWidth="1" />
      {/* Max label */}
      <text x={pad} y={pad - 4} fontSize="10" fill="#aaa">{max}</text>
      {/* Min label */}
      <text x={pad} y={height - pad + 12} fontSize="10" fill="#aaa">0</text>
      {/* Label */}
      <text x={width / 2} y={height - 2} fontSize="12" fill="#fff" textAnchor="middle">{label}</text>
    </svg>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to fetch analytics");
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <AdminRoute>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Admin: Analytics Dashboard</h1>
        {loading && <div>Loading analytics...</div>}
        {error && <div className="text-red-500">Error: {error}</div>}
        {!loading && !error && data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-white mb-2">Total Users</h2>
                <div className="text-3xl font-bold text-pink-400">{data.totalUsers}</div>
                <div className="text-sm text-gray-400">Active: {data.activeUsers} | Suspended: {data.suspendedUsers}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-white mb-2">Total Games</h2>
                <div className="text-3xl font-bold text-pink-400">{data.totalGames}</div>
                <div className="text-sm text-gray-400">Active: {data.activeGames}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-white mb-2">Question Sets</h2>
                <div className="text-3xl font-bold text-pink-400">{data.totalQuestionSets}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-md font-semibold text-white mb-1">New Users (7d)</h3>
                <div className="text-2xl font-bold text-pink-300">{data.newUsers}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-md font-semibold text-white mb-1">New Games (7d)</h3>
                <div className="text-2xl font-bold text-pink-300">{data.newGames}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-md font-semibold text-white mb-1">New Question Sets (7d)</h3>
                <div className="text-2xl font-bold text-pink-300">{data.newQuestionSets}</div>
              </div>
            </div>
            {/* Time Series Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-900 rounded-lg p-4 flex flex-col items-center">
                <LineChart data={data.usersSeries} label="Users (30d)" color="#f472b6" />
              </div>
              <div className="bg-gray-900 rounded-lg p-4 flex flex-col items-center">
                <LineChart data={data.gamesSeries} label="Games (30d)" color="#a78bfa" />
              </div>
              <div className="bg-gray-900 rounded-lg p-4 flex flex-col items-center">
                <LineChart data={data.questionSetsSeries} label="Question Sets (30d)" color="#fbbf24" />
              </div>
            </div>
            {/* Top Users & Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-md font-semibold text-white mb-2">Top 5 Active Users (by games hosted)</h3>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="px-2 py-1 text-left">Email</th>
                      <th className="px-2 py-1 text-left">Games Hosted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topUsers.map(u => (
                      <tr key={u.host_user_id} className="even:bg-gray-900">
                        <td className="px-2 py-1">{u.email}</td>
                        <td className="px-2 py-1">{u.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-md font-semibold text-white mb-2">Top 5 Categories (by question set assignments)</h3>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="px-2 py-1 text-left">Category</th>
                      <th className="px-2 py-1 text-left">Assignments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topCategories.map(c => (
                      <tr key={c.category_id} className="even:bg-gray-900">
                        <td className="px-2 py-1">{c.name}</td>
                        <td className="px-2 py-1">{c.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminRoute>
  );
} 