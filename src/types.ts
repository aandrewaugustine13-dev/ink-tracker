
export enum AspectRatio {
    WIDE = 'wide',
    STD = 'std',
    SQUARE = 'square',
    TALL = 'tall',
    PORTRAIT = 'portrait'
}

export interface Character {
    id: string;
    name: string;
    description: string;
}

export type TextElementType = 'dialogue' | 'thought' | 'caption' | 'phone';

export interface TextElement {
    id: string;
    type: TextElementType;
    content: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    width: number; // percentage 0-100
    height: number; // percentage 0-100
    fontSize: number;
    color: string;
    backgroundColor?: string;
    tailDirection?: 'left' | 'right' | 'bottom' | 'none';
    // New properties for advanced bubbles
    rotation?: number; // degrees
    tailX?: number; // absolute % in panel
    tailY?: number; // absolute % in panel
    tailStyle?: 'pointy' | 'cloud' | 'none';
}

export interface Panel {
    id: string;
    prompt: string;
    imageUrl?: string;
    aspectRatio: AspectRatio;
    notes?: string;
    characterIds: string[];
    textElements: TextElement[];
    referencePanelId?: string;          // ID of another panel whose image to use as img2img init
    referenceStrength?: number;         // 0–1, how strongly to follow the reference
}

export interface Page {
    id: string;
    number: number;
    panels: Panel[];
}

export interface Issue {
    id: string;
    title: string;
    pages: Page[];
}

export type ImageProvider = 'gemini' | 'fal-flux' | 'replicate-flux';

export interface Project {
    id: string;
    title: string;
    style: string;
    issueType: 'issue' | 'chapter';
    imageProvider: ImageProvider;
    togetherApiKey?: string; // Legacy
    falApiKey?: string;
    replicateApiKey?: string;
    replicateModel?: string; // version hash
    fluxModel?: string; // used for fal-ai/flux-pro
    issues: Issue[];
    characters: Character[];
}

export interface AppState {
    projects: Project[];
    activeProjectId: string | null;
    activeIssueId: string | null;
    activePageId: string | null;
}
