/**
 * Microsoft Clarity (heatmaps + session recordings; owner request, 25 Oct 2026). Loads only in the production build,
 * only when VITE_CLARITY_PROJECT_ID is set (.env.local locally, GitHub Actions variable for the deploy), and never on
 * the CMS (/admin), whose Leads screen shows visitors' phone numbers. Clarity masks typed text in forms by default.
 * The script is imported on demand, so it never delays the first paint.
 */
export function startAnalytics() {
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined;
  if (!import.meta.env.PROD || !projectId) return;
  if (window.location.pathname.startsWith(`${import.meta.env.BASE_URL}admin`)) return;
  void import('@microsoft/clarity')
    .then(({ default: Clarity }) => Clarity.init(projectId))
    .catch(() => {}); // blocked by an ad blocker or offline: the site works the same
}
