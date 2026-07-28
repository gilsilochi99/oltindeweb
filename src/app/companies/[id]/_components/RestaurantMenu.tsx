
'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Plus, ShoppingCart, Flame } from 'lucide-react';
import { useFoodCart } from '@/hooks/use-food-cart';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/lib/types';

function formatPrice(price: number) {
  return `${price.toLocaleString('es-ES')} XAF`;
}

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
}

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem) => void }) {
  return (
    <div
      className={cn(
        "group flex gap-3 p-3 rounded-lg border border-outline-variant bg-card transition-all duration-200",
        item.available ? "hover:shadow-md hover:-translate-y-0.5 hover:border-primary/50" : "opacity-60"
      )}
    >
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-md overflow-hidden bg-muted">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className={cn("object-cover transition-transform duration-300", item.available && "group-hover:scale-105")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="w-7 h-7 text-muted-foreground" />
          </div>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wide text-destructive">Agotado</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <p className="font-semibold text-sm sm:text-[15px] leading-snug">{item.name}</p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 flex-grow">{item.description}</p>
        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="text-sm sm:text-base font-bold text-on-background">{formatPrice(item.price)}</span>
          {item.available && (
            <Button type="button" size="sm" className="h-8 shrink-0" onClick={() => onAdd(item)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Añadir
            </Button>
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

  const sectionLinks = [
    ...(menuDelDia.length > 0 ? [{ id: 'menu-del-dia', label: 'Menú del Día' }] : []),
    ...groupedByType.map(([foodType]) => ({ id: slugify(foodType), label: foodType })),
  ];

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
    <div className={cn("relative", isOwnCart && "pb-20")}>
      {sectionLinks.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-outline-variant">
          {sectionLinks.map(link => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="inline-flex items-center px-3 py-1.5 rounded-full border border-outline-variant bg-background text-xs font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {menuDelDia.length > 0 && (
        <div id="menu-del-dia" className="mb-8 scroll-mt-24">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold">Menú del Día</h3>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuDelDia.map(item => <MenuItemCard key={item.id} item={item} onAdd={handleAdd} />)}
            </div>
          </div>
        </div>
      )}

      {groupedByType.map(([foodType, groupItems]) => (
        <div key={foodType} id={slugify(foodType)} className="mb-8 last:mb-0 scroll-mt-24">
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-base font-bold">{foodType}</h3>
            <span className="text-xs text-muted-foreground">({groupItems.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groupItems.map(item => <MenuItemCard key={item.id} item={item} onAdd={handleAdd} />)}
          </div>
        </div>
      ))}

      {isOwnCart && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-md px-2">
          <Button asChild size="lg" className="w-full shadow-lg h-14 text-base">
            <Link href="/checkout" className="flex items-center justify-between w-full px-2">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Ver Pedido ({itemCount})
              </span>
              <span className="font-bold">{formatPrice(subtotal)}</span>
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
