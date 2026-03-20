// @ts-nocheck
import { supabase } from './supabaseClient';
import type { PostWithUser } from './types';

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

  if (category) {
    query = query.eq('category', category);
  }

  const { data: posts, error } = await query;

  if (error) throw error;

  // Get ratings for all posts
  const postsWithRatings = await Promise.all(
    (posts || []).map(async (post: any) => {
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating, user_id')
        .eq('post_id', post.id);

      const ratingCount = ratings?.length || 0;
      const averageRating = ratingCount > 0
        ? ratings!.reduce((sum, r: any) => sum + r.rating, 0) / ratingCount
        : 0;

      const userRating = userId
        ? (ratings?.find((r: any) => r.user_id === userId))?.rating
        : undefined;

      return {
        ...post,
        users: post.users,
        average_rating: averageRating,
        rating_count: ratingCount,
        user_rating: userRating,
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
    .select('rating, user_id')
    .eq('post_id', postId);

  const ratingCount = ratings?.length || 0;
  const averageRating = ratingCount > 0
    ? ratings!.reduce((sum, r: any) => sum + r.rating, 0) / ratingCount
    : 0;

  // Check if user has already rated
  const userRating = userId
    ? (ratings?.find((r: any) => r.user_id === userId) as any)?.rating
    : undefined;

  return {
    ...(post as any),
    users: post.users,
    average_rating: averageRating,
    rating_count: ratingCount,
    user_rating: userRating
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

// Submit a rating
export async function submitRating(
  postId: string,
  userId: string,
  rating: number
) {
  // Check if user has already rated
  const { data: existingRating } = await supabase
    .from('ratings')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (existingRating) {
    throw new Error('You have already rated this post');
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
