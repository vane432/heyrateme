'use client';

import Link from 'next/link';
import Image from 'next/image';
import RatingStars from './RatingStars';
import type { PostWithUser } from '@/lib/types';
import { submitRating } from '@/lib/queries';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface PostCardProps {
  post: PostWithUser;
  onRatingUpdate?: () => void;
}

export default function PostCard({ post, onRatingUpdate }: PostCardProps) {
  const [currentRating, setCurrentRating] = useState(post.average_rating);
  const [ratingCount, setRatingCount] = useState(post.rating_count);
  const [userRating, setUserRating] = useState(post.user_rating);
  const [userId, setUserId] = useState<string | undefined>();

  // Get user ID on mount
  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  });

  const handleRate = async (rating: number) => {
    if (!userId) return;

    try {
      await submitRating(post.id, userId, rating);
      
      // Update local state
      const newCount = ratingCount + 1;
      const newAverage = (currentRating * ratingCount + rating) / newCount;
      
      setCurrentRating(newAverage);
      setRatingCount(newCount);
      setUserRating(rating);

      if (onRatingUpdate) {
        onRatingUpdate();
      }
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
            href={`/profile/${post.users.username}`}
            className="font-semibold text-gray-900 hover:underline"
          >
            {post.users.username}
          </Link>
          <p className="text-xs text-gray-500">{post.category}</p>
        </div>
      </div>

      {/* Image */}
      <Link href={`/post/${post.id}`}>
        <div className="relative w-full aspect-square bg-gray-100">
          <Image
            src={post.image_url}
            alt={post.caption}
            fill
            className="object-cover"
          />
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
            onRate={handleRate}
          />
          <p className="text-xs text-gray-500 mt-1">
            {userRating
              ? `${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`
              : userId ? '' : `${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`
            }
          </p>
        </div>

        {/* Caption */}
        <p className="text-gray-900">
          <Link
            href={`/profile/${post.users.username}`}
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
