/**
 * Screenplay Parser
 * 
 * Parses industry-standard screenplay format into the shared ParseResult structure.
 * 
 * Recognized elements:
 * - Scene headings: INT./EXT. LOCATION - TIME
 * - Camera directions: CLOSE UP, WIDE SHOT, ANGLE ON, etc.
 * - Character dialogue: CHARACTER NAME (modifier) followed by dialogue
 * - Action lines: descriptive paragraphs
 * - Transitions: CUT TO:, FADE TO:, etc.
 * - Sound effects: SFX:, SOUND:
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

// Scene heading patterns
const SCENE_HEADING_PATTERN = /^(INT\.|EXT\.|INT\/EXT\.|EXT\/INT\.)\s*(.+?)(?:\s*[-–—]\s*(.+))?$/i;

// Camera direction / shot type patterns
const SHOT_PATTERNS = [
    /^(ANGLE ON|CLOSE UP|CLOSE ON|EXTREME CLOSE UP|ECU|CU)\s*[-–—:]\s*(.*)$/i,
    /^(WIDE SHOT|WIDE ON|WIDE|WS)\s*[-–—:]\s*(.*)$/i,
    /^(ESTABLISHING|ESTABLISHING SHOT|EST\.)\s*[-–—:]*\s*(.*)$/i,
    /^(POV|P\.O\.V\.)\s*[-–—:]\s*(.*)$/i,
    /^(INSERT|INSERT SHOT)\s*[-–—:]\s*(.*)$/i,
    /^(TWO SHOT|2-SHOT|2 SHOT)\s*[-–—:]*\s*(.*)$/i,
    /^(OVER THE SHOULDER|OTS|O\.T\.S\.)\s*[-–—:]\s*(.*)$/i,
    /^(TRACKING|TRACKING SHOT)\s*[-–—:]*\s*(.*)$/i,
    /^(PAN TO|PAN)\s*[-–—:]*\s*(.*)$/i,
    /^(PUSH IN|PUSH IN ON)\s*[-–—:]*\s*(.*)$/i,
    /^(PULL BACK|PULL OUT)\s*[-–—:]*\s*(.*)$/i,
    /^(MEDIUM SHOT|MS|MED\.)\s*[-–—:]*\s*(.*)$/i,
    /^(LONG SHOT|LS)\s*[-–—:]*\s*(.*)$/i,
    /^(FULL SHOT)\s*[-–—:]*\s*(.*)$/i,
    /^(LOW ANGLE|HIGH ANGLE)\s*[-–—:]*\s*(.*)$/i,
    /^(DUTCH ANGLE|CANTED|TILTED)\s*[-–—:]*\s*(.*)$/i,
    /^(CRANE SHOT|DOLLY)\s*[-–—:]*\s*(.*)$/i,
    /^(AERIAL|AERIAL SHOT|BIRD'S EYE)\s*[-–—:]*\s*(.*)$/i,
];

// Check if a line is only a shot type indicator (all caps, recognized shot)
const SHOT_ONLY_PATTERN = /^(ANGLE ON|CLOSE UP|CLOSE ON|EXTREME CLOSE UP|ECU|CU|WIDE SHOT|WIDE ON|WIDE|WS|ESTABLISHING|ESTABLISHING SHOT|EST\.|POV|P\.O\.V\.|INSERT|INSERT SHOT|TWO SHOT|2-SHOT|2 SHOT|OVER THE SHOULDER|OTS|O\.T\.S\.|TRACKING|TRACKING SHOT|PAN TO|PAN|PUSH IN|PUSH IN ON|PULL BACK|PULL OUT|MEDIUM SHOT|MS|MED\.|LONG SHOT|LS|FULL SHOT|LOW ANGLE|HIGH ANGLE|DUTCH ANGLE|CANTED|TILTED|CRANE SHOT|DOLLY|AERIAL|AERIAL SHOT|BIRD'S EYE)\s*$/i;

// Character dialogue patterns
// Character name is typically centered and in ALL CAPS
const CHARACTER_NAME_PATTERN = /^([A-Z][A-Z0-9\s'.'-]{0,35})(?:\s*\(([^)]+)\))?$/;
const CHARACTER_WITH_EXTENSION = /^([A-Z][A-Z0-9\s'.'-]{0,35})\s*\((V\.O\.|O\.S\.|CONT'D|CONT\.D|INTO PHONE|ON PHONE|PHONE|PRE-LAP|FILTERED|ON TV|ON RADIO|WHISPER|SHOUTING|SINGING|O\.C\.)\)$/i;

// Transition patterns
const TRANSITION_PATTERNS = [
    /^(CUT TO|HARD CUT TO|JUMP CUT TO):?\s*$/i,
    /^(FADE TO|FADE TO BLACK|FADE OUT\.|FADE IN:?)$/i,
    /^(DISSOLVE TO|CROSSFADE TO):?\s*$/i,
    /^(SMASH CUT TO|SMASH CUT):?\s*$/i,
    /^(MATCH CUT TO|MATCH CUT):?\s*$/i,
    /^(WIPE TO):?\s*$/i,
    /^(TIME CUT|TIME CUT TO):?\s*$/i,
    /^(IRIS IN|IRIS OUT):?\s*$/i,
    /^(END OF SCENE):?\s*$/i,
];

// SFX/Sound patterns
const SFX_PATTERN = /^(?:SFX|SOUND|AUDIO|FX)\s*[:–—-]\s*(.+)$/i;

// Parenthetical pattern (used within dialogue)
const PARENTHETICAL_PATTERN = /^\(([^)]+)\)$/;

// Reserved words that are NOT character names
const RESERVED_WORDS = [
    'FADE IN', 'FADE OUT', 'CUT TO', 'DISSOLVE TO', 'SMASH CUT',
    'MATCH CUT', 'TIME CUT', 'CONTINUED', 'MORE', 'CONT\'D',
    'THE END', 'END', 'TITLE', 'SUPER', 'CHYRON', 'INTERCUT',
    'BACK TO', 'LATER', 'MOMENTS LATER', 'FLASHBACK', 'END FLASHBACK',
    'BEGIN', 'FREEZE FRAME', 'SPLIT SCREEN', 'MONTAGE', 'END MONTAGE',
    'SERIES OF SHOTS', 'DREAM SEQUENCE', 'END DREAM', 'RESUME'
];

// ============= HELPER FUNCTIONS =============

/**
 * Check if a line is a scene heading
 */
