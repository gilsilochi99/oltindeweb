// Tienda (marketplace) for the app. Types and helpers mirror the web app's
// src/lib/shop/types.ts; every call goes through /api/mobile/rpc to the same
// server functions the website uses (prices and stock are always checked
// there, the app only sends variant ids and quantities).
import { rpc, rpcAction } from './api';
import { WEB_APP_URL } from './config';

export type ProductCondition = 'new' | 'used' | 'refurbished';

export const PRODUCT_CONDITION_LABELS: Record<ProductCondition, string> = {
  new: 'Nuevo',
  used: 'Usado',
  refurbished: 'Reacondicionado',
};

export type ProductCategory = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  position: number;
  isActive: boolean;
};

export type ProductVariant = {
  id: string;
  title: string;
  optionValues: string[];
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  image?: string;
  position: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  companyId: string;
  companyName: string;
  categoryId?: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description: string;
  brand?: string;
  condition: ProductCondition;
  status: 'draft' | 'active' | 'archived';
  options: { name: string; values: string[] }[];
  specs: { name: string; value: string }[];
  tags: string[];
  images: { id: string; url: string; alt?: string }[];
  variants: ProductVariant[];
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  inStock: boolean;
  isOnSale: boolean;
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
};

export type ProductListItem = {
  id: string;
  slug: string;
  title: string;
  image?: string;
  brand?: string;
  condition: ProductCondition;
  minPrice: number;
  maxPrice: number;
  compareAtPrice?: number;
  isOnSale: boolean;
  inStock: boolean;
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
  companyId: string;
  companyName: string;
};

export type ProductSort = 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'best_selling' | 'rating';

export const PRODUCT_SORT_LABELS: Record<ProductSort, string> = {
  relevance: 'Relevancia',
  newest: 'Novedades',
  price_asc: 'Precio: menor a mayor',
  price_desc: 'Precio: mayor a menor',
  best_selling: 'Más vendidos',
  rating: 'Mejor valorados',
};

export type ProductQuery = {
  q?: string;
  categorySlug?: string;
  companyId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sort?: ProductSort;
  page?: number;
};

export type ProductSearchResult = {
  items: ProductListItem[];
  total: number;
  page: number;
  pageCount: number;
};

export type StorefrontHome = {
  featured: ProductListItem[];
  deals: ProductListItem[];
  newest: ProductListItem[];
  bestSellers: ProductListItem[];
  categoryCounts: Record<string, number>;
  totalProducts: number;
};

export type CartLine = { variantId: string; quantity: number };
export const MAX_CART_QUANTITY = 99;

export type CartItemDetail = {
  variantId: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  variantTitle: string;
  hasOptions: boolean;
  image?: string;
  unitPrice: number;
  compareAtPrice?: number;
  quantity: number;
  maxQuantity: number;
  lineTotal: number;
  issue?: 'unavailable' | 'out_of_stock' | 'insufficient_stock';
};

export type ShopDeliveryMethod = 'pickup' | 'delivery';
export type ShopPaymentMethod = 'cash' | 'muni_dinero';
export type ShopOrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type ShopSellerSettings = {
  pickupEnabled: boolean;
  pickupAddress?: string;
  deliveryEnabled: boolean;
  deliveryFee: number;
  deliveryFeeByCity: { city: string; fee: number }[];
  deliveryCities: string[];
  freeDeliveryOver?: number;
  minOrderAmount?: number;
  acceptsCash: boolean;
  acceptsMuniDinero: boolean;
  orderNotes?: string;
};

export type CartSellerGroup = {
  companyId: string;
  companyName: string;
  companyCity?: string;
  settings: ShopSellerSettings;
  items: CartItemDetail[];
  subtotal: number;
};

export type CartDetails = {
  groups: CartSellerGroup[];
  missingVariantIds: string[];
  subtotal: number;
  itemCount: number;
};

export const ORDER_STATUS_LABELS: Record<ShopOrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En preparación',
  shipped: 'Enviado / Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const PAYMENT_METHOD_LABELS: Record<ShopPaymentMethod, string> = {
  cash: 'Pago al recibir (efectivo)',
  muni_dinero: 'Muni Dinero',
};

export const DELIVERY_METHOD_LABELS: Record<ShopDeliveryMethod, string> = {
  pickup: 'Recogida en tienda',
  delivery: 'Envío a domicilio',
};

export const CUSTOMER_CANCELLABLE: ShopOrderStatus[] = ['pending', 'confirmed'];

export type ShopOrder = {
  id: string;
  orderNumber: string;
  checkoutId: string;
  companyId: string;
  companyName: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: ShopDeliveryMethod;
  deliveryCity?: string;
  deliveryAddress?: string;
  paymentMethod: ShopPaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  status: ShopOrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes?: string;
  cancelReason?: string;
  couponCode?: string;
  items: { id: string; productSlug?: string; productTitle: string; variantTitle: string; image?: string; unitPrice: number; quantity: number; lineTotal: number }[];
  events: { id: string; status: ShopOrderStatus; note?: string; createdAt: string }[];
  createdAt: string;
};

