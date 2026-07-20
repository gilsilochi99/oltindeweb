import type { Company, JobPosting, CalendarEvent, Post, SiteSettings, EmploymentType } from './types';

const SITE_URL = 'https://oltinde.com';

const EMPLOYMENT_TYPE_MAP: Record<EmploymentType, string> = {
  'Tiempo completo': 'FULL_TIME',
  'Medio tiempo': 'PART_TIME',
  'Contrato': 'CONTRACTOR',
  'Prácticas': 'INTERN',
  'Freelance': 'CONTRACTOR',
};

export function buildLocalBusinessSchema(company: Company) {
  const mainBranch = company.branches?.[0];

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: company.name,
    description: company.description,
    image: company.logo || company.image,
    url: `${SITE_URL}/companies/${company.id}`,
  };

  if (mainBranch) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: mainBranch.location.address,
      addressLocality: mainBranch.location.city,
      addressCountry: 'GQ',
    };
    if (mainBranch.contact.phone) {
      schema.telephone = mainBranch.contact.phone;
    }
  }

  // Google ignores/penalizes aggregateRating with no backing reviews —
  // only include it when there's real review data.
  if (company.reviews && company.reviews.length > 0) {
    const avg = company.reviews.reduce((sum, r) => sum + r.rating, 0) / company.reviews.length;
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avg.toFixed(1),
      reviewCount: company.reviews.length,
    };
  }

  return schema;
}

export function buildJobPostingSchema(job: JobPosting, company?: Company) {
  const mainBranch = company?.branches?.[0];

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.createdAt,
    employmentType: EMPLOYMENT_TYPE_MAP[job.employmentType],
    hiringOrganization: {
      '@type': 'Organization',
      name: job.companyName,
      logo: job.companyLogo,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: mainBranch?.location.address,
        addressLocality: job.city,
        addressCountry: 'GQ',
      },
    },
    // baseSalary intentionally omitted — job.salaryRange is free text and
    // can't be reliably parsed into schema.org's structured MonetaryAmount
    // without risking invalid data that fails rich-result eligibility.
  };

  if (job.deadline) {
    schema.validThrough = job.deadline;
  }

  return schema;
}

export function buildEventSchema(event: CalendarEvent) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.startDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: event.status === 'cancelled'
      ? 'https://schema.org/EventCancelled'
      : 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.city,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.address,
        addressLocality: event.city,
        addressCountry: 'GQ',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: event.organizerName,
    },
  };

  if (event.endDate) {
    schema.endDate = event.endDate;
  }

  return schema;
}

export function buildArticleSchema(post: Post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.authorName,
    },
  };
}

export function buildFAQSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        // Some answers include simple inline HTML (<a> links) for display —
        // acceptedAnswer.text should be plain text.
        text: item.answer.replace(/<[^>]+>/g, ''),
      },
    })),
  };
}

export function buildOrganizationSchema(settings: SiteSettings) {
  const sameAs = Object.values(settings.socialMedia || {}).filter((url): url is string => !!url);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.siteName || 'Oltinde',
    url: SITE_URL,
    logo: settings.logoUrl || `${SITE_URL}/oltinde-logo.png`,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}
