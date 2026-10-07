'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { Loader2, PlusCircle, TicketPercent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { SellerGate } from '@/components/shop/SellerGate';
import { deleteCoupon, getSellerCoupons, saveCoupon } from '@/lib/shop/engagement';
import { couponProblem, formatXaf, type Coupon, type CouponType } from '@/lib/shop/types';
import type { Company } from '@/lib/types';

type Draft = { id?: string; code: string; description: string; type: CouponType; value: string; minSubtotal: string; maxUses: string; startsAt: string; endsAt: string; isActive: boolean };

const empty: Draft = { code: '', description: '', type: 'percent', value: '10', minSubtotal: '', maxUses: '', startsAt: '', endsAt: '', isActive: true };

// <input type="date"> works in local days; store start-of-day / end-of-day.
const toDateInput = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('sv-SE') : '');
const fromDateInput = (d: string, endOfDay: boolean) => (d ? new Date(`${d}T${endOfDay ? '23:59:59' : '00:00:00'}`).toISOString() : '');

function couponState(c: Coupon): { label: string; tone: 'default' | 'secondary' | 'outline' } {
  if (!c.isActive) return { label: 'Desactivado', tone: 'outline' };
  const problem = couponProblem({ ...c, minSubtotal: undefined }, 0);
  if (problem?.includes('caducado')) return { label: 'Caducado', tone: 'outline' };
  if (problem?.includes('agotado')) return { label: 'Agotado', tone: 'outline' };
  if (problem?.includes('todavía')) return { label: 'Programado', tone: 'secondary' };
  return { label: 'Activo', tone: 'default' };
}

function Coupons({ company }: { company: Company }) {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => setCoupons(await getSellerCoupons(company.id)), [company.id]);
  useEffect(() => { load(); }, [load]);

  const edit = (c: Coupon) => setDraft({
    id: c.id, code: c.code, description: c.description ?? '', type: c.type, value: String(c.value),
    minSubtotal: c.minSubtotal?.toString() ?? '', maxUses: c.maxUses?.toString() ?? '',
    startsAt: toDateInput(c.startsAt), endsAt: toDateInput(c.endsAt), isActive: c.isActive,
  });

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const result = await saveCoupon(company.id, {
      code: draft.code,
      description: draft.description || undefined,
      type: draft.type,
      value: Number(draft.value),
      minSubtotal: draft.minSubtotal ? Number(draft.minSubtotal) : undefined,
      maxUses: draft.maxUses ? Number(draft.maxUses) : undefined,
      startsAt: fromDateInput(draft.startsAt, false) || undefined,
      endsAt: fromDateInput(draft.endsAt, true) || undefined,
      isActive: draft.isActive,
    }, draft.id);
    setSaving(false);
    if (!result.success) {
      toast({ title: 'No se pudo guardar', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: draft.id ? 'Cupón actualizado' : 'Cupón creado' });
    setDraft(null);
    load();
  };

  const remove = async (c: Coupon) => {
    const result = await deleteCoupon(c.id);
    if (result.success) {
      toast({ title: c.usedCount > 0 ? 'Cupón desactivado (ya tenía usos)' : 'Cupón eliminado' });
      load();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold font-headline">Cupones de descuento</h1>
          <p className="text-muted-foreground">Códigos que sus clientes escriben al tramitar el pedido. Solo descuentan en sus productos.</p>
        </div>
        <Button onClick={() => setDraft({ ...empty })}><PlusCircle className="w-4 h-4 mr-2" />Nuevo cupón</Button>
      </div>

      {!coupons ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : coupons.length === 0 ? (
        <Card><CardContent className="py-16 text-center space-y-2">
          <TicketPercent className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="font-semibold">Todavía no tiene cupones</p>
          <p className="text-sm text-muted-foreground">Cree uno para una promoción, por ejemplo BIENVENIDA10 con un 10% de descuento.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {coupons.map(c => {
            const state = couponState(c);
            return (
              <Card key={c.id}>
                <CardContent className="p-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg">{c.code}</span>
                      <Badge variant={state.tone}>{state.label}</Badge>
                    </div>
                    <p className="text-sm">
                      {c.type === 'percent' ? `${c.value}% de descuento` : `${formatXaf(c.value)} de descuento`}
                      {c.minSubtotal ? ` · compra mínima ${formatXaf(c.minSubtotal)}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Usado {c.usedCount}{c.maxUses ? ` de ${c.maxUses}` : ''} veces
                      {c.endsAt ? ` · hasta el ${new Date(c.endsAt).toLocaleDateString('es-ES')}` : ''}
                      {c.description ? ` · ${c.description}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => edit(c)}>Editar</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(c)}>{c.usedCount > 0 ? 'Desactivar' : 'Eliminar'}</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!draft} onOpenChange={open => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft?.id ? 'Editar cupón' : 'Nuevo cupón'}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="c-code">Código</Label>
                  <Input id="c-code" className="font-mono uppercase" value={draft.code} onChange={e => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="BIENVENIDA10" maxLength={32} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={draft.type} onValueChange={v => setDraft({ ...draft, type: v as CouponType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed">Importe fijo (XAF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-value">{draft.type === 'percent' ? 'Descuento (%)' : 'Descuento (XAF)'}</Label>
                  <Input id="c-value" type="number" min={1} max={draft.type === 'percent' ? 90 : undefined} value={draft.value} onChange={e => setDraft({ ...draft, value: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-min">Compra mínima (opcional)</Label>
                  <Input id="c-min" type="number" min={0} value={draft.minSubtotal} onChange={e => setDraft({ ...draft, minSubtotal: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-max">Usos máximos (opcional)</Label>
                  <Input id="c-max" type="number" min={1} value={draft.maxUses} onChange={e => setDraft({ ...draft, maxUses: e.target.value })} placeholder="Sin límite" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-start">Desde (opcional)</Label>
                  <Input id="c-start" type="date" value={draft.startsAt} onChange={e => setDraft({ ...draft, startsAt: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-end">Hasta (opcional)</Label>
                  <Input id="c-end" type="date" value={draft.endsAt} onChange={e => setDraft({ ...draft, endsAt: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="c-desc">Nota interna (opcional)</Label>
                  <Input id="c-desc" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} maxLength={255} placeholder="Ej: campaña de Navidad" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={draft.isActive} onCheckedChange={v => setDraft({ ...draft, isActive: v })} />Activo</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SellerCouponsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return <SellerGate companyId={companyId}>{company => <Coupons company={company} />}</SellerGate>;
}