function isSceneHeading(line: string): boolean {
    return SCENE_HEADING_PATTERN.test(line.trim());
}

/**
 * Parse scene heading into components
 */
function parseSceneHeading(line: string): { intExt: string; location: string; timeOfDay?: string } | null {
    const match = line.trim().match(SCENE_HEADING_PATTERN);
    if (!match) return null;
    
    return {
        intExt: match[1].toUpperCase().replace('.', ''),
        location: match[2].trim(),
        timeOfDay: match[3]?.trim()
    };
}

/**
 * Check if a line is a camera direction
 */
function isCameraDirection(line: string): { type: string; subject: string } | null {
    const trimmed = line.trim();
    
    // Check for shot-only lines
    if (SHOT_ONLY_PATTERN.test(trimmed)) {
        return { type: trimmed.toUpperCase(), subject: '' };
    }
    
    // Check for shot with subject
    for (const pattern of SHOT_PATTERNS) {
        const match = trimmed.match(pattern);
        if (match) {
            return {
                type: match[1].toUpperCase().trim(),
                subject: match[2]?.trim() || ''
            };
        }
    }
    
    return null;
}

/**
 * Check if a line is a transition
 */
function isTransition(line: string): string | null {
    const trimmed = line.trim();
    for (const pattern of TRANSITION_PATTERNS) {
        if (pattern.test(trimmed)) {
            return trimmed.replace(/:$/, '').toUpperCase();
        }
    }
    return null;
}

/**
 * Check if a line is potentially a character name (for dialogue)
 */
function isCharacterName(line: string): { name: string; modifier?: string } | null {
    const trimmed = line.trim();
    
    // Skip reserved words
    for (const reserved of RESERVED_WORDS) {
        if (trimmed.toUpperCase() === reserved) {
            return null;
        }
    }
    
    // Skip if it looks like a scene heading
    if (isSceneHeading(trimmed)) {
        return null;
    }
    
    // Skip if it looks like a transition (ends with :)
    if (isTransition(trimmed)) {
        return null;
    }
    
    // Check with extension first
    const extMatch = trimmed.match(CHARACTER_WITH_EXTENSION);
    if (extMatch) {
        return {
            name: extMatch[1].trim(),
            modifier: extMatch[2].toUpperCase()
        };
    }
    
    // Check basic character name pattern
    const basicMatch = trimmed.match(CHARACTER_NAME_PATTERN);
    if (basicMatch && trimmed === trimmed.toUpperCase() && trimmed.length >= 2 && trimmed.length <= 40) {
        // Additional validation: should not contain only numbers
        if (/^[0-9]+$/.test(trimmed)) {
            return null;
        }
        return {
            name: basicMatch[1].trim(),
            modifier: basicMatch[2]?.toUpperCase()
        };
    }
    
    return null;
}

/**
 * Check if a line is a SFX/sound line
 */
function extractSFX(line: string): string | null {
    const match = line.trim().match(SFX_PATTERN);
    return match ? match[1].trim() : null;
}

/**
 * Check if a line is a parenthetical (used within dialogue)
 */
