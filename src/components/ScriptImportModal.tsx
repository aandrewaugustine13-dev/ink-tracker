import React, { useState } from 'react';
import { parseScript, ParseResult, VisualMarker } from '../services/scriptParser';
import { parseScreenplay } from '../services/screenplayParser';
import { parseStagePlay } from '../services/stagePlayParser';
import { parseTVScript } from '../services/tvSeriesParser';
import { ParseResult as SharedParseResult } from '../services/parserTypes';
import { Project } from '../types';

interface Props {
    project: Project;
    onClose: () => void;
    onImport: (result: ParseResult, scriptText: string) => void;
}

const MARKER_COLORS: Record<VisualMarker, string> = {
    standard: 'text-steel-400',
    echo: 'text-red-500',
    hitch: 'text-cyan-500',
    overflow: 'text-purple-500',
    shattered: 'text-red-400',
    split: 'text-amber-500',
    splash: 'text-emerald-500',
    inset: 'text-sky-400',
    large: 'text-lime-500',
    'full-width': 'text-pink-500',
};

/**
 * Convert shared ParseResult format to legacy format for backward compatibility
 */
function convertToLegacyResult(shared: SharedParseResult): ParseResult {
    return {
        success: shared.errors.length === 0 || shared.pages.length > 0,
        pages: shared.pages.map(page => ({
            pageNumber: page.pageNumber,
            panels: page.panels.map(panel => ({
                panelNumber: panel.panelNumber,
                description: panel.description,
                bubbles: panel.dialogue.map(d => ({
                    type: d.type === 'spoken' ? 'dialogue' as const : 
                          d.type === 'voiceover' ? 'dialogue' as const :
                          d.type === 'thought' ? 'thought' as const :
                          'caption' as const,
                    text: d.text,
                    character: d.character
                })),
                artistNotes: panel.artistNotes ? [panel.artistNotes] : [],
                visualMarker: (panel.visualMarker as VisualMarker) || 'standard',
                aspectRatio: 'wide' as any, // Default aspect ratio
                panelModifier: panel.visualMarker
            })),
            pageNotes: undefined
        })),
        characters: shared.characters.map(c => ({
            name: c.name,
            lineCount: c.panelCount,
            description: undefined,
            firstAppearance: undefined
        })),
        errors: shared.errors.map(e => e.message),
        warnings: []
    };
}

/**
 * Placeholder function for Google Drive import
 * This will be wired up once Google API credentials are configured
 */
async function handleGoogleDriveImport(): Promise<{ content: string; filename: string } | null> {
    // TODO: Implement Google Drive Picker API integration
    // Required setup:
    // 1. Create project in Google Cloud Console
    // 2. Enable Google Drive API
    // 3. Enable Google Picker API
    // 4. Create OAuth 2.0 credentials
    // 5. Add authorized JavaScript origins
    // 6. Configure the picker with the API key and client ID
    
    console.log('Google Drive import not yet configured. Add Google API credentials to enable.');
    
    // For now, show an alert to the user
    alert('Google Drive import is not yet configured.\n\nTo enable:\n1. Set up Google Cloud project\n2. Enable Drive & Picker APIs\n3. Configure OAuth credentials\n4. Add API keys to the application');
    
    return null;
}

