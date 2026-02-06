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
    description: string; // Legacy/simple description
    // Detailed appearance fields
    appearance?: {
        age?: string;
        gender?: string;
        ethnicity?: string;
        height?: string;
        build?: string;
        hairColor?: string;
        hairStyle?: string;
        eyeColor?: string;
        skinTone?: string;
        facialFeatures?: string;
        distinguishingMarks?: string;
        clothing?: string;
        accessories?: string;
        additionalNotes?: string;
        customStylePrompt?: string;
    };
}

export type TextElementType = 'dialogue' | 'thought' | 'caption' | 'phone';

export interface TextElement {
    id: string;
    type: TextElementType;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    color: string;
    backgroundColor?: string;
    tailDirection?: 'left' | 'right' | 'bottom' | 'none';
    rotation?: number;
    tailX?: number;
    tailY?: number;
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
    referencePanelId?: string;
    referenceStrength?: number;
    title?: string;
    promptHistory?: string[];
    // Freeform position on canvas
    x?: number;
    y?: number;
    width?: number;
    height?: number;
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
    scriptText?: string; // Original imported script for reference
}

export type ImageProvider = 'gemini' | 'leonardo' | 'grok' | 'fal' | 'seaart';

export interface Project {
    id: string;
    title: string;
    style: string;
    issueType: 'issue' | 'chapter';
    imageProvider: ImageProvider;
    projectType?: 'comic' | 'screenplay' | 'stage-play' | 'tv-series';
    geminiApiKey?: string;
    leonardoApiKey?: string;
    grokApiKey?: string;
    falApiKey?: string;
    seaartApiKey?: string;
    customStylePrompt?: string;
    fluxModel?: string;
    issues: Issue[];
    characters: Character[];
}

export interface AppState {
    projects: Project[];
    activeProjectId: string | null;
    activeIssueId: string | null;
    activePageId: string | null;
}

// History-aware state for undo/redo
export interface AppStateWithHistory {
    present: AppState;
    past: AppState[];
    future: AppState[];
}
