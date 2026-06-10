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
  emoji: string;
}

const DIMENSIONS: DimensionConfig[] = [
  { key: 'style',         label: 'Style',         emoji: '✦' },
  { key: 'fit',           label: 'Fit',            emoji: '✦' },
  { key: 'colorHarmony',  label: 'Color',          emoji: '✦' },
  { key: 'occasionMatch', label: 'Occasion',       emoji: '✦' },
];

function StarRow({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          className={`text-xl leading-none transition-transform ${
            disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'
          }`}
        >
          <span className={star <= display ? 'text-[#FF385C]' : 'text-gray-200'}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

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
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const canEdit = hasRated && createdAt ? canEditRating(createdAt) : true;
  const isDisabled = readonly || isOwner || (hasRated && !canEdit);

  const ratedCount = Object.values(ratings).filter(r => r > 0).length;
  const allRated = ratedCount === 4;

  useEffect(() => {
    if (hasRated && createdAt && canEdit) {
      const update = () => setTimeRemaining(getRatingEditTimeRemaining(createdAt));
      update();
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    }
  }, [hasRated, createdAt, canEdit]);

  // Auto-submit once all four dimensions are rated
  useEffect(() => {
    if (allRated && !isSubmitting && !isDisabled && hasUserInteracted) {
      handleAutoSubmit();
    }
  }, [ratings, isSubmitting, isDisabled, hasUserInteracted]);

  const handleChange = (key: keyof RatingDimensions, value: number) => {
    if (isDisabled || isSubmitting) return;
    setHasUserInteracted(true);
    setRatings(prev => ({ ...prev, [key]: value }));
  };

  const handleAutoSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onRate?.(ratings);
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 1500);
    } catch (err) {
      console.error('Failed to submit rating:', err);
      setIsSubmitting(false);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (isOwner) {
    return (
      <p className="text-xs text-gray-400 text-center py-3">
        You can't rate your own post
      </p>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center gap-2 py-5 text-[#FF385C]">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-semibold">Rating submitted!</span>
      </div>
    );
  }

  if (!hasRated || canEdit) {
    return (
      <div className="w-full bg-gray-50 rounded-xl p-3 border border-gray-100">

        {/* Prompt — coral left border accent */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-0.5 h-3.5 rounded-full bg-[#FF385C]" />
          <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">
            Rate this outfit
          </p>
        </div>

        {/* Star rows — one per dimension */}
        <div className="space-y-2.5">
          {DIMENSIONS.map((dim, i) => {
            const val = ratings[dim.key];
            const isActive = val > 0;
            const isPending = !isActive && i > ratedCount;

            return (
              <div
                key={dim.key}
                className={`flex items-center justify-between transition-opacity ${
                  isPending ? 'opacity-35' : 'opacity-100'
                }`}
              >
                <span className={`text-xs font-semibold w-16 ${
                  isActive ? 'text-gray-800' : 'text-gray-500'
                }`}>
                  {dim.label}
                </span>
                <StarRow
                  value={val}
                  onChange={v => handleChange(dim.key, v)}
                  disabled={isDisabled || isSubmitting}
                />
                <span className={`text-xs w-4 text-right font-semibold ${
                  val > 0 ? 'text-[#FF385C]' : 'text-transparent'
                }`}>
                  {val > 0 ? val : '0'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mt-4">
          {DIMENSIONS.map((dim) => (
            <div
              key={dim.key}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                ratings[dim.key] > 0 ? 'bg-[#FF385C]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1 text-right">
          {ratedCount}/4 rated
        </p>

        {/* Edit timer */}
        {hasRated && canEdit && timeRemaining > 0 && (
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Edit window: {formatTime(timeRemaining)}
          </p>
        )}
      </div>
    );
  }

  return (
    <p className="text-xs text-gray-400 text-center py-3">Rating submitted!</p>
  );
}
