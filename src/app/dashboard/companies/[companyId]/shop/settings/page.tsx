'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getUniqueCities } from '@/lib/data';
import { getSellerSettings, saveSellerSettings } from '@/lib/shop/orders';
import type { ShopSellerSettings } from '@/lib/shop/types';
import { SellerGate } from '@/components/shop/SellerGate';
import type { Company } from '@/lib/types';

const optNum = (s: string) => (s.trim() === '' ? undefined : Number(s));

function SettingsForm({ company }: { company: Company }) {
  const { toast } = useToast();
  const [s, setS] = useState<ShopSellerSettings | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [freeOver, setFreeOver] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getSellerSettings(company.id), getUniqueCities()]).then(([settings, cityList]) => {
      setCities(cityList);
      if (settings) {
        setS(settings);
        setFreeOver(settings.freeDeliveryOver?.toString() ?? '');
        setMinOrder(settings.minOrderAmount?.toString() ?? '');
      }
    });
  }, [company.id]);

  if (!s) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const patch = (p: Partial<ShopSellerSettings>) => setS(prev => (prev ? { ...prev, ...p } : prev));
  const allCities = s.deliveryCities.length === 0;

  const save = async () => {
    setSaving(true);
    const result = await saveSellerSettings(company.id, { ...s, freeDeliveryOver: optNum(freeOver), minOrderAmount: optNum(minOrder) });
    setSaving(false);
    toast(result.success ? { title: 'Ajustes guardados' } : { title: 'No se pudieron guardar', description: result.message, variant: 'destructive' });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href={`/dashboard/companies/${company.id}/shop`} className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Volver a la tienda
        </Link>
        <h1 className="text-3xl font-bold font-headline mt-2">Ajustes de la tienda</h1>
        <p className="text-muted-foreground">{company.name} · cómo entrega y cobra sus pedidos</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div><CardTitle>Recogida en tienda</CardTitle><CardDescription>El cliente pasa a buscar el pedido. Siempre gratis.</CardDescription></div>
            <Switch checked={s.pickupEnabled} onCheckedChange={v => patch({ pickupEnabled: v })} aria-label="Recogida en tienda" />
          </div>
        </CardHeader>
        {s.pickupEnabled && (
          <CardContent className="space-y-2">
            <Label htmlFor="pickup-address">Dirección de recogida</Label>
            <Input id="pickup-address" value={s.pickupAddress ?? ''} onChange={e => patch({ pickupAddress: e.target.value })} placeholder={company.branches?.[0]?.location.address || 'Dirección'} />
            <p className="text-xs text-muted-foreground">Si la deja vacía se muestra la dirección de su sede principal.</p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div><CardTitle>Envío a domicilio</CardTitle><CardDescription>Usted (o su repartidor) lleva el pedido al cliente.</CardDescription></div>
            <Switch checked={s.deliveryEnabled} onCheckedChange={v => patch({ deliveryEnabled: v })} aria-label="Envío a domicilio" />
          </div>
        </CardHeader>
        {s.deliveryEnabled && (
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fee">Tarifa de envío (XAF)</Label>
                <Input id="fee" type="number" min={0} value={s.deliveryFee} onChange={e => patch({ deliveryFee: Number(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="free-over">Envío gratis desde (opcional)</Label>
                <Input id="free-over" type="number" min={0} value={freeOver} onChange={e => setFreeOver(e.target.value)} placeholder="Ej: 50000" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="all-cities" checked={allCities} onCheckedChange={v => patch({ deliveryCities: v ? [] : cities.slice(0, 1) })} />
                <Label htmlFor="all-cities" className="font-normal">Envío a todas las ciudades</Label>
              </div>
              {!allCities && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-6">
                  {cities.map(c => (
                    <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={s.deliveryCities.includes(c)}
                        onCheckedChange={v => patch({ deliveryCities: v ? [...s.deliveryCities, c] : s.deliveryCities.filter(x => x !== c) })}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tarifas especiales por ciudad (opcional)</Label>
              {s.deliveryFeeByCity.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Select value={row.city} onValueChange={v => patch({ deliveryFeeByCity: s.deliveryFeeByCity.map((r, j) => (j === i ? { ...r, city: v } : r)) })}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Ciudad" /></SelectTrigger>
                    <SelectContent>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" min={0} className="w-36" value={row.fee} onChange={e => patch({ deliveryFeeByCity: s.deliveryFeeByCity.map((r, j) => (j === i ? { ...r, fee: Number(e.target.value) || 0 } : r)) })} aria-label="Tarifa" />
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => patch({ deliveryFeeByCity: s.deliveryFeeByCity.filter((_, j) => j !== i) })} aria-label="Quitar"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => patch({ deliveryFeeByCity: [...s.deliveryFeeByCity, { city: cities[0] ?? '', fee: s.deliveryFee }] })}>
                <PlusCircle className="w-4 h-4 mr-2" /> Añadir tarifa por ciudad
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader><CardTitle>Pagos</CardTitle><CardDescription>Métodos que acepta. El cobro se hace fuera de la web.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm">Efectivo al entregar o recoger</span>
            <Switch checked={s.acceptsCash} onCheckedChange={v => patch({ acceptsCash: v })} />
          </label>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm">Muni Dinero</span>
            <Switch checked={s.acceptsMuniDinero} onCheckedChange={v => patch({ acceptsMuniDinero: v })} />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Otros</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="min-order">Pedido mínimo (opcional, XAF)</Label>
            <Input id="min-order" type="number" min={0} value={minOrder} onChange={e => setMinOrder(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-notes">Aviso para el cliente en el checkout (opcional)</Label>
            <Textarea id="order-notes" rows={2} value={s.orderNotes ?? ''} onChange={e => patch({ orderNotes: e.target.value })} placeholder="Ej: Entregamos de lunes a sábado de 9h a 18h." />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Guardar ajustes</Button>
      </div>
    </div>
  );
}

export default function ShopSettingsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return <SellerGate companyId={companyId}>{company => <SettingsForm company={company} />}</SellerGate>;
}