export function ScriptImportModal({ project, onClose, onImport }: Props) {
    const [script, setScript] = useState('');
    const [result, setResult] = useState<ParseResult | null>(null);
    const [editableCharacters, setEditableCharacters] = useState<ParseResult['characters']>([]);
    const [isLoadingDrive, setIsLoadingDrive] = useState(false);

    const handleParse = () => {
        const projectType = project.projectType || 'comic';
        let parsed: ParseResult;
        
        // Select parser based on project type
        switch (projectType) {
            case 'screenplay':
                const screenplayResult = parseScreenplay(script);
                parsed = convertToLegacyResult(screenplayResult);
                break;
            case 'stage-play':
                const stagePlayResult = parseStagePlay(script);
                parsed = convertToLegacyResult(stagePlayResult);
                break;
            case 'tv-series':
                const tvResult = parseTVScript(script);
                parsed = convertToLegacyResult(tvResult);
                break;
            case 'comic':
            default:
                parsed = parseScript(script);
                break;
        }
        
        setResult(parsed);
        setEditableCharacters(parsed.characters);
    };

    const handleImport = () => {
        if (result?.success) {
            const filteredResult = {
                ...result,
                characters: editableCharacters
            };
            onImport(filteredResult, script);
            onClose();
        }
    };

    const handleRemoveCharacter = (characterName: string) => {
        setEditableCharacters(prev => prev.filter(char => char.name !== characterName));
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setScript(ev.target?.result as string || '');
                setResult(null);
                setEditableCharacters([]);
            };
            reader.readAsText(file);
        }
    };

    const handleGoogleDrive = async () => {
        setIsLoadingDrive(true);
        try {
            const driveResult = await handleGoogleDriveImport();
            if (driveResult) {
                setScript(driveResult.content);
                setResult(null);
                setEditableCharacters([]);
            }
        } catch (error) {
            console.error('Google Drive import error:', error);
        } finally {
            setIsLoadingDrive(false);
        }
    };

    const getPageLabel = () => {
        const type = project.projectType;
        if (type === 'screenplay' || type === 'tv-series') return 'Scenes';
        if (type === 'stage-play') return 'Scenes';
        return 'Pages';
    };

    const getPanelLabel = () => {
        const type = project.projectType;
        if (type === 'screenplay' || type === 'tv-series') return 'Shots';
        if (type === 'stage-play') return 'Beats';
        return 'Panels';
    };

    const getFormatHint = () => {
        const type = project.projectType;
        switch (type) {
            case 'screenplay':
                return 'Format: INT. LOCATION - TIME / Action description / CHARACTER NAME / Dialogue / CLOSE UP, WIDE SHOT, etc.';
            case 'stage-play':
                return 'Format: ACT ONE / SCENE 1 / (Stage directions) / CHARACTER: Dialogue / (enters), (exits)';
            case 'tv-series':
                return 'Format: EPISODE 101 / TEASER / INT. LOCATION - TIME / (follows screenplay format)';
            case 'comic':
            default:
                return 'Format: PAGE 1 / Panel 1 / CAPTION: / CHARACTER: dialogue / SFX:';
        }
    };

    const getProjectTypeLabel = () => {
        const type = project.projectType;
        switch (type) {
            case 'screenplay': return 'Screenplay';
            case 'stage-play': return 'Stage Play';
            case 'tv-series': return 'TV Series';
            case 'comic':
            default: return 'Comic / Graphic Novel';
        }
    };

    const totalPanels = result?.pages.reduce((sum, p) => sum + p.panels.length, 0) || 0;
    const markerCounts = result?.pages.reduce((acc, p) => {
        p.panels.forEach(pan => {
            if (pan.visualMarker !== 'standard') {
                acc[pan.visualMarker] = (acc[pan.visualMarker] || 0) + 1;
            }
        });
        return acc;
    }, {} as Record<string, number>) || {};

    return (
        <div className="fixed inset-0 bg-ink-950/95 backdrop-blur-xl flex items-center justify-center z-[600] p-8">
            <div className="w-full max-w-5xl bg-ink-900 border-2 border-ink-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-ink-700 flex items-center justify-between">
                    <div>
                        <h2 className="font-display text-3xl tracking-widest text-ember-500 uppercase">Script Import</h2>
                        <p className="text-[10px] font-mono text-steel-500 mt-1 uppercase tracking-widest">
                            {getProjectTypeLabel()} • Paste script or upload .txt file
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-ink-800 hover:bg-red-500 text-steel-400 hover:text-white transition-all text-xl font-bold">×</button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 flex flex-col p-6 border-r border-ink-700">
                        <div className="mb-4 flex items-center gap-3">
                            <input
                                type="file"
                                accept=".txt,.md"
                                onChange={handleFile}
                                className="text-[10px] text-steel-400 file:mr-3 file:py-2 file:px-4 file:border file:border-ink-700 file:bg-ink-800 file:text-ember-500 file:font-bold file:text-[9px] file:uppercase file:cursor-pointer file:rounded-lg hover:file:bg-ink-700"
                            />
                            <button
                                onClick={handleGoogleDrive}
                                disabled={isLoadingDrive}
                                className="py-2 px-4 border border-ink-700 bg-ink-800 text-steel-400 font-bold text-[9px] uppercase rounded-lg hover:bg-ink-700 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isLoadingDrive ? (
                                    <>
                                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7.71 3.5L1.15 15l2.44 4.21L16.03 19l6.56-11.5-2.44-4.21L7.71 3.5zm.79 2l8.92.01 4.57 8-8.92-.01-4.57-8zM5.57 8.5l4.57 8-2.15-.01-4.57-8 2.15.01z" />
                                        </svg>
                                        Google Drive
                                    </>
                                )}
                            </button>
                        </div>
                        <textarea
                            value={script}
                            onChange={(e) => { setScript(e.target.value); setResult(null); setEditableCharacters([]); }}
                            placeholder="Paste your script here..."
                            className="flex-1 w-full bg-ink-950 border border-ink-700 rounded-xl p-4 font-mono text-xs text-steel-300 outline-none resize-none focus:border-ember-500 transition-colors"
                        />
                        <p className="text-[9px] font-mono text-steel-600 mt-2 italic">{getFormatHint()}</p>
                    </div>

                    <div className="w-96 flex flex-col p-6 bg-ink-950/50">
                        <button
                            onClick={handleParse}
                            disabled={!script.trim()}
                            className="w-full py-3 mb-6 bg-ember-500 hover:bg-ember-400 text-ink-950 font-bold text-xs uppercase tracking-widest rounded-lg disabled:opacity-30 transition-all"
                        >
                            Parse Script
                        </button>

                        {result && (
                            <div className="flex-1 overflow-y-auto space-y-4">
                                <div className={`p-4 border rounded-lg ${result.success ? 'bg-green-950/30 border-green-700/50' : 'bg-red-950/30 border-red-700/50'}`}> 
                                    <p className={`font-bold text-sm ${result.success ? 'text-green-400' : 'text-red-400'}`}> 
                                        {result.success ? '✓ Parse Successful' : '✗ Parse Failed'}
                                    </p>
                                    {result.errors.map((err, i) => (
                                        <p key={i} className="text-xs text-red-300 mt-1">{err}</p>
                                    ))} 
                                </div>

                                {result.success && (
                                    <> 
                                        <div className="grid grid-cols-3 gap-3">  
                                            <div className="bg-ink-800 rounded-lg p-3 text-center">  
                                                <p className="text-2xl font-display text-ember-500">{result.pages.length}</p>
                                                <p className="text-[9px] font-mono text-steel-500 uppercase">{getPageLabel()}</p>
                                            </div>
                                            <div className="bg-ink-800 rounded-lg p-3 text-center">  
                                                <p className="text-2xl font-display text-ember-500">{totalPanels}</p>
                                                <p className="text-[9px] font-mono text-steel-500 uppercase">{getPanelLabel()}</p>
                                            </div>
                                            <div className="bg-ink-800 rounded-lg p-3 text-center">  
                                                <p className="text-2xl font-display text-ember-500">{editableCharacters.length}</p>
                                                <p className="text-[9px] font-mono text-steel-500 uppercase">Characters</p>
                                            </div>
                                        </div>

                                        {/* Visual Markers / Shot Types */}
                                        {Object.keys(markerCounts).length > 0 && (
                                            <div className="bg-ink-800/50 rounded-lg p-3">
                                                <p className="text-[9px] font-mono text-steel-500 uppercase mb-2">
                                                    {project.projectType === 'screenplay' || project.projectType === 'tv-series' ? 'Shot Types' : 'Visual Markers'}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(markerCounts).map(([marker, count]) => (
                                                        <span
                                                            key={marker}
                                                            className={`text-[10px] px-2 py-1 rounded-full bg-ink-900 ${MARKER_COLORS[marker as VisualMarker] || 'text-steel-400'}`}
                                                        >
                                                            {marker}: {count}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Cast Detected - Editable with X buttons */}
                                        {editableCharacters.length > 0 && (
                                            <div className="bg-ink-800/50 rounded-lg p-3">
                                                <p className="text-[9px] font-mono text-steel-500 uppercase mb-2">Cast Detected</p>
                                                <p className="text-[8px] font-mono text-steel-600 mb-2 italic">Click × to remove incorrectly detected names</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {editableCharacters.map((char) => (
                                                        <span
                                                            key={char.name}
                                                            className="text-[10px] px-2 py-1 rounded-full bg-ink-900 text-steel-300 flex items-center gap-1.5 group hover:bg-ink-700 transition-colors"
                                                        >
                                                            {char.name}
                                                            <span className="text-steel-600 text-[9px]">({char.lineCount})</span>
                                                            <button
                                                                onClick={() => handleRemoveCharacter(char.name)}
                                                                className="w-4 h-4 flex items-center justify-center rounded-full bg-ink-700 hover:bg-red-500 text-steel-500 hover:text-white transition-all text-[10px] font-bold ml-1 opacity-60 group-hover:opacity-100"
                                                                title={`Remove ${char.name} from cast`}
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleImport}
                                            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-sm uppercase tracking-widest rounded-lg transition-all mt-4"
                                        >
                                            Import {result.pages.length} {getPageLabel()} → Storyboard
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
