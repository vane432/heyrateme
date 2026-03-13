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

// Create a new post
export async function createPost(
  userId: string,
  imageUrl: string,
  caption: string,
  category: string
) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      caption,
      category
    })
    .select()
    .single();

  if (error) throw error;
  return data;
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
