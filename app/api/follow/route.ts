import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient(accessToken?: string) {
  if (SERVICE_KEY) {
    return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  }
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} },
  });
}

// Follow a user
export async function POST(req: NextRequest) {
  try {
    const { follower_id, following_id, access_token } = await req.json();
    if (!follower_id || !following_id) {
      return NextResponse.json({ error: 'Missing follower_id or following_id' }, { status: 400 });
    }
    if (follower_id === following_id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const client = getClient(access_token);

    // Check if already following
    const { data: existing } = await client
      .from('follows')
      .select('id')
      .eq('follower_id', follower_id)
      .eq('following_id', following_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ action: 'already_following' });
    }

    const { error } = await client
      .from('follows')
      .insert({ follower_id, following_id });

    if (error) {
      console.error('[follow] insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action: 'followed' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Unfollow a user
export async function DELETE(req: NextRequest) {
  try {
    const { follower_id, following_id, access_token } = await req.json();
    if (!follower_id || !following_id) {
      return NextResponse.json({ error: 'Missing follower_id or following_id' }, { status: 400 });
    }

    const client = getClient(access_token);

    const { error } = await client
      .from('follows')
      .delete()
      .eq('follower_id', follower_id)
      .eq('following_id', following_id);

    if (error) {
      console.error('[unfollow] delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action: 'unfollowed' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Get follow stats for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const currentUserId = searchParams.get('current_user_id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const client = getClient();

    // Get followers count
    const { count: followersCount } = await client
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    // Get following count
    const { count: followingCount } = await client
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      const { data } = await client
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .maybeSingle();
      isFollowing = !!data;
    }

    return NextResponse.json({
      followers: followersCount ?? 0,
      following: followingCount ?? 0,
      is_following: isFollowing,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
