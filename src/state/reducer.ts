import { Action, PageTemplate } from './actions';
import {
    AppState,
    AppStateWithHistory,
    Project,
    Issue,
    Page,
    Panel,
    Character,
    TextElement,
    AspectRatio
} from '../types';
import { genId } from '../utils/helpers';

// Page template configurations
const PAGE_TEMPLATES: Record<PageTemplate, { panels: Array<{ x: number; y: number; width: number; height: number; aspectRatio: AspectRatio }> }> = {
    '2x2': {
        panels: [
            { x: 40, y: 40, width: 360, height: 300, aspectRatio: AspectRatio.WIDE },
            { x: 420, y: 40, width: 360, height: 300, aspectRatio: AspectRatio.WIDE },
            { x: 40, y: 360, width: 360, height: 300, aspectRatio: AspectRatio.WIDE },
            { x: 420, y: 360, width: 360, height: 300, aspectRatio: AspectRatio.WIDE },
        ]
    },
    '3x3': {
        panels: [
            { x: 40, y: 40, width: 240, height: 200, aspectRatio: AspectRatio.STD },
            { x: 300, y: 40, width: 240, height: 200, aspectRatio: AspectRatio.STD },
            { x: 560, y: 40, width: 240, height: 200, aspectRatio: AspectRatio.STD },
            { x: 40, y: 260, width: 240, height: 200, aspectRatio: AspectRatio.STD },
            { x: 300, y: 260, width: 240, height: 200, aspectRatio: AspectRatio.STD },
            { x: 560, y: 260, width: 240, height: 200, aspectRatio: AspectRatio.STD },
            { x: 40, y: 480, width: 240, height: 200, aspectRatio: AspectRatio.STD },
            { x: 300, y: 480, width: 240, height: 200, aspectRatio: AspectRatio.STD },
            { x: 560, y: 480, width: 240, height: 200, aspectRatio: AspectRatio.STD },
        ]
    },
    '2x3': {
        panels: [
            { x: 40, y: 40, width: 360, height: 200, aspectRatio: AspectRatio.WIDE },
            { x: 420, y: 40, width: 360, height: 200, aspectRatio: AspectRatio.WIDE },
            { x: 40, y: 260, width: 360, height: 200, aspectRatio: AspectRatio.WIDE },
            { x: 420, y: 260, width: 360, height: 200, aspectRatio: AspectRatio.WIDE },
            { x: 40, y: 480, width: 360, height: 200, aspectRatio: AspectRatio.WIDE },
            { x: 420, y: 480, width: 360, height: 200, aspectRatio: AspectRatio.WIDE },
        ]
    },
    'manga-right': {
        panels: [
            { x: 420, y: 40, width: 360, height: 280, aspectRatio: AspectRatio.STD },
            { x: 40, y: 40, width: 360, height: 180, aspectRatio: AspectRatio.WIDE },
            { x: 40, y: 240, width: 360, height: 180, aspectRatio: AspectRatio.WIDE },
            { x: 40, y: 440, width: 280, height: 220, aspectRatio: AspectRatio.STD },
            { x: 340, y: 340, width: 440, height: 320, aspectRatio: AspectRatio.WIDE },
        ]
    },
    'manga-left': {
        panels: [
            { x: 40, y: 40, width: 360, height: 280, aspectRatio: AspectRatio.STD },
            { x: 420, y: 40, width: 360, height: 180, aspectRatio: AspectRatio.WIDE },
            { x: 420, y: 240, width: 360, height: 180, aspectRatio: AspectRatio.WIDE },
            { x: 500, y: 440, width: 280, height: 220, aspectRatio: AspectRatio.STD },
            { x: 40, y: 340, width: 440, height: 320, aspectRatio: AspectRatio.WIDE },
        ]
    },
    'single': {
        panels: [
            { x: 40, y: 40, width: 720, height: 600, aspectRatio: AspectRatio.WIDE },
        ]
    },
    'double-wide': {
        panels: [
            { x: 40, y: 40, width: 740, height: 300, aspectRatio: AspectRatio.WIDE },
            { x: 40, y: 360, width: 740, height: 300, aspectRatio: AspectRatio.WIDE },
        ]
    },
};

const MAX_HISTORY = 50; // Maximum number of undo steps

