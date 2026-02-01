import { AspectRatio } from '../types';

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
    panelModifier?: string; // e.g., "Split Panel", "Large", "micro-flash inset"
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

// Page patterns - supports multiple formats
// "### PAGE ONE (5 Panels)", "**PAGE ONE**", "PAGE 1", "PAGE ONE"
const PAGE_PATTERNS = [
    /^#{1,3}\s*PAGE\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|TWENTY[- ]?ONE|TWENTY[- ]?TWO|TWENTY[- ]?THREE|TWENTY[- ]?FOUR|TWENTY[- ]?FIVE|TWENTY[- ]?SIX|TWENTY[- ]?SEVEN|TWENTY[- ]?EIGHT|\d+)(?:\s*\([^)]*\))?/i,
    /^\*\*PAGE\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|TWENTY[- ]?ONE|TWENTY[- ]?TWO|TWENTY[- ]?THREE|TWENTY[- ]?FOUR|TWENTY[- ]?FIVE|TWENTY[- ]?SIX|TWENTY[- ]?SEVEN|TWENTY[- ]?EIGHT|\d+)\*\*/i,
    /^(?:PAGE|PG)\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|TWENTY[- ]?ONE|TWENTY[- ]?TWO|TWENTY[- ]?THREE|TWENTY[- ]?FOUR|TWENTY[- ]?FIVE|TWENTY[- ]?SIX|TWENTY[- ]?SEVEN|TWENTY[- ]?EIGHT|\d+)(?:\s*[:\-\.])?/i,
];

// Panel patterns - supports multiple formats
// "**Panel 1**", "**Panel 1 (Split Panel)**", "Panel 1", "**Panel 1 (Large)**"
const PANEL_PATTERNS = [
    /^\*\*Panel\s+(\d+)(?:\s*\(([^)]+)\))?\*\*\s*(.*)/i,
    /^\*\*Panel\s+(\d+)\*\*(?:\s*\(([^)]+)\))?\s*(.*)/i,
    /^Panel\s+(\d+)(?:\s*[\[\(]([^\]\)]+)[\]\)])?\s*(.*)/i,
    /^(?:PANEL|P|FRAME|FR|BLOCK)\s*(\d+)\s*(?:\[([^\]]+)\]|\(([^)]+)\))?(?:\s*[:\-\.])?\s*(.*)/i,
];
const NUMERIC_PANEL_START = /^(\d+)\.\s*(.*)/;

