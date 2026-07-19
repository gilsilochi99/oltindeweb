// Color/spacing tokens lifted from the Google Stitch "vibrant yellow pages"
// mockup, scoped to listing detail pages only (companies, institutions,
// offers, jobs, events, procedures, contribuciones, services). Each value is
// a CSS custom property reference rather than a literal hex — the actual
// colors live in src/app/globals.css (:root / .dark), so every existing
// `style={{color: stitch.x}}` usage resolves correctly in both themes
// without needing to touch the pages that use it.
export const stitch = {
  primary: 'var(--stitch-primary)',
  primaryContainer: 'var(--stitch-primary-container)',
  onPrimaryContainer: 'var(--stitch-on-primary-container)',
  secondary: 'var(--stitch-secondary)',
  onBackground: 'var(--stitch-on-background)',
  onSurfaceVariant: 'var(--stitch-on-surface-variant)',
  outline: 'var(--stitch-outline)',
  outlineVariant: 'var(--stitch-outline-variant)',
  surface: 'var(--stitch-surface)',
  surfaceContainer: 'var(--stitch-surface-container)',
  surfaceContainerLow: 'var(--stitch-surface-container-low)',
  error: 'var(--stitch-error)',
} as const;

export const sidebarCardClass = 'border border-stitch-outline-variant bg-card p-5 mb-5 rounded';
export const contentSectionClass = 'border-t border-stitch-outline-variant pt-6 mt-6';
