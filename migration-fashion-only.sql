-- Migration: Fashion-Only Platform with Gender Filtering
-- Date: 2026-03-23
-- Description: Transform to fashion-only platform with specific fashion categories and gender filtering

-- ==========================================
-- PART 1: Add Gender Field to Posts Table
-- ==========================================

-- Add gender field for fashion filtering
ALTER TABLE posts
ADD COLUMN gender TEXT CHECK (gender IN ('Menswear', 'Womenswear', 'Unisex / Androgynous'));

-- Add comment for documentation
COMMENT ON COLUMN posts.gender IS 'Fashion gender category: Menswear, Womenswear, or Unisex/Androgynous';

-- ==========================================
-- PART 2: Update Category Constraints (Optional - for safety)
-- ==========================================

-- Note: We're changing the category values in the application code
-- The database constraint for category can remain flexible to avoid migration complexity
-- New categories will be: Date Night, Formal / Event, Work / Office, Streetwear,
-- Thrifted / Vintage, Night Out / Party, Casual / Everyday, Athleisure / Gym

-- If you want to add constraint (optional):
-- ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;
-- ALTER TABLE posts ADD CONSTRAINT posts_category_check
--   CHECK (category IN ('Date Night', 'Formal / Event', 'Work / Office', 'Streetwear',
--                       'Thrifted / Vintage', 'Night Out / Party', 'Casual / Everyday', 'Athleisure / Gym'));

-- ==========================================
-- PART 3: Create Indexes for Performance
-- ==========================================

-- Index for gender filtering (used frequently in feeds)
CREATE INDEX idx_posts_gender ON posts(gender) WHERE gender IS NOT NULL;

-- Composite index for category + gender filtering
CREATE INDEX idx_posts_category_gender ON posts(category, gender);

-- ==========================================
-- PART 4: Data Migration for Existing Posts
-- ==========================================

-- Set existing Fashion posts to a default gender (optional)
-- UPDATE posts SET gender = 'Unisex / Androgynous' WHERE category = 'Fashion' AND gender IS NULL;

-- For existing non-Fashion posts, you may want to either:
-- 1. Delete them: DELETE FROM posts WHERE category != 'Fashion';
-- 2. Or migrate them to fashion categories (manual process based on content)
-- 3. Or leave them as-is and handle in application logic

-- ==========================================
-- PART 5: Update Existing Fashion Posts to New Categories
-- ==========================================

-- This is a manual process since we can't automatically determine the right fashion category
-- You may want to:
-- 1. Set all existing Fashion posts to 'Casual / Everyday' as default
-- 2. Or let users re-categorize their posts through the UI
-- 3. Or migrate based on occasions if they exist

-- Default migration (sets all Fashion posts to Casual / Everyday):
-- UPDATE posts SET category = 'Casual / Everyday' WHERE category = 'Fashion';

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check posts with gender field
-- SELECT category, gender, COUNT(*) FROM posts GROUP BY category, gender ORDER BY category, gender;

-- Check category distribution
-- SELECT category, COUNT(*) FROM posts GROUP BY category ORDER BY COUNT(*) DESC;

-- Sample query: Get posts by gender and category
-- SELECT * FROM posts WHERE gender = 'Womenswear' AND category = 'Date Night' ORDER BY created_at DESC LIMIT 5;

-- ==========================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ==========================================

-- To rollback this migration:
/*
-- Remove indexes
DROP INDEX IF EXISTS idx_posts_gender;
DROP INDEX IF EXISTS idx_posts_category_gender;

-- Remove gender column
ALTER TABLE posts DROP COLUMN IF EXISTS gender;

-- Restore original categories (if you want to go back)
-- UPDATE posts SET category = 'Fashion' WHERE category IN ('Date Night', 'Formal / Event', 'Work / Office', 'Streetwear', 'Thrifted / Vintage', 'Night Out / Party', 'Casual / Everyday', 'Athleisure / Gym');
*/

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Update application code to use new categories and gender filtering
-- 3. Update UI components for category selection and gender filtering
-- 4. Test with new fashion categories and gender options
-- 5. Consider data cleanup for existing non-fashion posts