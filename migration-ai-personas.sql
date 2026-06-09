-- Migration: Create AI Persona Accounts
-- Description: Safely inserts Vance, Kiki, and Oracle into auth.users and public.users

DO $$
DECLARE
    vance_uid UUID := '11111111-1111-1111-1111-111111111111';
    kiki_uid UUID := '22222222-2222-2222-2222-222222222222';
    oracle_uid UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- ==========================================
    -- 1. Create Vance (The Sarcastic Elitist)
    -- ==========================================
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (vance_uid, 'authenticated', 'authenticated', 'vance@heyrate.me', crypt('password123', gen_salt('bf')), now(), now(), now())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.users (id, username, email, avatar_url)
    VALUES (vance_uid, 'vance', 'vance@heyrate.me', 'https://api.dicebear.com/7.x/notionists/svg?seed=vance&backgroundColor=e2e8f0')
    ON CONFLICT (username) DO NOTHING;

    -- ==========================================
    -- 2. Create Kiki (The Chaos Hype-Beast)
    -- ==========================================
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (kiki_uid, 'authenticated', 'authenticated', 'kiki@heyrate.me', crypt('password123', gen_salt('bf')), now(), now(), now())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.users (id, username, email, avatar_url)
    VALUES (kiki_uid, 'kiki', 'kiki@heyrate.me', 'https://api.dicebear.com/7.x/notionists/svg?seed=kiki&backgroundColor=fbcfe8')
    ON CONFLICT (username) DO NOTHING;

    -- ==========================================
    -- 3. Create Oracle (The Fashion Psychoanalyst)
    -- ==========================================
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (oracle_uid, 'authenticated', 'authenticated', 'oracle@heyrate.me', crypt('password123', gen_salt('bf')), now(), now(), now())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.users (id, username, email, avatar_url)
    VALUES (oracle_uid, 'oracle', 'oracle@heyrate.me', 'https://api.dicebear.com/7.x/notionists/svg?seed=oracle&backgroundColor=d1fae5')
    ON CONFLICT (username) DO NOTHING;
END $$;