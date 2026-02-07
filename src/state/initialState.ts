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

    // Don't create a default project - onboarding will handle this
    return {
        projects: [],
        activeProjectId: null,
        activeIssueId: null,
        activePageId: null
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
            panelFrameStyle: proj.panelFrameStyle || 'opaque-black',
            textOverlayStyle: proj.textOverlayStyle || 'opaque',
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
