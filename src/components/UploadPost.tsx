'use client';

import { useState } from 'react';
import { uploadImage, createPost } from '@/lib/queries';
import { CATEGORIES } from '@/lib/types';
import Image from 'next/image';

interface UploadPostProps {
  userId: string;
  onSuccess: () => void;
}

export default function UploadPost({ userId, onSuccess }: UploadPostProps) {
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile || !caption.trim()) {
      alert('Please provide both an image and caption');
      return;
    }

    setIsUploading(true);

    try {
      // Upload image to Supabase storage
      const imageUrl = await uploadImage(imageFile, userId);

      // Create post record
      await createPost(userId, imageUrl, caption, category);

      // Reset form
      setCaption('');
      setImageFile(null);
      setImagePreview(null);
      
      onSuccess();
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Post</h2>

      {/* Image upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-black file:text-white
            hover:file:bg-gray-800
            cursor-pointer"
          required
        />
        {imagePreview && (
          <div className="mt-4 relative w-full aspect-square max-w-md mx-auto rounded-lg overflow-hidden">
            <Image
              src={imagePreview}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Caption
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Write a caption..."
          required
        />
      </div>

      {/* Category */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isUploading || !imageFile || !caption.trim()}
        className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading...' : 'Post'}
      </button>
    </form>
  );
}
