'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getFeedPosts } from '@/lib/queries';
import PostCard from '@/components/PostCard';
import { CATEGORIES, GENDERS } from '@/lib/types';
import type { PostWithUser } from '@/lib/types';

export default function HomePage() {
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [selectedCategory, selectedGender, user]);

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

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    } else {
      setUser(user);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getFeedPosts(
        selectedCategory || undefined,
        selectedGender || undefined,
        user?.id
      );
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            HeyRateMe
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/create')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:opacity-90 transition hidden sm:flex"
            >
              + Post
            </button>
            <button
              onClick={() => router.push('/create')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:opacity-90 transition sm:hidden"
            >
              <span className="text-sm font-bold">+</span>
            </button>

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
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">No posts yet</p>
            <button
              onClick={() => router.push('/create')}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
            >
              Create the first post
            </button>
          </div>
        ) : (
          <div>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} userId={user?.id} onRatingUpdate={loadPosts} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
