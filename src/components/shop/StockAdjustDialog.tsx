'use client';

import { useState } from 'react';
import { Loader2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adjustVariantStock } from '@/lib/shop/actions';
import type { Product } from '@/lib/shop/types';

interface StockAdjustDialogProps {
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onAdjusted: () => void;
}

export function StockAdjustDialog({ product, onOpenChange, onAdjusted }: StockAdjustDialogProps) {
  const { toast } = useToast();
  const tracked = product?.variants.filter(v => v.trackInventory) ?? [];
  const [variantId, setVariantId] = useState('');
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedId = variantId || tracked[0]?.id || '';
  const selected = tracked.find(v => v.id === selectedId);

  const close = (open: boolean) => {
    if (!open) {
      setVariantId('');
      setAmount('');
      setNote('');
      setMode('add');
    }
    onOpenChange(open);
  };

  const submit = async () => {
    const qty = Number(amount);
    if (!selected || !Number.isInteger(qty) || qty <= 0) {
      toast({ title: 'Indique una cantidad válida', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    const result = await adjustVariantStock(selected.id, mode === 'add' ? qty : -qty, note);
    setIsSaving(false);
    if (!result.success) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Stock actualizado', description: `${selected.title}: ${result.stock} unidades.` });
    onAdjusted();
    close(false);
  };

  return (
    <Dialog open={!!product} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar stock</DialogTitle>
          <DialogDescription>{product?.title}</DialogDescription>
        </DialogHeader>
        {tracked.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este producto no controla stock.</p>
        ) : (
          <div className="space-y-4">
            {tracked.length > 1 && (
              <div className="space-y-2">
                <Label>Variante</Label>
                <Select value={selectedId} onValueChange={setVariantId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tracked.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.title} — {v.stock} uds.</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <p className="text-sm">Stock actual: <strong>{selected?.stock ?? 0}</strong> unidades</p>
            <div className="flex gap-2">
              <Button type="button" variant={mode === 'add' ? 'default' : 'outline'} onClick={() => setMode('add')} className="flex-1">
                <Plus className="w-4 h-4 mr-1" /> Entrada
              </Button>
              <Button type="button" variant={mode === 'remove' ? 'default' : 'outline'} onClick={() => setMode('remove')} className="flex-1">
                <Minus className="w-4 h-4 mr-1" /> Salida
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock-amount">Cantidad</Label>
              <Input id="stock-amount" type="number" min={1} inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock-note">Motivo (opcional)</Label>
              <Input id="stock-note" value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: Nueva mercancía, producto dañado..." maxLength={512} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>Cancelar</Button>
          {tracked.length > 0 && (
            <Button onClick={submit} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Guardar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
