import { describe, test, expect } from 'vitest';
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

describe('reducer - UPDATE_PANEL prompt history', () => {
    const createMockStateWithPanel = (): AppState => ({
        projects: [{
            id: 'p1',
            title: 'Test Project',
            style: 'classic-noir',
            issueType: 'issue',
            imageProvider: 'gemini',
            projectType: 'comic',
            characters: [],
            issues: [{
                id: 'i1',
                title: 'Issue #1',
                pages: [{
                    id: 'pg1',
                    number: 1,
                    panels: [{
                        id: 'panel1',
                        prompt: 'Initial prompt',
                        aspectRatio: AspectRatio.TALL,
                        characterIds: [],
                        textElements: []
                    }]
                }]
            }]
        }],
        activeProjectId: 'p1',
        activeIssueId: 'i1',
        activePageId: 'pg1'
    });

    test('saves old prompt to history when prompt changes', () => {
        const state = createMockStateWithPanel();
        const newState = appReducer(state, {
            type: 'UPDATE_PANEL',
            panelId: 'panel1',
            updates: { prompt: 'New prompt' }
        });

        const panel = newState.projects[0].issues[0].pages[0].panels[0];
        expect(panel.prompt).toBe('New prompt');
        expect(panel.promptHistory).toBeDefined();
        expect(panel.promptHistory).toHaveLength(1);
        expect(panel.promptHistory![0]).toBe('Initial prompt');
    });

    test('does not save empty prompts to history', () => {
        const stateWithEmptyPrompt = createMockStateWithPanel();
        stateWithEmptyPrompt.projects[0].issues[0].pages[0].panels[0].prompt = '';
        
        const newState = appReducer(stateWithEmptyPrompt, {
            type: 'UPDATE_PANEL',
            panelId: 'panel1',
            updates: { prompt: 'First real prompt' }
        });

        const panel = newState.projects[0].issues[0].pages[0].panels[0];
        expect(panel.prompt).toBe('First real prompt');
        expect(panel.promptHistory || []).toHaveLength(0);
    });

    test('does not save to history when prompt does not change', () => {
        const state = createMockStateWithPanel();
        const newState = appReducer(state, {
            type: 'UPDATE_PANEL',
            panelId: 'panel1',
            updates: { aspectRatio: AspectRatio.SQUARE }
        });

        const panel = newState.projects[0].issues[0].pages[0].panels[0];
        expect(panel.promptHistory).toBeUndefined();
    });

    test('caps history at 5 entries', () => {
        let state = createMockStateWithPanel();
        
        // Update prompt 6 times
        for (let i = 1; i <= 6; i++) {
            state = appReducer(state, {
                type: 'UPDATE_PANEL',
                panelId: 'panel1',
                updates: { prompt: `Prompt version ${i}` }
            });
        }

        const panel = state.projects[0].issues[0].pages[0].panels[0];
        expect(panel.promptHistory).toHaveLength(5);
        // Should keep the 5 most recent old prompts
        expect(panel.promptHistory![0]).toBe('Prompt version 1');
        expect(panel.promptHistory![4]).toBe('Prompt version 5');
        expect(panel.prompt).toBe('Prompt version 6');
    });

    test('preserves existing history when updating non-prompt fields', () => {
        const state = createMockStateWithPanel();
        // Add some history
        let newState = appReducer(state, {
            type: 'UPDATE_PANEL',
            panelId: 'panel1',
            updates: { prompt: 'Second prompt' }
        });

        newState = appReducer(newState, {
            type: 'UPDATE_PANEL',
            panelId: 'panel1',
            updates: { aspectRatio: AspectRatio.SQUARE }
        });

        const panel = newState.projects[0].issues[0].pages[0].panels[0];
        expect(panel.promptHistory).toHaveLength(1);
        expect(panel.promptHistory![0]).toBe('Initial prompt');
    });
});

