'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getFeedPosts } from '@/lib/queries';
import PostCard from '@/components/PostCard';
import CategoryFilter from '@/components/CategoryFilter';
import NotificationBell from '@/components/NotificationBell';
import type { PostWithUser } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

export default function FeedView() {
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('users')
        .select('username, avatar_url, display_name')
        .eq('id', user.id)
        .single();
      setUserProfile(profile);
    };
    init();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [selectedCategory, selectedGender, userId]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getFeedPosts(
        selectedCategory || undefined,
        selectedGender || undefined,
        userId
      );
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            HeyRateMe
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/create" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:opacity-90 transition">
              + Post
            </Link>

            {/* Notification Bell */}
            {userId && <NotificationBell userId={userId} />}

            {userProfile?.username && (
              <Link href={`/profile/${userProfile.username}`} className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition">
                {userProfile.avatar_url ? (
                  <Image src={userProfile.avatar_url} alt="" width={32} height={32} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    {userProfile.username[0].toUpperCase()}
                  </div>
                )}
              </Link>
            )}
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition" title="Sign out">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedGender={selectedGender}
          onGenderChange={setSelectedGender}
        />

        {loading ? (
          <div className="space-y-6 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="space-y-1">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="w-16 h-3 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="aspect-[4/5] bg-gray-200 animate-pulse" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-4xl mx-auto mb-4">
              📸
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your feed is empty</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Be the first to post something or explore top posts!
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/create" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition shadow-md">
                Create Post
              </Link>
              <Link href="/top" className="border-2 border-gray-200 bg-white text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition">
                Top Posts
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} userId={userId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
