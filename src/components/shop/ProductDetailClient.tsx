'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Check, MessageCircle, Minus, Package, Phone, Plus, ShoppingCart, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useShopCart } from '@/hooks/use-shop-cart';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toWhatsAppHref } from '@/components/shared/WhatsAppButton';
import { recordProductView } from '@/lib/shop/actions';
import { formatXaf, isVariantPurchasable, PRODUCT_CONDITION_LABELS, type Product, type ProductVariant } from '@/lib/shop/types';
import { PriceTag, RatingStars } from './ProductCard';
import { WishlistButton } from './ProductEngagement';

const LOW_STOCK = 5;

type SellerContact = { name: string; whatsapp?: string; phone?: string };

function Gallery({ images, activeUrl, title }: { images: Product['images']; activeUrl?: string; title: string }) {
  const [index, setIndex] = useState(0);
  // A variant with its own photo takes over the main image when selected.
  useEffect(() => {
    if (!activeUrl) return;
    const i = images.findIndex(img => img.url === activeUrl);
    if (i >= 0) setIndex(i);
  }, [activeUrl, images]);

  const current = images[index] ?? images[0];
  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-lg border border-outline-variant bg-white overflow-hidden">
        {current ? (
          <Image src={current.url} alt={current.alt || title} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><Package className="w-16 h-16 text-muted-foreground" /></div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn('relative w-16 h-16 shrink-0 rounded-md border-2 overflow-hidden bg-white', i === index ? 'border-primary' : 'border-transparent hover:border-outline-variant')}
              aria-label={`Ver imagen ${i + 1}`}
              aria-current={i === index}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function stockMessage(v: ProductVariant | undefined): { text: string; tone: 'ok' | 'warn' | 'out' } {
  if (!v || !v.isActive) return { text: 'No disponible', tone: 'out' };
  if (!v.trackInventory) return { text: 'Disponible', tone: 'ok' };
  if (v.stock > 0) return v.stock <= LOW_STOCK ? { text: `¡Solo quedan ${v.stock}!`, tone: 'warn' } : { text: 'En stock', tone: 'ok' };
  if (v.allowBackorder) return { text: 'Bajo pedido', tone: 'warn' };
  return { text: 'Agotado', tone: 'out' };
}

export function ProductDetailClient({ product, seller, isPreview }: { product: Product; seller: SellerContact; isPreview: boolean }) {
  const variants = useMemo(() => product.variants.filter(v => v.isActive), [product.variants]);
  const initial = variants.find(isVariantPurchasable) ?? variants[0];
  const [selected, setSelected] = useState<string[]>(initial?.optionValues ?? []);
  const [quantity, setQuantity] = useState(1);
  const cart = useShopCart();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isPreview) recordProductView(product.id);
  }, [product.id, isPreview]);

  const variant = variants.find(v => v.optionValues.every((val, i) => val === selected[i]));
  const purchasable = !!variant && isVariantPurchasable(variant);
  const maxQty = variant && variant.trackInventory && !variant.allowBackorder ? Math.max(1, variant.stock) : 99;
  const stock = stockMessage(variant);

  // A value is offered if some active variant has it alongside the other
  // currently selected values; struck through if none of those can be bought.
  const valueState = (optionIndex: number, value: string) => {
    const candidates = variants.filter(v => v.optionValues[optionIndex] === value && v.optionValues.every((val, i) => i === optionIndex || val === selected[i]));
    return { exists: candidates.length > 0, purchasable: candidates.some(isVariantPurchasable) };
  };

  const choose = (optionIndex: number, value: string) => {
    const next = [...selected];
    next[optionIndex] = value;
    // If that combination doesn't exist, jump to the closest one that has this value.
    if (!variants.some(v => v.optionValues.every((val, i) => val === next[i]))) {
      const fallback = variants.find(v => v.optionValues[optionIndex] === value && isVariantPurchasable(v))
        ?? variants.find(v => v.optionValues[optionIndex] === value);
      if (fallback) {
        setSelected(fallback.optionValues);
        setQuantity(1);
        return;
      }
    }
    setSelected(next);
    setQuantity(1);
  };

  const addToCart = () => {
    if (!variant || !purchasable) return;
    cart.addItem(variant.id, quantity);
    toast({
      title: 'Añadido al carrito',
      description: `${quantity} × ${product.title}${product.options.length ? ` (${variant.title})` : ''}`,
      action: <ToastAction altText="Ver carrito" onClick={() => router.push('/tienda/carrito')}>Ver carrito</ToastAction>,
    });
  };

  const buyNow = () => {
    if (!variant || !purchasable) return;
    cart.addItem(variant.id, quantity);
    router.push('/tienda/checkout');
  };

  const whatsappHref = useMemo(() => {
    if (!seller.whatsapp || !variant) return undefined;
    const number = seller.whatsapp.startsWith('http') ? seller.whatsapp : seller.whatsapp.replace(/[^\d]/g, '');
    if (!number) return undefined;
    const lines = [
      `Hola ${seller.name}, quiero pedir este producto que vi en Oltinde:`,
      '',
      `${quantity}x ${product.title}${product.options.length ? ` (${variant.title})` : ''}`,
      `Precio: ${formatXaf(variant.price * quantity)}`,
      ...(variant.sku ? [`Ref: ${variant.sku}`] : []),
      '',
      `https://oltinde.com/tienda/p/${product.slug}`,
    ];
    return toWhatsAppHref(number, lines.join('\n'));
  }, [seller, variant, quantity, product]);

  return (
    <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
      <Gallery images={product.images} activeUrl={variant?.image} title={product.title} />

      <div className="space-y-5">
        <div className="space-y-2">
          {product.brand && <p className="text-sm uppercase tracking-wide text-on-surface-variant">{product.brand}</p>}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">{product.title}</h1>
            {!isPreview && <WishlistButton productId={product.id} className="shrink-0" />}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <RatingStars value={product.ratingAvg} count={product.ratingCount} className="text-sm" />
            {product.condition !== 'new' && <span className="rounded bg-muted px-2 py-0.5">{PRODUCT_CONDITION_LABELS[product.condition]}</span>}
            {product.salesCount > 0 && <span className="text-on-surface-variant">{product.salesCount} vendidos</span>}
          </div>
          {product.shortDescription && <p className="text-on-surface-variant">{product.shortDescription}</p>}
        </div>

        <PriceTag price={variant?.price ?? product.minPrice} compareAtPrice={variant?.compareAtPrice} size="lg" />

        {product.options.map((option, oi) => (
          <div key={option.name} className="space-y-2">
            <p className="text-sm"><span className="font-semibold">{option.name}:</span> {selected[oi]}</p>
            <div className="flex flex-wrap gap-2">
              {option.values.map(value => {
                const state = valueState(oi, value);
                const active = selected[oi] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => choose(oi, value)}
                    aria-pressed={active}
                    className={cn(
                      'min-w-11 rounded-md border px-3 py-1.5 text-sm transition-colors',
                      active ? 'border-black bg-black text-white' : 'border-outline-variant hover:border-black',
                      !state.purchasable && !active && 'text-muted-foreground line-through decoration-1',
                      !state.exists && 'opacity-50',
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <p className={cn('font-semibold', stock.tone === 'ok' && 'text-green-700', stock.tone === 'warn' && 'text-amber-600', stock.tone === 'out' && 'text-red-600')}>
          {stock.tone === 'ok' && <Check className="inline w-4 h-4 mr-1 -mt-0.5" />}{stock.text}
        </p>

        <div className="rounded-lg border border-outline-variant p-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Cantidad</span>
            <div className="flex items-center rounded-md border">
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Menos">
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-10 text-center tabular-nums" aria-live="polite">{quantity}</span>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty} aria-label="Más">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {quantity > 1 && variant && <span className="text-sm text-on-surface-variant">Total: {formatXaf(variant.price * quantity)}</span>}
          </div>

          {isPreview ? (
            <p className="text-sm text-muted-foreground">Vista previa: los botones de compra aparecen cuando el producto está publicado.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <Button size="lg" className="w-full" disabled={!purchasable} onClick={addToCart}>
                <ShoppingCart className="w-4 h-4 mr-2" /> Añadir al carrito
              </Button>
              <Button size="lg" variant="secondary" className="w-full" disabled={!purchasable} onClick={buyNow}>
                Comprar ahora
              </Button>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1 text-sm">
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#128C7E] hover:underline">
                    <MessageCircle className="w-4 h-4" /> Preguntar por WhatsApp
                  </a>
                )}
                {seller.phone && (
                  <a href={`tel:${seller.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:underline"><Phone className="w-4 h-4" /> Llamar al vendedor</a>
                )}
              </div>
            </div>
          )}
          <p className="text-xs text-on-surface-variant flex items-center gap-1.5"><Truck className="w-4 h-4" /> Recogida en tienda o envío según el vendedor. Pago al recibir.</p>
        </div>
      </div>
    </div>
  );
}
