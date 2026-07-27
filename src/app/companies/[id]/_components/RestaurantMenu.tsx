
'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, Plus, ShoppingCart } from 'lucide-react';
import { useFoodCart } from '@/hooks/use-food-cart';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { MenuItem } from '@/lib/types';

function formatPrice(price: number) {
  return `${price.toLocaleString('es-ES')} XAF`;
}

function MenuItemRow({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem) => void }) {
  return (
    <div className="flex gap-3 py-3 border-b border-outline-variant last:border-0">
      {item.image ? (
        <Image src={item.image} alt={item.name} width={72} height={72} className="w-[72px] h-[72px] rounded-md object-cover shrink-0" />
      ) : (
        <div className="w-[72px] h-[72px] rounded-md bg-muted flex items-center justify-center shrink-0">
          <UtensilsCrossed className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{item.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold">{formatPrice(item.price)}</span>
          {item.available ? (
            <Button type="button" size="sm" variant="outline" onClick={() => onAdd(item)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Añadir
            </Button>
          ) : (
            <Badge variant="outline" className="text-destructive border-destructive">Agotado</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export function RestaurantMenu({ items, companyId, companyName }: { items: MenuItem[]; companyId: string; companyName: string }) {
  const { addItem, replaceCart, itemCount, subtotal, companyId: cartCompanyId } = useFoodCart();
  const { toast } = useToast();
  const [conflictItem, setConflictItem] = useState<MenuItem | null>(null);

  const menuDelDia = useMemo(() => items.filter(i => i.isMenuDelDia && i.available), [items]);

  const groupedByType = useMemo(() => {
    const groups = new Map<string, MenuItem[]>();
    items.forEach(item => {
      const key = item.foodType || 'Otros';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const handleAdd = (item: MenuItem) => {
    const added = addItem(companyId, companyName, { menuItemId: item.id, name: item.name, price: item.price, image: item.image });
    if (!added) {
      setConflictItem(item);
      return;
    }
    toast({ title: 'Añadido al carrito', description: item.name });
  };

  const confirmReplace = () => {
    if (!conflictItem) return;
    replaceCart(companyId, companyName, { menuItemId: conflictItem.id, name: conflictItem.name, price: conflictItem.price, image: conflictItem.image });
    toast({ title: 'Carrito actualizado', description: `Se vació el pedido anterior y se añadió ${conflictItem.name}.` });
    setConflictItem(null);
  };

  const isOwnCart = itemCount > 0 && cartCompanyId === companyId;

  return (
    <div className="relative">
      {menuDelDia.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-primary mb-2">Menú del Día</h3>
          <div className="rounded-md border border-primary/30 bg-primary/5 px-3">
            {menuDelDia.map(item => <MenuItemRow key={item.id} item={item} onAdd={handleAdd} />)}
          </div>
        </div>
      )}

      {groupedByType.map(([foodType, groupItems]) => (
        <div key={foodType} className="mb-6 last:mb-0">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-2">{foodType}</h3>
          <div className="px-1">
            {groupItems.map(item => <MenuItemRow key={item.id} item={item} onAdd={handleAdd} />)}
          </div>
        </div>
      ))}

      {isOwnCart && (
        <div className="sticky bottom-4 mt-4 flex justify-center">
          <Button asChild size="lg" className="shadow-lg">
            <Link href="/checkout">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Ver Pedido ({itemCount}) · {formatPrice(subtotal)}
            </Link>
          </Button>
        </div>
      )}

      <AlertDialog open={!!conflictItem} onOpenChange={(open) => !open && setConflictItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Vaciar el carrito actual?</AlertDialogTitle>
            <AlertDialogDescription>
              Su carrito tiene productos de otro restaurante. Solo puede pedir de un restaurante a la vez. ¿Desea vaciar el pedido actual y añadir "{conflictItem?.name}" de {companyName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReplace}>Sí, vaciar y añadir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
