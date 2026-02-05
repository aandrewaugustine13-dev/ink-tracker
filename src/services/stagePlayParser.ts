/**
 * Stage Play Parser
 * 
 * Parses stage play scripts into the shared ParseResult structure.
 * 
 * Recognized elements:
 * - Act breaks: ACT ONE, ACT TWO, etc.
 * - Scene markers: SCENE 1, SCENE 2, etc.
 * - Stage directions: (text in parentheses or brackets)
 * - Character dialogue: CHARACTER NAME: Dialogue or CHARACTER NAME. Dialogue
 * - Blocking: enters, exits, crosses, etc.
 * - Technical cues: LIGHTS:, SOUND:, MUSIC:, [Lights fade], etc.
 */

import {
    ParseResult,
    ParsedPage,
    ParsedPanel,
    DialogueLine,
    CharacterCount,
    VisualMarkers,
    ParseError
} from './parserTypes';

// ============= PATTERN DEFINITIONS =============

// Act patterns
const ACT_PATTERNS = [
    /^ACT\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|I|II|III|IV|V|VI|VII|VIII|IX|X|1|2|3|4|5|6|7|8|9|10)\b/i,
    /^ACT\s*([IVXLCDM]+)\b/i,
];

// Scene patterns
const SCENE_PATTERNS = [
    /^SCENE\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\d+)\b/i,
    /^SCENE\s*([IVXLCDM]+)\b/i,
];

// Stage direction at start of line (in parentheses or brackets)
const STAGE_DIRECTION_PATTERN = /^\s*[\[\(](.+?)[\]\)]\s*$/;
const INLINE_STAGE_DIRECTION = /^[\[\(](.+?)[\]\)]\s*/;

// Character dialogue patterns
// Format: CHARACTER NAME: dialogue or CHARACTER NAME. dialogue or CHARACTER: dialogue
const DIALOGUE_PATTERNS = [
    /^([A-Z][A-Z0-9\s'.'-]{0,30})(?:\s*\(([^)]+)\))?\s*[:.\-—]\s*(.+)$/,
    /^([A-Z][A-Za-z0-9\s'.'-]{0,30})(?:\s*\(([^)]+)\))?\s*[:.\-—]\s*(.+)$/,
];

// Offstage markers
const OFFSTAGE_MODIFIERS = ['O.S.', 'OS', 'O.S', 'OFF', 'OFFSTAGE', 'V.O.', 'VO', 'VOICE OVER'];

// Blocking verbs (indicate movement, often create new "beats")
const BLOCKING_VERBS = [
    'enters', 'enter', 'exit', 'exits', 'exiting', 'entering',
    'crosses', 'cross', 'crossing',
    'moves', 'move', 'moving',
    'sits', 'sit', 'sitting',
    'stands', 'stand', 'standing',
    'rises', 'rise', 'rising',
    'turns', 'turn', 'turning',
    'gestures', 'gesture', 'gesturing',
    'walks', 'walk', 'walking',
    'runs', 'run', 'running',
    'approaches', 'approach', 'approaching',
    'retreats', 'retreat', 'retreating',
    'kneels', 'kneel', 'kneeling',
    'falls', 'fall', 'falling',
    'embraces', 'embrace', 'embracing',
    'kisses', 'kiss', 'kissing',
    'fights', 'fight', 'fighting',
    'dances', 'dance', 'dancing',
];

// Technical cue patterns
const TECHNICAL_CUE_PATTERNS = [
    /^LIGHTS?\s*[:.\-—]\s*(.+)$/i,
    /^SOUND\s*[:.\-—]\s*(.+)$/i,
    /^MUSIC\s*[:.\-—]\s*(.+)$/i,
    /^SFX\s*[:.\-—]\s*(.+)$/i,
    /^BLACKOUT\s*$/i,
    /^CURTAIN\s*(UP|DOWN|OPENS?|CLOSES?)?\s*$/i,
    /^\[LIGHTS?\s+(.+?)\]$/i,
    /^\[SOUND\s+(.+?)\]$/i,
    /^\[MUSIC\s+(.+?)\]$/i,
];

