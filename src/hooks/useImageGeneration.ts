// src/hooks/useImageGeneration.ts
import { Project, AspectRatio, Character } from '../types';
import { ART_STYLES, ASPECT_CONFIGS } from '../constants';
import { getImage, saveImage } from '../services/imageStorage';
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
 * Hook for generating images with various providers
 */
export const useImageGeneration = (project: Project) => {
    /**
     * Generate an image using the project's configured provider
     * @param prompt - The text prompt for image generation
     * @param aspectRatio - The desired aspect ratio
     * @param characterDescriptions - Array of characters to include in the prompt
     * @param initImage - Optional reference image (as base64 data URL)
     * @param referenceStrength - Strength of reference image influence (0-1)
     * @returns The URL of the generated image
     */
    const generateImage = async (
        prompt: string,
        aspectRatio: AspectRatio,
        characterDescriptions: Character[] = [],
        initImage?: string,
        referenceStrength: number = 0.7
    ): Promise<string | undefined> => {
        // Build full prompt with style and characters
        const styleConfig = ART_STYLES.find(s => s.id === project.style);
        const stylePrompt = project.style === 'custom' 
            ? (project.customStylePrompt || '') 
            : (styleConfig?.prompt || '');
        
        const charSection = characterDescriptions.length > 0 
            ? `Characters: ${characterDescriptions.map(c => buildCharacterPrompt(c)).join('; ')}.` 
            : '';
        
        const config = ASPECT_CONFIGS[aspectRatio];
        
        const consistencySuffix = initImage 
            ? " Maintain strong visual and character consistency with the reference image. Same lighting, angle, style."
            : '';
        
        const fullPrompt = `${stylePrompt}. ${charSection} ${prompt}.${consistencySuffix}`.trim();
        
        let url: string | undefined;
        
        // Call the appropriate service based on provider
        if (project.imageProvider === 'gemini' && project.geminiApiKey) {
            url = await generateGeminiImage(fullPrompt, config.ratio, project.geminiApiKey, initImage, referenceStrength);
        } else if (project.imageProvider === 'leonardo' && project.leonardoApiKey) {
            url = await generateLeonardoImage(fullPrompt, aspectRatio, project.leonardoApiKey, initImage, referenceStrength);
        } else if (project.imageProvider === 'grok' && project.grokApiKey) {
            url = await generateGrokImage(fullPrompt, aspectRatio, project.grokApiKey, initImage, referenceStrength);
        } else if (project.imageProvider === 'fal' && project.falApiKey) {
            url = await generateFalFlux(fullPrompt, aspectRatio, project.falApiKey, project.fluxModel || 'fal-ai/flux-pro', initImage, referenceStrength);
        } else if (project.imageProvider === 'seaart' && project.seaartApiKey) {
            url = await generateSeaArtImage(fullPrompt, aspectRatio, project.seaartApiKey, initImage, referenceStrength);
        } else {
            throw new Error(`No API key configured for ${project.imageProvider}. Please add your API key in the sidebar.`);
        }
        
        return url;
    };
    
    return { generateImage };
};
