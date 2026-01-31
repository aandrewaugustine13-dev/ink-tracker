import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, ImageIcon, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { Panel, Project, Character, AspectRatio, Page } from '../types';
import { Action } from '../state/actions';
import { ASPECT_CONFIGS, ART_STYLES } from '../constants';
import { getImage, saveImage } from '../services/imageStorage';

// Import all generation services
import { generateImage as generateGeminiImage } from '../services/geminiService';
import { generateLeonardoImage } from '../services/leonardoService';
import { generateGrokImage } from '../services/grokService';
import { generateFluxImage as generateFalFlux } from '../services/falFluxService';

interface PanelCardProps {
    panel: Panel;
    pageId: string;
    dispatch: React.Dispatch<Action>;
    project: Project;
    characters: Character[];
    index: number;
    total: number;
    showGutters?: boolean;
    activePage: Page;
    isOverlay?: boolean;
}

const MIN_WIDTH = 280;
const MIN_HEIGHT = 200;

const PanelCard: React.FC<PanelCardProps> = ({
    panel,
    pageId,
    dispatch,
    project,
    characters,
    index,
    total,
    showGutters = false,
    activePage,
    isOverlay = false,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAspectMenu, setShowAspectMenu] = useState(false);
    const [showCharMenu, setShowCharMenu] = useState(false);
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    
    // Resizing state
    const [dimensions, setDimensions] = useState({ width: 360, height: 420 });
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
        id: panel.id,
        disabled: isOverlay || isResizing
    });

    const style = {
        transition: isResizing ? 'none' : transition,
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        width: `${dimensions.width}px`,
        minHeight: `${dimensions.height}px`,
    };

    // Load image from IndexedDB if needed
    useEffect(() => {
        const loadImage = async () => {
            if (panel.imageUrl?.startsWith('idb://')) {
                const id = panel.imageUrl.replace('idb://', '');
                const dataUrl = await getImage(id);
                setImageDataUrl(dataUrl || null);
            } else if (panel.imageUrl) {
                setImageDataUrl(panel.imageUrl);
            } else {
                setImageDataUrl(null);
            }
        };
        loadImage();
    }, [panel.imageUrl]);

    // Handle resize
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startWidth: dimensions.width,
            startHeight: dimensions.height,
        };
    }, [dimensions]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !resizeRef.current) return;
            
            const deltaX = e.clientX - resizeRef.current.startX;
            const deltaY = e.clientY - resizeRef.current.startY;
            
            setDimensions({
                width: Math.max(MIN_WIDTH, resizeRef.current.startWidth + deltaX),
                height: Math.max(MIN_HEIGHT, resizeRef.current.startHeight + deltaY),
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            resizeRef.current = null;
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Generate image for this panel
    const handleGenerateImage = async () => {
        if (!panel.prompt?.trim() && panel.characterIds.length === 0) {
            alert('Please enter a prompt or select characters first.');
            return;
        }

        setIsGenerating(true);
        
        try {
            // Build prompt with style and characters
            const styleConfig = ART_STYLES.find(s => s.id === project.style);
            const stylePrompt = styleConfig?.prompt || '';
            const activeChars = characters.filter(c => panel.characterIds.includes(c.id));
            const charSection = activeChars.length > 0 
                ? `Characters: ${activeChars.map(c => `${c.name} (${c.description})`).join(', ')}.` 
                : '';
            const config = ASPECT_CONFIGS[panel.aspectRatio];
            
            // Get reference image if set
            let initImage: string | undefined;
            if (panel.referencePanelId) {
                const refPanel = activePage.panels.find(p => p.id === panel.referencePanelId);
                if (refPanel?.imageUrl) {
                    const id = refPanel.imageUrl.startsWith('idb://') ? refPanel.imageUrl.slice(6) : null;
                    if (id) initImage = await getImage(id) || undefined;
                }
            }

            const consistencySuffix = initImage 
                ? " Maintain strong visual and character consistency with the reference image. Same lighting, angle, style."
                : '';
            const fullPrompt = `${stylePrompt}. ${charSection} ${panel.prompt || ''}.${consistencySuffix}`.trim();

            let url: string | undefined;

            // Call the appropriate service based on provider
            if (project.imageProvider === 'gemini' && project.geminiApiKey) {
                url = await generateGeminiImage(fullPrompt, config.ratio, project.geminiApiKey, initImage, panel.referenceStrength ?? 0.7);
            } else if (project.imageProvider === 'leonardo' && project.leonardoApiKey) {
                url = await generateLeonardoImage(fullPrompt, panel.aspectRatio, project.leonardoApiKey, initImage, panel.referenceStrength ?? 0.7);
            } else if (project.imageProvider === 'grok' && project.grokApiKey) {
                url = await generateGrokImage(fullPrompt, panel.aspectRatio, project.grokApiKey, initImage, panel.referenceStrength ?? 0.7);
            } else if (project.imageProvider === 'fal' && project.falApiKey) {
                url = await generateFalFlux(fullPrompt, panel.aspectRatio, project.falApiKey, project.fluxModel || 'fal-ai/flux-pro', initImage, panel.referenceStrength ?? 0.7);
            } else {
                throw new Error(`No API key configured for ${project.imageProvider}. Please add your API key in the sidebar.`);
            }

            if (url) {
                const storedRef = await saveImage(panel.id, url);
                dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { imageUrl: storedRef } });
            }
        } catch (err: any) {
            console.error('Image generation failed:', err);
            alert(`Generation failed: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { prompt: e.target.value } });
    };

    const handleAspectChange = (ratio: AspectRatio) => {
        dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { aspectRatio: ratio } });
        setShowAspectMenu(false);
    };

    const toggleCharacter = (charId: string) => {
        const newIds = panel.characterIds.includes(charId)
            ? panel.characterIds.filter(id => id !== charId)
            : [...panel.characterIds, charId];
        dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { characterIds: newIds } });
    };

    const handleDelete = () => {
        if (confirm('Delete this frame?')) {
            dispatch({ type: 'DELETE_PANEL', panelId: panel.id, pageId });
        }
    };

    const handleClearImage = () => {
        dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { imageUrl: undefined } });
        setImageDataUrl(null);
    };

    const aspectConfig = ASPECT_CONFIGS[panel.aspectRatio];
    const selectedChars = characters.filter(c => panel.characterIds.includes(c.id));

    return (
        <div
            ref={(node) => {
                setNodeRef(node);
                (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }}
            style={style}
            className={`relative group rounded-xl border transition-all flex flex-col ${
                showGutters 
                    ? 'bg-white border-gray-300 shadow-lg' 
                    : 'bg-ink-900 border-ink-700 shadow-2xl'
            } ${isDragging ? 'ring-2 ring-ember-500' : ''} ${isResizing ? 'cursor-nwse-resize' : ''}`}
        >
            {/* Header with drag handle and controls */}
            <div className={`flex items-center justify-between px-3 py-2 border-b ${
                showGutters ? 'border-gray-200 bg-gray-50' : 'border-ink-800 bg-ink-950/50'
            } rounded-t-xl`}>
                <div className="flex items-center gap-2">
                    <div 
                        {...attributes} 
                        {...listeners} 
                        className="cursor-grab touch-none hover:text-ember-500 transition-colors"
                    >
                        <GripVertical size={18} className={showGutters ? 'text-gray-400' : 'text-steel-600'} />
                    </div>
                    <span className={`text-xs font-mono font-bold ${showGutters ? 'text-gray-600' : 'text-steel-400'}`}>
                        {index + 1}/{total}
                    </span>
                </div>
                
                <div className="flex items-center gap-1">
                    {/* Aspect ratio selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowAspectMenu(!showAspectMenu)}
                            className={`text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                                showGutters 
                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                                    : 'bg-ink-800 text-steel-500 hover:bg-ink-700'
                            }`}
                        >
                            {aspectConfig?.label.split(' ')[0]}
                            <ChevronDown size={12} />
                        </button>
                        {showAspectMenu && (
                            <div className={`absolute right-0 top-full mt-1 z-50 rounded-lg shadow-xl border py-1 min-w-[140px] ${
                                showGutters ? 'bg-white border-gray-200' : 'bg-ink-900 border-ink-700'
                            }`}>
                                {Object.entries(ASPECT_CONFIGS).map(([key, cfg]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleAspectChange(key as AspectRatio)}
                                        className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${
                                            panel.aspectRatio === key
                                                ? 'bg-ember-500 text-ink-950'
                                                : showGutters 
                                                    ? 'text-gray-600 hover:bg-gray-100' 
                                                    : 'text-steel-400 hover:bg-ink-800'
                                        }`}
                                    >
                                        {cfg.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={handleDelete}
                        className="p-1 text-steel-600 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 scrollbar-thin scrollbar-thumb-ink-700 scrollbar-track-transparent">
                {/* Image preview or placeholder */}
                <div className={`relative rounded-lg overflow-hidden ${aspectConfig?.class || 'aspect-video'} ${
                    showGutters ? 'bg-gray-100 border border-gray-200' : 'bg-ink-950 border border-ink-800'
                }`}>
                    {imageDataUrl ? (
                        <>
                            <img 
                                src={imageDataUrl} 
                                alt={`Panel ${index + 1}`} 
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={handleClearImage}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                title="Clear image"
                            >
                                <Trash2 size={12} />
                            </button>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <ImageIcon size={32} className={showGutters ? 'text-gray-300' : 'text-ink-800'} />
                            <span className={`text-[10px] font-mono ${showGutters ? 'text-gray-400' : 'text-ink-700'}`}>
                                No image yet
                            </span>
                        </div>
                    )}
                    
                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <Loader2 size={32} className="text-ember-500 animate-spin" />
                        </div>
                    )}
                </div>

                {/* Prompt textarea */}
                <textarea
                    value={panel.prompt || ''}
                    onChange={handlePromptChange}
                    placeholder="Describe this panel... (scene, action, mood)"
                    rows={3}
                    className={`w-full rounded-lg px-3 py-2 text-sm resize-none transition-colors outline-none ${
                        showGutters 
                            ? 'bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-blue-400' 
                            : 'bg-ink-950 border border-ink-800 text-steel-200 placeholder-steel-600 focus:border-ember-500'
                    }`}
                />

                {/* Character selector */}
                {characters.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => setShowCharMenu(!showCharMenu)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                                showGutters 
                                    ? 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100' 
                                    : 'bg-ink-950 border border-ink-800 text-steel-500 hover:bg-ink-900'
                            }`}
                        >
                            <span>
                                {selectedChars.length > 0 
                                    ? selectedChars.map(c => c.name).join(', ')
                                    : 'Select characters...'}
                            </span>
                            <ChevronDown size={14} />
                        </button>
                        {showCharMenu && (
                            <div className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-lg shadow-xl border py-1 max-h-40 overflow-y-auto ${
                                showGutters ? 'bg-white border-gray-200' : 'bg-ink-900 border-ink-700'
                            }`}>
                                {characters.map(char => (
                                    <button
                                        key={char.id}
                                        onClick={() => toggleCharacter(char.id)}
                                        className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                                            panel.characterIds.includes(char.id)
                                                ? 'bg-ember-500/20 text-ember-500'
                                                : showGutters 
                                                    ? 'text-gray-600 hover:bg-gray-100' 
                                                    : 'text-steel-400 hover:bg-ink-800'
                                        }`}
                                    >
                                        <span className={`w-3 h-3 rounded border ${
                                            panel.characterIds.includes(char.id) 
                                                ? 'bg-ember-500 border-ember-500' 
                                                : showGutters ? 'border-gray-300' : 'border-ink-600'
                                        }`} />
                                        <span className="font-bold">{char.name}</span>
                                        <span className="opacity-60 text-[10px] truncate">{char.description}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Generate button footer */}
            <div className={`px-3 py-2 border-t ${
                showGutters ? 'border-gray-200 bg-gray-50' : 'border-ink-800 bg-ink-950/50'
            } rounded-b-xl`}>
                <button
                    onClick={handleGenerateImage}
                    disabled={isGenerating || (!panel.prompt?.trim() && panel.characterIds.length === 0)}
                    className={`w-full py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        showGutters 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                            : 'bg-ember-500 hover:bg-ember-400 text-ink-950'
                    }`}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles size={14} />
                            Generate
                        </>
                    )}
                </button>
            </div>

            {/* Resize handle */}
            <div
                onMouseDown={handleResizeStart}
                className={`absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity ${
                    showGutters ? 'text-gray-400' : 'text-steel-600'
                }`}
                style={{ 
                    background: 'linear-gradient(135deg, transparent 50%, currentColor 50%)',
                    borderBottomRightRadius: '0.75rem'
                }}
            />
        </div>
    );
};

export default PanelCard;
