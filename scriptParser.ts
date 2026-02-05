import { AspectRatio } from '../types';
import {
  ParseResult as SharedParseResult,
  ParsedPage as SharedParsedPage,
  ParsedPanel as SharedParsedPanel,
  DialogueLine,
  CharacterCount,
  VisualMarkers,
  ParseError
} from './parserTypes';

// Export legacy types for backward compatibility with existing components
export type VisualMarker = 'standard' | 'echo' | 'hitch' | 'overflow' | 'shattered' | 'split' | 'splash' | 'inset' | 'large' | 'full-width';

export interface ParsedBubble {
    type: 'dialogue' | 'caption' | 'thought' | 'sfx' | 'screen-text' | 'phone';
    text: string;
    character?: string;
    modifier?: string;
}

export interface ParsedPanel {
    panelNumber: number;
    description: string;
    bubbles: ParsedBubble[];
    artistNotes: string[];
    visualMarker: VisualMarker;
    aspectRatio: AspectRatio;
    panelModifier?: string;
}

export interface ParsedPage {
    pageNumber: number;
    panels: ParsedPanel[];
    pageNotes?: string;
}

export interface ParsedCharacter {
    name: string;
    description?: string;
    lineCount: number;
    firstAppearance?: string;
}

export interface ParsedIssue {
    title: string;
    issueNumber?: number;
    subtitle?: string;
    writer?: string;
    pageCount?: number;
    timeline?: string;
    artistNotes?: string;
}

// Legacy ParseResult for backward compatibility
export interface ParseResult {
    success: boolean;
    issue?: ParsedIssue;
    pages: ParsedPage[];
    characters: ParsedCharacter[];
    errors: string[];
    warnings: string[];
}

// Word to number mapping (extended)
const WORD_TO_NUM: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'twenty-one': 21, 'twentyone': 21, 'twenty one': 21,
    'twenty-two': 22, 'twentytwo': 22, 'twenty two': 22,
    'twenty-three': 23, 'twentythree': 23, 'twenty three': 23,
    'twenty-four': 24, 'twentyfour': 24, 'twenty four': 24,
    'twenty-five': 25, 'twentyfive': 25, 'twenty five': 25,
    'twenty-six': 26, 'twentysix': 26, 'twenty six': 26,
    'twenty-seven': 27, 'twentyseven': 27, 'twenty seven': 27,
    'twenty-eight': 28, 'twentyeight': 28, 'twenty eight': 28,
};

function parsePageNumber(str: string): number {
    const cleaned = str.toLowerCase().trim().replace(/[-\s]+/g, '');
    for (const [word, num] of Object.entries(WORD_TO_NUM)) {
        if (cleaned === word.replace(/[-\s]+/g, '')) return num;
    }
    const num = parseInt(str, 10);
    return isNaN(num) ? 0 : num;
}

// ============= PATTERN DEFINITIONS =============

const PAGE_PATTERNS = [
    /^#{1,3}\s*PAGE\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|TWENTY[- ]?ONE|TWENTY[- ]?TWO|TWENTY[- ]?THREE|TWENTY[- ]?FOUR|TWENTY[- ]?FIVE|TWENTY[- ]?SIX|TWENTY[- ]?SEVEN|TWENTY[- ]?EIGHT|\d+)/i,
    /^\*\*PAGE\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|TWENTY[- ]?ONE|TWENTY[- ]?TWO|TWENTY[- ]?THREE|TWENTY[- ]?FOUR|TWENTY[- ]?FIVE|TWENTY[- ]?SIX|TWENTY[- ]?SEVEN|TWENTY[- ]?EIGHT|\d+)\*\*/i,
    /^(?:PAGE|PG)\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|TWENTY[- ]?ONE|TWENTY[- ]?TWO|TWENTY[- ]?THREE|TWENTY[- ]?FOUR|TWENTY[- ]?FIVE|TWENTY[- ]?SIX|TWENTY[- ]?SEVEN|TWENTY[- ]?EIGHT|\d+)/i,
    /^PAGE\s+\w+/i, // Fallback pattern to catch any 'PAGE' followed by text
];

const PANEL_PATTERNS = [
    /^\*\*Panel\s+(\d+)(?:\s*\(([^)]+)\))?\*\*\s*(.*)/i,
    /^\*\*Panel\s+(\d+)\*\*(?:\s*\(([^)]+)\))?\s*(.*)/i,
    /^Panel\s+(\d+)(?:\s*[\[\(]([^\]\)]+)[\]\)])?\s*(.*)/i,
    /^(?:PANEL|P|FRAME|FR|BLOCK)\s*(\d+)\s*(?:\[([^\]]+)]|\(([^)]+)\))?(?:\s*[:\-\.])?\s*(.*)/i,
];
const NUMERIC_PANEL_START = /^(\d+)\.\s*(.*)/;

const BLOCKQUOTE_DIALOGUE = /^>\s*(?:\*\*)?([A-Z][A-Z0-9\s\-'%.]{0,30})(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\s*(?:\*\*)?\s*[:\-]\s*(.+)$/;
const BOLD_DIALOGUE = /^\*\*([A-Z][A-Z0-9\s\-'%.]{0,30})(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\s*[:\-]\*\*\s*(.+)$/;
const BOLD_DIALOGUE_ALT = /^\*\*([A-Z][A-Z0-9\s\-'%.]{0,30})(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\*\*\s*[:\-]\s*(.+)$/;
const STANDARD_DIALOGUE = /^([A-Z][A-Z0-9\s\-'%.]{1,25})(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\s*[:\-\—]\s*(.+)$/;

const BLOCKQUOTE_CAPTION = /^>\s*(?:\*\*)?CAPTION(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\s*(?:\*\*)?\s*[:\-]\s*(.+)$/i;
const BOLD_CAPTION = /^\*\*CAPTION(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\s*[:\-]\*\*\s*(.+)$/i;

const BLOCKQUOTE_SFX = /^>\s*(?:\*\*)?SFX\s*(?:\*\*)?\s*[:\-]\s*(.+)$/i;
const BOLD_SFX = /^\*\*SFX\s*[:\-]\*\*\s*(.+)$/i;
const INLINE_SFX = /^SFX\s*[:\-]\s*(.+)$/i;

const SCREEN_TEXT = /^>\s*(?:\*\*)?(?:ON\s+SCREEN|ON\s+WALL|ON\s+BOARD|LABEL|ON\s+PHONE|ON\s+TV|READOUT|DRONE\s+SCREEN|DRONE\s+FEED)(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\s*(?:\*\*)?\s*[:\-]\s*(.+)$/i;

const THOUGHT_MODIFIERS = ['thought', 'thought caption', 'thinking', 'inner', 'v.o.', 'vo', 'internal'];

const ARTIST_NOTE_PATTERNS = [
    /^\*\(([^)]+)\)\*$/,
    /^\(([^)]+)\)$/,  
    /^(?:Artist\s*note|NOTE|PROMPT|REF)\s*[:\-]\s*(.+)$/i,
];

const ISSUE_HEADER = /^#\s+(.+)$/;
const ISSUE_NUMBER = /^##\s+Issue\s+#?(\d+)(?:\s*[:\-]\s*\