// End markers
const END_PATTERNS = [
    /^END\s+OF\s+(ACT|SCENE|PLAY)\b/i,
    /^(CURTAIN|BLACKOUT|THE\s+END|FINIS?|FINALE?)\s*$/i,
    /^\[END\s+OF\s+(ACT|SCENE|PLAY)\]/i,
];

// ============= HELPER FUNCTIONS =============

/**
 * Parse act number from line
 */
function parseActNumber(line: string): string | null {
    for (const pattern of ACT_PATTERNS) {
        const match = line.trim().match(pattern);
        if (match) {
            return normalizeNumber(match[1]);
        }
    }
    return null;
}

/**
 * Parse scene number from line
 */
function parseSceneNumber(line: string): string | null {
    for (const pattern of SCENE_PATTERNS) {
        const match = line.trim().match(pattern);
        if (match) {
            return normalizeNumber(match[1]);
        }
    }
    return null;
}

/**
 * Normalize number words to digits
 */
function normalizeNumber(str: string): string {
    const wordToNum: Record<string, string> = {
        'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
        'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
        'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5',
        'vi': '6', 'vii': '7', 'viii': '8', 'ix': '9', 'x': '10',
    };
    const lower = str.toLowerCase();
    return wordToNum[lower] || str;
}

/**
 * Extract stage direction from line
 */
function extractStageDirection(line: string): string | null {
    const match = line.match(STAGE_DIRECTION_PATTERN);
    return match ? match[1].trim() : null;
}

/**
 * Extract inline stage direction from start of line
 */
function extractInlineStageDirection(line: string): { direction: string; rest: string } | null {
    const match = line.match(INLINE_STAGE_DIRECTION);
    if (match) {
        return {
            direction: match[1].trim(),
            rest: line.slice(match[0].length).trim()
        };
    }
    return null;
}

/**
 * Check if a stage direction contains a blocking verb (significant movement)
 */
function hasBlockingVerb(text: string): boolean {
    const lower = text.toLowerCase();
    return BLOCKING_VERBS.some(verb => {
        const regex = new RegExp(`\\b${verb}\\b`, 'i');
        return regex.test(lower);
    });
}

/**
 * Check if a stage direction indicates an entrance or exit
 */
function isEntranceOrExit(text: string): 'enter' | 'exit' | null {
    const lower = text.toLowerCase();
    if (/\b(enters?|entering)\b/i.test(lower)) return 'enter';
    if (/\b(exits?|exiting|exeunt)\b/i.test(lower)) return 'exit';
    return null;
}

/**
 * Parse dialogue from line
 */
function parseDialogue(line: string): { character: string; modifier?: string; text: string } | null {
    for (const pattern of DIALOGUE_PATTERNS) {
        const match = line.trim().match(pattern);
        if (match) {
            const character = match[1].trim();
            const modifier = match[2]?.trim();
            const text = match[3].trim();
            
            // Skip if "character" is a reserved word
            if (['LIGHTS', 'SOUND', 'MUSIC', 'SFX', 'BLACKOUT', 'CURTAIN', 'END'].includes(character.toUpperCase())) {
                return null;
            }
            
            return { character: character.toUpperCase(), modifier, text };
        }
    }
    return null;
}

/**
 * Check if modifier indicates offstage voice
 */
function isOffstage(modifier?: string): boolean {
    if (!modifier) return false;
    return OFFSTAGE_MODIFIERS.some(m => modifier.toUpperCase().includes(m));
}

/**
 * Check if line is a technical cue
 */
function extractTechnicalCue(line: string): string | null {
    for (const pattern of TECHNICAL_CUE_PATTERNS) {
        const match = line.trim().match(pattern);
        if (match) {
            return match[0].trim();
        }
    }
    return null;
}

/**
 * Check if line is an end marker
 */
function isEndMarker(line: string): boolean {
    return END_PATTERNS.some(pattern => pattern.test(line.trim()));
}

// ============= MAIN PARSER =============

