'use client';

import Link from 'next/link';
import Image from 'next/image';
import RatingStars from './RatingStars';
import PostMenu from './PostMenu';
import ReportModal from './ReportModal';
import SharePostModal from './SharePostModal';
import VideoPlayer from './VideoPlayer';
import type { PostWithUser, ReportReason, RatingDimensions } from '@/lib/types';
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
  const [userDimensionalRatings, setUserDimensionalRatings] = useState(post.user_dimensional_ratings);
  const [dimensionalAverages, setDimensionalAverages] = useState(post.dimensional_averages);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
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
    setUserDimensionalRatings(post.user_dimensional_ratings);
    setDimensionalAverages(post.dimensional_averages);
  }, [post.average_rating, post.rating_count, post.user_rating, post.user_rating_created_at, post.user_dimensional_ratings, post.dimensional_averages]);

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

  const handleRate = async (rating: number | RatingDimensions) => {
    if (!userId) return;

    try {
      // Determine if dimensional or single rating
      const isDimensional = typeof rating === 'object';
      const result = await submitRating(post.id, userId, rating, isDimensional);

      // Calculate overall rating for dimensional ratings
      const overallRating = isDimensional
        ? Math.round((rating.style + rating.fit + rating.colorHarmony + rating.occasionMatch) / 4)
        : rating as number;

      if (result.isUpdate) {
        // Editing existing rating
        const oldUserRating = userRating || 0;
        const newAverage = ratingCount > 0
          ? (currentRating * ratingCount - oldUserRating + overallRating) / ratingCount
          : overallRating;

        setCurrentRating(newAverage);
        setUserRating(overallRating);
      } else {
        // New rating
        const newCount = ratingCount + 1;
        const newAverage = (currentRating * ratingCount + overallRating) / newCount;

        setCurrentRating(newAverage);
        setRatingCount(newCount);
        setUserRating(overallRating);
        setUserRatingCreatedAt(new Date().toISOString());
        setHasRated(true);
      }

      // Update dimensional ratings if it was a dimensional rating
      if (isDimensional) {
        const dimRating = rating as RatingDimensions;
        setUserDimensionalRatings(dimRating);

        // Update dimensional averages (approximate - add user's rating to the mix)
        if (dimensionalAverages && ratingCount > 0) {
          const count = result.isUpdate ? ratingCount : ratingCount + 1;
          setDimensionalAverages({
            style: ((dimensionalAverages.style * (count - 1)) + dimRating.style) / count,
            fit: ((dimensionalAverages.fit * (count - 1)) + dimRating.fit) / count,
            colorHarmony: ((dimensionalAverages.colorHarmony * (count - 1)) + dimRating.colorHarmony) / count,
            occasionMatch: ((dimensionalAverages.occasionMatch * (count - 1)) + dimRating.occasionMatch) / count,
          });
        } else {
          // First rating - set averages to user's rating
          setDimensionalAverages(dimRating);
        }
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
          {/* Gender tag for all posts */}
          {post.gender && (
            <div className="flex items-center gap-1 mt-1">
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                <span>{post.gender === 'Menswear' ? '👔' : post.gender === 'Womenswear' ? '👗' : '👤'}</span> {post.gender}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons row */}
        {userId && (
          <div className="flex items-center gap-1">
            {/* Share button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
              title="Share post"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>

            {/* Bookmark button */}
            <button
              onClick={handleSaveToggle}
              disabled={savingInProgress}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
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

            {/* Post Menu */}
            <PostMenu
              postId={post.id}
              isOwner={isOwner}
              onReport={() => setShowReportModal(true)}
              onCopyLink={handleCopyLink}
            />
          </div>
        )}
      </div>

      {/* Media - conditional video/image */}
      <Link href={`/post/${post.id}`}>
        <div className="relative w-full aspect-[4/5] bg-gray-100">
          {post.media_type === 'video' ? (
            <VideoPlayer
              src={post.image_url}
              className="w-full h-full"
              duration={post.duration_seconds || undefined}
            />
          ) : (
            <Image
              src={post.image_url}
              alt={post.caption}
              fill
              className="object-cover"
            />
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Rating section */}
        <div className="mb-3">
          <RatingStars
            postId={post.id}
            userId={userId}
            averageRating={currentRating}
            userRating={userRating}
            userRatingCreatedAt={userRatingCreatedAt}
            hasRated={hasRated}
            onRate={handleRate}
            isOwner={isOwner}
            category={post.category}
            dimensional_averages={dimensionalAverages}
            user_dimensional_ratings={userDimensionalRatings}
            ratingCount={ratingCount}
          />
          <p className="text-xs text-gray-500 mt-1">
            {hasRated || isOwner
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

        {/* View comments link */}
        {post.comment_count !== undefined && post.comment_count > 0 && (
          <Link
            href={`/post/${post.id}`}
            className="text-sm text-gray-500 hover:text-gray-700 mt-2 block"
          >
            View all {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
          </Link>
        )}

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

      {/* Share Post Modal */}
      {showShareModal && userId && (
        <SharePostModal
          postId={post.id}
          userId={userId}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
