import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Sets the browser tab title to "<page> | <academy name>" in the active language.
 * Pass undefined on the home page to keep the default meta.title.
 */
export function usePageTitle(pageTitle?: string) {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} | ${t('brand.name')}` : t('meta.title');
  }, [pageTitle, t, i18n.language]);
}
