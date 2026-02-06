import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Trash2, ImageIcon, ChevronDown, Sparkles, Loader2, Move, Link2, Unlink, MessageCircle, Cloud, Type, Smartphone, Upload, RefreshCw, Copy, ClipboardPaste, History } from 'lucide-react';
import { Panel, Project, Character, AspectRatio, Page, TextElement, TextElementType } from '../types';
import { Action } from '../state/actions';
import { ASPECT_CONFIGS, ART_STYLES } from '../constants';
import { getImage, saveImage } from '../services/imageStorage';
import { genId } from '../utils/helpers';
import TextOverlay from './TextOverlay';

// Import all generation services
import { generateImage as generateGeminiImage } from '../services/geminiService';
import { generateLeonardoImage } from '../services/leonardoService';
import { generateGrokImage } from '../services/grokService';
import { generateFluxImage as generateFalFlux } from '../services/falFluxService';
import { generateSeaArtImage } from '../services/seaartService';
import { generateOpenAIImage } from '../services/openaiService';

// Helper to get a short appearance summary for a character
function getAppearanceSummary(char: Character): string {
    if (!char.appearance) return char.description || '';
    
    const parts: string[] = [];
    const a = char.appearance;
    
    if (a.build) parts.push(a.build);
    if (a.hairColor) parts.push(`${a.hairColor} hair`);
    if (a.eyeColor) parts.push(`${a.eyeColor} eyes`);
    if (a.distinguishingMarks) parts.push(a.distinguishingMarks);
    
    if (parts.length === 0 && char.description) return char.description;
    return parts.join(', ');
}

