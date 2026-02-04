/**
 * Shared interfaces for all script parsers
 * All parsers (TV, film, comic) output this standardized structure
 */

/**
 * Represents a single line of dialogue within a panel
 */
export interface DialogueLine {
  character: string;
  text: string;
  type: 'spoken' | 'voiceover' | 'caption' | 'thought';
}

/**
 * Represents a single panel in a comic script
 */
export interface ParsedPanel {
  panelNumber: number;
  description: string; // The visual prompt/description text
  characters: string[]; // Array of character names appearing in this panel
  dialogue: DialogueLine[]; // Array of dialogue lines in this panel
  visualMarker?: string; // Optional visual marker (e.g., "SPLASH", "DOUBLE-PAGE SPREAD")
  artistNotes?: string; // Optional notes for the artist
}

/**
 * Represents a single page in a script
 */
export interface ParsedPage {
  pageNumber: number;
  panels: ParsedPanel[];
}

/**
 * Represents a character with their appearance count
 */
export interface CharacterCount {
  name: string;
  panelCount: number;
}

/**
 * Counts of different visual marker types detected in the script
 */
export interface VisualMarkers {
  [markerType: string]: number;
}

/**
 * Represents a parse error encountered during script parsing
 */
export interface ParseError {
  line?: number;
  page?: number;
  panel?: number;
  message: string;
}

/**
 * The complete result of parsing a script
 * This is the standardized output format for all parsers
 */
export interface ParseResult {
  pages: ParsedPage[];
  characters: CharacterCount[];
  visualMarkers: VisualMarkers;
  errors: ParseError[];
}