// Dialogue patterns - multiple formats
// "> CHARACTER: text", "**CHARACTER:** text", "**CHARACTER (modifier):** text", "> **CHARACTER:** text"
const BLOCKQUOTE_DIALOGUE = /^>\s*(?:\*\*)?([A-Z][A-Z0-9\s\-'\.]{0,30})(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\s*(?:\*\*)?\s*[:\-]\s*(.+)$/;
const BOLD_DIALOGUE = /^\*\*([A-Z][A-Z0-9\s\-'\.]{0,30})(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\s*[:\-]\*\*\s*(.+)$/;
const BOLD_DIALOGUE_ALT = /^\*\*([A-Z][A-Z0-9\s\-'\.]{0,30})(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\*\*\s*[:\-]\s*(.+)$/;
const STANDARD_DIALOGUE = /^([A-Z][A-Z0-9\s\-'\.]{1,25})(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\s*[:\-\—]\s*(.+)$/;

// Caption patterns
// "> CAPTION: text", "**CAPTION:** text"
const BLOCKQUOTE_CAPTION = /^>\s*(?:\*\*)?CAPTION(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\s*(?:\*\*)?\s*[:\-]\s*(.+)$/i;
const BOLD_CAPTION = /^\*\*CAPTION(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\s*[:\-]\*\*\s*(.+)$/i;

// SFX patterns
// "> SFX: text", "**SFX:** text"
const BLOCKQUOTE_SFX = /^>\s*(?:\*\*)?SFX\s*(?:\*\*)?\s*[:\-]\s*(.+)$/i;
const BOLD_SFX = /^\*\*SFX\s*[:\-]\*\*\s*(.+)$/i;
const INLINE_SFX = /^SFX\s*[:\-]\s*(.+)$/i;

// Screen/Wall/Label text patterns
// "> ON SCREEN: text", "> ON WALL: text", "> LABEL: text", "> ON PHONE: text"
const SCREEN_TEXT = /^>\s*(?:\*\*)?(?:ON\s+SCREEN|ON\s+WALL|ON\s+BOARD|LABEL|ON\s+PHONE|ON\s+TV|READOUT|DRONE\s+SCREEN|DRONE\s+FEED)(?:\s*[\(\[<]([^\)\]>]+)[\)\]>])?\s*(?:\*\*)?\s*[:\-]\s*(.+)$/i;

// Thought caption pattern
const THOUGHT_MODIFIERS = ['thought', 'thought caption', 'thinking', 'inner', 'v.o.', 'vo', 'internal'];

// Artist notes patterns
const ARTIST_NOTE_PATTERNS = [
    /^\*\(([^)]+)\)\*$/,  // *(ARTIST NOTE: ...)*
    /^\(([^)]+)\)$/,      // (ARTIST NOTE: ...)
    /^(?:Artist\s*note|NOTE|PROMPT|REF)\s*[:\-]\s*(.+)$/i,
];

// Issue/Act header patterns
const ISSUE_HEADER = /^#\s+(.+)$/;
const ISSUE_NUMBER = /^##\s+Issue\s+#?(\d+)(?:\s*[:\-]\s*["']?(.+?)["']?)?$/i;
const ACT_HEADER = /^##\s+(?:ACT\s+)?([IVXLCDM]+|[A-Z]+(?:\s+[IVXLCDM]+)?)\s*[:\-]?\s*(.*)$/i;
const COLD_OPEN = /^##\s+COLD\s+OPEN\s*[:\-]?\s*(.*)$/i;

// Cast of characters section
const CAST_HEADER = /^###\s+CAST\s+OF\s+CHARACTERS/i;
const CHARACTER_DEFINITION = /^\*\*([A-Z][A-Z\s\-'\.]+)\*\*\s+(.+)$/;

// Timeline caption
const TIMELINE_CAPTION = /^>\s*CAPTION:\s*(.+)$/i;

// Inset/flash patterns
const INSET_PATTERN = /(?:inset|micro-flash|flash|intercut)/i;

function detectVisualMarker(text: string, modifiers: string): VisualMarker {
    const combined = `${text} ${modifiers}`.toLowerCase();
    if (combined.includes('micro-flash') || combined.includes('inset')) return 'inset';
    if (combined.includes('echo') || combined.includes('shatter') || combined.includes('fracture')) return 'echo';
    if (combined.includes('hitch') || combined.includes('stutter') || combined.includes('smear')) return 'hitch';
    if (combined.includes('overflow') || combined.includes('bruise') || combined.includes('lattice')) return 'overflow';
    if (combined.includes('split')) return 'split';
    if (combined.includes('splash') || combined.includes('full-page') || combined.includes('full page')) return 'splash';
    if (combined.includes('shattered') || combined.includes('fragments')) return 'shattered';
    if (combined.includes('large') || combined.includes('larger')) return 'large';
    if (combined.includes('full-width') || combined.includes('full width')) return 'full-width';
    return 'standard';
}

function detectAspectRatio(description: string, modifier: string = ''): AspectRatio {
    const combined = `${description} ${modifier}`.toLowerCase();
    if (combined.includes('wide') || combined.includes('landscape') || combined.includes('double') || combined.includes('establishing') || combined.includes('panoramic') || combined.includes('16:9') || combined.includes('exterior') || combined.includes('full-width')) return AspectRatio.WIDE;
    if (combined.includes('tall') || combined.includes('vertical') || combined.includes('9:16') || combined.includes('portrait')) return AspectRatio.PORTRAIT;
    if (combined.includes('close') || combined.includes('face') || combined.includes('tight') || combined.includes('4:3') || combined.includes('standard')) return AspectRatio.STD;
    if (combined.includes('square') || combined.includes('1:1')) return AspectRatio.SQUARE;
    if (combined.includes('large panel') || combined.includes('splash')) return AspectRatio.WIDE;
    return AspectRatio.WIDE;
}

function isThoughtModifier(modifier: string): boolean {
    const lower = (modifier || '').toLowerCase();
    return THOUGHT_MODIFIERS.some(m => lower.includes(m));
}

function isPhoneModifier(modifier: string): boolean {
    const lower = (modifier || '').toLowerCase();
    return lower.includes('phone') || lower.includes('text') || lower.includes('comms') || lower.includes('radio');
}

function cleanDialogueText(text: string): string {
    // Remove trailing markdown formatting
    return text.replace(/\*+$/, '').trim();
}

function extractCharacterFromLine(line: string): { character: string; modifier: string; text: string; type: 'dialogue' | 'thought' | 'phone' } | null {
    // Try blockquote dialogue: > CHARACTER: text or > **CHARACTER:** text
    let match = line.match(BLOCKQUOTE_DIALOGUE);
    if (match) {
        const [, char, mod, txt] = match;
        const type = isThoughtModifier(mod || '') ? 'thought' : isPhoneModifier(mod || '') ? 'phone' : 'dialogue';
        return { character: char.trim().toUpperCase(), modifier: mod || '', text: cleanDialogueText(txt), type };
    }

    // Try bold dialogue: **CHARACTER:** text or **CHARACTER (mod):** text
    match = line.match(BOLD_DIALOGUE);
    if (match) {
        const [, char, mod, txt] = match;
        const type = isThoughtModifier(mod || '') ? 'thought' : isPhoneModifier(mod || '') ? 'phone' : 'dialogue';
        return { character: char.trim().toUpperCase(), modifier: mod || '', text: cleanDialogueText(txt), type };
    }

    // Try bold dialogue alt: **CHARACTER** text or **CHARACTER (mod)**: text
    match = line.match(BOLD_DIALOGUE_ALT);
    if (match) {
        const [, char, mod, txt] = match;
        const type = isThoughtModifier(mod || '') ? 'thought' : isPhoneModifier(mod || '') ? 'phone' : 'dialogue';
        return { character: char.trim().toUpperCase(), modifier: mod || '', text: cleanDialogueText(txt), type };
    }

    // Try standard dialogue: CHARACTER: text
    match = line.match(STANDARD_DIALOGUE);
    if (match) {
        const [, char, mod, txt] = match;
        // Skip if it looks like a section header
        if (['CAPTION', 'SFX', 'ON SCREEN', 'ON WALL', 'LABEL', 'NOTE', 'ARTIST'].some(k => char.toUpperCase().includes(k))) {
            return null;
        }
        const type = isThoughtModifier(mod || '') ? 'thought' : isPhoneModifier(mod || '') ? 'phone' : 'dialogue';
        return { character: char.trim().toUpperCase(), modifier: mod || '', text: cleanDialogueText(txt), type };
    }

    return null;
}

function extractCaption(line: string): string | null {
    let match = line.match(BLOCKQUOTE_CAPTION);
    if (match) return match[2].trim();

    match = line.match(BOLD_CAPTION);
    if (match) return match[2].trim();

    // Simple > CAPTION: text
    match = line.match(TIMELINE_CAPTION);
    if (match) return match[1].trim();

    return null;
}

function extractSFX(line: string): string | null {
    let match = line.match(BLOCKQUOTE_SFX);
    if (match) return match[1].trim();

    match = line.match(BOLD_SFX);
    if (match) return match[1].trim();

    match = line.match(INLINE_SFX);
    if (match) return match[1].trim();

    return null;
}

function extractScreenText(line: string): { text: string; subtype?: string } | null {
    const match = line.match(SCREEN_TEXT);
    if (match) {
        return { text: match[2].trim(), subtype: match[1] || undefined };
    }
    return null;
}

function extractArtistNote(line: string): string | null {
    for (const pattern of ARTIST_NOTE_PATTERNS) {
        const match = line.match(pattern);
        if (match) return match[1].trim();
    }
    return null;
}

export function parseScript(scriptText: string): ParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const pages: ParsedPage[] = [];
    const characterMap = new Map<string, { count: number; first: string; description?: string }>();
    let issueInfo: ParsedIssue | undefined;

    try {
        const normalizedText = scriptText
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');

        const allLines = normalizedText.split('\n');

        let currentPageNumber = 0;
        let currentPagePanels: ParsedPanel[] = [];
        let currentPageNotes = '';
        let currentPanelNumber = 0;
        let currentPanelDescription = '';
        let currentPanelModifier = '';
        let currentPanelBubbles: ParsedBubble[] = [];
        let currentPanelArtistNotes: string[] = [];
        let inCastSection = false;
        let inArtistNotes = false;
        let artistNotesBuffer = '';
        let pendingCharacter: string | null = null;

        const saveCurrentPanel = () => {
            if (currentPanelNumber > 0) {
                if (currentPanelDescription.trim() || currentPanelBubbles.length > 0) {
                    const visualMarker = detectVisualMarker(currentPanelDescription, currentPanelModifier);
                    const aspectRatio = detectAspectRatio(currentPanelDescription, currentPanelModifier);

                    currentPagePanels.push({
                        panelNumber: currentPanelNumber,
                        description: currentPanelDescription.trim(),
                        bubbles: [...currentPanelBubbles],
                        artistNotes: [...currentPanelArtistNotes],
                        visualMarker,
                        aspectRatio,
                        panelModifier: currentPanelModifier || undefined,
                    });
                }
            }
            currentPanelDescription = '';
            currentPanelModifier = '';
            currentPanelBubbles = [];
            currentPanelArtistNotes = [];
            pendingCharacter = null;
        };

        const saveCurrentPage = () => {
            saveCurrentPanel();
            if (currentPageNumber > 0 && currentPagePanels.length > 0) {
                pages.push({
                    pageNumber: currentPageNumber,
                    panels: [...currentPagePanels],
                    pageNotes: currentPageNotes || undefined,
                });
            }
            currentPagePanels = [];
            currentPageNotes = '';
        };

        for (let i = 0; i < allLines.length; i++) {
            const line = allLines[i].trim();
            const rawLine = allLines[i];

            if (!line) {
                pendingCharacter = null;
                inArtistNotes = false;
                continue;
            }

            // Skip horizontal rules
            if (line === '---' || line === '***') continue;

            // Issue title: # TITLE
            const issueHeaderMatch = line.match(ISSUE_HEADER);
            if (issueHeaderMatch && !issueInfo) {
                issueInfo = { title: issueHeaderMatch[1].trim() };
                continue;
            }

            // Issue number: ## Issue #2: "THE BLOOM"
            const issueNumMatch = line.match(ISSUE_NUMBER);
            if (issueNumMatch) {
                if (!issueInfo) issueInfo = { title: '' };
                issueInfo.issueNumber = parseInt(issueNumMatch[1], 10);
                if (issueNumMatch[2]) issueInfo.subtitle = issueNumMatch[2].trim();
                continue;
            }

            // Writer line: **Written by X**
            if (line.startsWith('**Written by')) {
                const writerMatch = line.match(/\*\*Written by\s+(.+)\*\*/i);
                if (writerMatch && issueInfo) {
                    issueInfo.writer = writerMatch[1].trim();
                }
                continue;
            }

            // Page count line: 28 Pages | Prestige Format
            if (line.match(/^\d+\s+Pages?\s*\|/i)) {
                const pageCountMatch = line.match(/^(\d+)\s+Pages?/i);
                if (pageCountMatch && issueInfo) {
                    issueInfo.pageCount = parseInt(pageCountMatch[1], 10);
                }
                continue;
            }

            // Timeline line: **Timeline: X**
            if (line.startsWith('**Timeline:')) {
                const timelineMatch = line.match(/\*\*Timeline:\s*(.+)\*\*/i);
                if (timelineMatch && issueInfo) {
                    issueInfo.timeline = timelineMatch[1].trim();
                }
                continue;
            }

            // Cast of Characters section header
            if (CAST_HEADER.test(line)) {
                inCastSection = true;
                continue;
            }

            // Artist/Colorist notes section header
            if (line.match(/^###\s*ARTIST/i) || line.match(/^###\s*COLORIST/i)) {
                inArtistNotes = true;
                continue;
            }

            // Character definition in cast section
            if (inCastSection) {
                const charDefMatch = line.match(CHARACTER_DEFINITION);
                if (charDefMatch) {
                    const charName = charDefMatch[1].trim().toUpperCase();
                    const description = charDefMatch[2].trim();
                    if (!characterMap.has(charName)) {
                        characterMap.set(charName, { count: 0, first: '', description });
                    } else {
                        const existing = characterMap.get(charName)!;
                        existing.description = description;
                    }
                    continue;
                }
                // End cast section on next major header
                if (line.startsWith('##') || line.startsWith('###')) {
                    inCastSection = false;
                }
            }

            // Page detection
            let pageMatch: RegExpMatchArray | null = null;
            for (const pattern of PAGE_PATTERNS) {
                pageMatch = line.match(pattern);
                if (pageMatch) break;
            }
            if (pageMatch) {
                saveCurrentPage();
                currentPageNumber = parsePageNumber(pageMatch[1]);
                inCastSection = false;
                inArtistNotes = false;
                continue;
            }

            // Panel detection
            let panelMatch: RegExpMatchArray | null = null;
            for (const pattern of PANEL_PATTERNS) {
                panelMatch = line.match(pattern);
                if (panelMatch) break;
            }
            if (!panelMatch) {
                panelMatch = line.match(NUMERIC_PANEL_START);
            }

            if (panelMatch) {
                saveCurrentPanel();
                currentPanelNumber = parseInt(panelMatch[1], 10);
                // Extract modifier from various positions
                currentPanelModifier = (panelMatch[2] || panelMatch[3] || '').trim();
                // Any remaining text is description
                const restOfLine = (panelMatch[4] || panelMatch[2] || '').trim();
                if (restOfLine && !currentPanelModifier) {
                    currentPanelDescription = restOfLine;
                } else if (restOfLine && currentPanelModifier) {
                    currentPanelDescription = restOfLine;
                }
                inCastSection = false;
                inArtistNotes = false;
                continue;
            }

            // Inside a panel, parse content
            if (currentPanelNumber > 0) {
                // Artist note check
                const artistNote = extractArtistNote(line);
                if (artistNote) {
                    currentPanelArtistNotes.push(artistNote);
                    continue;
                }

                // Caption check
                const caption = extractCaption(line);
                if (caption) {
                    currentPanelBubbles.push({ type: 'caption', text: caption });
                    continue;
                }

                // SFX check
                const sfx = extractSFX(line);
                if (sfx) {
                    currentPanelBubbles.push({ type: 'sfx', text: sfx });
                    continue;
                }

                // Screen/Wall text check
                const screenText = extractScreenText(line);
                if (screenText) {
                    currentPanelBubbles.push({ type: 'screen-text', text: screenText.text, modifier: screenText.subtype });
                    continue;
                }

                // Dialogue check
                const dialogue = extractCharacterFromLine(line);
                if (dialogue) {
                    const existing = characterMap.get(dialogue.character);
                    if (existing) {
                        existing.count++;
                    } else {
                        characterMap.set(dialogue.character, { count: 1, first: currentPanelDescription });
                    }
                    currentPanelBubbles.push({
                        type: dialogue.type,
                        text: dialogue.text,
                        character: dialogue.character,
                        modifier: dialogue.modifier || undefined,
                    });
                    pendingCharacter = null;
                    continue;
                }

                // Indented dialogue (screenplay style)
                if (pendingCharacter && (rawLine.startsWith('  ') || rawLine.startsWith('\t'))) {
                    const text = line.trim();
                    const existing = characterMap.get(pendingCharacter);
                    if (existing) {
                        existing.count++;
                    } else {
                        characterMap.set(pendingCharacter, { count: 1, first: currentPanelDescription });
                    }
                    currentPanelBubbles.push({
                        type: 'dialogue',
                        text,
                        character: pendingCharacter,
                    });
                    continue;
                }

                // Potential character line (all caps, for screenplay style)
                if (/^[A-Z][A-Z\s\-']{1,25}$/.test(line) && !line.includes(':')) {
                    pendingCharacter = line.trim().toUpperCase();
                    continue;
                }

                // Inset marker
                if (INSET_PATTERN.test(line)) {
                    currentPanelDescription += ' ' + line;
                    continue;
                }

                // Fallback: append to description
                // Skip blockquote lines that aren't dialogue/caption/sfx (likely continuation)
                if (line.startsWith('>')) {
                    const cleanedLine = line.replace(/^>\s*/, '').trim();
                    if (cleanedLine) {
                        currentPanelDescription += ' ' + cleanedLine;
                    }
                } else {
                    if (currentPanelDescription) {
                        currentPanelDescription += ' ' + line;
                    } else {
                        currentPanelDescription = line;
                    }
                }
            } else {
                // Not in a panel yet - could be artist notes at page level
                if (inArtistNotes && currentPageNumber > 0) {
                    currentPageNotes += line + '\n';
                }
            }
        }

        saveCurrentPage();

        if (pages.length === 0) {
            errors.push('No story structure detected. Ensure pages start with "PAGE 1" or "### PAGE ONE" and panels with "Panel 1" or "**Panel 1**".');
            return { success: false, pages: [], characters: [], errors, warnings };
        }

        pages.sort((a, b) => a.pageNumber - b.pageNumber);

        // Build character list, filtering out system keywords
        const systemKeywords = ['CAPTION', 'SFX', 'TITLE', 'SUBTITLE', 'TEXT', 'NARRATION', 'DESCRIPTION', 'ACTION', 'SOUND', 'ON SCREEN', 'ON WALL', 'LABEL', 'READOUT'];
        const characters: ParsedCharacter[] = Array.from(characterMap.entries())
            .map(([name, data]) => ({
                name,
                description: data.description,
                lineCount: data.count,
                firstAppearance: data.first || undefined,
            }))
            .filter(c => !systemKeywords.some(k => c.name.toUpperCase().includes(k)))
            .filter(c => c.lineCount > 0 || c.description) // Keep characters with lines OR descriptions
            .sort((a, b) => b.lineCount - a.lineCount);

        return { success: true, issue: issueInfo, pages, characters, errors, warnings };

    } catch (error) {
        errors.push(`Parser exception: ${error instanceof Error ? error.message : 'Unknown'}`);
        return { success: false, pages: [], characters: [], errors, warnings };
    }
}

/**
 * Utility to extract a summary of the parsed script
 */
export function getScriptSummary(result: ParseResult): string {
    if (!result.success) {
        return `Parse failed: ${result.errors.join(', ')}`;
    }

    const lines: string[] = [];

    if (result.issue) {
        lines.push(`Title: ${result.issue.title}`);
        if (result.issue.issueNumber) lines.push(`Issue #${result.issue.issueNumber}`);
        if (result.issue.subtitle) lines.push(`"${result.issue.subtitle}"`);
        if (result.issue.writer) lines.push(`Written by: ${result.issue.writer}`);
        if (result.issue.pageCount) lines.push(`Pages: ${result.issue.pageCount}`);
    }

    lines.push(`\nParsed: ${result.pages.length} pages, ${result.pages.reduce((sum, p) => sum + p.panels.length, 0)} panels`);

    if (result.characters.length > 0) {
        lines.push(`\nCharacters (${result.characters.length}):`);
        result.characters.slice(0, 10).forEach(c => {
            lines.push(`  - ${c.name}: ${c.lineCount} lines${c.description ? ` (${c.description.slice(0, 50)}...)` : ''}`);
        });
    }

    if (result.warnings.length > 0) {
        lines.push(`\nWarnings: ${result.warnings.join(', ')}`);
    }

    return lines.join('\n');
}
