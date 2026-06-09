-- Migration: Secure AI Critique Insertion (RPC)
-- Description: Creates a function to bypass RLS and insert AI comments securely.

CREATE OR REPLACE FUNCTION insert_ai_critique(
  p_post_id UUID,
  p_persona TEXT,
  p_rating NUMERIC,
  p_comment TEXT
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS policies
AS $$
DECLARE
  v_ai_id UUID;
  v_comment_id UUID;
  v_comment_record RECORD;
BEGIN
  -- Map persona to UUID based on our previous migration
  IF p_persona = 'vance' THEN v_ai_id := '11111111-1111-1111-1111-111111111111'::UUID;
  ELSIF p_persona = 'kiki' THEN v_ai_id := '22222222-2222-2222-2222-222222222222'::UUID;
  ELSIF p_persona = 'oracle' THEN v_ai_id := '33333333-3333-3333-3333-333333333333'::UUID;
  ELSE RAISE EXCEPTION 'Invalid persona'; END IF;

  -- 1. Insert the rating (ignore if this specific AI already rated it)
  INSERT INTO ratings (post_id, user_id, rating, rating_type)
  VALUES (p_post_id, v_ai_id, p_rating, 'legacy')
  ON CONFLICT (post_id, user_id) DO UPDATE SET rating = EXCLUDED.rating;

  -- 2. Insert the comment and grab its ID
  INSERT INTO comments (post_id, user_id, content)
  VALUES (p_post_id, v_ai_id, p_comment)
  RETURNING id INTO v_comment_id;

  -- 3. Fetch the joined record with user info so the frontend can render it immediately
  SELECT c.id, c.content, c.created_at, u.username, u.avatar_url
  INTO v_comment_record
  FROM comments c JOIN users u ON c.user_id = u.id
  WHERE c.id = v_comment_id;

  RETURN row_to_json(v_comment_record);
END;
$$;