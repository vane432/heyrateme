'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { getAdminStats, getPendingReports } from '@/lib/queries';

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

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  post: {
    id: string;
    image_url: string;
    caption: string;
    category: string;
    media_type: string;
    users: { username: string; avatar_url: string | null };
  };
  reporter: { username: string; avatar_url: string | null };
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'reports'>('stats');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoadStats();
  }, []);

  const checkAdminAndLoadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();

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
    setAccessToken(session?.access_token || null);
    await loadStats();
    await loadReports();
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

  const loadReports = async () => {
    try {
      const data = await getPendingReports();
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const handleReportAction = async (reportId: string, action: 'dismiss' | 'delete') => {
    try {
      const response = await fetch('/api/report', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: reportId,
          status: action === 'dismiss' ? 'dismissed' : 'actioned',
          delete_post: action === 'delete',
          access_token: accessToken
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      // Remove from list
      setReports(reports.filter(r => r.id !== reportId));
    } catch (error: any) {
      alert('Failed to update report: ' + error.message);
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
          onClick={() => { loadStats(); loadReports(); }}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-3 px-2 font-medium ${
            activeTab === 'stats'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-2 font-medium flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Reports
          {reports.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {reports.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'stats' && (
        <>
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
        </>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending reports</h3>
              <p className="text-gray-500">All reports have been reviewed.</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex gap-4">
                  {/* Post Thumbnail */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {report.post.media_type === 'video' ? (
                      <video
                        src={report.post.image_url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <Image
                        src={report.post.image_url}
                        alt="Reported post"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Report Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Reported by <span className="font-semibold text-gray-900">{report.reporter.username}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Post by <span className="font-semibold text-gray-900">{report.post.users.username}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        report.reason === 'inappropriate' ? 'bg-red-100 text-red-700' :
                        report.reason === 'spam' ? 'bg-yellow-100 text-yellow-700' :
                        report.reason === 'harassment' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {report.reason}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">{report.post.caption}</p>

                    {report.details && (
                      <p className="text-sm text-gray-500 mt-2 italic">"{report.details}"</p>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleReportAction(report.id, 'dismiss')}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                  >
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => handleReportAction(report.id, 'delete')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                  >
                    Delete Post
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
