
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllFoodOrders } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, ShoppingBag, MapPin } from "lucide-react";
import type { FoodOrder, FoodOrderStatus } from "@/lib/types";
import { updateFoodOrderStatus } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

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
const PAYMENT_LABELS = { none: 'A coordinar', muni_dinero: 'Muni Dinero' } as const;

function formatPrice(price: number) {
  return `${price.toLocaleString('es-ES')} XAF`;
}

export default function AdminFoodOrdersPage() {
  const { user, isAdmin, isManager } = useAuth();
  const canManage = isAdmin || isManager;
  const { toast } = useToast();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FoodOrderStatus>('all');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const data = await getAllFoodOrders();
    setOrders(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => statusFilter === 'all' || o.status === statusFilter)
      .filter(o =>
        o.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [orders, statusFilter, searchQuery]);

  const totalCommission = useMemo(() => filteredOrders.reduce((sum, o) => sum + o.commissionAmount, 0), [filteredOrders]);

  const handleStatusChange = async (orderId: string, status: FoodOrderStatus) => {
    if (!user) return;
    const result = await updateFoodOrderStatus(orderId, user.uid, status, canManage);
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline">Pedidos de Comida</h1>
        <p className="text-muted-foreground">Todos los pedidos realizados a través de la plataforma.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Pedidos ({filteredOrders.length})</CardTitle>
              <CardDescription>Comisión total en esta vista: {formatPrice(totalCommission)}</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Buscar por restaurante o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | FoodOrderStatus)}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {(Object.keys(STATUS_LABELS) as FoodOrderStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <Card key={order.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2 flex-wrap">
                      <div>
                        <p className="font-bold flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4" />
                          {order.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {order.customerName} — {order.customerPhone}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay pedidos que coincidan.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
