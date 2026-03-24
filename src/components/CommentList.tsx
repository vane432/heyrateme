'use client';

import { useState, useEffect } from 'react';
import { getComments, createComment, deleteComment } from '@/lib/queries';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import type { CommentWithUser } from '@/lib/types';

interface CommentListProps {
  postId: string;
  userId?: string;
  hasRated?: boolean;
}

export default function CommentList({ postId, userId, hasRated }: CommentListProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getComments(postId, 20);
      setComments(data);
      setHasMore(data.length === 20); // If we got exactly 20, there might be more
    } catch (err: any) {
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (content: string) => {
    if (!userId) {
      throw new Error('You must be logged in to comment');
    }

    const newComment = await createComment(postId, userId, content);

    // Add new comment to the top of the list
    setComments([newComment, ...comments]);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) {
      throw new Error('You must be logged in to delete comments');
    }

    await deleteComment(commentId, userId);

    // Remove comment from list
    setComments(comments.filter(c => c.id !== commentId));
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-4">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* Comment Input */}
      {userId && (
        <CommentInput
          onSubmit={handleSubmitComment}
          disabled={!userId}
          hasRated={hasRated}
        />
      )}

      {/* Comments List */}
      <div className="mt-4">
        {loading ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            Loading comments...
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-600 text-sm">
            {error}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-500 text-sm">No comments yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Be the first to comment!
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  userId={userId}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-4">
                <p className="text-xs text-gray-400">
                  Showing most recent 20 comments
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
