/**
 * Shared parser types for all script format parsers.
 * All parsers (comic, screenplay, stage play, TV series) output this same structure
 * so the rest of the app doesn't need to change based on format.
 */

/**
 * Dialogue line within a panel/shot/beat
 */
export interface DialogueLine {
    character: string;
    text: string;
    type: 'spoken' | 'voiceover' | 'caption' | 'thought';
}

/**
 * Character with appearance count
 */
export interface CharacterCount {
    name: string;
    panelCount: number;
}

/**
 * Parse error information
 */
export interface ParseError {
    message: string;
    line?: number;
}

/**
 * Visual marker counts
 */
export type VisualMarkers = Record<string, number>;

/**
 * A parsed panel/shot/beat within a page/scene
 */
export interface ParsedPanel {
    panelNumber: number;
    description: string;
    characters: string[];
    dialogue: DialogueLine[];
    visualMarker?: string;
    artistNotes?: string;
    // Screenplay/TV specific
    shotType?: string;
    // Stage play specific
    blockingNotes?: string;
}

/**
 * A parsed page/scene
 */
export interface ParsedPage {
    pageNumber: number;
    panels: ParsedPanel[];
    // Screenplay specific
    location?: string;
    timeOfDay?: string;
    sceneHeading?: string;
    // Stage play specific
    actNumber?: string;
}

/**
 * The result of parsing any script format
 */
export interface ParseResult {
    pages: ParsedPage[];
    characters: CharacterCount[];
    visualMarkers: VisualMarkers;
    errors: ParseError[];
}
