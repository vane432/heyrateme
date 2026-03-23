'use client';

import { useState, useEffect } from 'react';
import type { RatingDimensions } from '@/lib/types';
import { getRatingEditTimeRemaining, canEditRating } from '@/lib/queries';

interface RatingDimensionsInputProps {
  postId: string;
  userId?: string;
  currentDimensions?: RatingDimensions;
  dimensionalAverages?: RatingDimensions;
  createdAt?: string;
  hasRated?: boolean;
  onRate?: (dimensions: RatingDimensions) => void;
  readonly?: boolean;
  isOwner?: boolean;
}

interface DimensionConfig {
  key: keyof RatingDimensions;
  label: string;
  icon: string;
  description: string;
}

const dimensions: DimensionConfig[] = [
  { key: 'style', label: 'Style', icon: '✨', description: 'How fashionable/on-trend?' },
  { key: 'fit', label: 'Fit', icon: '👔', description: 'Does it fit well?' },
  { key: 'colorHarmony', label: 'Color Harmony', icon: '🎨', description: 'Do colors work together?' },
  { key: 'occasionMatch', label: 'Occasion Match', icon: '📅', description: 'Appropriate for occasion?' },
];

export default function RatingDimensionsInput({
  postId,
  userId,
  currentDimensions,
  dimensionalAverages,
  createdAt,
  hasRated = false,
  onRate,
  readonly = false,
  isOwner = false,
}: RatingDimensionsInputProps) {
  const [ratings, setRatings] = useState<RatingDimensions>(
    currentDimensions || { style: 0, fit: 0, colorHarmony: 0, occasionMatch: 0 }
  );
  const [hoveredDimension, setHoveredDimension] = useState<keyof RatingDimensions | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = hasRated && createdAt ? canEditRating(createdAt) : true;
  const isDisabled = readonly || isOwner || (hasRated && !canEdit);

  useEffect(() => {
    if (hasRated && createdAt && canEdit) {
      const updateTimer = () => {
        const remaining = getRatingEditTimeRemaining(createdAt);
        setTimeRemaining(remaining);
        if (remaining <= 0) {
          // Time's up, stop the timer
          return;
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [hasRated, createdAt, canEdit]);

  const handleStarClick = (dimension: keyof RatingDimensions, rating: number) => {
    if (isDisabled) return;
    setRatings(prev => ({ ...prev, [dimension]: rating }));
  };

  const handleSubmit = async () => {
    if (isSubmitting || isDisabled) return;

    // Validate all dimensions are rated
    if (ratings.style === 0 || ratings.fit === 0 || ratings.colorHarmony === 0 || ratings.occasionMatch === 0) {
      alert('Please rate all dimensions before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRate?.(ratings);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const overallRating = dimensionalAverages
    ? (dimensionalAverages.style + dimensionalAverages.fit + dimensionalAverages.colorHarmony + dimensionalAverages.occasionMatch) / 4
    : 0;

  const currentOverallRating = (ratings.style + ratings.fit + ratings.colorHarmony + ratings.occasionMatch) / 4;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If owner, show message
  if (isOwner) {
    return (
      <div className="text-center py-4 text-sm text-gray-500">
        You cannot rate your own post
      </div>
    );
  }

  // If not rated and not owner, show rating interface
  if (!hasRated || canEdit) {
    return (
      <div className="w-full bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-xl p-4 border border-purple-100">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <span>👗</span> Rate this outfit
          </h3>
          <p className="text-xs text-gray-500">Rate each dimension (tap stars):</p>
        </div>

        {/* Dimension ratings */}
        <div className="space-y-3 mb-4">
          {dimensions.map((dim) => {
            const currentRating = ratings[dim.key];
            const avgRating = dimensionalAverages?.[dim.key] || 0;
            const displayRating = hoveredDimension === dim.key ? hoveredRating : currentRating;

            return (
              <div key={dim.key} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{dim.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-700">{dim.label}</div>
                      <div className="text-xs text-gray-500">{dim.description}</div>
                    </div>
                  </div>
                  {avgRating > 0 && (
                    <div className="text-xs text-gray-400">
                      Avg: {avgRating.toFixed(1)}★
                    </div>
                  )}
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(dim.key, star)}
                      onMouseEnter={() => {
                        if (!isDisabled) {
                          setHoveredDimension(dim.key);
                          setHoveredRating(star);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredDimension(null);
                        setHoveredRating(0);
                      }}
                      disabled={isDisabled}
                      className={`text-2xl transition-transform ${
                        isDisabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'
                      }`}
                    >
                      {star <= displayRating ? (
                        <span className="text-yellow-400">★</span>
                      ) : (
                        <span className="text-gray-300">☆</span>
                      )}
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {displayRating > 0 ? displayRating : '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall rating preview */}
        {currentOverallRating > 0 && (
          <div className="bg-white rounded-lg p-3 mb-4 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Your Overall Rating:</span>
              <span className="text-lg font-black text-purple-600">
                {currentOverallRating.toFixed(1)}★
              </span>
            </div>
          </div>
        )}

        {/* Edit timer */}
        {hasRated && canEdit && timeRemaining > 0 && (
          <div className="text-center text-xs text-purple-600 font-medium mb-3">
            Edit time remaining: {formatTime(timeRemaining)}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isDisabled || currentOverallRating === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : hasRated ? 'Update Rating' : 'Submit Rating'}
        </button>
      </div>
    );
  }

  // If rated and edit window expired, show message
  return (
    <div className="text-center py-4 text-sm text-gray-500">
      Rating submitted! (Edit window expired)
    </div>
  );
}
