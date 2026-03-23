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
          occasion: string | null
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
          occasion?: string | null
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
          occasion?: string | null
        }
      }
      ratings: {
        Row: {
          id: string
          post_id: string
          user_id: string
          rating: number
          created_at: string
          style_rating: number | null
          fit_rating: number | null
          color_harmony_rating: number | null
          occasion_match_rating: number | null
          rating_type: 'legacy' | 'dimensional'
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          rating: number
          created_at?: string
          style_rating?: number | null
          fit_rating?: number | null
          color_harmony_rating?: number | null
          occasion_match_rating?: number | null
          rating_type?: 'legacy' | 'dimensional'
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          rating?: number
          created_at?: string
          style_rating?: number | null
          fit_rating?: number | null
          color_harmony_rating?: number | null
          occasion_match_rating?: number | null
          rating_type?: 'legacy' | 'dimensional'
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

// Occasion types for Fashion posts
export const OCCASIONS = [
  'Casual',
  'Date',
  'Interview',
  'Wedding',
  'Business',
  'Formal',
  'Other'
] as const;
export type Occasion = typeof OCCASIONS[number];

// Rating dimensions for multi-dimensional feedback
export type RatingDimensions = {
  style: number;
  fit: number;
  colorHarmony: number;
  occasionMatch: number;
};

export type PostWithUser = Post & {
  users: User
  average_rating: number
  rating_count: number
  user_rating?: number
  user_rating_created_at?: string
  // Dimensional rating breakdowns (for Fashion category)
  dimensional_averages?: RatingDimensions
  user_dimensional_ratings?: RatingDimensions
}

export const CATEGORIES = [
  'Fashion',
  'Food',
  'Fitness',
  'DIY',
  'Life Tips',
  'Photography',
  'Art',
  'Travel',
  'Music',
  'Gaming',
  'Beauty',
  'Pets',
  'Sports',
  'Tech',
  'Nature',
  'Memes'
] as const

export type Category = typeof CATEGORIES[number]

// Report types
export const REPORT_REASONS = ['inappropriate', 'spam', 'harassment', 'other'] as const;
export type ReportReason = typeof REPORT_REASONS[number];

export interface Report {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: ReportReason;
  details: string | null;
  status: 'pending' | 'dismissed' | 'actioned';
  created_at: string;
  // Joined data
  post?: Post & { users: User };
  reporter?: User;
}

// Notification types
export const NOTIFICATION_TYPES = ['new_follower', 'post_rated'] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string;
  post_id: string | null;
  rating_value: number | null;
  is_read: boolean;
  created_at: string;
  // Joined data
  actor?: {
    username: string;
    avatar_url: string | null;
  };
  post?: {
    image_url: string;
    caption: string;
  };
}

// Messaging types
export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  shared_post_id: string | null;
  created_at: string;
}

export interface MessageWithDetails extends Message {
  sender: User;
  shared_post?: Post & { users: User };
}

export interface ConversationWithDetails extends Conversation {
  participants: (ConversationParticipant & { user: User })[];
  last_message?: MessageWithDetails;
  unread_count: number;
  other_user?: User; // For 1-on-1 conversations
}