// Helper to build a full appearance description for image generation
function buildCharacterPrompt(char: Character): string {
    const parts: string[] = [char.name];
    
    if (char.appearance) {
        const a = char.appearance;
        const desc: string[] = [];
        
        if (a.age) desc.push(a.age);
        if (a.gender) desc.push(a.gender);
        if (a.ethnicity) desc.push(a.ethnicity);
        if (a.height) desc.push(a.height);
        if (a.build) desc.push(a.build);
        if (a.skinTone) desc.push(`${a.skinTone} skin`);
        if (a.hairColor && a.hairStyle) {
            desc.push(`${a.hairColor} ${a.hairStyle} hair`);
        } else if (a.hairColor) {
            desc.push(`${a.hairColor} hair`);
        } else if (a.hairStyle) {
            desc.push(`${a.hairStyle} hair`);
        }
        if (a.eyeColor) desc.push(`${a.eyeColor} eyes`);
        if (a.facialFeatures) desc.push(a.facialFeatures);
        if (a.distinguishingMarks) desc.push(a.distinguishingMarks);
        if (a.clothing) desc.push(`wearing ${a.clothing}`);
        if (a.accessories) desc.push(`with ${a.accessories}`);
        if (a.additionalNotes) desc.push(a.additionalNotes);
        
        if (desc.length > 0) {
            parts.push(`(${desc.join(', ')})`);
        }
    } else if (char.description) {
        parts.push(`(${char.description})`);
    }
    
    return parts.join(' ');
}

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
    isDragging?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
    copiedSettings?: { aspectRatio: AspectRatio; characterIds: string[] } | null;
    onCopySettings?: () => void;
    onPasteSettings?: () => void;
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
    isDragging: isDraggingProp = false,
    isSelected = false,
    onSelect,
    copiedSettings,
    onCopySettings,
    onPasteSettings,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAspectMenu, setShowAspectMenu] = useState(false);
    const [showCharMenu, setShowCharMenu] = useState(false);
    const [showRefMenu, setShowRefMenu] = useState(false);
    const [showPromptHistory, setShowPromptHistory] = useState(false);
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    
    // Resizing state
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
    
    // File upload ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use panel dimensions from state, with fallbacks
    const panelWidth = panel.width || 360;
    const panelHeight = panel.height || 420;

    const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingLocal } = useDraggable({ 
        id: panel.id,
        disabled: isOverlay || isResizing
    });

    const isDragging = isDraggingProp || isDraggingLocal;

    // Calculate style with absolute positioning
    const style: React.CSSProperties = {
        position: 'absolute',
        left: panel.x || 0,
        top: panel.y || 0,
        width: panelWidth,
        minHeight: panelHeight,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 1000 : (isSelected ? 100 : 1),
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        transition: isResizing ? 'none' : 'box-shadow 0.2s',
        outline: isSelected ? '3px solid #60a5fa' : undefined,
        outlineOffset: isSelected ? '2px' : undefined,
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
            startWidth: panelWidth,
            startHeight: panelHeight,
        };
    }, [panelWidth, panelHeight]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !resizeRef.current) return;
            
            const deltaX = e.clientX - resizeRef.current.startX;
            const deltaY = e.clientY - resizeRef.current.startY;
            
            const newWidth = Math.max(MIN_WIDTH, resizeRef.current.startWidth + deltaX);
            const newHeight = Math.max(MIN_HEIGHT, resizeRef.current.startHeight + deltaY);
            
            // Update panel dimensions in state
            dispatch({ 
                type: 'UPDATE_PANEL', 
                panelId: panel.id, 
                updates: { width: newWidth, height: newHeight } 
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
            // UPDATED: Support custom style prompt
            const styleConfig = ART_STYLES.find(s => s.id === project.style);
            const stylePrompt = project.style === 'custom' 
                ? (project.customStylePrompt || '') 
                : (styleConfig?.prompt || '');
            
            const activeChars = characters.filter(c => panel.characterIds.includes(c.id));
            // Use buildCharacterPrompt to get full appearance descriptions
            const charSection = activeChars.length > 0 
                ? `Characters: ${activeChars.map(c => buildCharacterPrompt(c)).join('; ')}.` 
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
            } else if (project.imageProvider === 'seaart' && project.seaartApiKey) {
                url = await generateSeaArtImage(fullPrompt, panel.aspectRatio, project.seaartApiKey, initImage, panel.referenceStrength ?? 0.7);
            } else if (project.imageProvider === 'openai' && project.openaiApiKey) {
                url = await generateOpenAIImage(fullPrompt, panel.aspectRatio, project.openaiApiKey, initImage, panel.referenceStrength ?? 0.7);
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

    // Handle image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('Image must be less than 10MB');
            return;
        }
        
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const dataUrl = event.target?.result as string;
                if (dataUrl) {
                    const storedRef = await saveImage(panel.id, dataUrl);
                    dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { imageUrl: storedRef } });
                }
            };
            reader.readAsDataURL(file);
        } catch (err: any) {
            console.error('Image upload failed:', err);
            alert('Failed to upload image');
        }
        
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Add text element (dialogue, thought, caption, phone)
    const handleAddTextElement = (type: TextElementType) => {
        const newElement: TextElement = {
            id: genId(),
            type,
            content: type === 'caption' ? 'Caption text...' : type === 'phone' ? 'Text message...' : 'Click to edit...',
            x: 10 + Math.random() * 20,
            y: 10 + Math.random() * 20,
            width: 30,
            height: 15,
            fontSize: type === 'caption' ? 14 : 16,
            color: '#000000',
            tailStyle: type === 'thought' ? 'cloud' : type === 'dialogue' ? 'pointy' : 'none',
        };
        dispatch({ type: 'ADD_TEXT_ELEMENT', panelId: panel.id, element: newElement });
    };

    const aspectConfig = ASPECT_CONFIGS[panel.aspectRatio];
    const selectedChars = characters.filter(c => panel.characterIds.includes(c.id));

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => {
                // Only select if clicking directly on the card (not on inputs, buttons, etc.)
                if (onSelect && (e.target as HTMLElement).closest('button, input, textarea, [contenteditable]') === null) {
                    onSelect();
                }
            }}
            className={`group rounded-xl border transition-all flex flex-col ${
                showGutters 
                    ? 'bg-white border-gray-300 shadow-lg hover:shadow-xl' 
                    : 'bg-ink-900 border-ink-700 shadow-2xl hover:shadow-ember-500/10'
            } ${isDragging ? 'ring-2 ring-ember-500 shadow-2xl' : ''} ${isResizing ? 'cursor-nwse-resize' : ''}`}
        >
            {/* Header with drag handle and controls */}
            <div className={`flex items-center justify-between px-3 py-2 border-b ${
                showGutters ? 'border-gray-200 bg-gray-50' : 'border-ink-800 bg-ink-950/50'
            } rounded-t-xl`}>
                <div className="flex items-center gap-2">
                    <div 
                        {...attributes} 
                        {...listeners} 
                        className="cursor-grab active:cursor-grabbing touch-none hover:text-ember-500 transition-colors p-1 -ml-1 rounded hover:bg-ink-800/50"
                        title="Drag to move"
                    >
                        <Move size={16} className={showGutters ? 'text-gray-400' : 'text-steel-600'} />
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
                    
                    {/* Copy settings button */}
                    {onCopySettings && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onCopySettings(); }}
                            className={`p-1 transition-colors ${showGutters ? 'text-gray-400 hover:text-blue-500' : 'text-steel-600 hover:text-ember-500'}`}
                            title="Copy panel settings (aspect ratio, characters)"
                        >
                            <Copy size={14} />
                        </button>
                    )}
                    
                    {/* Paste settings button */}
                    {onPasteSettings && copiedSettings && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onPasteSettings(); }}
                            className={`p-1 transition-colors ${showGutters ? 'text-gray-400 hover:text-blue-500' : 'text-steel-600 hover:text-ember-500'}`}
                            title="Paste panel settings"
                        >
                            <ClipboardPaste size={14} />
                        </button>
                    )}
                    
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
                {/* Hidden file input for image upload */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />

                {/* Image preview or placeholder */}
                <div className={`relative rounded-lg overflow-hidden ${aspectConfig?.class || 'aspect-video'} ${
                    showGutters ? 'bg-gray-100 border border-gray-200' : 'bg-ink-950 border border-ink-800'
                }`}>
                    {/* Sequence number badge - always visible */}
                    <div className="absolute top-2 left-2 z-20">
                        <div className="w-8 h-8 rounded-full bg-ember-500 text-white flex items-center justify-center font-bold text-sm shadow-lg">
                            {index + 1}
                        </div>
                    </div>

                    {imageDataUrl ? (
                        <>
                            <img 
                                src={imageDataUrl} 
                                alt={`Panel ${index + 1}`} 
                                className="w-full h-full object-cover"
                            />
                            
                            {/* Render text overlays */}
                            {panel.textElements.map(element => (
                                <TextOverlay
                                    key={element.id}
                                    element={element}
                                    panelId={panel.id}
                                    dispatch={dispatch}
                                />
                            ))}
                            
                            {/* Image controls toolbar */}
                            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={handleGenerateImage}
                                    disabled={isGenerating}
                                    className="p-1.5 bg-black/60 hover:bg-ember-500 text-white rounded-full transition-colors disabled:opacity-50"
                                    title="Regenerate image"
                                >
                                    <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} />
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1.5 bg-black/60 hover:bg-ember-500 text-white rounded-full transition-colors"
                                    title="Upload new image"
                                >
                                    <Upload size={12} />
                                </button>
                                <button
                                    onClick={handleClearImage}
                                    className="p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors"
                                    title="Clear image"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            
                            {/* Text element toolbar */}
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleAddTextElement('dialogue')}
                                    className="p-1.5 bg-black/60 hover:bg-ember-500 text-white rounded-lg transition-colors"
                                    title="Add dialogue bubble"
                                >
                                    <MessageCircle size={14} />
                                </button>
                                <button
                                    onClick={() => handleAddTextElement('thought')}
                                    className="p-1.5 bg-black/60 hover:bg-ember-500 text-white rounded-lg transition-colors"
                                    title="Add thought bubble"
                                >
                                    <Cloud size={14} />
                                </button>
                                <button
                                    onClick={() => handleAddTextElement('caption')}
                                    className="p-1.5 bg-black/60 hover:bg-ember-500 text-white rounded-lg transition-colors"
                                    title="Add caption box"
                                >
                                    <Type size={14} />
                                </button>
                                <button
                                    onClick={() => handleAddTextElement('phone')}
                                    className="p-1.5 bg-black/60 hover:bg-ember-500 text-white rounded-lg transition-colors"
                                    title="Add phone/text message"
                                >
                                    <Smartphone size={14} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <ImageIcon size={32} className={showGutters ? 'text-gray-300' : 'text-steel-600'} />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-ember-500 hover:bg-ember-400 text-white transition-colors"
                            >
                                <Upload size={14} />
                                Upload Image
                            </button>
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
                <div className="relative">
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
                    
                    {/* Prompt History Button */}
                    {panel.promptHistory && panel.promptHistory.length > 0 && (
                        <button
                            onClick={() => setShowPromptHistory(!showPromptHistory)}
                            className={`absolute right-2 top-2 p-1 rounded transition-colors ${
                                showGutters 
                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                                    : 'bg-ink-800 text-steel-500 hover:bg-ink-700'
                            }`}
                            title="View prompt history"
                        >
                            <History size={14} />
                        </button>
                    )}
                    
                    {/* Prompt History Dropdown */}
                    {showPromptHistory && panel.promptHistory && panel.promptHistory.length > 0 && (
                        <div className={`absolute right-0 top-full mt-1 z-50 rounded-lg shadow-xl border py-1 min-w-[300px] max-w-full max-h-64 overflow-y-auto ${
                            showGutters ? 'bg-white border-gray-200' : 'bg-ink-900 border-ink-700'
                        }`}>
                            <div className={`px-3 py-1.5 text-[10px] font-mono uppercase ${showGutters ? 'text-gray-500' : 'text-steel-600'}`}>
                                Prompt History
                            </div>
                            {[...panel.promptHistory].reverse().map((historyPrompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        handlePromptChange({ target: { value: historyPrompt } } as React.ChangeEvent<HTMLTextAreaElement>);
                                        setShowPromptHistory(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                        showGutters 
                                            ? 'text-gray-700 hover:bg-gray-100' 
                                            : 'text-steel-400 hover:bg-ink-800'
                                    }`}
                                >
                                    <div className={`text-[10px] mb-1 ${showGutters ? 'text-gray-500' : 'text-steel-600'}`}>
                                        {(panel.promptHistory?.length || 0) - idx} version{(panel.promptHistory?.length || 0) - idx === 1 ? '' : 's'} ago
                                    </div>
                                    <div className="line-clamp-3">
                                        {historyPrompt}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Character selector */}
                <div className="relative">
                    <label className={`block text-[10px] font-mono uppercase mb-1 ${showGutters ? 'text-gray-500' : 'text-steel-600'}`}>
                        Characters in this panel
                    </label>
                    {characters.length > 0 ? (
                        <>
                            <button
                                onClick={() => setShowCharMenu(!showCharMenu)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                                    selectedChars.length > 0
                                        ? 'bg-ember-500/10 border border-ember-500/30 text-ember-400'
                                        : showGutters 
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
                                <div className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-lg shadow-xl border py-1 max-h-48 overflow-y-auto ${
                                    showGutters ? 'bg-white border-gray-200' : 'bg-ink-900 border-ink-700'
                                }`}>
                                    {characters.map(char => {
                                        const isSelected = panel.characterIds.includes(char.id);
                                        const appearanceSummary = getAppearanceSummary(char);
                                        return (
                                            <button
                                                key={char.id}
                                                onClick={() => toggleCharacter(char.id)}
                                                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                                    isSelected
                                                        ? 'bg-ember-500/20'
                                                        : showGutters 
                                                            ? 'hover:bg-gray-100' 
                                                            : 'hover:bg-ink-800'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-3 h-3 rounded border flex-shrink-0 ${
                                                        isSelected 
                                                            ? 'bg-ember-500 border-ember-500' 
                                                            : showGutters ? 'border-gray-300' : 'border-ink-600'
                                                    }`} />
                                                    <span className={`font-bold ${isSelected ? 'text-ember-400' : showGutters ? 'text-gray-700' : 'text-steel-300'}`}>
                                                        {char.name}
                                                    </span>
                                                </div>
                                                {appearanceSummary && (
                                                    <p className={`mt-1 ml-5 text-[10px] leading-tight ${showGutters ? 'text-gray-500' : 'text-steel-600'}`}>
                                                        {appearanceSummary}
                                                    </p>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {/* Show selected character summaries */}
                            {selectedChars.length > 0 && (
                                <div className={`mt-2 space-y-1 text-[10px] ${showGutters ? 'text-gray-500' : 'text-steel-600'}`}>
                                    {selectedChars.map(char => {
                                        const summary = getAppearanceSummary(char);
                                        return summary ? (
                                            <div key={char.id} className="flex gap-1">
                                                <span className="font-bold text-ember-500">{char.name}:</span>
                                                <span className="truncate">{summary}</span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className={`text-xs ${showGutters ? 'text-gray-400' : 'text-steel-600'}`}>
                            No characters defined. Use the CHARACTERS button to add some.
                        </p>
                    )}
                </div>

                {/* Reference Panel Selector - for consistency between panels */}
                {activePage.panels.length > 1 && (
                    <div className="relative">
                        <button
                            onClick={() => setShowRefMenu(!showRefMenu)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                                panel.referencePanelId
                                    ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                                    : showGutters 
                                        ? 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100' 
                                        : 'bg-ink-950 border border-ink-800 text-steel-500 hover:bg-ink-900'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Link2 size={12} />
                                {panel.referencePanelId 
                                    ? `Linked to Panel ${activePage.panels.findIndex(p => p.id === panel.referencePanelId) + 1}`
                                    : 'Link to previous panel...'}
                            </span>
                            <ChevronDown size={14} />
                        </button>
                        {showRefMenu && (
                            <div className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-lg shadow-xl border py-1 max-h-48 overflow-y-auto ${
                                showGutters ? 'bg-white border-gray-200' : 'bg-ink-900 border-ink-700'
                            }`}>
                                {/* Option to unlink */}
                                <button
                                    onClick={() => {
                                        dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { referencePanelId: undefined } });
                                        setShowRefMenu(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                                        !panel.referencePanelId
                                            ? 'bg-ember-500/20 text-ember-500'
                                            : showGutters 
                                                ? 'text-gray-600 hover:bg-gray-100' 
                                                : 'text-steel-400 hover:bg-ink-800'
                                    }`}
                                >
                                    <Unlink size={12} />
                                    <span>No reference (standalone)</span>
                                </button>
                                
                                {/* List other panels with images */}
                                {activePage.panels
                                    .filter(p => p.id !== panel.id && p.imageUrl)
                                    .map((refPanel, idx) => {
                                        const panelNum = activePage.panels.findIndex(p => p.id === refPanel.id) + 1;
                                        return (
                                            <button
                                                key={refPanel.id}
                                                onClick={() => {
                                                    dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { referencePanelId: refPanel.id } });
                                                    setShowRefMenu(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                                                    panel.referencePanelId === refPanel.id
                                                        ? 'bg-cyan-500/20 text-cyan-400'
                                                        : showGutters 
                                                            ? 'text-gray-600 hover:bg-gray-100' 
                                                            : 'text-steel-400 hover:bg-ink-800'
                                                }`}
                                            >
                                                <Link2 size={12} />
                                                <span className="font-bold">Panel {panelNum}</span>
                                                <span className="opacity-60 text-[10px] truncate flex-1">
                                                    {refPanel.prompt?.slice(0, 30) || 'No prompt'}...
                                                </span>
                                            </button>
                                        );
                                    })}
                                
                                {activePage.panels.filter(p => p.id !== panel.id && p.imageUrl).length === 0 && (
                                    <div className={`px-3 py-2 text-xs italic ${showGutters ? 'text-gray-400' : 'text-steel-600'}`}>
                                        No other panels with images yet
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Reference Strength Slider */}
                        {panel.referencePanelId && (
                            <div className="mt-2 px-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[9px] font-mono uppercase ${showGutters ? 'text-gray-500' : 'text-steel-600'}`}>
                                        Consistency Strength
                                    </span>
                                    <span className={`text-[9px] font-mono ${showGutters ? 'text-gray-600' : 'text-steel-400'}`}>
                                        {Math.round((panel.referenceStrength || 0.7) * 100)}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={panel.referenceStrength || 0.7}
                                    onChange={(e) => dispatch({ 
                                        type: 'UPDATE_PANEL', 
                                        panelId: panel.id, 
                                        updates: { referenceStrength: parseFloat(e.target.value) } 
                                    })}
                                    className="w-full h-1 bg-ink-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                                <div className={`flex justify-between text-[8px] font-mono mt-0.5 ${showGutters ? 'text-gray-400' : 'text-steel-700'}`}>
                                    <span>Creative</span>
                                    <span>Consistent</span>
                                </div>
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
