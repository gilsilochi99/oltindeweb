// App-facing shapes for the marketplace ("Tienda"). Plain JSON-serializable
// data (ISO date strings, numbers instead of Decimal), like src/lib/types.ts.

export type ProductStatus = 'draft' | 'active' | 'archived';
export type ProductCondition = 'new' | 'used' | 'refurbished';

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Borrador',
  active: 'Publicado',
  archived: 'Archivado',
};

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

// e.g. { name: 'Talla', values: ['S', 'M', 'L'] }
export type ProductOption = {
  name: string;
  values: string[];
};

export type ProductSpec = {
  name: string;
  value: string;
};

export type ProductImage = {
  id: string;
  url: string;
  alt?: string;
};

export type ProductVariant = {
  id: string;
  title: string;
  optionValues: string[]; // aligned with Product.options; [] for the default variant
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
  status: ProductStatus;
  options: ProductOption[];
  specs: ProductSpec[];
  tags: string[];
  images: ProductImage[];
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
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------- inputs

export type ProductCategoryInput = {
  parentId?: string | null;
  name: string;
  description?: string;
  image?: string;
  position?: number;
  isActive?: boolean;
};

export type ProductVariantInput = {
  id?: string; // present for existing variants
  optionValues: string[];
  sku?: string;
  price: number;
  compareAtPrice?: number | null;
  // Stock is sent as the value the form loaded plus the value the seller
  // typed, so the server applies only the difference — an order placed while
  // the form was open isn't overwritten by a stale number.
  stock: number;
  stockLoaded?: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  image?: string;
  isActive?: boolean;
};

export type ProductInput = {
  categoryId?: string | null;
  title: string;
  shortDescription?: string;
  description: string;
  brand?: string;
  condition: ProductCondition;
  status: ProductStatus;
  options: ProductOption[];
  specs: ProductSpec[];
  tags: string[];
  images: { url: string; alt?: string }[];
  variants: ProductVariantInput[];
};

export type ActionResult<T = object> =
  | ({ success: true } & T)
  | { success: false; message: string };

// "Rojo / M" — or "Estándar" for a product without options.
export function variantTitle(optionValues: string[]): string {
  return optionValues.length > 0 ? optionValues.join(' / ') : 'Estándar';
}

export function isVariantPurchasable(v: Pick<ProductVariant, 'isActive' | 'trackInventory' | 'allowBackorder' | 'stock'>): boolean {
  return v.isActive && (!v.trackInventory || v.allowBackorder || v.stock > 0);
}

export function formatXaf(amount: number): string {
  return `${amount.toLocaleString('es-ES')} XAF`;
}

// ---------------------------------------------------------------- storefront

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
  brands?: string[];
  conditions?: ProductCondition[];
  city?: string;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sort?: ProductSort;
  page?: number;
};

// Lightweight card shape for listings — no description/variants payload.
export type ProductListItem = {
  id: string;
  slug: string;
  title: string;
  image?: string;
  brand?: string;
  condition: ProductCondition;
  minPrice: number;
  maxPrice: number;
  compareAtPrice?: number; // of the cheapest variant, when on sale
  isOnSale: boolean;
  inStock: boolean;
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
  companyId: string;
  companyName: string;
};

export type ProductSearchResult = {
  items: ProductListItem[];
  total: number;
  page: number;
  pageCount: number;
  facets: {
    brands: { name: string; count: number }[];
    categories: { id: string; count: number }[]; // direct counts; parents roll up client-side
    price: { min: number; max: number };
  };
};

export function discountPercent(price: number, compareAtPrice?: number): number | undefined {
  if (!compareAtPrice || compareAtPrice <= price) return undefined;
  return Math.round((1 - price / compareAtPrice) * 100);
}

// ---------------------------------------------------------------- cart & orders

export type CartLine = { variantId: string; quantity: number };

export const MAX_CART_QUANTITY = 99;

// A cart line resolved against live data. `issue` explains why it can't be
// bought as-is (the cart UI shows it and checkout refuses it).
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
  maxQuantity: number; // what can be bought right now (stock, or MAX_CART_QUANTITY)
  lineTotal: number;
  issue?: 'unavailable' | 'out_of_stock' | 'insufficient_stock';
};

export type ShopDeliveryMethod = 'pickup' | 'delivery';
export type ShopPaymentMethod = 'cash' | 'muni_dinero';
export type ShopPaymentStatus = 'pending' | 'paid' | 'refunded';
export type ShopOrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type ShopSellerSettings = {
  pickupEnabled: boolean;
  pickupAddress?: string;
  deliveryEnabled: boolean;
  deliveryFee: number;
  deliveryFeeByCity: { city: string; fee: number }[];
  deliveryCities: string[]; // [] = every city
  freeDeliveryOver?: number;
  minOrderAmount?: number;
  acceptsCash: boolean;
  acceptsMuniDinero: boolean;
  orderNotes?: string;
};

