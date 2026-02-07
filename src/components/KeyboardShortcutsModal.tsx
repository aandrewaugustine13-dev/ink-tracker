import React from 'react';
import { X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-mono font-semibold text-steel-200 bg-ink-800 border border-ink-700 rounded-md shadow-sm min-w-[2rem]">
    {children}
  </kbd>
);

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Detect platform for Cmd vs Ctrl
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  const shortcuts = {
    navigation: [
      { keys: ['←', '→', '↑', '↓'], description: 'Select next/previous panel' },
      { keys: [modKey, 'Z'], description: 'Undo' },
      { keys: [modKey, 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Escape'], description: 'Exit selection or close modals' },
      { keys: ['Space'], description: 'Pan canvas / Advance in presentation mode' },
    ],
    canvas: [
      { keys: ['Delete'], description: 'Remove selected panel' },
      { keys: ['Backspace'], description: 'Remove selected panel' },
      { keys: [modKey, 'C'], description: 'Copy panel settings' },
      { keys: [modKey, 'V'], description: 'Paste panel settings' },
      { keys: ['G'], description: 'Toggle gutters/dark mode' },
      { keys: ['N'], description: 'Navigation mode' },
    ],
    panels: [
      { keys: ['Tab'], description: 'Cycle through panels' },
      { keys: ['Enter'], description: 'Generate selected panel' },
      { keys: ['L'], description: 'Link to reference panel' },
    ],
    global: [
      { keys: ['?'], description: 'Show/hide this shortcut guide' },
      { keys: ['P'], description: 'Enter presentation mode' },
    ],
  };

  return (
    <div className="fixed inset-0 bg-ink-950/95 backdrop-blur-xl flex items-center justify-center z-[600] p-8 animate-fade-in">
      <div className="w-full max-w-[900px] bg-ink-900 border-2 border-ink-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-ink-700 flex items-center justify-between">
          <div>
            <h2 className="font-display text-3xl text-ember-500">Keyboard Shortcuts</h2>
            <p className="font-mono text-[10px] text-steel-500 mt-1 uppercase tracking-widest">
              Press ? or Escape to close
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-ink-800 hover:bg-red-500 text-steel-400 hover:text-white transition-all text-xl font-bold"
            aria-label="Close shortcuts modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* NAVIGATION */}
            <div className="mb-6">
              <h3 className="font-mono text-lg uppercase tracking-wider text-ember-400 mb-4">
                Navigation
              </h3>
              <div className="space-y-3">
                {shortcuts.navigation.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <Kbd>{key}</Kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-steel-500 text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="font-mono text-sm text-steel-400 ml-4 text-right">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CANVAS */}
            <div className="mb-6">
              <h3 className="font-mono text-lg uppercase tracking-wider text-ember-400 mb-4">
                Canvas
              </h3>
              <div className="space-y-3">
                {shortcuts.canvas.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <Kbd>{key}</Kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-steel-500 text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="font-mono text-sm text-steel-400 ml-4 text-right">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* PANELS */}
            <div className="mb-6">
              <h3 className="font-mono text-lg uppercase tracking-wider text-ember-400 mb-4">
                Panels
              </h3>
              <div className="space-y-3">
                {shortcuts.panels.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <Kbd>{key}</Kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-steel-500 text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="font-mono text-sm text-steel-400 ml-4 text-right">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* GLOBAL */}
            <div className="mb-6">
              <h3 className="font-mono text-lg uppercase tracking-wider text-ember-400 mb-4">
                Global
              </h3>
              <div className="space-y-3">
                {shortcuts.global.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <Kbd>{key}</Kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-steel-500 text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="font-mono text-sm text-steel-400 ml-4 text-right">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
