
export type Language = 'en' | 'zh-TW';

export interface SiteConfig {
  title: string;
  description: string;
  language: Language;
}

export interface AIModel {
  id: string;
  name: string;
  apiKey: string;
  isDefault: boolean;
  isEnabled: boolean; // New field for toggling status
}

export enum AspectRatio {
  Portrait = '9:16',
  Landscape = '16:9',
}

export interface GenerationRequest {
  prompt: string;
  sourceImageBase64?: string;
  sourceImageMimeType?: string;
  aspectRatio: AspectRatio;
  model: AIModel;
}

export interface GenerationResult {
  imageUrl: string;
  timestamp: number;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  title: "AI Imager Studio",
  description: "Transform your ideas into reality with our advanced AI image engine.",
  language: 'en'
};

export const DEFAULT_MODEL: AIModel = {
  id: 'default-1',
  name: 'gemini-2.5-flash-image',
  apiKey: process.env.API_KEY || '',
  isDefault: true,
  isEnabled: true
};
