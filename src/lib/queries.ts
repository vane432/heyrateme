// @ts-nocheck
import { supabase } from './supabaseClient';
import type { PostWithUser } from './types';

// ─── Saves/Bookmarks ───

// Save a post
export async function savePost(userId: string, postId: string) {
  const { error } = await supabase
    .from('saves')
    .insert({ user_id: userId, post_id: postId });

  if (error && error.code !== '23505') throw error; // Ignore duplicate
}

// Unsave a post
export async function unsavePost(userId: string, postId: string) {
  const { error } = await supabase
    .from('saves')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);

  if (error) throw error;
}

// Check if post is saved
export async function isPostSaved(userId: string, postId: string): Promise<boolean> {
  const { data } = await supabase
    .from('saves')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();

  return !!data;
}

// Get saved posts for a user
export async function getSavedPosts(userId: string): Promise<PostWithUser[]> {
  const { data: saves, error } = await supabase
    .from('saves')
    .select(`
      post_id,
      posts (
        *,
        users (
          id,
          username,
          avatar_url
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get ratings for all saved posts
  const postsWithRatings = await Promise.all(
    (saves || []).map(async (save: any) => {
      const post = save.posts;
      if (!post) return null;

      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('post_id', post.id);

      const ratingCount = ratings?.length || 0;
      const averageRating = ratingCount > 0
        ? ratings!.reduce((sum, r: any) => sum + r.rating, 0) / ratingCount
        : 0;

      return {
        ...post,
        users: post.users,
        average_rating: averageRating,
        rating_count: ratingCount,
      } as PostWithUser;
    })
  );

  return postsWithRatings.filter(Boolean) as PostWithUser[];
}

// Get all posts for home feed with user info and ratings
export async function getFeedPosts(category?: string, userId?: string) {
  let query = supabase
    .from('posts')
    .select(`
      *,
      users (
        id,
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false });

  // Handle special "Friends" filter
  if (category === '__friends__' && userId) {
    // Get list of users the current user follows
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followingIds = follows?.map(f => f.following_id) || [];

    if (followingIds.length > 0) {
      query = query.in('user_id', followingIds);
    } else {
      // User doesn't follow anyone - return empty array
      return [];
    }
  } else if (category && category !== '__friends__') {
    query = query.eq('category', category);
  }

  const { data: posts, error } = await query;

  if (error) throw error;

  // Get ratings for all posts
  const postsWithRatings = await Promise.all(
    (posts || []).map(async (post: any) => {
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating, user_id, created_at')
        .eq('post_id', post.id);

      const ratingCount = ratings?.length || 0;
      const averageRating = ratingCount > 0
        ? ratings!.reduce((sum, r: any) => sum + r.rating, 0) / ratingCount
        : 0;

      const userRatingData = userId
        ? ratings?.find((r: any) => r.user_id === userId)
        : undefined;

      return {
        ...post,
        users: post.users,
        average_rating: averageRating,
        rating_count: ratingCount,
        user_rating: userRatingData?.rating,
        user_rating_created_at: userRatingData?.created_at,
      } as PostWithUser;
    })
  );

  return postsWithRatings;
}

// Get a single post by ID
export async function getPostById(postId: string, userId?: string) {
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      users (
        id,
        username,
        avatar_url
      )
    `)
    .eq('id', postId)
    .single();

  if (error) throw error;

  // Get ratings
  const { data: ratings } = await supabase
    .from('ratings')
    .select('rating, user_id, created_at')
    .eq('post_id', postId);

  const ratingCount = ratings?.length || 0;
  const averageRating = ratingCount > 0
    ? ratings!.reduce((sum, r: any) => sum + r.rating, 0) / ratingCount
    : 0;

  // Check if user has already rated
  const userRatingData = userId
    ? ratings?.find((r: any) => r.user_id === userId)
    : undefined;

  return {
    ...(post as any),
    users: post.users,
    average_rating: averageRating,
    rating_count: ratingCount,
    user_rating: userRatingData?.rating,
    user_rating_created_at: userRatingData?.created_at
  } as PostWithUser;
}

// Get posts by username
export async function getPostsByUsername(username: string) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();

  if (userError) throw userError;

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      users (
        id,
        username,
        avatar_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get ratings for all posts
  const postsWithRatings = await Promise.all(
    (posts || []).map(async (post: any) => {
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('post_id', post.id);

      const ratingCount = ratings?.length || 0;
      const averageRating = ratingCount > 0
        ? ratings!.reduce((sum, r: any) => sum + r.rating, 0) / ratingCount
        : 0;

      return {
        ...post,
        users: post.users,
        average_rating: averageRating,
        rating_count: ratingCount
      } as PostWithUser;
    })
  );

  return postsWithRatings;
}

// Get user profile with stats
export async function getUserProfile(username: string) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (userError) throw userError;

  const posts = await getPostsByUsername(username);

  const totalRatings = posts.reduce((sum, post) => sum + post.rating_count, 0);
  const averageRating = totalRatings > 0
    ? posts.reduce((sum, post) => sum + (post.average_rating * post.rating_count), 0) / totalRatings
    : 0;

  return {
    user,
    posts,
    postCount: posts.length,
    averageRating
  };
}

// Get top posts for today
export async function getTopPosts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      users (
        id,
        username,
        avatar_url
      )
    `)
    .gte('created_at', today.toISOString());

  if (error) throw error;

  // Get ratings and calculate scores
  const postsWithScores = await Promise.all(
    (posts || []).map(async (post: any) => {
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('post_id', post.id);

      const ratingCount = ratings?.length || 0;
      const averageRating = ratingCount > 0
        ? ratings!.reduce((sum, r: any) => sum + r.rating, 0) / ratingCount
        : 0;

      // Score algorithm: average_rating * log(number_of_ratings)
      const score = ratingCount > 0
        ? averageRating * Math.log(ratingCount + 1)
        : 0;

      return {
        ...post,
        users: post.users,
        average_rating: averageRating,
        rating_count: ratingCount,
        score
      };
    })
  );

  // Sort by score and take top 5
  return postsWithScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// Check if user has exceeded daily post limit (3 posts per 24 hours)
