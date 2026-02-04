import { AspectRatio } from '../types';

export const genId = () => Math.random().toString(36).substring(2, 9);

/**
 * Get default aspect ratio based on project type
 * - Comic / Graphic Novel → 3:4 (portrait orientation, typical for comic panels)
 * - Screenplay, TV Series, Stage Play → 16:9 (widescreen format)
 */
export const getDefaultAspectRatio = (projectType?: 'comic' | 'screenplay' | 'stage-play' | 'tv-series'): AspectRatio => {
    if (projectType === 'comic') {
        return AspectRatio.TALL; // 3:4 aspect ratio
    }
    // Default to 16:9 for screenplay, stage-play, tv-series, or undefined
    return AspectRatio.WIDE; // 16:9 aspect ratio
};
