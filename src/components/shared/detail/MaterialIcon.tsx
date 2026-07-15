// Renders a Material Symbols Outlined glyph by name. The font itself is
// loaded once site-wide via a <link> in src/app/layout.tsx.
export function MaterialIcon({ name, className, filled }: { name: string; className?: string; filled?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className ?? ''}`}
      style={filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
      aria-hidden
    >
      {name}
    </span>
  );
}
