'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getPostById, deletePost, submitRating } from '@/lib/queries';
import Image from 'next/image';
import Link from 'next/link';
import RatingStars from '@/components/RatingStars';
import type { PostWithUser, RatingDimensions } from '@/lib/types';

export default function PostPage() {
  const [post, setPost] = useState<PostWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userRatingCreatedAt, setUserRatingCreatedAt] = useState<string | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  useEffect(() => {
    checkUserAndLoadPost();
  }, [postId]);

  // Sync state when post data changes
  useEffect(() => {
    if (post) {
      setCurrentRating(post.average_rating);
      setRatingCount(post.rating_count);
      setUserRating(post.user_rating);
      setUserRatingCreatedAt(post.user_rating_created_at);
      setHasRated(!!post.user_rating);
    }
  }, [post]);

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
      setCurrentRating(data.average_rating);
      setRatingCount(data.rating_count);
      setUserRating(data.user_rating);
      setUserRatingCreatedAt(data.user_rating_created_at);
      setHasRated(!!data.user_rating);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (rating: number | RatingDimensions) => {
    if (!user) return;

    try {
      // Determine if dimensional or single rating
      const isDimensional = typeof rating === 'object';
      const result = await submitRating(post!.id, user.id, rating, isDimensional);

      // Calculate overall rating for dimensional ratings
      const overallRating = isDimensional
        ? Math.round((rating.style + rating.fit + rating.colorHarmony + rating.occasionMatch) / 4)
        : rating as number;

      if (result.isUpdate) {
        // Editing existing rating - for simplicity, trigger a page refresh for dimensional
        if (isDimensional) {
          window.location.reload();
        } else {
          // Recalculate average for single rating
          const oldUserRating = userRating || 0;
          const newAverage = ratingCount > 0
            ? (currentRating * ratingCount - oldUserRating + overallRating) / ratingCount
            : overallRating;

          setCurrentRating(newAverage);
          setUserRating(overallRating);
          setUserRatingCreatedAt(result.created_at);
          setHasRated(true);
        }
      } else {
        // New rating
        if (isDimensional) {
          window.location.reload();
        } else {
          // Recalculate average for single rating
          const newCount = ratingCount + 1;
          const newAverage = (currentRating * ratingCount + overallRating) / newCount;

          setCurrentRating(newAverage);
          setRatingCount(newCount);
          setUserRating(overallRating);
          setUserRatingCreatedAt(result.created_at);
          setHasRated(true);
        }
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async () => {
    if (!user || !post) return;

    setIsDeleting(true);
    try {
      await deletePost(postId, user.id);
      router.push(`/${post.users.username}`); // Redirect to user profile
    } catch (error: any) {
      alert(error.message);
      setIsDeleting(false);
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
          {/* Media */}
          <div className="md:w-2/3 relative aspect-square bg-gray-100">
            {post.media_type === 'video' ? (
              <video
                src={post.image_url}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <Image
                src={post.image_url}
                alt={post.caption}
                fill
                className="object-contain"
              />
            )}
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
              <div className="flex-1">
                <Link
                  href={`/${post.users.username}`}
                  className="font-semibold text-gray-900 hover:underline"
                >
                  {post.users.username}
                </Link>
                <p className="text-sm text-gray-500">{post.category}</p>
              </div>

              {/* Delete button (only for post owner) */}
              {user && post.user_id === user.id && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700 text-sm"
                  title="Delete post"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {/* Caption */}
            <div className="mb-6">
              <p className="text-gray-900">
                <Link
                  href={`/${post.users.username}`}
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
                averageRating={currentRating}
                userRating={userRating}
                userRatingCreatedAt={userRatingCreatedAt}
                hasRated={hasRated}
                onRate={handleRate}
                isOwner={user && post.user_id === user.id}
                category={post.category}
                dimensional_averages={post.dimensional_averages}
                user_dimensional_ratings={post.user_dimensional_ratings}
                ratingCount={ratingCount}
              />
              <p className="text-sm text-gray-500 mt-2">
                {(hasRated || (user && post.user_id === user.id))
                  ? `${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`
                  : ''}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Post?</h3>
            <p className="text-gray-600 text-sm mb-6">
              This action cannot be undone. Your post and all its ratings will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
