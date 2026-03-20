'use client';

import Link from 'next/link';
import Image from 'next/image';
import RatingStars from './RatingStars';
import type { PostWithUser } from '@/lib/types';
import { submitRating } from '@/lib/queries';
import { useState, useEffect } from 'react';

interface PostCardProps {
  post: PostWithUser;
  userId?: string;
  onRatingUpdate?: () => void;
}

export default function PostCard({ post, userId, onRatingUpdate }: PostCardProps) {
  const [currentRating, setCurrentRating] = useState(post.average_rating);
  const [ratingCount, setRatingCount] = useState(post.rating_count);
  const [userRating, setUserRating] = useState(post.user_rating);
  const [hasRated, setHasRated] = useState(!!post.user_rating);

  // Sync when parent reloads the post (e.g. page refresh with user_rating from server)
  useEffect(() => {
    setCurrentRating(post.average_rating);
    setRatingCount(post.rating_count);
    setUserRating(post.user_rating);
    setHasRated(!!post.user_rating);
  }, [post.average_rating, post.rating_count, post.user_rating]);

  const handleRate = async (rating: number) => {
    if (!userId) return;

    try {
      await submitRating(post.id, userId, rating);
      
      // Update local state — no need to reload the whole feed
      const newCount = ratingCount + 1;
      const newAverage = (currentRating * ratingCount + rating) / newCount;
      
      setCurrentRating(newAverage);
      setRatingCount(newCount);
      setUserRating(rating);
      setHasRated(true);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
          {post.users.avatar_url ? (
            <Image
              src={post.users.avatar_url}
              alt={post.users.username}
              width={40}
              height={40}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white font-bold">
              {post.users.username[0].toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <Link
            href={`/${post.users.username}`}
            className="font-semibold text-gray-900 hover:underline"
          >
            {post.users.username}
          </Link>
          <p className="text-xs text-gray-500">{post.category}</p>
        </div>
      </div>

      {/* Media - conditional video/image */}
      <Link href={`/post/${post.id}`}>
        <div className="relative w-full aspect-square bg-gray-100">
          {post.media_type === 'video' ? (
            <video
              src={post.image_url}
              className="w-full h-full object-cover"
              muted
              playsInline
              loop
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            />
          ) : (
            <Image
              src={post.image_url}
              alt={post.caption}
              fill
              className="object-cover"
            />
          )}

          {/* Duration badge for videos */}
          {post.media_type === 'video' && post.duration_seconds && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {Math.floor(post.duration_seconds / 60)}:{String(post.duration_seconds % 60).padStart(2, '0')}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Rating */}
        <div className="mb-3">
          <RatingStars
            postId={post.id}
            userId={userId}
            averageRating={currentRating}
            userRating={userRating}
            hasRated={hasRated}
            onRate={handleRate}
          />
          <p className="text-xs text-gray-500 mt-1">
            {hasRated
              ? `${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`
              : userId ? '' : `${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`
            }
          </p>
        </div>

        {/* Caption */}
        <p className="text-gray-900">
          <Link
            href={`/${post.users.username}`}
            className="font-semibold hover:underline"
          >
            {post.users.username}
          </Link>{' '}
          <span className="text-gray-700">{post.caption}</span>
        </p>

        {/* Timestamp */}
        <p className="text-xs text-gray-400 mt-2">
          {new Date(post.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
