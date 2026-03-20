'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getAdminStats } from '@/lib/queries';

// Admin email addresses with dashboard access
const ADMIN_EMAILS = ['danish.parvi@gmail.com'];

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  imageCount: number;
  videoCount: number;
  categoryBreakdown: Record<string, number>;
  recentPosts: number;
  recentUsers: number;
  totalRatings: number;
  totalStorageMB: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoadStats();
  }, []);

  const checkAdminAndLoadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    const adminCheck = ADMIN_EMAILS.includes(user.email || '');

    if (!adminCheck) {
      router.push('/feed');
      return;
    }

    setIsAdmin(true);
    await loadStats();
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Failed to load stats</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => loadStats()}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          <p className="text-xs text-gray-400 mt-2">
            +{stats.recentUsers} in last 7 days
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Posts</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
          <p className="text-xs text-gray-400 mt-2">
            +{stats.recentPosts} in last 24 hours
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Ratings</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalRatings}</p>
          <p className="text-xs text-gray-400 mt-2">
            {stats.totalPosts > 0 ? (stats.totalRatings / stats.totalPosts).toFixed(1) : 0} per post
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Storage Used</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalStorageMB}</p>
          <p className="text-xs text-gray-400 mt-2">MB</p>
        </div>
      </div>

      {/* Content Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Media Type Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Media Types</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Images</span>
                <span className="font-semibold">{stats.imageCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${stats.totalPosts > 0 ? (stats.imageCount / stats.totalPosts) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Videos</span>
                <span className="font-semibold">{stats.videoCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${stats.totalPosts > 0 ? (stats.videoCount / stats.totalPosts) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Categories</h2>
          <div className="space-y-3">
            {Object.entries(stats.categoryBreakdown)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-gray-700">{category}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${stats.totalPosts > 0 ? ((count as number) / stats.totalPosts) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="font-semibold text-sm w-8 text-right">{count as number}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalPosts > 0 ? ((stats.videoCount / stats.totalPosts) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Video Adoption</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalUsers > 0 ? (stats.totalPosts / stats.totalUsers).toFixed(1) : 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Posts per User</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalUsers > 0 ? (stats.totalRatings / stats.totalUsers).toFixed(1) : 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Ratings per User</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalPosts > 0 ? (Number(stats.totalStorageMB) / stats.totalPosts).toFixed(2) : 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">MB per Post</p>
          </div>
        </div>
      </div>
    </div>
  );
}
