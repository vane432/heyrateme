'use client';

import { useState } from 'react';
import { CATEGORIES, type Category } from '@/lib/types';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
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
