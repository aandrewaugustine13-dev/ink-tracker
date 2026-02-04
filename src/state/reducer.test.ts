import { appReducer } from './reducer';
import { AppState, AspectRatio } from '../types';
import { Action } from './actions';

describe('reducer - ADD_PANEL action', () => {
    const createMockState = (projectType: 'comic' | 'screenplay' | 'stage-play' | 'tv-series'): AppState => ({
        projects: [{
            id: 'p1',
            title: 'Test Project',
            style: 'classic-noir',
            issueType: 'issue',
            imageProvider: 'gemini',
            projectType,
            characters: [],
            issues: [{
                id: 'i1',
                title: 'Issue #1',
                pages: [{
                    id: 'pg1',
                    number: 1,
                    panels: []
                }]
            }]
        }],
        activeProjectId: 'p1',
        activeIssueId: 'i1',
        activePageId: 'pg1'
    });

    test('creates panel with 3:4 aspect ratio for Comic / Graphic Novel projects', () => {
        const state = createMockState('comic');
        const action: Action = { type: 'ADD_PANEL', pageId: 'pg1' };
        const newState = appReducer(state, action);
        
        const panel = newState.projects[0].issues[0].pages[0].panels[0];
        expect(panel).toBeDefined();
        expect(panel.aspectRatio).toBe(AspectRatio.TALL); // 3:4
    });

    test('creates panel with 16:9 aspect ratio for Screenplay projects', () => {
        const state = createMockState('screenplay');
        const action: Action = { type: 'ADD_PANEL', pageId: 'pg1' };
        const newState = appReducer(state, action);
        
        const panel = newState.projects[0].issues[0].pages[0].panels[0];
        expect(panel).toBeDefined();
        expect(panel.aspectRatio).toBe(AspectRatio.WIDE); // 16:9
    });

    test('creates panel with 16:9 aspect ratio for TV Series projects', () => {
        const state = createMockState('tv-series');
        const action: Action = { type: 'ADD_PANEL', pageId: 'pg1' };
        const newState = appReducer(state, action);
        
        const panel = newState.projects[0].issues[0].pages[0].panels[0];
        expect(panel).toBeDefined();
        expect(panel.aspectRatio).toBe(AspectRatio.WIDE); // 16:9
    });

    test('creates panel with 16:9 aspect ratio for Stage Play projects', () => {
        const state = createMockState('stage-play');
        const action: Action = { type: 'ADD_PANEL', pageId: 'pg1' };
        const newState = appReducer(state, action);
        
        const panel = newState.projects[0].issues[0].pages[0].panels[0];
        expect(panel).toBeDefined();
        expect(panel.aspectRatio).toBe(AspectRatio.WIDE); // 16:9
    });

    test('allows manual aspect ratio changes after panel creation', () => {
        const state = createMockState('comic');
        
        // Add a panel (should have TALL aspect ratio)
        let newState = appReducer(state, { type: 'ADD_PANEL', pageId: 'pg1' });
        const panelId = newState.projects[0].issues[0].pages[0].panels[0].id;
        
        // Update the aspect ratio manually
        newState = appReducer(newState, { 
            type: 'UPDATE_PANEL', 
            panelId, 
            updates: { aspectRatio: AspectRatio.SQUARE }
        });
        
        const panel = newState.projects[0].issues[0].pages[0].panels[0];
        expect(panel.aspectRatio).toBe(AspectRatio.SQUARE);
    });

    test('does not affect existing panels when adding new ones', () => {
        const state = createMockState('comic');
        
        // Add first panel with comic (3:4)
        let newState = appReducer(state, { type: 'ADD_PANEL', pageId: 'pg1' });
        const firstPanelId = newState.projects[0].issues[0].pages[0].panels[0].id;
        
        // Manually change first panel to WIDE
        newState = appReducer(newState, {
            type: 'UPDATE_PANEL',
            panelId: firstPanelId,
            updates: { aspectRatio: AspectRatio.WIDE }
        });
        
        // Add second panel
        newState = appReducer(newState, { type: 'ADD_PANEL', pageId: 'pg1' });
        
        // First panel should still be WIDE
        const firstPanel = newState.projects[0].issues[0].pages[0].panels[0];
        expect(firstPanel.aspectRatio).toBe(AspectRatio.WIDE);
        
        // Second panel should have default TALL
        const secondPanel = newState.projects[0].issues[0].pages[0].panels[1];
        expect(secondPanel.aspectRatio).toBe(AspectRatio.TALL);
    });
});
