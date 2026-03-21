'use client';

import Link from 'next/link';
import Image from 'next/image';
import RatingStars from './RatingStars';
import PostMenu from './PostMenu';
import ReportModal from './ReportModal';
import type { PostWithUser, ReportReason } from '@/lib/types';
import { submitRating, submitReport, savePost, unsavePost, isPostSaved } from '@/lib/queries';
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
  const [userRatingCreatedAt, setUserRatingCreatedAt] = useState(post.user_rating_created_at);
  const [hasRated, setHasRated] = useState(!!post.user_rating);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingInProgress, setSavingInProgress] = useState(false);

  // Sync when parent reloads the post (e.g. page refresh with user_rating from server)
  useEffect(() => {
    setCurrentRating(post.average_rating);
    setRatingCount(post.rating_count);
    setUserRating(post.user_rating);
    setUserRatingCreatedAt(post.user_rating_created_at);
    setHasRated(!!post.user_rating);
  }, [post.average_rating, post.rating_count, post.user_rating, post.user_rating_created_at]);

  // Check if post is saved on mount
  useEffect(() => {
    if (userId) {
      isPostSaved(userId, post.id).then(setIsSaved).catch(() => {});
    }
  }, [userId, post.id]);

  const handleSaveToggle = async () => {
    if (!userId || savingInProgress) return;

    setSavingInProgress(true);
    try {
      if (isSaved) {
        await unsavePost(userId, post.id);
        setIsSaved(false);
      } else {
        await savePost(userId, post.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Failed to save/unsave post:', error);
    }
    setSavingInProgress(false);
  };

  const handleRate = async (rating: number) => {
    if (!userId) return;

    try {
      const result = await submitRating(post.id, userId, rating);

      if (result.isUpdate) {
        // Editing existing rating - recalculate average
        const oldUserRating = userRating || 0;
        const newAverage = ratingCount > 0
          ? (currentRating * ratingCount - oldUserRating + rating) / ratingCount
          : rating;

        setCurrentRating(newAverage);
        setUserRating(rating);
      } else {
        // New rating
        const newCount = ratingCount + 1;
        const newAverage = (currentRating * ratingCount + rating) / newCount;

        setCurrentRating(newAverage);
        setRatingCount(newCount);
        setUserRating(rating);
        setUserRatingCreatedAt(new Date().toISOString());
        setHasRated(true);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReport = async (reason: ReportReason, details?: string) => {
    if (!userId) throw new Error('You must be logged in to report');
    await submitReport(post.id, userId, reason, details);
  };

  const isOwner = userId === post.user_id;

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
        <div className="flex-1">
          <Link
            href={`/${post.users.username}`}
            className="font-semibold text-gray-900 hover:underline"
          >
            {post.users.username}
          </Link>
          <p className="text-xs text-gray-500">{post.category}</p>
        </div>

        {/* Post Menu */}
        {userId && (
          <PostMenu
            postId={post.id}
            isOwner={isOwner}
            onReport={() => setShowReportModal(true)}
            onCopyLink={handleCopyLink}
          />
        )}
      </div>

      {/* Media - conditional video/image */}
      <Link href={`/post/${post.id}`}>
        <div className="relative w-full aspect-[4/5] bg-gray-100">
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
        {/* Rating and Save row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <RatingStars
              postId={post.id}
              userId={userId}
              averageRating={currentRating}
              userRating={userRating}
              userRatingCreatedAt={userRatingCreatedAt}
              hasRated={hasRated}
              onRate={handleRate}
              isOwner={isOwner}
            />
            <p className="text-xs text-gray-500 mt-1">
              {hasRated || isOwner
                ? `${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`
                : userId ? '' : `${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`
              }
            </p>
          </div>

          {/* Bookmark button */}
          {userId && (
            <button
              onClick={handleSaveToggle}
              disabled={savingInProgress}
              className={`p-2 rounded-full transition-colors ${
                isSaved ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={isSaved ? 'Unsave post' : 'Save post'}
            >
              {isSaved ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              )}
            </button>
          )}
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

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          postId={post.id}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReport}
        />
      )}
    </div>
  );
}
