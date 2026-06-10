import React from 'react';
import Link from 'next/link';

export default function MobileLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen overflow-hidden flex flex-col bg-black text-white">
      {/* ── Fixed Top Header Module ── */}
      <header className="fixed top-0 left-0 w-full h-14 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 z-40">
        <Link href="/" className="text-xl font-bold tracking-tight">
          heyrate.me
        </Link>
        
        <div className="flex items-center gap-5">
          {/* Add Post Trigger */}
          <Link href="/create" aria-label="Add Post" className="hover:opacity-70 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </Link>
          
          {/* Notification Bell */}
          <Link href="/notifications" aria-label="Notifications" className="hover:opacity-70 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </Link>
        </div>
      </header>

      {/* ── Scroll-Isolated Content Area ── */}
      {/* hide scrollbar but allow scrolling using standard css approaches */}
      <main className="flex-1 overflow-y-auto pt-14 pb-16 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {children}
      </main>

      {/* ── Reachable Bottom App Tab Navigation ── */}
      <nav className="fixed bottom-0 left-0 w-full bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800 flex items-center justify-around z-40 pb-[env(safe-area-inset-bottom)] h-[calc(4rem+env(safe-area-inset-bottom))]">
        {/* Home */}
        <Link href="/" className="p-2 hover:opacity-70 transition-opacity" aria-label="Home">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </Link>

        {/* Search */}
        <Link href="/search" className="p-2 hover:opacity-70 transition-opacity" aria-label="Search">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </Link>

        {/* Messages */}
        <Link href="/messages" className="p-2 hover:opacity-70 transition-opacity" aria-label="Messages">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
        </Link>

        {/* Profile */}
        <Link href="/profile" className="p-2 hover:opacity-70 transition-opacity" aria-label="Profile">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" />
            <path d="M20 21a8 8 0 0 0-16 0" />
          </svg>
        </Link>
      </nav>
    </div>
  );
}