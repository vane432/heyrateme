'use client';

import { useState, useEffect } from 'react';
import { canEditRating, getRatingEditTimeRemaining } from '@/lib/queries';

interface RatingStarsProps {
  postId: string;
  userId?: string;
  averageRating: number;
  userRating?: number;
  userRatingCreatedAt?: string;
  hasRated?: boolean;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}

export default function RatingStars({
  postId,
  userId,
  averageRating,
  userRating,
  userRatingCreatedAt,
  hasRated: hasRatedProp,
  onRate,
  readonly = false
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTimeRemaining, setEditTimeRemaining] = useState(0);

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
  const displayRating = readonly
    ? averageRating
    : hasRated && !canEdit
      ? averageRating
      : canEdit && hoverRating > 0
        ? hoverRating
        : hasRated
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
        const isPartialFilled = !hasRated ? false : (star === Math.ceil(displayRating) && displayRating % 1 !== 0);

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
          : hasRated
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