export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  postsToday: number;
  limit: number
}> {
  const DAILY_LIMIT = 3;
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', twentyFourHoursAgo);

  if (error) throw error;

  return {
    allowed: (count || 0) < DAILY_LIMIT,
    postsToday: count || 0,
    limit: DAILY_LIMIT
  };
}

// Upload video to Supabase storage (no transcoding - keep original format)
export async function uploadVideo(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'mp4';
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('posts')
    .upload(fileName, file, { contentType: file.type });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('posts')
    .getPublicUrl(fileName);

  return publicUrl;
}

// Get video duration from file for storage
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration));
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}

// Create a new post
export async function createPost(
  userId: string,
  mediaUrl: string,
  caption: string,
  category: string,
  mediaType: 'image' | 'video' = 'image',
  durationSeconds?: number,
  fileSizeBytes?: number
) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      image_url: mediaUrl,  // Field name stays same for backward compatibility
      caption,
      category,
      media_type: mediaType,
      duration_seconds: durationSeconds || null,
      file_size_bytes: fileSizeBytes || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a post (removes media from storage and post from database)
export async function deletePost(postId: string, userId: string) {
  // First, get the post to verify ownership and get media URL
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('id, user_id, image_url')
    .eq('id', postId)
    .single();

  if (fetchError) throw fetchError;
  if (!post) throw new Error('Post not found');

  // Verify user owns this post
  if (post.user_id !== userId) {
    throw new Error('You can only delete your own posts');
  }

  // Extract file path from URL (format: https://...supabase.co/storage/v1/object/public/posts/userId/timestamp.ext)
  const urlParts = post.image_url.split('/posts/');
  if (urlParts.length === 2) {
    const filePath = urlParts[1];

    // Delete from storage (ignore errors - file might not exist)
    await supabase.storage
      .from('posts')
      .remove([filePath]);
  }

  // Delete post from database (cascade will delete ratings)
  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId); // Extra safety check

  if (deleteError) throw deleteError;
}

// Grace period for editing ratings (10 minutes in milliseconds)
const RATING_EDIT_GRACE_PERIOD_MS = 10 * 60 * 1000;

// Check if a rating can be edited (within grace period)
export function canEditRating(ratingCreatedAt: string): boolean {
  if (!ratingCreatedAt) return false;

  const createdTime = new Date(ratingCreatedAt).getTime();
  // Safari-safe: check if date parsing failed
  if (isNaN(createdTime)) return false;

  const now = Date.now();
  return now - createdTime < RATING_EDIT_GRACE_PERIOD_MS;
}

// Get remaining time to edit a rating (in seconds)
export function getRatingEditTimeRemaining(ratingCreatedAt: string): number {
  if (!ratingCreatedAt) return 0;

  const createdTime = new Date(ratingCreatedAt).getTime();
  // Safari-safe: check if date parsing failed
  if (isNaN(createdTime)) return 0;

  const expiresAt = createdTime + RATING_EDIT_GRACE_PERIOD_MS;
  const remaining = Math.max(0, expiresAt - Date.now());
  return Math.ceil(remaining / 1000);
}

// Submit a rating (or update if within grace period)
export async function submitRating(
  postId: string,
  userId: string,
  rating: number
) {
  // Check if user has already rated
  const { data: existingRating } = await supabase
    .from('ratings')
    .select('id, created_at')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (existingRating) {
    // Only allow editing if we have a valid timestamp and within grace period
    if (existingRating.created_at && canEditRating(existingRating.created_at)) {
      // Update the existing rating
      const { data, error } = await supabase
        .from('ratings')
        .update({ rating })
        .eq('id', existingRating.id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, isUpdate: true };
    } else {
      // Don't mention time limit if there's no timestamp (old rating)
      const message = existingRating.created_at
        ? 'Rating can no longer be changed (10 minute edit window has passed)'
        : 'You have already rated this post';
      throw new Error(message);
    }
  }

  const { data, error } = await supabase
    .from('ratings')
    .insert({
      post_id: postId,
      user_id: userId,
      rating
    })
    .select()
    .single();

  if (error) throw error;

  // Create notification for post owner (if not self-rating, and only for new ratings)
  try {
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (post && post.user_id !== userId) {
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        type: 'post_rated',
        actor_id: userId,
        post_id: postId,
        rating_value: rating
      });
    }
  } catch (notifError) {
    // Don't fail the rating if notification fails
    console.error('Failed to create notification:', notifError);
  }

  return data;
}

