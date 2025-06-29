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
        )}
        {!loading && !error && data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        )}
      </div>
    </AdminRoute>
  );
} 