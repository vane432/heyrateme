'use client';

import { CATEGORIES } from '@/lib/types';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  showFriendsFilter?: boolean;
}

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  showFriendsFilter = true
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
      <button
        onClick={() => onCategoryChange(null)}
        className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
          selectedCategory === null
            ? 'bg-black text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        All
      </button>

      {/* Friends filter - shows posts from followed users */}
      {showFriendsFilter && (
        <button
          onClick={() => onCategoryChange('__friends__')}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
            selectedCategory === '__friends__'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          👥 Friends
        </button>
      )}

      {CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
            selectedCategory === category
              ? 'bg-black text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
