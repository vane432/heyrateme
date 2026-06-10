'use client';

import Link from 'next/link';
import Image from 'next/image';
import RatingStars from './RatingStars';
import PostMenu from './PostMenu';
import ReportModal from './ReportModal';
import SharePostModal from './SharePostModal';
import VideoPlayer from './VideoPlayer';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';
import CritiqueCard, { CritiqueCardProps } from './CritiqueCard';
import type { PostWithUser, ReportReason, RatingDimensions, CommentWithUser } from '@/lib/types';
import { submitRating, submitReport, savePost, unsavePost, isPostSaved, getComments, createComment, deleteComment } from '@/lib/queries';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';

interface PostCardProps {
  post: PostWithUser;
  userId?: string;
  onRatingUpdate?: () => void;
}

export default function PostCard({ post, userId, onRatingUpdate }: PostCardProps) {
  const [currentRating, setCurrentRating] = useState(post.average_rating);
  const [ratingCount, setRatingCount] = useState(post.rating_count);
  const [userRating, setUserRating] = useState(post.user_rating);
  const [userRatingCreatedAt, setUserRatingCreatedAt] = useState(post.user_rating_created_at);
  const [hasRated, setHasRated] = useState(!!post.user_rating);
  const [userDimensionalRatings, setUserDimensionalRatings] = useState(post.user_dimensional_ratings);
  const [dimensionalAverages, setDimensionalAverages] = useState(post.dimensional_averages);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingInProgress, setSavingInProgress] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [summoning, setSummoning] = useState<'vance' | 'kiki' | 'oracle' | null>(null);
  const [generatedCritique, setGeneratedCritique] = useState<CritiqueCardProps | null>(null);
  const [summonedPersonas, setSummonedPersonas] = useState<string[]>([]);

  const isOwner = userId === post.user_id;

  useEffect(() => {
    setCurrentRating(post.average_rating);
    setRatingCount(post.rating_count);
    setUserRating(post.user_rating);
    setUserRatingCreatedAt(post.user_rating_created_at);
    setHasRated(!!post.user_rating);
    setUserDimensionalRatings(post.user_dimensional_ratings);
    setDimensionalAverages(post.dimensional_averages);
  }, [post.average_rating, post.rating_count, post.user_rating, post.user_rating_created_at, post.user_dimensional_ratings, post.dimensional_averages]);

  useEffect(() => {
    if (isOwner) {
      const fetchSummoned = async () => {
        const aiIds = [
          '11111111-1111-1111-1111-111111111111',
          '22222222-2222-2222-2222-222222222222',
          '33333333-3333-3333-3333-333333333333',
        ];
        const { data } = await supabase
          .from('comments')
          .select('user_id')
          .eq('post_id', post.id)
          .in('user_id', aiIds);

        if (data) {
          const personas = data.map((c: any) => {
            if (c.user_id === aiIds[0]) return 'vance';
            if (c.user_id === aiIds[1]) return 'kiki';
            return 'oracle';
          });
          setSummonedPersonas(personas);
        }
      };
      fetchSummoned();
    }
  }, [isOwner, post.id]);

  useEffect(() => {
    if (userId) {
      isPostSaved(userId, post.id).then(setIsSaved).catch(() => {});
    }
  }, [userId, post.id]);

  const handleSaveToggle = async () => {
    if (!userId || savingInProgress) return;
    setSavingInProgress(true);
    try {
      if (isSaved) {
        await unsavePost(userId, post.id);
        setIsSaved(false);
      } else {
        await savePost(userId, post.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Failed to save/unsave post:', error);
    }
    setSavingInProgress(false);
  };

  const handleRate = async (rating: number | RatingDimensions) => {
    if (!userId) return;
    try {
      const isDimensional = typeof rating === 'object';
      const result = await submitRating(post.id, userId, rating, isDimensional);
      const overallRating = isDimensional
        ? Math.round((rating.style + rating.fit + rating.colorHarmony + rating.occasionMatch) / 4)
        : (rating as number);

      if (result.isUpdate) {
        const oldUserRating = userRating || 0;
        const newAverage = ratingCount > 0
          ? (currentRating * ratingCount - oldUserRating + overallRating) / ratingCount
          : overallRating;
        setCurrentRating(newAverage);
        setUserRating(overallRating);
      } else {
        const newCount = ratingCount + 1;
        const newAverage = (currentRating * ratingCount + overallRating) / newCount;
        setCurrentRating(newAverage);
        setRatingCount(newCount);
        setUserRating(overallRating);
        setUserRatingCreatedAt(new Date().toISOString());
        setHasRated(true);
      }

      if (isDimensional) {
        const dimRating = rating as RatingDimensions;
        setUserDimensionalRatings(dimRating);
        if (dimensionalAverages && ratingCount > 0) {
          const count = result.isUpdate ? ratingCount : ratingCount + 1;
          setDimensionalAverages({
            style: ((dimensionalAverages.style * (count - 1)) + dimRating.style) / count,
            fit: ((dimensionalAverages.fit * (count - 1)) + dimRating.fit) / count,
            colorHarmony: ((dimensionalAverages.colorHarmony * (count - 1)) + dimRating.colorHarmony) / count,
            occasionMatch: ((dimensionalAverages.occasionMatch * (count - 1)) + dimRating.occasionMatch) / count,
          });
        } else {
          setDimensionalAverages(dimRating);
        }
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReport = async (reason: ReportReason, details?: string) => {
    if (!userId) throw new Error('You must be logged in to report');
    await submitReport(post.id, userId, reason, details);
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const data = await getComments(post.id, 3);
        setComments(data);
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async (content: string) => {
    if (!userId) throw new Error('You must be logged in to comment');
    const newComment = await createComment(post.id, userId, content);
    setComments([newComment, ...comments]);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) throw new Error('You must be logged in to delete comments');
    await deleteComment(commentId, userId);
    setComments(comments.filter(c => c.id !== commentId));
  };

  const handleSummonAI = async (persona: 'vance' | 'kiki' | 'oracle') => {
    setSummoning(persona);
    try {
      const imgRes = await fetch(post.image_url);
      const blob = await imgRes.blob();
      let fileMimeType = blob.type;
      if (!fileMimeType || fileMimeType === 'application/octet-stream') {
        fileMimeType = post.media_type === 'video' ? 'video/mp4' : 'image/jpeg';
      }
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const base64Data = await base64Promise;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be securely logged in to use AI critics.');

      const apiRes = await fetch('/api/generate-critique', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          persona,
          imageBase64: base64Data,
          mimeType: fileMimeType,
          postId: post.id,
        }),
      });
      const json = await apiRes.json();
      if (!apiRes.ok || !json.success) throw new Error(json.error || 'AI generation failed');

      const aiComment = json.record;
      if (!aiComment) throw new Error('Failed to save AI critique to database');

      const overallRating = (json.data.style + json.data.fit + json.data.color_harmony + json.data.occasion_match) / 4;
      const newRatingCount = ratingCount + 1;
      const newAverage = ratingCount > 0
        ? (currentRating * ratingCount + overallRating) / newRatingCount
        : overallRating;
      setCurrentRating(newAverage);
      setRatingCount(newRatingCount);

      if (dimensionalAverages) {
        setDimensionalAverages({
          style: ((dimensionalAverages.style * ratingCount) + json.data.style) / newRatingCount,
          fit: ((dimensionalAverages.fit * ratingCount) + json.data.fit) / newRatingCount,
          colorHarmony: ((dimensionalAverages.colorHarmony * ratingCount) + json.data.color_harmony) / newRatingCount,
          occasionMatch: ((dimensionalAverages.occasionMatch * ratingCount) + json.data.occasion_match) / newRatingCount,
        });
      } else {
        setDimensionalAverages({
          style: json.data.style,
          fit: json.data.fit,
          colorHarmony: json.data.color_harmony,
          occasionMatch: json.data.occasion_match,
        });
      }

      const newComment: CommentWithUser = {
        id: aiComment?.id || `temp-${Date.now()}`,
        post_id: post.id,
        user_id: persona === 'vance'
          ? '11111111-1111-1111-1111-111111111111'
          : persona === 'kiki'
          ? '22222222-2222-2222-2222-222222222222'
          : '33333333-3333-3333-3333-333333333333',
        content: aiComment?.content || json.data.critique_body,
        created_at: aiComment?.created_at || new Date().toISOString(),
        users: { id: 'bot-id', username: aiComment?.username || persona, avatar_url: aiComment?.avatar_url || null } as any,
      };

      setComments(prev => [newComment, ...prev]);
      setShowComments(true);
      setSummonedPersonas(prev => [...prev, persona]);
      setGeneratedCritique({
        persona,
        imageUrl: post.image_url,
        rating: overallRating,
        punchline: json.data.viral_punchline,
        critique: json.data.critique_body,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to summon AI');
    } finally {
      setSummoning(null);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  // AI persona accent colours for comment left-border
  const personaBorderColor = (username: string) => {
    if (username === 'vance')  return 'border-l-2 border-cyan-400';
    if (username === 'kiki')   return 'border-l-2 border-fuchsia-400';
    if (username === 'oracle') return 'border-l-2 border-gray-300';
    return '';
  };

  const aiUserIds = [
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
  ];

  const commentCount = post.comment_count || 0;

  // Compact dimensional breakdown string
  const dimensionRow = dimensionalAverages
    ? [
        { label: 'Style',    val: dimensionalAverages.style },
        { label: 'Fit',      val: dimensionalAverages.fit },
        { label: 'Color',    val: dimensionalAverages.colorHarmony },
        { label: 'Occasion', val: dimensionalAverages.occasionMatch },
      ]
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 border border-gray-100">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          {post.users.avatar_url ? (
            <Image
              src={post.users.avatar_url}
              alt={post.users.username}
              width={36}
              height={36}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white text-sm font-bold">
              {post.users.username[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/${post.users.username}`} className="font-semibold text-sm text-gray-900 hover:underline">
              {post.users.username}
            </Link>
            {post.gender && (
              <span className="inline-flex items-center gap-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                {post.gender === 'Menswear' ? '👔' : post.gender === 'Womenswear' ? '👗' : '👤'} {post.gender}
              </span>
            )}
          </div>
          {/* Category + timestamp on one line */}
          <p className="text-[11px] text-gray-400 mt-0.5">
            {post.category}
            <span className="mx-1">·</span>
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Actions */}
        {userId && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => setShowShareModal(true)}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              title="Share post"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button
              onClick={handleSaveToggle}
              disabled={savingInProgress}
              className={`p-1.5 rounded-full transition-colors ${isSaved ? 'text-purple-500' : 'text-gray-400 hover:text-gray-600'}`}
              title={isSaved ? 'Unsave post' : 'Save post'}
            >
              {isSaved ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              )}
            </button>
            <PostMenu
              postId={post.id}
              isOwner={isOwner}
              onReport={() => setShowReportModal(true)}
              onCopyLink={handleCopyLink}
            />
          </div>
        )}
      </div>

      {/* ── Media ──────────────────────────────────────────────────────────── */}
      <Link href={`/post/${post.id}`}>
        <div className="relative w-full aspect-[4/5] bg-gray-100">
          {post.media_type === 'video' ? (
            <VideoPlayer
              src={post.image_url}
              className="w-full h-full"
              duration={post.duration_seconds || undefined}
            />
          ) : (
            <Image
              src={post.image_url}
              alt={post.caption}
              fill
              className="object-cover"
            />
          )}
        </div>
      </Link>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2">

        {/* Rating row */}
        <div className="mb-2">
          <RatingStars
            postId={post.id}
            userId={userId}
            averageRating={currentRating}
            userRating={userRating}
            userRatingCreatedAt={userRatingCreatedAt}
            hasRated={hasRated}
            onRate={handleRate}
            isOwner={isOwner}
            category={post.category}
            dimensional_averages={dimensionalAverages}
            user_dimensional_ratings={userDimensionalRatings}
            ratingCount={ratingCount}
          />


        </div>

        {/* Caption */}
        <p className="text-sm text-gray-900 mb-2">
          <Link href={`/${post.users.username}`} className="font-semibold hover:underline">
            {post.users.username}
          </Link>{' '}
          <span className="text-gray-700">{post.caption}</span>
        </p>

        {/* ── Summon AI Critics (owner only) — slim pill buttons ─────────── */}
        {isOwner && (
          <div className="flex items-center justify-center gap-1.5 mb-2 flex-wrap">
            {/* Vance */}
            <button
              onClick={() => handleSummonAI('vance')}
              disabled={!!summoning || summonedPersonas.includes('vance')}
              className={`inline-flex items-center gap-1 px-3 h-7 rounded-full text-[11px] font-bold transition-all disabled:opacity-60
                ${summonedPersonas.includes('vance')
                  ? 'bg-slate-800 text-cyan-400'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-cyan-400'}`}
            >
              {summoning === 'vance' ? '...' : summonedPersonas.includes('vance') ? '✓ Roasted' : '🔥 Roast Me'}
            </button>

            {/* Kiki */}
            <button
              onClick={() => handleSummonAI('kiki')}
              disabled={!!summoning || summonedPersonas.includes('kiki')}
              className={`inline-flex items-center gap-1 px-3 h-7 rounded-full text-[11px] font-black transition-all disabled:opacity-60
                ${summonedPersonas.includes('kiki')
                  ? 'bg-gradient-to-r from-fuchsia-500 to-orange-400 text-white'
                  : 'bg-fuchsia-50 text-fuchsia-600 hover:bg-gradient-to-r hover:from-fuchsia-500 hover:to-orange-400 hover:text-white'}`}
            >
              {summoning === 'kiki' ? '...' : summonedPersonas.includes('kiki') ? '✓ Hyped' : '💅 Hype Me'}
            </button>

            {/* Oracle */}
            <button
              onClick={() => handleSummonAI('oracle')}
              disabled={!!summoning || summonedPersonas.includes('oracle')}
              className={`inline-flex items-center gap-1 px-3 h-7 rounded-full text-[11px] font-semibold border transition-all disabled:opacity-60
                ${summonedPersonas.includes('oracle')
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
            >
              {summoning === 'oracle' ? '...' : summonedPersonas.includes('oracle') ? '✓ Read' : '🔮 Read Me'}
            </button>
          </div>
        )}

        {/* ── Comment toggle button ───────────────────────────────────────── */}
        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs transition-colors mt-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>
            {showComments
              ? 'Hide comments'
              : commentCount > 0
              ? `View ${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`
              : 'Add a comment'}
          </span>
        </button>

        {/* ── Expandable comments drawer ──────────────────────────────────── */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-gray-100">

            {/* Comment input — slim, avatar-left style */}
            {userId && (
              <CommentInput
                onSubmit={handleSubmitComment}
                disabled={!userId}
                hasRated={hasRated || isOwner}
              />
            )}

            {/* Comments list */}
            <div className="mt-3">
              {loadingComments ? (
                <p className="text-xs text-gray-400 text-center py-3">Loading...</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">No comments yet. Be the first!</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {comments.map(comment => (
                      <div
                        key={comment.id}
                        className={`pl-2 ${aiUserIds.includes(comment.user_id) ? personaBorderColor(comment.users?.username || '') : ''}`}
                      >
                        <CommentItem
                          comment={comment}
                          userId={userId}
                          onDelete={handleDeleteComment}
                        />
                      </div>
                    ))}
                  </div>

                  {commentCount > 3 && (
                    <Link
                      href={`/post/${post.id}`}
                      className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-3"
                    >
                      View all {commentCount} comments →
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showReportModal && (
        <ReportModal
          postId={post.id}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReport}
        />
      )}

      {showShareModal && userId && (
        <SharePostModal
          postId={post.id}
          userId={userId}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {generatedCritique && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 pt-10 pb-4 overflow-y-auto backdrop-blur-sm">
          <div className="relative w-full max-w-sm flex flex-col items-center">
            <CritiqueCard {...generatedCritique} onClose={() => setGeneratedCritique(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
