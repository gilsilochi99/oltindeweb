

export type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
};

export type AppUser = {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  createdAt?: string; // ISO string; absent on accounts created before this field existed
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
  isActive?: boolean; // false = deactivated by an admin: blocked from signing in, public content (professional profile, posts) hidden. Undefined/true = active.
  notificationSettings?: {
    email: {
        newOffers: boolean;
        newAnnouncements: boolean;
        newJobs: boolean;
        newEvents: boolean;
    };
  };
}

export type Notification = {
    id: string;
    userId: string;
    message: string;
    link: string;
    isRead: boolean;
    createdAt: string; // ISO String
}

export type NotificationSettings = {
    email: {
        newOffers: boolean;
        newAnnouncements: boolean;
    };
    push: {
        newOffers: boolean;
        newAnnouncements: boolean;
    }
}

export type PostComment = {
  id: string;
  authorName: string;
  userId: string;
  comment: string;
  createdAt: string; // ISO String
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  content: string;
  featuredImage: string;
  imageDescription?: string;
  authorId: string;
  author?: AppUser; // Now includes the full author object
  authorName: string; // Kept for quick display where full object is not needed
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
  authorId?: string; // lets a reply notify the reviewer; absent on legacy/Google-imported reviews
  rating: number;
  comment: string;
  date: string; // ISO String
  source?: 'google'; // set when imported from Google Places — shown with a Google badge
  reply?: {
    comment: string;
    date: string; // ISO String
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
  title: string; // e.g. "Electricista", "Diseñador Gráfico"
  photo?: string;
  bio: string;
  category: string; // shared Service catalog category
  skills: string[];
  services: ProfessionalService[];
  portfolio?: string[]; // work-example images
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
}

export type CompanyHighlight = {
    icon: string;
    text: string;
}

export type Document = {
  id: string;
  name: string;
  url: string;
  createdAt: string; // ISO String
}

export type Announcement = {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO String
  image?: string;
}

export type Offer = {
  id: string;
  title: string;
  description: string;
  discount: string; // e.g., "20%", "€50 de descuento"
  validUntil: string; // ISO String
  createdAt: string; // ISO String
  image?: string;
}

export type Claim = {
    id: string;
    companyId: string;
    companyName: string;
    userId: string;
    userName: string;
    userEmail: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

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
    servicesOffered?: string[]; // Services can now be branch-specific
};

export type LocalBusiness = {
  id: string;
  ownerId?: string | null;
  name: string;
  logo: string;
  category: string;
  description: string;
  contact: {
    email: string;
    website?: string;
  };
  branches: Branch[];
  reviews: Review[];
  isVerified: boolean;
  isFeatured?: boolean;
  createdAt: string;
  gallery?: string[];
  isActive?: boolean;
}

export type CompanySize = 'Microempresa' | 'Pequeña empresa' | 'Mediana empresa' | 'Gran empresa';
export type CapitalOwnership = 'Privada' | 'Pública' | 'Mixta' | 'Cooperativa';
export type LegalForm = 'Sociedad Anónima (S.A.)' | 'Sociedad de Responsabilidad Limitada (S.R.L.)' | 'Sociedad Colectiva' | 'Empresa Individual';
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
  contact: { // Main company contact (non-branch specific)
    email: string;
    website?: string;
    socialMedia?: {
      linkedin?: string;
      facebook?: string;
      twitter?: string;
      instagram?: string;
      tiktok?: string;
      whatsapp?: string;
    }
  };
  branches: Branch[];
  image: string;
  reviews: Review[];
  announcements: Announcement[];
  offers: Offer[];
  claims: Claim[];
  documents: Document[];
  yearEstablished: number;
  isVerified: boolean;
  isFeatured?: boolean;
  createdAt: string;
  // New classification fields
  companySize?: CompanySize;
  capitalOwnership?: CapitalOwnership;
  geographicScope?: GeographicScope;
  purpose?: CompanyPurpose;
  fiscalRegime?: FiscalRegime;
  gallery?: string[];
  googlePlaceId?: string; // set when imported via the admin Google Places tool, used to avoid re-importing the same business
  isActive?: boolean; // false = deactivated by an admin or the owner: hidden from listings/search/map, plus its job postings and menu items. Undefined/true = active.
  isPremium?: boolean; // company-level premium (distinct from AppUser.isPremium, the account-wide "Cuenta Pro"): unlocks Documentos/Ofertas/Anuncios/Empleos/Eventos/Menú for this specific listing and its AI review summary.
};

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
  startDate: string; // ISO datetime
  endDate?: string; // ISO datetime, optional
  organizerType: EventOrganizerType;
  organizerId: string;
  organizerName: string; // denormalized
  organizerLogo: string; // denormalized
  ownerId?: string | null; // company.ownerId at creation time; null for institution-organized events
  registrationMethod: EventRegistrationMethod;
  registrationValue?: string;
  status: EventStatus;
  createdAt: string;
};

