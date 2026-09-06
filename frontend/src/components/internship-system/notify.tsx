import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, CircleAlert, Info, X, XCircle } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

type ToastItem = {
    id: number;
    message: string;
    kind: ToastKind;
};

export type ConfirmOptions = {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
};

type ConfirmState = ConfirmOptions & {
    message: string;
    resolve: (ok: boolean) => void;
};

export type PromptOptions = {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
};

type PromptState = PromptOptions & {
    message: string;
    resolve: (val: string | null) => void;
};

type Listener = (toast: ToastItem) => void;

/** Survive Vite HMR / duplicate module instances — never fall back to window.confirm */
type NotifyBus = {
    listeners: Set<Listener>;
    nextId: number;
    confirmHandler: ((state: ConfirmState) => void) | null;
    pendingConfirms: ConfirmState[];
    promptHandler: ((state: PromptState) => void) | null;
    pendingPrompts: PromptState[];
};

const BUS_KEY = '__bu_internship_notify_bus__';

function getBus(): NotifyBus {
    const g = globalThis as typeof globalThis & { [BUS_KEY]?: NotifyBus };
    if (!g[BUS_KEY]) {
        g[BUS_KEY] = {
            listeners: new Set(),
            nextId: 1,
            confirmHandler: null,
            pendingConfirms: [],
            promptHandler: null,
            pendingPrompts: [],
        };
    }
    return g[BUS_KEY];
}

function emit(message: string, kind: ToastKind) {
    const bus = getBus();
    const toast: ToastItem = { id: bus.nextId++, message: String(message || ''), kind };
    bus.listeners.forEach((fn) => fn(toast));
}

/** Imperative toast / confirm API — never uses native browser dialogs */
export const notify = {
    success: (message: string) => emit(message, 'success'),
    error: (message: string) => emit(message, 'error'),
    info: (message: string) => emit(message, 'info'),
    warning: (message: string) => emit(message, 'warning'),
    confirm: (message: string, options: ConfirmOptions = {}): Promise<boolean> => {
        const bus = getBus();
        return new Promise((resolve) => {
            const state: ConfirmState = {
                message,
                title: options.title,
                confirmLabel: options.confirmLabel,
                cancelLabel: options.cancelLabel,
                danger: options.danger,
                resolve,
            };
            if (bus.confirmHandler) {
                bus.confirmHandler(state);
            } else {
                bus.pendingConfirms.push(state);
            }
        });
    },
    prompt: (message: string, options: PromptOptions = {}): Promise<string | null> => {
        const bus = getBus();
        return new Promise((resolve) => {
            const state: PromptState = {
                message,
                title: options.title,
                confirmLabel: options.confirmLabel,
                cancelLabel: options.cancelLabel,
                resolve,
            };
            if (bus.promptHandler) {
                bus.promptHandler(state);
            } else {
                bus.pendingPrompts.push(state);
            }
        });
    },
};

const ICONS = {
    success: CheckCircle2,
    error: XCircle,
    warning: CircleAlert,
    info: Info,
};

/** Reusable centered confirm modal (React state). */
export function ConfirmModal({
    open,
    title = 'Confirm',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            className="app-confirm-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-confirm-title"
            onClick={onCancel}
        >
            <div
                className="app-confirm-card"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="app-confirm-title">{title}</h3>
                <p>{message}</p>
                <div className="app-confirm-actions">
                    <button type="button" className="btn-secondary" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={danger ? 'btn-danger' : 'btn-primary'}
                        onClick={onConfirm}
                        autoFocus
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function PromptModal({
    open,
    title = 'Prompt',
    message,
    confirmLabel = 'Submit',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: (val: string) => void;
    onCancel: () => void;
}) {
    const [val, setVal] = useState('');
    
    useEffect(() => {
        if (!open) {
            setVal('');
            return undefined;
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            className="app-confirm-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-prompt-title"
            onClick={onCancel}
        >
            <div
                className="app-confirm-card"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="app-prompt-title">{title}</h3>
                <p>{message}</p>
                <input
                    type="text"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && val.trim()) onConfirm(val);
                    }}
                    style={{ width: '100%', padding: '10px', marginTop: '10px', marginBottom: '20px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                />
                <div className="app-confirm-actions">
                    <button type="button" className="btn-secondary" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => onConfirm(val)}
                        disabled={!val.trim()}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ToastHost() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [confirm, setConfirm] = useState<ConfirmState | null>(null);
    const [prompt, setPrompt] = useState<PromptState | null>(null);

    useEffect(() => {
        const bus = getBus();
        const onToast: Listener = (toast) => {
            setToasts((prev) => [...prev.slice(-4), toast]);
        };
        bus.listeners.add(onToast);
        bus.confirmHandler = (state) => setConfirm(state);
        bus.promptHandler = (state) => setPrompt(state);
        // Flush any confirms requested before host mounted
        if (bus.pendingConfirms.length) {
            const next = bus.pendingConfirms.shift()!;
            setConfirm(next);
        }
        if (bus.pendingPrompts.length) {
            const next = bus.pendingPrompts.shift()!;
            setPrompt(next);
        }
        return () => {
            bus.listeners.delete(onToast);
            if (bus.confirmHandler) bus.confirmHandler = null;
            if (bus.promptHandler) bus.promptHandler = null;
        };
    }, []);

    useEffect(() => {
        if (!toasts.length) return undefined;
        const timers = toasts.map((t) =>
            window.setTimeout(() => {
                setToasts((prev) => prev.filter((x) => x.id !== t.id));
            }, t.kind === 'error' ? 6500 : 4200),
        );
        return () => timers.forEach(clearTimeout);
    }, [toasts]);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
    }, []);

    const closeConfirm = useCallback((ok: boolean) => {
        setConfirm((current) => {
            if (!current) return null;
            current.resolve(ok);
            const bus = getBus();
            const next = bus.pendingConfirms.shift();
            return next || null;
        });
    }, []);

    const closePrompt = useCallback((val: string | null) => {
        setPrompt((current) => {
            if (!current) return null;
            current.resolve(val);
            const bus = getBus();
            const next = bus.pendingPrompts.shift();
            return next || null;
        });
    }, []);

    return (
        <>
            <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
                {toasts.map((t) => {
                    const Icon = ICONS[t.kind];
                    return (
                        <div key={t.id} className={`toast-item toast-${t.kind}`} role="status">
                            <Icon size={18} className="toast-icon" aria-hidden />
                            <p className="toast-message">{t.message}</p>
                            <button
                                type="button"
                                className="toast-dismiss"
                                aria-label="Dismiss"
                                onClick={() => dismiss(t.id)}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>

            <ConfirmModal
                open={Boolean(confirm)}
                title={confirm?.title || (confirm?.danger ? 'Please confirm' : 'Confirm')}
                message={confirm?.message || ''}
                confirmLabel={confirm?.confirmLabel || 'Confirm'}
                cancelLabel={confirm?.cancelLabel || 'Cancel'}
                danger={Boolean(confirm?.danger)}
                onConfirm={() => closeConfirm(true)}
                onCancel={() => closeConfirm(false)}
            />

            <PromptModal
                open={Boolean(prompt)}
                title={prompt?.title || 'Prompt'}
                message={prompt?.message || ''}
                confirmLabel={prompt?.confirmLabel || 'Submit'}
                cancelLabel={prompt?.cancelLabel || 'Cancel'}
                onConfirm={(val) => closePrompt(val)}
                onCancel={() => closePrompt(null)}
            />
        </>
    );
}
