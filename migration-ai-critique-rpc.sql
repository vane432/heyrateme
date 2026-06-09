-- Migration: Secure AI Critique Insertion (RPC)
-- Description: Creates a function to bypass RLS and insert AI comments securely.

-- First, drop the old legacy function if it exists so we don't have conflicting signatures
DROP FUNCTION IF EXISTS insert_ai_critique(UUID, TEXT, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS insert_ai_critique(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION insert_ai_critique(
  p_post_id UUID,
  p_persona TEXT,
  p_style NUMERIC,
  p_fit NUMERIC,
  p_color NUMERIC,
  p_occasion NUMERIC,
  p_comment TEXT
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ai_id UUID;
  v_comment_id UUID;
  v_comment_record RECORD;
  v_overall_rating NUMERIC;
BEGIN
  -- Map persona to UUID based on our previous migration
  IF p_persona = 'vance' THEN v_ai_id := '11111111-1111-1111-1111-111111111111'::UUID;
  ELSIF p_persona = 'kiki' THEN v_ai_id := '22222222-2222-2222-2222-222222222222'::UUID;
  ELSIF p_persona = 'oracle' THEN v_ai_id := '33333333-3333-3333-3333-333333333333'::UUID;
  ELSE RAISE EXCEPTION 'Invalid persona'; END IF;

  v_overall_rating := ROUND((p_style + p_fit + p_color + p_occasion) / 4.0, 1);

  -- 1. Insert the dimensional rating (update if it already exists)
  INSERT INTO ratings (post_id, user_id, rating, style_rating, fit_rating, color_harmony_rating, occasion_match_rating, rating_type)
  VALUES (p_post_id, v_ai_id, v_overall_rating, p_style, p_fit, p_color, p_occasion, 'dimensional')
  ON CONFLICT (post_id, user_id) DO UPDATE SET 
    rating = EXCLUDED.rating,
    style_rating = EXCLUDED.style_rating,
    fit_rating = EXCLUDED.fit_rating,
    color_harmony_rating = EXCLUDED.color_harmony_rating,
    occasion_match_rating = EXCLUDED.occasion_match_rating,
    rating_type = EXCLUDED.rating_type;

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