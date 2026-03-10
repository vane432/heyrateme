# HeyRateMe

A social media platform where users rate photos with stars (1-5) instead of likes.

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (authentication, database, storage)

## Features

- ⭐ Rate posts with 1-5 stars
- 📸 Upload and share photos
- 👤 User profiles with average ratings
- 🏆 Top posts leaderboard
- 🎨 Category filtering (Fashion, Food, Fitness, DIY, Life Tips, Photography, Art)
- 🔐 Authentication (Google & Email)

## Setup

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

3. Add your Supabase credentials to `.env.local`

### 3. Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_ratings_post_id ON ratings(post_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for posts
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ratings
CREATE POLICY "Ratings are viewable by everyone" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert own ratings" ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4. Storage Setup

1. Go to Storage in Supabase dashboard
2. Create a new bucket called `posts`
3. Make it public
4. Set up the following policy:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

-- Allow public access to images
CREATE POLICY "Images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');
```

### 5. Authentication Setup

1. Go to Authentication → Providers in Supabase
2. Enable Email provider
3. Enable Google provider (add OAuth credentials)

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── login/page.tsx          # Login page
│   ├── page.tsx                # Home feed
│   ├── create/page.tsx         # Create post
│   ├── top/page.tsx            # Top posts
│   ├── post/[id]/page.tsx      # Individual post
│   └── profile/[username]/page.tsx  # User profile
├── components/
│   ├── Navbar.tsx              # Navigation bar
│   ├── PostCard.tsx            # Post card component
│   ├── RatingStars.tsx         # Star rating component
│   ├── UploadPost.tsx          # Upload form
│   └── CategoryFilter.tsx      # Category filter
└── lib/
    ├── supabaseClient.ts       # Supabase client
    ├── types.ts                # TypeScript types
    └── queries.ts              # Database queries
```

## Features Breakdown

### Star Rating System
- Users can rate any post with 1-5 stars
- Each user can only rate a post once
- Average rating is calculated and displayed
- Ratings are stored in the database

### Top Posts Algorithm
Posts are ranked using: `score = average_rating × log(number_of_ratings)`

This ensures posts with both high ratings and many votes rank higher.

### Categories
- Fashion
- Food
- Fitness
- DIY
- Life Tips
- Photography
- Art

## License

MIT
