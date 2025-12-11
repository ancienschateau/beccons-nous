import { GoogleGenAI } from "@google/genai";
import { Coordinates } from '../types';

// Fallback a stringa vuota. 
// Gemini viene usato ORA SOLO per il messaggio di benvenuto.
const apiKey = process.env.API_KEY || ""; 
const ai = new GoogleGenAI({ apiKey });

// Cache in memoria
const cityCache: Record<string, Coordinates> = {};

/**
 * Uses OpenStreetMap (Nominatim) to find coordinates.
 * FREE service, no API Key required.
 * LIMIT: Max 1 request per second (handled in App.tsx loop).
 */
export const getCityCoordinates = async (city: string): Promise<Coordinates | null> => {
  const normalizedCity = city.toLowerCase().trim();
  
  // 1. Controllo cache
  if (cityCache[normalizedCity]) {
    return cityCache[normalizedCity];
  }

  try {
    // Usiamo Nominatim di OpenStreetMap
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`;
    
    const response = await fetch(url, {
        method: 'GET',
        // Headers opzionali ma consigliati per good practice verso OSM
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data && data.length > 0) {
      const result = { 
        lat: parseFloat(data[0].lat), 
        lng: parseFloat(data[0].lon) 
      };
      // 2. Salva in cache
      cityCache[normalizedCity] = result;
      return result;
    }
    
    return null;

  } catch (error) {
    console.error("Geocoding Error:", error);
    return null;
  }
};

/**
 * Generates a fun welcome message based on the city using Gemini.
 * This is low volume (only on new entry), so it won't hit quota limits easily.
 */
export const generateWelcomeMessage = async (city: string, name: string): Promise<string> => {
  if (!apiKey) return "Bienvenue à bord !";

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