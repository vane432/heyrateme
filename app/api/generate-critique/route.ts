import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { AI_PERSONAS, AIPersona, AIGeneratedCritique } from '@/lib/ai-personas';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Server missing GEMINI_API_KEY environment variable.');
      return NextResponse.json(
        { success: false, error: 'Server Configuration Error: Missing API Key' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const body = await req.json();
    const { persona, imageBase64, mimeType, postId } = body;

    if (!persona || !AI_PERSONAS[persona as AIPersona]) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing persona selection.' },
        { status: 400 }
      );
    }

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Missing media data.' },
        { status: 400 }
      );
    }

    // --- SYSTEM SETTINGS CHECK ---
    // Connect to Supabase early to fetch our live admin configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: systemSettings } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', true)
      .single();

    if (systemSettings && systemSettings.is_ai_enabled === false) {
      return NextResponse.json(
        { success: false, error: 'AI critic features are currently disabled by the administrator.' },
        { status: 403 }
      );
    }

    let activeInstruction = AI_PERSONAS[persona as AIPersona];
    if (systemSettings) {
      if (persona === 'vance' && systemSettings.vance_prompt) {
        activeInstruction += `\n\nADDITIONAL ADMIN INSTRUCTIONS:\n${systemSettings.vance_prompt}`;
      }
      if (persona === 'kiki' && systemSettings.kiki_prompt) {
        activeInstruction += `\n\nADDITIONAL ADMIN INSTRUCTIONS:\n${systemSettings.kiki_prompt}`;
      }
      if (persona === 'oracle' && systemSettings.oracle_prompt) {
        activeInstruction += `\n\nADDITIONAL ADMIN INSTRUCTIONS:\n${systemSettings.oracle_prompt}`;
      }
    }
    // --- END SYSTEM SETTINGS CHECK ---

    if (imageBase64.length > 21000000) {
      return NextResponse.json(
        { success: false, error: 'Media file payload size is too large for AI review.' },
        { status: 400 }
      );
    }

    let cleanBase64 = imageBase64;
    let finalMimeType = mimeType || 'image/jpeg';
    if (imageBase64.startsWith('data:')) {
      const [prefix, data] = imageBase64.split(',');
      cleanBase64 = data;
      finalMimeType = prefix.split(':')[1].split(';')[0];
    }

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        style: { type: 'NUMBER' },
        fit: { type: 'NUMBER' },
        color_harmony: { type: 'NUMBER' },
        occasion_match: { type: 'NUMBER' },
        viral_punchline: { type: 'STRING' },
        critique_body: { type: 'STRING' },
      },
      required: ['style', 'fit', 'color_harmony', 'occasion_match', 'viral_punchline', 'critique_body'],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Analyze this outfit from the provided photo or video asset and deliver your critique based on the user's styling." },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: finalMimeType,
              },
            },
          ],
        },
      ],
      config: {
        systemInstruction: activeInstruction,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.8,
      },
    });

    const critiqueText = response.text;
    
    if (!critiqueText) {
      return NextResponse.json(
        { success: false, error: 'AI generated an empty response asset.' },
        { status: 500 }
      );
    }

    const critiqueData: AIGeneratedCritique = JSON.parse(critiqueText);
    
    // Enforce comment length constraint to prevent database violations
    let safeComment = critiqueData.critique_body.trim();
    if (safeComment.length > 500) {
      safeComment = safeComment.substring(0, 497) + '...';
    }

    let dbRecord = null;
    
    if (postId) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('insert_ai_critique', {
        p_post_id: postId,
        p_persona: persona,
        p_style: critiqueData.style,
        p_fit: critiqueData.fit,
        p_color: critiqueData.color_harmony,
        p_occasion: critiqueData.occasion_match,
        p_comment: safeComment
      });

      if (rpcError) throw new Error('Database Insertion Error: ' + rpcError.message);
      dbRecord = rpcData;
    }

    return NextResponse.json({ success: true, data: critiqueData, record: dbRecord });

  } catch (error: any) {
    console.error('Error generating AI critique:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
