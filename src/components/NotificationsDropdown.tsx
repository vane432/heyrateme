'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getNotifications, markNotificationsRead } from '@/lib/queries';
import type { Notification } from '@/lib/types';

interface NotificationsDropdownProps {
  userId: string;
  onClose: () => void;
  onMarkRead: () => void;
}

export default function NotificationsDropdown({ userId, onClose, onMarkRead }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications(userId, 10);
        setNotifications(data || []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userId]);

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead(userId);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      onMarkRead();
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
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

  const renderNotification = (notification: Notification) => {
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
        onClick={onClose}
        className={`flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors ${
          !notification.is_read ? 'bg-purple-50' : ''
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={username}
              width={40}
              height={40}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white font-bold">
              {username[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">
            <span className="font-semibold">{username}</span>{' '}
            <span className="text-gray-600">{message}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{formatTime(notification.created_at)}</p>
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-2" />
        )}
      </Link>
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-2">🔔</div>
            <p className="text-gray-500 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(renderNotification)}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <Link
          href="/notifications"
          onClick={onClose}
          className="block text-center py-3 text-sm text-purple-600 hover:bg-gray-50 border-t border-gray-100 font-medium"
        >
          View all notifications
        </Link>
      )}
    </div>
  );
}
