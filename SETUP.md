# HeyRateMe - Setup Instructions

## Quick Start Guide

### Step 1: Install Dependencies

```bash
npm install
```

The Supabase client library is already included in package.json.

### Step 2: Setup Supabase

1. **Create a Supabase Account**
   - Go to https://supabase.com
   - Create a new account or sign in
   - Click "New Project"

2. **Create Your Project**
   - Organization: Create or select one
   - Name: HeyRateMe (or your choice)
   - Database Password: Save this securely
   - Region: Choose closest to you
   - Wait for project to initialize (~2 minutes)

3. **Get API Credentials**
   - Go to Project Settings → API
   - Copy "Project URL" 
   - Copy "anon public" key

### Step 3: Configure Environment Variables

1. Create `.env.local` file in project root:

```bash
cp .env.example .env.local
```

2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Setup Database Tables

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase-schema.sql`
3. Paste and click "Run"
4. Wait for success message

### Step 5: Setup Storage

1. Go to Storage in Supabase dashboard
2. Click "New bucket"
3. Name: `posts`
4. Make it Public ✓
5. Click "Create bucket"

The storage policies are included in the SQL schema.

### Step 6: Setup Authentication

1. Go to Authentication → Providers
2. **Enable Email Provider** (already enabled by default)
3. **Enable Google Provider**:
   - Go to Google Cloud Console
   - Create OAuth credentials
   - Add authorized redirect URI: 
     `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret
   - Paste into Supabase Google provider settings
   - Save

### Step 7: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### Step 8: Test the App

1. **Sign Up**
   - Click "Login" in navbar
   - Sign up with email or Google
   - You'll be redirected to home page

2. **Create First Post**
   - Click "Create" in navbar
   - Upload an image
   - Write caption
   - Select category
   - Click "Post"

3. **Rate a Post**
   - Click on stars (1-5)
   - Rating is saved immediately
   - You can only rate once per post

4. **View Profile**
   - Click "Profile" in navbar
   - See your posts and average rating

5. **Check Top Posts**
   - Click "Top Posts" in navbar
   - See today's highest-rated posts

## Troubleshooting

### Issue: "Invalid API key"
- Check `.env.local` has correct credentials
- Restart dev server after adding env variables

### Issue: "Row Level Security" errors
- Make sure you ran the entire SQL schema
- Check RLS policies are enabled

### Issue: "Storage bucket not found"
- Create `posts` bucket in Supabase Storage
- Make it public

### Issue: Images not uploading
- Check storage policies are created
- Verify bucket name is exactly `posts`

### Issue: Can't sign in with Google
- Add redirect URI in Google Cloud Console
- Enable Google provider in Supabase
- Add Client ID and Secret

## Project Structure

```
heyrateme/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home feed
│   │   ├── login/page.tsx     # Login page
│   │   ├── create/page.tsx    # Create post
│   │   ├── top/page.tsx       # Top posts
│   │   ├── post/[id]/         # Individual post
│   │   └── profile/[username]/ # User profile
│   ├── components/            # Reusable React components
│   │   ├── Navbar.tsx         # Navigation
│   │   ├── PostCard.tsx       # Post display
│   │   ├── RatingStars.tsx    # Star rating
│   │   ├── UploadPost.tsx     # Upload form
│   │   └── CategoryFilter.tsx # Category filter
│   └── lib/                   # Utilities
│       ├── supabaseClient.ts  # Supabase setup
│       ├── types.ts           # TypeScript types
│       └── queries.ts         # Database queries
├── app/                       # Next.js config
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── .env.local                # Environment variables (create this)
├── .env.example              # Example env file
├── supabase-schema.sql       # Database schema
└── README.md                 # Documentation
```

## Next Steps

After basic setup works:

1. **Customize Styling**
   - Edit Tailwind classes in components
   - Update color scheme in globals.css

2. **Add Features**
   - Comments system
   - Follow/unfollow users
   - Notifications
   - Search functionality

3. **Deploy**
   - Deploy to Vercel
   - Add production environment variables
   - Update Google OAuth redirect URIs

## Support

For issues with:
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Tailwind: https://tailwindcss.com/docs
