import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      display_name,
      username,
      bio,
      avatar_url,
      instagram,
      tiktok,
      twitter,
      website,
      access_token,
    } = body as {
      user_id: string;
      display_name?: string;
      username?: string;
      bio?: string;
      avatar_url?: string;
      instagram?: string;
      tiktok?: string;
      twitter?: string;
      website?: string;
      access_token?: string;
    };

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Use service role if available, otherwise user's token
    const adminClient = SERVICE_KEY
      ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
      : createClient(SUPABASE_URL, ANON_KEY, {
          auth: { persistSession: false },
          global: { headers: access_token ? { Authorization: `Bearer ${access_token}` } : {} },
        });

    // Validate username if changing
    if (username) {
      const sanitized = username.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
      if (sanitized.length < 3) {
        return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
      }

      // Check uniqueness
      const { data: existing } = await adminClient
        .from('users')
        .select('id')
        .eq('username', sanitized)
        .maybeSingle();

      if (existing && existing.id !== user_id) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
      }
    }

    // Validate bio length
    if (bio !== undefined && bio.length > 160) {
      return NextResponse.json({ error: 'Bio must be 160 characters or less' }, { status: 400 });
    }

    // Build update object
    const updates: Record<string, any> = {};
    if (display_name !== undefined) updates.display_name = display_name.slice(0, 50);
    if (username) updates.username = username.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
    if (bio !== undefined) updates.bio = bio.slice(0, 160);
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (instagram !== undefined) updates.instagram = instagram.slice(0, 100);
    if (tiktok !== undefined) updates.tiktok = tiktok.slice(0, 100);
    if (twitter !== undefined) updates.twitter = twitter.slice(0, 100);
    if (website !== undefined) updates.website = website.slice(0, 200);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from('users')
      .update(updates)
      .eq('id', user_id)
      .select('username, display_name, bio, avatar_url, instagram, tiktok, twitter, website')
      .single();

    if (error) {
      console.error('[update-profile] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[update-profile] unexpected error:', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