export function appReducer(state: AppState, action: Action): AppState {
    let newState = { ...state };

    switch (action.type) {
        case 'SET_ACTIVE_PROJECT': {
            const p = state.projects.find(x => x.id === action.id);
            newState = {
                ...state,
                activeProjectId: action.id,
                activeIssueId: p?.issues[0]?.id || null,
                activePageId: p?.issues[0]?.pages[0]?.id || null
            };
            break;
        }

        case 'ADD_PROJECT': {
            const newProj: Project = {
                id: genId(),
                title: action.title,
                style: 'classic-noir',
                issueType: 'issue',
                imageProvider: 'gemini',
                fluxModel: 'fal-ai/flux-pro',
                characters: [],
                issues: [{ id: genId(), title: 'Issue #1', pages: [{ id: genId(), number: 1, panels: [] }] }]
            };
            newState = {
                ...state,
                projects: [...state.projects, newProj],
                activeProjectId: newProj.id,
                activeIssueId: newProj.issues[0].id,
                activePageId: newProj.issues[0].pages[0].id
            };
            break;
        }

        case 'UPDATE_PROJECT':
            newState.projects = state.projects.map(p => p.id === action.id ? { ...p, ...action.updates } : p);
            break;

        case 'UPDATE_PROJECT_GEMINI_KEY':
            newState.projects = state.projects.map(p => p.id === action.projectId ? { ...p, geminiApiKey: action.apiKey } : p);
            break;

        case 'UPDATE_PROJECT_LEONARDO_KEY':
            newState.projects = state.projects.map(p => p.id === action.projectId ? { ...p, leonardoApiKey: action.apiKey } : p);
            break;

        case 'UPDATE_PROJECT_GROK_KEY':
            newState.projects = state.projects.map(p => p.id === action.projectId ? { ...p, grokApiKey: action.apiKey } : p);
            break;

        case 'UPDATE_PROJECT_FAL_KEY':
            newState.projects = state.projects.map(p => p.id === action.projectId ? { ...p, falApiKey: action.apiKey } : p);
            break;

        case 'UPDATE_PROJECT_SEAART_KEY':
            newState.projects = state.projects.map(p => p.id === action.projectId ? { ...p, seaartApiKey: action.apiKey } : p);
            break;

        case 'DELETE_PROJECT': {
            newState.projects = state.projects.filter(p => p.id !== action.id);
            if (state.activeProjectId === action.id) {
                newState.activeProjectId = newState.projects[0]?.id || null;
            }
            break;
        }

        case 'ADD_ISSUE':
            newState.projects = state.projects.map(proj => {
                if (proj.id !== action.projectId) return proj;
                const typeLabel = proj.issueType === 'issue' ? 'Issue' : 'Chapter';
                const num = proj.issues.length + 1;
                const newIss: Issue = {
                    id: genId(),
                                                   title: action.title || `${typeLabel} #${num}`,
                                                   pages: [{ id: genId(), number: 1, panels: [] }]
                };
                newState.activeIssueId = newIss.id;
                newState.activePageId = newIss.pages[0].id;
                return { ...proj, issues: [...proj.issues, newIss] };
            });
            break;

        case 'UPDATE_ISSUE':
            newState.projects = state.projects.map(proj => ({
                ...proj,
                issues: proj.issues.map(iss => iss.id === action.issueId ? { ...iss, ...action.updates } : iss)
            }));
            break;

        case 'DELETE_ISSUE':
            newState.projects = state.projects.map(proj => {
                const remaining = proj.issues.filter(i => i.id !== action.issueId);
                if (state.activeIssueId === action.issueId) {
                    newState.activeIssueId = remaining[0]?.id || null;
                    newState.activePageId = remaining[0]?.pages[0]?.id || null;
                }
                return { ...proj, issues: remaining };
            });
            break;

        case 'SET_ACTIVE_ISSUE': {
            const activeP = state.projects.find(proj => proj.issues.some(i => i.id === action.id));
            const activeIss = activeP?.issues.find(i => i.id === action.id);
            newState.activeIssueId = action.id;
            newState.activePageId = activeIss?.pages[0]?.id || null;
            break;
        }

        case 'ADD_PAGE':
            newState.projects = state.projects.map(proj => ({
                ...proj,
                issues: proj.issues.map(iss => {
                    if (iss.id !== action.issueId) return iss;
                    const newPg: Page = { id: genId(), number: iss.pages.length + 1, panels: [] };
                    newState.activePageId = newPg.id;
                    return { ...iss, pages: [...iss.pages, newPg] };
                })
            }));
            break;

        case 'SET_ACTIVE_PAGE':
            newState.activePageId = action.id;
            break;

        case 'ADD_PANEL':
            newState.projects = state.projects.map(proj => ({
                ...proj,
                issues: proj.issues.map(iss => ({
                    ...iss,
                    pages: iss.pages.map(pg => {
                        if (pg.id !== action.pageId) return pg;
                        // Calculate position for new panel (stagger them)
                        const panelCount = pg.panels.length;
                        const col = panelCount % 3;
                        const row = Math.floor(panelCount / 3);
                        const newPan: Panel = {
                            id: genId(),
                            prompt: '',
                            aspectRatio: AspectRatio.WIDE,
                            characterIds: [],
                            textElements: [],
                            x: 40 + (col * 400),
                            y: 40 + (row * 480),
                            width: 360,
                            height: 420
                        };
                        return { ...pg, panels: [...pg.panels, newPan] };
                    })
                }))
            }));
            break;

        case 'UPDATE_PANEL':
            newState.projects = state.projects.map(proj => ({
                ...proj,
                issues: proj.issues.map(iss => ({
                    ...iss,
                    pages: iss.pages.map(pg => ({
                        ...pg,
                        panels: pg.panels.map(pan => pan.id === action.panelId ? { ...pan, ...action.updates } : pan)
                    }))
                }))
            }));
            break;

        case 'DELETE_PANEL':
            newState.projects = state.projects.map(proj => ({
                ...proj,
                issues: proj.issues.map(iss => ({
                    ...iss,
                    pages: iss.pages.map(pg => {
                        if (pg.id !== action.pageId) return pg;
                        return { ...pg, panels: pg.panels.filter(pan => pan.id !== action.panelId) };
                    })
                }))
            }));
            break;

        case 'REORDER_PANELS':
            newState.projects = state.projects.map(proj => ({
                ...proj,
                issues: proj.issues.map(iss => ({
                    ...iss,
                    pages: iss.pages.map(pg => pg.id === action.pageId ? { ...pg, panels: action.panels } : pg)
                }))
            }));
            break;

        case 'ADD_CHARACTER':
            newState.projects = state.projects.map(proj => {
                if (proj.id !== state.activeProjectId) return proj;
                return {
                    ...proj,
                    characters: [...proj.characters, { 
                        id: genId(), 
                        name: action.name, 
                        description: action.description,
                        appearance: action.appearance
                    }]
                };
            });
            break;

        case 'UPDATE_CHARACTER':
            newState.projects = state.projects.map(proj => {
                if (proj.id !== state.activeProjectId) return proj;
                return {
                    ...proj,
                    characters: proj.characters.map(c => 
                        c.id === action.id ? { ...c, ...action.updates } : c
                    )
                };
            });
            break;

        case 'DELETE_CHARACTER':
            newState.projects = state.projects.map(proj => {
                if (proj.id !== state.activeProjectId) return proj;
                return {
                    ...proj,
                    characters: proj.characters.filter(c => c.id !== action.id),
                                                   issues: proj.issues.map(iss => ({
                                                       ...iss,
                                                       pages: iss.pages.map(pg => ({
                                                           ...pg,
                                                           panels: pg.panels.map(pan => ({
                                                               ...pan,
                                                               characterIds: pan.characterIds.filter(id => id !== action.id)
                                                           }))
                                                       }))
                                                   }))
                };
            });
            break;

        case 'ADD_TEXT_ELEMENT':
            newState.projects = state.projects.map(proj => ({
                ...proj,
                issues: proj.issues.map(iss => ({
                    ...iss,
                    pages: iss.pages.map(pg => ({
                        ...pg,
                        panels: pg.panels.map(pan =>
                        pan.id === action.panelId
                        ? { ...pan, textElements: [...pan.textElements, action.element] }
                        : pan
                        )
                    }))
                }))
            }));
            break;

        case 'UPDATE_TEXT_ELEMENT':
            newState.projects = state.projects.map(proj => ({
                ...proj,
                issues: proj.issues.map(iss => ({
                    ...iss,
                    pages: iss.pages.map(pg => ({
                        ...pg,
                        panels: pg.panels.map(pan =>
                        pan.id === action.panelId
                        ? {
                            ...pan,
                            textElements: pan.textElements.map(te =>
                            te.id === action.elementId ? { ...te, ...action.updates } : te
                            )
                        }
                        : pan
                        )
                    }))
                }))
            }));
            break;

        case 'DELETE_TEXT_ELEMENT':
            newState.projects = state.projects.map(proj => ({
                ...proj,
                issues: proj.issues.map(iss => ({
                    ...iss,
                    pages: iss.pages.map(pg => ({
                        ...pg,
                        panels: pg.panels.map(pan =>
                        pan.id === action.panelId
                        ? { ...pan, textElements: pan.textElements.filter(te => te.id !== action.elementId) }
                        : pan
                        )
                    }))
                }))
            }));
            break;

        case 'IMPORT_ISSUE':
            newState.projects = state.projects.map(proj => {
                if (proj.id !== action.projectId) return proj;
                return {
                    ...proj,
                    issues: [...proj.issues, action.issue],
                    characters: [
                        ...proj.characters,
                        ...action.characters.filter(
                            newChar => !proj.characters.some(
                                existing => existing.name.toUpperCase() === newChar.name.toUpperCase()
                            )
                        )
                    ]
                };
            });
            newState.activeIssueId = action.issue.id;
            newState.activePageId = action.issue.pages[0]?.id || null;
            break;

        case 'APPLY_PAGE_TEMPLATE': {
            const template = PAGE_TEMPLATES[action.template];
            if (!template) break;
            
            newState.projects = state.projects.map(proj => ({
                ...proj,
                issues: proj.issues.map(iss => ({
                    ...iss,
                    pages: iss.pages.map(pg => {
                        if (pg.id !== action.pageId) return pg;
                        // Create new panels based on template
                        const newPanels: Panel[] = template.panels.map((config, idx) => ({
                            id: genId(),
                            prompt: '',
                            aspectRatio: config.aspectRatio,
                            characterIds: [],
                            textElements: [],
                            x: config.x,
                            y: config.y,
                            width: config.width,
                            height: config.height,
                        }));
                        return { ...pg, panels: newPanels };
                    })
                }))
            }));
            break;
        }

        // UNDO and REDO are handled by the history wrapper
        case 'UNDO':
        case 'REDO':
            // These are handled by historyReducer wrapper
            break;
    }

    localStorage.setItem('ink_tracker_data', JSON.stringify(newState));
    return newState;
}

