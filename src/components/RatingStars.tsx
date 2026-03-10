'use client';

import { useState } from 'react';

interface RatingStarsProps {
  postId: string;
  userId?: string;
  averageRating: number;
  userRating?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}

export default function RatingStars({
  postId,
  userId,
  averageRating,
  userRating,
  onRate,
  readonly = false
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async (rating: number) => {
    if (readonly || userRating || !userId || isSubmitting) return;

    setIsSubmitting(true);
    if (onRate) {
      await onRate(rating);
    }
    setIsSubmitting(false);
  };

  const displayRating = readonly
    ? averageRating
    : hoverRating || userRating || averageRating;

  const isDisabled = readonly || !!userRating || !userId;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= Math.round(displayRating);
        const isPartialFilled = star === Math.ceil(displayRating) && displayRating % 1 !== 0;

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
        {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet'}
      </span>
      {userRating && (
        <span className="ml-2 text-xs text-gray-500">
          (You rated: {userRating}★)
        </span>
      )}
    </div>
  );
}
