
import React, { useState } from 'react';
import { parseScript, ParseResult, VisualMarker } from '../services/scriptParser';

interface Props {
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

export function ScriptImportModal({ onClose, onImport }: Props) {
    const [script, setScript] = useState('');
    const [result, setResult] = useState<ParseResult | null>(null);
    const [editableCharacters, setEditableCharacters] = useState<ParseResult['characters']>([]);

    const handleParse = () => {
        const parsed = parseScript(script);
        setResult(parsed);
        setEditableCharacters(parsed.characters);
    };

    const handleImport = () => {
        if (result?.success) {
            // Create a new result object with the filtered characters
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
            };
            reader.readAsText(file);
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
        <p className="text-[10px] font-mono text-steel-500 mt-1 uppercase tracking-widest">Paste script or upload .txt file</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-ink-800 hover:bg-red-500 text-steel-400 hover:text-white transition-all text-xl font-bold">×</button>
        </div>

        <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-6 border-r border-ink-700">
        <div className="mb-4">
        <input
        type="file"
        accept=".txt,.md"
        onChange={handleFile}
        className="text-[10px] text-steel-400 file:mr-3 file:py-2 file:px-4 file:border file:border-ink-700 file:bg-ink-800 file:text-ember-500 file:font-bold file:text-[9px] file:uppercase file:cursor-pointer file:rounded-lg hover:file:bg-ink-700"
        />
        </div>
        <textarea
        value={script}
        onChange={(e) => { setScript(e.target.value); setResult(null); }}
        placeholder={`# MY GRAPHIC NOVEL

## Issue #1: "The Beginning"

**Written by Your Name**

---

### PAGE ONE (5 Panels)

**Panel 1**
Wide establishing shot. City street at dusk.

> CAPTION: Two hours earlier.

**Panel 2**
Close on DETECTIVE JACK, lighting a cigarette.

> **JACK:** This city never sleeps.
> **JACK (thought):** Neither do I anymore.

**Panel 3 (Split Panel)**
Jack sees movement in the alley.

> SFX: BANG

**Panel 4**
He draws his weapon.

> **JACK (whisper):** Got you.`}
            className="flex-1 w-full bg-ink-950 border border-ink-700 rounded-xl p-4 font-mono text-xs text-steel-300 outline-none resize-none focus:border-ember-500 transition-colors"
            />
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
                    {/* Issue Info */}
                    {result.issue && (
                        <div className="bg-ink-800 rounded-lg p-4 mb-2">
                        <p className="text-sm font-display text-ember-500 uppercase tracking-wide">
                            {result.issue.title}
                        </p>
                        {result.issue.issueNumber && (
                            <p className="text-xs font-mono text-steel-400 mt-1">
                                Issue #{result.issue.issueNumber}{result.issue.subtitle && `: "${result.issue.subtitle}"`}
                            </p>
                        )}
                        {result.issue.writer && (
                            <p className="text-[10px] font-mono text-steel-500 mt-1">
                                Written by {result.issue.writer}
                            </p>
                        )}
                        {result.issue.timeline && (
                            <p className="text-[10px] font-mono text-steel-600 mt-1 italic">
                                {result.issue.timeline}
                            </p>
                        )}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                    <div className="bg-ink-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-display text-ember-500">{result.pages.length}</p>
                    <p className="text-[9px] font-mono text-steel-500 uppercase">Pages</p>
                    </div>
                    <div className="bg-ink-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-display text-ember-500">{totalPanels}</p>
                    <p className="text-[9px] font-mono text-steel-500 uppercase">Panels</p>
                    </div>
                    <div className="bg-ink-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-display text-ember-500">{editableCharacters.length}</p>
                    <p className="text-[9px] font-mono text-steel-500 uppercase">Characters</p>
                    </div>
                    </div>

                    {Object.keys(markerCounts).length > 0 && (
                        <div className="bg-ink-800 rounded-lg p-4">
                        <p className="text-[10px] font-mono text-steel-500 uppercase mb-2">Visual Markers Detected</p>
                        <div className="flex flex-wrap gap-2">
                        {Object.entries(markerCounts).map(([marker, count]) => (
                            <span key={marker} className={`text-[10px] font-mono px-2 py-1 rounded-full bg-ink-900 ${MARKER_COLORS[marker as VisualMarker]}`}>
                            {marker}: {count}
                            </span>
                        ))}
                        </div>
                        </div>
                    )}

                    <div className="bg-ink-800 rounded-lg p-4">
                    <p className="text-[10px] font-mono text-steel-500 uppercase mb-2">Cast Detected</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                    {editableCharacters.map(char => (
                        <div key={char.name} className="flex items-start gap-2">
                            <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-ink-900 text-steel-300 flex-shrink-0">
                                {char.name} <span className="text-steel-600">({char.lineCount})</span>
                            </span>
                            {char.description && (
                                <span className="text-[9px] text-steel-500 leading-tight">
                                    {char.description.slice(0, 80)}{char.description.length > 80 ? '...' : ''}
                                </span>
                            )}
                            <button
                                onClick={() => handleRemoveCharacter(char.name)}
                                className="ml-auto w-5 h-5 flex items-center justify-center rounded-full bg-ink-900 hover:bg-red-500 text-steel-400 hover:text-white transition-all text-sm font-bold flex-shrink-0"
                                title="Remove character"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    </div>
                    </div>

                    {result.warnings.length > 0 && (
                        <div className="bg-amber-950/30 border border-amber-700/50 rounded-lg p-4">
                        <p className="text-[10px] font-mono text-amber-500 uppercase mb-2">Warnings</p>
                        {result.warnings.map((warn, i) => (
                            <p key={i} className="text-xs text-amber-300">{warn}</p>
                        ))}
                        </div>
                    )}

                    <button
                    onClick={handleImport}
                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-sm uppercase tracking-widest rounded-lg transition-all mt-4"
                    >
                    Import {result.pages.length} Pages → Storyboard
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
