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
}

const dimensions: DimensionConfig[] = [
  { key: 'style', label: 'Style' },
  { key: 'fit', label: 'Fit' },
  { key: 'colorHarmony', label: 'Color Harmony' },
  { key: 'occasionMatch', label: 'Occasion' },
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
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const canEdit = hasRated && createdAt ? canEditRating(createdAt) : true;
  const isDisabled = readonly || isOwner || (hasRated && !canEdit);

  useEffect(() => {
    if (hasRated && createdAt && canEdit) {
      const updateTimer = () => {
        const remaining = getRatingEditTimeRemaining(createdAt);
        setTimeRemaining(remaining);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [hasRated, createdAt, canEdit]);

  // Auto-submit when all dimensions are rated
  useEffect(() => {
    const allRated = ratings.style > 0 && ratings.fit > 0 && ratings.colorHarmony > 0 && ratings.occasionMatch > 0;

    if (allRated && !isSubmitting && !isDisabled) {
      handleAutoSubmit();
    }
  }, [ratings, isSubmitting, isDisabled]);

  const handleSliderChange = (dimension: keyof RatingDimensions, value: number) => {
    if (isDisabled || isSubmitting) return;
    setRatings(prev => ({ ...prev, [dimension]: value }));
  };

  const handleAutoSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onRate?.(ratings);
      setIsSubmitted(true);

      // Brief delay to show success animation
      setTimeout(() => {
        setIsSubmitted(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to submit rating:', error);
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If owner, show message
  if (isOwner) {
    return (
      <div className="text-center py-6 text-sm text-gray-400">
        You cannot rate your own post
      </div>
    );
  }

  // Show success animation after submission
  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-green-600 animate-pulse">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Rating submitted!</span>
        </div>
      </div>
    );
  }

  // If not rated and not owner, show rating interface
  if (!hasRated || canEdit) {
    return (
      <div className="backdrop-blur-sm bg-white/80 border border-white/20 rounded-2xl p-6 shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Rate this outfit</h3>
          <p className="text-sm text-gray-500">Tap segments to rate each dimension</p>
        </div>

        {/* Dimension ratings */}
        <div className="space-y-6">
          {dimensions.map((dim) => {
            const currentRating = ratings[dim.key];

            return (
              <div key={dim.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{dim.label}</span>
                  <span className="text-sm font-medium text-gray-600">
                    {currentRating > 0 ? currentRating : '—'}
                  </span>
                </div>

                {/* Segmented bar slider */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleSliderChange(dim.key, value)}
                      disabled={isDisabled || isSubmitting}
                      className={`flex-1 h-3 rounded-full transition-all duration-200 ${
                        value <= currentRating
                          ? 'bg-black shadow-sm'
                          : 'bg-gray-200 hover:bg-gray-300'
                      } ${isDisabled || isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit timer */}
        {hasRated && canEdit && timeRemaining > 0 && (
          <div className="text-center text-xs text-gray-500 mt-4">
            Edit time remaining: {formatTime(timeRemaining)}
          </div>
        )}

        {/* Progress indicator */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Object.values(ratings).filter(r => r > 0).length}/4</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-black h-1 rounded-full transition-all duration-300"
              style={{ width: `${(Object.values(ratings).filter(r => r > 0).length / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // If rated and edit window expired, show message
  return (
    <div className="text-center py-6 text-sm text-gray-400">
      Rating submitted!
    </div>
  );
}
