import { GoogleGenAI } from '@google/genai';

/**
 * Server-side media moderation utility using Gemini 2.5 Flash.
 * Analyzes image or video base64 payloads to block explicit, adult, or harmful content.
 * 
 * @param base64Data The raw base64 string of the media asset.
 * @param mimeType The file mime type (e.g., 'image/jpeg', 'video/mp4').
 * @returns {Promise<boolean>} True if safe ('APPROVED'), False if blocked or errored.
 */
export async function validateMediaSafety(base64Data: string, mimeType: string): Promise<boolean> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Server missing GEMINI_API_KEY environment variable for moderation.');
      return false; // Fail securely if no API key is configured
    }

    const ai = new GoogleGenAI({ apiKey });

    // Clean up base64 string if it was passed as a full Data URI
    let cleanBase64 = base64Data;
    if (base64Data.startsWith('data:')) {
      cleanBase64 = base64Data.split(',')[1];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "You are an automated content safety moderator. Analyze the provided image or video asset. If it contains sexually explicit content, nudity, violence, or extreme gore, output exactly 'BLOCKED'. If the media is safe for a general audience, output exactly 'APPROVED'." },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.0, // Strict, non-creative logical interpretation
      },
    });

    return response.text?.includes('APPROVED') ?? false;
  } catch (error) {
    console.error('Safety validation execution failed or hit SDK safety bounds:', error);
    // Fail closed: If the SDK throws an error (e.g., native safety tripwire), block the upload.
    return false;
  }
}