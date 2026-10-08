'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { isStaleBuildError, reloadOnceForStaleBuild } from '@/lib/stale-build';

// Shown instead of Next's bare "Application error" when a page crashes.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    console.error(error);
    if (isStaleBuildError(error) && reloadOnceForStaleBuild()) setReloading(true);
  }, [error]);

  if (reloading) {
    return <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">Actualizando la página…</div>;
  }

  return (
    <div className="container mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Algo salió mal</h1>
      <p className="mt-2 text-muted-foreground">No se pudo mostrar esta página. Vuelva a intentarlo; si sigue sin funcionar, recargue la página.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>Reintentar</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>Recargar</Button>
        <Button variant="ghost" asChild><Link href="/">Ir al inicio</Link></Button>
      </div>
    </div>
  );
}
