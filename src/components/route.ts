import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { AI_PERSONAS, AIPersona, AIGeneratedCritique } from '@/lib/ai-personas';

// Initialize the Gemini SDK. 
// Ensure GEMINI_API_KEY is set in your .env.local file
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { persona, imageBase64, mimeType } = body;

    // 1. Validate inputs
    if (!persona || !AI_PERSONAS[persona as AIPersona]) {
      return NextResponse.json(
        { error: `Invalid or missing persona. Expected one of: ${Object.keys(AI_PERSONAS).join(', ')}` },
        { status: 400 }
      );
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Missing imageBase64 data in request body.' },
        { status: 400 }
      );
    }

    // Clean up base64 string if it was sent as a Data URI (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
    let cleanBase64 = imageBase64;
    let finalMimeType = mimeType || 'image/jpeg';
    if (imageBase64.startsWith('data:')) {
      const [prefix, data] = imageBase64.split(',');
      cleanBase64 = data;
      finalMimeType = prefix.split(':')[1].split(';')[0];
    }

    // Validate mime-type for supported images and video
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedMimeTypes.includes(finalMimeType.toLowerCase())) {
      return NextResponse.json(
        { error: `Unsupported media type: ${finalMimeType}. Please upload a valid image or video.` },
        { status: 400 }
      );
    }

    // 2. Define the exact JSON schema based on AIGeneratedCritique
    const responseSchema = {
      type: 'OBJECT',
      properties: {
        rating: { type: 'NUMBER' },
        viral_punchline: { type: 'STRING' },
        critique_body: { type: 'STRING' },
      },
      required: ['rating', 'viral_punchline', 'critique_body'],
    };

    // 3. Call the Gemini API with structured outputs
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // Using flash for speed/virality, upgrade to pro if needed
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
        // Optional: you can tweak temperature to increase/decrease the chaos
        temperature: 0.8,
      },
    });

    // 4. Parse the strictly enforced JSON response
    const critiqueText = response.text();
    const critiqueData: AIGeneratedCritique = JSON.parse(critiqueText);

    return NextResponse.json({ success: true, data: critiqueData });

  } catch (error: any) {
    console.error('Error generating AI critique:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}