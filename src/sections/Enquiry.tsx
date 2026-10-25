import { Icon } from '../components';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Section, Select, WhatsAppIcon } from '../components';
import { categories } from '../data/categories';
import { /* enquiryModes, */ whatsappLink, type EnquiryMode } from '../data/contact';
import { qualifications } from '../data/qualifications';
import { cn } from '../lib/cn';
import { normalisePhone, submitEnquiry } from '../lib/enquiries';
import { focusRing, textStyles } from '../styles/tokens';

type Step = 1 | 2 | 'done';

/**
 * 14. Pre-footer enquiry (id `contact`, target of every Enquire / Book Demo / Buy button). Owner reference:
 * white rounded card on a light band; left = icon, heading, step progress on a fading grid; right = form.
 * Step 1: name, mobile, course mode. Step 2 (optional details): exam category, qualification, city.
 * Saves to Firestore `enquiries` (create-only for visitors, see firestore.rules). WhatsApp button under the form.
 */
export default function Enquiry() {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  // Offline classes only for now (owner request): the mode question is hidden and every request is 'classroom'.
  // To ask again: `useState<EnquiryMode>()` and uncomment the mode fieldset below.
  const [mode /* , setMode */] = useState<EnquiryMode | undefined>('classroom');
  const [examInterest, setExamInterest] = useState('');
  const [qualification, setQualification] = useState('');
  const [city, setCity] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const stepStart = useRef<HTMLDivElement>(null);

  const cleanPhone = normalisePhone(phone);
  const step1Valid = name.trim().length >= 2 && cleanPhone !== null && mode !== undefined;
  const phoneError = phoneTouched && phone !== '' && !cleanPhone ? t('enquiry.phone.error') : undefined;

  // Move keyboard / screen-reader focus to the new step so it is announced.
  useEffect(() => {
    if (step !== 1) stepStart.current?.focus();
  }, [step]);

  const greeting = name.trim() ? t('enquiry.whatsappMessageNamed', { name: name.trim() }) : t('enquiry.whatsappMessage');

  function next(e: FormEvent) {
    e.preventDefault();
    setPhoneTouched(true);
    if (step1Valid) setStep(2);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!step1Valid || !cleanPhone || !mode) return setStep(1);
    setSending(true);
    setFailed(false);
    try {
      await submitEnquiry({
        name: name.trim().slice(0, 80),
        phone: cleanPhone,
        mode,
        examInterest: examInterest || undefined,
        qualification: qualification || undefined,
        city: city.trim().slice(0, 60) || undefined,
        language: i18n.language,
      });
      setStep('done');
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  const progress = step === 1 ? 1 : 2;
  const whatsappButton = (
    <a
      href={whatsappLink(greeting)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-whatsapp px-6 text-sm font-bold text-white transition duration-slow ease-in-out hover:bg-whatsapp-dark md:text-base',
        focusRing,
      )}
    >
      <WhatsAppIcon className="size-8" />
      {t('enquiry.whatsapp')}
      <span className="sr-only">{t('common.opensNewTab')}</span>
    </a>
  );

  return (
    <Section id="contact" labelledBy="contact-title" tone="subtle">
      <div className="grid overflow-hidden rounded-3xl bg-surface md:grid-cols-2">
        {/* Left: heading + progress on a faint grid that fades to the right */}
        <div className="relative p-6 sm:p-10 md:p-12">
          <div aria-hidden className="bg-grid-fade absolute inset-0" />
          <div className="relative flex flex-col gap-4 md:gap-5">
            <span aria-hidden className="flex size-14 items-center justify-center rounded-full bg-accent-100 text-accent-700">
              <Icon name="call" size={24} />
            </span>
            <h2 id="contact-title" className={cn(textStyles.h2, 'text-ink')}>
              {t('enquiry.title')}
            </h2>
            <p className={cn(textStyles.bodyLg, 'max-w-md text-ink-body')}>{t('enquiry.subtitle')}</p>
            {step !== 'done' && (
              <div className="flex items-center gap-3">
                <div
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={2}
                  aria-valuenow={progress}
                  aria-label={t('enquiry.progressLabel')}
                  className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-success-subtle"
                >
                  <div className={cn('h-full rounded-full bg-success-bold transition-all duration-base ease-standard', progress === 1 ? 'w-1/2' : 'w-full')} />
                </div>
                <span className="text-sm font-bold text-ink">{t('enquiry.step', { current: progress, total: 2 })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: the form */}
        <div className="flex flex-col gap-5 border-t border-line p-6 sm:p-10 md:border-l md:border-t-0 md:p-12">
          {step === 1 && (
            <form onSubmit={next} noValidate className="flex flex-col gap-5">
              <Input
                label={t('enquiry.name.label')}
                placeholder={t('enquiry.name.placeholder')}
                required
                autoComplete="name"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label={t('enquiry.phone.label')}
                placeholder={t('enquiry.phone.placeholder')}
                required
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={14}
                value={phone}
                error={phoneError}
                onBlur={() => setPhoneTouched(true)}
                onChange={(e) => setPhone(e.target.value)}
              />
              {/* class-mode question hidden while only offline classes run (owner request):
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1.5 text-xs font-semibold text-ink md:text-sm">
                  {t('enquiry.mode.label')}
                  <span aria-hidden className="ml-0.5 text-error">
                    *
                  </span>
                </legend>
                <div className="flex flex-wrap gap-3">
                  {enquiryModes.map((m) => (
                    <label
                      key={m}
                      className={cn(
                        'flex h-12 cursor-pointer items-center whitespace-nowrap rounded-xl border px-5 text-sm font-semibold transition duration-fast focus-within:ring-2 focus-within:ring-primary-200 md:text-base',
                        mode === m ? 'border-primary-700 bg-primary-100 text-primary-800' : 'border-line-strong text-ink-body hover:border-ink-body hover:bg-surface-subtle',
                      )}
                    >
                      <input type="radio" name="enquiry-mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
                      {t(`enquiry.mode.${m}`)}
                    </label>
                  ))}
                </div>
              </fieldset> */}
              <Button type="submit" size="lg" fullWidth disabled={!step1Valid} className="mt-2">
                {t('enquiry.next')}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div ref={stepStart} tabIndex={-1} className="focus:outline-none">
                <p className={cn(textStyles.h4, 'text-ink')}>{t('enquiry.step2Title')}</p>
                <p className={cn(textStyles.small, 'mt-1 text-ink-muted')}>{t('enquiry.step2Hint')}</p>
              </div>
              <Select
                label={t('enquiry.exam.label')}
                placeholder={t('enquiry.exam.placeholder')}
                value={examInterest}
                onChange={(e) => setExamInterest(e.target.value)}
                options={[...categories.map((c) => ({ value: c.id, label: t(`categories.items.${c.id}`) })), { value: 'notSure', label: t('enquiry.exam.notSure') }]}
              />
              <Select
                label={t('enquiry.qualification.label')}
                placeholder={t('enquiry.qualification.placeholder')}
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                options={qualifications.map((q) => ({ value: q.id, label: t(`qualification.items.${q.id}.name`) }))}
              />
              <Input
                label={t('enquiry.city.label')}
                placeholder={t('enquiry.city.placeholder')}
                autoComplete="address-level2"
                maxLength={60}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              {failed && (
                <p role="alert" className="text-sm font-medium text-error">
                  {t('enquiry.error')}
                </p>
              )}
              <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row">
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)} leftIcon={<Icon name="arrow_back" />}>
                  {t('enquiry.back')}
                </Button>
                <Button type="submit" size="lg" loading={sending} className="flex-1">
                  {t('enquiry.submit')}
                </Button>
              </div>
            </form>
          )}

          {step === 'done' && (
            <div ref={stepStart} tabIndex={-1} role="status" className="flex flex-col items-start gap-3 focus:outline-none">
              <Icon name="check_circle" size={48} className="text-success" />
              <p className={cn(textStyles.h3, 'text-ink')}>{t('enquiry.doneTitle', { name: name.trim().split(' ')[0] })}</p>
              <p className={cn(textStyles.bodyLg, 'text-ink-body')}>{t('enquiry.doneBody')}</p>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs font-semibold uppercase text-ink-muted" aria-hidden>
            <span className="h-px flex-1 bg-line" />
            {t('enquiry.or')}
            <span className="h-px flex-1 bg-line" />
          </div>
          {whatsappButton}
        </div>
      </div>
    </Section>
  );
}
