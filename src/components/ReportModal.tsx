'use client';

import { useState } from 'react';
import { REPORT_REASONS, ReportReason } from '@/lib/types';

interface ReportModalProps {
  postId: string;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details?: string) => Promise<void>;
}

const REASON_LABELS: Record<ReportReason, string> = {
  inappropriate: 'Inappropriate Content',
  spam: 'Spam or Misleading',
  harassment: 'Harassment or Bullying',
  other: 'Other'
};

export default function ReportModal({ postId, onClose, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(reason, details.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Report Post</h3>
        <p className="text-gray-600 text-sm mb-4">
          Why are you reporting this post?
        </p>

        {/* Reason Selection */}
        <div className="space-y-2 mb-4">
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full px-4 py-3 text-left text-sm rounded-lg border transition-colors ${
                reason === r
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              {REASON_LABELS[r]}
            </button>
          ))}
        </div>

        {/* Optional Details */}
        {reason && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
              placeholder="Tell us more about why you're reporting this..."
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
