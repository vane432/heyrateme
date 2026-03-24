'use client';

import { useState, useEffect } from 'react';
import { canEditRating, getRatingEditTimeRemaining } from '@/lib/queries';
import type { RatingDimensions } from '@/lib/types';
import RatingDimensionsInput from './RatingDimensionsInput';
import DimensionalRatingDisplay from './DimensionalRatingDisplay';

interface RatingStarsProps {
  postId: string;
  userId?: string;
  averageRating: number;
  userRating?: number;
  userRatingCreatedAt?: string;
  hasRated?: boolean;
  onRate?: (rating: number | RatingDimensions) => void;
  readonly?: boolean;
  isOwner?: boolean;
  // New props for dimensional ratings
  category?: string;
  dimensional_averages?: RatingDimensions;
  user_dimensional_ratings?: RatingDimensions;
  ratingCount?: number;
}

export default function RatingStars({
  postId,
  userId,
  averageRating,
  userRating,
  userRatingCreatedAt,
  hasRated: hasRatedProp,
  onRate,
  readonly = false,
  isOwner = false,
  category,
  dimensional_averages,
  user_dimensional_ratings,
  ratingCount = 0,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTimeRemaining, setEditTimeRemaining] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // hasRated can be passed explicitly (PostCard) or derived from userRating (post detail page)
  const hasRated = hasRatedProp !== undefined ? hasRatedProp : !!userRating;

  // Check if user can still edit their rating
  const canEdit = hasRated && userRatingCreatedAt && canEditRating(userRatingCreatedAt);

  // Update countdown timer
  useEffect(() => {
    if (!canEdit || !userRatingCreatedAt) {
      setEditTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = getRatingEditTimeRemaining(userRatingCreatedAt);
      setEditTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [canEdit, userRatingCreatedAt]);

  // Reset editing mode when edit window expires
  useEffect(() => {
    if (!canEdit) {
      setIsEditing(false);
    }
  }, [canEdit]);

  // Handle dimensional rating submission
  const handleDimensionalRate = async (dimensions: RatingDimensions) => {
    if (!onRate || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onRate(dimensions);
      // After successful rating, exit edit mode to show the display
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to submit dimensional rating:', error);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  // Format remaining time as m:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Show dimensional input for new ratings (hasn't rated yet)
  if (!readonly && userId && !hasRated && !isOwner) {
    return (
      <RatingDimensionsInput
        postId={postId}
        userId={userId}
        currentDimensions={user_dimensional_ratings}
        dimensionalAverages={dimensional_averages}
        createdAt={userRatingCreatedAt}
        hasRated={hasRated}
        onRate={handleDimensionalRate}
        readonly={readonly}
        isOwner={isOwner}
      />
    );
  }

  // Show dimensional input when user clicks "Edit" (within edit window)
  if (!readonly && userId && hasRated && canEdit && isEditing) {
    return (
      <div>
        <RatingDimensionsInput
          postId={postId}
          userId={userId}
          currentDimensions={user_dimensional_ratings}
          dimensionalAverages={dimensional_averages}
          createdAt={userRatingCreatedAt}
          hasRated={hasRated}
          onRate={handleDimensionalRate}
          readonly={readonly}
          isOwner={isOwner}
        />
        <button
          onClick={() => setIsEditing(false)}
          className="mt-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Show dimensional display for post owner (they can always see ratings on their posts)
  if (isOwner && dimensional_averages) {
    return (
      <DimensionalRatingDisplay
        dimensionalAverages={dimensional_averages}
        userDimensionalRatings={undefined}
        ratingCount={ratingCount}
        overallRating={averageRating}
        showUserRatings={false}
      />
    );
  }

  // Show dimensional display after rating (default view for users who rated)
  if (hasRated && dimensional_averages) {
    return (
      <div>
        <DimensionalRatingDisplay
          dimensionalAverages={dimensional_averages}
          userDimensionalRatings={user_dimensional_ratings}
          ratingCount={ratingCount}
          overallRating={averageRating}
          showUserRatings={!!userId}
        />
        {/* Edit button if within edit window */}
        {canEdit && editTimeRemaining > 0 && (
          <button
            onClick={() => setIsEditing(true)}
            className="mt-3 flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Rating ({formatTime(editTimeRemaining)})
          </button>
        )}
      </div>
    );
  }

  // Show message for owner if no ratings yet
  if (isOwner && !dimensional_averages) {
    return (
      <div className="text-center py-4 text-sm text-gray-400">
        No ratings yet
      </div>
    );
  }

  // ===== Legacy single-star interface =====
  const handleClick = async (rating: number) => {
    if (readonly || !userId || isSubmitting) return;
    // Allow rating if not rated yet, or if within edit window
    if (hasRated && !canEdit) return;

    setIsSubmitting(true);
    if (onRate) {
      await onRate(rating);
    }
    setIsSubmitting(false);
  };

  // Can interact if: not readonly, has user, and (hasn't rated OR can edit)
  const isDisabled = readonly || !userId || (hasRated && !canEdit);

  // Before rating: show hover state or empty stars. After rating: show average.
  // Post owners can always see their post's ratings
  const displayRating = readonly
    ? averageRating
    : (hasRated || isOwner) && !canEdit
      ? averageRating
      : canEdit && hoverRating > 0
        ? hoverRating
        : hasRated || isOwner
          ? averageRating
          : hoverRating;

  // Format remaining time as m:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= Math.round(displayRating);
        const isPartialFilled = !(hasRated || isOwner) ? false : (star === Math.ceil(displayRating) && displayRating % 1 !== 0);

        return (
          <button
            key={star}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !isDisabled && setHoverRating(star)}
            onMouseLeave={() => !isDisabled && setHoverRating(0)}
            disabled={isDisabled}
            className={`text-2xl transition-all ${
              isDisabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
          >
            {isFilled || (isPartialFilled && displayRating >= star - 0.5) ? (
              <span className="text-yellow-400">★</span>
            ) : (
              <span className="text-gray-300">☆</span>
            )}
          </button>
        );
      })}
      <span className="ml-2 text-sm text-gray-600">
        {readonly
          ? (averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet')
          : hasRated || isOwner
            ? averageRating.toFixed(1)
            : userId
              ? <span className="text-gray-400 italic">Rate to see score</span>
              : (averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet')
        }
      </span>
      {hasRated && (
        <span className="ml-2 text-xs text-gray-500">
          (You: {userRating}★)
        </span>
      )}
      {canEdit && editTimeRemaining > 0 && (
        <span className="ml-2 text-xs text-purple-600 font-medium">
          Edit: {formatTime(editTimeRemaining)}
        </span>
      )}
    </div>
  );
}
