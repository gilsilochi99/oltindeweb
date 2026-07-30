
'use client';

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode as QrCodeIcon, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QrCodeDialogProps {
  url: string;
  title: string;
  trigger?: React.ReactNode;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'oltinde';
}

export function QrCodeDialog({ url, title, trigger }: QrCodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || dataUrl) return;
    QRCode.toDataURL(url, { width: 512, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      .then(setDataUrl)
      .catch(() => {
        toast({ title: "Error", description: "No se pudo generar el código QR.", variant: "destructive" });
      });
  }, [open, dataUrl, url, toast]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${slugify(title)}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <QrCodeIcon className="w-4 h-4 mr-2" /> Código QR
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Código QR de {title}</DialogTitle>
          <DialogDescription>
            Descargue esta imagen e imprímala en su local, menú o tarjeta para que sus clientes accedan directamente a su perfil en Oltinde.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`Código QR para ${title}`} className="w-56 h-56 border rounded-md" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center border rounded-md bg-muted">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleDownload} disabled={!dataUrl} className="w-full">
            <Download className="w-4 h-4 mr-2" /> Descargar PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
