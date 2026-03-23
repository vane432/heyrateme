'use client';

import { useState } from 'react';
import { uploadImage, uploadVideo, createPost, checkRateLimit, getVideoDuration } from '@/lib/queries';
import { CATEGORIES, OCCASIONS, type Occasion } from '@/lib/types';
import { validateMediaFile, validateCaption, validateVideoDuration, validateOccasionForFashion } from '@/lib/validation';
import Image from 'next/image';

interface UploadPostProps {
  userId: string;
  onSuccess: () => void;
}

export default function UploadPost({ userId, onSuccess }: UploadPostProps) {
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Determine media type
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setMediaType(type);

    // Validate file
    const fileError = validateMediaFile(file, type);
    if (fileError) {
      setError(fileError.message);
      setMediaFile(null);
      setMediaPreview(null);
      return;
    }

    // Video duration check
    if (type === 'video') {
      const durationError = await validateVideoDuration(file);
      if (durationError) {
        setError(durationError.message);
        setMediaFile(null);
        setMediaPreview(null);
        return;
      }
    }

    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mediaFile || !caption.trim()) {
      setError('Please provide both media and caption');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      // 1. Rate limit check
      const rateLimitCheck = await checkRateLimit(userId);
      if (!rateLimitCheck.allowed) {
        throw new Error(
          `Daily limit reached: ${rateLimitCheck.postsToday}/${rateLimitCheck.limit} posts. Try again tomorrow!`
        );
      }

      // 2. Caption validation
      const captionError = validateCaption(caption);
      if (captionError) throw new Error(captionError.message);

      // 2.5. Occasion validation for Fashion posts
      const occasionError = validateOccasionForFashion(category, occasion);
      if (occasionError) throw new Error(occasionError.message);

      // 3. Upload media
      let mediaUrl: string;
      let duration: number | undefined;

      if (mediaType === 'video') {
        mediaUrl = await uploadVideo(mediaFile, userId);
        duration = await getVideoDuration(mediaFile);
      } else {
        mediaUrl = await uploadImage(mediaFile, userId);
      }

      // 4. Create post
      await createPost(
        userId,
        mediaUrl,
        caption.trim(),
        category,
        mediaType || 'image',
        duration,
        mediaFile.size,
        occasion
      );

      // 5. Reset
      setCaption('');
      setOccasion(null);
      setMediaFile(null);
      setMediaType(null);
      setMediaPreview(null);

      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Post</h2>

      {/* Media upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Image or Video
        </label>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleMediaChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-black file:text-white
            hover:file:bg-gray-800
            cursor-pointer"
          required
        />

        {/* Preview */}
        {mediaPreview && (
          <div className="mt-4 relative w-full aspect-square max-w-md mx-auto rounded-lg overflow-hidden">
            {mediaType === 'video' ? (
              <video src={mediaPreview} controls className="w-full h-full object-cover" />
            ) : (
              <Image src={mediaPreview} alt="Preview" fill className="object-cover" />
            )}
          </div>
        )}

        {mediaFile && (
          <p className="text-xs text-gray-500 mt-2">
            {mediaType === 'video' ? 'Video' : 'Image'}: {(mediaFile.size / (1024 * 1024)).toFixed(2)}MB
          </p>
        )}
      </div>

      {/* Caption */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Caption ({caption.length}/500)
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          maxLength={500}
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
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Occasion (only for Fashion category) */}
      {category === 'Fashion' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Occasion <span className="text-red-500">*</span>
          </label>
          <select
            value={occasion || ''}
            onChange={(e) => setOccasion(e.target.value as Occasion)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            required
          >
            <option value="">Select an occasion</option>
            {OCCASIONS.map((occ) => (
              <option key={occ} value={occ}>{occ}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Help others understand the context of your outfit
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isUploading || !mediaFile || !caption.trim()}
        className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading...' : 'Post'}
      </button>
    </form>
  );
}
