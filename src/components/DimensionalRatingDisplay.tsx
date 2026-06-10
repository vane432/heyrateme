'use client';

import type { RatingDimensions } from '@/lib/types';

interface DimensionalRatingDisplayProps {
  dimensionalAverages: RatingDimensions;
  userDimensionalRatings?: RatingDimensions;
  ratingCount: number;
  overallRating: number;
  showUserRatings?: boolean;
}

const DIMENSIONS: { key: keyof RatingDimensions; label: string }[] = [
  { key: 'style',         label: 'Style'    },
  { key: 'fit',           label: 'Fit'      },
  { key: 'colorHarmony',  label: 'Color'    },
  { key: 'occasionMatch', label: 'Occasion' },
];

export default function DimensionalRatingDisplay({
  dimensionalAverages,
  userDimensionalRatings,
  ratingCount,
  overallRating,
  showUserRatings = true,
}: DimensionalRatingDisplayProps) {
  return (
    <div className="w-full">

      {/* Overall score row */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-black text-gray-900 leading-none">
          {overallRating.toFixed(1)}
        </span>
        <span className="text-[#FF385C] text-lg leading-none">★</span>
        <span className="text-xs text-gray-400">
          {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
        </span>
      </div>

      {/* Dimension bars */}
      <div className="space-y-1.5">
        {DIMENSIONS.map(dim => {
          const avg = dimensionalAverages[dim.key];
          const userVal = userDimensionalRatings?.[dim.key];
          const pct = (avg / 5) * 100;

          return (
            <div key={dim.key} className="flex items-center gap-2">
              {/* Label */}
              <span className="text-[11px] text-gray-400 w-14 flex-shrink-0">
                {dim.label}
              </span>

              {/* Bar track */}
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #FF385C, #FF7043)',
                  }}
                />
              </div>

              {/* Score */}
              <span className="text-[11px] font-semibold text-gray-700 w-6 text-right flex-shrink-0">
                {avg.toFixed(1)}
              </span>

              {/* User's own score (subtle, only if they rated) */}
              {showUserRatings && userVal !== undefined && userVal > 0 && (
                <span className="text-[10px] text-[#FF385C] w-8 flex-shrink-0">
                  you {userVal}
                </span>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
