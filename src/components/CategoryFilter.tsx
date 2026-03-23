'use client';

import { CATEGORIES, GENDERS } from '@/lib/types';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedGender: string | null;
  onGenderChange: (gender: string | null) => void;
  showFriendsFilter?: boolean;
}

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  selectedGender,
  onGenderChange,
  showFriendsFilter = true
}: CategoryFilterProps) {
  return (
    <div className="space-y-4">
      {/* Category filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Style Categories</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Styles
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
      </div>

      {/* Gender filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Gender Style</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => onGenderChange(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedGender === null
                ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Genders
          </button>

          {GENDERS.map((gender) => (
            <button
              key={gender}
              onClick={() => onGenderChange(gender)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
                selectedGender === gender
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span>{gender === 'Menswear' ? '👔' : gender === 'Womenswear' ? '👗' : '👤'}</span>
              {gender}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