// Upload image to Supabase storage
// Convert image file to WebP format using Canvas API
async function convertToWebP(file: File, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      // Cap dimensions at 1920px while keeping aspect ratio
      let { width, height } = img;
      const MAX = 1920;
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('WebP conversion failed')),
        'image/webp',
        quality
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadImage(file: File, userId: string) {
  // Convert to WebP for smaller file sizes with high quality
  let uploadBlob: Blob = file;
  let ext = file.name.split('.').pop() || 'jpg';
  try {
    uploadBlob = await convertToWebP(file);
    ext = 'webp';
  } catch {
    // Fallback: upload original if conversion fails (e.g. SSR)
  }

  const fileName = `${userId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('posts')
    .upload(fileName, uploadBlob, {
      contentType: ext === 'webp' ? 'image/webp' : file.type,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('posts')
    .getPublicUrl(fileName);

  return publicUrl;
}

// Get or create user profile
export async function getOrCreateUser(authUser: any) {
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (existingUser) {
    return existingUser;
  }

  // Create new user
  const username = authUser.email?.split('@')[0] || `user_${authUser.id.slice(0, 8)}`;

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      username,
      email: authUser.email || '',
      avatar_url: authUser.user_metadata?.avatar_url || null
    })
    .select()
    .single();

  if (error) throw error;
  return newUser;
}

// Get admin statistics
export async function getAdminStats() {
  // Get total users count
  const { count: totalUsers, error: usersError } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });

  if (usersError) throw usersError;

  // Get total posts count
  const { count: totalPosts, error: postsError } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true });

  if (postsError) throw postsError;

  // Get posts breakdown by media type
  const { data: postsBreakdown, error: breakdownError } = await supabase
    .from('posts')
    .select('media_type');

  if (breakdownError) throw breakdownError;

  const imageCount = postsBreakdown?.filter(p => p.media_type === 'image').length || 0;
  const videoCount = postsBreakdown?.filter(p => p.media_type === 'video').length || 0;

  // Get category breakdown
  const { data: categoryData, error: categoryError } = await supabase
    .from('posts')
    .select('category');

  if (categoryError) throw categoryError;

  const categoryBreakdown = categoryData?.reduce((acc: any, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1;
    return acc;
  }, {}) || {};

  // Get recent posts (last 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentPosts, error: recentError } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', twentyFourHoursAgo);

  if (recentError) throw recentError;

  // Get recent users (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentUsers, error: recentUsersError } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo);

  if (recentUsersError) throw recentUsersError;

  // Get total ratings count
  const { count: totalRatings, error: ratingsError } = await supabase
    .from('ratings')
    .select('id', { count: 'exact', head: true });

  if (ratingsError) throw ratingsError;

  // Calculate storage usage (approximate from file_size_bytes)
  const { data: fileSizes, error: storageError } = await supabase
    .from('posts')
    .select('file_size_bytes');

  if (storageError) throw storageError;

  const totalStorageBytes = fileSizes?.reduce((sum, post) => sum + (post.file_size_bytes || 0), 0) || 0;
  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);

  return {
    totalUsers: totalUsers || 0,
    totalPosts: totalPosts || 0,
    imageCount,
    videoCount,
    categoryBreakdown,
    recentPosts: recentPosts || 0,
    recentUsers: recentUsers || 0,
    totalRatings: totalRatings || 0,
    totalStorageMB
  };
}

// Submit a report
export async function submitReport(
  postId: string,
  reporterId: string,
  reason: string,
  details?: string
) {
  // Check if user already reported this post
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('post_id', postId)
    .eq('reporter_id', reporterId)
    .maybeSingle();

  if (existing) {
    throw new Error('You have already reported this post');
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      post_id: postId,
      reporter_id: reporterId,
      reason,
      details: details || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get notifications for a user
export async function getNotifications(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:users!actor_id (
        username,
        avatar_url
      ),
      post:posts (
        image_url,
        caption
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

// Mark notifications as read
export async function markNotificationsRead(userId: string, notificationIds?: string[]) {
  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId);

  if (notificationIds && notificationIds.length > 0) {
    query = query.in('id', notificationIds);
  }

  const { error } = await query;
  if (error) throw error;
}

// Get pending reports for admin
export async function getPendingReports() {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      post:posts (
        id,
        image_url,
        caption,
        category,
        media_type,
        user_id,
        users (
          username,
          avatar_url
        )
      ),
      reporter:users!reporter_id (
        username,
        avatar_url
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
