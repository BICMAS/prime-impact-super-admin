import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateCourseTags = async (courseTitle: string, description: string): Promise<string[]> => {
  if (!apiKey) return ['AI-Offline', 'General'];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 5 relevant short tags for an LMS course titled "${courseTitle}" with description: "${description}". Return only the tags as a comma-separated list.`,
    });
    
    const text = response.text || '';
    return text.split(',').map(tag => tag.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    return ['Error-Generating-Tags'];
  }
};

export const analyzeSystemHealth = async (metrics: any): Promise<string> => {
  if (!apiKey) return "AI Insights unavailable without API Key.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze these LMS system metrics and provide a 2-sentence executive summary for the Super Admin. Focus on critical areas or success. Metrics: ${JSON.stringify(metrics)}`,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate insights at this time.";
  }
};

export const suggestLearningPathDescription = async (pathTitle: string, courseList: string[]): Promise<string> => {
  if (!apiKey) return "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a compelling, professional description (max 30 words) for a learning path titled "${pathTitle}" that contains these courses: ${courseList.join(', ')}.`,
    });
    return response.text || "";
  } catch (error) {
    return "";
  }
};
