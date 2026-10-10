'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { deleteMyAccount } from '@/lib/account-actions';

// The profile page's "Eliminar mi cuenta" section. The account is gone on
// success, so the page reloads to the home page signed out.
export function DeleteAccountCard({ onDeleted }: { onDeleted: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const submit = () => startTransition(async () => {
    const result = await deleteMyAccount(confirm);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'No se pudo eliminar la cuenta', description: result.message });
      return;
    }
    await onDeleted().catch(() => {});
    window.location.href = '/?cuenta=eliminada';
  });

  return (
    <div className="w-full rounded-lg border border-destructive/30 p-5 space-y-3">
      <div>
        <p className="font-semibold">Eliminar mi cuenta</p>
        <p className="text-sm text-muted-foreground">
          Se borran su cuenta, su perfil, favoritos, suscripciones, notificaciones y publicaciones. Sus reseñas quedan como «Usuario de Oltinde» y sus empresas siguen publicadas sin gestor. No se puede deshacer. <Link href="/eliminar-cuenta" className="underline">Más información</Link>.
        </p>
      </div>
      {!open ? (
        <Button variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/5" onClick={() => setOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar mi cuenta
        </Button>
      ) : (
        <div className="space-y-2">
          <label htmlFor="delete-confirm" className="text-sm">Escriba <strong>ELIMINAR</strong> para confirmar:</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input id="delete-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" className="sm:max-w-xs" />
            <Button variant="destructive" disabled={pending || confirm.trim().toUpperCase() !== 'ELIMINAR'} onClick={submit}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Eliminar definitivamente
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => { setOpen(false); setConfirm(''); }}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
