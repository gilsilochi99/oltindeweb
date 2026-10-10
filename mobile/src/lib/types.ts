// Mirrors src/lib/types.ts in the web app — same Firestore collections, same
// document shapes. Kept in sync by hand until these two apps share a types
// package.

export type AppUser = {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  createdAt?: string;
  title?: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
  };
  favorites: {
    companies: string[];
    procedures: string[];
    institutions: string[];
    jobs: string[];
    events: string[];
    places: string[];
    itineraries: string[];
    professionals: string[];
  };
  subscriptions: {
    companies: string[];
    categories: string[];
  };
  role?: 'admin' | 'manager' | 'editor' | 'pharmacist' | 'user';
  isPremium?: boolean;
  isActive?: boolean;
  fcmTokens?: string[];
  notificationSettings?: {
    email: {
      newOffers: boolean;
      newAnnouncements: boolean;
      newJobs: boolean;
      newEvents: boolean;
    };
    push: {
      newOffers: boolean;
      newAnnouncements: boolean;
      newJobs: boolean;
      newEvents: boolean;
    };
  };
};

export type FavoriteType =
  | 'company'
  | 'procedure'
  | 'institution'
  | 'job'
  | 'event'
  | 'place'
  | 'itinerary'
  | 'professional';

export type Favorites = AppUser['favorites'];
export type Subscriptions = AppUser['subscriptions'];

export type Notification = {
  id: string;
  userId: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
};

export type PostComment = {
  id: string;
  authorName: string;
  userId: string;
  comment: string;
  createdAt: string;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  content: string;
  featuredImage: string;
  imageDescription?: string;
  authorId: string;
  author?: AppUser;
  authorName: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'pending' | 'published';
  excerpt: string;
  comments?: PostComment[];
};

export type Review = {
  id: string;
  author: string;
  authorId?: string;
  rating: number;
  comment: string;
  date: string;
  source?: 'google';
  reply?: {
    comment: string;
    date: string;
  };
};

export type ProfessionalService = {
  id: string;
  name: string;
  description?: string;
  price?: string;
};

export type ProfessionalAvailability = 'Disponible' | 'Ocupado' | 'A demanda';

export type Professional = {
  id: string;
  ownerId: string;
  displayName: string;
  title: string;
  photo?: string;
  bio: string;
  category: string;
  skills: string[];
  services: ProfessionalService[];
  portfolio?: string[];
  city: string;
  availability?: ProfessionalAvailability;
  contact: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    linkedin?: string;
  };
  reviews: Review[];
  isVerified: boolean;
  createdAt: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  category: string;
};

export type CompanyHighlight = {
  icon: string;
  text: string;
};

export type Document = {
  id: string;
  name: string;
  url: string;
  createdAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  image?: string;
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  createdAt: string;
  image?: string;
};

export type Branch = {
  id: string;
  name: string;
  location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
  };
  contact: {
    phone: string;
    email: string;
  };
  workingHours: {
    day: string;
    hours: string;
  }[];
  servicesOffered?: string[];
};

export type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
};

export type CompanySize = 'Microempresa' | 'Pequeña empresa' | 'Mediana empresa' | 'Gran empresa';
export type CapitalOwnership = 'Privada' | 'Pública' | 'Mixta' | 'Cooperativa';
export type LegalForm =
  | 'Sociedad Anónima (S.A.)'
  | 'Sociedad de Responsabilidad Limitada (S.R.L.)'
  | 'Sociedad Colectiva'
  | 'Empresa Individual';
export type GeographicScope = 'Local' | 'Nacional' | 'Multinacional';
export type CompanyPurpose = 'Con ánimo de lucro' | 'Sin ánimo de lucro';
export type FiscalRegime = 'Ordinaria' | 'Especial';

export type Company = {
  id: string;
  ownerId?: string | null;
  name: string;
  legalForm: LegalForm;
  cif: string;
  logo: string;
  category: string;
  description: string;
  products: Product[];
  highlights?: CompanyHighlight[];
  contact: {
    email: string;
    website?: string;
    socialMedia?: {
      linkedin?: string;
      facebook?: string;
      twitter?: string;
      instagram?: string;
      tiktok?: string;
      whatsapp?: string;
    };
  };
  branches: Branch[];
  image: string;
  reviews: Review[];
  announcements: Announcement[];
  offers: Offer[];
  documents: Document[];
  yearEstablished: number;
  isVerified: boolean;
  isFeatured?: boolean;
  createdAt: string;
  companySize?: CompanySize;
  capitalOwnership?: CapitalOwnership;
  geographicScope?: GeographicScope;
  purpose?: CompanyPurpose;
  fiscalRegime?: FiscalRegime;
  gallery?: string[];
  isActive?: boolean;
  isPremium?: boolean;
  // Which Premium features the admin allows for this company's category
  // (filled in by the server; see the web's src/lib/premium-features.ts).
  premiumFeatures?: Partial<Record<PremiumFeature, boolean>>;
};

export type PremiumFeature = 'shop' | 'rentals' | 'offers' | 'announcements' | 'documents' | 'jobs' | 'events' | 'menu';

// Mirrors the web's companyHasFeature: Premium, and the category allowed.
export function companyHasFeature(company: Pick<Company, 'isPremium' | 'premiumFeatures'>, feature: PremiumFeature): boolean {
  return !!company.isPremium && company.premiumFeatures?.[feature] !== false;
}

