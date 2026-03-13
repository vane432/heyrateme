'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile } from '@/lib/queries';
import Image from 'next/image';
import Link from 'next/link';

type Tab = 'posts' | 'top';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null);
  const [followModalUsers, setFollowModalUsers] = useState<any[]>([]);
  const [followModalLoading, setFollowModalLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  useEffect(() => {
    const init = async () => {
      // Load profile publicly — no auth required
      let data = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          data = await getUserProfile(username);
          break;
        } catch {
          if (attempt < 4) await new Promise(r => setTimeout(r, 1000));
        }
      }
      setProfile(data);
      setLoading(false);

      if (!data) return;

      // Check auth state in background
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      const { data: own } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();
      setCurrentUserProfile(own);

      // Load follow stats
      try {
        const res = await fetch(`/api/follow?user_id=${data.user.id}&current_user_id=${user.id}`);
        const stats = await res.json();
        setFollowersCount(stats.followers ?? 0);
        setFollowingCount(stats.following ?? 0);
        setIsFollowing(stats.is_following ?? false);
      } catch {
        // Follow stats unavailable — table may not exist yet
      }
    };
    init();
  }, [username]);

  // Also load follow stats for non-logged-in visitors
  useEffect(() => {
    if (!profile || currentUser) return;
    fetch(`/api/follow?user_id=${profile.user.id}`)
      .then(r => r.json())
      .then(stats => {
        setFollowersCount(stats.followers ?? 0);
        setFollowingCount(stats.following ?? 0);
      })
      .catch(() => {});
  }, [profile, currentUser]);

  const isOwnProfile = currentUserProfile?.username === username;

  const copyLink = () => {
    navigator.clipboard.writeText('https://heyrate.me/' + username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openFollowModal = async (type: 'followers' | 'following') => {
    if (!profile?.user?.id) return;
    setFollowModal(type);
    setFollowModalUsers([]);
    setFollowModalLoading(true);
    try {
      const res = await fetch(`/api/follow?user_id=${profile.user.id}&list=${type}`);
      const json = await res.json();
      setFollowModalUsers(json.users || []);
    } catch {
      setFollowModalUsers([]);
    }
    setFollowModalLoading(false);
  };

  const handleFollow = async () => {
    if (!currentUser) { router.push('/login'); return; }
    if (followLoading || !profile) return;
    setFollowLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    try {
      if (isFollowing) {
        // Unfollow
        await fetch('/api/follow', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            follower_id: currentUser.id,
            following_id: profile.user.id,
            access_token: token,
          }),
        });
        setIsFollowing(false);
        setFollowersCount(c => Math.max(0, c - 1));
      } else {
        // Follow
        await fetch('/api/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            follower_id: currentUser.id,
            following_id: profile.user.id,
            access_token: token,
          }),
        });
        setIsFollowing(true);
        setFollowersCount(c => c + 1);
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-44 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 animate-pulse" />
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-end justify-between -mt-14 mb-4 pb-1">
            <div className="w-28 h-28 rounded-full bg-white border-4 border-white shadow-lg">
              <div className="w-full h-full rounded-full bg-gray-200 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="w-28 h-10 bg-gray-200 rounded-xl animate-pulse" />
              <div className="w-24 h-10 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 mb-6">
            <div className="w-40 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="w-28 h-3 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-5 gap-4 py-4 border-t border-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-5 bg-gray-200 rounded animate-pulse" />
                <div className="w-12 h-3 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-4">
        <div className="text-7xl">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
        <p className="text-gray-500 text-center">@{username} doesn&apos;t exist on HeyRateMe</p>
        <Link href="/" className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition">
          Go Home
        </Link>
      </div>
    );
  }

  const totalRatings = profile.posts.reduce((s: number, p: any) => s + p.rating_count, 0);
  const topPost = profile.posts.reduce((best: any, p: any) =>
    (!best || p.average_rating > best.average_rating) ? p : best, null);
  const ratedPosts = [...profile.posts]
    .filter((p: any) => p.average_rating > 0)
    .sort((a: any, b: any) => b.average_rating - a.average_rating);
  const categories: string[] = Array.from(new Set(profile.posts.map((p: any) => p.category as string)));
  const catEmoji: Record<string, string> = {
    fashion: '👗', food: '🍕', fitness: '💪', tech: '💻', art: '🎨',
    music: '🎵', travel: '✈️', beauty: '💄', sports: '⚽', lifestyle: '✨',
    gaming: '🎮', books: '📚', pets: '🐾', diy: '🔨', other: '🌟',
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ─── Sticky header ─── */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-tight">@{username}</div>
              <div className="text-xs text-gray-400">{profile.postCount} posts</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyLink} title="Share profile" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-500">
              {copied
                ? <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              }
            </button>
            {!currentUser && (
              <Link href="/login" className="text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1.5 rounded-full font-semibold hover:opacity-90 transition">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ─── Profile header ─── */}
      <div className="bg-white shadow-sm">

        {/* Cover banner */}
        <div className="relative h-44 md:h-56 overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-white/10" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-4 right-5 font-black text-white/20 text-5xl select-none tracking-tight">
            @{username}
          </div>
          {profile.averageRating >= 4 && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="text-yellow-400">★</span>
              {profile.averageRating.toFixed(1)} avg rating
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto px-4">

          {/* Avatar + action buttons row */}
          <div className="flex items-end justify-between -mt-14 md:-mt-16 mb-3">
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-[3px] bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 shadow-xl">
                <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white">
                  {profile.user.avatar_url ? (
                    <Image src={profile.user.avatar_url} alt={username} width={128} height={128} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black text-4xl">
                      {username[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              {profile.averageRating >= 4 && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center shadow-md">
                  <span className="text-white text-xs font-black">★</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pb-1">
              {isOwnProfile ? (
                <>
                  <Link href="/create" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-sm">
                    + New Post
                  </Link>
                  <Link href="/edit-profile" className="border-2 border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition">
                    Edit Profile
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition shadow-sm ${isFollowing ? 'border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'}`}
                  >
                    {isFollowing ? '✓ Following' : 'Follow'}
                  </button>
                  <Link href={currentUser ? '/' : '/login'} className="border-2 border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition">
                    Rate
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Name, bio, stars, link */}
          <div className="mb-5">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-black text-gray-900">
                {profile.user.display_name || `@${profile.user.username}`}
              </h1>
              {profile.averageRating >= 4.5 && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  ✦ TOP RATED
                </span>
              )}
            </div>
            {profile.user.display_name && (
              <p className="text-gray-500 text-sm font-medium">@{profile.user.username}</p>
            )}
            <p className="text-gray-400 text-xs mt-0.5">
              Member since {new Date(profile.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            {profile.user.bio && (
              <p className="text-gray-700 text-sm mt-2 leading-relaxed">{profile.user.bio}</p>
            )}
            {/* Social links */}
            {(profile.user.instagram || profile.user.tiktok || profile.user.twitter || profile.user.website) && (
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {profile.user.instagram && (
                  <a href={`https://instagram.com/${profile.user.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-600 transition">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    @{profile.user.instagram}
                  </a>
                )}
                {profile.user.tiktok && (
                  <a href={`https://tiktok.com/@${profile.user.tiktok}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46 6.28 6.28 0 001.86-4.48V8.77a8.18 8.18 0 004.72 1.5v-3.4a4.85 4.85 0 01-1-.18z"/></svg>
                    @{profile.user.tiktok}
                  </a>
                )}
                {profile.user.twitter && (
                  <a href={`https://x.com/${profile.user.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    @{profile.user.twitter}
                  </a>
                )}
                {profile.user.website && (
                  <a href={profile.user.website.startsWith('http') ? profile.user.website : `https://${profile.user.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    {profile.user.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            )}
            {profile.averageRating > 0 && (
              <div className="flex items-center gap-1 mt-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} className={`text-lg leading-none ${s <= Math.round(profile.averageRating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                ))}
                <span className="text-sm font-bold text-gray-700 ml-1">{profile.averageRating.toFixed(2)}</span>
                <span className="text-xs text-gray-400 ml-0.5">/ 5.00</span>
              </div>
            )}
            <button onClick={copyLink} className="flex items-center gap-1.5 mt-2 text-purple-600 text-xs font-medium hover:text-purple-800 transition">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              heyrate.me/{username}
            </button>
          </div>

          {/* Stats bar — Posts | Followers | Following | Ratings | Avg ★ */}
          <div className="grid grid-cols-5 py-4 border-t border-gray-100">
            {[
              { label: 'Posts',     value: profile.postCount, gold: false, onClick: undefined },
              { label: 'Followers', value: followersCount,    gold: false, onClick: () => openFollowModal('followers') },
              { label: 'Following', value: followingCount,    gold: false, onClick: () => openFollowModal('following') },
              { label: 'Ratings',   value: totalRatings,      gold: false, onClick: undefined },
              { label: 'Avg ★',    value: profile.averageRating > 0 ? profile.averageRating.toFixed(1) : '—', gold: true, onClick: undefined },
            ].map(stat => (
              <div key={stat.label} onClick={stat.onClick} className={`flex flex-col items-center text-center transition select-none ${stat.onClick ? 'cursor-pointer hover:opacity-70' : ''}`}>
                <span className={`text-lg font-black leading-none ${stat.gold ? 'text-yellow-500' : 'text-gray-900'}`}>{stat.value}</span>
                <span className="text-xs text-gray-400 mt-1 leading-none">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Category highlights (story-circles) ─── */}
      {categories.length > 0 && (
        <div className="bg-white mt-2 border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex gap-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {categories.map((cat: string) => (
                <div key={cat} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-gray-200 group-hover:border-purple-400 group-hover:shadow-md transition-all duration-200 flex items-center justify-center text-2xl">
                    {catEmoji[cat?.toLowerCase()] || '📌'}
                  </div>
                  <span className="text-xs text-gray-600 capitalize font-medium">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab bar ─── */}
      <div className="bg-white mt-2 border-b border-gray-100 sticky top-14 z-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-sm font-bold border-b-2 transition ${activeTab === 'posts' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Posts
            </button>
            <button
              onClick={() => setActiveTab('top')}
              className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-sm font-bold border-b-2 transition ${activeTab === 'top' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Top Rated
            </button>
          </div>
        </div>
      </div>

      {/* ─── Content area ─── */}
      <div className="max-w-3xl mx-auto">

        {/* Posts grid */}
        {activeTab === 'posts' && (
          profile.posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-5xl mb-4">📸</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-400 text-center text-sm max-w-xs">
                {isOwnProfile ? 'Share something and let the world rate it!' : 'Nothing here yet — check back soon.'}
              </p>
              {isOwnProfile && (
                <Link href="/create" className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl font-bold hover:opacity-90 transition shadow-md">
                  Create First Post
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-px bg-gray-200 mt-2">
              {profile.posts.map((post: any) => (
                <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-square bg-gray-100 overflow-hidden group">
                  <Image
                    src={post.image_url}
                    alt={post.caption}
                    fill
                    sizes="(max-width: 768px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {post.id === topPost?.id && profile.postCount > 1 && (
                    <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-0.5 rounded-full shadow-md">
                      TOP ★
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 z-10 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 p-2">
                    <div className="flex items-center gap-1.5 text-white text-xl font-black">
                      <span className="text-yellow-300">★</span>
                      <span>{post.average_rating > 0 ? post.average_rating.toFixed(1) : '—'}</span>
                    </div>
                    {post.rating_count > 0 && <div className="text-gray-300 text-xs">{post.rating_count} ratings</div>}
                    <p className="text-white/80 text-xs mt-1 text-center line-clamp-2 leading-tight">{post.caption}</p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <span className="text-white text-xs font-medium capitalize">{post.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Top Rated ranked list */}
        {activeTab === 'top' && (
          <div className="p-4 space-y-3 mt-2">
            {ratedPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center text-4xl mb-4">⭐</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No ratings yet</h3>
                <p className="text-gray-400 text-sm text-center">Posts that get rated will appear here, ranked by score.</p>
              </div>
            ) : (
              ratedPosts.map((post: any, index: number) => (
                <Link key={post.id} href={`/post/${post.id}`} className="flex gap-4 bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-all duration-200 group border border-gray-50">
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                    <Image src={post.image_url} alt={post.caption} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{post.caption}</p>
                      <span className={`flex-shrink-0 text-xs font-black w-8 h-6 flex items-center justify-center rounded-full ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                        #{index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-1.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} className={`text-base leading-none ${s <= Math.round(post.average_rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                      ))}
                      <span className="text-sm font-black text-gray-900 ml-2">{post.average_rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{post.rating_count} {post.rating_count === 1 ? 'rating' : 'ratings'}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full capitalize font-medium">{post.category}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* ─── Guest CTA banner (only for non-logged-in visitors) ─── */}
      {!currentUser && profile.posts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-4">
          <div className="max-w-sm mx-auto mb-4 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Join HeyRateMe</p>
              <p className="text-xs text-gray-500 mt-0.5">Follow {username} and rate their posts</p>
            </div>
            <Link href="/login" className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition shadow-md">
              Sign In
            </Link>
          </div>
        </div>
      )}

      <div className="h-28" />

      {/* ─── Followers / Following Modal ─── */}
      {followModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setFollowModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg capitalize">{followModal}</h2>
              <button onClick={() => setFollowModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 py-2">
              {followModalLoading ? (
                <div className="flex justify-center py-10 text-gray-400 text-sm">Loading…</div>
              ) : followModalUsers.length === 0 ? (
                <div className="flex justify-center py-10 text-gray-400 text-sm">No {followModal} yet</div>
              ) : (
                followModalUsers.map((u: any) => (
                  <Link
                    key={u.id}
                    href={`/${u.username}`}
                    onClick={() => setFollowModal(null)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                  >
                    {u.avatar_url ? (
                      <Image src={u.avatar_url} alt={u.username} width={40} height={40} className="rounded-full object-cover w-10 h-10" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                        {(u.display_name || u.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{u.display_name || u.username}</p>
                      <p className="text-xs text-gray-400">@{u.username}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