/**
 * Parse a stage play script into the shared ParseResult format
 */
export function parseStagePlay(scriptText: string): ParseResult {
    const errors: ParseError[] = [];
    const pages: ParsedPage[] = [];
    const characterMap = new Map<string, number>();
    const visualMarkers: VisualMarkers = {};
    
    try {
        // Normalize line endings
        const normalizedText = scriptText
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');
        
        const lines = normalizedText.split('\n');
        
        let currentAct: string | null = null;
        let currentScene: number = 0;
        let currentPage: ParsedPage | null = null;
        let currentPanel: ParsedPanel | null = null as ParsedPanel | null;
        let panelNumber = 0;
        
        /**
         * Save current panel to current page
         */
        const savePanel = () => {
            if (currentPanel && currentPage) {
                if (currentPanel.description.trim() || currentPanel.dialogue.length > 0) {
                    currentPage.panels.push(currentPanel);
                }
            }
            currentPanel = null;
        };
        
        /**
         * Save current page
         */
        const savePage = () => {
            savePanel();
            if (currentPage && currentPage.panels.length > 0) {
                pages.push(currentPage);
            }
            currentPage = null;
        };
        
        /**
         * Start a new scene
         */
        const startScene = (sceneNum: string) => {
            savePage();
            
            currentScene++;
            panelNumber = 0;
            
            currentPage = {
                pageNumber: currentScene,
                panels: [],
                actNumber: currentAct || undefined
            };
        };
        
        /**
         * Start a new panel/beat
         */
        const startBeat = (description: string = '', blockingType?: string) => {
            savePanel();
            
            panelNumber++;
            
            if (blockingType) {
                visualMarkers[blockingType] = (visualMarkers[blockingType] || 0) + 1;
            }
            
            currentPanel = {
                panelNumber,
                description,
                characters: [],
                dialogue: [],
                visualMarker: blockingType,
                blockingNotes: blockingType
            };
        };
        
        /**
         * Ensure we have an active scene and panel
         */
        const ensurePanel = () => {
            if (!currentPage) {
                startScene('1');
            }
            if (!currentPanel) {
                startBeat();
            }
        };
        
        // Process each line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Skip empty lines
            if (!trimmedLine) {
                continue;
            }
            
            // Check for end markers
            if (isEndMarker(trimmedLine)) {
                continue;
            }
            
            // Check for act header
            const actNum = parseActNumber(trimmedLine);
            if (actNum) {
                currentAct = actNum;
                // Acts don't create new scenes by themselves
                continue;
            }
            
            // Check for scene header
            const sceneNum = parseSceneNumber(trimmedLine);
            if (sceneNum) {
                startScene(sceneNum);
                continue;
            }
            
            // Check for technical cue
            const techCue = extractTechnicalCue(trimmedLine);
            if (techCue) {
                ensurePanel();
                if (currentPanel) {
                    currentPanel.artistNotes = currentPanel.artistNotes
                        ? `${currentPanel.artistNotes}; ${techCue}`
                        : techCue;
                }
                continue;
            }
            
            // Check for full-line stage direction
            const stageDir = extractStageDirection(trimmedLine);
            if (stageDir) {
                // Check if this is a significant blocking moment
                const entranceExit = isEntranceOrExit(stageDir);
                if (entranceExit) {
                    // Create a new beat for entrances/exits
                    startBeat(stageDir, entranceExit === 'enter' ? 'ENTRANCE' : 'EXIT');
                } else if (hasBlockingVerb(stageDir)) {
                    // Create a new beat for significant blocking
                    startBeat(stageDir, 'BLOCKING');
                } else {
                    // Just add to current panel description
                    ensurePanel();
                    if (currentPanel) {
                        if (currentPanel.description) {
                            currentPanel.description += ' ' + stageDir;
                        } else {
                            currentPanel.description = stageDir;
                        }
                    }
                }
                continue;
            }
            
            // Check for dialogue
            const dialogue = parseDialogue(trimmedLine);
            if (dialogue) {
                ensurePanel();
                
                if (currentPanel) {
                    currentPanel.dialogue.push({
                        character: dialogue.character,
                        text: dialogue.text,
                        type: isOffstage(dialogue.modifier) ? 'voiceover' : 'spoken'
                    });
                    
                    if (!currentPanel.characters.includes(dialogue.character)) {
                        currentPanel.characters.push(dialogue.character);
                    }
                    
                    // Update character count
                    characterMap.set(
                        dialogue.character,
                        (characterMap.get(dialogue.character) || 0) + 1
                    );
                }
                continue;
            }
            
            // Check for inline stage direction followed by text
            const inlineDir = extractInlineStageDirection(trimmedLine);
            if (inlineDir) {
                // Check if the direction is blocking
                const entranceExit = isEntranceOrExit(inlineDir.direction);
                if (entranceExit) {
                    startBeat(inlineDir.direction, entranceExit === 'enter' ? 'ENTRANCE' : 'EXIT');
                } else {
                    ensurePanel();
                    if (currentPanel) {
                        if (currentPanel.description) {
                            currentPanel.description += ' ' + inlineDir.direction;
                        } else {
                            currentPanel.description = inlineDir.direction;
                        }
                    }
                }
                
                // Process the rest of the line if there's more
                if (inlineDir.rest) {
                    const restDialogue = parseDialogue(inlineDir.rest);
                    if (restDialogue && currentPanel) {
                        currentPanel.dialogue.push({
                            character: restDialogue.character,
                            text: restDialogue.text,
                            type: isOffstage(restDialogue.modifier) ? 'voiceover' : 'spoken'
                        });
                        
                        if (!currentPanel.characters.includes(restDialogue.character)) {
                            currentPanel.characters.push(restDialogue.character);
                        }
                        
                        characterMap.set(
                            restDialogue.character,
                            (characterMap.get(restDialogue.character) || 0) + 1
                        );
                    }
                }
                continue;
            }
            
            // Otherwise, treat as description/stage direction without brackets
            ensurePanel();
            if (currentPanel) {
                if (currentPanel.description) {
                    currentPanel.description += ' ' + trimmedLine;
                } else {
                    currentPanel.description = trimmedLine;
                }
            }
        }
        
        // Finalize
        savePage();
        
        // Build character list
        const characters: CharacterCount[] = Array.from(characterMap.entries())
            .map(([name, count]) => ({ name, panelCount: count }))
            .sort((a, b) => b.panelCount - a.panelCount);
        
        // Validation
        if (pages.length === 0) {
            errors.push({
                message: 'No scenes detected. Stage plays should include "SCENE 1" or similar markers, or dialogue in the format "CHARACTER: text".'
            });
        }
        
        return {
            pages,
            characters,
            visualMarkers,
            errors
        };
        
    } catch (error) {
        errors.push({
            message: `Stage play parser exception: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        
        return {
            pages: [],
            characters: [],
            visualMarkers: {},
            errors
        };
    }
}

/**
 * Utility to get a summary of the parsed stage play
 */
export function getStagePlaySummary(result: ParseResult): string {
    const lines: string[] = [];
    
    lines.push(`Scenes: ${result.pages.length}`);
    lines.push(`Total Beats: ${result.pages.reduce((sum, p) => sum + p.panels.length, 0)}`);
    
    if (result.characters.length > 0) {
        lines.push(`\nCharacters (${result.characters.length}):`);
        result.characters.slice(0, 10).forEach(char => {
            lines.push(`  - ${char.name}: ${char.panelCount} dialogue instances`);
        });
    }
    
    if (Object.keys(result.visualMarkers).length > 0) {
        lines.push(`\nBlocking:`);
        Object.entries(result.visualMarkers)
            .sort(([, a], [, b]) => b - a)
            .forEach(([marker, count]) => {
                lines.push(`  - ${marker}: ${count}`);
            });
    }
    
    if (result.errors.length > 0) {
        lines.push(`\nErrors:`);
        result.errors.forEach(err => {
            lines.push(`  - ${err.message}`);
        });
    }
    
    return lines.join('\n');
}
