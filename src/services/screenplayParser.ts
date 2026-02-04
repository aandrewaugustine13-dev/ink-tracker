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
const SCENE_HEADING = /^(INT\.|EXT\.|INT\/EXT\.|EXT\/INT\.)\s+(.+?)\s*-\s*(.+)$/i;
const SIMPLE_SCENE_HEADING = /^(INT\.|EXT\.|INT\/EXT\.|EXT\/INT\.)\s+(.+)$/i;

// Shot/Camera direction patterns
const SHOT_PATTERNS = [
  { pattern: /^(ANGLE ON|CLOSE UP ON|CLOSE ON|CLOSE-UP|CLOSEUP)\s+(.+)$/i, marker: 'close' },
  { pattern: /^(WIDE SHOT|WIDE ON|WIDE ANGLE)\s*(.*)$/i, marker: 'wide' },
  { pattern: /^(ESTABLISHING SHOT|ESTABLISHING)\s*(.*)$/i, marker: 'establishing' },
  { pattern: /^(POV|P\.O\.V\.)\s*[:\-]?\s*(.*)$/i, marker: 'pov' },
  { pattern: /^(INSERT)\s*[:\-]?\s*(.*)$/i, marker: 'insert' },
  { pattern: /^(TWO SHOT|2 SHOT)\s*(.*)$/i, marker: 'two-shot' },
  { pattern: /^(OVER THE SHOULDER|O\.T\.S\.|OTS)\s*(.*)$/i, marker: 'over-shoulder' },
  { pattern: /^(TRACKING SHOT|TRACKING)\s*(.*)$/i, marker: 'tracking' },
  { pattern: /^(PAN TO|PANNING)\s+(.+)$/i, marker: 'pan' },
  { pattern: /^(PUSH IN|PUSHING IN)\s*(.*)$/i, marker: 'push-in' },
  { pattern: /^(PULL BACK|PULLING BACK)\s*(.*)$/i, marker: 'pull-back' },
];

// Character name pattern (centered, all caps, with optional parenthetical)
const CHARACTER_NAME = /^([A-Z][A-Z0-9\s\-'.]{1,30})(?:\s*\(([^)]+)\))?$/;

// Parenthetical pattern (character direction)
const PARENTHETICAL = /^\(([^)]+)\)$/;

// Transition patterns
const TRANSITION_PATTERNS = [
  /^(CUT TO:|FADE TO:|FADE IN:|FADE OUT\.|DISSOLVE TO:|SMASH CUT:|MATCH CUT:)\s*$/i,
  /^(FADE TO BLACK\.?|FADE TO WHITE\.?)/i,
  /^(JUMP CUT:|TIME CUT:|WIPE TO:)$/i,
];

// SFX patterns
const SFX_PATTERNS = [
  /^(SFX|SOUND|AUDIO):\s*(.+)$/i,
  /^\(SFX:\s*(.+)\)$/i,
];

// Check if a line is all caps (potential shot or character)
function isAllCaps(line: string): boolean {
  // Remove punctuation and check if remaining text is all uppercase
  const textOnly = line.replace(/[^
\w\s]/g, '').trim();
  return textOnly.length > 0 && textOnly === textOnly.toUpperCase();
}

// Check if line is a scene heading
function parseSceneHeading(line: string): { location: string; timeOfDay: string } | null {
  let match = line.match(SCENE_HEADING);
  if (match) {
    const location = match[2].trim();
    const timeOfDay = match[3].trim();
    return { location, timeOfDay };
  }
  
  match = line.match(SIMPLE_SCENE_HEADING);
  if (match) {
    return { location: match[2].trim(), timeOfDay: '' };
  }
  
  return null;
}

// Check if line is a shot/camera direction
function parseShotDirection(line: string): { marker: string; description: string } | null {
  if (!isAllCaps(line)) return null;
  
  for (const { pattern, marker } of SHOT_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return { marker, description: match[2]?.trim() || '' };
    }
  }
  
  return null;
}

