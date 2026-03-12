import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Service role key bypasses ALL RLS — never expose this to the browser
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function sanitizeHandle(raw: string) {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned.length >= 3 ? cleaned : `user_${Math.random().toString(36).slice(2, 8)}`;
}

async function generateUniqueUsername(
  baseRaw: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any
) {
  const base = sanitizeHandle(baseRaw).slice(0, 24);
  for (let i = 0; i < 50; i++) {
    const suffix = i === 0 ? '' : `_${i}`;
    const candidate = `${base}${suffix}`.slice(0, 30);
    const { data } = await adminClient
      .from('users')
      .select('id')
      .eq('username', candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `user_${Date.now().toString().slice(-8)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, email, avatar_url, access_token } = body as {
      user_id: string;
      email: string;
      avatar_url?: string | null;
      access_token?: string;
    };

    if (!user_id || !email) {
      return NextResponse.json({ error: 'Missing user_id or email' }, { status: 400 });
    }

    // Prefer service-role client (bypasses RLS).
    // If not configured, authenticate with the user's own JWT so RLS auth.uid() = id works.
    const adminClient = SERVICE_KEY
      ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
      : createClient(SUPABASE_URL, ANON_KEY, {
          auth: { persistSession: false },
          global: { headers: access_token ? { Authorization: `Bearer ${access_token}` } : {} },
        });

    // Check if profile already exists
    const { data: existing } = await adminClient
      .from('users')
      .select('username')
      .eq('id', user_id)
      .maybeSingle();

    if (existing?.username) {
      return NextResponse.json({ username: existing.username });
    }

    // Generate a unique username from the email handle
    const emailHandle = email.split('@')[0] || user_id.slice(0, 8);
    const username = await generateUniqueUsername(emailHandle, adminClient);

    const { error } = await adminClient.from('users').upsert(
      { id: user_id, email, username, avatar_url: avatar_url ?? null },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('[create-profile] upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ username });
  } catch (err: any) {
    console.error('[create-profile] unexpected error:', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
