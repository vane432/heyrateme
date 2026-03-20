export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          avatar_url: string | null
          display_name: string | null
          bio: string | null
          instagram: string | null
          tiktok: string | null
          twitter: string | null
          website: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          avatar_url?: string | null
          display_name?: string | null
          bio?: string | null
          instagram?: string | null
          tiktok?: string | null
          twitter?: string | null
          website?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          avatar_url?: string | null
          display_name?: string | null
          bio?: string | null
          instagram?: string | null
          tiktok?: string | null
          twitter?: string | null
          website?: string | null
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          image_url: string
          caption: string
          category: string
          created_at: string
          media_type: 'image' | 'video'
          duration_seconds: number | null
          file_size_bytes: number | null
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          caption: string
          category: string
          created_at?: string
          media_type?: 'image' | 'video'
          duration_seconds?: number | null
          file_size_bytes?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          caption?: string
          category?: string
          created_at?: string
          media_type?: 'image' | 'video'
          duration_seconds?: number | null
          file_size_bytes?: number | null
        }
      }
      ratings: {
        Row: {
          id: string
          post_id: string
          user_id: string
          rating: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          rating: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          rating?: number
          created_at?: string
        }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Rating = Database['public']['Tables']['ratings']['Row']

export const MEDIA_TYPES = ['image', 'video'] as const;
export type MediaType = typeof MEDIA_TYPES[number];

export type PostWithUser = Post & {
  users: User
  average_rating: number
  rating_count: number
  user_rating?: number
}

export const CATEGORIES = [
  'Fashion',
  'Food',
  'Fitness',
  'DIY',
  'Life Tips',
  'Photography',
  'Art'
] as const

export type Category = typeof CATEGORIES[number]
