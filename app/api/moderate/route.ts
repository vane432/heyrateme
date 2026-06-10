import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateMediaSafety } from '@/lib/moderation';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, mediaType } = await req.json();

    // Fetch file into memory
    const fileRes = await fetch(imageUrl);
    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mediaBase64 = buffer.toString('base64');
    const mimeType = fileRes.headers.get('content-type') || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');

    // Moderate
    const isSafe = await validateMediaSafety(mediaBase64, mimeType);

    if (!isSafe) {
      // Clean up the unsafe file from storage
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

      const filePath = imageUrl.split('/posts/')[1];
      if (filePath) {
        await supabaseAdmin.storage.from('posts').remove([filePath]);
      }

      return NextResponse.json(
        { success: false, error: 'Media moderation failed. Content contains explicit or harmful material.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}