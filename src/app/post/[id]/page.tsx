'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getPostById } from '@/lib/queries';
import Image from 'next/image';
import Link from 'next/link';
import RatingStars from '@/components/RatingStars';
import { submitRating } from '@/lib/queries';
import type { PostWithUser } from '@/lib/types';

export default function PostPage() {
  const [post, setPost] = useState<PostWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  useEffect(() => {
    checkUserAndLoadPost();
  }, [postId]);

  const checkUserAndLoadPost = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/login');
      return;
    }
    setUser(authUser);
    await loadPost(authUser.id);
  };

  const loadPost = async (userId: string) => {
    setLoading(true);
    try {
      const data = await getPostById(postId, userId);
      setPost(data);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (!user) return;

    try {
      await submitRating(postId, user.id, rating);
      await loadPost(user.id);
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Post not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Image */}
          <div className="md:w-2/3 relative aspect-square bg-gray-100">
            <Image
              src={post.image_url}
              alt={post.caption}
              fill
              className="object-contain"
            />
          </div>

          {/* Details */}
          <div className="md:w-1/3 p-6 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b">
              <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden">
                {post.users.avatar_url ? (
                  <Image
                    src={post.users.avatar_url}
                    alt={post.users.username}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white font-bold text-lg">
                    {post.users.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <Link
                  href={`/profile/${post.users.username}`}
                  className="font-semibold text-gray-900 hover:underline"
                >
                  {post.users.username}
                </Link>
                <p className="text-sm text-gray-500">{post.category}</p>
              </div>
            </div>

            {/* Caption */}
            <div className="mb-6">
              <p className="text-gray-900">
                <Link
                  href={`/profile/${post.users.username}`}
                  className="font-semibold hover:underline"
                >
                  {post.users.username}
                </Link>{' '}
                <span className="text-gray-700">{post.caption}</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Rating */}
            <div className="mt-auto">
              <RatingStars
                postId={post.id}
                userId={user?.id}
                averageRating={post.average_rating}
                userRating={post.user_rating}
                onRate={handleRate}
              />
              <p className="text-sm text-gray-500 mt-2">
                {post.rating_count} {post.rating_count === 1 ? 'rating' : 'ratings'}
              </p>

              {/* Comments placeholder */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 italic">
                  Comments coming soon...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
