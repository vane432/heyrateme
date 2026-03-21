'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import {
  getConversationMessages,
  sendMessage,
  markConversationRead,
  getConversations,
  deleteConversation
} from '@/lib/queries';
import type { MessageWithDetails, ConversationWithDetails } from '@/lib/types';

export default function ConversationPage() {
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  useEffect(() => {
    checkUserAndLoad();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch the full message with sender and post details
          const { data: newMsg } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!sender_id (*),
              shared_post:posts (
                *,
                users (*)
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMsg) {
            setMessages((prev) => [...prev, newMsg as MessageWithDetails]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  const checkUserAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUserId(user.id);
    await loadConversation(user.id);
  };

  const loadConversation = async (uid: string) => {
    setLoading(true);
    try {
      // Load conversation details
      const convs = await getConversations(uid);
      const conv = convs.find(c => c.id === conversationId);
      if (!conv) {
        router.push('/messages');
        return;
      }
      setConversation(conv);

      // Load messages
      const msgs = await getConversationMessages(conversationId);
      setMessages(msgs);

      // Mark as read
      await markConversationRead(conversationId, uid);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const msg = await sendMessage(conversationId, userId, newMessage.trim());
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
      await markConversationRead(conversationId, userId);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleDeleteConversation = async () => {
    if (!userId || deleting) return;

    const confirmed = confirm('Delete this conversation? This cannot be undone.');
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteConversation(conversationId, userId);
      router.push('/messages');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const otherUser = conversation?.other_user;
  const username = otherUser?.username || 'Unknown User';
  const avatarUrl = otherUser?.avatar_url;

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 relative">
        <button
          onClick={() => router.push('/messages')}
          className="text-gray-600 hover:text-gray-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <Link href={`/${username}`} className="flex items-center gap-3 flex-1">
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
          <span className="font-semibold text-gray-900">{username}</span>
        </Link>

        {/* Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={deleting}
        >
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />

            {/* Menu */}
            <div className="absolute right-4 top-14 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[160px]">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/${username}`);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Profile
              </button>
              <button
                onClick={handleDeleteConversation}
                disabled={deleting}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? 'Deleting...' : 'Delete Chat'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">👋</div>
            <p className="text-gray-500">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === userId;
              const sharedPost = msg.shared_post;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {/* Shared post */}
                    {sharedPost && (
                      <Link
                        href={`/post/${sharedPost.id}`}
                        className={`mb-1 rounded-lg overflow-hidden border ${
                          isOwn ? 'bg-purple-100 border-purple-300' : 'bg-white border-gray-300'
                        }`}
                      >
                        <div className="relative aspect-[4/5] max-w-[200px]">
                          <Image
                            src={sharedPost.image_url}
                            alt="Shared post"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-gray-600 line-clamp-2">{sharedPost.caption}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            by @{sharedPost.users?.username}
                          </p>
                        </div>
                      </Link>
                    )}

                    {/* Message text */}
                    {msg.content && (
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="break-words">{msg.content}</p>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-400 mt-1 px-2">
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-2 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
