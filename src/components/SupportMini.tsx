import { useTranslation } from "react-i18next";
import { callLink, whatsappLink } from "../data/contact";
import { cn } from "../lib/cn";
import { focusRing } from "../styles/tokens";
import { Icon } from "./Icon";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { CounsellorAvatar } from './CounsellorAvatar';

const P = "pages.courseDetail";

/**
 * Compact "Need help?" card (counsellor + one action); the whole card is the link (owner request: tap anywhere).
 * `action="call"` (default): dials the academy; used at the bottom of the phone menu.
 * `action="whatsapp"`: opens WhatsApp with `message` (green button); used in the course page's desktop / tablet column
 * (owner request: WhatsApp there, call on phones).
 */
export function SupportMini({
  action = "call",
  message,
  grid = true,
}: {
  action?: "call" | "whatsapp";
  message?: string;
  /** The faint grid background; off on the course page (owner request). */
  grid?: boolean;
}) {
  const { t } = useTranslation();
  const whatsapp = action === "whatsapp";
  return (
    <a
      href={whatsapp ? whatsappLink(message ?? t("enquiry.whatsappMessage")) : callLink}
      {...(whatsapp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn("relative block overflow-hidden rounded-2xl border border-line bg-surface transition duration-fast hover:border-ink-muted", focusRing)}
    >
      {grid && <div aria-hidden className="bg-grid-fade absolute inset-0" />}
      <div className="relative flex flex-col gap-3 p-4 md:p-5">
        <div className="flex items-center gap-3">
          <CounsellorAvatar className="size-12" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-6 text-ink">
              {t(`${P}.needHelp`)}
            </p>
            {/* under "Need help?": who answers, name only (owner request, 25 Oct) */}
            <p className="text-sm text-ink-muted">{t(`${P}.supportByline`)}</p>
          </div>
          {/* phones: icon only; from 600px: icon + label */}
          {whatsapp ? (
            <span className="flex size-11 shrink-0 items-center justify-center gap-2 rounded-full bg-whatsapp text-white sm:w-auto sm:px-4 sm:text-sm sm:font-bold">
              <WhatsAppIcon className="size-8" />
              <span className="sr-only sm:not-sr-only">{t(`${P}.supportWhatsappShort`)}</span>
              <span className="sr-only">{t("common.opensNewTab")}</span>
            </span>
          ) : (
            <span className="flex size-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary-600 text-white sm:w-auto sm:px-4 sm:text-sm sm:font-bold">
              <Icon name="call" size={20} />
              <span className="sr-only sm:not-sr-only">{t(`${P}.supportCall`)}</span>
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
