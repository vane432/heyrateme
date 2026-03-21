'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { getConversations, deleteConversation } from '@/lib/queries';
import type { ConversationWithDetails } from '@/lib/types';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
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
    await loadConversations(user.id);
  };

  const loadConversations = async (uid: string) => {
    setLoading(true);
    try {
      const data = await getConversations(uid);
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!userId) return;

    const confirmed = confirm('Delete this conversation? This cannot be undone.');
    if (!confirmed) return;

    setDeletingId(conversationId);
    try {
      await deleteConversation(conversationId, userId);
      setConversations(conversations.filter(c => c.id !== conversationId));
      setMenuOpenId(null);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    } finally {
      setDeletingId(null);
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
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getLastMessagePreview = (conv: ConversationWithDetails) => {
    const msg = conv.last_message;
    if (!msg) return 'No messages yet';

    if (msg.shared_post_id) {
      return msg.sender_id === userId ? 'You shared a post' : 'Shared a post';
    }

    const prefix = msg.sender_id === userId ? 'You: ' : '';
    return prefix + (msg.content || '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No messages yet</h2>
          <p className="text-gray-500 mb-6">Start a conversation by visiting someone's profile and clicking the message button.</p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Explore Users
          </Link>
        </div>
      ) : (
        <div className="bg-white">
          {conversations.map((conversation) => {
            const otherUser = conversation.other_user;
            const username = otherUser?.username || 'Unknown User';
            const avatarUrl = otherUser?.avatar_url;
            const lastMessage = conversation.last_message;
            const hasUnread = conversation.unread_count > 0;
            const isDeleting = deletingId === conversation.id;
            const isMenuOpen = menuOpenId === conversation.id;

            return (
              <div
                key={conversation.id}
                className="relative border-b border-gray-100 last:border-b-0"
              >
                {/* Conversation Item */}
                <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                  {/* Avatar */}
                  <Link href={`/messages/${conversation.id}`} className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gray-300 overflow-hidden">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={username}
                          width={56}
                          height={56}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white font-bold text-xl">
                          {username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Content */}
                  <Link href={`/messages/${conversation.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {username}
                      </p>
                      {lastMessage && (
                        <p className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatTime(lastMessage.created_at)}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {getLastMessagePreview(conversation)}
                      </p>
                      {hasUnread && (
                        <div className="flex items-center justify-center min-w-[24px] h-6 bg-purple-600 text-white text-xs font-bold rounded-full px-2 ml-2 flex-shrink-0">
                          {conversation.unread_count}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Menu Button */}
                  <button
                    onClick={() => setMenuOpenId(isMenuOpen ? null : conversation.id)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                    disabled={isDeleting}
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpenId(null)}
                    />

                    {/* Menu */}
                    <div className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[160px]">
                      <button
                        onClick={() => router.push(`/${username}`)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        View Profile
                      </button>
                      <button
                        onClick={() => handleDeleteConversation(conversation.id)}
                        disabled={isDeleting}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {isDeleting ? 'Deleting...' : 'Delete Chat'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
