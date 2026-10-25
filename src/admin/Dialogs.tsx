import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button, Icon, type IconName } from '../components';
import { cn } from '../lib/cn';
import { focusRing } from '../styles/tokens';

/**
 * CMS dialogs (owner request, 25 Oct 2026: "proper UI design" instead of the browser's confirm / prompt / alert boxes).
 * One native <dialog> (focus trap, Escape = cancel) styled with the site tokens; call through `useDialogs()`:
 *   await dialogs.confirm({ title, body, confirmLabel, tone: 'danger' })  → true / false
 *   await dialogs.prompt({ title, label, placeholder })                   → text / null
 *   await dialogs.alert({ title, body })
 */
type Tone = 'default' | 'danger';
interface Base {
  title: string;
  body?: ReactNode;
  icon?: IconName;
  tone?: Tone;
}
export interface ConfirmOptions extends Base {
  confirmLabel?: string;
  cancelLabel?: string;
}
export interface PromptOptions extends ConfirmOptions {
  label: string;
  placeholder?: string;
  initialValue?: string;
}

type Request =
  | ({ kind: 'confirm'; resolve: (ok: boolean) => void } & ConfirmOptions)
  | ({ kind: 'prompt'; resolve: (value: string | null) => void } & PromptOptions)
  | ({ kind: 'alert'; resolve: () => void } & Base);

interface DialogsApi {
  confirm: (o: ConfirmOptions) => Promise<boolean>;
  prompt: (o: PromptOptions) => Promise<string | null>;
  alert: (o: Base) => Promise<void>;
}

const DialogContext = createContext<DialogsApi | null>(null);

export function useDialogs(): DialogsApi {
  const api = useContext(DialogContext);
  if (!api) throw new Error('useDialogs needs <DialogProvider>');
  return api;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => setRequest({ kind: 'confirm', resolve, ...o })), []);
  const prompt = useCallback((o: PromptOptions) => new Promise<string | null>((resolve) => setRequest({ kind: 'prompt', resolve, ...o })), []);
  const alert = useCallback((o: Base) => new Promise<void>((resolve) => setRequest({ kind: 'alert', resolve, ...o })), []);
  return (
    <DialogContext.Provider value={{ confirm, prompt, alert }}>
      {children}
      {request && <DialogView request={request} onClose={() => setRequest(null)} />}
    </DialogContext.Provider>
  );
}

function DialogView({ request, onClose }: { request: Request; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(request.kind === 'prompt' ? (request.initialValue ?? '') : '');
  const danger = request.tone === 'danger';

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function finish(ok: boolean) {
    if (request.kind === 'confirm') request.resolve(ok);
    else if (request.kind === 'prompt') request.resolve(ok && value.trim() ? value.trim() : null);
    else request.resolve();
    ref.current?.close();
    onClose();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (request.kind === 'prompt' && !value.trim()) return;
    finish(true);
  }

  const icon = request.icon ?? (danger ? 'delete' : request.kind === 'prompt' ? 'add' : 'info');
  const confirmLabel = request.kind === 'alert' ? 'OK' : (request.confirmLabel ?? (request.kind === 'prompt' ? 'Create' : 'Confirm'));

  return (
    <dialog
      ref={ref}
      aria-labelledby="cms-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        finish(false);
      }}
      onClick={(e) => e.target === ref.current && finish(false)}
      className="w-full max-w-md rounded-2xl bg-surface p-0 text-ink shadow-popup backdrop:bg-navy-900/50"
    >
      <form onSubmit={submit} className="flex flex-col gap-5 p-6">
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', danger ? 'bg-error-subtle text-error' : 'bg-primary-50 text-primary-700')}
          >
            <Icon name={icon} size={24} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
            <h2 id="cms-dialog-title" className="text-lg font-bold leading-6 text-ink">
              {request.title}
            </h2>
            {request.body && <div className="text-sm leading-5 text-ink-body">{request.body}</div>}
          </div>
        </div>

        {request.kind === 'prompt' && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">{request.label}</span>
            <input
              autoFocus
              value={value}
              placeholder={request.placeholder}
              onChange={(e) => setValue(e.target.value)}
              className="h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-base text-ink placeholder:text-ink-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
        )}

        <div className="flex justify-end gap-2">
          {request.kind !== 'alert' && (
            <Button variant="ghost" size="sm" onClick={() => finish(false)}>
              {request.cancelLabel ?? 'Cancel'}
            </Button>
          )}
          {danger ? (
            <button
              type="submit"
              autoFocus={request.kind === 'confirm'}
              className={cn('inline-flex min-h-9 items-center gap-1.5 rounded-full bg-error px-4 text-xs font-bold text-white hover:opacity-90', focusRing)}
            >
              <Icon name="delete" size={16} />
              {confirmLabel}
            </button>
          ) : (
            <Button type="submit" size="sm" autoFocus={request.kind !== 'prompt'} disabled={request.kind === 'prompt' && !value.trim()}>
              {confirmLabel}
            </Button>
          )}
        </div>
      </form>
    </dialog>
  );
}
