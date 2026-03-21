'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUnreadMessageCount } from '@/lib/queries';

interface MessageIconProps {
  userId: string;
}

export default function MessageIcon({ userId }: MessageIconProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count on mount and poll every 30 seconds
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await getUnreadMessageCount(userId);
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to fetch message count:', error);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  return (
    <Link
      href="/messages"
      className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      aria-label="Messages"
    >
      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
