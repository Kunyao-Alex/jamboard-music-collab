import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize the client. 
// Note: In a production app, you should proxy requests or ensure the key is safe.
const ai = new GoogleGenAI({ apiKey });

/**
 * Analyzes an audio blob to generate tags and a short description.
 */
export const analyzeAudioClip = async (audioBlob: Blob): Promise<{ tags: string[]; description: string }> => {
  if (!apiKey) {
    console.warn("No API Key found for Gemini analysis.");
    return { tags: ['no-api-key'], description: "API Key missing. Cannot analyze." };
  }

  try {
    // Convert Blob to Base64
    const base64Data = await blobToBase64(audioBlob);

    // 'gemini-2.5-flash-native-audio-preview-09-2025' is for Live API (WebSockets).
    // Use 'gemini-2.0-flash-exp' for generateContent (REST) with audio.
    const model = 'gemini-2.0-flash-exp'; 

    const prompt = `
      Listen to this short musical idea. 
      1. Provide a very brief 1-sentence description of the musical vibe, instruments, and rhythm.
      2. Suggest 3-5 short, relevant tags (e.g., "Funky", "Bass Riff", "Lo-fi", "Upbeat").
      
      Return the response in JSON format with keys: "description" and "tags".
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type || 'audio/webm',
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text);
    return {
      tags: result.tags || [],
      description: result.description || "Analysis complete."
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { tags: [], description: "Failed to analyze audio." };
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};