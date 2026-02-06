import React, { useState, useReducer, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
  Modifier
} from '@dnd-kit/core';
import {
  TransformWrapper,
  TransformComponent,
  useTransformContext
} from 'react-zoom-pan-pinch';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { Undo2, Redo2, LayoutGrid, Grid2X2, Grid3X3, Columns, Square, RectangleHorizontal, FileImage, FileText, Play, X, ChevronLeft, ChevronRight, RefreshCw, Copy, ClipboardPaste, Users, Sparkles, Loader2, BookOpen } from 'lucide-react';

import {
  Page,
  Issue,
  Character,
  AspectRatio,
  Project
} from './types';
import { historyReducer, createInitialHistoryState, canUndo, canRedo } from './state/reducer';
import { createInitialState, normalizeProjects } from './state/initialState';
import { Action } from './state/actions';
import { genId } from './utils/helpers';
import { getImage, saveImage } from './services/imageStorage';
import { ART_STYLES, Icons, ASPECT_CONFIGS, GENERATION_DELAY_MS } from './constants';
import { ScriptImportModal } from './components/ScriptImportModal';
import { ParseResult } from './services/scriptParser';

import Sidebar from './components/Sidebar';
import PanelCard from './components/PanelCard';
import ZoomControls from './components/ZoomControls';
import ProjectHub from './components/ProjectHub';
import CharacterBank from './components/CharacterBank';
import UserGuide from './components/UserGuide';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useCloudSync } from './hooks/useCloudSync';
import { SyncIndicator } from './components/SyncIndicator';
import { useImageGeneration } from './hooks/useImageGeneration';

import { generateImage as generateGeminiImage } from './services/geminiService';
import { generateLeonardoImage } from './services/leonardoService';
import { generateGrokImage } from './services/grokService';
import { generateFluxImage as generateFalFlux } from './services/falFluxService';
import { generateSeaArtImage } from './services/seaartService';

/**
 * Helper to build a full appearance description for image generation
 */
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

/**
 * Custom modifier for dnd-kit to handle the scale factor from react-zoom-pan-pinch.
 * Without this, the drag overlay moves at a different speed than the mouse when zoomed.
 */
const createScaleModifier = (scale: number): Modifier => ({ transform }) => {
  return {
    ...transform,
    x: transform.x / scale,
    y: transform.y / scale,
  };
};

