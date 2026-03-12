'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile } from '@/lib/queries';
import Image from 'next/image';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  useEffect(() => {
    const init = async () => {
      // Retry auth check up to 3 times with delay to avoid redirect loop
      // caused by session not being immediately available after OAuth
      let user = null;
      for (let i = 0; i < 3; i++) {
        const { data } = await supabase.auth.getUser();
        if (data.user) { user = data.user; break; }
        if (i < 2) await new Promise(r => setTimeout(r, 1000));
      }

      if (!user) { router.push('/login'); return; }
      setCurrentUser(user);

      // Get current user's own profile for comparison
      const { data: ownProfile } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();
      setCurrentUserProfile(ownProfile);

      try {
        const data = await getUserProfile(username);
        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [username, router]);

  const isOwnProfile = currentUserProfile?.username === username;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="text-6xl">🔍</div>
        <h2 className="text-2xl font-bold text-gray-800">User not found</h2>
        <p className="text-gray-500">@{username} doesn't exist</p>
        <Link href="/feed" className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
          Back to Feed
        </Link>
      </div>
    );
  }

  const totalRatings = profile.posts.reduce((sum: number, p: any) => sum + p.rating_count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav bar */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold text-gray-900">@{profile.user.username}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          {/* Top row: avatar + stats */}
          <div className="flex items-center gap-8 mb-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-purple-100">
                {profile.user.avatar_url ? (
                  <Image
                    src={profile.user.avatar_url}
                    alt={profile.user.username}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-4xl">
                    {profile.user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center p-3 rounded-xl bg-gray-50">
                <span className="text-2xl font-bold text-gray-900">{profile.postCount}</span>
                <span className="text-xs text-gray-500 mt-0.5">Posts</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-gray-50">
                <span className="text-2xl font-bold text-gray-900">{totalRatings}</span>
                <span className="text-xs text-gray-500 mt-0.5">Ratings</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-yellow-50">
                <span className="text-2xl font-bold text-yellow-600 flex items-center gap-0.5">
                  {profile.averageRating > 0 ? profile.averageRating.toFixed(1) : '—'}
                  {profile.averageRating > 0 && <span className="text-yellow-400 text-lg">★</span>}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">Avg Rating</span>
              </div>
            </div>
          </div>

          {/* Username and email */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900">@{profile.user.username}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{profile.user.email}</p>
            <p className="text-sm text-gray-600 mt-2">
              Member since {new Date(profile.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Star rating visual */}
          {profile.averageRating > 0 && (
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-xl ${star <= Math.round(profile.averageRating) ? 'text-yellow-400' : 'text-gray-200'}`}
                >
                  ★
                </span>
              ))}
              <span className="text-sm text-gray-500 ml-1">
                {profile.averageRating.toFixed(2)} out of 5
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {isOwnProfile ? (
              <>
                <Link
                  href="/create"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition"
                >
                  + New Post
                </Link>
                <Link
                  href="/feed"
                  className="flex-1 bg-gray-100 text-gray-800 text-center py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
                >
                  View Feed
                </Link>
              </>
            ) : (
              <Link
                href="/feed"
                className="flex-1 bg-gray-100 text-gray-800 text-center py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
              >
                ← Back to Feed
              </Link>
            )}
          </div>
        </div>

        {/* Posts section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Posts
            </h2>
            <span className="text-sm text-gray-400">{profile.postCount} {profile.postCount === 1 ? 'post' : 'posts'}</span>
          </div>

          {profile.posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-20 flex flex-col items-center gap-4">
              <div className="text-6xl">📸</div>
              <h3 className="text-xl font-semibold text-gray-700">No posts yet</h3>
              <p className="text-gray-400 text-sm">
                {isOwnProfile ? 'Share your first post and get rated!' : 'This user hasn\'t posted anything yet.'}
              </p>
              {isOwnProfile && (
                <Link
                  href="/create"
                  className="mt-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition"
                >
                  Create First Post
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {profile.posts.map((post: any, index: number) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="relative aspect-square bg-gray-100 rounded-lg md:rounded-xl overflow-hidden group"
                >
                  <Image
                    src={post.image_url}
                    alt={post.caption}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Top badge for best post */}
                  {index === 0 && profile.postCount > 1 && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                      TOP
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-center">
                      <div className="flex items-center justify-center gap-1 text-lg font-bold">
                        <span className="text-yellow-400 text-xl">★</span>
                        <span>{post.average_rating > 0 ? post.average_rating.toFixed(1) : '—'}</span>
                      </div>
                      <div className="text-xs text-gray-200 mt-0.5">
                        {post.rating_count} {post.rating_count === 1 ? 'rating' : 'ratings'}
                      </div>
                    </div>
                  </div>
                  {/* Category chip */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    <span className="text-white text-xs font-medium">{post.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