describe('reducer - REORDER_PAGES action', () => {
    const createMockStateWithPages = (): AppState => ({
        projects: [{
            id: 'p1',
            title: 'Test Project',
            style: 'classic-noir',
            issueType: 'issue',
            imageProvider: 'gemini',
            projectType: 'comic',
            characters: [],
            issues: [{
                id: 'i1',
                title: 'Issue #1',
                pages: [
                    { id: 'page1', number: 1, panels: [] },
                    { id: 'page2', number: 2, panels: [] },
                    { id: 'page3', number: 3, panels: [] },
                    { id: 'page4', number: 4, panels: [] },
                ]
            }]
        }],
        activeProjectId: 'p1',
        activeIssueId: 'i1',
        activePageId: 'page1'
    });

    test('reorders pages from index 0 to index 2', () => {
        const state = createMockStateWithPages();
        const newState = appReducer(state, {
            type: 'REORDER_PAGES',
            issueId: 'i1',
            oldIndex: 0,
            newIndex: 2
        });

        const pages = newState.projects[0].issues[0].pages;
        expect(pages[0].id).toBe('page2');
        expect(pages[1].id).toBe('page3');
        expect(pages[2].id).toBe('page1');
        expect(pages[3].id).toBe('page4');
    });

    test('reorders pages from index 3 to index 0', () => {
        const state = createMockStateWithPages();
        const newState = appReducer(state, {
            type: 'REORDER_PAGES',
            issueId: 'i1',
            oldIndex: 3,
            newIndex: 0
        });

        const pages = newState.projects[0].issues[0].pages;
        expect(pages[0].id).toBe('page4');
        expect(pages[1].id).toBe('page1');
        expect(pages[2].id).toBe('page2');
        expect(pages[3].id).toBe('page3');
    });

    test('reorders pages from index 1 to index 2', () => {
        const state = createMockStateWithPages();
        const newState = appReducer(state, {
            type: 'REORDER_PAGES',
            issueId: 'i1',
            oldIndex: 1,
            newIndex: 2
        });

        const pages = newState.projects[0].issues[0].pages;
        expect(pages[0].id).toBe('page1');
        expect(pages[1].id).toBe('page3');
        expect(pages[2].id).toBe('page2');
        expect(pages[3].id).toBe('page4');
    });

    test('renumbers pages correctly after reordering', () => {
        const state = createMockStateWithPages();
        const newState = appReducer(state, {
            type: 'REORDER_PAGES',
            issueId: 'i1',
            oldIndex: 0,
            newIndex: 2
        });

        const pages = newState.projects[0].issues[0].pages;
        expect(pages[0].number).toBe(1);
        expect(pages[1].number).toBe(2);
        expect(pages[2].number).toBe(3);
        expect(pages[3].number).toBe(4);
    });

    test('does not affect other issues when reordering pages', () => {
        const state: AppState = {
            projects: [{
                id: 'p1',
                title: 'Test Project',
                style: 'classic-noir',
                issueType: 'issue',
                imageProvider: 'gemini',
                projectType: 'comic',
                characters: [],
                issues: [
                    {
                        id: 'i1',
                        title: 'Issue #1',
                        pages: [
                            { id: 'page1', number: 1, panels: [] },
                            { id: 'page2', number: 2, panels: [] },
                        ]
                    },
                    {
                        id: 'i2',
                        title: 'Issue #2',
                        pages: [
                            { id: 'page3', number: 1, panels: [] },
                            { id: 'page4', number: 2, panels: [] },
                        ]
                    }
                ]
            }],
            activeProjectId: 'p1',
            activeIssueId: 'i1',
            activePageId: 'page1'
        };

        const newState = appReducer(state, {
            type: 'REORDER_PAGES',
            issueId: 'i1',
            oldIndex: 0,
            newIndex: 1
        });

        // Issue 1 should be reordered
        const issue1Pages = newState.projects[0].issues[0].pages;
        expect(issue1Pages[0].id).toBe('page2');
        expect(issue1Pages[1].id).toBe('page1');

        // Issue 2 should remain unchanged
        const issue2Pages = newState.projects[0].issues[1].pages;
        expect(issue2Pages[0].id).toBe('page3');
        expect(issue2Pages[1].id).toBe('page4');
    });

    test('preserves panels within pages when reordering', () => {
        const state: AppState = {
            projects: [{
                id: 'p1',
                title: 'Test Project',
                style: 'classic-noir',
                issueType: 'issue',
                imageProvider: 'gemini',
                projectType: 'comic',
                characters: [],
                issues: [{
                    id: 'i1',
                    title: 'Issue #1',
                    pages: [
                        { 
                            id: 'page1', 
                            number: 1, 
                            panels: [{ 
                                id: 'panel1', 
                                prompt: 'Panel 1', 
                                aspectRatio: AspectRatio.TALL,
                                characterIds: [],
                                textElements: []
                            }] 
                        },
                        { 
                            id: 'page2', 
                            number: 2, 
                            panels: [{ 
                                id: 'panel2', 
                                prompt: 'Panel 2', 
                                aspectRatio: AspectRatio.WIDE,
                                characterIds: [],
                                textElements: []
                            }] 
                        },
                    ]
                }]
            }],
            activeProjectId: 'p1',
            activeIssueId: 'i1',
            activePageId: 'page1'
        };

        const newState = appReducer(state, {
            type: 'REORDER_PAGES',
            issueId: 'i1',
            oldIndex: 0,
            newIndex: 1
        });

        const pages = newState.projects[0].issues[0].pages;
        // Page 2 should now be first, but retain its panel
        expect(pages[0].id).toBe('page2');
        expect(pages[0].panels[0].id).toBe('panel2');
        expect(pages[0].panels[0].prompt).toBe('Panel 2');
        
        // Page 1 should now be second, but retain its panel
        expect(pages[1].id).toBe('page1');
        expect(pages[1].panels[0].id).toBe('panel1');
        expect(pages[1].panels[0].prompt).toBe('Panel 1');
    });
});
