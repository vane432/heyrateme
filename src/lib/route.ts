import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateMediaSafety } from '@/lib/moderation';

// Helper to get a Supabase admin client that can bypass RLS for server actions
function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase URL or Service Role Key for admin actions.');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            userId,
            mediaBase64,
            mimeType,
            caption,
            category,
            mediaType,
            fileName,
            fileSizeBytes,
            durationSeconds,
            gender
        } = body;

        // 1. Run the server-side media moderation check first
        const isSafe = await validateMediaSafety(mediaBase64, mimeType);
        if (!isSafe) {
            return NextResponse.json(
                { success: false, error: 'Media moderation failed. The content may be inappropriate.' },
                { status: 400 }
            );
        }

        // 2. If safe, upload the file to Supabase Storage from the server
        const supabaseAdmin = getSupabaseAdmin();
        const buffer = Buffer.from(mediaBase64.split(',')[1], 'base64');
        const filePath = `${userId}/${Date.now()}-${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('posts')
            .upload(filePath, buffer, { contentType: mimeType });

        if (uploadError) {
            throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('posts')
            .getPublicUrl(filePath);

        // 3. Create the post record in the database
        const { data: post, error: postError } = await supabaseAdmin
            .from('posts')
            .insert({
                user_id: userId,
                image_url: publicUrl,
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