// Actions that should NOT be recorded in history (navigation, UI state)
const NON_HISTORICAL_ACTIONS = new Set([
    'SET_ACTIVE_PROJECT',
    'SET_ACTIVE_ISSUE', 
    'SET_ACTIVE_PAGE',
    'UNDO',
    'REDO',
]);

// History-aware reducer wrapper
export function historyReducer(
    stateWithHistory: AppStateWithHistory,
    action: Action
): AppStateWithHistory {
    const { past, present, future } = stateWithHistory;

    switch (action.type) {
        case 'UNDO': {
            if (past.length === 0) return stateWithHistory;
            const previous = past[past.length - 1];
            const newPast = past.slice(0, past.length - 1);
            return {
                past: newPast,
                present: previous,
                future: [present, ...future],
            };
        }

        case 'REDO': {
            if (future.length === 0) return stateWithHistory;
            const next = future[0];
            const newFuture = future.slice(1);
            return {
                past: [...past, present],
                present: next,
                future: newFuture,
            };
        }

        default: {
            const newPresent = appReducer(present, action);
            
            // If state didn't change, don't record in history
            if (newPresent === present) return stateWithHistory;
            
            // Don't record navigation actions in history
            if (NON_HISTORICAL_ACTIONS.has(action.type)) {
                return {
                    past,
                    present: newPresent,
                    future,
                };
            }

            // Record in history, limiting size
            const newPast = [...past, present].slice(-MAX_HISTORY);
            return {
                past: newPast,
                present: newPresent,
                future: [], // Clear future on new action
            };
        }
    }
}

// Initialize history state
export function createInitialHistoryState(initialState: AppState): AppStateWithHistory {
    return {
        past: [],
        present: initialState,
        future: [],
    };
}

// Check if undo/redo is available
export function canUndo(state: AppStateWithHistory): boolean {
    return state.past.length > 0;
}

export function canRedo(state: AppStateWithHistory): boolean {
    return state.future.length > 0;
}
