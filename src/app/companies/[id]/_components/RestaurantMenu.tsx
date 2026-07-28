
'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Plus, ShoppingCart, Flame } from 'lucide-react';
import { useFoodCart, type FoodCartSelectedOption } from '@/hooks/use-food-cart';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/lib/types';

function formatPrice(price: number) {
  return `${price.toLocaleString('es-ES')} XAF`;
}

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
}

interface PendingCartItem {
  menuItemId: string;
  name: string;
  price: number;
  image?: string;
  selectedOptions?: FoodCartSelectedOption[];
}

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem) => void }) {
  const hasOptions = (item.optionGroups?.length ?? 0) > 0;
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
          <span className="text-sm sm:text-base font-bold text-on-background">
            {hasOptions ? `Desde ${formatPrice(item.price)}` : formatPrice(item.price)}
          </span>
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

function OptionsDialog({ item, onClose, onConfirm }: { item: MenuItem; onClose: () => void; onConfirm: (cartItem: PendingCartItem) => void }) {
  const groups = item.optionGroups || [];
  const [selections, setSelections] = useState<Record<string, string>>({});

  const total = useMemo(() => {
    let sum = item.price;
    groups.forEach(g => {
      const selectedOptionId = selections[g.id];
      const option = g.options.find(o => o.id === selectedOptionId);
      if (option) sum += option.priceDelta;
    });
    return sum;
  }, [item.price, groups, selections]);

  const missingRequired = groups.some(g => g.required && !selections[g.id]);

  const handleConfirm = () => {
    const selectedOptions: FoodCartSelectedOption[] = groups
      .map(g => {
        const option = g.options.find(o => o.id === selections[g.id]);
        return option ? { groupName: g.name, optionName: option.name, priceDelta: option.priceDelta } : null;
      })
      .filter((o): o is FoodCartSelectedOption => o !== null);

    onConfirm({ menuItemId: item.id, name: item.name, price: total, image: item.image, selectedOptions });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {groups.map(group => (
            <div key={group.id}>
              <p className="text-sm font-semibold mb-2">
                {group.name} {group.required && <span className="text-destructive">*</span>}
              </p>
              <RadioGroup value={selections[group.id] || ''} onValueChange={(v) => setSelections(prev => ({ ...prev, [group.id]: v }))}>
                {group.options.map(option => (
                  <div key={option.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={`opt-${option.id}`} />
                      <Label htmlFor={`opt-${option.id}`} className="font-normal">{option.name}</Label>
                    </div>
                    {option.priceDelta !== 0 && (
                      <span className="text-xs text-muted-foreground">
                        {option.priceDelta > 0 ? '+' : ''}{formatPrice(option.priceDelta)}
                      </span>
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" className="w-full" disabled={missingRequired} onClick={handleConfirm}>
            Añadir · {formatPrice(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RestaurantMenu({ items, companyId, companyName }: { items: MenuItem[]; companyId: string; companyName: string }) {
  const { addItem, replaceCart, itemCount, subtotal, companyId: cartCompanyId } = useFoodCart();
  const { toast } = useToast();
  const [conflictCartItem, setConflictCartItem] = useState<PendingCartItem | null>(null);
  const [optionsItem, setOptionsItem] = useState<MenuItem | null>(null);

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

  const attemptAdd = (cartItem: PendingCartItem, itemName: string) => {
    const added = addItem(companyId, companyName, cartItem);
    if (!added) {
      setConflictCartItem(cartItem);
      return;
    }
    toast({ title: 'Añadido al carrito', description: itemName });
  };

  const handleAdd = (item: MenuItem) => {
    if ((item.optionGroups?.length ?? 0) > 0) {
      setOptionsItem(item);
      return;
    }
    attemptAdd({ menuItemId: item.id, name: item.name, price: item.price, image: item.image }, item.name);
  };

  const handleOptionsConfirm = (cartItem: PendingCartItem) => {
    setOptionsItem(null);
    attemptAdd(cartItem, cartItem.name);
  };

  const confirmReplace = () => {
    if (!conflictCartItem) return;
    replaceCart(companyId, companyName, conflictCartItem);
    toast({ title: 'Carrito actualizado', description: `Se vació el pedido anterior y se añadió ${conflictCartItem.name}.` });
    setConflictCartItem(null);
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

      {optionsItem && (
        <OptionsDialog item={optionsItem} onClose={() => setOptionsItem(null)} onConfirm={handleOptionsConfirm} />
      )}

      <AlertDialog open={!!conflictCartItem} onOpenChange={(open) => !open && setConflictCartItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Vaciar el carrito actual?</AlertDialogTitle>
            <AlertDialogDescription>
              Su carrito tiene productos de otro restaurante. Solo puede pedir de un restaurante a la vez. ¿Desea vaciar el pedido actual y añadir "{conflictCartItem?.name}" de {companyName}?
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
