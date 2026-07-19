'use client';

import { Facebook, Twitter, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/shared/WhatsAppButton';
import { useToast } from '@/hooks/use-toast';

const SITE_URL = 'https://oltinde.com';

interface ShareButtonsProps {
  path: string; // e.g. `/places/${id}`
  title: string;
}

export function ShareButtons({ path, title }: ShareButtonsProps) {
  const { toast } = useToast();
  const url = `${SITE_URL}${path}`;

  const handleInstagramShare = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Enlace copiado',
        description: 'Instagram no permite compartir enlaces directamente. Péguelo en su historia o mensaje.',
      });
    } catch {
      toast({ title: 'No se pudo copiar el enlace', variant: 'destructive' });
    }
  };

  const iconButtonClass = 'rounded-full h-10 w-10 flex-shrink-0 text-white';

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground mr-0.5 hidden sm:inline">Compartir:</span>
      <Button
        variant="default"
        size="icon"
        className={`${iconButtonClass} bg-[#1877F2] hover:bg-[#1877F2]/90`}
        asChild
      >
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir en Facebook"
        >
          <Facebook className="w-4 h-4" />
        </a>
      </Button>
      <Button
        variant="default"
        size="icon"
        className={`${iconButtonClass} bg-black hover:bg-black/80`}
        asChild
      >
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir en X (Twitter)"
        >
          <Twitter className="w-4 h-4" />
        </a>
      </Button>
      <WhatsAppButton
        value={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        variant="default"
        size="icon"
        className={`${iconButtonClass} bg-[#25D366] hover:bg-[#25D366]/90`}
      />
      <Button
        variant="default"
        size="icon"
        className={`${iconButtonClass} bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 hover:opacity-90`}
        onClick={handleInstagramShare}
        aria-label="Compartir en Instagram"
      >
        <Instagram className="w-4 h-4" />
      </Button>
    </div>
  );
}
