'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Navbar from './Navbar';

export default function MobileLayoutShell({ children, forceRender = false }: { children: React.ReactNode, forceRender?: boolean }) {
  const [username, setUsername] = useState<string | null>(null);
  const pathname = usePathname();

  // Fetch session username dynamically for the profile tab
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('username')
          .eq('id', session.user.id)
          .single();
        if (data?.username) setUsername(data.username);
      }
    };
    fetchUser();
  }, []);

  // Don't show app shell on landing page (unless forced by the authenticated hook) or auth routes
  if (!forceRender && (pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/login'))) {
    return <>{children}</>;
  }

  return (
    <div className="w-full md:min-h-screen md:h-auto h-[100dvh] overflow-hidden md:overflow-visible flex flex-col bg-white dark:bg-black text-black dark:text-white">
      {/* ── Desktop Navbar (Hidden on Mobile) ── */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* ── Scroll-Isolated Content Area ── */}
      {/* hide scrollbar but allow scrolling using standard css approaches */}
      <main className="flex-1 md:overflow-visible md:pt-0 md:pb-0 overflow-y-auto pb-[calc(3rem+env(safe-area-inset-bottom))] scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {children}
      </main>

      {/* ── Reachable Bottom App Tab Navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around z-40 pb-[env(safe-area-inset-bottom)] h-[calc(3rem+env(safe-area-inset-bottom))]">
        {/* Home */}
        <Link href="/" className={`p-2 hover:opacity-70 transition-opacity ${pathname === '/' || pathname === '/feed' ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}`} aria-label="Home">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </Link>

        {/* Search */}
        <Link href="/top" className={`p-2 hover:opacity-70 transition-opacity ${pathname === '/top' ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}`} aria-label="Search">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </Link>

        {/* Messages */}
        <Link href="/messages" className={`p-2 hover:opacity-70 transition-opacity ${pathname.startsWith('/messages') ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}`} aria-label="Messages">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
        </Link>

        {/* Profile */}
        <Link href={username ? `/${username}` : "/login"} className={`p-2 hover:opacity-70 transition-opacity ${pathname === `/${username}` ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}`} aria-label="Profile">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" />
            <path d="M20 21a8 8 0 0 0-16 0" />
          </svg>
        </Link>
      </nav>
    </div>
  );
}