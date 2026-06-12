'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import NotificationBell from './NotificationBell';
import MessageIcon from './MessageIcon';
import InviteModal from './InviteModal';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from('users').select('username').eq('id', user.id).single().then(({ data }) => {
          setUsername((data as any)?.username ?? null);
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('users').select('username').eq('id', session.user.id).single().then(({ data }) => {
          setUsername((data as any)?.username ?? null);
        });
      } else {
        setUsername(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <>
      <nav className="bg-white dark:bg-[#09090B] border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent shrink-0">
              HeyRateMe
            </Link>

            <div className="flex items-center gap-2 sm:gap-4 text-sm">
              {user ? (
                <>
                  <Link href="/top" className="hidden sm:block text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 font-medium">Charts</Link>

                  {/* Notification Bell */}
                  <NotificationBell userId={user.id} />

                  {/* Message Icon */}
                  <MessageIcon userId={user.id} />

                  {/* Invite Button */}
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="hidden sm:flex items-center gap-1 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 font-medium"
                    title="Invite friends"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </button>

                  {username && (
                    <div className="relative" ref={profileMenuRef}>
                      <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0 hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 dark:focus:ring-offset-[#09090B]"
                        aria-label="Profile menu"
                      >
                        {username[0].toUpperCase()}
                      </button>

                      {showProfileMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 py-2 z-50">
                          <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">@{username}</p>
                          </div>
                          <Link
                            href={`/${username}`}
                            onClick={() => setShowProfileMenu(false)}
                            className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            Profile
                          </Link>
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              handleSignOut();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Link href="/login" className="bg-black text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 font-medium">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} />
      )}
    </>
  );
}
