// Business side of the Tienda and Alquileres in the app: orders, bookings and
// publishing. Creating or editing products and listings (many fields and
// photos) opens the website's panel instead.
import { rpc, rpcAction } from './api';
import { WEB_APP_URL } from './config';
import type { Product, ShopOrder, ShopOrderStatus, ShopSellerSettings } from './shop';
import type { RentalBooking, RentalBookingStatus, RentalListing } from './rentals';

export type SellerOrder = ShopOrder & { customerEmail?: string; commissionPercent: number; commissionAmount: number };

// What the seller may move an order to from each status (same as the web).
export const ORDER_TRANSITIONS: Record<ShopOrderStatus, ShopOrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export const ORDER_ACTION_LABELS: Record<ShopOrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmar',
  processing: 'En preparación',
  shipped: 'Enviado / Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelar',
};

export const getSellerOrders = (companyId: string, status?: ShopOrderStatus | 'open', page = 1) =>
  rpc<{ orders: SellerOrder[]; total: number; counts: Record<string, number> }>('getSellerOrders', companyId, status, page);
export const updateOrderStatus = (orderId: string, status: ShopOrderStatus, note?: string) =>
  rpcAction('updateOrderStatus', orderId, status, note);
export const setOrderPaymentStatus = (orderId: string, paymentStatus: 'pending' | 'paid' | 'refunded') =>
  rpcAction('setOrderPaymentStatus', orderId, paymentStatus);
export const getSellerProducts = (companyId: string) => rpc<Product[]>('getSellerProducts', companyId);
export const setProductStatus = (productId: string, status: 'draft' | 'active' | 'archived') =>
  rpcAction('setProductStatus', productId, status);

export const getAdvertiserListings = (companyId: string) => rpc<RentalListing[]>('getAdvertiserListings', companyId);
export const setRentalStatus = (listingId: string, status: 'draft' | 'active' | 'archived') =>
  rpcAction('setRentalStatus', listingId, status);
export const getAdvertiserBookings = (companyId: string, status?: RentalBookingStatus) =>
  rpc<{ bookings: (RentalBooking & { customerEmail?: string })[]; counts: Record<string, number> }>('getAdvertiserBookings', companyId, status);
export const respondToBooking = (bookingId: string, to: 'accepted' | 'rejected' | 'cancelled' | 'completed', note?: string) =>
  rpcAction('respondToBooking', bookingId, to, note);

export const webPanelUrl = (companyId: string, section: 'shop' | 'shop/new' | 'rentals' | 'rentals/new' | `shop/${string}` | `rentals/${string}`) =>
  `${WEB_APP_URL}/dashboard/companies/${companyId}/${section}`;

// ---------------------------------------------------------------- create / edit

export type ProductVariantInput = {
  id?: string;
  optionValues: string[];
  sku?: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  stockLoaded?: number; // the server applies only stock - stockLoaded
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
  condition: 'new' | 'used' | 'refurbished';
  status: 'draft' | 'active' | 'archived';
  options: { name: string; values: string[] }[];
  specs: { name: string; value: string }[];
  tags: string[];
  images: { url: string; alt?: string }[];
  variants: ProductVariantInput[];
};

export const getProductForEdit = (productId: string) => rpc<Product | null>('getProductForEdit', productId);
export const createProduct = (companyId: string, input: ProductInput) =>
  rpcAction<{ success: true; id: string }>('createProduct', companyId, input);
export const updateProduct = (productId: string, input: ProductInput) => rpcAction('updateProduct', productId, input);

export type RentalListingInput = Omit<RentalListing,
  'id' | 'companyId' | 'companyName' | 'slug' | 'images' | 'isFeatured' | 'ratingAvg' | 'ratingCount'
> & { images: string[] };

export const getListingForEdit = (listingId: string) => rpc<RentalListing | null>('getListingForEdit', listingId);
export const createRentalListing = (companyId: string, input: RentalListingInput) =>
  rpcAction<{ success: true; id: string }>('createRentalListing', companyId, input);
export const updateRentalListing = (listingId: string, input: RentalListingInput) => rpcAction('updateRentalListing', listingId, input);

// ---------------------------------------------------------------- statistics

export type RentalStats = {
  days: number;
  views: number;
  requests: number;
  accepted: number;
  rejected: number;
  cancelled: number;
  pending: number;
  acceptanceRate: number;
  unitsBooked: number;
  monthsBooked: number;
  revenue: number;
  commission: number;
  daily: { date: string; requests: number; accepted: number }[];
  topListings: { listingId?: string; title: string; slug?: string; requests: number; accepted: number; revenue: number; views: number }[];
  upcoming: { id: string; bookingNumber: string; listingTitle: string; customerName: string; startDate: string; endDate: string }[];
};

export type SellerStats = {
  days: number;
  revenue: number;
  netRevenue: number;
  orders: number;
  delivered: number;
  cancelled: number;
  open: number;
  averageOrder: number;
  unitsSold: number;
  views: number;
  daily: { date: string; revenue: number; orders: number }[];
  topProducts: { productId?: string; title: string; units: number; revenue: number }[];
  lowStock: { productId: string; title: string; stock: number }[];
  unansweredQuestions: number;
};

export const getRentalStats = (companyId: string, days: number) => rpc<RentalStats | null>('getRentalStats', companyId, days);
export const getSellerStats = (companyId: string, days: number) => rpc<SellerStats | null>('getSellerStats', companyId, days);

// ---------------------------------------------------------------- coupons, questions, settings

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

export const getSellerCoupons = (companyId: string) => rpc<Coupon[]>('getSellerCoupons', companyId);
export const saveCoupon = (companyId: string, input: CouponInput, couponId?: string) =>
  rpcAction<{ success: boolean; message?: string; id?: string }>('saveCoupon', companyId, input, couponId);
export const deleteCoupon = (couponId: string) => rpcAction('deleteCoupon', couponId);

export type SellerQuestion = {
  id: string;
  productId: string;
  authorName: string;
  question: string;
  answer?: string;
  answeredAt?: string;
  createdAt: string;
  productTitle: string;
  productSlug: string;
};
export const getSellerQuestions = (companyId: string, unansweredOnly = true) =>
  rpc<SellerQuestion[]>('getSellerQuestions', companyId, unansweredOnly);
export const answerProductQuestion = (questionId: string, answer: string) => rpcAction('answerProductQuestion', questionId, answer);

export const getSellerSettings = (companyId: string) => rpc<ShopSellerSettings | null>('getSellerSettings', companyId);
export const saveSellerSettings = (companyId: string, settings: ShopSellerSettings) => rpcAction('saveSellerSettings', companyId, settings);

// ---------------------------------------------------------------- documents

export const addDocument = (companyId: string, doc: { name: string; url: string; size: number }) => rpcAction('addDocument', companyId, doc);
export const deleteDocument = (companyId: string, documentId: string) => rpcAction('deleteDocument', companyId, documentId);
