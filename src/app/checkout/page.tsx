
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useFoodCart } from '@/hooks/use-food-cart';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getCompanyById } from '@/lib/data';
import { createFoodOrder } from '@/lib/actions';
import { toWhatsAppHref } from '@/components/shared/WhatsAppButton';
import type { Company, FoodOrderDeliveryMethod, FoodOrderPaymentMethod } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Minus, Plus, Trash2, ShoppingCart, Loader2, CheckCircle2, MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function formatPrice(price: number) {
  return `${price.toLocaleString('es-ES')} XAF`;
}

export default function CheckoutPage() {
  const cart = useFoodCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<FoodOrderDeliveryMethod>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<FoodOrderPaymentMethod>('none');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ orderId: string; whatsappUrl: string } | null>(null);

  useEffect(() => {
    if (user?.displayName) setCustomerName(user.displayName);
  }, [user]);

  useEffect(() => {
    async function fetchCompany() {
      if (!cart.companyId) {
        setIsLoadingCompany(false);
        return;
      }
      const data = await getCompanyById(cart.companyId);
      setCompany(data ?? null);
      setIsLoadingCompany(false);
    }
    fetchCompany();
  }, [cart.companyId]);

  const buildWhatsAppMessage = () => {
    const lines = [
      `Nuevo pedido — ${company?.name ?? ''}`,
      '',
      ...cart.items.map(i => `${i.quantity}x ${i.name}${i.selectedOptions?.length ? ` (${i.selectedOptions.map(o => o.optionName).join(', ')})` : ''} — ${formatPrice(i.price * i.quantity)}`),
      '',
      `Subtotal: ${formatPrice(cart.subtotal)}`,
      `Entrega: ${deliveryMethod === 'pickup' ? 'Recoger en el local' : 'Entrega con Situka'}`,
      ...(deliveryMethod === 'situka' ? [`Dirección: ${deliveryAddress}`] : []),
      `Pago: ${paymentMethod === 'muni_dinero' ? 'Muni Dinero (a coordinar)' : 'A coordinar en el local'}`,
      `Cliente: ${customerName} — ${customerPhone}`,
      ...(notes ? [`Notas: ${notes}`] : []),
    ];
    return lines.join('\n');
  };

  const handleSubmit = async () => {
    if (!cart.companyId || cart.items.length === 0) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      toast({ title: 'Faltan datos', description: 'Indique su nombre y teléfono.', variant: 'destructive' });
      return;
    }
    if (deliveryMethod === 'situka' && !deliveryAddress.trim()) {
      toast({ title: 'Falta la dirección', description: 'Indique la dirección de entrega.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createFoodOrder({
        companyId: cart.companyId,
        customerId: user?.uid,
        customerName,
        customerPhone,
        items: cart.items.map(i => ({ menuItemId: i.menuItemId, name: i.name, price: i.price, quantity: i.quantity, selectedOptions: i.selectedOptions })),
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'situka' ? deliveryAddress : undefined,
        paymentMethod,
        notes,
      });

      if (!result.success || !result.id) {
        throw new Error(result.message);
      }

      const whatsappNumber = company?.contact.socialMedia?.whatsapp || company?.branches?.[0]?.contact.phone;
      const whatsappUrl = whatsappNumber ? toWhatsAppHref(whatsappNumber, buildWhatsAppMessage()) : '';

      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }

      setConfirmation({ orderId: result.id, whatsappUrl });
      cart.clearCart();
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'No se pudo crear el pedido.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
        <h1 className="text-2xl font-bold font-headline">Pedido Creado</h1>
        <p className="text-muted-foreground">
          Su pedido se envió por WhatsApp al restaurante. Si no se abrió automáticamente, use el botón de abajo.
        </p>
        {confirmation.whatsappUrl && (
          <Button asChild size="lg">
            <a href={confirmation.whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4 mr-2" /> Abrir WhatsApp
            </a>
          </Button>
        )}
        <div>
          <Button variant="link" asChild>
            <Link href="/companies">Volver al directorio</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold font-headline">Su carrito está vacío</h1>
        <p className="text-muted-foreground">Explore restaurantes y añada productos a su pedido.</p>
        <Button asChild>
          <Link href="/companies">Ver Restaurantes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline">Confirmar Pedido</h1>
        {isLoadingCompany ? (
          <Skeleton className="h-5 w-40 mt-1" />
        ) : (
          <p className="text-muted-foreground">{company?.name || cart.companyName}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Su Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cart.items.map(item => (
            <div key={item.lineId} className="flex items-center gap-3">
              {item.image ? (
                <Image src={item.image} alt={item.name} width={48} height={48} className="w-12 h-12 rounded-md object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-md bg-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.selectedOptions.map(o => o.optionName).join(', ')}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => cart.updateQuantity(item.lineId, item.quantity - 1)}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-5 text-center text-sm">{item.quantity}</span>
                <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => cart.updateQuantity(item.lineId, item.quantity + 1)}>
                  <Plus className="w-3 h-3" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => cart.removeItem(item.lineId)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-between pt-3 border-t font-bold">
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sus Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nombre</Label>
              <Input id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Teléfono</Label>
              <Input id="customer-phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="222 XXX XXX" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entrega</CardTitle>
          <CardDescription>Elija cómo desea recibir su pedido.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as FoodOrderDeliveryMethod)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pickup" id="delivery-pickup" />
              <Label htmlFor="delivery-pickup" className="font-normal">Recoger en el local</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="situka" id="delivery-situka" />
              <Label htmlFor="delivery-situka" className="font-normal">Entrega con Situka</Label>
            </div>
          </RadioGroup>
          {deliveryMethod === 'situka' && (
            <div className="space-y-2">
              <Label htmlFor="delivery-address">Dirección de Entrega</Label>
              <Textarea id="delivery-address" rows={2} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Barrio, calle, referencia..." />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as FoodOrderPaymentMethod)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="payment-none" />
              <Label htmlFor="payment-none" className="font-normal">Coordinar directamente con el restaurante</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="muni_dinero" id="payment-muni" />
              <Label htmlFor="payment-muni" className="font-normal">Muni Dinero</Label>
            </div>
          </RadioGroup>
          {paymentMethod === 'muni_dinero' && (
            <p className="text-xs text-muted-foreground bg-muted rounded-md p-3">
              El cobro automático por Muni Dinero aún no está activo. Su intención de pago quedará registrada y el restaurante coordinará el cobro directamente con usted.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="order-notes">Notas (Opcional)</Label>
        <Textarea id="order-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones especiales..." />
      </div>

      <Button size="lg" className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Crear Pedido y Enviar por WhatsApp
      </Button>
    </div>
  );
}
