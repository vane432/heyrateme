-- Migration: Basic Comments System
-- Date: 2026-03-24
-- Description: Add comments table with user relationships and RLS policies

-- ==========================================
-- PART 1: Create Comments Table
-- ==========================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE comments IS 'Top-level comments on posts (no nested replies)';
COMMENT ON COLUMN comments.post_id IS 'Reference to the post being commented on';
COMMENT ON COLUMN comments.user_id IS 'User who created the comment';
COMMENT ON COLUMN comments.content IS 'Comment text content (1-500 characters)';

-- ==========================================
-- PART 2: Create Indexes for Performance
-- ==========================================

-- Index for fetching comments by post (most common query)
CREATE INDEX idx_comments_post_id ON comments(post_id, created_at DESC);

-- Index for fetching user's comments
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Index for created_at ordering
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- ==========================================
-- PART 3: Enable Row Level Security
-- ==========================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Comments are viewable by everyone
CREATE POLICY "Comments are viewable by everyone"
ON comments FOR SELECT
USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can insert own comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
USING (auth.uid() = user_id);

-- ==========================================
-- PART 4: Verification Queries
-- ==========================================

-- Run these queries to verify migration success:

-- Check table structure
-- Expected: Should see id, post_id, user_id, content, created_at columns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'comments';

-- Check indexes
-- Expected: Should see 3 indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'comments';

-- Check RLS policies
-- Expected: Should see 3 policies (SELECT, INSERT, DELETE)
-- SELECT policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename = 'comments';

-- Check for any existing comments (should be 0 initially)
-- SELECT COUNT(*) as comment_count FROM comments;

-- ==========================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ==========================================

-- To rollback this migration (only if absolutely necessary):
/*
-- Remove indexes
DROP INDEX IF EXISTS idx_comments_post_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_comments_created_at;

-- Remove table (cascade will remove policies)
DROP TABLE IF EXISTS comments;
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
