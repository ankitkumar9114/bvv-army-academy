/**
 * Contact details. WhatsApp number (owner, 23 Oct: +91 80076 43569), country code, no "+" or spaces. Every WhatsApp
 * button and every course "Iske baare mein jaanein" button opens a chat with this number.
 */
export const WHATSAPP_NUMBER = '918007643569';

/** The counsellor in the "Need help?" spots: Sandeep Kumar Tiwari's entry in the CMS Trainers list (his photo is used there). */
export const COUNSELLOR_TRAINER_ID = 'twadse9vmp';

export type EnquiryMode = 'online' | 'classroom' | 'both';
export const enquiryModes: EnquiryMode[] = ['online', 'classroom', 'both'];

/** tel: link to the same number (the support card's call button). */
export const callLink = `tel:+${WHATSAPP_NUMBER}`;

/** wa.me link with a pre-filled message. */
export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export type SocialId = 'linkedin' | 'youtube' | 'instagram' | 'facebook';

/**
 * The academy's social profiles, shown in the footer (owner request).
 * TODO (owner): paste the full profile URLs. An empty URL shows the icon greyed out, not linked.
 */
export const socialLinks: Record<SocialId, string> = {
  linkedin: 'https://www.linkedin.com/in/sandeep-tiwari-4031b8262/',
  youtube: 'https://www.youtube.com/@bajravijayveerarmyacademy',
  instagram: 'https://www.instagram.com/bajra_vijay_veer_academy/',
  facebook: '',
};
