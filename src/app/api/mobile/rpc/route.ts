// Single endpoint through which the mobile app reads and writes data. The app
// can't reach MySQL, and can't call Server Actions (an internal Next.js
// protocol), so it POSTs { fn, args } here and gets { result } back.
//
// Each allowed name maps to the SAME function the web app uses (data.ts /
// actions.ts / account-actions.ts), so validation, permission checks and
// notifications are shared by both apps. Identity comes from the
// `Authorization: Bearer <Firebase ID token>` header, verified inside
// getCurrentCaller() — never from the request body.
//
// Only names listed below can be called. Web read functions without a
// caller check of their own that return non-public data are wrapped with one.
import { NextResponse } from 'next/server';
import * as data from '@/lib/data';
import * as actions from '@/lib/actions';
import * as account from '@/lib/account-actions';
import * as storefront from '@/lib/shop/storefront';
import * as shopActions from '@/lib/shop/actions';
import * as shopData from '@/lib/shop/data';
import * as engagement from '@/lib/shop/engagement';
import * as orders from '@/lib/shop/orders';
import * as rentalsPublic from '@/lib/rentals/public';
import * as rentalActions from '@/lib/rentals/actions';
import * as bookings from '@/lib/rentals/bookings';
import * as rentalEngagement from '@/lib/rentals/engagement';
import { prisma, toJobPosting } from '@/lib/db';
import { getCurrentCaller, isAdminRole, isManagerRole } from '@/lib/firebase-admin';

type Handler = (...args: any[]) => Promise<unknown>;

async function requireRole(check: (role: any) => boolean) {
  const caller = await getCurrentCaller();
  if (!caller || !check(caller.role)) throw new RpcError('No tiene permiso para realizar esta acción.', 403);
}

class RpcError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