function isParenthetical(line: string): string | null {
    const match = line.trim().match(PARENTHETICAL_PATTERN);
    return match ? match[1].trim() : null;
}

/**
 * Normalize shot type names for consistency
 */
function normalizeShot(shotType: string): string {
    const normalized: Record<string, string> = {
        'ECU': 'EXTREME CLOSE UP',
        'CU': 'CLOSE UP',
        'CLOSE ON': 'CLOSE UP',
        'WS': 'WIDE SHOT',
        'WIDE ON': 'WIDE SHOT',
        'WIDE': 'WIDE SHOT',
        'EST.': 'ESTABLISHING',
        'P.O.V.': 'POV',
        'OTS': 'OVER THE SHOULDER',
        'O.T.S.': 'OVER THE SHOULDER',
        'MS': 'MEDIUM SHOT',
        'MED.': 'MEDIUM SHOT',
        'LS': 'LONG SHOT',
        '2-SHOT': 'TWO SHOT',
        '2 SHOT': 'TWO SHOT',
    };
    
    return normalized[shotType.toUpperCase()] || shotType.toUpperCase();
}

/**
 * Map dialogue modifier to type
 */
function modifierToDialogueType(modifier?: string): 'spoken' | 'voiceover' {
    if (!modifier) return 'spoken';
    
    const upper = modifier.toUpperCase();
    if (upper === 'V.O.' || upper === 'VO' || upper === 'VOICE OVER' || upper === 'VOICE-OVER') {
        return 'voiceover';
    }
    
    // O.S. (off-screen) is still spoken, just not visible
    return 'spoken';
}

// ============= MAIN PARSER =============

/**
 * Parse a screenplay script into the shared ParseResult format
 */
