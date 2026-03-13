import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
const ai = (API_KEY && API_KEY.trim() !== "" && API_KEY !== "undefined") ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Mock responses for when AI is not configured
const MOCK_CHAT_RESPONSES = [
  "I'm Daksh-AI, and I'm currently running in demo mode because the GEMINI_API_KEY is not set. Once configured, I can help you build your profile, find jobs, and answer labor-related questions!",
  "Namaste! In this demo mode, I can tell you that Daksh-Bharat is designed to help rural workers like you connect with verified employers. To enable my full AI capabilities, please add a Gemini API key.",
  "I'm here to help! Although my full brain is offline right now, you can still explore the job board and register your profile. We're here to empower the workforce of Bharat!"
];

export const getChatResponse = async (message: string, history: any[] = []) => {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
    
    if (!response.ok) throw new Error('AI Chat failed');
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Chat AI Error:", error);
    return "I'm sorry, I'm having trouble connecting to the AI right now. Please try again later.";
  }
};

export const searchJobsWithAI = async (message: string) => {
  try {
    const response = await fetch('/api/ai/search-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) throw new Error('AI Search failed');
    return await response.json();
  } catch (error) {
    console.error("AI Search Service Error:", error);
    throw error;
  }
};

export const getQuickAdvice = async (skill: string) => {
  if (!ai) {
    console.warn("AI service not initialized: GEMINI_API_KEY is missing. Using mock advice.");
    return "1. Keep your tools clean.\n2. Arrive on time.\n3. Be polite to employers.";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Give 3 quick tips for a ${skill} in rural India to increase their earnings. Keep it very short.`,
    });
    return response.text;
  } catch (error) {
    console.error("Quick AI Error:", error);
    return "1. Skill up regularly.\n2. Maintain good records.\n3. Network with other workers.";
  }
};

export const findNearbyPlaces = async (query: string, lat: number, lng: number) => {
  if (!ai) {
    console.warn("AI service not initialized: GEMINI_API_KEY is missing. Mocking place search.");
    return {
      text: "I found some places nearby in demo mode!",
      places: []
    };
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      }
    });
    return {
      text: response.text,
      places: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    return null;
  }
};