function AppContent() {
  const { user, signOut, loading } = useAuth();
  const [stateWithHistory, dispatchWithHistory] = useReducer(
    historyReducer,
    null,
    () => createInitialHistoryState(createInitialState())
  );
  
  // Extract present state and create dispatch wrapper
  const state = stateWithHistory.present;
  const dispatch = dispatchWithHistory as React.Dispatch<Action>;

  const activeProjectIdRef = useRef<string | null>(state.activeProjectId);

  useEffect(() => {
    activeProjectIdRef.current = state.activeProjectId;
  }, [state.activeProjectId]);

  const handleCloudProjectsLoaded = useCallback((cloudProjects: Project[]) => {
    if (!cloudProjects.length) return;
    const normalizedProjects = normalizeProjects(cloudProjects);
    const preferredProjectId = activeProjectIdRef.current &&
      normalizedProjects.some((project) => project.id === activeProjectIdRef.current)
      ? activeProjectIdRef.current
      : normalizedProjects[0]?.id;
    const activeProject = normalizedProjects.find((project) => project.id === preferredProjectId);

    dispatch({
      type: 'HYDRATE',
      payload: {
        projects: normalizedProjects,
        activeProjectId: preferredProjectId || null,
        activeIssueId: activeProject?.issues[0]?.id || null,
        activePageId: activeProject?.issues[0]?.pages[0]?.id || null,
      },
    });
  }, [dispatch]);

  const { syncStatus } = useCloudSync(state, handleCloudProjectsLoaded);
  
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [batching, setBatching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showScriptImport, setShowScriptImport] = useState(false);
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [showGutters, setShowGutters] = useState(false);
  const [showSpreadView, setShowSpreadView] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showScriptPanel, setShowScriptPanel] = useState(false);
  const [showReadThrough, setShowReadThrough] = useState(false);
  const [readThroughIndex, setReadThroughIndex] = useState(0);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [copiedPanelSettings, setCopiedPanelSettings] = useState<{ aspectRatio: AspectRatio; characterIds: string[] } | null>(null);
  const [showCharacterBank, setShowCharacterBank] = useState(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'guide'>('canvas');
  
  // Generate All state
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [totalPanels, setTotalPanels] = useState(0);
  const cancelGenerationRef = useRef(false);

  const activeProject = state.projects.find(p => p.id === state.activeProjectId);
  const activeIssue = activeProject?.issues.find(i => i.id === state.activeIssueId);
  const activePage = activeIssue?.pages.find(p => p.id === state.activePageId);
  
  // Use the shared image generation hook
  const imageGeneration = activeProject ? useImageGeneration(activeProject) : null;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo(stateWithHistory)) {
          dispatch({ type: 'UNDO' });
        }
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo(stateWithHistory)) {
          dispatch({ type: 'REDO' });
        }
      }
      
      // Panel navigation with arrow keys
      if (activePage && activePage.panels.length > 0) {
        const currentIndex = selectedPanelId 
          ? activePage.panels.findIndex(p => p.id === selectedPanelId)
          : -1;
        
        // Left/Up arrow: previous panel
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const newIndex = currentIndex <= 0 ? activePage.panels.length - 1 : currentIndex - 1;
          setSelectedPanelId(activePage.panels[newIndex].id);
        }
        // Right/Down arrow: next panel
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const newIndex = currentIndex >= activePage.panels.length - 1 ? 0 : currentIndex + 1;
          setSelectedPanelId(activePage.panels[newIndex].id);
        }
        // Delete: remove selected panel
        if (e.key === 'Delete' && selectedPanelId) {
          e.preventDefault();
          if (confirm('Delete this panel?')) {
            dispatch({ type: 'DELETE_PANEL', panelId: selectedPanelId, pageId: activePage.id });
            setSelectedPanelId(null);
          }
        }
        // Escape: deselect
        if (e.key === 'Escape') {
          setSelectedPanelId(null);
          setShowReadThrough(false);
        }
      }
      
      // Read-through mode navigation
      if (showReadThrough && activePage) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          setReadThroughIndex(i => Math.max(0, i - 1));
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
          e.preventDefault();
          setReadThroughIndex(i => Math.min(activePage.panels.length - 1, i + 1));
        }
        if (e.key === 'Escape') {
          setShowReadThrough(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stateWithHistory, activePage, selectedPanelId, showReadThrough]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Track drag delta for freeform positioning
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const panelId = event.active.id as string;
    setActiveId(panelId);
    const panel = activePage?.panels.find(p => p.id === panelId);
    if (panel) {
      dragStartPos.current = { x: panel.x || 0, y: panel.y || 0 };
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    setActiveId(null);
    
    if (active && dragStartPos.current && activePage) {
      const panelId = active.id as string;
      // Calculate new position based on drag delta
      const newX = Math.max(0, dragStartPos.current.x + delta.x);
      const newY = Math.max(0, dragStartPos.current.y + delta.y);
      
      dispatch({ 
        type: 'UPDATE_PANEL', 
        panelId, 
        updates: { x: newX, y: newY } 
      });
    }
    dragStartPos.current = null;
  };

  const activePanelForOverlay = useMemo(() => {
    return activePage?.panels.find(p => p.id === activeId);
  }, [activeId, activePage]);

  const handleExportPage = async () => {
    if (!activePage) return;
    setExporting(true);
    setShowExportMenu(false);
    try {
      const zip = new JSZip();
      const pageFolder = zip.folder(`Page_${activePage.number}`);
      for (let i = 0; i < activePage.panels.length; i++) {
        const panel = activePage.panels[i];
        if (panel.imageUrl) {
          let dataUrl = panel.imageUrl;
          if (dataUrl.startsWith('idb://')) {
            const id = dataUrl.replace('idb://', '');
            dataUrl = await getImage(id) || '';
          }
          if (dataUrl) {
            const base64 = dataUrl.split(',')[1];
            pageFolder?.file(`panel_${i + 1}.png`, base64, { base64: true });
          }
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Page_${activePage.number}_Ink.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed: " + e);
    } finally {
      setExporting(false);
    }
  };

  const handleExportIssue = async () => {
    if (!activeIssue) return;
    setExporting(true);
    setShowExportMenu(false);
    try {
      const zip = new JSZip();
      for (const page of activeIssue.pages) {
        for (let i = 0; i < page.panels.length; i++) {
          const panel = page.panels[i];
          if (panel.imageUrl) {
            let dataUrl = panel.imageUrl;
            if (dataUrl.startsWith('idb://')) {
              const id = dataUrl.replace('idb://', '');
              dataUrl = await getImage(id) || '';
            }
            if (dataUrl) {
              const base64 = dataUrl.split(',')[1];
              const fileName = `pg${String(page.number).padStart(3, '0')}_p${String(i + 1).padStart(2, '0')}.png`;
              zip.file(fileName, base64, { base64: true });
            }
          }
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeIssue.title.replace(/\s+/g, '_')}.cbz`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed: " + e);
    } finally {
      setExporting(false);
    }
  };

  // Export page as PDF
  const handleExportPagePDF = async () => {
    if (!activePage) return;
    setExporting(true);
    setShowExportMenu(false);
    try {
      // Create PDF in landscape for comic pages
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let hasContent = false;
      for (let i = 0; i < activePage.panels.length; i++) {
        const panel = activePage.panels[i];
        if (panel.imageUrl) {
          let dataUrl = panel.imageUrl;
          if (dataUrl.startsWith('idb://')) {
            const id = dataUrl.replace('idb://', '');
            dataUrl = await getImage(id) || '';
          }
          if (dataUrl) {
            if (hasContent) pdf.addPage();
            hasContent = true;
            
            // Add image centered on page
            const img = new Image();
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.src = dataUrl;
            });
            
            const imgRatio = img.width / img.height;
            const pageRatio = pageWidth / pageHeight;
            let imgWidth, imgHeight;
            
            if (imgRatio > pageRatio) {
              imgWidth = pageWidth - 20;
              imgHeight = imgWidth / imgRatio;
            } else {
              imgHeight = pageHeight - 20;
              imgWidth = imgHeight * imgRatio;
            }
            
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;
            
            pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);
            
            // Add panel number
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            pdf.text(`Panel ${i + 1}`, 10, 10);
          }
        }
      }
      
      if (hasContent) {
        pdf.save(`Page_${activePage.number}.pdf`);
      } else {
        alert('No images to export');
      }
    } catch (e) {
      alert("PDF export failed: " + e);
    } finally {
      setExporting(false);
    }
  };

  // Export issue as PDF
  const handleExportIssuePDF = async () => {
    if (!activeIssue) return;
    setExporting(true);
    setShowExportMenu(false);
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let hasContent = false;
      for (const page of activeIssue.pages) {
        for (let i = 0; i < page.panels.length; i++) {
          const panel = page.panels[i];
          if (panel.imageUrl) {
            let dataUrl = panel.imageUrl;
            if (dataUrl.startsWith('idb://')) {
              const id = dataUrl.replace('idb://', '');
              dataUrl = await getImage(id) || '';
            }
            if (dataUrl) {
              if (hasContent) pdf.addPage();
              hasContent = true;
              
              const img = new Image();
              await new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.src = dataUrl;
              });
              
              const imgRatio = img.width / img.height;
              const pageRatio = pageWidth / pageHeight;
              let imgWidth, imgHeight;
              
              if (imgRatio > pageRatio) {
                imgWidth = pageWidth - 20;
                imgHeight = imgWidth / imgRatio;
              } else {
                imgHeight = pageHeight - 20;
                imgWidth = imgHeight * imgRatio;
              }
              
              const x = (pageWidth - imgWidth) / 2;
              const y = (pageHeight - imgHeight) / 2;
              
              pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);
              
              pdf.setFontSize(10);
              pdf.setTextColor(150);
              pdf.text(`Page ${page.number} - Panel ${i + 1}`, 10, 10);
            }
          }
        }
      }
      
      if (hasContent) {
        pdf.save(`${activeIssue.title.replace(/\s+/g, '_')}.pdf`);
      } else {
        alert('No images to export');
      }
    } catch (e) {
      alert("PDF export failed: " + e);
    } finally {
      setExporting(false);
    }
  };

  const handleScriptImport = (result: ParseResult, scriptText: string) => {
    if (!result.success || !activeProject) return;
    const newPages: Page[] = result.pages.map((parsedPage) => ({
      id: genId(),
      number: parsedPage.pageNumber,
      panels: parsedPage.panels.map((parsedPanel, index) => ({
        id: genId(),
        prompt: parsedPanel.description,
        aspectRatio: parsedPanel.aspectRatio,
        characterIds: [],
        x: (index % 3) * 400,
        y: Math.floor(index / 3) * 500,
        textElements: parsedPanel.bubbles.map((bubble, idx) => ({
          id: genId(),
          type: bubble.type === 'dialogue' ? 'dialogue' as const : bubble.type === 'thought' ? 'thought' as const : 'caption' as const,
          content: bubble.character ? `${bubble.character}: ${bubble.text}` : bubble.text,
          x: 10, y: 10 + (idx * 15), width: 30, height: 10, fontSize: 18, color: '#000000', rotation: 0, tailX: 15, tailY: 10 + (idx * 15) + 15,
          tailStyle: bubble.type === 'thought' ? 'cloud' : (bubble.type === 'caption' ? 'none' : 'pointy')
        })),
      })),
    }));
    const newCharacters: Character[] = result.characters.map(c => ({
      id: genId(),
      name: c.name,
      description: c.firstAppearance || `${c.lineCount} lines`,
    }));
    const newIssue: Issue = { 
      id: genId(), 
      title: result.issue?.title ? `${result.issue.title}${result.issue.issueNumber ? ` #${result.issue.issueNumber}` : ''}` : `Imported: ${result.pages.length} Pages`, 
      pages: newPages,
      scriptText: scriptText // Store original script for reference
    };
    dispatch({ type: 'IMPORT_ISSUE', projectId: activeProject.id, issue: newIssue, characters: newCharacters });
    setShowScriptImport(false);
    setShowScriptPanel(true); // Auto-show script panel after import
  };

  const generatePage = async () => {
    if (!activePage || batching || !activeProject) return;
    setBatching(true);
    try {
      for (const panel of activePage.panels) {
        if (!panel.prompt && panel.characterIds.length === 0) continue;
        if (panel.imageUrl) continue;
        const styleConfig = ART_STYLES.find(s => s.id === activeProject?.style);
        const stylePrompt = styleConfig?.prompt || '';
        const activeChars = activeProject?.characters.filter(c => panel.characterIds.includes(c.id)) || [];
        // Use buildCharacterPrompt for full appearance descriptions
        const charSection = activeChars.length > 0 ? `Characters: ${activeChars.map(c => buildCharacterPrompt(c)).join('; ')}.` : '';
        const config = ASPECT_CONFIGS[panel.aspectRatio];
        let initImage: string | undefined;
        if (panel.referencePanelId) {
          const refPanel = activePage.panels.find(p => p.id === panel.referencePanelId);
          if (refPanel?.imageUrl) {
            const id = refPanel.imageUrl.startsWith('idb://') ? refPanel.imageUrl.slice(6) : null;
            if (id) initImage = await getImage(id) || undefined;
          }
        }
        const consistencySuffix = " Maintain strong visual and character consistency with the reference image. Same lighting, angle, style.";
        const fullPrompt = `${stylePrompt}. ${charSection} ${panel.prompt}.${initImage ? consistencySuffix : ''}`.trim();
        let url: string | undefined;
        try {
          if (activeProject.imageProvider === 'gemini' && activeProject.geminiApiKey) {
            url = await generateGeminiImage(fullPrompt, config.ratio, activeProject.geminiApiKey, initImage, panel.referenceStrength ?? 0.7);
          } else if (activeProject.imageProvider === 'leonardo' && activeProject.leonardoApiKey) {
            url = await generateLeonardoImage(fullPrompt, panel.aspectRatio, activeProject.leonardoApiKey, initImage, panel.referenceStrength ?? 0.7);
          } else if (activeProject.imageProvider === 'grok' && activeProject.grokApiKey) {
            url = await generateGrokImage(fullPrompt, panel.aspectRatio, activeProject.grokApiKey, initImage, panel.referenceStrength ?? 0.7);
          } else if (activeProject.imageProvider === 'fal' && activeProject.falApiKey) {
            url = await generateFalFlux(fullPrompt, panel.aspectRatio, activeProject.falApiKey, activeProject.fluxModel || 'fal-ai/flux-pro', initImage, panel.referenceStrength ?? 0.7);
          } else if (activeProject.imageProvider === 'seaart' && activeProject.seaartApiKey) {
            url = await generateSeaArtImage(fullPrompt, panel.aspectRatio, activeProject.seaartApiKey, initImage, panel.referenceStrength ?? 0.7);
          } else {
            console.warn(`No API key configured for provider: ${activeProject.imageProvider}`);
          }
        } catch (err) { console.error(err); }
        if (url) {
          const storedRef = await saveImage(panel.id, url);
          dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { imageUrl: storedRef } });
        }
        await new Promise(r => setTimeout(r, GENERATION_DELAY_MS));
      }
    } catch (e: any) {
      alert(`Batch Failed: ${e.message}`);
    } finally { setBatching(false); }
  };

  const handleGenerateAll = async () => {
    if (!activePage || !activeProject || !imageGeneration) return;
    
    // Get panels that need generation (have prompt, no image)
    const panelsToGenerate = activePage.panels.filter(
      panel => (panel.prompt?.trim() || panel.characterIds.length > 0) && !panel.imageUrl
    );
    
    if (panelsToGenerate.length === 0) {
      alert('No panels to generate. All panels either have images or lack prompts.');
      return;
    }
    
    setIsGeneratingAll(true);
    setTotalPanels(panelsToGenerate.length);
    cancelGenerationRef.current = false;
    
    for (let i = 0; i < panelsToGenerate.length; i++) {
      if (cancelGenerationRef.current) {
        console.log('Generation cancelled by user');
        break;
      }
      
      setCurrentPanel(i + 1);
      const panel = panelsToGenerate[i];
      
      try {
        // Get active characters for this panel
        const activeChars = activeProject.characters.filter(c => panel.characterIds.includes(c.id));
        
        // Get reference image if set
        let initImage: string | undefined;
        if (panel.referencePanelId) {
          const refPanel = activePage.panels.find(p => p.id === panel.referencePanelId);
          if (refPanel?.imageUrl) {
            const id = refPanel.imageUrl.startsWith('idb://') ? refPanel.imageUrl.slice(6) : null;
            if (id) initImage = await getImage(id) || undefined;
          }
        }
        
        // Use the shared hook to generate
        const url = await imageGeneration.generateImage(
          panel.prompt || '',
          panel.aspectRatio,
          activeChars,
          initImage,
          panel.referenceStrength ?? 0.7
        );
        
        if (url) {
          const storedRef = await saveImage(panel.id, url);
          dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { imageUrl: storedRef } });
        }
        
        // Delay between generations (same as AUTO-INK)
        await new Promise(r => setTimeout(r, GENERATION_DELAY_MS));
        
      } catch (err) {
        console.error(`Failed to generate panel ${i + 1}:`, err);
        // Continue to next panel instead of stopping
      }
    }
    
    setIsGeneratingAll(false);
    setCurrentPanel(0);
    setTotalPanels(0);
  };

  // Page navigation handlers for spread view
  const handlePreviousPage = () => {
    if (!activeIssue || !activePage) return;
    const currentIndex = activeIssue.pages.findIndex((p: Page) => p.id === activePage.id);
    const step = showSpreadView ? 2 : 1;
    const newIndex = Math.max(0, currentIndex - step);
    if (newIndex !== currentIndex) {
      dispatch({ type: 'SET_ACTIVE_PAGE', id: activeIssue.pages[newIndex].id });
    }
  };

  const handleNextPage = () => {
    if (!activeIssue || !activePage) return;
    const currentIndex = activeIssue.pages.findIndex((p: Page) => p.id === activePage.id);
    const step = showSpreadView ? 2 : 1;
    const newIndex = Math.min(activeIssue.pages.length - 1, currentIndex + step);
    if (newIndex !== currentIndex) {
      dispatch({ type: 'SET_ACTIVE_PAGE', id: activeIssue.pages[newIndex].id });
    }
  };


  return (
    <div className={`h-screen w-full flex overflow-hidden font-sans selection:bg-ember-500/30 ${showGutters ? 'bg-gray-200' : 'bg-ink-950'}`}>
    <Sidebar
    state={state}
    dispatch={dispatch}
    onOpenProjects={() => setProjectsOpen(true)}
    onOpenScriptImport={() => setShowScriptImport(true)}
    />

    <TransformWrapper
    disabled={!zoomEnabled}
    initialScale={1}
    minScale={0.1}
    maxScale={3}
    centerOnInit={true}
    limitToBounds={false}
    panning={{ disabled: !zoomEnabled, velocityDisabled: true }}
    wheel={{ disabled: !zoomEnabled }}
    >
    <main className={`flex-1 flex flex-col overflow-hidden relative transition-colors ${showGutters ? 'bg-gray-200' : 'bg-ink-950'} ${zoomEnabled ? 'cursor-grab active:cursor-grabbing' : ''}`}>
    <header className={`px-10 py-4 border-b flex flex-col gap-3 z-[100] backdrop-blur-xl transition-all shrink-0 ${showGutters ? 'bg-white/80 border-black' : 'bg-ink-950/50 border-ink-700/50'}`}>
    {/* Top Row: Breadcrumb/Title and Tab Navigation */}
    <div className="flex items-center justify-between">
    <div className="flex flex-col gap-1 overflow-hidden">
    <div className={`flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest truncate ${showGutters ? 'text-gray-500' : 'text-steel-500'}`}>
    <span>{activeProject?.title}</span>
    <span className="opacity-30">/</span>
    <span className={showGutters ? 'text-black' : 'text-ember-500/80'}>{activeIssue?.title}</span>
    </div>
    <h1 className={`font-display text-4xl uppercase tracking-tighter truncate ${showGutters ? 'text-black' : 'text-steel-100'}`}>
    {activeTab === 'canvas' ? `Page ${activePage?.number || '-'}` : 'How to Use'}
    </h1>
    </div>

    <div className="flex items-center gap-4">
      {user && (
        <div className="flex items-center gap-3">
          <SyncIndicator status={syncStatus} />
          <button
            onClick={signOut}
            className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${
              showGutters
                ? 'text-gray-500 hover:text-black'
                : 'text-steel-500 hover:text-ember-500'
            }`}
            title="Sign out"
          >
            Logout
          </button>
        </div>
      )}
      {/* Tab Navigation */}
      <div className={`flex items-center gap-1 rounded-full border p-1 ${showGutters ? 'bg-gray-100 border-gray-300' : 'bg-ink-900 border-ink-700'}`}>
        <button
          onClick={() => setActiveTab('canvas')}
          className={`font-mono text-xs px-6 py-2 tracking-widest transition-all rounded-full ${
            activeTab === 'canvas'
              ? showGutters
                ? 'bg-white text-black shadow-sm'
                : 'bg-ember-500 text-ink-950 shadow-lg'
              : showGutters
                ? 'text-gray-600 hover:text-black'
                : 'text-steel-400 hover:text-steel-200'
          }`}
        >
          CANVAS
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`font-mono text-xs px-6 py-2 tracking-widest transition-all rounded-full ${
            activeTab === 'guide'
              ? showGutters
                ? 'bg-white text-black shadow-sm'
                : 'bg-ember-500 text-ink-950 shadow-lg'
              : showGutters
                ? 'text-gray-600 hover:text-black'
                : 'text-steel-400 hover:text-steel-200'
          }`}
        >
          HOW TO USE
        </button>
      </div>
    </div>
    </div>

    {/* Bottom Row: Canvas Controls and Action Buttons */}
    <div className="flex items-center justify-between gap-4">
    {/* Left Side: Canvas Controls */}
    <div className="flex items-center gap-4">
    {/* Undo/Redo buttons */}
    <div className="flex items-center gap-1">
      <button
        onClick={() => dispatch({ type: 'UNDO' })}
        disabled={!canUndo(stateWithHistory)}
        className={`p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
          showGutters 
            ? 'hover:bg-gray-200 text-gray-600' 
            : 'hover:bg-ink-800 text-steel-400 hover:text-steel-200'
        }`}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={18} />
      </button>
      <button
        onClick={() => dispatch({ type: 'REDO' })}
        disabled={!canRedo(stateWithHistory)}
        className={`p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
          showGutters 
            ? 'hover:bg-gray-200 text-gray-600' 
            : 'hover:bg-ink-800 text-steel-400 hover:text-steel-200'
        }`}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={18} />
      </button>
    </div>

    <ZoomControls
    zoomEnabled={zoomEnabled}
    setZoomEnabled={setZoomEnabled}
    showGutters={showGutters}
    setShowGutters={setShowGutters}
    />
    
    {/* Spread View Toggle */}
    <button
      onClick={() => setShowSpreadView(!showSpreadView)}
      className={`p-2 rounded-lg transition-all ${
        showSpreadView
          ? showGutters 
            ? 'bg-ember-500 text-white' 
            : 'bg-ember-500 text-ink-950'
          : showGutters 
            ? 'hover:bg-gray-200 text-gray-600' 
            : 'hover:bg-ink-800 text-steel-400 hover:text-steel-200'
      }`}
      title="Toggle Spread View (Two-Page Layout)"
    >
      <BookOpen size={18} />
    </button>
    </div>

    {/* Right Side: Action Buttons - Wrapped */}
    <div className="flex items-center gap-3 flex-wrap justify-end relative pointer-events-auto">
    <div className="relative">
    <button
    onClick={() => setShowExportMenu(!showExportMenu)}
    className={`font-mono text-xs px-4 py-2 tracking-widest transition-all rounded-full border flex items-center gap-3 active:scale-95 shadow-lg ${showGutters ? 'bg-white border-black text-black hover:bg-gray-100' : 'bg-ink-800 border-ink-700 text-steel-200 hover:bg-ink-700'}`}
    >
    {exporting ? <Icons.Loader /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
    EXPORT
    </button>
    {showExportMenu && (
      <div className={`absolute top-full right-0 mt-2 w-56 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in py-1 ${showGutters ? 'bg-white border border-gray-300' : 'bg-ink-900 border border-ink-700'}`}>
      <div className={`px-4 py-2 text-[9px] font-mono uppercase tracking-widest ${showGutters ? 'text-gray-400 border-b border-gray-200' : 'text-steel-600 border-b border-ink-800'}`}>Images</div>
      <button onClick={handleExportPage} className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors uppercase tracking-widest flex items-center gap-3 ${showGutters ? 'text-gray-700 hover:bg-gray-100' : 'text-steel-300 hover:bg-ember-500 hover:text-ink-950'}`}><FileImage size={14} /><span>ZIP Page Images</span></button>
      <button onClick={handleExportIssue} className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors uppercase tracking-widest flex items-center gap-3 ${showGutters ? 'text-gray-700 hover:bg-gray-100' : 'text-steel-300 hover:bg-ember-500 hover:text-ink-950'}`}><FileImage size={14} /><span>CBZ Issue</span></button>
      <div className={`px-4 py-2 text-[9px] font-mono uppercase tracking-widest ${showGutters ? 'text-gray-400 border-y border-gray-200' : 'text-steel-600 border-y border-ink-800'}`}>PDF</div>
      <button onClick={handleExportPagePDF} className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors uppercase tracking-widest flex items-center gap-3 ${showGutters ? 'text-gray-700 hover:bg-gray-100' : 'text-steel-300 hover:bg-ember-500 hover:text-ink-950'}`}><FileImage size={14} /><span>PDF Page</span></button>
      <button onClick={handleExportIssuePDF} className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors uppercase tracking-widest flex items-center gap-3 ${showGutters ? 'text-gray-700 hover:bg-gray-100' : 'text-steel-300 hover:bg-ember-500 hover:text-ink-950'}`}><FileImage size={14} /><span>PDF Issue</span></button>
      </div>
    )}
    </div>
    <button disabled={batching || !activePage?.panels.length} onClick={generatePage} className={`font-mono text-xs px-4 py-2 tracking-widest transition-all rounded-full border flex items-center gap-3 disabled:opacity-20 active:scale-95 shadow-lg ${showGutters ? 'bg-white border-black text-black hover:bg-gray-100' : 'bg-ink-800 border-ink-700 text-steel-200 hover:bg-ink-700'}`}>
    {batching ? <Icons.Loader /> : <Icons.Magic />}AUTO-INK
    </button>
    {/* Generate All Button */}
    {activePage && activePage.panels.some(panel => (panel.prompt?.trim() || panel.characterIds.length > 0) && !panel.imageUrl) && (
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={handleGenerateAll}
          disabled={isGeneratingAll || batching}
          className={`font-mono text-xs px-4 py-2 tracking-widest transition-all rounded-full border flex items-center gap-3 disabled:opacity-20 active:scale-95 shadow-lg ${showGutters ? 'bg-white border-black text-black hover:bg-gray-100' : 'bg-ink-800 border-ink-700 text-steel-200 hover:bg-ink-700'}`}
        >
          {isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isGeneratingAll ? `GENERATING ${currentPanel}/${totalPanels}...` : 'GENERATE ALL'}
        </button>
        {!isGeneratingAll && (
          <p className="text-[9px] font-mono text-steel-600 mt-1 max-w-[200px] text-center">
            Batch generation may consume significant API credits depending on your provider and plan. Review the panel count before proceeding.
          </p>
        )}
        {isGeneratingAll && (
          <button
            onClick={() => { cancelGenerationRef.current = true; }}
            className="text-xs font-mono text-red-500 hover:text-red-400"
          >
            CANCEL
          </button>
        )}
      </div>
    )}
    {/* Page Templates */}
    <div className="relative">
      <button
        onClick={() => setShowTemplateMenu(!showTemplateMenu)}
        className={`font-mono text-xs px-4 py-2 tracking-widest transition-all rounded-full border flex items-center gap-2 active:scale-95 shadow-lg ${showGutters ? 'bg-white border-black text-black hover:bg-gray-100' : 'bg-ink-800 border-ink-700 text-steel-200 hover:bg-ink-700'}`}
        title="Apply page template"
      >
        <LayoutGrid size={16} />
        TEMPLATES
      </button>
      {showTemplateMenu && (
        <div className={`absolute top-full right-0 mt-2 w-48 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in py-1 ${showGutters ? 'bg-white border border-gray-300' : 'bg-ink-900 border border-ink-700'}`}>
          <button 
            onClick={() => { activePage && dispatch({ type: 'APPLY_PAGE_TEMPLATE', pageId: activePage.id, template: '2x2' }); setShowTemplateMenu(false); }}
            className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors flex items-center gap-3 ${showGutters ? 'text-gray-700 hover:bg-gray-100' : 'text-steel-300 hover:bg-ember-500 hover:text-ink-950'}`}
          >
            <Grid2X2 size={16} /> 2×2 Grid
          </button>
          <button 
            onClick={() => { activePage && dispatch({ type: 'APPLY_PAGE_TEMPLATE', pageId: activePage.id, template: '3x3' }); setShowTemplateMenu(false); }}
            className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors flex items-center gap-3 ${showGutters ? 'text-gray-700 hover:bg-gray-100' : 'text-steel-300 hover:bg-ember-500 hover:text-ink-950'}`}
          >
            <Grid3X3 size={16} /> 3×3 Grid
          </button>
          <button 
            onClick={() => { activePage && dispatch({ type: 'APPLY_PAGE_TEMPLATE', pageId: activePage.id, template: '2x3' }); setShowTemplateMenu(false); }}
            className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors flex items-center gap-3 ${showGutters ? 'text-gray-700 hover:bg-gray-100' : 'text-steel-300 hover:bg-ember-500 hover:text-ink-950'}`}
          >
            <Columns size={16} /> 2×3 Rows
          </button>
          <button 
            onClick={() => { activePage && dispatch({ type: 'APPLY_PAGE_TEMPLATE', pageId: activePage.id, template: 'manga-right' }); setShowTemplateMenu(false); }}
            className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors flex items-center gap-3 ${showGutters ? 'text-gray-700 hover:bg-gray-100' : 'text-steel-300 hover:bg-ember-500 hover:text-ink-950'}`}
          >
            <LayoutGrid size={16} /> Manga (R→L)
          </button>
          <button 
            onClick={() => { activePage && dispatch({ type: 'APPLY_PAGE_TEMPLATE', pageId: activePage.id, template: 'manga-left' }); setShowTemplateMenu(false); }}
            className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors flex items-center gap-3 ${showGutters ? 'text-gray-700 hover:bg-gray-100' : 'text-steel-300 hover:bg-ember-500 hover:text-ink-950'}`}
          >
            <LayoutGrid size={16} /> Manga (L→R)
          </button>
          <button 
            onClick={() => { activePage && dispatch({ type: 'APPLY_PAGE_TEMPLATE', pageId: activePage.id, template: 'single' }); setShowTemplateMenu(false); }}
            className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors flex items-center gap-3 ${showGutters ? 'text-gray-700 hover:bg-gray-100' : 'text-steel-300 hover:bg-ember-500 hover:text-ink-950'}`}
          >
            <Square size={16} /> Single Splash
          </button>
          <button 
            onClick={() => { activePage && dispatch({ type: 'APPLY_PAGE_TEMPLATE', pageId: activePage.id, template: 'double-wide' }); setShowTemplateMenu(false); }}
            className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors flex items-center gap-3 ${showGutters ? 'text-gray-700 hover:bg-gray-100' : 'text-steel-300 hover:bg-ember-500 hover:text-ink-950'}`}
          >
            <RectangleHorizontal size={16} /> Double Wide
          </button>
        </div>
      )}
    </div>
    {/* Script Panel Toggle */}
    {activeIssue?.scriptText && (
      <button
        onClick={() => setShowScriptPanel(!showScriptPanel)}
        className={`font-mono text-xs px-4 py-2 tracking-widest transition-all rounded-full border flex items-center gap-2 active:scale-95 shadow-lg ${showScriptPanel ? 'bg-ember-500 border-ember-400 text-ink-950' : showGutters ? 'bg-white border-black text-black hover:bg-gray-100' : 'bg-ink-800 border-ink-700 text-steel-200 hover:bg-ink-700'}`}
        title="Toggle script reference panel"
      >
        <FileText size={16} />
        SCRIPT
      </button>
    )}
    {/* Character Bank */}
    <button
      onClick={() => setShowCharacterBank(true)}
      className={`font-mono text-xs px-4 py-2 tracking-widest transition-all rounded-full border flex items-center gap-2 active:scale-95 shadow-lg ${showGutters ? 'bg-white border-black text-black hover:bg-gray-100' : 'bg-ink-800 border-ink-700 text-steel-200 hover:bg-ink-700'}`}
      title="Manage characters"
    >
      <Users size={16} />
      CHARACTERS
    </button>
    {/* Read-through Mode */}
    <button
      onClick={() => { setShowReadThrough(true); setReadThroughIndex(0); }}
      disabled={!activePage?.panels.length}
      className={`font-mono text-xs px-4 py-2 tracking-widest transition-all rounded-full border flex items-center gap-2 active:scale-95 shadow-lg disabled:opacity-30 ${showGutters ? 'bg-white border-black text-black hover:bg-gray-100' : 'bg-ink-800 border-ink-700 text-steel-200 hover:bg-ink-700'}`}
      title="Read-through mode (slideshow)"
    >
      <Play size={16} />
      PRESENT
    </button>
    <button onClick={() => activePage && dispatch({ type: 'ADD_PANEL', pageId: activePage.id })} className={`font-display text-xl px-6 py-2 tracking-widest transition-all rounded-full shadow-lg active:translate-y-1 ${showGutters ? 'bg-black text-white hover:bg-gray-800' : 'bg-ember-500 hover:bg-ember-400 text-ink-950'}`}>
    ADD FRAME
    </button>
    </div>
    </div>
    </header>

    {activeTab === 'canvas' ? (
      <>
        <div className={`flex-1 ${zoomEnabled ? 'overflow-hidden' : 'overflow-scroll'}`}>
        <TransformComponent 
        wrapperClass="w-full h-full" 
        contentClass=""
        >
        {showSpreadView ? (
          <SpreadCanvas
          activePage={activePage}
          activeProject={activeProject}
          activeIssue={activeIssue}
          dispatch={dispatch}
          sensors={sensors}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          activeId={activeId}
          activePanelForOverlay={activePanelForOverlay}
          showGutters={showGutters}
          zoomEnabled={zoomEnabled}
          selectedPanelId={selectedPanelId}
          setSelectedPanelId={setSelectedPanelId}
          copiedPanelSettings={copiedPanelSettings}
          setCopiedPanelSettings={setCopiedPanelSettings}
          />
        ) : (
          <ZoomableCanvas
          activePage={activePage}
          activeProject={activeProject}
          dispatch={dispatch}
          sensors={sensors}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          activeId={activeId}
          activePanelForOverlay={activePanelForOverlay}
          showGutters={showGutters}
          zoomEnabled={zoomEnabled}
          selectedPanelId={selectedPanelId}
          setSelectedPanelId={setSelectedPanelId}
          copiedPanelSettings={copiedPanelSettings}
          setCopiedPanelSettings={setCopiedPanelSettings}
          />
        )}
        </TransformComponent>
        </div>

        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 border border-white/10 rounded-full px-8 py-4 flex items-center gap-10 shadow-2xl z-[400] transition-all ${showGutters ? 'bg-white border-black text-black' : 'bg-ink-900/95 backdrop-blur-2xl text-steel-400'}`}>
        <div className="flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${batching || exporting ? 'bg-ember-500 animate-ping' : 'bg-green-500'}`}></div>
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold">{batching ? 'BATCH INKING...' : exporting ? 'EXPORTING...' : 'TERMINAL READY'}</span>
        </div>
        <div className={`h-5 w-px ${showGutters ? 'bg-black/20' : 'bg-ink-700'}`}></div>
        <div className="flex gap-8">
        <div className="flex flex-col">
        <span className="text-[9px] font-mono uppercase mb-0.5 opacity-60">Project</span>
        <span className={`text-[11px] font-mono uppercase font-bold truncate max-w-[120px] ${showGutters ? 'text-black' : 'text-steel-200'}`}>{activeProject?.title}</span>
        </div>
        </div>
        <div className={`h-5 w-px ${showGutters ? 'bg-black/20' : 'bg-ink-700'}`}></div>
        <div className="flex items-center gap-4">
        <button 
          onClick={handlePreviousPage}
          disabled={!activeIssue || activeIssue.pages.findIndex((p: Page) => p.id === activePage?.id) === 0}
          className={`p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
            showGutters 
              ? 'hover:bg-gray-200 text-gray-600' 
              : 'hover:bg-ink-800 text-steel-400 hover:text-steel-200'
          }`}
          title="Previous Page"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-[10px] font-mono uppercase tracking-wide">
          Page {activePage?.number || 1}
        </span>
        <button 
          onClick={handleNextPage}
          disabled={!activeIssue || !activePage || activeIssue.pages.findIndex((p: Page) => p.id === activePage.id) >= activeIssue.pages.length - 1}
          className={`p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
            showGutters 
              ? 'hover:bg-gray-200 text-gray-600' 
              : 'hover:bg-ink-800 text-steel-400 hover:text-steel-200'
          }`}
          title="Next Page"
        >
          <ChevronRight size={20} />
        </button>
        </div>
        </div>
      </>
    ) : (
      <UserGuide showGutters={showGutters} />
    )}
    </main>
    </TransformWrapper>

    {projectsOpen && <ProjectHub state={state} dispatch={dispatch} onClose={() => setProjectsOpen(false)} />}
    {showScriptImport && activeProject && <ScriptImportModal project={activeProject} onClose={() => setShowScriptImport(false)} onImport={handleScriptImport} />}
    {showCharacterBank && activeProject && (
      <CharacterBank 
        characters={activeProject.characters} 
        dispatch={dispatch} 
        onClose={() => setShowCharacterBank(false)} 
      />
    )}
    
    {/* Side-by-side Script Panel */}
    {showScriptPanel && activeIssue?.scriptText && (
      <div className="fixed right-0 top-0 h-full w-[400px] bg-ink-950 border-l border-ink-800 shadow-2xl z-[500] flex flex-col animate-slide-in">
        <div className="flex items-center justify-between p-4 border-b border-ink-800">
          <h3 className="font-mono text-xs uppercase tracking-widest text-steel-300">Script Reference</h3>
          <button onClick={() => setShowScriptPanel(false)} className="p-2 hover:bg-ink-800 rounded-lg text-steel-400 hover:text-steel-200 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="text-steel-300 text-sm font-mono whitespace-pre-wrap leading-relaxed">{activeIssue.scriptText}</pre>
        </div>
      </div>
    )}

    {/* Read-through / Presentation Mode */}
    {showReadThrough && activePage && activePage.panels.length > 0 && (
      <div className="fixed inset-0 bg-black z-[600] flex items-center justify-center">
        <button 
          onClick={() => setShowReadThrough(false)} 
          className="absolute top-6 right-6 p-3 bg-ink-900 hover:bg-ink-800 rounded-full text-steel-300 transition-colors"
          title="Exit read-through (Escape)"
        >
          <X size={24} />
        </button>
        
        <button 
          onClick={() => setReadThroughIndex(i => Math.max(0, i - 1))}
          disabled={readThroughIndex === 0}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-ink-900 hover:bg-ink-800 rounded-full text-steel-300 transition-colors disabled:opacity-30"
          title="Previous (Arrow Left)"
        >
          <ChevronLeft size={32} />
        </button>
        
        <button 
          onClick={() => setReadThroughIndex(i => Math.min(activePage.panels.length - 1, i + 1))}
          disabled={readThroughIndex >= activePage.panels.length - 1}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-ink-900 hover:bg-ink-800 rounded-full text-steel-300 transition-colors disabled:opacity-30"
          title="Next (Arrow Right)"
        >
          <ChevronRight size={32} />
        </button>
        
        <div className="max-w-[80vw] max-h-[80vh] flex flex-col items-center">
          {(() => {
            const panel = activePage.panels[readThroughIndex];
            return panel ? (
              <>
                <ReadThroughPanel panelId={panel.id} imageUrl={panel.imageUrl} />
                <div className="mt-6 text-center">
                  <p className="font-mono text-steel-400 text-sm mb-2">Panel {readThroughIndex + 1} of {activePage.panels.length}</p>
                  {panel.prompt && <p className="text-steel-500 text-xs max-w-[600px]">{panel.prompt}</p>}
                </div>
              </>
            ) : null;
          })()}
        </div>
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {activePage.panels.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setReadThroughIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all ${idx === readThroughIndex ? 'bg-ember-500 scale-125' : 'bg-ink-700 hover:bg-ink-600'}`}
            />
          ))}
        </div>
      </div>
    )}
    </div>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

// Helper component for read-through mode to load images
function ReadThroughPanel({ panelId, imageUrl }: { panelId: string; imageUrl?: string }) {
  const [image, setImage] = useState<string | null>(null);
  
  useEffect(() => {
    if (imageUrl) {
      if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
        setImage(imageUrl);
      } else {
        getImage(imageUrl).then(data => data && setImage(data));
      }
    }
  }, [imageUrl]);
  
  if (!image) {
    return (
      <div className="w-[600px] h-[400px] bg-ink-900 rounded-2xl flex items-center justify-center">
        <p className="text-steel-600 font-mono text-sm">No image generated</p>
      </div>
    );
  }
  
  return <img src={image} alt="" className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl" />;
}

/**
 * Sub-component to hold DndContext and freeform canvas inside the TransformWrapper.
 * This allows panels to be positioned anywhere on the canvas.
 */
function ZoomableCanvas({
  activePage, activeProject, dispatch, sensors, handleDragStart, handleDragEnd,
  activeId, activePanelForOverlay, showGutters, zoomEnabled,
  selectedPanelId, setSelectedPanelId, copiedPanelSettings, setCopiedPanelSettings
}: any) {
  const { state: transformState } = useTransformContext() as any;
  const scale = transformState?.scale || 1;

  // Create scale modifier inside the component so it updates with scale changes
  const modifiers = useMemo(() => [createScaleModifier(scale)], [scale]);

  // Calculate canvas size based on panel positions
  const canvasSize = useMemo(() => {
    if (!activePage?.panels.length) return { width: 2000, height: 1500 };
    let maxX = 2000;
    let maxY = 1500;
    activePage.panels.forEach((p: any) => {
      const panelRight = (p.x || 0) + (p.width || 360) + 100;
      const panelBottom = (p.y || 0) + (p.height || 420) + 100;
      if (panelRight > maxX) maxX = panelRight;
      if (panelBottom > maxY) maxY = panelBottom;
    });
    return { width: Math.max(2000, maxX), height: Math.max(1500, maxY) };
  }, [activePage?.panels]);

  return (
    <div 
      className={`relative transition-all ${zoomEnabled ? 'pointer-events-none [&>*]:pointer-events-auto' : ''}`}
      style={{ 
        width: canvasSize.width, 
        height: canvasSize.height,
        minWidth: '100%',
        minHeight: '100%',
        background: showGutters 
          ? 'repeating-linear-gradient(0deg, transparent, transparent 39px, #e5e5e5 39px, #e5e5e5 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #e5e5e5 39px, #e5e5e5 40px)'
          : 'repeating-linear-gradient(0deg, transparent, transparent 39px, #1e1e26 39px, #1e1e26 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #1e1e26 39px, #1e1e26 40px)'
      }}
    >
    {!activePage || activePage.panels.length === 0 ? (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-800 gap-8 animate-fade-in">
      <div className={`w-56 h-56 border-4 border-dashed rounded-[3rem] flex items-center justify-center opacity-40 group hover:opacity-100 transition-opacity ${showGutters ? 'border-gray-400' : 'border-ink-900'}`}>
      <div className={`scale-[3] transition-colors ${showGutters ? 'text-gray-400 group-hover:text-black' : 'text-ink-800 group-hover:text-ember-500'}`}>
      <Icons.Plus />
      </div>
      </div>
      <p className={`font-display text-5xl tracking-widest uppercase mb-2 text-center ${showGutters ? 'text-gray-400' : 'text-ink-800'}`}>Canvas Sterile</p>
      </div>
    ) : (
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={modifiers}>
      {activePage.panels.map((panel: any, idx: number) => (
        <PanelCard
        key={panel.id}
        panel={panel}
        pageId={activePage.id}
        dispatch={dispatch}
        project={activeProject!}
        characters={activeProject?.characters || []}
        index={idx}
        total={activePage.panels.length}
        showGutters={showGutters}
        activePage={activePage}
        isDragging={activeId === panel.id}
        isSelected={selectedPanelId === panel.id}
        onSelect={() => setSelectedPanelId(panel.id)}
        copiedSettings={copiedPanelSettings}
        onCopySettings={() => setCopiedPanelSettings({ aspectRatio: panel.aspectRatio, characterIds: panel.characterIds })}
        onPasteSettings={() => {
          if (copiedPanelSettings) {
            dispatch({ 
              type: 'UPDATE_PANEL', 
              panelId: panel.id, 
              updates: { 
                aspectRatio: copiedPanelSettings.aspectRatio, 
                characterIds: copiedPanelSettings.characterIds 
              } 
            });
          }
        }}
        />
      ))}
      </DndContext>
    )}
    </div>
  );
}

/**
 * Component to display two pages side-by-side in spread view
 */
function SpreadCanvas({
  activePage, activeProject, dispatch, sensors, handleDragStart, handleDragEnd,
  activeId, activePanelForOverlay, showGutters, zoomEnabled,
  selectedPanelId, setSelectedPanelId, copiedPanelSettings, setCopiedPanelSettings,
  activeIssue
}: any) {
  const { state: transformState } = useTransformContext() as any;
  const scale = transformState?.scale || 1;
  const modifiers = useMemo(() => [createScaleModifier(scale)], [scale]);

  if (!activePage || !activeIssue) return null;

  // Determine which pages to show
  const currentPageIndex = activeIssue.pages.findIndex((p: Page) => p.id === activePage.id);
  
  // For even-numbered pages (2, 4, 6...), show current (even) on left, next (odd) on right
  // For odd-numbered pages (1, 3, 5...), show previous (even) on left, current (odd) on right
  let leftPage: Page | null = null;
  let rightPage: Page | null = null;

  if (activePage.number % 2 === 0) {
    // Current page is even - goes on left
    leftPage = activePage;
    rightPage = currentPageIndex < activeIssue.pages.length - 1 ? activeIssue.pages[currentPageIndex + 1] : null;
  } else {
    // Current page is odd - goes on right
    leftPage = currentPageIndex > 0 ? activeIssue.pages[currentPageIndex - 1] : null;
    rightPage = activePage;
  }

  const renderPageCanvas = (page: Page | null, side: 'left' | 'right') => {
    if (!page) {
      return (
        <div className={`flex-1 flex items-center justify-center ${showGutters ? 'bg-gray-100' : 'bg-ink-900/50'}`}>
          <p className={`font-mono text-sm ${showGutters ? 'text-gray-400' : 'text-steel-600'}`}>No page</p>
        </div>
      );
    }

    const canvasSize = { width: 2000, height: 1500 };
    page.panels.forEach((p: any) => {
      const panelRight = (p.x || 0) + (p.width || 360) + 100;
      const panelBottom = (p.y || 0) + (p.height || 420) + 100;
      canvasSize.width = Math.max(canvasSize.width, panelRight);
      canvasSize.height = Math.max(canvasSize.height, panelBottom);
    });

    return (
      <div className="flex-1 flex flex-col">
        <div 
          className={`relative transition-all ${zoomEnabled ? 'pointer-events-none [&>*]:pointer-events-auto' : ''}`}
          style={{ 
            width: canvasSize.width, 
            height: canvasSize.height,
            minWidth: '100%',
            minHeight: '100%',
            background: showGutters 
              ? 'repeating-linear-gradient(0deg, transparent, transparent 39px, #e5e5e5 39px, #e5e5e5 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #e5e5e5 39px, #e5e5e5 40px)'
              : 'repeating-linear-gradient(0deg, transparent, transparent 39px, #1e1e26 39px, #1e1e26 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #1e1e26 39px, #1e1e26 40px)'
          }}
        >
          {page.panels.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-800 gap-8 animate-fade-in">
              <p className={`font-display text-3xl tracking-widest uppercase mb-2 text-center ${showGutters ? 'text-gray-400' : 'text-ink-800'}`}>Empty Page</p>
            </div>
          ) : (
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={modifiers}>
              {page.panels.map((panel: any, idx: number) => (
                <PanelCard
                  key={panel.id}
                  panel={panel}
                  pageId={page.id}
                  dispatch={dispatch}
                  project={activeProject!}
                  characters={activeProject?.characters || []}
                  index={idx}
                  total={page.panels.length}
                  showGutters={showGutters}
                  activePage={page}
                  isDragging={activeId === panel.id}
                  isSelected={selectedPanelId === panel.id}
                  onSelect={() => setSelectedPanelId(panel.id)}
                  copiedSettings={copiedPanelSettings}
                  onCopySettings={() => setCopiedPanelSettings({ aspectRatio: panel.aspectRatio, characterIds: panel.characterIds })}
                  onPasteSettings={() => {
                    if (copiedPanelSettings) {
                      dispatch({ 
                        type: 'UPDATE_PANEL', 
                        panelId: panel.id, 
                        updates: { 
                          aspectRatio: copiedPanelSettings.aspectRatio, 
                          characterIds: copiedPanelSettings.characterIds 
                        } 
                      });
                    }
                  }}
                />
              ))}
            </DndContext>
          )}
        </div>
        {/* Page number label */}
        <div className={`text-center py-2 text-xs font-mono ${showGutters ? 'text-gray-600 bg-gray-50' : 'text-steel-500 bg-ink-900/50'}`}>
          Page {page.number}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex">
      {/* Left page */}
      <div className="flex-1 flex flex-col border-r-2" style={{ 
        borderColor: showGutters ? '#d1d5db' : '#2a2a35',
        boxShadow: showGutters 
          ? 'inset -8px 0 12px -8px rgba(0,0,0,0.15)' 
          : 'inset -8px 0 12px -8px rgba(0,0,0,0.4)'
      }}>
        {renderPageCanvas(leftPage, 'left')}
      </div>

      {/* Center gutter (book spine) */}
      <div 
        className="w-1"
        style={{ 
          background: showGutters 
            ? 'linear-gradient(90deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.1) 100%)'
            : 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Right page */}
      <div className="flex-1 flex flex-col border-l-2" style={{ 
        borderColor: showGutters ? '#d1d5db' : '#2a2a35',
        boxShadow: showGutters 
          ? 'inset 8px 0 12px -8px rgba(0,0,0,0.15)' 
          : 'inset 8px 0 12px -8px rgba(0,0,0,0.4)'
      }}>
        {renderPageCanvas(rightPage, 'right')}
      </div>
    </div>
  );
}
