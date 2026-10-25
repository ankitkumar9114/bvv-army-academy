/** Number formatting per language. Indian digit grouping (1,00,000) everywhere. */
const LOCALES: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', hinglish: 'en-IN' };

function locale(language: string) {
  return LOCALES[language] ?? 'en-IN';
}

export function formatNumber(value: number, language: string) {
  return new Intl.NumberFormat(locale(language)).format(value);
}

export function formatPrice(value: number, language: string) {
  return new Intl.NumberFormat(locale(language), {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Parses YYYY-MM-DD as a local date (not UTC), so the day never shifts. */
export function parseDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(iso: string, language: string) {
  return new Intl.DateTimeFormat(locale(language), { day: 'numeric', month: 'short', year: 'numeric' }).format(parseDate(iso));
}

/** Whole days from today until the date: 0 = today, negative = past. */
export function daysUntil(iso: string, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((parseDate(iso).getTime() - start.getTime()) / 86_400_000);
}

export function discountPercent(price: number, originalPrice: number) {
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}
