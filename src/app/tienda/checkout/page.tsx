'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Lock, ShoppingCart, Store, TicketPercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useCityPreference } from '@/hooks/use-city-preference';
import { useToast } from '@/hooks/use-toast';
import { getUniqueCities } from '@/lib/data';
import { placeOrder } from '@/lib/shop/orders';
import { checkCoupon } from '@/lib/shop/engagement';
import { ShopBreadcrumbs } from '@/components/shop/ShopChrome';
import { useCartDetails } from '@/components/shop/useCartDetails';
import {
  PAYMENT_METHOD_LABELS, deliveryFeeFor, formatXaf,
  type CartSellerGroup, type ShopDeliveryMethod, type ShopPaymentMethod,
} from '@/lib/shop/types';

type Choice = { deliveryMethod: ShopDeliveryMethod; paymentMethod: ShopPaymentMethod };

function defaultChoice(g: CartSellerGroup): Choice {
  return {
    deliveryMethod: g.settings.pickupEnabled ? 'pickup' : 'delivery',
    paymentMethod: g.settings.acceptsCash ? 'cash' : 'muni_dinero',
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { city: preferredCity } = useCityPreference();
  const { cart, details } = useCartDetails();

  const [cities, setCities] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [couponInputs, setCouponInputs] = useState<Record<string, string>>({});
  const [coupons, setCoupons] = useState<Record<string, { code: string; discount: number; label: string }>>({});
  const [checkingCoupon, setCheckingCoupon] = useState<string | null>(null);

  useEffect(() => { getUniqueCities().then(setCities); }, []);
  useEffect(() => {
    if (user) {
      setName(n => n || user.displayName || '');
      setEmail(e => e || user.email || '');
    }
  }, [user]);
  useEffect(() => {
    if (preferredCity && preferredCity !== 'all') setCity(c => c || preferredCity);
  }, [preferredCity]);

  const applyCoupon = async (g: CartSellerGroup) => {
    setCheckingCoupon(g.companyId);
    const result = await checkCoupon(g.companyId, couponInputs[g.companyId] ?? '', g.subtotal);
    setCheckingCoupon(null);
    if (!result.success) {
      toast({ title: 'Cupón no aplicado', description: result.message, variant: 'destructive' });
      return;
    }
    setCoupons(prev => ({ ...prev, [g.companyId]: { code: result.code, discount: result.discount, label: result.label } }));
  };

  const removeCoupon = (companyId: string) => setCoupons(({ [companyId]: _removed, ...rest }) => rest);

  const choiceFor = (g: CartSellerGroup) => choices[g.companyId] ?? defaultChoice(g);
  const setChoice = (companyId: string, patch: Partial<Choice>, g: CartSellerGroup) =>
    setChoices(prev => ({ ...prev, [companyId]: { ...(prev[companyId] ?? defaultChoice(g)), ...patch } }));

  const summary = useMemo(() => {
    if (!details) return null;
    const rows = details.groups.map(g => {
      const choice = choiceFor(g);
      const fee = choice.deliveryMethod === 'delivery' ? deliveryFeeFor(g.settings, city || undefined, g.subtotal) : 0;
      const belowMinimum = g.settings.minOrderAmount !== undefined && g.subtotal < g.settings.minOrderAmount;
      const coupon = coupons[g.companyId];
      return { group: g, choice, fee, belowMinimum, coupon };
    });
    const needsAddress = rows.some(r => r.choice.deliveryMethod === 'delivery');
    const shipping = rows.reduce((s, r) => s + (r.fee ?? 0), 0);
    const discount = rows.reduce((s, r) => s + (r.coupon?.discount ?? 0), 0);
    return { rows, needsAddress, shipping, discount, total: details.subtotal - discount + shipping };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, choices, city, coupons]);

  const hasIssues = !!details?.groups.some(g => g.items.some(i => i.issue));

  const submit = async () => {
    if (!details || !summary) return;
    const problem =
      hasIssues ? 'Hay productos en su carrito que ya no están disponibles. Revise el carrito.'
      : name.trim().length < 2 ? 'Indique su nombre.'
      : phone.trim().length < 6 ? 'Indique un teléfono de contacto.'
      : summary.needsAddress && !city ? 'Elija la ciudad de entrega.'
      : summary.needsAddress && address.trim().length < 5 ? 'Indique la dirección de entrega.'
      : summary.rows.find(r => r.choice.deliveryMethod === 'delivery' && r.fee === undefined) ? `${summary.rows.find(r => r.fee === undefined)!.group.companyName} no hace envíos a ${city}. Elija recogida en tienda.`
      : summary.rows.find(r => r.belowMinimum) ? `No alcanza el pedido mínimo de ${summary.rows.find(r => r.belowMinimum)!.group.companyName}.`
      : null;
    if (problem) {
      toast({ title: 'Revise su pedido', description: problem, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const result = await placeOrder({
      lines: cart.lines,
      customerName: name,
      customerPhone: phone,
      customerEmail: email || undefined,
      deliveryCity: summary.needsAddress ? city : undefined,
      deliveryAddress: summary.needsAddress ? address : undefined,
      notes: notes || undefined,
      sellers: summary.rows.map(r => ({ companyId: r.group.companyId, ...r.choice, couponCode: r.coupon?.code })),
    });
    if (!result.success) {
      setSubmitting(false);
      toast({ title: 'No se pudo completar el pedido', description: result.message, variant: 'destructive' });
      return;
    }
    setPlaced(true);
    cart.clear();
    router.replace(`/tienda/pedido/${result.checkoutId}`);
  };

  if (!details || placed) {
    return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (details.groups.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold">Su carrito está vacío</h1>
        <Button asChild><Link href="/tienda">Ir a la tienda</Link></Button>
      </div>
    );
  }

  return (
    <div>
      <ShopBreadcrumbs items={[{ label: 'Carrito', href: '/tienda/carrito' }, { label: 'Tramitar pedido', href: '/tienda/checkout' }]} />
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Tramitar pedido</h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-6">
          <section className="rounded-lg border border-outline-variant bg-card p-5 space-y-4">
            <h2 className="font-bold text-lg">1. Sus datos</h2>
            {!user && (
              <p className="text-sm text-muted-foreground">
                Puede comprar sin cuenta. <Link href="/signin" className="underline">Inicie sesión</Link> para seguir sus pedidos desde su perfil.
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="co-name">Nombre completo</Label>
                <Input id="co-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="co-phone">Teléfono</Label>
                <Input id="co-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+240 222 XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="co-email">Correo electrónico (opcional)</Label>
                <Input id="co-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-card p-5 space-y-5">
            <h2 className="font-bold text-lg">2. Entrega y pago</h2>
            {summary!.rows.map(({ group: g, choice, fee, belowMinimum }) => (
              <div key={g.companyId} className="rounded-md border p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold flex items-center gap-2"><Store className="w-4 h-4" />{g.companyName}</p>
                  <span className="text-sm text-muted-foreground">{g.items.reduce((n, i) => n + i.quantity, 0)} artículos · {formatXaf(g.subtotal)}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Entrega</p>
                    <RadioGroup value={choice.deliveryMethod} onValueChange={v => setChoice(g.companyId, { deliveryMethod: v as ShopDeliveryMethod }, g)}>
                      {g.settings.pickupEnabled && (
                        <label className="flex items-start gap-2 text-sm cursor-pointer">
                          <RadioGroupItem value="pickup" className="mt-0.5" />
                          <span>Recoger en tienda <span className="text-green-700">· Gratis</span>{g.settings.pickupAddress && <span className="block text-xs text-muted-foreground">{g.settings.pickupAddress}</span>}</span>
                        </label>
                      )}
                      {g.settings.deliveryEnabled && (
                        <label className="flex items-start gap-2 text-sm cursor-pointer">
                          <RadioGroupItem value="delivery" className="mt-0.5" />
                          <span>
                            Envío a domicilio
                            {choice.deliveryMethod === 'delivery' && city && (
                              fee === undefined
                                ? <span className="block text-xs text-red-600">No envía a {city}</span>
                                : <span className="text-green-700"> · {fee === 0 ? 'Gratis' : formatXaf(fee)}</span>
                            )}
                            {g.settings.freeDeliveryOver !== undefined && <span className="block text-xs text-muted-foreground">Gratis desde {formatXaf(g.settings.freeDeliveryOver)}</span>}
                          </span>
                        </label>
                      )}
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Pago</p>
                    <RadioGroup value={choice.paymentMethod} onValueChange={v => setChoice(g.companyId, { paymentMethod: v as ShopPaymentMethod }, g)}>
                      {g.settings.acceptsCash && (
                        <label className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value="cash" />{PAYMENT_METHOD_LABELS.cash}</label>
                      )}
                      {g.settings.acceptsMuniDinero && (
                        <label className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value="muni_dinero" />{PAYMENT_METHOD_LABELS.muni_dinero}</label>
                      )}
                    </RadioGroup>
                    {choice.paymentMethod === 'muni_dinero' && (
                      <p className="text-xs text-muted-foreground">El vendedor le indicará cómo completar el pago por Muni Dinero.</p>
                    )}
                  </div>
                </div>
                {coupons[g.companyId] ? (
                  <div className="flex items-center justify-between gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-900">
                    <span className="flex items-center gap-2"><TicketPercent className="w-4 h-4" /><strong>{coupons[g.companyId].code}</strong> · {coupons[g.companyId].label} (-{formatXaf(coupons[g.companyId].discount)})</span>
                    <Button variant="ghost" size="sm" onClick={() => removeCoupon(g.companyId)}>Quitar</Button>
                  </div>
                ) : (
                  <div className="flex gap-2 max-w-sm">
                    <Input value={couponInputs[g.companyId] ?? ''} onChange={e => setCouponInputs(prev => ({ ...prev, [g.companyId]: e.target.value }))} placeholder="Código de descuento" aria-label={`Código de descuento para ${g.companyName}`} className="h-9 uppercase" />
                    <Button variant="outline" size="sm" className="h-9" onClick={() => applyCoupon(g)} disabled={checkingCoupon === g.companyId || !(couponInputs[g.companyId] ?? '').trim()}>
                      {checkingCoupon === g.companyId && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Aplicar
                    </Button>
                  </div>
                )}
                {g.settings.orderNotes && <p className="text-xs text-muted-foreground bg-muted rounded p-2 whitespace-pre-line">{g.settings.orderNotes}</p>}
                {belowMinimum && (
                  <p className="text-sm text-amber-700 flex items-center gap-1"><AlertTriangle className="w-4 h-4" />Pedido mínimo: {formatXaf(g.settings.minOrderAmount!)}</p>
                )}
              </div>
            ))}

            {summary!.needsAddress && (
              <div className="grid sm:grid-cols-[200px_1fr] gap-4">
                <div className="space-y-2">
                  <Label>Ciudad de entrega</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger><SelectValue placeholder="Elija ciudad" /></SelectTrigger>
                    <SelectContent>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="co-address">Dirección</Label>
                  <Textarea id="co-address" rows={2} autoComplete="street-address" placeholder="Barrio, calle, referencias..." value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-outline-variant bg-card p-5 space-y-2">
            <Label htmlFor="co-notes" className="font-bold text-lg">3. Notas para el vendedor (opcional)</Label>
            <Textarea id="co-notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Horario preferido, instrucciones..." />
          </section>
        </div>

        <aside className="rounded-lg border border-outline-variant bg-card p-5 space-y-3 lg:sticky lg:top-20">
          <h2 className="font-bold text-lg">Resumen</h2>
          {summary!.rows.map(({ group: g, fee, choice }) => (
            <div key={g.companyId} className="text-sm space-y-1 border-b pb-2">
              <p className="font-medium">{g.companyName}</p>
              {g.items.map(i => (
                <div key={i.variantId} className="flex justify-between gap-2 text-muted-foreground">
                  <span className="truncate">{i.quantity}× {i.productTitle}{i.hasOptions ? ` (${i.variantTitle})` : ''}</span>
                  <span className="whitespace-nowrap">{formatXaf(i.lineTotal)}</span>
                </div>
              ))}
              {choice.deliveryMethod === 'delivery' && (
                <div className="flex justify-between text-muted-foreground"><span>Envío</span><span>{fee === undefined ? '—' : fee === 0 ? 'Gratis' : formatXaf(fee)}</span></div>
              )}
            </div>
          ))}
          <div className="flex justify-between text-sm"><span>Productos</span><span>{formatXaf(details.subtotal)}</span></div>
          {summary!.discount > 0 && <div className="flex justify-between text-sm text-green-700"><span>Descuentos</span><span>-{formatXaf(summary!.discount)}</span></div>}
          <div className="flex justify-between text-sm"><span>Envío</span><span>{summary!.shipping === 0 ? 'Gratis' : formatXaf(summary!.shipping)}</span></div>
          <div className="flex justify-between font-bold text-lg border-t pt-3"><span>Total</span><span>{formatXaf(summary!.total)}</span></div>
          <Button size="lg" className="w-full" onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
            Confirmar pedido
          </Button>
          <p className="text-xs text-muted-foreground">No se cobra nada en la web. El vendedor le contactará para confirmar el pedido y el pago.</p>
        </aside>
      </div>
    </div>
  );
}
