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
          created_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          avatar_url?: string | null
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
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          caption: string
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          caption?: string
          category?: string
          created_at?: string
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
