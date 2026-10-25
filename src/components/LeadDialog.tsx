import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { EnquiryMode } from '../data/contact';
import { cn } from '../lib/cn';
import { normalisePhone, submitEnquiry } from '../lib/enquiries';
import { focusRing, textStyles } from '../styles/tokens';
import { Button } from './Button';
import { Icon } from './Icon';
import { Input } from './Input';

export interface LeadRequest {
  /** Dialog heading. */
  title: string;
  /** Line under the heading, e.g. "SSC CGL · Online". */
  context?: string;
  mode: EnquiryMode;
  /** Saved with the enquiry, e.g. "buy-online:sscCgl" (max 40 characters). */
  source: string;
  /** Saved as examInterest (course id, max 40 characters). */
  courseId?: string;
}

/**
 * Name + mobile form state shared by LeadDialog and the course page's inline callback card. Saves to Firestore
 * `enquiries` (same rules as the home enquiry form).
 */
export function useLeadForm(request: LeadRequest | null) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [state, setState] = useState<'form' | 'done' | 'error'>('form');

  const cleanPhone = normalisePhone(phone);
  const valid = name.trim().length >= 2 && cleanPhone !== null;
  const phoneError = touched && phone !== '' && !cleanPhone ? t('enquiry.phone.error') : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid || !cleanPhone || !request) return;
    setSending(true);
    try {
      await submitEnquiry({
        name: name.trim().slice(0, 80),
        phone: cleanPhone,
        mode: request.mode,
        examInterest: request.courseId?.slice(0, 40),
        language: i18n.language,
        source: request.source,
      });
      setState('done');
    } catch {
      setState('error');
    } finally {
      setSending(false);
    }
  }

  const reset = () => {
    setState('form');
    setTouched(false);
  };

  return { name, setName, phone, setPhone, setTouched, sending, state, valid, phoneError, submit, reset };
}

/** Name + mobile inputs, error line and submit button (used by LeadDialog and the course page callback card). */
export function LeadFields({ form, submitLabel }: { form: ReturnType<typeof useLeadForm>; submitLabel: string }) {
  const { t } = useTranslation();
  return (
    <>
      <Input
        label={t('enquiry.name.label')}
        placeholder={t('enquiry.name.placeholder')}
        required
        autoComplete="name"
        maxLength={80}
        value={form.name}
        onChange={(e) => form.setName(e.target.value)}
      />
      <Input
        label={t('enquiry.phone.label')}
        placeholder={t('enquiry.phone.placeholder')}
        required
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={14}
        value={form.phone}
        error={form.phoneError}
        onBlur={() => form.setTouched(true)}
        onChange={(e) => form.setPhone(e.target.value)}
      />
      {form.state === 'error' && (
        <p role="alert" className="text-sm font-medium text-error">
          {t('pages.courseDetail.lead.error')}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth loading={form.sending} disabled={!form.valid}>
        {submitLabel}
      </Button>
    </>
  );
}

/**
 * Small phone-capture dialog (course page: "Book a free class" and "Buy now"). Native <dialog> with showModal(),
 * so focus is trapped, Escape closes it and the page behind is inert. Saves to Firestore `enquiries` (same rules as
 * the home enquiry form).
 */
export function LeadDialog({ request, onClose }: { request: LeadRequest | null; onClose: () => void }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const form = useLeadForm(request);
  const { reset } = form;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (request && !dialog.open) {
      reset();
      dialog.showModal();
    } else if (!request && dialog.open) dialog.close();
  }, [request]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="lead-dialog-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="w-full max-w-md rounded-2xl bg-surface p-0 text-ink shadow-2xl backdrop:bg-navy-900/60"
    >
      <div className="relative flex flex-col gap-4 p-5 md:p-6">
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label={t('pages.courseDetail.lead.close')}
          className={cn('absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface-subtle hover:text-ink', focusRing)}
        >
          <Icon name="close" size={20} />
        </button>
        <div className="pr-10">
          <h2 id="lead-dialog-title" className={cn(textStyles.h3, 'text-ink')}>
            {request?.title}
          </h2>
          {request?.context && <p className="mt-1 text-sm font-semibold text-primary-700">{request.context}</p>}
        </div>

        {form.state === 'done' ? (
          <p role="status" className="flex items-start gap-2 text-base text-ink-body">
            <Icon name="check_circle" size={24} className="shrink-0 text-success" />
            {t('pages.courseDetail.lead.done', { name: form.name.trim().split(' ')[0] })}
          </p>
        ) : (
          <form onSubmit={form.submit} noValidate className="flex flex-col gap-4">
            <p className={cn(textStyles.body, 'text-ink-body')}>{t('pages.courseDetail.lead.body')}</p>
            <LeadFields form={form} submitLabel={t('pages.courseDetail.lead.submit')} />
          </form>
        )}
      </div>
    </dialog>
  );
}
