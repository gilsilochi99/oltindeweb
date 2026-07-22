

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
  };
  subscriptions: {
    companies: string[];
    categories: string[];
  };
  role?: 'admin' | 'manager' | 'editor' | 'user';
  isPremium?: boolean;
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
  rating: number;
  comment: string;
  date: string; // ISO String
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

export type ItineraryStop = {
  id: string;
  locationId: string;
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
}

export type CategoryUsage = {
    name: string;
    companyCount: number;
    institutionCount: number;
    procedureCount: number;
};