// Check if line is a transition
function parseTransition(line: string): string | null {
  for (const pattern of TRANSITION_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

// Check if line is SFX
function parseSFX(line: string): string | null {
  for (const pattern of SFX_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return match[2]?.trim() || match[1].trim();
    }
  }
  return null;
}

// Parse character name and modifier
function parseCharacterName(line: string): { character: string; modifier: string } | null {
  if (!isAllCaps(line)) return null;
  
  const match = line.match(CHARACTER_NAME);
  if (match) {
    return {
      character: match[1].trim(),
      modifier: match[2]?.trim() || ''
    };
  }
  
  return null;
}

// Determine dialogue type from modifier
function getDialogueType(modifier: string): 'spoken' | 'voiceover' | 'thought' {
  const lower = modifier.toLowerCase();
  if (lower.includes('v.o') || lower.includes('voice over') || lower.includes('voiceover')) {
    return 'voiceover';
  }
  if (lower.includes('thought') || lower.includes('thinking')) {
    return 'thought';
  }
  return 'spoken';
}

/**
 * Main screenplay parser function
 * Converts standard screenplay format to ParseResult interface
 */
export function parseScreenplay(scriptText: string): ParseResult {
  const errors: ParseError[] = [];
  const pages: ParsedPage[] = [];
  const characterMap = new Map<string, number>();
  const visualMarkersMap: Record<string, number> = {};
  
  try {
    const normalizedText = scriptText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    
    const allLines = normalizedText.split('\n');
    
    let currentPageNumber = 0;
    let currentPagePanels: ParsedPanel[] = [];
    let currentPanelNumber = 0;
    let currentPanelDescription = '';
    let currentPanelDialogue: DialogueLine[] = [];
    let currentPanelCharacters: Set<string> = new Set();
    let currentPanelArtistNotes: string[] = [];
    let currentVisualMarker: string | undefined = undefined;
    
    let pendingCharacter: string | null = null;
    let pendingModifier: string = '';
    let inDialogue = false;
    let dialogueBuffer = '';
    let lastTransition: string | null = null;
    
    const saveCurrentPanel = () => {
      if (currentPanelNumber > 0 && (currentPanelDescription.trim() || currentPanelDialogue.length > 0)) {
        // Add last transition as artist note if exists
        if (lastTransition) {
          currentPanelArtistNotes.push(`Transition: ${lastTransition}`);
          lastTransition = null;
        }
        
        currentPagePanels.push({
          panelNumber: currentPanelNumber,
          description: currentPanelDescription.trim(),
          characters: Array.from(currentPanelCharacters),
          dialogue: [...currentPanelDialogue],
          visualMarker: currentVisualMarker,
          artistNotes: currentPanelArtistNotes.length > 0 ? currentPanelArtistNotes.join('; ') : undefined
        });
        
        // Count visual markers
        if (currentVisualMarker) {
          visualMarkersMap[currentVisualMarker] = (visualMarkersMap[currentVisualMarker] || 0) + 1;
        }
      }
      
      currentPanelDescription = '';
      currentPanelDialogue = [];
      currentPanelCharacters = new Set();
      currentPanelArtistNotes = [];
      currentVisualMarker = undefined;
      pendingCharacter = null;
      pendingModifier = '';
      inDialogue = false;
      dialogueBuffer = '';
    };
    
    const saveCurrentPage = () => {
      saveCurrentPanel();
      if (currentPageNumber > 0 && currentPagePanels.length > 0) {
        pages.push({
          pageNumber: currentPageNumber,
          panels: [...currentPagePanels]
        });
      }
      currentPagePanels = [];
      currentPanelNumber = 0;
    };    
    const finalizePendingDialogue = () => {
      if (pendingCharacter && dialogueBuffer.trim()) {
        const dialogueType = getDialogueType(pendingModifier);
        currentPanelDialogue.push({
          character: pendingCharacter,
          text: dialogueBuffer.trim(),
          type: dialogueType
        });
        currentPanelCharacters.add(pendingCharacter);
        
        // Update character panel count
        characterMap.set(pendingCharacter, (characterMap.get(pendingCharacter) || 0) + 1);
        
        dialogueBuffer = '';
      }
    };
    
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i];
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        if (inDialogue) {
          finalizePendingDialogue();
          inDialogue = false;
          pendingCharacter = null;
        }
        continue;
      }
      
      // Check for scene heading (new page/scene)
      const sceneHeading = parseSceneHeading(trimmedLine);
      if (sceneHeading) {
        saveCurrentPage();
        currentPageNumber++;
        currentPanelNumber = 1;
        currentPanelDescription = `${sceneHeading.location}${sceneHeading.timeOfDay ? ' - ' + sceneHeading.timeOfDay : ''}`;
        currentVisualMarker = 'establishing';
        continue;
      }
      
      // Check for transition
      const transition = parseTransition(trimmedLine);
      if (transition) {
        lastTransition = transition;
        continue;
      }
      
      // Check for SFX
      const sfx = parseSFX(trimmedLine);
      if (sfx) {
        currentPanelArtistNotes.push(`SFX: ${sfx}`);
        continue;
      }
      
      // Check for shot/camera direction (new panel)
      const shotDirection = parseShotDirection(trimmedLine);
      if (shotDirection) {
        finalizePendingDialogue();
        saveCurrentPanel();
        currentPanelNumber++;
        currentPanelDescription = shotDirection.description || '';
        currentVisualMarker = shotDirection.marker;
        inDialogue = false;
        continue;
      }
      
      // Check for character name
      const characterInfo = parseCharacterName(trimmedLine);
      if (characterInfo) {
        finalizePendingDialogue();
        pendingCharacter = characterInfo.character;
        pendingModifier = characterInfo.modifier;
        inDialogue = true;
        dialogueBuffer = '';
        continue;
      }
      
      // Check for parenthetical (character direction during dialogue)
      if (inDialogue && trimmedLine.match(PARENTHETICAL)) {
        // Skip parentheticals for now, could be added as dialogue modifiers
        continue;
      }
      
      // If we're in dialogue mode, accumulate dialogue text
      if (inDialogue && pendingCharacter) {
        dialogueBuffer += (dialogueBuffer ? ' ' : '') + trimmedLine;
        continue;
      }
      
      // Otherwise, it's an action line (description)
      finalizePendingDialogue();
      inDialogue = false;
      
      // If we don't have a panel yet for this page, create one
      if (currentPanelNumber === 0 && currentPageNumber > 0) {
        currentPanelNumber = 1;
      }
      
      // If we have existing description and this is a new paragraph, start new panel
      if (currentPanelDescription.trim() && trimmedLine.length > 0) {
        saveCurrentPanel();
        currentPanelNumber++;
      }
      
      // Add to description
      if (currentPanelDescription) {
        currentPanelDescription += ' ' + trimmedLine;
      } else {
        currentPanelDescription = trimmedLine;
      }
    }
    
    // Finalize any pending content
    finalizePendingDialogue();
    saveCurrentPage();
    
    // Build character list
    const characters: CharacterCount[] = Array.from(characterMap.entries())
      .map(([name, panelCount]) => ({ name, panelCount }))
      .sort((a, b) => b.panelCount - a.panelCount);
    
    // Build visual markers object
    const visualMarkers: VisualMarkers = visualMarkersMap;
    
    if (pages.length === 0) {
      errors.push({
        message: 'No screenplay structure detected. Ensure scenes start with "INT." or "EXT." headings.'
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
      message: `Parser exception: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return {
      pages: [],
      characters: [],
      visualMarkers: {},
      errors
    };
  }
}