export type CheckoutInput = {
  lines: CartLine[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  notes?: string;
  sellers: { companyId: string; deliveryMethod: ShopDeliveryMethod; paymentMethod: ShopPaymentMethod; couponCode?: string }[];
};

export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  isVerifiedPurchase: boolean;
  replyText?: string;
  replyDate?: string;
};
export type ProductReviewsData = { reviews: ProductReview[]; count: number; average: number; distribution: number[] };
export type ProductQuestion = { id: string; productId: string; authorName: string; question: string; answer?: string; answeredAt?: string; createdAt: string };

// ---------------------------------------------------------------- helpers

export function formatXaf(amount: number): string {
  return `${Math.round(amount).toLocaleString('es-ES')} XAF`;
}

export function discountPercent(price: number, compareAtPrice?: number): number | undefined {
  if (!compareAtPrice || compareAtPrice <= price) return undefined;
  return Math.round((1 - price / compareAtPrice) * 100);
}

export function isVariantPurchasable(v: Pick<ProductVariant, 'isActive' | 'trackInventory' | 'allowBackorder' | 'stock'>): boolean {
  return v.isActive && (!v.trackInventory || v.allowBackorder || v.stock > 0);
}

// Same rule as the web: undefined when the seller doesn't deliver to the city.
export function deliveryFeeFor(settings: ShopSellerSettings, city: string | undefined, subtotal: number): number | undefined {
  if (!settings.deliveryEnabled || !city) return undefined;
  if (settings.deliveryCities.length > 0 && !settings.deliveryCities.includes(city)) return undefined;
  if (settings.freeDeliveryOver !== undefined && subtotal >= settings.freeDeliveryOver) return 0;
  return settings.deliveryFeeByCity.find((c) => c.city === city)?.fee ?? settings.deliveryFee;
}

// Uploaded files come back as site-relative /uploads/... paths.
export function absoluteUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith('/') ? `${WEB_APP_URL}${url}` : url;
}

export const productUrl = (slug: string) => `${WEB_APP_URL}/tienda/p/${slug}`;

// ---------------------------------------------------------------- server calls

export const getStorefrontHome = () => rpc<StorefrontHome>('getStorefrontHome');
export const getActiveCategories = () => rpc<ProductCategory[]>('getActiveCategories');
export const searchProducts = (query: ProductQuery) => rpc<ProductSearchResult>('searchProducts', query);
export const getProductBySlug = (slug: string) =>
  rpc<{ product: Product; isPreview: boolean } | null>('getProductBySlug', slug);
export const getRelatedProducts = (productId: string, categoryId: string | null, companyId: string) =>
  rpc<{ related: ProductListItem[]; fromSeller: ProductListItem[] }>('getRelatedProducts', productId, categoryId, companyId);
export const recordProductView = (productId: string) => rpc('recordProductView', productId).catch(() => {});
export const getProductReviews = (productId: string) => rpc<ProductReviewsData>('getProductReviews', productId);
export const getReviewEligibility = (productId: string) =>
  rpc<{ canReview: boolean; reason?: 'signin' | 'not_purchased'; existing?: { rating: number; comment: string } }>('getReviewEligibility', productId);
export const submitProductReview = (productId: string, input: { rating: number; comment: string }) =>
  rpcAction('submitProductReview', productId, input);
export const getProductQuestions = (productId: string) => rpc<ProductQuestion[]>('getProductQuestions', productId);
export const askProductQuestion = (productId: string, question: string) => rpcAction('askProductQuestion', productId, question);
export const getWishlistIds = () => rpc<string[]>('getWishlistIds');
export const setWishlist = (productId: string, on: boolean) => rpcAction('setWishlist', productId, on);
export const getWishlistProducts = () => rpc<ProductListItem[]>('getWishlistProducts');
export const checkCoupon = (companyId: string, code: string, subtotal: number) =>
  rpc<{ success: true; code: string; discount: number; label: string } | { success: false; message: string }>('checkCoupon', companyId, code, subtotal);
export const getCartDetails = (lines: CartLine[]) => rpc<CartDetails>('getCartDetails', lines);
export const placeOrder = (input: CheckoutInput) =>
  rpcAction<{ success: true; checkoutId: string; orderNumbers: string[] }>('placeOrder', input);
export const getCheckoutOrders = (checkoutId: string) => rpc<ShopOrder[]>('getCheckoutOrders', checkoutId);
export const getMyOrders = () => rpc<ShopOrder[]>('getMyOrders');
export const cancelMyOrder = (orderId: string, reason?: string) => rpcAction('cancelMyOrder', orderId, undefined, reason);
