import React, { useState, useEffect } from 'react';
import { AppState, PanelFrameStyle, TextOverlayStyle } from '../types';
import { Action } from '../state/actions';
import { ART_STYLES, Icons } from '../constants';
import EmptyState from './EmptyState';
import {
    BtnPrimary, BtnSecondary, BtnGhost, BtnDanger,
    InlineValidation, SectionHeader,
    getApiKeyHint, validateApiKeyFormat,
} from './ui';
import { generateImage as generateGeminiImage } from '../services/geminiService';
import { generateLeonardoImage } from '../services/leonardoService';
import { generateGrokImage } from '../services/grokService';
import { generateFluxImage as generateFalFlux } from '../services/falFluxService';
import { generateSeaArtImage } from '../services/seaartService';
import { generateOpenAIImage } from '../services/openaiService';
import { saveImage } from '../services/imageStorage';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../services/supabase';
import { PageThumbnails } from './PageThumbnails';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Page } from '../types';

/* ================================================================== */
/*  Sortable page item (unchanged logic, tidied class names)          */
/* ================================================================== */

interface SortablePageItemProps {
    page: Page;
    isActive: boolean;
    dispatch: React.Dispatch<Action>;
    panelCount: number;
}

const SortablePageItem: React.FC<SortablePageItemProps> = ({ page, isActive, dispatch, panelCount }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: page.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2">
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing touch-none p-1 text-steel-600 hover:text-ember-500 transition-colors"
                title="Drag to reorder"
            >
                <GripVertical size={14} />
            </button>
            <button
                onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', id: page.id })}
                className={`flex-1 text-left px-3 py-1.5 rounded-md text-[11px] font-mono transition-all ${
                    isActive ? 'bg-ember-500 text-ink-950 font-bold' : 'text-steel-500 hover:bg-ink-700'
                }`}
            >
                <div className="flex justify-between items-center w-full">
                    <span>PAGE {page.number}</span>
                    <span className="opacity-40 text-[9px]">{panelCount}F</span>
                </div>
                {panelCount > 0 && (
                    <PageThumbnails panels={page.panels} />
                )}
            </button>
        </div>
    );
};

/* ================================================================== */
/*  Main Sidebar                                                      */
/* ================================================================== */

