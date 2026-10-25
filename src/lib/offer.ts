import type { OfferDoc } from '../types/firestore';

/** Day key "YYYY-MM-DD" in India time, so an offer starts and ends at midnight IST wherever the visitor is. */
function istDay(date: Date) {
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * The offer running now: live, a sensible percent, and today between its start and end day (both included).
 * With several, the biggest discount wins.
 */
export function activeOffer(offers: OfferDoc[], now = new Date()): OfferDoc | undefined {
  const today = istDay(now);
  return offers
    .filter((o) => o.status === 'published' && o.percent > 0 && o.percent < 100)
    .filter((o) => !o.startDate || istDay(o.startDate.toDate()) <= today)
    .filter((o) => !o.endDate || istDay(o.endDate.toDate()) >= today)
    .sort((a, b) => b.percent - a.percent)[0];
}

/**
 * A price with the offer applied (owner's example: original ₹200, price ₹100, offer 50% → ₹50, shown against the
 * original ₹200). Free courses stay free; the original price is unchanged.
 */
export function withOffer<T extends { price: number; originalPrice: number }>(plan: T, offer: OfferDoc | undefined) {
  if (!offer || plan.price <= 0) return { ...plan, offer: undefined };
  return { ...plan, price: Math.round((plan.price * (100 - offer.percent)) / 100), offer };
}
