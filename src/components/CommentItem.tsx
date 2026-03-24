'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CommentWithUser } from '@/lib/types';

interface CommentItemProps {
  comment: CommentWithUser;
  userId?: string;
  onDelete: (commentId: string) => Promise<void>;
}

export default function CommentItem({ comment, userId, onDelete }: CommentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = userId === comment.user_id;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } catch (error: any) {
      alert(error.message || 'Failed to delete comment');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
    // Don't reset isDeleting on success - component will unmount
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex gap-3 py-3">
      {/* Avatar */}
      <Link href={`/${comment.users.username}`} className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
          {comment.users.avatar_url ? (
            <Image
              src={comment.users.avatar_url}
              alt={comment.users.username}
              width={32}
              height={32}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white font-bold text-xs">
              {comment.users.username[0].toUpperCase()}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Link
              href={`/${comment.users.username}`}
              className="font-semibold text-sm text-gray-900 hover:underline"
            >
              {comment.users.username}
            </Link>
            <span className="text-xs text-gray-400 ml-2">
              {formatTime(comment.created_at)}
            </span>
          </div>

          {/* Delete button (only for comment owner) */}
          {isOwner && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="Delete comment"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Comment?</h3>
            <p className="text-gray-600 text-sm mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
