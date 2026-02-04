/**
 * Shared type definitions for script parsers
 * All parsers (graphic novel, screenplay, etc.) output this standardized structure
 */

export interface DialogueLine {
  character: string;
  text: string;
  type: 'spoken' | 'voiceover' | 'caption' | 'thought';
}

export interface ParsedPanel {
  panelNumber: number;
  description: string; // The prompt text for image generation
  characters: string[]; // Array of character names in this panel
  dialogue: DialogueLine[]; // Array of dialogue lines
  visualMarker?: string; // Optional visual marker (e.g., 'close', 'wide', 'establishing')
  artistNotes?: string; // Optional notes for the artist
}

export interface ParsedPage {
  pageNumber: number;
  panels: ParsedPanel[];
}

export interface CharacterCount {
  name: string;
  panelCount: number; // Number of panels this character appears in
}

export interface VisualMarkers {
  [markerType: string]: number; // Count of each visual marker type detected
}

export interface ParseError {
  message: string;
  line?: number;
}

export interface ParseResult {
  pages: ParsedPage[];
  characters: CharacterCount[];
  visualMarkers: VisualMarkers;
  errors: ParseError[];
}