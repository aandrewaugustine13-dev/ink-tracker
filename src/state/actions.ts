import { Project, Issue, Panel, Character, TextElement, AspectRatio, AppState } from '../types';

// Page template types
export type PageTemplate = '2x2' | '3x3' | '2x3' | 'manga-right' | 'manga-left' | 'single' | 'double-wide';

export type Action =
| { type: 'HYDRATE'; payload: AppState }
| { type: 'SET_ACTIVE_PROJECT'; id: string }
| { type: 'ADD_PROJECT'; title: string; projectType?: 'comic' | 'screenplay' | 'stage-play' | 'tv-series' }
| { type: 'UPDATE_PROJECT'; id: string; updates: Partial<Project> }
| { type: 'UPDATE_PROJECT_GEMINI_KEY'; projectId: string; apiKey: string }
| { type: 'UPDATE_PROJECT_LEONARDO_KEY'; projectId: string; apiKey: string }
| { type: 'UPDATE_PROJECT_GROK_KEY'; projectId: string; apiKey: string }
| { type: 'UPDATE_PROJECT_FAL_KEY'; projectId: string; apiKey: string }
| { type: 'UPDATE_PROJECT_SEAART_KEY'; projectId: string; apiKey: string }
| { type: 'DELETE_PROJECT'; id: string }
| { type: 'ADD_ISSUE'; projectId: string; title?: string }
| { type: 'UPDATE_ISSUE'; issueId: string; updates: Partial<Issue> }
| { type: 'DELETE_ISSUE'; issueId: string }
| { type: 'SET_ACTIVE_ISSUE'; id: string }
| { type: 'ADD_PAGE'; issueId: string }
| { type: 'SET_ACTIVE_PAGE'; id: string }
| { type: 'ADD_PANEL'; pageId: string }
| { type: 'UPDATE_PANEL'; panelId: string; updates: Partial<Panel> }
| { type: 'DELETE_PANEL'; panelId: string; pageId: string }
| { type: 'REORDER_PANELS'; pageId: string; panels: Panel[] }
| { type: 'ADD_CHARACTER'; name: string; description: string; appearance?: Character['appearance'] }
| { type: 'UPDATE_CHARACTER'; id: string; updates: Partial<Omit<Character, 'id'>> }
| { type: 'DELETE_CHARACTER'; id: string }
| { type: 'ADD_TEXT_ELEMENT'; panelId: string; element: TextElement }
| { type: 'UPDATE_TEXT_ELEMENT'; panelId: string; elementId: string; updates: Partial<TextElement> }
| { type: 'DELETE_TEXT_ELEMENT'; panelId: string; elementId: string }
| { type: 'IMPORT_ISSUE'; projectId: string; issue: Issue; characters: Character[] }
| { type: 'APPLY_PAGE_TEMPLATE'; pageId: string; template: PageTemplate }
| { type: 'UNDO' }
| { type: 'REDO' };
