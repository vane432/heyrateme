'use client';

import { useState } from 'react';

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  disabled?: boolean;
  hasRated?: boolean;
}

export default function CommentInput({ onSubmit, disabled, hasRated }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setError('Comment cannot be empty');
      return;
    }

    if (trimmedContent.length > 500) {
      setError('Comment cannot exceed 500 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(trimmedContent);
      setContent(''); // Clear input on success
    } catch (err: any) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  // Show message if user hasn't rated yet
  if (hasRated === false) {
    return (
      <div className="border-t border-gray-100 pt-3">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">⭐ Rate this post to comment</p>
          <p className="text-xs text-gray-500">You need to rate this post before you can leave a comment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 pt-3">
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setError('');
        }}
        onKeyDown={handleKeyPress}
        placeholder="Add a comment..."
        rows={2}
        maxLength={500}
        disabled={disabled || isSubmitting}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
      />

      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-400">
          {content.length}/500
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || isSubmitting || !content.trim()}
          className="px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-xs mt-1">{error}</p>
      )}

      <p className="text-xs text-gray-400 mt-1">
        Tip: Press Cmd/Ctrl + Enter to post
      </p>
    </div>
  );
}
