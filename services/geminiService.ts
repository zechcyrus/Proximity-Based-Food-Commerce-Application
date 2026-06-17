
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function generateDishDescription(dishName: string, details: string = "Homemade"): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional food critic and marketing expert. Write a mouth-watering, appetizing description (max 2 sentences) for a homemade dish called "${dishName}". Context: ${details}. Focus on fresh ingredients, traditional methods, and authentic flavor.`,
    });
    return response.text?.trim() || "Delicious home-cooked meal prepared with fresh ingredients.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Freshly prepared meal from a local home cook.";
  }
}

export async function searchAddress(query: string, userLocation?: { latitude: number; longitude: number }): Promise<{ address: string; mapsUrl: string } | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find the most likely full address and Google Maps URL for: ${query}`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: userLocation ? {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            } : undefined
          }
        }
      },
    });

    // Extracting the first relevant chunk
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      const mapsChunk = chunks.find(c => c.maps);
      if (mapsChunk) {
        return {
          address: mapsChunk.maps.title || query,
          mapsUrl: mapsChunk.maps.uri
        };
      }
    }
    return { address: response.text?.trim() || query, mapsUrl: "" };
  } catch (error) {
    console.error("Address Search Error:", error);
    return null;
  }
}

export async function suggestCookBio(name: string, specialty: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a friendly and trustworthy 1-sentence bio for a home cook named ${name} who specializes in ${specialty}. Make them sound passionate and local.`,
    });
    return response.text?.trim() || `Local home cook passionate about ${specialty}.`;
  } catch (error) {
    return `Dedicated local chef sharing my love for ${specialty} with the neighborhood.`;
  }
}
