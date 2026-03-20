'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { getNotifications, markNotificationsRead } from '@/lib/queries';
import type { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkUserAndLoad();
  }, []);

  const checkUserAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUserId(user.id);
    await loadNotifications(user.id);
  };

  const loadNotifications = async (uid: string) => {
    setLoading(true);
    try {
      const data = await getNotifications(uid, 50);
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await markNotificationsRead(userId);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No notifications yet</h2>
          <p className="text-gray-500">When someone follows you or rates your posts, you'll see it here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden divide-y divide-gray-100">
          {notifications.map((notification) => {
            const actor = notification.actor;
            const username = actor?.username || 'Someone';
            const avatarUrl = actor?.avatar_url;

            let message = '';
            let link = '/';

            switch (notification.type) {
              case 'new_follower':
                message = 'started following you';
                link = `/${username}`;
                break;
              case 'post_rated':
                message = `rated your post ${'★'.repeat(notification.rating_value || 0)}`;
                link = notification.post_id ? `/post/${notification.post_id}` : '/';
                break;
            }

            return (
              <Link
                key={notification.id}
                href={link}
                className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-purple-50' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={username}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white font-bold text-lg">
                      {username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900">
                    <span className="font-semibold">{username}</span>{' '}
                    <span className="text-gray-600">{message}</span>
                  </p>
                  <p className="text-sm text-gray-400 mt-1">{formatTime(notification.created_at)}</p>
                </div>
                {!notification.is_read && (
                  <div className="w-3 h-3 bg-purple-600 rounded-full flex-shrink-0 mt-2" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
