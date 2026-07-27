
'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById, getFoodOrdersByCompany } from '@/lib/data';
import { updateFoodOrderStatus } from '@/lib/actions';
import type { Company, FoodOrder, FoodOrderStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShoppingBag, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const STATUS_LABELS: Record<FoodOrderStatus, string> = {
  placed: 'Recibido',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const STATUS_BADGE_CLASS: Record<FoodOrderStatus, string> = {
  placed: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  preparing: 'bg-amber-100 text-amber-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

function formatPrice(price: number) {
  return `${price.toLocaleString('es-ES')} XAF`;
}

const DELIVERY_LABELS = { pickup: 'Recoger en el local', situka: 'Entrega con Situka' } as const;
const PAYMENT_LABELS = { none: 'A coordinar', muni_dinero: 'Muni Dinero' } as const;

export default function CompanyOrdersPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const companyData = await getCompanyById(companyId);
    if (!companyData || companyData.ownerId !== user.uid) {
      notFound();
      return;
    }
    const orderData = await getFoodOrdersByCompany(companyId);
    setCompany(companyData);
    setOrders(orderData);
    setIsLoading(false);
  }, [user, companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (orderId: string, status: FoodOrderStatus) => {
    if (!user) return;
    const result = await updateFoodOrderStatus(orderId, user.uid, status);
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Pedidos</h1>
          <p className="text-muted-foreground">
            Para la empresa: <Link href={`/companies/${company.id}`} className="font-semibold text-black hover:underline">{company.name}</Link>
          </p>
        </div>
        <Link href={`/dashboard/companies/${companyId}/menu`} className="text-sm underline text-muted-foreground hover:text-black">
          Gestionar Menú
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recibidos ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map(order => (
                <Card key={order.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2 flex-wrap">
                      <div>
                        <p className="font-bold flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4" />
                          {order.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3" /> {order.customerPhone}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.createdAt).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v as FoodOrderStatus)}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue>
                            <Badge className={STATUS_BADGE_CLASS[order.status]} variant="secondary">
                              {STATUS_LABELS[order.status]}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_LABELS) as FoodOrderStatus[]).map(s => (
                            <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="border-t pt-3 space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="text-muted-foreground">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold pt-1 border-t">
                        <span>Subtotal</span>
                        <span>{formatPrice(order.subtotal)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-3">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{DELIVERY_LABELS[order.deliveryMethod]}</span>
                      <span>Pago: {PAYMENT_LABELS[order.paymentMethod]}</span>
                      {order.commissionAmount > 0 && (
                        <span>Comisión ({order.commissionPercent}%): {formatPrice(order.commissionAmount)}</span>
                      )}
                    </div>
                    {order.deliveryAddress && (
                      <p className="text-xs text-muted-foreground">Dirección: {order.deliveryAddress}</p>
                    )}
                    {order.notes && (
                      <p className="text-xs text-muted-foreground italic">Notas: {order.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay pedidos todavía.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
