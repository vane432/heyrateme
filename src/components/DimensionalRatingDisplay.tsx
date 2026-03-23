'use client';

import type { RatingDimensions } from '@/lib/types';

interface DimensionalRatingDisplayProps {
  dimensionalAverages: RatingDimensions;
  userDimensionalRatings?: RatingDimensions;
  ratingCount: number;
  overallRating: number;
  showUserRatings?: boolean;
}

interface DimensionInfo {
  key: keyof RatingDimensions;
  label: string;
  icon: string;
  shortLabel: string;
}

const dimensions: DimensionInfo[] = [
  { key: 'style', label: 'Style', icon: '✨', shortLabel: 'Style' },
  { key: 'fit', label: 'Fit', icon: '👔', shortLabel: 'Fit' },
  { key: 'colorHarmony', label: 'Color', icon: '🎨', shortLabel: 'Color' },
  { key: 'occasionMatch', label: 'Occasion', icon: '📅', shortLabel: 'Occasion' },
];

export default function DimensionalRatingDisplay({
  dimensionalAverages,
  userDimensionalRatings,
  ratingCount,
  overallRating,
  showUserRatings = true,
}: DimensionalRatingDisplayProps) {
  return (
    <div className="w-full bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-xl p-4 border border-purple-100">
      {/* Overall rating header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-purple-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⭐</span>
          <div>
            <div className="text-lg font-black text-gray-900">
              {overallRating.toFixed(1)}★
            </div>
            <div className="text-xs text-gray-500">{ratingCount} ratings</div>
          </div>
        </div>
        <div className="text-xs font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
          Fashion Rating
        </div>
      </div>

      {/* Dimensional breakdown */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-600 mb-2">Rating Breakdown:</div>
        <div className="grid grid-cols-2 gap-2">
          {dimensions.map((dim) => {
            const avgValue = dimensionalAverages[dim.key];
            const userValue = userDimensionalRatings?.[dim.key];

            return (
              <div
                key={dim.key}
                className="bg-white rounded-lg p-2 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{dim.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{dim.shortLabel}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-gray-900">
                    {avgValue.toFixed(1)}★
                  </div>
                  {showUserRatings && userValue !== undefined && userValue > 0 && (
                    <div className="text-xs text-purple-600">You: {userValue}★</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Your rating summary */}
      {showUserRatings && userDimensionalRatings && (
        <div className="mt-3 pt-3 border-t border-purple-200">
          <div className="text-xs text-gray-600 text-center">
            <span className="font-medium">Your rating:</span>{' '}
            <span className="text-purple-600 font-bold">
              {(
                (userDimensionalRatings.style +
                  userDimensionalRatings.fit +
                  userDimensionalRatings.colorHarmony +
                  userDimensionalRatings.occasionMatch) /
                4
              ).toFixed(1)}
              ★
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
