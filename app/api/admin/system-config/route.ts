import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to securely verify the incoming token and check for admin privileges
async function verifyAdminAccess(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Verify the JWT token is valid
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { error: 'Invalid or expired session', status: 401 };
  }

  // 2. Fetch the user's role from the public schema
  const { data: userData, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleError || !userData || userData.role !== 'admin') {
    return { error: 'Forbidden: Standard accounts cannot access administrative endpoints.', status: 403 };
  }

  return { supabase, user };
}

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await verifyAdminAccess(req);
    if (adminCheck.error) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    // Fetch current system configuration
    const { data, error } = await adminCheck.supabase!
      .from('system_settings')
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await verifyAdminAccess(req);
    if (adminCheck.error) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await req.json();
    const payload = { ...body, updated_at: new Date().toISOString() };

    // Update singleton settings row (id = true)
    const { data, error } = await adminCheck.supabase!
      .from('system_settings')
      .update(payload)
      .eq('id', true)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}