export function parseScreenplay(scriptText: string): ParseResult {
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
        
        let currentPage: ParsedPage | null = null;
        let currentPanel: ParsedPanel | null = null as ParsedPanel | null;
        let currentPanelNumber = 0;
        let sceneNumber = 0;
        
        // Dialogue state
        let pendingCharacter: { name: string; modifier?: string } | null = null;
        let pendingDialogue: string[] = [];
        let lastTransition: string | null = null;
        
        /**
         * Flush pending dialogue to current panel
         */
        const flushDialogue = () => {
            if (pendingCharacter && pendingDialogue.length > 0 && currentPanel) {
                const dialogueText = pendingDialogue.join(' ').trim();
                if (dialogueText) {
                    currentPanel.dialogue.push({
                        character: pendingCharacter.name,
                        text: dialogueText,
                        type: modifierToDialogueType(pendingCharacter.modifier)
                    });
                    
                    if (!currentPanel.characters.includes(pendingCharacter.name)) {
                        currentPanel.characters.push(pendingCharacter.name);
                    }
                    
                    // Update character count
                    characterMap.set(
                        pendingCharacter.name,
                        (characterMap.get(pendingCharacter.name) || 0) + 1
                    );
                }
            }
            pendingCharacter = null;
            pendingDialogue = [];
        };
        
        /**
         * Start a new panel/shot
         */
        const startNewPanel = (shotType?: string, description: string = '') => {
            flushDialogue();
            
            if (currentPanel && currentPage) {
                // Save current panel
                if (currentPanel.description.trim() || currentPanel.dialogue.length > 0) {
                    currentPage.panels.push(currentPanel);
                }
            }
            
            currentPanelNumber++;
            
            const normalizedShot = shotType ? normalizeShot(shotType) : undefined;
            if (normalizedShot) {
                visualMarkers[normalizedShot] = (visualMarkers[normalizedShot] || 0) + 1;
            }
            
            currentPanel = {
                panelNumber: currentPanelNumber,
                description: description,
                characters: [],
                dialogue: [],
                visualMarker: normalizedShot,
                shotType: normalizedShot,
                artistNotes: lastTransition || undefined
            };
            
            lastTransition = null;
        };
        
        /**
         * Start a new scene/page
         */
        const startNewScene = (heading: { intExt: string; location: string; timeOfDay?: string }) => {
            flushDialogue();
            
            // Save current panel to current page
            if (currentPanel && currentPage) {
                if (currentPanel.description.trim() || currentPanel.dialogue.length > 0) {
                    currentPage.panels.push(currentPanel);
                }
            }
            
            // Save current page
            if (currentPage && currentPage.panels.length > 0) {
                pages.push(currentPage);
            }
            
            sceneNumber++;
            currentPanelNumber = 0;
            
            currentPage = {
                pageNumber: sceneNumber,
                panels: [],
                location: heading.location,
                timeOfDay: heading.timeOfDay,
                sceneHeading: `${heading.intExt}. ${heading.location}${heading.timeOfDay ? ' - ' + heading.timeOfDay : ''}`
            };
            
            // Start first panel for this scene (establishing shot by default)
            startNewPanel('ESTABLISHING', `${heading.intExt}. ${heading.location}. ${heading.timeOfDay || ''}.`.trim());
        };
        
        // Process each line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Skip empty lines but they might end dialogue
            if (!trimmedLine) {
                flushDialogue();
                continue;
            }
            
            // Check for scene heading
            const sceneHeading = parseSceneHeading(trimmedLine);
            if (sceneHeading) {
                startNewScene(sceneHeading);
                continue;
            }
            
            // We need an active scene to process anything else
            if (!currentPage) {
                // If we encounter content before first scene heading,
                // we might have a FADE IN or other intro
                const transition = isTransition(trimmedLine);
                if (transition) {
                    lastTransition = transition;
                }
                continue;
            }
            
            // Check for camera direction / shot type
            const cameraDir = isCameraDirection(trimmedLine);
            if (cameraDir) {
                startNewPanel(cameraDir.type, cameraDir.subject);
                continue;
            }
            
            // Check for transition
            const transition = isTransition(trimmedLine);
            if (transition) {
                flushDialogue();
                lastTransition = transition;
                continue;
            }
            
            // Check for SFX
            const sfx = extractSFX(trimmedLine);
            if (sfx) {
                if (currentPanel) {
                    currentPanel.artistNotes = currentPanel.artistNotes
                        ? `${currentPanel.artistNotes}; SFX: ${sfx}`
                        : `SFX: ${sfx}`;
                }
                continue;
            }
            
            // Check for character name (starts dialogue)
            // Character names are typically centered (indented) in screenplays
            const leadingSpaces = line.length - line.trimStart().length;
            const isDialogueIndent = leadingSpaces >= 15 && leadingSpaces <= 45;
            
            if (isDialogueIndent || trimmedLine === trimmedLine.toUpperCase()) {
                const charName = isCharacterName(trimmedLine);
                if (charName) {
                    flushDialogue();
                    pendingCharacter = charName;
                    continue;
                }
            }
            
            // Check for parenthetical (part of dialogue)
            const parenthetical = isParenthetical(trimmedLine);
            if (parenthetical && pendingCharacter) {
                // Parentheticals modify how dialogue is delivered
                // We can append this to the character modifier
                if (pendingCharacter.modifier) {
                    pendingCharacter.modifier += `, ${parenthetical}`;
                } else {
                    pendingCharacter.modifier = parenthetical;
                }
                continue;
            }
            
            // If we have a pending character, this line is likely dialogue
            if (pendingCharacter) {
                pendingDialogue.push(trimmedLine);
                continue;
            }
            
            // Otherwise, this is action/description
            // Ensure we have a panel
            if (!currentPanel) {
                startNewPanel();
            }
            
            if (currentPanel) {
                if (currentPanel.description) {
                    currentPanel.description += ' ' + trimmedLine;
                } else {
                    currentPanel.description = trimmedLine;
                }
            }
        }
        
        // Finalize
        flushDialogue();
        
        // Use type assertions for final cleanup since TypeScript has trouble
        // tracking closures that modify these variables
        const finalPanel = currentPanel as ParsedPanel | null;
        const finalPage = currentPage as ParsedPage | null;
        
        if (finalPanel && finalPage) {
            if (finalPanel.description.trim() || finalPanel.dialogue.length > 0) {
                finalPage.panels.push(finalPanel);
            }
        }
        
        if (finalPage && finalPage.panels.length > 0) {
            pages.push(finalPage);
        }
        
        // Build character list
        const characters: CharacterCount[] = Array.from(characterMap.entries())
            .map(([name, count]) => ({ name, panelCount: count }))
            .sort((a, b) => b.panelCount - a.panelCount);
        
        // Validation
        if (pages.length === 0) {
            errors.push({
                message: 'No scenes detected. Screenplay scenes should start with INT. or EXT. scene headings.'
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
            message: `Screenplay parser exception: ${error instanceof Error ? error.message : 'Unknown error'}`
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
 * Utility to get a summary of the parsed screenplay
 */
export function getScreenplaySummary(result: ParseResult): string {
    const lines: string[] = [];
    
    lines.push(`Scenes: ${result.pages.length}`);
    lines.push(`Total Shots: ${result.pages.reduce((sum, p) => sum + p.panels.length, 0)}`);
    
    if (result.characters.length > 0) {
        lines.push(`\nCharacters (${result.characters.length}):`);
        result.characters.slice(0, 10).forEach(char => {
            lines.push(`  - ${char.name}: ${char.panelCount} dialogue instances`);
        });
    }
    
    if (Object.keys(result.visualMarkers).length > 0) {
        lines.push(`\nShot Types:`);
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
