'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addRentalKind, deleteRentalKind, getRentalKindsForAdmin, renameRentalKind, type AdminRentalKind } from '@/lib/rentals/kinds-actions';
import { RENTAL_CATEGORIES, RENTAL_CATEGORY_TITLES, registerRentalKinds, type RentalCategory } from '@/lib/rentals/types';
import { cn } from '@/lib/utils';

// Admin → Alquileres → "Tipos de alquiler": the built-in subcategories plus
// the ones the team adds (e.g. "Máquinas de hielo", "Escenarios").
export function RentalKindsAdmin() {
  const { toast } = useToast();
  const [category, setCategory] = useState<RentalCategory>('item');
  const [kinds, setKinds] = useState<AdminRentalKind[] | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [editing, setEditing] = useState<{ key: string; label: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const list = await getRentalKindsForAdmin();
    setKinds(list ?? []);
    // Keep this page's own labels and lists in step.
    registerRentalKinds((list ?? []).filter(k => !k.builtin).map(({ category: c, key, label }) => ({ category: c, key, label })));
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<{ success: boolean; message?: string }>, ok: string) => {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (!r.success) {
      toast({ title: 'No se pudo guardar', description: r.message, variant: 'destructive' });
      return false;
    }
    toast({ title: ok });
    await load();
    return true;
  };

  const visible = (kinds ?? []).filter(k => k.category === category);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de alquiler</CardTitle>
        <CardDescription>
          Las subcategorías que eligen los anunciantes y que se usan para buscar. Los predeterminados no se pueden cambiar; los que añada aquí aparecen enseguida en la web y en la app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categoría">
          {RENTAL_CATEGORIES.map(c => (
            <button key={c} type="button" role="tab" aria-selected={category === c} onClick={() => { setCategory(c); setEditing(null); }}
              className={cn('rounded-full border px-3 py-1.5 text-sm', category === c ? 'border-black bg-black text-white' : 'hover:border-black')}>
              {RENTAL_CATEGORY_TITLES[c]}
            </button>
          ))}
        </div>

        <form className="flex flex-wrap gap-2" onSubmit={async e => {
          e.preventDefault();
          if (await run(() => addRentalKind(category, newLabel), `Tipo "${newLabel.trim()}" añadido`)) setNewLabel('');
        }}>
          <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} maxLength={60} placeholder={category === 'item' ? 'Ej: Máquinas de hielo' : category === 'space' ? 'Ej: Terraza para fiestas' : 'Nuevo tipo'} className="max-w-xs" aria-label="Nombre del nuevo tipo" />
          <Button type="submit" disabled={busy || newLabel.trim().length < 2}><Plus className="w-4 h-4 mr-1" />Añadir tipo</Button>
        </form>

        {kinds === null ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <ul className="divide-y rounded-lg border">
            {visible.map(k => (
              <li key={k.key} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                {editing?.key === k.key ? (
                  <form className="flex flex-1 gap-2" onSubmit={async e => {
                    e.preventDefault();
                    if (await run(() => renameRentalKind(category, k.key, editing.label), 'Nombre cambiado')) setEditing(null);
                  }}>
                    <Input value={editing.label} onChange={e => setEditing({ key: k.key, label: e.target.value })} maxLength={60} className="h-8 max-w-xs" autoFocus aria-label="Nuevo nombre" />
                    <Button type="submit" size="icon" variant="ghost" className="h-8 w-8" disabled={busy} aria-label="Guardar"><Check className="w-4 h-4" /></Button>
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(null)} aria-label="Cancelar"><X className="w-4 h-4" /></Button>
                  </form>
                ) : (
                  <>
                    <span className="flex-1 min-w-32">{k.label}</span>
                    {k.builtin && <Badge variant="secondary" className="font-normal">Predeterminado</Badge>}
                    <span className="text-xs text-muted-foreground w-24 text-right">{k.listings} {k.listings === 1 ? 'anuncio' : 'anuncios'}</span>
                    {!k.builtin && (
                      <>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing({ key: k.key, label: k.label })} aria-label={`Cambiar el nombre de ${k.label}`}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" disabled={busy || k.listings > 0}
                          title={k.listings > 0 ? 'Tiene anuncios: no se puede eliminar' : undefined}
                          onClick={() => run(() => deleteRentalKind(category, k.key), `Tipo "${k.label}" eliminado`)} aria-label={`Eliminar ${k.label}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
