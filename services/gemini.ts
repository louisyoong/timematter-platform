
import { GoogleGenAI } from "@google/genai";

// Fix: Initialize GoogleGenAI using the named parameter 'apiKey' and assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const askHelpAssistant = async (question: string) => {
  try {
    // Fix: Using the correct model name and direct property access as per guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an AI assistant for TimeMatter, a platform dedicated to the aging society (elderly people). 
      Provide a helpful, empathetic, and clear answer to this question: ${question}. 
      TimeMatter helps people find community events, health workshops, and social gatherings.`,
      config: {
        temperature: 1,
        topP: 0.95,
      }
    });
    // Fix: Access .text property directly (it is not a method).
    return response.text || "I'm sorry, I couldn't process that. Please try again or contact support.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Something went wrong with our AI assistant. Please contact us directly.";
  }
};
