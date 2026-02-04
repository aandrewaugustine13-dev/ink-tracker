interface ParseResult {
    pages: ParsedPage[];
    characters: CharacterCount[];
    visualMarkers: Record<string, number>;
    errors: ParseError[];
}

interface ParsedPage {
    pageNumber: number;
    panels: ParsedPanel[];
}

interface ParsedPanel {
    panelNumber: number;
    description: string;
    characters: CharacterCount[];
    dialogue: DialogueLine[];
    visualMarker?: string;
    artistNotes?: string;
}

interface DialogueLine {
    character: string;
    text: string;
    type: 'spoken' | 'voiceover' | 'caption' | 'thought';
}

interface CharacterCount {
    name: string;
    panelCount: number;
}

interface ParseError {
    message: string;
}