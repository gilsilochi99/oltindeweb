'use client';

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/use-install-prompt';

const DISMISSED_KEY = 'oltinde-install-dismissed';

export default function InstallBanner() {
  const { canPromptInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true); // default hidden until we can check localStorage, avoids a flash

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  if (isStandalone || dismissed || !(canPromptInstall || isIOS)) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
      {canPromptInstall ? (
        <>
          <Download className="h-4 w-4 shrink-0" />
          <span>Instale Oltinde en su dispositivo para acceso rápido, incluso sin conexión.</span>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 shrink-0"
            onClick={async () => {
              await promptInstall();
              dismiss();
            }}
          >
            Instalar App
          </Button>
        </>
      ) : (
        <>
          <Share className="h-4 w-4 shrink-0" />
          <span>Instale Oltinde: toque Compartir y luego "Añadir a pantalla de inicio".</span>
        </>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar"
        className="shrink-0 rounded-full p-0.5 hover:bg-black/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