interface SidebarProps {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    onOpenProjects: () => void;
    onOpenScriptImport: () => void;
    /** Bubble toast messages up to App level */
    onToast?: (text: string, severity: 'error' | 'warning' | 'success' | 'info') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ state, dispatch, onOpenProjects, onOpenScriptImport, onToast }) => {
    const { user, signInWithGoogle } = useAuth();
    const activeProject = state.projects.find(p => p.id === state.activeProjectId);
    const activeIssue = activeProject?.issues.find(i => i.id === state.activeIssueId);
    const activePage = activeIssue?.pages.find(p => p.id === state.activePageId);
    const typeLabel = activeProject?.issueType === 'issue' ? 'Issue' : 'Chapter';

    // Toast helper: uses parent callback if provided, otherwise console
    const toast = (text: string, severity: 'error' | 'warning' | 'success' | 'info' = 'info') => {
        if (onToast) onToast(text, severity);
        else if (severity === 'error') console.error(text);
        else console.log(text);
    };

    // DnD sensors for page reordering
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handlePageDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !activeIssue) return;
        const oldIndex = activeIssue.pages.findIndex(p => p.id === active.id);
        const newIndex = activeIssue.pages.findIndex(p => p.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
            dispatch({ type: 'REORDER_PAGES', issueId: activeIssue.id, oldIndex, newIndex });
        }
    };

    // Style groups
    const STYLE_GROUPS: Record<string, string[]> = {
        "Noir & Crime": ["classic-noir", "sin-city", "crime-noir", "will-eisner"],
        "Superhero": ["bronze-superhero", "silver-superhero", "kirby-cosmic", "alex-ross", "frank-miller"],
        "Horror & Dark Fantasy": ["ec-horror", "vertigo-horror", "mignola-hellboy", "hellraiser", "spawn-mcfarlane"],
        "Indie & European": ["underground-comix", "indie-minimalist", "clear-line", "european-bd", "modern-alt"],
        "Americana & Whimsy": ["norman-rockwell", "kinkade-luminous", "lisa-frank"],
        "Sci-Fi & Experimental": ["dune-epic", "erotic-realism", "pulp-adventure", "cyberpunk-noir"],
        "Custom": ["custom"]
    };

    /* ── API Key state ─────────────────────────────────────────────── */
    const [sidebarKey, setSidebarKey] = useState('');
    const [keyValidation, setKeyValidation] = useState<string | null>(null);
    const [keySavedMsg, setKeySavedMsg] = useState<string | null>(null);

    useEffect(() => {
        if (activeProject?.imageProvider === 'gemini') setSidebarKey(activeProject?.geminiApiKey || '');
        else if (activeProject?.imageProvider === 'leonardo') setSidebarKey(activeProject?.leonardoApiKey || '');
        else if (activeProject?.imageProvider === 'grok') setSidebarKey(activeProject?.grokApiKey || '');
        else if (activeProject?.imageProvider === 'fal') setSidebarKey(activeProject?.falApiKey || '');
        else if (activeProject?.imageProvider === 'seaart') setSidebarKey(activeProject?.seaartApiKey || '');
        else if (activeProject?.imageProvider === 'openai') setSidebarKey(activeProject?.openaiApiKey || '');
        else setSidebarKey('');
        setKeyValidation(null);
        setKeySavedMsg(null);
    }, [activeProject?.geminiApiKey, activeProject?.leonardoApiKey, activeProject?.grokApiKey, activeProject?.falApiKey, activeProject?.seaartApiKey, activeProject?.openaiApiKey, activeProject?.imageProvider]);

    const handleKeyChange = (val: string) => {
        setSidebarKey(val);
        setKeySavedMsg(null);
        if (activeProject) {
            const err = validateApiKeyFormat(activeProject.imageProvider, val);
            setKeyValidation(err);
        }
    };

    const handleSaveKey = () => {
        if (!sidebarKey.trim()) {
            setKeyValidation('API key is required to generate images');
            return;
        }
        if (keyValidation) return; // don't save if format is bad
        if (!activeProject) return;

        const provider = activeProject.imageProvider;
        if (provider === 'gemini') dispatch({ type: 'UPDATE_PROJECT_GEMINI_KEY', projectId: activeProject.id, apiKey: sidebarKey.trim() });
        else if (provider === 'leonardo') dispatch({ type: 'UPDATE_PROJECT_LEONARDO_KEY', projectId: activeProject.id, apiKey: sidebarKey.trim() });
        else if (provider === 'grok') dispatch({ type: 'UPDATE_PROJECT_GROK_KEY', projectId: activeProject.id, apiKey: sidebarKey.trim() });
        else if (provider === 'fal') dispatch({ type: 'UPDATE_PROJECT_FAL_KEY', projectId: activeProject.id, apiKey: sidebarKey.trim() });
        else if (provider === 'seaart') dispatch({ type: 'UPDATE_PROJECT_SEAART_KEY', projectId: activeProject.id, apiKey: sidebarKey.trim() });
        else if (provider === 'openai') dispatch({ type: 'UPDATE_PROJECT_OPENAI_KEY', projectId: activeProject.id, apiKey: sidebarKey.trim() });

        setKeySavedMsg('Key saved');
        setTimeout(() => setKeySavedMsg(null), 3000);
    };

    /* ── Provider quick-select (no more per-provider generate handlers) */
    const handleProviderSelect = (provider: typeof activeProject extends undefined ? never : NonNullable<typeof activeProject>['imageProvider']) => {
        if (!activeProject) return;
        dispatch({ type: 'UPDATE_PROJECT', id: activeProject.id, updates: { imageProvider: provider } });
    };

    /* ── Cast form ───────────────────────────────────────────────── */
    const [showCharForm, setShowCharForm] = useState(false);
    const [charName, setCharName] = useState('');
    const [charDesc, setCharDesc] = useState('');
    const [charError, setCharError] = useState<string | null>(null);

    const handleAddChar = () => {
        if (!charName.trim()) {
            setCharError('Character name is required');
            return;
        }
        setCharError(null);
        dispatch({ type: 'ADD_CHARACTER', name: charName.trim(), description: charDesc.trim() });
        setCharName('');
        setCharDesc('');
        setShowCharForm(false);
    };

    /* ── Provider button helper ─────────────────────────────────── */
    const providerBtn = (
        id: 'gemini' | 'leonardo' | 'grok' | 'fal' | 'seaart' | 'openai',
        label: string,
        activeColor: string,
    ) => (
        <button
            key={id}
            onClick={() => handleProviderSelect(id)}
            className={`text-[10px] font-mono py-2 rounded-md transition-all ${
                activeProject?.imageProvider === id
                    ? `${activeColor} font-bold shadow-md`
                    : 'bg-ink-900 text-steel-500 hover:bg-ink-800 hover:text-steel-300'
            }`}
        >
            {label}
        </button>
    );

    const providerLabel = activeProject?.imageProvider === 'gemini' ? 'Gemini'
        : activeProject?.imageProvider === 'leonardo' ? 'Leonardo'
        : activeProject?.imageProvider === 'grok' ? 'Grok (xAI)'
        : activeProject?.imageProvider === 'fal' ? 'FAL'
        : activeProject?.imageProvider === 'seaart' ? 'SeaArt'
        : activeProject?.imageProvider === 'openai' ? 'OpenAI'
        : 'API';

    const providerKeyLink = activeProject?.imageProvider === 'gemini'
        ? { href: 'https://aistudio.google.com/app/apikey', label: 'Get key from ai.google.dev' }
        : activeProject?.imageProvider === 'leonardo'
        ? { href: 'https://leonardo.ai/settings', label: 'Get key from leonardo.ai' }
        : activeProject?.imageProvider === 'grok'
        ? { href: 'https://console.x.ai', label: 'Get key from console.x.ai' }
        : activeProject?.imageProvider === 'fal'
        ? { href: 'https://fal.ai/dashboard/keys', label: 'Get key from fal.ai' }
        : activeProject?.imageProvider === 'seaart'
        ? { href: 'https://seaart.ai/api', label: 'Get key from seaart.ai/api' }
        : activeProject?.imageProvider === 'openai'
        ? { href: 'https://platform.openai.com/api-keys', label: 'Get key from platform.openai.com' }
        : null;

    /* ================================================================== */
    /*  RENDER                                                            */
    /* ================================================================== */
    return (
        <aside className="w-72 bg-ink-900 border-r border-ink-700 flex flex-col overflow-hidden z-30">

            {/* ── Brand header ───────────────────────────────────── */}
            <div className="px-5 py-5 border-b border-ink-700">
                <h1 className="font-display text-2xl tracking-widest text-ember-500 mb-0.5 text-center">INK TRACKER</h1>
                <p className="font-mono text-[9px] text-steel-600 uppercase tracking-[0.2em] text-center">Script System v1.7</p>

                {isSupabaseConfigured() && !user && (
                    <BtnPrimary
                        onClick={signInWithGoogle}
                        aria-label="Sign in with Google for cloud sync"
                        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                    >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        Sign in for Cloud Sync
                    </BtnPrimary>
                )}
            </div>

            {/* ── Scrollable content ─────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-7 scrollbar-none">

                {/* ── STORY / PROJECT ────────────────────────────── */}
                <section>
                    <SectionHeader
                        title="Story"
                        actions={
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => {
                                        const i = activeProject?.issueType === 'issue' ? 'chapter' : 'issue';
                                        if (activeProject) dispatch({ type: 'UPDATE_PROJECT', id: activeProject.id, updates: { issueType: i } });
                                    }}
                                    className="text-[9px] font-mono text-steel-600 hover:text-ember-500 uppercase transition-colors"
                                    title="Switch Label Type"
                                >
                                    Mode: {activeProject?.issueType}
                                </button>
                                <BtnGhost onClick={onOpenProjects} className="p-1.5 px-1.5">
                                    <Icons.Folder />
                                </BtnGhost>
                            </div>
                        }
                    />

                    <div className="p-3 bg-ink-800 rounded-lg border border-ink-700 shadow-inner space-y-3">
                        {/* Project title */}
                        <p className="font-display text-lg text-steel-100 tracking-wide truncate leading-tight">{activeProject?.title}</p>

                        <BtnSecondary onClick={onOpenScriptImport} className="w-full text-cyan-400 border-cyan-800/50 hover:bg-cyan-900/20 hover:border-cyan-600/50">
                            Import Script
                        </BtnSecondary>

                        {/* Provider grid */}
                        <div className="space-y-2 pt-2 border-t border-ink-700">
                            <p className="text-[9px] font-mono text-steel-500 uppercase tracking-widest font-bold">Image Provider</p>
                            <div className="grid grid-cols-3 gap-1.5">
                                {providerBtn('gemini', 'GEMINI', 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30')}
                                {providerBtn('leonardo', 'LEO', 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30')}
                                {providerBtn('grok', 'GROK', 'bg-gray-600 hover:bg-gray-500 text-white shadow-gray-600/30')}
                                {providerBtn('fal', 'FAL', 'bg-ember-500 hover:bg-ember-400 text-ink-950 shadow-ember-500/30')}
                                {providerBtn('seaart', 'SEAART', 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-600/30')}
                                {providerBtn('openai', 'OPENAI', 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/30')}
                            </div>
                        </div>

                        {/* API Key */}
                        <div className="pt-2 border-t border-ink-700 space-y-1.5">
                            <label className="text-[9px] font-mono text-steel-400 uppercase flex justify-between items-center font-bold">
                                <span>{providerLabel} Key</span>
                                {!sidebarKey && <span className="text-danger font-bold animate-pulse text-[8px]">REQUIRED</span>}
                            </label>
                            <div className="flex gap-1">
                                <input
                                    type="password"
                                    placeholder="Enter API Key..."
                                    value={sidebarKey}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleKeyChange(e.target.value)}
                                    className={`flex-1 bg-ink-950 border rounded-lg px-3 py-2 text-[10px] text-steel-300 outline-none transition-colors ${
                                        keyValidation ? 'border-danger/60 focus:border-danger' : 'border-ink-700 focus:border-ember-500'
                                    }`}
                                />
                                <BtnPrimary onClick={handleSaveKey} className="px-3 py-2 text-[9px]">SET</BtnPrimary>
                            </div>

                            {/* Inline validation */}
                            <InlineValidation message={keyValidation || ''} severity="error" show={!!keyValidation} />
                            <InlineValidation message={keySavedMsg || ''} severity="success" show={!!keySavedMsg} />

                            {/* Hint + link */}
                            {!keyValidation && !keySavedMsg && (
                                <p className="text-[9px] text-steel-600 font-mono">
                                    {getApiKeyHint(activeProject?.imageProvider || '')}
                                </p>
                            )}
                            {providerKeyLink && (
                                <a href={providerKeyLink.href} target="_blank" rel="noopener noreferrer"
                                    className="text-[9px] text-info hover:underline font-mono transition-colors block"
                                >
                                    {providerKeyLink.label} →
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── ISSUES / CHAPTERS ──────────────────────────── */}
                <section>
                    <SectionHeader
                        title={`${typeLabel}s`}
                        actions={
                            <BtnGhost
                                onClick={() => {
                                    if (!activeProject) {
                                        toast('No active project. Create or select a story first.', 'warning');
                                        return;
                                    }
                                    dispatch({ type: 'ADD_ISSUE', projectId: activeProject.id });
                                }}
                                className="p-1.5 px-1.5 group"
                                title={`Add New ${typeLabel}`}
                            >
                                <Icons.Plus />
                                <span className="text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">NEW</span>
                            </BtnGhost>
                        }
                    />

                    <div className="space-y-3">
                        {activeProject && activeProject.issues.length === 0 && (
                            <EmptyState
                                variant="issues"
                                compact
                                onAction={() => { if (activeProject) dispatch({ type: 'ADD_ISSUE', projectId: activeProject.id }); }}
                                actionLabel={`Add ${typeLabel}`}
                            />
                        )}
                        {activeProject?.issues.map(iss => {
                            const isActive = state.activeIssueId === iss.id;
                            return (
                                <div key={iss.id} className={`rounded-lg overflow-hidden transition-all border ${isActive ? 'border-ember-500/30 bg-ember-500/5' : 'border-ink-700'}`}>
                                    <div
                                        onClick={() => dispatch({ type: 'SET_ACTIVE_ISSUE', id: iss.id })}
                                        className={`px-3 py-2.5 flex items-center justify-between cursor-pointer group ${isActive ? 'bg-ember-500/10' : 'hover:bg-ink-800'}`}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className={`text-[10px] font-mono ${isActive ? 'text-ember-500' : 'text-steel-600'}`}>{isActive ? '●' : '○'}</span>
                                            <p className={`text-[11px] font-bold uppercase tracking-widest truncate ${isActive ? 'text-ember-500' : 'text-steel-400 group-hover:text-steel-200'}`}>{iss.title}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[9px] font-mono text-steel-600">{iss.pages.length}P</span>
                                            <button
                                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (confirm(`Delete ${iss.title}?`)) dispatch({ type: 'DELETE_ISSUE', issueId: iss.id }); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-steel-700 hover:text-danger transition-all"
                                            >
                                                <Icons.Trash />
                                            </button>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div className="px-2 py-2 border-t border-ember-500/10 space-y-1 animate-fade-in">
                                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePageDragEnd}>
                                                <SortableContext items={iss.pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
                                                    {iss.pages.map(pg => (
                                                        <SortablePageItem key={pg.id} page={pg} isActive={state.activePageId === pg.id} dispatch={dispatch} panelCount={pg.panels.length} />
                                                    ))}
                                                </SortableContext>
                                            </DndContext>
                                            <BtnGhost
                                                onClick={() => dispatch({ type: 'ADD_PAGE', issueId: iss.id })}
                                                className="w-full py-1 text-[10px] mt-1"
                                            >
                                                + Add Page
                                            </BtnGhost>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── CAST ───────────────────────────────────────── */}
                <section>
                    <SectionHeader
                        title="Cast"
                        subtitle={activeProject?.characters.length ? `${activeProject.characters.length} character${activeProject.characters.length !== 1 ? 's' : ''}` : undefined}
                        actions={
                            <BtnGhost
                                onClick={() => { setShowCharForm(!showCharForm); setCharError(null); }}
                                className={`p-1.5 px-1.5 transition-transform ${showCharForm ? 'text-ember-500 rotate-45' : ''}`}
                            >
                                <Icons.Plus />
                            </BtnGhost>
                        }
                    />

                    {showCharForm && (
                        <div className="mb-4 p-3 bg-ink-800 border border-ember-500/30 rounded-lg space-y-3 animate-fade-in shadow-xl">
                            <div>
                                <input
                                    autoFocus
                                    placeholder="Name (e.g. Detective Jack)"
                                    value={charName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setCharName(e.target.value); setCharError(null); }}
                                    className={`w-full bg-ink-950 border rounded-md px-3 py-2 text-xs text-steel-200 outline-none font-bold transition-colors ${
                                        charError ? 'border-danger/60 focus:border-danger' : 'border-ink-700 focus:border-ember-500'
                                    }`}
                                />
                                <InlineValidation message={charError || ''} severity="error" show={!!charError} />
                            </div>
                            <textarea
                                placeholder="Description (age, vibe, key features...)"
                                value={charDesc}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCharDesc(e.target.value)}
                                rows={2}
                                className="w-full bg-ink-950 border border-ink-700 rounded-md px-3 py-2 text-xs text-steel-400 focus:border-ember-500 outline-none resize-none italic transition-colors"
                            />
                            <div className="flex gap-2">
                                <BtnPrimary onClick={handleAddChar} className="flex-1">Save Cast</BtnPrimary>
                                <BtnSecondary onClick={() => { setShowCharForm(false); setCharError(null); }}>Cancel</BtnSecondary>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        {activeProject?.characters.map(char => (
                            <div key={char.id} className="group flex items-center justify-between p-2.5 bg-ink-800/50 rounded-md border border-ink-700/50 hover:border-ink-700 transition-colors">
                                <div className="overflow-hidden">
                                    <p className="text-[11px] text-steel-200 font-bold truncate">{char.name}</p>
                                    <p className="text-[9px] text-steel-600 truncate italic">{char.description}</p>
                                </div>
                                <button
                                    onClick={() => dispatch({ type: 'DELETE_CHARACTER', id: char.id })}
                                    className="opacity-0 group-hover:opacity-100 text-danger/50 hover:text-danger transition-all p-1"
                                >
                                    <Icons.Trash />
                                </button>
                            </div>
                        ))}
                        {!activeProject?.characters.length && !showCharForm && (
                            <EmptyState variant="cast" compact onAction={() => setShowCharForm(true)} actionLabel="Add Character" />
                        )}
                    </div>
                </section>
            </div>

            {/* ── Art Style (footer section) ───────────────────── */}
            <div className="px-5 py-4 border-t border-ink-700 bg-ink-950 space-y-2.5">
                <SectionHeader title="Art Style" />
                <select
                    value={activeProject?.style}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        dispatch({ type: 'UPDATE_PROJECT', id: activeProject!.id, updates: { style: e.target.value } });
                        if (e.target.value !== 'custom' && activeProject?.customStylePrompt) {
                            dispatch({ type: 'UPDATE_PROJECT', id: activeProject!.id, updates: { customStylePrompt: '' } });
                        }
                    }}
                    className="w-full bg-ink-800 border border-ink-700 rounded-lg px-2 py-2 text-xs text-steel-300 font-mono focus:outline-none focus:border-ember-500 transition-colors"
                >
                    {Object.entries(STYLE_GROUPS).map(([groupName, styleIds]) => (
                        <optgroup key={groupName} label={groupName}>
                            {styleIds.map(id => {
                                const s = ART_STYLES.find(x => x.id === id);
                                return s ? <option key={s.id} value={s.id}>{s.name}</option> : null;
                            })}
                        </optgroup>
                    ))}
                </select>

                {activeProject?.style === 'custom' && (
                    <div className="space-y-2 animate-fade-in">
                        <label className="text-[9px] font-mono text-steel-500 uppercase font-bold">Custom Style Prompt</label>
                        <textarea
                            placeholder="Describe your art style..."
                            value={activeProject?.customStylePrompt || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                dispatch({ type: 'UPDATE_PROJECT', id: activeProject!.id, updates: { customStylePrompt: e.target.value } })
                            }
                            rows={3}
                            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-xs text-steel-300 focus:outline-none focus:border-ember-500 transition-colors resize-none placeholder-steel-600"
                        />
                        <p className="text-[8px] text-steel-600 italic">
                            Tip: Include artist names, techniques, color palettes, and mood descriptors.
                        </p>
                    </div>
                )}
            </div>

            {/* ── Panel & Text Style Settings ───────────────────── */}
            {activeProject && (
                <div className="px-5 py-4 border-t border-ink-700 bg-ink-950 space-y-4">
                    <SectionHeader title="Panel & Text Styles" />

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-steel-500 uppercase font-bold">Panel Frames</label>
                        <div className="flex rounded-lg overflow-hidden border border-ink-700">
                            {([
                                { value: 'opaque-black' as PanelFrameStyle, label: 'Black' },
                                { value: 'opaque-white' as PanelFrameStyle, label: 'White' },
                                { value: 'translucent' as PanelFrameStyle, label: 'Translucent' },
                            ]).map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => dispatch({ type: 'UPDATE_PROJECT', id: activeProject.id, updates: { panelFrameStyle: opt.value } })}
                                    className={`flex-1 text-[10px] font-mono py-2 transition-all ${
                                        (activeProject.panelFrameStyle || 'opaque-black') === opt.value
                                            ? 'bg-ember-500 text-ink-950 font-bold'
                                            : 'bg-ink-900 text-steel-500 hover:bg-ink-800 hover:text-steel-300'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-steel-500 uppercase font-bold">Text Elements</label>
                        <div className="flex rounded-lg overflow-hidden border border-ink-700">
                            {([
                                { value: 'opaque' as TextOverlayStyle, label: 'Opaque' },
                                { value: 'semi-transparent' as TextOverlayStyle, label: 'Semi-Trans' },
                                { value: 'border-only' as TextOverlayStyle, label: 'Border Only' },
                            ]).map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => dispatch({ type: 'UPDATE_PROJECT', id: activeProject.id, updates: { textOverlayStyle: opt.value } })}
                                    className={`flex-1 text-[10px] font-mono py-2 transition-all ${
                                        (activeProject.textOverlayStyle || 'opaque') === opt.value
                                            ? 'bg-ember-500 text-ink-950 font-bold'
                                            : 'bg-ink-900 text-steel-500 hover:bg-ink-800 hover:text-steel-300'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
