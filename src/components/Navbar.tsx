'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import NotificationBell from './NotificationBell';
import InviteModal from './InviteModal';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from('users').select('username').eq('id', user.id).single().then(({ data }) => {
          setUsername(data?.username ?? null);
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('users').select('username').eq('id', session.user.id).single().then(({ data }) => {
          setUsername(data?.username ?? null);
        });
      } else {
        setUsername(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="text-xl font-bold text-gray-900 shrink-0">
              HeyRateMe
            </Link>

            <div className="flex items-center gap-2 sm:gap-4 text-sm">
              {user ? (
                <>
                  <Link href="/feed" className="text-gray-700 hover:text-gray-900 font-medium">Feed</Link>
                  <Link href="/top" className="hidden sm:block text-gray-700 hover:text-gray-900 font-medium">Top</Link>
                  <Link href="/create" className="text-gray-700 hover:text-gray-900 font-medium">Create</Link>

                  {/* Invite Button */}
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="hidden sm:flex items-center gap-1 text-gray-700 hover:text-gray-900 font-medium"
                    title="Invite friends"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </button>

                  {/* Notification Bell */}
                  <NotificationBell userId={user.id} />

                  <button onClick={handleSignOut} className="text-gray-700 hover:text-gray-900 font-medium">
                    Sign Out
                  </button>
                  {username && (
                    <Link href={`/${username}`} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {username[0].toUpperCase()}
                    </Link>
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
