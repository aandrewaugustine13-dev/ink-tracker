import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Panel,
    Character,
    Project,
    Page,
    AspectRatio,
    TextElement,
    TextElementType
} from '../types';
import { Action } from '../state/actions';
import { ASPECT_CONFIGS, ART_STYLES, Icons } from '../constants';
import { generateImage, improvePrompt } from '../services/geminiService';
import { generateFluxImage as generateFalFlux } from '../services/falFluxService';
import { generateFluxImage as generateReplicateFlux } from '../services/replicateFluxService';
import { saveImage, getImage } from '../services/imageStorage';
import { useIndexedDBImage } from '../hooks/useIndexedDBImage';
import TextOverlay from './TextOverlay';
import { genId } from '../utils/helpers';

interface PanelCardProps {
    panel: Panel;
    pageId: string;
    dispatch: React.Dispatch<Action>;
    project: Project;
    characters: Character[];
    index: number;
    total: number;
    showGutters: boolean;
    activePage: Page;
    isOverlay?: boolean;
}

const PanelCard: React.FC<PanelCardProps> = ({
    panel,
    pageId,
    dispatch,
    project,
    characters,
    index,
    total,
    showGutters,
    activePage,
    isOverlay
}) => {
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editPrompt, setEditPrompt] = useState('');
    const config = ASPECT_CONFIGS[panel.aspectRatio];

    const resolvedImageUrl = useIndexedDBImage(panel.imageUrl);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: panel.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging && !isOverlay ? 0.3 : 1,
    };

    const handleGenerate = async () => {
        if (!panel.prompt && panel.characterIds.length === 0) return;
        setLoading(true);
        try {
            const styleConfig = ART_STYLES.find(s => s.id === project.style);
            const stylePrompt = styleConfig?.prompt || '';
            const activeChars = characters.filter(c => panel.characterIds.includes(c.id));
            const charSection = activeChars.length > 0 ? `Characters: ${activeChars.map(c => c.name).join(', ')}.` : '';

            let initImage: string | undefined;
            if (panel.referencePanelId) {
                const refPanel = activePage.panels.find(p => p.id === panel.referencePanelId);
                if (refPanel?.imageUrl) {
                    const id = refPanel.imageUrl.startsWith('idb://') ? refPanel.imageUrl.slice(6) : null;
                    if (id) initImage = await getImage(id) || undefined;
                }
            }

            const consistencySuffix = " Maintain strong visual and character consistency with the reference image. Same lighting, angle, style.";
            const basePrompt = editing ? editPrompt : panel.prompt;
            const fullPrompt = `${stylePrompt}. ${charSection} Scene: ${basePrompt}.${initImage ? consistencySuffix : ''}`.trim();

            let url: string | undefined;
            const strength = panel.referenceStrength ?? 0.7;

            if (project.imageProvider === 'gemini') {
                url = await generateImage(fullPrompt, config.ratio, initImage, strength);
            } else if (project.imageProvider === 'fal-flux' && project.falApiKey) {
                url = await generateFalFlux(fullPrompt, panel.aspectRatio, project.falApiKey, project.fluxModel, initImage, strength);
            } else if (project.imageProvider === 'replicate-flux' && project.replicateApiKey) {
                url = await generateReplicateFlux(fullPrompt, panel.aspectRatio, project.replicateApiKey, project.replicateModel, initImage, strength);
            }

            if (url) {
                const storedRef = await saveImage(panel.id, url);
                dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { imageUrl: storedRef } });
                setEditing(false);
            }
        } catch (e: any) {
            console.error('Generation failed:', e);
            alert(`Failed: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const addText = (type: TextElementType) => {
        const element: TextElement = {
            id: genId(),
            type,
            content: type === 'caption' ? 'CAPTION' : 'DIALOGUE',
            x: 35,
            y: 35,
            width: 30,
            height: 10,
            fontSize: 22,
            color: '#000000',
            rotation: 0,
            tailX: 45,
            tailY: 55,
            tailStyle: type === 'thought' ? 'cloud' : (type === 'caption' ? 'none' : 'pointy')
        };
        dispatch({ type: 'ADD_TEXT_ELEMENT', panelId: panel.id, element });
    };

    return (
        <div
        ref={setNodeRef}
        style={isOverlay ? undefined : style}
        className={`bg-ink-800 border border-ink-700 rounded-xl overflow-hidden group flex flex-col h-full min-h-0 animate-fade-in relative transition-all ${isOverlay ? 'scale-[1.05] shadow-2xl ring-2 ring-ember-500 z-[1000]' : ''} ${showGutters ? 'p-4 bg-white ring-8 ring-white shadow-[10px_10px_20px_rgba(0,0,0,0.5)] border-4 border-black' : ''}`}
        >
        <div
        {...attributes}
        {...listeners}
        className={`relative flex items-center justify-between bg-ink-900/50 border-b border-ink-700 cursor-grab active:cursor-grabbing select-none flex-shrink-0 ${showGutters ? 'bg-gray-100 border-b-2 border-black -mt-4 -mx-4 px-4' : ''}`}
        >
        <div className="flex-1 flex items-center gap-3 px-4 py-3">
        <div className={`${showGutters ? 'text-black' : 'text-steel-600 group-hover:text-ember-500'} transition-colors flex items-center gap-2`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
        {panel.referencePanelId && <span title="Linked to previous panel" className="text-ember-500 animate-pulse"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg></span>}
        </div>
        <span className={`font-display text-xl tracking-wider whitespace-nowrap ${showGutters ? 'text-black' : 'text-ember-500'}`}>FRAME {index + 1}</span>
        </div>
        <div className="flex items-center gap-2 pr-4 pointer-events-auto">
        <button
        onClick={(e) => {
            e.stopPropagation();
            const prevIndex = activePage.panels.findIndex(p => p.id === panel.id) - 1;
            if (prevIndex >= 0) {
                const prevId = activePage.panels[prevIndex].id;
                const newRefId = panel.referencePanelId ? undefined : prevId;
                dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { referencePanelId: newRefId, referenceStrength: 0.7 } });
            } else {
                alert("No previous panel to reference.");
            }
        }}
        disabled={index === 0}
        className={`p-1.5 rounded transition-colors ${panel.referencePanelId ? 'bg-ember-500 text-ink-950' : (showGutters ? 'text-black hover:bg-gray-200' : 'text-steel-400 hover:text-ember-500')}`}
        title={panel.referencePanelId ? "Clear reference linkage" : "Link to previous panel (img2img)"}
        >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>
        </button>

        <select value={panel.aspectRatio} onChange={(e) => dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { aspectRatio: e.target.value as AspectRatio } })} className={`bg-transparent border border-ink-700 rounded px-2 py-0.5 text-[10px] font-mono text-steel-400 focus:outline-none uppercase ${showGutters ? 'text-black border-black font-bold' : ''}`}>
        {Object.entries(ASPECT_CONFIGS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={() => dispatch({ type: 'DELETE_PANEL', panelId: panel.id, pageId })} className={`${showGutters ? 'text-black hover:text-red-600' : 'text-steel-600 hover:text-red-500'} transition-colors p-1`}><Icons.Trash /></button>
        </div>
        </div>

        <div className={`relative ${config.class} bg-ink-950 flex items-center justify-center overflow-hidden border-b border-ink-700 group/canvas pointer-events-auto flex-shrink-0 w-full h-auto ${showGutters ? 'border-b-2 border-black' : ''}`}>
        {loading && (
            <div className="absolute inset-0 z-[250] bg-ink-950/90 backdrop-blur flex flex-col items-center justify-center text-ember-500 gap-3 text-center p-4">
            <Icons.Loader /><span className="text-xs font-mono uppercase tracking-[0.2em] animate-pulse">{panel.referencePanelId ? 'Applying Link...' : 'Rendering...'}</span>
            </div>
        )}
        {resolvedImageUrl ? (
            <>
            <img src={resolvedImageUrl} className="w-full h-full object-cover pointer-events-none" alt="" />
            {panel.textElements.map(te => <TextOverlay key={te.id} element={te} panelId={panel.id} dispatch={dispatch} />)}
            </>
        ) : (
            <div className="text-ink-700 flex flex-col items-center gap-4 opacity-50"><Icons.Sparkle /><span className="text-[10px] font-mono uppercase tracking-widest">Uninked</span></div>
        )}
        {resolvedImageUrl && !loading && (
            <div className="absolute bottom-4 right-4 opacity-0 group-hover/canvas:opacity-100 transition-opacity flex gap-2 z-[150]">
            <button onClick={() => setEditing(!editing)} className="bg-ink-950/80 hover:bg-ember-500 text-white p-2.5 rounded-full backdrop-blur-xl transition-all shadow-2xl border border-white/10" title="Edit Image"><Icons.Edit /></button>
            <button onClick={handleGenerate} className="bg-ink-950/80 hover:bg-ember-500 text-white p-2.5 rounded-full backdrop-blur-xl transition-all shadow-2xl border border-white/10" title="Regenerate"><Icons.Sparkle /></button>
            </div>
        )}
        </div>

        <div className={`p-5 flex-1 flex flex-col space-y-4 pointer-events-auto min-h-0 ${showGutters ? 'bg-white' : ''}`}>
        {editing ? (
            <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between"><label className="text-[10px] font-mono text-ember-500 uppercase tracking-widest">In-painting Prompt</label><button onClick={() => setEditing(false)} className="text-steel-600 hover:text-white"><Icons.X /></button></div>
            <input autoFocus placeholder="Describe changes..." value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerate()} className={`w-full bg-ink-900 border-2 border-ink-700 rounded-lg px-3 py-2 text-sm text-steel-300 focus:outline-none focus:border-ember-500 transition-colors ${showGutters ? 'bg-gray-100 border-black text-black' : ''}`} />
            <button onClick={handleGenerate} className="w-full bg-ember-500 text-ink-950 text-xs font-bold py-2 rounded-lg uppercase tracking-widest transition-transform active:scale-95">Apply Edits</button>
            </div>
        ) : (
            <div className="space-y-4 flex flex-col flex-1">
            <div className="flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
            <p className={`text-[10px] font-mono uppercase tracking-widest ${showGutters ? 'text-black' : 'text-steel-500'}`}>Cast</p>
            {panel.referencePanelId && (
                <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-ember-500 uppercase font-bold">Strength</span>
                <input
                type="range" min="0.1" max="0.9" step="0.05"
                value={panel.referenceStrength ?? 0.7}
                onChange={(e) => dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { referenceStrength: parseFloat(e.target.value) } })}
                className="w-16 accent-ember-500 scale-75"
                title="Lower = More Creative Change, Higher = Closer to Reference"
                />
                </div>
            )}
            </div>
            <div className="flex flex-wrap gap-1.5">
            {characters.map(char => (
                <button key={char.id} onClick={() => { const ids = panel.characterIds.includes(char.id) ? panel.characterIds.filter(id => id !== char.id) : [...panel.characterIds, char.id]; dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { characterIds: ids } }); }} className={`text-[9px] font-mono px-2.5 py-1 rounded-full transition-all border ${panel.characterIds.includes(char.id) ? 'bg-ember-500 border-ember-500 text-ink-950 font-bold' : (showGutters ? 'bg-white border-black text-black hover:bg-gray-100' : 'bg-ink-900 border-ink-700 text-steel-500 hover:border-steel-500')}`}>{char.name}</button>
            ))}
            </div>
            </div>
            <div className="relative flex-1 flex flex-col min-h-[60px]">
            <p className={`text-[10px] font-mono uppercase mb-2 tracking-widest flex-shrink-0 ${showGutters ? 'text-black' : 'text-steel-500'}`}>Script</p>
            <textarea placeholder="Action description..." value={panel.prompt} onChange={(e) => dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { prompt: e.target.value } })} className={`w-full flex-1 bg-ink-900/50 border border-ink-700 rounded-lg p-3 text-sm text-steel-300 font-serif italic resize-none focus:outline-none focus:border-ember-500/50 transition-colors ${showGutters ? 'bg-white border-black text-black border-2' : ''}`} />
            <button onClick={async () => { if (!panel.prompt) return; const res = await improvePrompt(panel.prompt); dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { prompt: res } }); }} className={`absolute bottom-3 right-3 transition-colors ${showGutters ? 'text-black hover:text-ember-600' : 'text-steel-600 hover:text-ember-500'}`} title="Refine Direction"><Icons.Magic /></button>
            </div>
            <div className={`flex items-center justify-between pt-2 border-t flex-shrink-0 ${showGutters ? 'border-black' : 'border-ink-700/50'}`}>
            <div className="flex gap-1">
            <button onClick={() => addText('dialogue')} className={`p-2 transition-colors rounded-lg ${showGutters ? 'text-black hover:bg-gray-200' : 'text-steel-500 hover:text-ember-500 hover:bg-ink-900'}`} title="Speech"><Icons.Chat /></button>
            <button onClick={() => addText('thought')} className={`p-2 transition-colors rounded-lg ${showGutters ? 'text-black hover:bg-gray-200' : 'text-steel-500 hover:text-ember-500 hover:bg-ink-900'}`} title="Thought"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h.01M10 10h.01M7 14h.01M17 14h.01M12 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
            <button onClick={() => addText('caption')} className={`p-2 transition-colors rounded-lg ${showGutters ? 'text-black hover:bg-gray-200' : 'text-steel-500 hover:text-ember-500 hover:bg-ink-900'}`} title="Narrative"><Icons.Caption /></button>
            </div>
            <button disabled={(!panel.prompt && panel.characterIds.length === 0) || loading} onClick={handleGenerate} className={`text-[10px] font-bold py-2.5 px-6 rounded-lg uppercase tracking-widest transition-all disabled:opacity-20 flex items-center gap-2 ${showGutters ? 'bg-black text-white hover:bg-gray-800' : 'bg-ink-700 hover:bg-ember-500 hover:text-ink-950 text-steel-300'}`}>{resolvedImageUrl ? 'Redraw' : 'Ink'}</button>
            </div>
            </div>
        )}
        </div>
        </div>
    );
};

export default PanelCard;
