import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateMediaSafety } from '@/lib/moderation';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            userId,
            imageUrl,
            filePath,
            caption,
            category,
            mediaType,
            fileSizeBytes,
            durationSeconds,
            gender
        } = body;

        // 1. Fetch the uploaded file from Supabase Storage into server memory
        // This safely bypasses the Next.js 4MB HTTP request body limit!
        const fileRes = await fetch(imageUrl);
        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mediaBase64 = buffer.toString('base64');
        const mimeType = fileRes.headers.get('content-type') || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // 2. Run the server-side media moderation check
        const isSafe = await validateMediaSafety(mediaBase64, mimeType);
        if (!isSafe) {
            // Delete the unsafe file from storage immediately
            if (filePath) {
                await supabaseAdmin.storage.from('posts').remove([filePath]);
            }
            return NextResponse.json(
                { success: false, error: 'Media moderation failed. Content contains explicit or harmful material.' },
                { status: 400 }
            );
        }

        // 3. Create the post record in the database
        const { data: post, error: postError } = await supabaseAdmin
            .from('posts')
            .insert({
                user_id: userId,
                image_url: imageUrl,
                caption,
                category,
                media_type: mediaType,
                duration_seconds: durationSeconds || null,
                file_size_bytes: fileSizeBytes || null,
                gender: gender || null
            })
            .select()
            .single();

        if (postError) throw postError;

        return NextResponse.json({ success: true, data: post });

    } catch (error: any) {
        console.error('[API /posts/create] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}