// Color/spacing tokens lifted from the Google Stitch "vibrant yellow pages"
// mockup, scoped to listing detail pages only (companies, institutions,
// offers, jobs, events, procedures, contribuciones, services). Kept as
// literal hex values rather than wired into the site-wide Tailwind theme so
// the rest of the app (header, buttons, homepage) is unaffected.
export const stitch = {
  primary: '#705d00',
  primaryContainer: '#ffd700',
  onPrimaryContainer: '#000000',
  secondary: '#0062a0',
  onBackground: '#1a1c1c',
  onSurfaceVariant: '#000000',
  outline: '#7e775f',
  outlineVariant: '#e2e2e2',
  surface: '#f9f9f9',
  surfaceContainer: '#eeeeee',
  surfaceContainerLow: '#f3f3f3',
  error: '#ba1a1a',
} as const;

export const sidebarCardClass = 'border border-[#e2e2e2] bg-white p-5 mb-5 rounded';
export const contentSectionClass = 'border-t border-[#e2e2e2] pt-6 mt-6';
