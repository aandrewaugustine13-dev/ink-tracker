import React, { useState, useEffect } from 'react';
import { AppState } from '../types';
import { Action } from '../state/actions';
import { HelpCircle, FileText, Square, Sparkles, Image as ImageIcon, Zap } from 'lucide-react';

interface OnboardingModalProps {
    onClose: () => void;
    dispatch: React.Dispatch<Action>;
    state: AppState;
}

type ImageProvider = 'gemini' | 'leonardo' | 'grok' | 'fal' | 'seaart' | 'openai';

interface ProviderInfo {
    name: string;
    description: string;
    link: string;
}

const PROVIDER_INFO: Record<ImageProvider, ProviderInfo> = {
    gemini: {
        name: 'Gemini',
        description: 'Google\'s multimodal AI, fast generation with good quality',
        link: 'https://ai.google.dev'
    },
    leonardo: {
        name: 'Leonardo',
        description: 'High-quality artistic generation with style controls',
        link: 'https://leonardo.ai'
    },
    grok: {
        name: 'Grok',
        description: 'Fast and creative AI from X/Twitter',
        link: 'https://console.x.ai'
    },
    fal: {
        name: 'FAL',
        description: 'High-performance Flux models for professional results',
        link: 'https://fal.ai'
    },
    seaart: {
        name: 'SeaArt',
        description: 'Specialized in anime and artistic styles',
        link: 'https://seaart.ai/api'
    },
    openai: {
        name: 'OpenAI',
        description: 'DALL-E 3 for consistent, high-quality images',
        link: 'https://platform.openai.com/api-keys'
    }
};

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose, dispatch, state }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [projectTitle, setProjectTitle] = useState('');
    const [projectType, setProjectType] = useState<'comic' | 'screenplay' | 'stage-play' | 'tv-series'>('comic');
    const [issueType, setIssueType] = useState<'issue' | 'chapter'>('issue');
    const [selectedProvider, setSelectedProvider] = useState<ImageProvider | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [selectedPath, setSelectedPath] = useState<'import' | 'manual' | null>(null);
    const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

    // Update issue type based on project type
    useEffect(() => {
        if (projectType === 'comic') {
            setIssueType('issue');
        } else {
            setIssueType('chapter');
        }
    }, [projectType]);

    const handleSkip = () => {
        localStorage.setItem('ink_tracker_onboarding_completed', 'true');
        onClose();
    };

    const handleNext = () => {
        if (currentStep === 2) {
            // Create project
            const projectId = `project-${Date.now()}`;
            setCreatedProjectId(projectId);
            dispatch({ 
                type: 'ADD_PROJECT', 
                title: projectTitle.trim(), 
                projectType 
            });
            setCurrentStep(3);
        } else if (currentStep === 3) {
            // Set provider and API key if selected
            if (selectedProvider && createdProjectId) {
                const project = state.projects.find(p => p.title === projectTitle.trim());
                if (project) {
                    dispatch({
                        type: 'UPDATE_PROJECT',
                        id: project.id,
                        updates: { imageProvider: selectedProvider }
                    });
                    
                    if (apiKey) {
                        const keyAction = `UPDATE_PROJECT_${selectedProvider.toUpperCase()}_KEY` as any;
                        dispatch({
                            type: keyAction,
                            projectId: project.id,
                            apiKey: apiKey
                        });
                    }
                }
            }
            setCurrentStep(4);
        } else if (currentStep === 4) {
            if (selectedPath === 'import') {
                // Close onboarding and open script import
                localStorage.setItem('ink_tracker_onboarding_completed', 'true');
                onClose();
                // Trigger script import - parent component should handle this
                setTimeout(() => {
                    const event = new CustomEvent('openScriptImport');
                    window.dispatchEvent(event);
                }, 100);
            } else {
                setCurrentStep(5);
            }
        } else if (currentStep === 5) {
            // Complete onboarding
            localStorage.setItem('ink_tracker_onboarding_completed', 'true');
            onClose();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const canProceedStep2 = projectTitle.trim().length > 0;
    const canProceedStep4 = selectedPath !== null;

    const handleEscKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (currentStep > 2 || projectTitle.length > 0) {
                if (confirm('Exit onboarding? Your progress will not be saved.')) {
                    onClose();
                }
            } else {
                onClose();
            }
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-ink-950/95 backdrop-blur-xl flex items-center justify-center z-[700] p-8 animate-fade-in"
            onKeyDown={handleEscKey}
        >
            <div className="w-full max-w-[800px] bg-ink-900 border-2 border-ink-700 rounded-2xl shadow-2xl overflow-hidden">
                
                {/* Header with Step Indicator */}
                <div className="p-8 border-b border-ink-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="font-mono text-xs text-steel-500 uppercase tracking-widest">
                            Step {currentStep}/5
                        </span>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(step => (
                                <div 
                                    key={step}
                                    className={`h-2 w-8 rounded-full transition-all ${
                                        step <= currentStep ? 'bg-ember-500' : 'bg-ink-700'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                    <button 
                        onClick={handleSkip} 
                        className="font-mono text-xs text-steel-500 hover:text-ember-500 transition-colors uppercase tracking-widest"
                    >
                        Skip Tutorial
                    </button>
                </div>

                {/* Content */}
                <div className="p-10 min-h-[500px]">
                    {currentStep === 1 && (
                        <div className="space-y-8">
                            <div className="text-center space-y-4">
                                <h2 className="font-display text-5xl tracking-widest text-steel-100 uppercase">
                                    Welcome to Ink Tracker
                                </h2>
                                <p className="font-mono text-sm text-steel-400 max-w-2xl mx-auto">
                                    Professional comic, screenplay, and storyboard creation powered by AI
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mt-8">
                                <div className="p-6 bg-ink-950/50 border border-ink-700 rounded-xl space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-ember-500/20 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-ember-500" />
                                    </div>
                                    <h3 className="font-display text-xl text-steel-200 uppercase">Multi-Provider AI</h3>
                                    <p className="font-mono text-xs text-steel-500 leading-relaxed">
                                        Generate images with Gemini, Leonardo, FAL, Grok, SeaArt, or OpenAI
                                    </p>
                                </div>

                                <div className="p-6 bg-ink-950/50 border border-ink-700 rounded-xl space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-ember-500/20 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-ember-500" />
                                    </div>
                                    <h3 className="font-display text-xl text-steel-200 uppercase">Script Import</h3>
                                    <p className="font-mono text-xs text-steel-500 leading-relaxed">
                                        Automatically parse scripts into panels with dialogue and descriptions
                                    </p>
                                </div>

                                <div className="p-6 bg-ink-950/50 border border-ink-700 rounded-xl space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-ember-500/20 flex items-center justify-center">
                                        <HelpCircle className="w-5 h-5 text-ember-500" />
                                    </div>
                                    <h3 className="font-display text-xl text-steel-200 uppercase">Character Bank</h3>
                                    <p className="font-mono text-xs text-steel-500 leading-relaxed">
                                        Maintain character consistency across all panels with detailed profiles
                                    </p>
                                </div>

                                <div className="p-6 bg-ink-950/50 border border-ink-700 rounded-xl space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-ember-500/20 flex items-center justify-center">
                                        <ImageIcon className="w-5 h-5 text-ember-500" />
                                    </div>
                                    <h3 className="font-display text-xl text-steel-200 uppercase">Export Options</h3>
                                    <p className="font-mono text-xs text-steel-500 leading-relaxed">
                                        Export your work to PDF, PNG, or ZIP for print and digital distribution
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-8">
                            <div className="text-center space-y-4">
                                <h2 className="font-display text-4xl tracking-widest text-steel-100 uppercase">
                                    Create Your First Project
                                </h2>
                                <p className="font-mono text-sm text-steel-400">
                                    Set up your project details to get started
                                </p>
                            </div>

                            <div className="max-w-lg mx-auto space-y-6">
                                <div>
                                    <label className="block text-[10px] font-mono text-steel-400 uppercase tracking-widest mb-2">
                                        Project Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={projectTitle}
                                        onChange={(e) => setProjectTitle(e.target.value)}
                                        placeholder="Enter project title..."
                                        className="w-full bg-ink-950 border border-ink-700 rounded-lg px-4 py-3 text-sm text-steel-300 font-mono outline-none focus:border-ember-500 transition-colors"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-mono text-steel-400 uppercase tracking-widest mb-2">
                                        Project Type *
                                    </label>
                                    <select
                                        value={projectType}
                                        onChange={(e) => setProjectType(e.target.value as typeof projectType)}
                                        className="w-full bg-ink-950 border border-ink-700 rounded-lg px-4 py-3 text-sm text-steel-300 font-mono outline-none focus:border-ember-500 transition-colors cursor-pointer"
                                    >
                                        <option value="comic">Comic / Graphic Novel</option>
                                        <option value="screenplay">Screenplay</option>
                                        <option value="stage-play">Stage Play</option>
                                        <option value="tv-series">TV Series</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-mono text-steel-400 uppercase tracking-widest mb-2">
                                        {projectType === 'comic' ? 'Issue Type' : 'Chapter Type'}
                                    </label>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setIssueType('issue')}
                                            className={`flex-1 py-3 px-4 rounded-lg border transition-all font-mono text-sm ${
                                                issueType === 'issue'
                                                    ? 'bg-ember-500 border-ember-500 text-ink-950'
                                                    : 'bg-ink-950 border-ink-700 text-steel-400 hover:border-steel-500'
                                            }`}
                                        >
                                            Issue
                                        </button>
                                        <button
                                            onClick={() => setIssueType('chapter')}
                                            className={`flex-1 py-3 px-4 rounded-lg border transition-all font-mono text-sm ${
                                                issueType === 'chapter'
                                                    ? 'bg-ember-500 border-ember-500 text-ink-950'
                                                    : 'bg-ink-950 border-ink-700 text-steel-400 hover:border-steel-500'
                                            }`}
                                        >
                                            Chapter
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-8">
                            <div className="text-center space-y-4">
                                <h2 className="font-display text-4xl tracking-widest text-steel-100 uppercase">
                                    Choose Your Image Provider
                                </h2>
                                <p className="font-mono text-sm text-steel-400">
                                    Select an AI provider for image generation (you can change this later)
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {(Object.keys(PROVIDER_INFO) as ImageProvider[]).map(provider => (
                                    <button
                                        key={provider}
                                        onClick={() => setSelectedProvider(provider)}
                                        className={`p-6 rounded-xl border-2 transition-all text-left ${
                                            selectedProvider === provider
                                                ? 'border-ember-500 bg-ember-500/10'
                                                : 'border-ink-700 bg-ink-950/50 hover:border-steel-500'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-display text-xl text-steel-200 uppercase">
                                                {PROVIDER_INFO[provider].name}
                                            </h3>
                                            {selectedProvider === provider && (
                                                <div className="w-5 h-5 rounded-full bg-ember-500 flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-ink-950" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-mono text-xs text-steel-500 leading-relaxed">
                                            {PROVIDER_INFO[provider].description}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            {selectedProvider && (
                                <div className="max-w-lg mx-auto space-y-3 animate-fade-in">
                                    <label className="block text-[10px] font-mono text-steel-400 uppercase tracking-widest">
                                        API Key (Optional)
                                    </label>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="Enter your API key..."
                                        className="w-full bg-ink-950 border border-ink-700 rounded-lg px-4 py-3 text-sm text-steel-300 font-mono outline-none focus:border-ember-500 transition-colors"
                                    />
                                    <p className="font-mono text-xs text-steel-500">
                                        Get your API key at{' '}
                                        <a 
                                            href={PROVIDER_INFO[selectedProvider].link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-ember-500 hover:text-ember-400 underline"
                                        >
                                            {PROVIDER_INFO[selectedProvider].link}
                                        </a>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-8">
                            <div className="text-center space-y-4">
                                <h2 className="font-display text-4xl tracking-widest text-steel-100 uppercase">
                                    How Would You Like to Start?
                                </h2>
                                <p className="font-mono text-sm text-steel-400">
                                    Choose your preferred workflow
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
                                <button
                                    onClick={() => setSelectedPath('import')}
                                    className={`p-8 rounded-xl border-2 transition-all text-center space-y-4 ${
                                        selectedPath === 'import'
                                            ? 'border-ember-500 bg-ember-500/10'
                                            : 'border-ink-700 bg-ink-950/50 hover:border-steel-500'
                                    }`}
                                >
                                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                                        selectedPath === 'import' ? 'bg-ember-500' : 'bg-ink-800'
                                    }`}>
                                        <FileText className={`w-8 h-8 ${
                                            selectedPath === 'import' ? 'text-ink-950' : 'text-steel-400'
                                        }`} />
                                    </div>
                                    <div>
                                        <h3 className="font-display text-2xl text-steel-200 uppercase mb-2">
                                            Import Script
                                        </h3>
                                        <p className="font-mono text-xs text-steel-500 leading-relaxed">
                                            Already have a script? Import it to automatically generate panels
                                        </p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedPath('manual')}
                                    className={`p-8 rounded-xl border-2 transition-all text-center space-y-4 ${
                                        selectedPath === 'manual'
                                            ? 'border-ember-500 bg-ember-500/10'
                                            : 'border-ink-700 bg-ink-950/50 hover:border-steel-500'
                                    }`}
                                >
                                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                                        selectedPath === 'manual' ? 'bg-ember-500' : 'bg-ink-800'
                                    }`}>
                                        <Square className={`w-8 h-8 ${
                                            selectedPath === 'manual' ? 'text-ink-950' : 'text-steel-400'
                                        }`} />
                                    </div>
                                    <div>
                                        <h3 className="font-display text-2xl text-steel-200 uppercase mb-2">
                                            Add Manual Panel
                                        </h3>
                                        <p className="font-mono text-xs text-steel-500 leading-relaxed">
                                            Start from scratch by adding panels to your first page
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="space-y-8">
                            <div className="text-center space-y-4">
                                <h2 className="font-display text-4xl tracking-widest text-steel-100 uppercase">
                                    Canvas Controls
                                </h2>
                                <p className="font-mono text-sm text-steel-400">
                                    Quick tips to help you get started
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-ink-950/50 border border-ink-700 rounded-xl space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-ember-500/20 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-ember-500" />
                                    </div>
                                    <h3 className="font-mono text-xs text-steel-300 uppercase tracking-widest">
                                        Pan &amp; Zoom
                                    </h3>
                                    <p className="font-mono text-xs text-steel-500 leading-relaxed">
                                        Use the zoom button in the toolbar to enable pan and zoom controls
                                    </p>
                                </div>

                                <div className="p-6 bg-ink-950/50 border border-ink-700 rounded-xl space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-ember-500/20 flex items-center justify-center">
                                        <Square className="w-5 h-5 text-ember-500" />
                                    </div>
                                    <h3 className="font-mono text-xs text-steel-300 uppercase tracking-widest">
                                        Add Panels
                                    </h3>
                                    <p className="font-mono text-xs text-steel-500 leading-relaxed">
                                        Click "Add Frame" to create new panels on your page
                                    </p>
                                </div>

                                <div className="p-6 bg-ink-950/50 border border-ink-700 rounded-xl space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-ember-500/20 flex items-center justify-center">
                                        <HelpCircle className="w-5 h-5 text-ember-500" />
                                    </div>
                                    <h3 className="font-mono text-xs text-steel-300 uppercase tracking-widest">
                                        Character Bank
                                    </h3>
                                    <p className="font-mono text-xs text-steel-500 leading-relaxed">
                                        Add characters to maintain consistency across your project
                                    </p>
                                </div>

                                <div className="p-6 bg-ink-950/50 border border-ink-700 rounded-xl space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-ember-500/20 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-ember-500" />
                                    </div>
                                    <h3 className="font-mono text-xs text-steel-300 uppercase tracking-widest">
                                        Present Mode
                                    </h3>
                                    <p className="font-mono text-xs text-steel-500 leading-relaxed">
                                        Preview your work in full-screen cinematic presentation mode
                                    </p>
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="font-mono text-xs text-steel-500">
                                    Click the <HelpCircle className="inline w-4 h-4 mx-1" /> button in the toolbar anytime to revisit this tutorial
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-ink-700 flex justify-between">
                    {currentStep > 1 && (
                        <button
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="px-6 py-3 bg-ink-800 hover:bg-ink-700 text-steel-400 hover:text-steel-300 font-mono text-xs rounded-lg uppercase tracking-widest transition-all border border-ink-700"
                        >
                            Back
                        </button>
                    )}
                    {currentStep === 1 && <div />}
                    <button
                        onClick={handleNext}
                        disabled={currentStep === 2 && !canProceedStep2 || currentStep === 4 && !canProceedStep4}
                        className="px-8 py-3 bg-ember-500 hover:bg-ember-400 text-ink-950 font-mono text-xs rounded-lg uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 ml-auto"
                    >
                        {currentStep === 1 ? "Let's Get Started" : 
                         currentStep === 4 && selectedPath === 'import' ? 'Import Script' :
                         currentStep === 5 ? 'Start Creating!' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
