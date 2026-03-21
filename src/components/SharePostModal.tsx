'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getConversations, sendPostShare, getOrCreateConversation } from '@/lib/queries';
import type { ConversationWithDetails, User } from '@/lib/types';

interface SharePostModalProps {
  postId: string;
  userId: string;
  onClose: () => void;
}

export default function SharePostModal({ postId, userId, onClose }: SharePostModalProps) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await getConversations(userId);
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (conversationId: string) => {
    setSending(conversationId);
    try {
      await sendPostShare(conversationId, userId, postId, message || undefined);
      onClose();
    } catch (error) {
      console.error('Failed to share post:', error);
      alert('Failed to share post. Please try again.');
    } finally {
      setSending(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Share Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Optional message */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Add a message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No conversations yet</p>
              <p className="text-sm text-gray-400 mt-2">Visit someone's profile to start a conversation</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => {
                const otherUser = conv.other_user;
                const username = otherUser?.username || 'Unknown User';
                const avatarUrl = otherUser?.avatar_url;
                const isSending = sending === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleShare(conv.id)}
                    disabled={isSending}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
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
                        <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white font-bold">
                          {username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{username}</p>
                    </div>
                    {isSending && (
                      <div className="text-purple-600 text-sm">Sending...</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
