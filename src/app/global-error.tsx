'use client';

import { useEffect } from 'react';
import { isStaleBuildError, reloadOnceForStaleBuild } from '@/lib/stale-build';

// Last resort when the root layout itself crashes (it replaces the whole page).
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
    if (isStaleBuildError(error)) reloadOnceForStaleBuild();
  }, [error]);

  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '6rem 1rem', background: '#fff', color: '#111' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Algo salió mal</h1>
        <p style={{ color: '#555', marginTop: '0.5rem' }}>Recargue la página para continuar.</p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: '1.5rem', padding: '0.6rem 1.4rem', borderRadius: 8, border: 0, background: '#FFCD00', fontWeight: 600, cursor: 'pointer' }}
        >
          Recargar
        </button>
      </body>
    </html>
  );
}
