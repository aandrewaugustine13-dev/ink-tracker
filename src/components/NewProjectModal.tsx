import React, { useState } from 'react';
import { Action } from '../state/actions';
import { BtnPrimary, BtnSecondary, InlineValidation } from './ui';

interface NewProjectModalProps {
    onClose: () => void;
    dispatch: React.Dispatch<Action>;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, dispatch }) => {
    const [projectTitle, setProjectTitle] = useState('');
    const [projectType, setProjectType] = useState<'comic' | 'screenplay' | 'stage-play' | 'tv-series'>('comic');
    const [titleError, setTitleError] = useState<string | null>(null);

    const handleCreate = () => {
        if (!projectTitle.trim()) {
            setTitleError('Project title is required');
            return;
        }
        setTitleError(null);
        dispatch({ type: 'ADD_PROJECT', title: projectTitle.trim(), projectType });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-ink-950/95 backdrop-blur-xl flex items-center justify-center z-[600] p-8">
            <div className="w-full max-w-md bg-ink-900 border-2 border-ink-700 rounded-2xl shadow-2xl overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-ink-700 flex items-center justify-between">
                    <div>
                        <h2 className="font-display text-3xl tracking-widest text-ember-500 uppercase">New Project</h2>
                        <p className="text-[10px] font-mono text-steel-500 mt-1 uppercase tracking-widest">Initialize Sequence</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-ink-800 hover:bg-danger text-steel-400 hover:text-white transition-all text-xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-[10px] font-mono text-steel-400 uppercase tracking-widest mb-2 font-bold">
                            Project Title
                        </label>
                        <input
                            type="text"
                            value={projectTitle}
                            onChange={(e) => { setProjectTitle(e.target.value); setTitleError(null); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                            placeholder="Enter project title..."
                            className={`w-full bg-ink-950 border rounded-lg px-4 py-3 text-sm text-steel-300 font-mono outline-none transition-colors ${
                                titleError ? 'border-danger/60 focus:border-danger' : 'border-ink-700 focus:border-ember-500'
                            }`}
                            autoFocus
                        />
                        <InlineValidation message={titleError || ''} severity="error" show={!!titleError} />
                    </div>

                    <div>
                        <label className="block text-[10px] font-mono text-steel-400 uppercase tracking-widest mb-2 font-bold">
                            Project Type
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
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-ink-700 flex gap-3">
                    <BtnSecondary onClick={onClose} className="flex-1 py-3">Cancel</BtnSecondary>
                    <BtnPrimary onClick={handleCreate} className="flex-1 py-3">Create</BtnPrimary>
                </div>
            </div>
        </div>
    );
};

export default NewProjectModal;
