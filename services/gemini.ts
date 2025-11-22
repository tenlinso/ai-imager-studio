import { GoogleGenAI } from "@google/genai";
import { GenerationRequest } from '../types';

export const generateImage = async (request: GenerationRequest): Promise<string> => {
  if (!request.model.apiKey) {
    throw new Error("API Key is missing. Please configure it in the Admin Panel.");
  }

  const ai = new GoogleGenAI({ apiKey: request.model.apiKey });
  
  const promptText = request.prompt || "Enhance this image";
  
  const parts: any[] = [
    { text: promptText }
  ];

  if (request.sourceImageBase64 && request.sourceImageMimeType) {
    parts.push({
      inlineData: {
        data: request.sourceImageBase64,
        mimeType: request.sourceImageMimeType
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: request.model.name,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: request.aspectRatio,
        }
      }
    });

    // Check for image parts in the response
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated in the response.");

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw new Error(error.message || "Failed to generate image");
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the Data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = error => reject(error);
  });
};