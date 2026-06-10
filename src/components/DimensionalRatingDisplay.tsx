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
    <div className="w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800">

      {/* Overall score row */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-none">
          {overallRating.toFixed(1)}
        </span>
        <span className="text-[#FF385C] text-xl leading-none">★</span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">
          {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
        </span>
      </div>

      {/* Dimension bars */}
      <div className="space-y-2">
        {DIMENSIONS.map(dim => {
          const avg = dimensionalAverages[dim.key];
          const userVal = userDimensionalRatings?.[dim.key];
          const pct = (avg / 5) * 100;

          return (
            <div key={dim.key} className="flex items-center gap-2">
              {/* Label */}
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 w-14 flex-shrink-0">
                {dim.label}
              </span>

              {/* Bar track — slightly thicker, more visible gray */}
              <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #FF385C, #FF7043)',
                  }}
                />
              </div>

              {/* Score */}
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 w-6 text-right flex-shrink-0">
                {avg.toFixed(1)}
              </span>

              {/* User's score — small coral pill */}
              {showUserRatings && userVal !== undefined && userVal > 0 && (
                <span className="text-[10px] font-semibold text-[#FF385C] bg-rose-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
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
