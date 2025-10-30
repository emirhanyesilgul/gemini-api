import { GoogleGenAI, Modality } from "@google/genai";

interface GeneratedImage {
    base64Data: string;
    mimeType: string;
}

export const generateImage = async (prompt: string): Promise<GeneratedImage> => {
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const descriptivePrompt = `A simple, artistic, high-quality, professional product photograph representing the concept of '${prompt}'. The background should be a clean, solid light gray (#f3f4f6). No text or logos.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: descriptivePrompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return {
                base64Data: part.inlineData.data,
                mimeType: part.inlineData.mimeType || 'image/jpeg',
            };
        }
    }
    
    throw new Error("No image was generated.");

  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