export type TouristLocationPriceRange = 'free' | '$' | '$$' | '$$$';

export type TouristLocation = {
  id: string;
  name: string;
  description: string;
  category: string; // beach, monument, museum, nature, nightlife, restaurant...
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
  linkedCompanyId?: string | null; // optional cross-link to an existing Company (e.g. a recommended restaurant)
  reviews: Review[];
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string; // userId
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
  services: string[]; // Service ids from the shared services catalog, filtered by category matching the facility type
  specialties?: string[]; // hospitals/clinics: Cardiología, Ginecología...
  emergencyServices?: boolean; // hospitals/clinics: urgencias 24h
  contact?: { whatsapp?: string };
  branches: Branch[];
  onDutyDates?: string[]; // pharmacies only: ISO dates (YYYY-MM-DD) this pharmacy is "de guardia"
  image?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  createdAt: string;
};

export type ItineraryStopLocationType = 'place' | 'company';

export type ItineraryStop = {
  id: string;
  locationId: string;
  locationType?: ItineraryStopLocationType; // 'place' (TouristLocation) if omitted, for backward compatibility with stops created before companies were supported
  order: number;
  day: number; // 1-based
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
  authorName: string; // denormalized
  city: string;
  durationDays: number;
  theme?: string[]; // family, adventure, budget, romantic...
  visibility: ItineraryVisibility;
  stops: ItineraryStop[];
  reviews: Review[];
  isFeatured?: boolean;
  createdAt: string;
};

export type CompanyService = {
    name: string;
    category: string;
    companies: Company[];
    service: Service;
}

export type CompanyProduct = {
    name: string;
    description: string;
    image: string;
    companies: Company[];
}

export type InstitutionProcedure = {
  id: string;
  name: string;
}

export type Institution = {
  id:string;
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

export type Breadcrumb = {
  href: string;
  label: string;
  isLast: boolean;
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
        muniDineroCommissionPercent: number; // platform commission applied when an order is paid via Muni Dinero
        situkaCommissionPercent: number; // platform commission applied when an order is delivered via Situka
    };
}

export type CategoryUsage = {
    name: string;
    companyCount: number;
    institutionCount: number;
    procedureCount: number;
};

export type MenuItemOption = {
  id: string;
  name: string; // e.g. "Grande", "Picante"
  priceDelta: number; // added to the base price when selected, can be 0
};

export type MenuItemOptionGroup = {
  id: string;
  name: string; // e.g. "Tamaño", "Nivel de Picante"
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
  foodType: string; // cuisine/dish type, e.g. "Pescado", "Pizza", "Postres"
  isMenuDelDia?: boolean;
  available: boolean;
  optionGroups?: MenuItemOptionGroup[]; // single-select groups, e.g. size or spice level
  createdAt: string;
};

export type FoodOrderDeliveryMethod = 'pickup' | 'situka';
export type FoodOrderPaymentMethod = 'none' | 'muni_dinero';
export type FoodOrderPaymentStatus = 'not_applicable' | 'pending' | 'paid';
export type FoodOrderStatus = 'placed' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type FoodOrderItem = {
  menuItemId: string;
  name: string; // snapshot at order time, so later menu edits don't rewrite past orders
  price: number; // snapshot at order time, already includes any selected option price deltas
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
  // Platform commission snapshot: the fee % in effect at order time (from
  // SiteSettings.foodDeliveryFees), and the amount it represents. This is
  // deducted from what the restaurant nets — it does not change what the
  // customer pays. Summed when both a paid delivery method and payment
  // method apply (e.g. Situka + Muni Dinero on the same order).
  commissionPercent: number;
  commissionAmount: number;
  status: FoodOrderStatus;
  notes?: string;
  createdAt: string;
};
