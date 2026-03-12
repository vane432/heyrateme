'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            HeyRateMe
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-gray-700 hover:text-gray-900 transition">How It Works</a>
            <a href="#top-posts" className="text-gray-700 hover:text-gray-900 transition">Top Posts</a>

            {user && profile ? (
              <div className="flex items-center gap-4">
                <Link href="/" className="text-gray-700 hover:text-gray-900 transition font-medium">Feed</Link>
                <Link href={`/profile/${profile.username}`} className="flex items-center gap-2 group">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 border-2 border-transparent group-hover:border-purple-500 transition">
                    {profile.avatar_url ? (
                      <Image src={profile.avatar_url} alt={profile.username} width={36} height={36} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                        {profile.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-800 font-medium text-sm">{profile.username}</span>
                </Link>
                <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-900 transition">
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-gray-900 transition">Sign In</Link>
                <Link href="/login" className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 space-y-4">
            <a href="#how-it-works" className="block text-gray-700 hover:text-gray-900" onClick={() => setIsOpen(false)}>How It Works</a>
            <a href="#top-posts" className="block text-gray-700 hover:text-gray-900" onClick={() => setIsOpen(false)}>Top Posts</a>
            {user && profile ? (
              <>
                <Link href="/" className="block text-gray-700 hover:text-gray-900">Feed</Link>
                <Link href={`/profile/${profile.username}`} className="block text-gray-700 hover:text-gray-900">@{profile.username}</Link>
                <button onClick={handleSignOut} className="block text-gray-500 hover:text-gray-900 w-full text-left">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-gray-700 hover:text-gray-900">Sign In</Link>
                <Link href="/login" className="block bg-black text-white px-6 py-2 rounded-lg text-center hover:bg-gray-800">Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
