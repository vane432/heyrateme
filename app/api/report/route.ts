import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Admin email for authorization
const ADMIN_EMAILS = ['danish.parvi@gmail.com'];

function getClient(accessToken?: string) {
  if (SERVICE_KEY) {
    return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  }
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} },
  });
}

// Submit a report
export async function POST(req: NextRequest) {
  try {
    const { post_id, reporter_id, reason, details, access_token } = await req.json();

    if (!post_id || !reporter_id || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validReasons = ['inappropriate', 'spam', 'harassment', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    const client = getClient(access_token);

    // Check if user already reported this post
    const { data: existing } = await client
      .from('reports')
      .select('id')
      .eq('post_id', post_id)
      .eq('reporter_id', reporter_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'You have already reported this post' }, { status: 400 });
    }

    // Insert report
    const { data, error } = await client
      .from('reports')
      .insert({
        post_id,
        reporter_id,
        reason,
        details: details || null
      })
      .select()
      .single();

    if (error) {
      console.error('[report] insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, report_id: data.id });
  } catch (err: any) {
    console.error('[report] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Get reports (admin only)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const accessToken = searchParams.get('access_token');

    const client = getClient(accessToken);

    // Verify admin access
    const { data: { user } } = await client.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch reports with post and reporter info
    const { data: reports, error } = await client
      .from('reports')
      .select(`
        *,
        post:posts (
          id,
          image_url,
          caption,
          category,
          media_type,
          user_id,
          users (
            username,
            avatar_url
          )
        ),
        reporter:users!reporter_id (
          username,
          avatar_url
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[report] fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports });
  } catch (err: any) {
    console.error('[report] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Update report status (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const { report_id, status, delete_post, access_token } = await req.json();

    if (!report_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validStatuses = ['pending', 'dismissed', 'actioned'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const client = getClient(access_token);

    // Verify admin access
    const { data: { user } } = await client.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the report to find the post
    const { data: report, error: fetchError } = await client
      .from('reports')
      .select('post_id')
      .eq('id', report_id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // If delete_post is true, delete the post
    if (delete_post && report.post_id) {
      const { error: deleteError } = await client
        .from('posts')
        .delete()
        .eq('id', report.post_id);

      if (deleteError) {
        console.error('[report] delete post error:', deleteError);
      }
    }

    // Update report status
    const { error: updateError } = await client
      .from('reports')
      .update({ status })
      .eq('id', report_id);

    if (updateError) {
      console.error('[report] update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[report] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
