
import { SiteConfig, AIModel, DEFAULT_SITE_CONFIG, DEFAULT_MODEL } from '../types';

const KEYS = {
  SITE_CONFIG: 'ai_imager_config',
  MODELS: 'ai_imager_models',
  IS_ADMIN: 'ai_imager_is_admin'
};

export const getSiteConfig = (): SiteConfig => {
  const stored = localStorage.getItem(KEYS.SITE_CONFIG);
  if (stored) {
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_SITE_CONFIG, ...parsed };
  }
  return DEFAULT_SITE_CONFIG;
};

export const saveSiteConfig = (config: SiteConfig) => {
  localStorage.setItem(KEYS.SITE_CONFIG, JSON.stringify(config));
};

export const getModels = (): AIModel[] => {
  const stored = localStorage.getItem(KEYS.MODELS);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Migration: Ensure isEnabled exists for old data
    return parsed.map((m: any) => ({
      ...m,
      isEnabled: m.isEnabled !== undefined ? m.isEnabled : true
    }));
  }
  // If no models, return default wrapped in array
  return [DEFAULT_MODEL];
};

export const saveModels = (models: AIModel[]) => {
  localStorage.setItem(KEYS.MODELS, JSON.stringify(models));
};

export const getActiveModel = (): AIModel => {
  const models = getModels();
  // Return default model, fallback to first enabled model, fallback to first model
  return models.find(m => m.isDefault) || models.find(m => m.isEnabled) || models[0];
};

export const checkAdminAuth = (): boolean => {
  return localStorage.getItem(KEYS.IS_ADMIN) === 'true';
};

export const setAdminAuth = (isLoggedIn: boolean) => {
  if (isLoggedIn) {
    localStorage.setItem(KEYS.IS_ADMIN, 'true');
  } else {
    localStorage.removeItem(KEYS.IS_ADMIN);
  }
};
