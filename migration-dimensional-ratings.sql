-- Migration: Multi-Dimensional Fashion Rating System
-- Date: 2026-03-23
-- Description: Add dimensional rating columns to ratings table and occasion field to posts table

-- ==========================================
-- PART 1: Extend Ratings Table
-- ==========================================

-- Add dimensional rating columns (nullable for backward compatibility)
ALTER TABLE ratings
ADD COLUMN style_rating INTEGER CHECK (style_rating >= 1 AND style_rating <= 5),
ADD COLUMN fit_rating INTEGER CHECK (fit_rating >= 1 AND fit_rating <= 5),
ADD COLUMN color_harmony_rating INTEGER CHECK (color_harmony_rating >= 1 AND color_harmony_rating <= 5),
ADD COLUMN occasion_match_rating INTEGER CHECK (occasion_match_rating >= 1 AND occasion_match_rating <= 5),
ADD COLUMN rating_type TEXT DEFAULT 'legacy' CHECK (rating_type IN ('legacy', 'dimensional'));

-- Add comment for documentation
COMMENT ON COLUMN ratings.style_rating IS 'Fashion dimension: How fashionable/on-trend (1-5)';
COMMENT ON COLUMN ratings.fit_rating IS 'Fashion dimension: How well the outfit fits (1-5)';
COMMENT ON COLUMN ratings.color_harmony_rating IS 'Fashion dimension: How well colors work together (1-5)';
COMMENT ON COLUMN ratings.occasion_match_rating IS 'Fashion dimension: Appropriateness for stated occasion (1-5)';
COMMENT ON COLUMN ratings.rating_type IS 'Distinguishes between legacy (single-star) and dimensional (4-dimension) ratings';

-- ==========================================
-- PART 2: Backfill Existing Data
-- ==========================================

-- Backfill existing ratings as legacy type
-- This ensures all existing ratings have the rating_type='legacy' and dimensional columns populated
UPDATE ratings
SET
  style_rating = rating,
  fit_rating = rating,
  color_harmony_rating = rating,
  occasion_match_rating = rating,
  rating_type = 'legacy'
WHERE rating_type IS NULL;

-- ==========================================
-- PART 3: Add Occasion Field to Posts
-- ==========================================

-- Add occasion context field for Fashion posts
ALTER TABLE posts
ADD COLUMN occasion TEXT CHECK (occasion IN ('Casual', 'Date', 'Interview', 'Wedding', 'Business', 'Formal', 'Other'));

-- Add comment
COMMENT ON COLUMN posts.occasion IS 'Context for fashion posts (e.g., Date, Interview, Wedding). Required for Fashion category posts.';

-- ==========================================
-- PART 4: Create Indexes for Performance
-- ==========================================

-- Index for filtering dimensional ratings (used in average calculations)
CREATE INDEX idx_ratings_dimensional ON ratings(rating_type, post_id) WHERE rating_type = 'dimensional';

-- Index for posts with occasion field (used in fashion filtering)
CREATE INDEX idx_posts_occasion ON posts(occasion) WHERE occasion IS NOT NULL;

-- Index for fashion category posts (will be frequently queried)
CREATE INDEX idx_posts_fashion ON posts(category) WHERE category = 'Fashion';

-- ==========================================
-- PART 5: Verification Queries
-- ==========================================

-- Run these queries to verify migration success:

-- Check rating_type distribution
-- Expected: All existing ratings should show as 'legacy'
-- SELECT rating_type, COUNT(*) as count FROM ratings GROUP BY rating_type;

-- Check for any NULL rating_type (should be 0)
-- SELECT COUNT(*) as null_rating_types FROM ratings WHERE rating_type IS NULL;

-- Check dimensional columns are populated for legacy ratings
-- Expected: All legacy ratings should have dimensional columns equal to overall rating
-- SELECT COUNT(*) as mismatched
-- FROM ratings
-- WHERE rating_type = 'legacy'
--   AND (style_rating != rating OR fit_rating != rating OR color_harmony_rating != rating OR occasion_match_rating != rating);

-- Check posts table has occasion column
-- SELECT COUNT(*) as posts_with_occasion FROM posts WHERE occasion IS NOT NULL;

-- Sample query: Get dimensional averages for a Fashion post
-- SELECT
--   p.id,
--   p.caption,
--   p.occasion,
--   AVG(r.rating) as overall_avg,
--   AVG(CASE WHEN r.rating_type = 'dimensional' THEN r.style_rating END) as style_avg,
--   AVG(CASE WHEN r.rating_type = 'dimensional' THEN r.fit_rating END) as fit_avg,
--   AVG(CASE WHEN r.rating_type = 'dimensional' THEN r.color_harmony_rating END) as color_avg,
--   AVG(CASE WHEN r.rating_type = 'dimensional' THEN r.occasion_match_rating END) as occasion_avg,
--   COUNT(*) as total_ratings,
--   COUNT(CASE WHEN r.rating_type = 'dimensional' THEN 1 END) as dimensional_count
-- FROM posts p
-- LEFT JOIN ratings r ON p.id = r.post_id
-- WHERE p.category = 'Fashion'
-- GROUP BY p.id, p.caption, p.occasion
-- LIMIT 5;

-- ==========================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ==========================================

-- To rollback this migration (only if absolutely necessary):
/*
-- Remove indexes
DROP INDEX IF EXISTS idx_ratings_dimensional;
DROP INDEX IF EXISTS idx_posts_occasion;
DROP INDEX IF EXISTS idx_posts_fashion;

-- Remove columns from ratings table
ALTER TABLE ratings
DROP COLUMN IF EXISTS style_rating,
DROP COLUMN IF EXISTS fit_rating,
DROP COLUMN IF EXISTS color_harmony_rating,
DROP COLUMN IF EXISTS occasion_match_rating,
DROP COLUMN IF EXISTS rating_type;

-- Remove column from posts table
ALTER TABLE posts
DROP COLUMN IF EXISTS occasion;
*/

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify with the queries above
-- 3. Deploy backend code changes (types.ts, queries.ts)
-- 4. Deploy frontend UI components
-- 5. Monitor for any issues
