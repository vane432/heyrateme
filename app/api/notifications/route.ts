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

// Get notifications
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const accessToken = searchParams.get('access_token');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const client = getClient(accessToken);

    // Fetch notifications with actor and post info
    const { data: notifications, error } = await client
      .from('notifications')
      .select(`
        *,
        actor:users!actor_id (
          username,
          avatar_url
        ),
        post:posts (
          image_url,
          caption
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[notifications] fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await client
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return NextResponse.json({ notifications, unread_count: unreadCount || 0 });
  } catch (err: any) {
    console.error('[notifications] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const { user_id, notification_ids, mark_all, access_token } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const client = getClient(access_token);

    let query = client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user_id);

    if (!mark_all && notification_ids?.length > 0) {
      query = query.in('id', notification_ids);
    }

    const { error } = await query;

    if (error) {
      console.error('[notifications] update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[notifications] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