const HANDLERS: Record<string, Handler> = {
  // ---- public reads
  getActiveCompanies: data.getActiveCompanies,
  getCompanyById: data.getCompanyById,
  getCompaniesByOwner: data.getCompaniesByOwner,
  getActiveProfessionals: data.getActiveProfessionals,
  getProfessionalById: data.getProfessionalById,
  getProfessionalByOwnerId: data.getProfessionalByOwnerId,
  getProcedures: data.getProcedures,
  getProcedureById: data.getProcedureById,
  getInstitutions: data.getInstitutions,
  getInstitutionById: data.getInstitutionById,
  getHealthFacilities: data.getHealthFacilities,
  getHealthFacilitiesByType: data.getHealthFacilitiesByType,
  getHealthFacilityById: data.getHealthFacilityById,
  getPharmaciesOnDuty: data.getPharmaciesOnDuty,
  getTouristLocations: data.getTouristLocations,
  getTouristLocationById: data.getTouristLocationById,
  getActiveJobPostings: data.getActiveJobPostings,
  getJobById: data.getJobById,
  getEvents: data.getEvents,
  getEventById: data.getEventById,
  getItineraries: data.getItineraries,
  getItineraryById: data.getItineraryById,
  getActivePublishedPosts: data.getActivePublishedPosts,
  getPostById: data.getPostById,
  getOfferById: data.getOfferById,
  getAnnouncementById: data.getAnnouncementById,
  getMenuItemsByCompany: data.getMenuItemsByCompany,
  getActiveMenuItems: data.getActiveMenuItems,
  getServices: data.getServices,
  getSiteSettings: data.getSiteSettings,
  getUniqueCities: data.getUniqueCities,
  getSearchIndexData: data.getSearchIndexData,
  getJobPostingsByCompany: async (companyId: string) =>
    (await prisma.jobPosting.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } })).map(toJobPosting),

  // ---- reads that check the caller themselves
  getFoodOrdersByCompany: data.getFoodOrdersByCompany,
  getFoodOrderById: data.getFoodOrderById,
  getFoodOrdersByCustomer: data.getFoodOrdersByCustomer,
  getClaims: data.getClaims,

  // ---- staff-only reads (the web versions rely on their pages being admin-only)
  getAllUsers: async () => {
    await requireRole(isAdminRole);
    return data.getUsers();
  },
  getPendingTouristLocations: async () => {
    await requireRole(isManagerRole);
    return data.getPendingTouristLocations();
  },

  // ---- writes (every one checks the caller)
  addReview: actions.addReview,
  addPostComment: actions.addPostComment,
  createClaim: actions.createClaim,
  processClaim: actions.processClaim,
  submitTouristLocation: actions.submitTouristLocation,
  reviewTouristLocation: actions.reviewTouristLocation,
  createFoodOrder: actions.createFoodOrder,
  cancelFoodOrder: actions.cancelFoodOrder,
  updateFoodOrderStatus: actions.updateFoodOrderStatus,
  createCompany: actions.createCompany,
  updateCompany: actions.updateCompany,
  setCompanyActive: actions.setCompanyActive,
  addOffer: actions.addOffer,
  deleteOffer: actions.deleteOffer,
  addAnnouncement: actions.addAnnouncement,
  deleteAnnouncement: actions.deleteAnnouncement,
  createMenuItem: actions.createMenuItem,
  updateMenuItem: actions.updateMenuItem,
  deleteMenuItem: actions.deleteMenuItem,
  createJobPosting: actions.createJobPosting,
  updateJobPosting: actions.updateJobPosting,
  deleteJobPosting: actions.deleteJobPosting,
  toggleJobStatus: actions.toggleJobStatus,
  createEvent: actions.createEvent,
  deleteEvent: actions.deleteEvent,
  toggleEventStatus: actions.toggleEventStatus,
  createProcedure: actions.createProcedure,
  updateProcedure: actions.updateProcedure,
  deleteProcedure: actions.deleteProcedure,
  createInstitution: actions.createInstitution,
  updateInstitution: actions.updateInstitution,
  deleteInstitution: actions.deleteInstitution,
  createHealthFacility: actions.createHealthFacility,
  updateHealthFacility: actions.updateHealthFacility,
  deleteHealthFacility: actions.deleteHealthFacility,
  createService: actions.createService,
  updateService: actions.updateService,
  deleteService: actions.deleteService,
  updateUserRole: actions.updateUserRole,
  toggleUserPremiumStatus: actions.toggleUserPremiumStatus,

  // ---- Tienda (marketplace): storefront and customer side
  getStorefrontHome: storefront.getStorefrontHome,
  getActiveCategories: storefront.getActiveCategories,
  searchProducts: storefront.searchProducts,
  getProductBySlug: storefront.getProductBySlug,
  getRelatedProducts: storefront.getRelatedProducts,
  recordProductView: shopActions.recordProductView,
  getProductReviews: engagement.getProductReviews,
  getReviewEligibility: engagement.getReviewEligibility,
  submitProductReview: engagement.submitProductReview,
  getProductQuestions: engagement.getProductQuestions,
  askProductQuestion: engagement.askProductQuestion,
  getWishlistIds: engagement.getWishlistIds,
  setWishlist: engagement.setWishlist,
  getWishlistProducts: engagement.getWishlistProducts,
  checkCoupon: engagement.checkCoupon,
  getCartDetails: orders.getCartDetails,
  placeOrder: orders.placeOrder,
  getCheckoutOrders: orders.getCheckoutOrders,
  getMyOrders: orders.getMyOrders,
  cancelMyOrder: orders.cancelMyOrder,

  // ---- Alquileres (rentals): public side and the customer's bookings
  getRentalsHome: rentalsPublic.getRentalsHome,
  searchRentals: rentalsPublic.searchRentals,
  getRentalBySlug: rentalsPublic.getRentalBySlug,
  getSimilarRentals: rentalsPublic.getSimilarRentals,
  recordRentalView: rentalActions.recordRentalView,
  getAvailability: bookings.getAvailability,
  requestBooking: bookings.requestBooking,
  getBookingByToken: bookings.getBookingByToken,
  getMyBookings: bookings.getMyBookings,
  cancelMyBooking: bookings.cancelMyBooking,
  getRentalReviews: rentalEngagement.getRentalReviews,
  getRentalReviewEligibility: rentalEngagement.getRentalReviewEligibility,
  submitRentalReview: rentalEngagement.submitRentalReview,
  canReplyToRentalReviews: rentalEngagement.canReplyToRentalReviews,
  replyToRentalReview: rentalEngagement.replyToRentalReview,
  getRentalStats: rentalEngagement.getRentalStats,
  getSellerStats: engagement.getSellerStats,

  // ---- business side (each checks the caller owns the company, or is a manager)
  getSellerProducts: shopData.getSellerProducts,
  getProductForEdit: shopData.getProductForEdit,
  getProductCategories: shopData.getProductCategories,
  createProduct: shopActions.createProduct,
  updateProduct: shopActions.updateProduct,
  setProductStatus: shopActions.setProductStatus,
  getSellerOrders: orders.getSellerOrders,
  getSellerOrder: orders.getSellerOrder,
  updateOrderStatus: orders.updateOrderStatus,
  setOrderPaymentStatus: orders.setOrderPaymentStatus,
  getAdvertiserListings: rentalActions.getAdvertiserListings,
  getListingForEdit: rentalActions.getListingForEdit,
  createRentalListing: rentalActions.createRentalListing,
  updateRentalListing: rentalActions.updateRentalListing,
  setRentalStatus: rentalActions.setRentalStatus,
  getAdvertiserBookings: bookings.getAdvertiserBookings,
  respondToBooking: bookings.respondToBooking,

  // ---- the signed-in user's own account
  ensureMyProfile: account.ensureMyProfile,
  setFavorite: account.setFavorite,
  setSubscription: account.setSubscription,
  getMyNotifications: account.getMyNotifications,
  markMyNotificationRead: account.markMyNotificationRead,
  markAllMyNotificationsRead: account.markAllMyNotificationsRead,
  addMyPushToken: account.addMyPushToken,
  removeMyPushToken: account.removeMyPushToken,
};

export async function POST(request: Request) {
  let fn: unknown;
  let args: unknown;
  try {
    ({ fn, args } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const handler = typeof fn === 'string' && Object.hasOwn(HANDLERS, fn) ? HANDLERS[fn] : undefined;
  if (!handler) {
    return NextResponse.json({ error: `Unknown function "${String(fn)}"` }, { status: 404 });
  }
  if (!Array.isArray(args)) {
    return NextResponse.json({ error: '"args" must be an array' }, { status: 400 });
  }

  try {
    const result = await handler(...args);
    return NextResponse.json({ result: result ?? null });
  } catch (error) {
    if (error instanceof RpcError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(`Error in /api/mobile/rpc (${fn}):`, error);
    // Messages thrown on purpose (e.g. account-actions' "Debe iniciar sesión...")
    // are meant for the user; database/internal errors stay in the server log.
    const internal = !(error instanceof Error) || error.name.startsWith('Prisma') || error.message.includes('\n');
    const message = internal ? 'Error interno del servidor.' : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
