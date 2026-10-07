'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cancelMyOrder } from '@/lib/shop/orders';

// Customer-side cancellation. `checkoutId` authorises guests (receipt link).
export function CancelOrderButton({ orderId, orderNumber, checkoutId, onCancelled }: { orderId: string; orderNumber: string; checkoutId?: string; onCancelled?: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    const result = await cancelMyOrder(orderId, checkoutId, reason);
    setBusy(false);
    if (!result.success) {
      toast({ title: 'No se pudo cancelar', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Pedido ${orderNumber} cancelado` });
    setOpen(false);
    onCancelled?.();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive">Cancelar pedido</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cancelar el pedido {orderNumber}?</DialogTitle>
          <DialogDescription>El vendedor recibirá un aviso. Esta acción no se puede deshacer.</DialogDescription>
        </DialogHeader>
        <Textarea rows={2} placeholder="Motivo (opcional)" value={reason} onChange={e => setReason(e.target.value)} maxLength={512} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Volver</Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Sí, cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
