'use client';

import { useState, useEffect, useRef } from 'react';
import { getUnreadNotificationCount } from '@/lib/queries';
import NotificationsDropdown from './NotificationsDropdown';

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // DEBUG: Add console log to see if component is rendering
  console.log('NotificationBell rendering with userId:', userId);

  // Fetch unread count on mount and poll every 30 seconds
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await getUnreadNotificationCount(userId);
        console.log('Fetched notification count:', count); // DEBUG
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationsRead = () => {
    setUnreadCount(0);
  };

  return (
    <div className="relative bg-yellow-200 border-2 border-red-500" ref={bellRef}>
      {/* DEBUG: Temporary styling to make it super visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
        title={`NotificationBell - Count: ${unreadCount}`}
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <NotificationsDropdown
          userId={userId}
          onClose={() => setIsOpen(false)}
          onMarkRead={handleNotificationsRead}
        />
      )}
    </div>
  );
}
