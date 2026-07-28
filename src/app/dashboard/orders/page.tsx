
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getFoodOrdersByCustomer } from '@/lib/data';
import { cancelFoodOrder } from '@/lib/actions';
import type { FoodOrder, FoodOrderStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingBag, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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

const DELIVERY_LABELS = { pickup: 'Recoger en el local', situka: 'Entrega con Situka' } as const;

function formatPrice(price: number) {
  return `${price.toLocaleString('es-ES')} XAF`;
}

export default function CustomerOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
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
    const data = await getFoodOrdersByCustomer(user.uid);
    setOrders(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async (orderId: string) => {
    if (!user) return;
    const result = await cancelFoodOrder(orderId, user.uid);
    if (result.success) {
      toast({ title: 'Pedido cancelado' });
      fetchData();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Mis Pedidos</h1>
        <p className="text-muted-foreground">Historial de sus pedidos de comida.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map(order => {
                const canCancel = order.status === 'placed' || order.status === 'confirmed';
                return (
                  <Card key={order.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <div>
                          <p className="font-bold flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" />
                            {order.companyName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(order.createdAt).toLocaleString('es-ES')}
                          </p>
                        </div>
                        <Badge className={STATUS_BADGE_CLASS[order.status]} variant="secondary">
                          {STATUS_LABELS[order.status]}
                        </Badge>
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
                      </div>

                      {canCancel && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10">
                              Cancelar Pedido
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Cancelar este pedido?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se notificará a {order.companyName} de la cancelación. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Volver</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancel(order.id)}>Sí, cancelar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Todavía no ha hecho ningún pedido.</p>
              <Button asChild variant="link">
                <Link href="/food">Explorar restaurantes</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
