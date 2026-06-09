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
        rating: { type: 'NUMBER' },
        viral_punchline: { type: 'STRING' },
        critique_body: { type: 'STRING' },
      },
      required: ['rating', 'viral_punchline', 'critique_body'],
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
        systemInstruction: AI_PERSONAS[persona as AIPersona],
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

    let dbRecord = null;
    
    // Store into Database if a postId is provided
    if (postId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: rpcData, error: rpcError } = await supabase.rpc('insert_ai_critique', {
        p_post_id: postId,
        p_persona: persona,
        p_rating: critiqueData.rating,
        p_comment: critiqueData.critique_body
      });

      if (rpcError) console.error('Database Insertion Error:', rpcError);
      else dbRecord = rpcData;
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
