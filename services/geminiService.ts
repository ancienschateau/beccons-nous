import { GoogleGenAI, Type } from "@google/genai";
import { Coordinates } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Semplice cache in memoria per evitare di chiedere 50 volte dov'è "Roma"
const cityCache: Record<string, Coordinates> = {};

/**
 * Uses Gemini to find the coordinates of a city.
 * We use Gemini instead of a standard geocoder to demonstrate API usage 
 * and handle loose inputs (e.g., "Roma, zona centro" or "Paris 14eme").
 */
export const getCityCoordinates = async (city: string): Promise<Coordinates | null> => {
  const normalizedCity = city.toLowerCase().trim();
  
  // 1. Controllo cache
  if (cityCache[normalizedCity]) {
    return cityCache[normalizedCity];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Identify the latitude and longitude for the city center of: "${city}". Return ONLY a JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
            found: { type: Type.BOOLEAN }
          },
          required: ["lat", "lng", "found"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    if (data.found && typeof data.lat === 'number' && typeof data.lng === 'number') {
      const result = { lat: data.lat, lng: data.lng };
      // 2. Salva in cache
      cityCache[normalizedCity] = result;
      return result;
    }
    return null;

  } catch (error) {
    console.error("Gemini Geocoding Error:", error);
    return null;
  }
};

/**
 * Generates a fun welcome message based on the city.
 */
export const generateWelcomeMessage = async (city: string, name: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a very short, witty welcome message in French for an alumni named ${name} who has just registered from ${city}. Use a tone that mixes French elegance with a slight Roman/Italian touch (as they are from Lycée Chateaubriand Rome). Keep it under 15 words.`,
    });
    return (response.text || "").trim();
  } catch (e) {
    return "Bienvenue à bord !";
  }
};