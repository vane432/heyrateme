# HeyRateMe - Quick Reference

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Add Supabase credentials to .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# 4. Run SQL in Supabase (supabase-schema.sql)

# 5. Create storage bucket "posts" (make it public)

# 6. Run dev server
npm run dev
```

## 📁 Project Structure

```
src/
├── app/          # Pages (Next.js App Router)
├── components/   # Reusable React components
└── lib/          # Utilities (Supabase, types, queries)
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabaseClient.ts` | Supabase configuration |
| `src/lib/types.ts` | TypeScript type definitions |
| `src/lib/queries.ts` | Database query functions |
| `src/components/RatingStars.tsx` | Star rating component |
| `src/app/page.tsx` | Home feed |
| `supabase-schema.sql` | Database schema |

## 🎯 Core Features

✅ Star ratings (1-5) instead of likes  
✅ Photo uploads with categories  
✅ User profiles with stats  
✅ Top posts leaderboard  
✅ Category filtering  
✅ Google + Email auth  

## 📊 Database Tables

- **users** - User profiles
- **posts** - Photo posts with categories
- **ratings** - Star ratings (1-5)

## 🎨 Categories

Fashion • Food • Fitness • DIY • Life Tips • Photography • Art

## 🔐 Authentication

- Google OAuth
- Email/Password
- Protected routes

## 📦 Key Dependencies

- **@supabase/supabase-js** - Backend
- **next** - Framework
- **typescript** - Type safety
- **tailwindcss** - Styling

## 🌐 Pages

| Route | Description |
|-------|-------------|
| `/` | Home feed |
| `/login` | Authentication |
| `/create` | Upload post |
| `/top` | Top posts today |
| `/post/[id]` | View post |
| `/profile/[username]` | User profile |

## 🎯 Top Posts Algorithm

```
score = average_rating × log(number_of_ratings)
```

## 🛠️ Common Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 📚 Documentation

- **README.md** - Overview
- **SETUP.md** - Detailed setup guide
- **IMPLEMENTATION.md** - Technical details
- **QUICK_REFERENCE.md** - This file

## 💡 Tips

- Check [SETUP.md](SETUP.md) for detailed instructions
- TypeScript errors are expected until database is configured
- Images must be uploaded to "posts" storage bucket
- Each user can rate a post only once
- Top posts reset daily

## 🐛 Troubleshooting

**Issue**: "Invalid API key"  
**Fix**: Check `.env.local` has correct Supabase credentials

**Issue**: "Row Level Security" errors  
**Fix**: Run entire SQL schema from `supabase-schema.sql`

**Issue**: Images not uploading  
**Fix**: Create "posts" storage bucket and make it public

**Issue**: Can't sign in with Google  
**Fix**: Enable Google provider in Supabase auth settings

## 📞 Support

- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Project issues: Check SETUP.md troubleshooting section