export const DEFAULT_SELLER_SETTINGS: ShopSellerSettings = {
  pickupEnabled: true,
  deliveryEnabled: false,
  deliveryFee: 0,
  deliveryFeeByCity: [],
  deliveryCities: [],
  acceptsCash: true,
  acceptsMuniDinero: false,
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
  missingVariantIds: string[]; // deleted/unpublished — the client drops them
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

export const PAYMENT_STATUS_LABELS: Record<ShopPaymentStatus, string> = {
  pending: 'Pendiente de pago',
  paid: 'Pagado',
  refunded: 'Reembolsado',
};

export const DELIVERY_METHOD_LABELS: Record<ShopDeliveryMethod, string> = {
  pickup: 'Recogida en tienda',
  delivery: 'Envío a domicilio',
};

// What the seller may move an order to from each status. Delivered and
// cancelled are final.
export const ORDER_TRANSITIONS: Record<ShopOrderStatus, ShopOrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

// Customers may cancel until the seller starts preparing the order.
export const CUSTOMER_CANCELLABLE: ShopOrderStatus[] = ['pending', 'confirmed'];

export type ShopOrderItem = {
  id: string;
  productId?: string;
  productSlug?: string;
  productTitle: string;
  variantTitle: string;
  sku?: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type ShopOrderEvent = {
  id: string;
  status: ShopOrderStatus;
  note?: string;
  createdAt: string;
};

export type ShopOrder = {
  id: string;
  orderNumber: string;
  checkoutId: string;
  companyId: string;
  companyName: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod: ShopDeliveryMethod;
  deliveryCity?: string;
  deliveryAddress?: string;
  paymentMethod: ShopPaymentMethod;
  paymentStatus: ShopPaymentStatus;
  status: ShopOrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  commissionPercent: number;
  commissionAmount: number;
  notes?: string;
  cancelReason?: string;
  couponCode?: string;
  items: ShopOrderItem[];
  events: ShopOrderEvent[];
  createdAt: string;
  updatedAt: string;
};

export type CheckoutSellerChoice = {
  companyId: string;
  deliveryMethod: ShopDeliveryMethod;
  paymentMethod: ShopPaymentMethod;
  couponCode?: string;
};

export type CheckoutInput = {
  lines: CartLine[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  notes?: string;
  sellers: CheckoutSellerChoice[];
};

// Fee for one seller's part of an order, or undefined if that seller
// doesn't deliver to the city.
export function deliveryFeeFor(settings: ShopSellerSettings, city: string | undefined, subtotal: number): number | undefined {
  if (!settings.deliveryEnabled || !city) return undefined;
  if (settings.deliveryCities.length > 0 && !settings.deliveryCities.includes(city)) return undefined;
  if (settings.freeDeliveryOver !== undefined && subtotal >= settings.freeDeliveryOver) return 0;
  return settings.deliveryFeeByCity.find(c => c.city === city)?.fee ?? settings.deliveryFee;
}

// ---------------------------------------------------------------- engagement

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

export type ProductReviewsData = {
  reviews: ProductReview[];
  count: number;
  average: number;
  distribution: number[]; // index 0 = 1 star ... index 4 = 5 stars
};

export type ProductQuestion = {
  id: string;
  productId: string;
  authorName: string;
  question: string;
  answer?: string;
  answeredAt?: string;
  createdAt: string;
};

export type CouponType = 'percent' | 'fixed';

export type Coupon = {
  id: string;
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minSubtotal?: number;
  maxUses?: number;
  usedCount: number;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  createdAt: string;
};

export type CouponInput = Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>;

// Why a coupon can't be used right now, or undefined if it can.
export function couponProblem(c: Pick<Coupon, 'isActive' | 'startsAt' | 'endsAt' | 'maxUses' | 'usedCount' | 'minSubtotal'>, subtotal: number, now = new Date()): string | undefined {
  if (!c.isActive) return 'Este cupón no está activo.';
  if (c.startsAt && new Date(c.startsAt) > now) return 'Este cupón todavía no es válido.';
  if (c.endsAt && new Date(c.endsAt) < now) return 'Este cupón ha caducado.';
  if (c.maxUses !== undefined && c.usedCount >= c.maxUses) return 'Este cupón ya se ha agotado.';
  if (c.minSubtotal !== undefined && subtotal < c.minSubtotal) return `Este cupón requiere una compra mínima de ${formatXaf(c.minSubtotal)}.`;
  return undefined;
}

export function couponDiscount(c: Pick<Coupon, 'type' | 'value'>, subtotal: number): number {
  const raw = c.type === 'percent' ? Math.round(subtotal * c.value / 100) : c.value;
  return Math.max(0, Math.min(subtotal, raw));
}

export type SellerStats = {
  days: number;
  revenue: number; // delivered orders, total incl. delivery
  netRevenue: number; // revenue minus platform commission
  orders: number; // placed in the period (any status)
  delivered: number;
  cancelled: number;
  open: number; // currently awaiting action (any date)
  averageOrder: number;
  unitsSold: number;
  views: number; // all-time product views
  daily: { date: string; revenue: number; orders: number }[];
  topProducts: { productId?: string; title: string; units: number; revenue: number }[];
  lowStock: { productId: string; title: string; stock: number }[];
  unansweredQuestions: number;
};
