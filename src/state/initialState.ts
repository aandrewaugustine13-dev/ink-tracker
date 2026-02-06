import {
    AppState,
    Project
} from '../types';

export const createInitialState = (): AppState => {
    const saved = localStorage.getItem('ink_tracker_data');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed?.projects) {
                parsed.projects = normalizeProjects(parsed.projects);
            }
            return parsed;
        } catch (e) {
            console.error("Load failed", e);
        }
    }

    const defaultProject: Project = {
        id: 'p1',
        title: 'New Story',
        style: 'classic-noir',
        issueType: 'issue',
        imageProvider: 'gemini',
        projectType: 'comic',
        fluxModel: 'fal-ai/flux-pro',
        characters: [],
        issues: [
            {
                id: 'i1',
                title: 'Issue #1',
                pages: [
                    {
                        id: 'pg1',
                        number: 1,
                        panels: []
                    }
                ]
            }
        ]
    };

    return {
        projects: [defaultProject],
        activeProjectId: 'p1',
        activeIssueId: 'i1',
        activePageId: 'pg1'
    };
};

export const normalizeProjects = (projects: Project[]): Project[] => {
    return projects.map((proj) => {
        const normalized: Project = {
            ...proj,
            issueType: proj.issueType || 'issue',
            imageProvider: proj.imageProvider || 'gemini',
            projectType: proj.projectType || 'comic',
            openaiApiKey: proj.openaiApiKey || '',
            fluxModel: proj.fluxModel || 'fal-ai/flux-pro',
            characters: proj.characters || [],
            issues: (proj.issues || []).map((iss) => ({
                ...iss,
                pages: (iss.pages || []).map((pg) => ({
                    ...pg,
                    panels: (pg.panels || []).map((pan) => ({
                        ...pan,
                        textElements: pan.textElements || [],
                        characterIds: pan.characterIds || [],
                    })),
                })),
            })),
        };

        if ((normalized.imageProvider as string) === 'fal-flux') normalized.imageProvider = 'fal';
        if ((normalized.imageProvider as string) === 'replicate-flux') normalized.imageProvider = 'gemini';

        return normalized;
    });
};
