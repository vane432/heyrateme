'use client';

import { useState } from 'react';

interface RatingStarsProps {
  postId: string;
  userId?: string;
  averageRating: number;
  userRating?: number;
  hasRated?: boolean;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}

export default function RatingStars({
  postId,
  userId,
  averageRating,
  userRating,
  hasRated: hasRatedProp,
  onRate,
  readonly = false
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async (rating: number) => {
    if (readonly || hasRated || !userId || isSubmitting) return;

    setIsSubmitting(true);
    if (onRate) {
      await onRate(rating);
    }
    setIsSubmitting(false);
  };

  // hasRated can be passed explicitly (PostCard) or derived from userRating (post detail page)
  const hasRated = hasRatedProp !== undefined ? hasRatedProp : !!userRating;
  const isDisabled = readonly || hasRated || !userId;

  // Before rating: show hover state or empty stars. After rating: show average.
  const displayRating = readonly
    ? averageRating
    : hasRated
      ? averageRating
      : hoverRating;

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
    </div>
  );
}
