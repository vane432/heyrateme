'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getFeedPosts } from '@/lib/queries';
import PostCard from '@/components/PostCard';
import NotificationBell from '@/components/NotificationBell';
import { CATEGORIES, GENDERS } from '@/lib/types';
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
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowCategoryDropdown(false);
        setShowGenderDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

            {/* Category Search Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowGenderDropdown(false);
                }}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Search categories"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-48">
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Style Categories</div>
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      selectedCategory === null ? 'bg-black text-white hover:bg-gray-800' : 'text-gray-700'
                    }`}
                  >
                    All Styles
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory('__friends__');
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                      selectedCategory === '__friends__' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'text-gray-700'
                    }`}
                  >
                    <span>👥</span> Friends
                  </button>
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowCategoryDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        selectedCategory === category ? 'bg-black text-white hover:bg-gray-800' : 'text-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Gender Filter Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setShowGenderDropdown(!showGenderDropdown);
                  setShowCategoryDropdown(false);
                }}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Filter by gender"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>

              {showGenderDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-48">
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender Style</div>
                  <button
                    onClick={() => {
                      setSelectedGender(null);
                      setShowGenderDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      selectedGender === null ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700'
                    }`}
                  >
                    All Genders
                  </button>
                  {GENDERS.map((gender) => (
                    <button
                      key={gender}
                      onClick={() => {
                        setSelectedGender(gender);
                        setShowGenderDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                        selectedGender === gender ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span>{gender === 'Menswear' ? '👔' : gender === 'Womenswear' ? '👗' : '👤'}</span>
                      {gender}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
