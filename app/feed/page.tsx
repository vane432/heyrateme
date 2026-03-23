'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getFeedPosts } from '@/lib/queries';
import PostCard from '@/components/PostCard';
import CategoryFilter from '@/components/CategoryFilter';
import type { PostWithUser } from '@/lib/types';

export default function HomePage() {
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
      />

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
  );
}
