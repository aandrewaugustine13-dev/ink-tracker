import React, { useState, useEffect } from 'react';
import { AppState, Project, Character } from '../types';
import { Action } from '../state/actions';
import { ART_STYLES, Icons } from '../constants';

interface SidebarProps {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    onOpenProjects: () => void;
    onOpenScriptImport: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ state, dispatch, onOpenProjects, onOpenScriptImport }) => {
    const activeProject = state.projects.find(p => p.id === state.activeProjectId);
    const typeLabel = activeProject?.issueType === 'issue' ? 'Issue' : 'Chapter';

    const STYLE_GROUPS = {
        "Noir & Crime": ["classic-noir", "sin-city", "crime-noir", "will-eisner"],
        "Superhero": ["bronze-superhero", "silver-superhero", "kirby-cosmic", "alex-ross", "frank-miller"],
        "Horror": ["ec-horror", "vertigo-horror", "mignola-hellboy"],
        "Indie & European": ["underground-comix", "indie-minimalist", "clear-line", "european-bd", "modern-alt"],
        "Realistic & Experimental": ["erotic-realism", "pulp-adventure", "cyberpunk-noir"]
    };

    const [sidebarKey, setSidebarKey] = useState('');
    useEffect(() => {
        if (activeProject?.imageProvider === 'fal-flux') {
            setSidebarKey(activeProject?.falApiKey || '');
        } else if (activeProject?.imageProvider === 'replicate-flux') {
            setSidebarKey(activeProject?.replicateApiKey || '');
        }
    }, [activeProject?.falApiKey, activeProject?.replicateApiKey, activeProject?.imageProvider]);

    const [showCharForm, setShowCharForm] = useState(false);
    const [charName, setCharName] = useState('');
    const [charDesc, setCharDesc] = useState('');

    const handleAddChar = () => {
        if (charName.trim()) {
            dispatch({ type: 'ADD_CHARACTER', name: charName.trim(), description: charDesc.trim() });
            setCharName('');
            setCharDesc('');
            setShowCharForm(false);
        }
    };

    return (
        <aside className="w-72 bg-ink-900 border-r border-ink-700 flex flex-col overflow-hidden z-30">
        <div className="p-6 border-b border-ink-700">
        <h1 className="font-display text-3xl tracking-widest text-ember-500 mb-1 text-center">INK TRACKER</h1>
        <p className="font-mono text-[10px] text-steel-500 uppercase tracking-tighter text-center">Script System v1.6</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-none">
        <div>
        <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-mono text-steel-500 uppercase tracking-widest">Story</h2>
        <div className="flex gap-2">
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
        <button onClick={onOpenProjects} className="text-steel-400 hover:text-ember-500 transition-colors">
        <Icons.Folder />
        </button>
        </div>
        </div>
        <div className="p-3 bg-ink-800 rounded border border-ink-700 shadow-inner flex flex-col gap-2">
        <p className="font-display text-lg text-steel-200 tracking-wide truncate">{activeProject?.title}</p>
        <button
        onClick={onOpenScriptImport}
        className="w-full mt-2 py-2 text-[10px] font-mono text-cyan-500 border border-cyan-800/50 rounded-lg hover:bg-cyan-900/20 uppercase tracking-widest transition-colors"
        >
        📜 Import Script
        </button>
        <div className="flex flex-col gap-1 mt-2">
        <div className="flex gap-1">
        <button
        onClick={() => dispatch({ type: 'UPDATE_PROJECT', id: activeProject!.id, updates: { imageProvider: 'gemini' } })}
        className={`flex-1 text-[8px] font-mono py-1 rounded transition-colors ${activeProject?.imageProvider === 'gemini' ? 'bg-ember-500 text-ink-950 font-bold' : 'bg-ink-900 text-steel-600'}`}
        >
        GEMINI
        </button>
        <button
        onClick={() => dispatch({ type: 'UPDATE_PROJECT', id: activeProject!.id, updates: { imageProvider: 'fal-flux' } })}
        className={`flex-1 text-[8px] font-mono py-1 rounded transition-colors ${activeProject?.imageProvider === 'fal-flux' ? 'bg-ember-500 text-ink-950 font-bold' : 'bg-ink-900 text-steel-600'}`}
        >
        FAL.AI
        </button>
        </div>
        <button
        onClick={() => dispatch({ type: 'UPDATE_PROJECT', id: activeProject!.id, updates: { imageProvider: 'replicate-flux' } })}
        className={`w-full text-[8px] font-mono py-1 rounded transition-colors ${activeProject?.imageProvider === 'replicate-flux' ? 'bg-ember-500 text-ink-950 font-bold' : 'bg-ink-900 text-steel-600'}`}
        >
        REPLICATE FLUX
        </button>
        </div>

        {(activeProject?.imageProvider === 'fal-flux' || activeProject?.imageProvider === 'replicate-flux') && (
            <div className="mt-1 pt-2 border-t border-ink-700 space-y-2">
            <label className="text-[8px] font-mono text-steel-500 uppercase flex justify-between">
            <span>{activeProject?.imageProvider === 'fal-flux' ? 'fal.ai' : 'Replicate'} Key</span>
            {!sidebarKey && <span className="text-red-500 font-bold">MISSING!</span>}
            </label>
            <div className="flex gap-1">
            <input
            type="password"
            placeholder="Enter Key..."
            value={sidebarKey}
            onChange={(e) => setSidebarKey(e.target.value)}
            className="flex-1 bg-ink-950 border border-ink-700 rounded px-2 py-1 text-[9px] text-steel-300 focus:border-ember-500 outline-none"
            />
            <button
            onClick={() => {
                if (sidebarKey.trim()) {
                    if (activeProject?.imageProvider === 'fal-flux') {
                        dispatch({ type: 'UPDATE_PROJECT_FAL_KEY', projectId: activeProject.id, apiKey: sidebarKey.trim() });
                    } else {
                        dispatch({ type: 'UPDATE_PROJECT_REPLICATE_KEY', projectId: activeProject.id, apiKey: sidebarKey.trim() });
                    }
                    alert('Key saved!');
                }
            }}
            className="bg-ink-700 hover:bg-ember-500 text-steel-400 hover:text-ink-950 px-2 rounded text-[8px] transition-colors font-bold"
            >
            SET
            </button>
            </div>
            </div>
        )}
        </div>
        </div>

        <div>
        <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-mono text-steel-500 uppercase tracking-widest">{typeLabel}s</h2>
        <button
        onClick={() => activeProject && dispatch({ type: 'ADD_ISSUE', projectId: activeProject.id })}
        className="text-steel-400 hover:text-ember-500 transition-colors flex items-center gap-1 group"
        >
        <Icons.Plus />
        <span className="text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">NEW</span>
        </button>
        </div>

        <div className="space-y-4">
        {activeProject?.issues.map(iss => {
            const isActive = state.activeIssueId === iss.id;
            return (
                <div key={iss.id} className={`rounded-lg overflow-hidden transition-all border ${isActive ? 'border-ember-500/30 bg-ember-500/5' : 'border-ink-700'}`}>
                <div
                onClick={() => dispatch({ type: 'SET_ACTIVE_ISSUE', id: iss.id })}
                className={`px-3 py-2 flex items-center justify-between cursor-pointer group ${isActive ? 'bg-ember-500/10' : 'hover:bg-ink-800'}`}
                >
                <div className="flex items-center gap-2 overflow-hidden">
                <span className={`text-[10px] font-mono ${isActive ? 'text-ember-500' : 'text-steel-600'}`}>{isActive ? '●' : '○'}</span>
                <p className={`text-xs font-bold uppercase tracking-widest truncate ${isActive ? 'text-ember-500' : 'text-steel-400 group-hover:text-steel-200'}`}>{iss.title}</p>
                </div>
                <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-steel-600">{iss.pages.length}P</span>
                <button
                onClick={(e) => { e.stopPropagation(); if(confirm(`Delete ${iss.title}?`)) dispatch({ type: 'DELETE_ISSUE', issueId: iss.id }); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-steel-700 hover:text-red-500 transition-all"
                >
                <Icons.Trash />
                </button>
                </div>
                </div>

                {isActive && (
                    <div className="px-2 py-2 border-t border-ember-500/10 space-y-1 animate-fade-in">
                    {iss.pages.map(pg => (
                        <button
                        key={pg.id}
                        onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', id: pg.id })}
                        className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-mono transition-all flex justify-between items-center ${
                            state.activePageId === pg.id
                            ? 'bg-ember-500 text-ink-950 font-bold'
                            : 'text-steel-500 hover:bg-ink-700'
                        }`}
                        >
                        <span>PAGE {pg.number}</span>
                        <span className="opacity-40 text-[9px]">{pg.panels.length}F</span>
                        </button>
                    ))}
                    <button
                    onClick={() => dispatch({ type: 'ADD_PAGE', issueId: iss.id })}
                    className="w-full py-1 text-center text-[10px] font-mono text-steel-600 hover:text-ember-500 hover:bg-ink-800 rounded transition-all mt-1 uppercase tracking-tighter"
                    >
                    + Add Page
                    </button>
                    </div>
                )}
                </div>
            );
        })}
        </div>
        </div>

        <div>
        <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-mono text-steel-500 uppercase tracking-widest">Cast</h2>
        <button
        onClick={() => setShowCharForm(!showCharForm)}
        className={`transition-colors ${showCharForm ? 'text-ember-500 rotate-45' : 'text-steel-400 hover:text-ember-500'}`}
        >
        <Icons.Plus />
        </button>
        </div>

        {showCharForm && (
            <div className="mb-4 p-3 bg-ink-800 border border-ember-500/30 rounded-lg space-y-3 animate-fade-in shadow-xl">
            <input
            autoFocus
            placeholder="Name (e.g. Detective Jack)"
            value={charName}
            onChange={(e) => setCharName(e.target.value)}
            className="w-full bg-ink-950 border border-ink-700 rounded px-3 py-1.5 text-xs text-steel-200 focus:border-ember-500 outline-none font-bold"
            />
            <textarea
            placeholder="Description (age, vibe, key features...)"
            value={charDesc}
            onChange={(e) => setCharDesc(e.target.value)}
            rows={2}
            className="w-full bg-ink-950 border border-ink-700 rounded px-3 py-1.5 text-xs text-steel-400 focus:border-ember-500 outline-none resize-none italic"
            />
            <div className="flex gap-2">
            <button
            onClick={handleAddChar}
            className="flex-1 bg-ember-500 text-ink-950 font-bold py-1.5 rounded text-[10px] uppercase tracking-widest hover:bg-ember-400 transition-colors"
            >
            Save Cast
            </button>
            <button
            onClick={() => setShowCharForm(false)}
            className="px-3 py-1.5 border border-ink-700 text-steel-500 rounded text-[10px] uppercase hover:bg-ink-700"
            >
            Cancel
            </button>
            </div>
            </div>
        )}

        <div className="space-y-2">
        {activeProject?.characters.map(char => (
            <div key={char.id} className="group flex items-center justify-between p-2 bg-ink-800/50 rounded border border-ink-700/50">
            <div className="overflow-hidden">
            <p className="text-[11px] text-steel-300 font-bold truncate">{char.name}</p>
            <p className="text-[9px] text-steel-600 truncate italic">{char.description}</p>
            </div>
            <button
            onClick={() => dispatch({ type: 'DELETE_CHARACTER', id: char.id })}
            className="opacity-0 group-hover:opacity-100 text-red-500/50 hover:text-red-500 transition-all p-1"
            >
            <Icons.Trash />
            </button>
            </div>
        ))}
        {!activeProject?.characters.length && !showCharForm && (
            <p className="text-[10px] text-steel-700 italic text-center py-4 px-2 border border-dashed border-ink-700 rounded-lg">No cast members added yet.</p>
        )}
        </div>
        </div>
        </div>

        <div className="p-6 border-t border-ink-700 bg-ink-950 space-y-3">
        <h2 className="text-xs font-mono text-steel-500 uppercase tracking-widest px-1">Art Style</h2>
        <select
        value={activeProject?.style}
        onChange={(e) => dispatch({ type: 'UPDATE_PROJECT', id: activeProject!.id, updates: { style: e.target.value } })}
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
        </div>
        </aside>
    );
};

export default Sidebar;