export type Procedure = {
  id: string;
  name: string;
  category: string;
  description: string;
  institution: string;
  institutionId: string;
  requirements: string[];
  steps: {
    step: number;
    description: string;
    location: string;
  }[];
  cost: string;
  reviews: Review[];
  documents?: Document[];
};

export type EmploymentType = 'Tiempo completo' | 'Medio tiempo' | 'Contrato' | 'Prácticas' | 'Freelance';

export type AcademicLevel =
  | 'Sin estudios formales'
  | 'Educación primaria'
  | 'Educación secundaria'
  | 'Formación Profesional'
  | 'Grado o Licenciatura'
  | 'Máster o Postgrado'
  | 'Doctorado';

export type JobPosting = {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  ownerId: string;
  title: string;
  description: string;
  sector: string;
  city: string;
  employmentType: EmploymentType;
  salaryRange?: string;
  requirements: string[];
  responsibilities?: string[];
  academicLevel?: AcademicLevel;
  experience?: string[];
  skills?: string[];
  applicationMethod: 'email' | 'link';
  applicationValue: string;
  applicationInstructions?: string;
  status: 'open' | 'closed';
  /** Closed because its deadline has passed. */
  expired?: boolean;
  deadline?: string;
  createdAt: string;
  applicationClickCount?: number;
};

export type EventOrganizerType = 'company' | 'institution';
export type EventRegistrationMethod = 'email' | 'link' | 'none';
export type EventStatus = 'scheduled' | 'cancelled';

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  address?: string;
  startDate: string;
  endDate?: string;
  organizerType: EventOrganizerType;
  organizerId: string;
  organizerName: string;
  organizerLogo: string;
  ownerId?: string | null;
  registrationMethod: EventRegistrationMethod;
  registrationValue?: string;
  status: EventStatus;
  createdAt: string;
};

export type Claim = {
  id: string;
  companyId: string;
  companyName: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

export type TouristLocationPriceRange = 'free' | '$' | '$$' | '$$$';

export type TouristLocation = {
  id: string;
  name: string;
  description: string;
  category: string;
  location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
  };
  image: string;
  gallery?: string[];
  priceRange?: TouristLocationPriceRange;
  openingHours?: {
    day: string;
    hours: string;
  }[];
  linkedCompanyId?: string | null;
  reviews: Review[];
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  isFeatured?: boolean;
  createdAt: string;
};

export type HealthFacilityType = 'hospital' | 'clinic' | 'pharmacy';
export type HealthFacilityOwnership = 'public' | 'private';

export type HealthFacility = {
  id: string;
  type: HealthFacilityType;
  name: string;
  ownership: HealthFacilityOwnership;
  description: string;
  services: string[];
  specialties?: string[];
  emergencyServices?: boolean;
  contact?: { whatsapp?: string };
  branches: Branch[];
  onDutyDates?: string[];
  image?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  createdAt: string;
};

export type ItineraryStopLocationType = 'place' | 'company';

export type ItineraryStop = {
  id: string;
  locationId: string;
  locationType?: ItineraryStopLocationType;
  order: number;
  day: number;
  suggestedTime?: string;
  notes?: string;
};

export type ItineraryVisibility = 'public' | 'unlisted';

export type Itinerary = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  authorId: string;
  authorName: string;
  city: string;
  durationDays: number;
  theme?: string[];
  visibility: ItineraryVisibility;
  stops: ItineraryStop[];
  reviews: Review[];
  isFeatured?: boolean;
  createdAt: string;
};

export type InstitutionProcedure = {
  id: string;
  name: string;
};

export type Institution = {
  id: string;
  name: string;
  logo: string;
  category: string;
  description: string;
  responsiblePerson?: {
    name: string;
    title: string;
  };
  contact: {
    email: string;
    website: string;
    whatsapp?: string;
  };
  branches: Branch[];
  procedures: InstitutionProcedure[];
  image: string;
  reviews: Review[];
};

export type SiteSettings = {
  siteName: string;
  siteSlogan: string;
  logoUrl: string;
  cities: string[];
  isBusinessAdvisorEnabled?: boolean;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    whatsapp?: string;
    tiktok?: string;
  };
  foodDeliveryFees?: {
    muniDineroCommissionPercent: number;
    situkaCommissionPercent: number;
  };
};

export type MenuItemOption = {
  id: string;
  name: string;
  priceDelta: number;
};

export type MenuItemOptionGroup = {
  id: string;
  name: string;
  required: boolean;
  options: MenuItemOption[];
};

export type MenuItem = {
  id: string;
  companyId: string;
  companyName: string;
  ownerId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  foodType: string;
  isMenuDelDia?: boolean;
  available: boolean;
  optionGroups?: MenuItemOptionGroup[];
  createdAt: string;
};

export type FoodOrderDeliveryMethod = 'pickup' | 'situka';
export type FoodOrderPaymentMethod = 'none' | 'muni_dinero';
export type FoodOrderPaymentStatus = 'not_applicable' | 'pending' | 'paid';
export type FoodOrderStatus = 'placed' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type FoodOrderItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: { groupName: string; optionName: string; priceDelta: number }[];
};

export type FoodOrder = {
  id: string;
  companyId: string;
  companyName: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  items: FoodOrderItem[];
  subtotal: number;
  deliveryMethod: FoodOrderDeliveryMethod;
  deliveryAddress?: string;
  paymentMethod: FoodOrderPaymentMethod;
  paymentStatus: FoodOrderPaymentStatus;
  commissionPercent: number;
  commissionAmount: number;
  status: FoodOrderStatus;
  notes?: string;
  createdAt: string;
};
