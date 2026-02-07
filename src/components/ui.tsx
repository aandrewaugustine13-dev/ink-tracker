/**
 * Shared UI primitives – buttons, inline validation, toast notifications.
 *
 * Button hierarchy:
 *   BtnPrimary   – ember bg, dark text, rounded-lg, font-mono xs bold uppercase
 *   BtnSecondary – ink-800 bg, steel text, border ink-700
 *   BtnDanger    – transparent bg, danger text, danger border on hover
 *   BtnGhost     – no bg, steel text, subtle hover
 *
 * All buttons share: px-4 py-2, text-[11px], font-mono, uppercase, tracking-widest,
 *                    rounded-lg, transition-all, disabled:opacity-40
 */

import React, { useState, useEffect, useCallback } from 'react';

/* ================================================================== */
/*  BUTTONS                                                           */
/* ================================================================== */

const BASE = 'inline-flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-mono font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]';

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const BtnPrimary: React.FC<BtnProps> = ({ className = '', ...props }) => (
    <button className={`${BASE} bg-ember-500 hover:bg-ember-400 text-ink-950 shadow-sm ${className}`} {...props} />
);

export const BtnSecondary: React.FC<BtnProps> = ({ className = '', ...props }) => (
    <button className={`${BASE} bg-ink-800 hover:bg-ink-700 text-steel-300 border border-ink-700 hover:border-steel-600 ${className}`} {...props} />
);

export const BtnDanger: React.FC<BtnProps> = ({ className = '', ...props }) => (
    <button className={`${BASE} bg-transparent hover:bg-danger-muted text-danger border border-transparent hover:border-danger/30 ${className}`} {...props} />
);

export const BtnGhost: React.FC<BtnProps> = ({ className = '', ...props }) => (
    <button className={`${BASE} bg-transparent hover:bg-ink-800 text-steel-400 hover:text-steel-200 ${className}`} {...props} />
);

/* ================================================================== */
/*  INLINE FIELD VALIDATION                                           */
/* ================================================================== */

type ValidationSeverity = 'error' | 'warning' | 'success' | 'info';

interface InlineValidationProps {
    message: string;
    severity?: ValidationSeverity;
    show?: boolean;
}

const SEVERITY_STYLES: Record<ValidationSeverity, string> = {
    error:   'text-danger   bg-danger-muted/40  border-danger/30',
    warning: 'text-warning  bg-warning-muted/40 border-warning/30',
    success: 'text-success  bg-success-muted/40 border-success/30',
    info:    'text-info     bg-info-muted/40    border-info/30',
};

const SEVERITY_ICONS: Record<ValidationSeverity, string> = {
    error:   '✕',
    warning: '!',
    success: '✓',
    info:    'i',
};

/**
 * Inline validation message displayed directly below a form field.
 */
export const InlineValidation: React.FC<InlineValidationProps> = ({
    message,
    severity = 'error',
    show = true,
}) => {
    if (!show || !message) return null;

    return (
        <div className={`flex items-start gap-2 mt-1.5 px-2.5 py-1.5 rounded-md border text-[10px] font-mono leading-relaxed animate-fade-in ${SEVERITY_STYLES[severity]}`}>
            <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold bg-current/10 mt-px">
                {SEVERITY_ICONS[severity]}
            </span>
            <span>{message}</span>
        </div>
    );
};

/* ================================================================== */
/*  TOAST NOTIFICATIONS                                               */
/* ================================================================== */

export interface ToastMessage {
    id: string;
    text: string;
    severity: ValidationSeverity;
}

interface ToastContainerProps {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

/**
 * Floating toast container – renders at top-right of screen.
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none">
            {toasts.map(t => (
                <Toast key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>
    );
};

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl animate-fade-in ${SEVERITY_STYLES[toast.severity]}`}>
            <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-current/10">
                {SEVERITY_ICONS[toast.severity]}
            </span>
            <span className="text-xs font-mono leading-relaxed flex-1">{toast.text}</span>
            <button
                onClick={() => onDismiss(toast.id)}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity text-sm leading-none"
            >
                ×
            </button>
        </div>
    );
};

/* ================================================================== */
/*  useToast hook                                                     */
/* ================================================================== */

let toastCounter = 0;

export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((text: string, severity: ValidationSeverity = 'info') => {
        const id = `toast-${++toastCounter}`;
        setToasts(prev => [...prev, { id, text, severity }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, addToast, dismissToast };
}

/* ================================================================== */
/*  SECTION HEADER (sidebar visual hierarchy)                         */
/* ================================================================== */

interface SectionHeaderProps {
    title: string;
    /** Smaller supporting text underneath */
    subtitle?: string;
    /** Right-side slot (buttons, badges) */
    actions?: React.ReactNode;
}

/**
 * Consistent sidebar section heading with visual hierarchy.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, actions }) => (
    <div className="flex items-center justify-between mb-3 px-1">
        <div>
            <h2 className="text-[11px] font-mono text-steel-300 uppercase tracking-[0.15em] font-bold">
                {title}
            </h2>
            {subtitle && (
                <p className="text-[9px] font-mono text-steel-600 mt-0.5">{subtitle}</p>
            )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
);

/* ================================================================== */
/*  API KEY HINTS                                                     */
/* ================================================================== */

/**
 * Returns a provider-specific hint about what the API key looks like.
 */
export function getApiKeyHint(provider: string): string {
    switch (provider) {
        case 'gemini':  return 'Gemini keys usually start with "AIza..."';
        case 'leonardo': return 'Find your key at leonardo.ai/settings';
        case 'grok':    return 'Get your key from console.x.ai';
        case 'fal':     return 'FAL keys look like a UUID (xxxxxxxx-xxxx-...)';
        case 'seaart':  return 'Find your key in the SeaArt API dashboard';
        case 'openai':  return 'OpenAI keys start with "sk-..."';
        default:        return 'Enter your API key to enable image generation';
    }
}

/**
 * Basic format validation for common key patterns.
 * Returns an error string or null if valid.
 */
export function validateApiKeyFormat(provider: string, key: string): string | null {
    if (!key.trim()) return null; // empty is not a format error, it's a "required" state

    switch (provider) {
        case 'gemini':
            if (key.length < 30) return 'Gemini keys are typically 39+ characters';
            break;
        case 'openai':
            if (!key.startsWith('sk-')) return 'OpenAI keys should start with "sk-"';
            break;
        case 'fal':
            if (key.length < 10) return 'This key looks too short for FAL';
            break;
    }
    return null;
}
