import { Project, AspectRatio, Character } from '../types';
import { ART_STYLES, ASPECT_CONFIGS } from '../constants';
import { generateImage as generateGeminiImage } from '../services/geminiService';
import { generateLeonardoImage } from '../services/leonardoService';
import { generateGrokImage } from '../services/grokService';
import { generateFluxImage as generateFalFlux } from '../services/falFluxService';
import { generateSeaArtImage } from '../services/seaartService';

/**
 * Helper to build a full appearance description for image generation
 */
function buildCharacterPrompt(char: Character): string {
  const parts: string[] = [char.name];
  
  if (char.appearance) {
    const a = char.appearance;
    const desc: string[] = [];
    
    if (a.age) desc.push(a.age);
    if (a.gender) desc.push(a.gender);
    if (a.ethnicity) desc.push(a.ethnicity);
    if (a.height) desc.push(a.height);
    if (a.build) desc.push(a.build);
    if (a.skinTone) desc.push(`${a.skinTone} skin`);
    if (a.hairColor && a.hairStyle) {
      desc.push(`${a.hairColor} ${a.hairStyle} hair`);
    } else if (a.hairColor) {
      desc.push(`${a.hairColor} hair`);
    } else if (a.hairStyle) {
      desc.push(`${a.hairStyle} hair`);
    }
    if (a.eyeColor) desc.push(`${a.eyeColor} eyes`);
    if (a.facialFeatures) desc.push(a.facialFeatures);
    if (a.distinguishingMarks) desc.push(a.distinguishingMarks);
    if (a.clothing) desc.push(`wearing ${a.clothing}`);
    if (a.accessories) desc.push(`with ${a.accessories}`);
    if (a.additionalNotes) desc.push(a.additionalNotes);
    
    if (desc.length > 0) {
      parts.push(`(${desc.join(', ')})`);
    }
  } else if (char.description) {
    parts.push(`(${char.description})`);
  }
  
  return parts.join(' ');
}

/**
 * Shared hook for image generation across all components
 * Handles all provider-specific logic and prompt building
 */
export function useImageGeneration(project: Project) {
  /**
   * Generate an image using the project's configured provider
   * @param prompt - The base prompt text
   * @param aspectRatio - The aspect ratio for the image
   * @param characters - Array of characters to include in the prompt
   * @param initImage - Optional reference image for consistency
   * @param referenceStrength - Strength of the reference image (0-1)
   * @returns The generated image URL or undefined
   */
  const generateImage = async (
    prompt: string,
    aspectRatio: AspectRatio,
    characters: Character[] = [],
    initImage?: string,
    referenceStrength: number = 0.7
  ): Promise<string | undefined> => {
    try {
      // Build style prompt
      const styleConfig = ART_STYLES.find(s => s.id === project.style);
      const stylePrompt = project.style === 'custom' 
        ? (project.customStylePrompt || '') 
        : (styleConfig?.prompt || '');
      
      // Build character section
      const charSection = characters.length > 0 
        ? `Characters: ${characters.map(c => buildCharacterPrompt(c)).join('; ')}.` 
        : '';
      
      // Get aspect ratio config
      const config = ASPECT_CONFIGS[aspectRatio];
      
      // Add consistency suffix if using reference image
      const consistencySuffix = initImage 
        ? " Maintain strong visual and character consistency with the reference image. Same lighting, angle, style."
        : '';
      
      // Build full prompt
      const fullPrompt = `${stylePrompt}. ${charSection} ${prompt}.${consistencySuffix}`.trim();
      
      // Call appropriate service based on provider
      let url: string | undefined;
      
      if (project.imageProvider === 'gemini' && project.geminiApiKey) {
        url = await generateGeminiImage(
          fullPrompt, 
          config.ratio, 
          project.geminiApiKey, 
          initImage, 
          referenceStrength
        );
      } else if (project.imageProvider === 'leonardo' && project.leonardoApiKey) {
        url = await generateLeonardoImage(
          fullPrompt, 
          aspectRatio, 
          project.leonardoApiKey, 
          initImage, 
          referenceStrength
        );
      } else if (project.imageProvider === 'grok' && project.grokApiKey) {
        url = await generateGrokImage(
          fullPrompt, 
          aspectRatio, 
          project.grokApiKey, 
          initImage, 
          referenceStrength
        );
      } else if (project.imageProvider === 'fal' && project.falApiKey) {
        url = await generateFalFlux(
          fullPrompt, 
          aspectRatio, 
          project.falApiKey, 
          project.fluxModel || 'fal-ai/flux-pro', 
          initImage, 
          referenceStrength
        );
      } else if (project.imageProvider === 'seaart' && project.seaartApiKey) {
        url = await generateSeaArtImage(
          fullPrompt, 
          aspectRatio, 
          project.seaartApiKey, 
          initImage, 
          referenceStrength
        );
      } else {
        throw new Error(`No API key configured for provider: ${project.imageProvider}`);
      }
      
      return url;
    } catch (error) {
      console.error('Image generation failed:', error);
      throw error;
    }
  };
  
  return { generateImage };
}
