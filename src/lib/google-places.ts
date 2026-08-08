
// Thin server-only wrapper around the Places API (New), used by the admin
// "Importar desde Google Places" tool. Two tiers of cost by design:
// searchPlaces() (below) uses a minimal Essentials-tier field mask so
// browsing search results is cheap regardless of how many are shown;
// getPlaceDetails()/uploadPlacePhotoToStorage() (further down) pull richer
// Pro-tier data and are only called once per business actually imported.

import { uploadBufferToStorage } from './storage-admin';

export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  primaryType?: string;
};

interface PlacesApiPlace {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  primaryType?: string;
}

interface PlacesApiResponse {
  places?: PlacesApiPlace[];
  nextPageToken?: string;
  error?: { message: string };
}

export interface PlaceSearchPage {
  results: PlaceResult[];
  nextPageToken?: string;
}

// formattedAddress from Places is typically "Street, City, Country" or
// similar — take the second-to-last comma-separated segment as a best-effort
// city guess, falling back to the city the admin searched for.
function guessCity(formattedAddress: string | undefined, fallbackCity: string): string {
  if (!formattedAddress) return fallbackCity;
  const parts = formattedAddress.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return fallbackCity;
}

// Text Search returns at most 20 places per call. Google paginates further
// results (up to 60 total, 3 pages) behind a `nextPageToken` returned in the
// response — pass it back in as `pageToken` to fetch the next page of the
// SAME query. Without this, re-running an identical search always returns
// the identical top 20, which is why "load more" looked like it did nothing
// once those 20 were already imported.
export async function searchPlaces(query: string, fallbackCity: string, pageToken?: string): Promise<PlaceSearchPage> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY no está configurada.');
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,nextPageToken',
    },
    body: JSON.stringify(pageToken ? { textQuery: query, languageCode: 'es', pageToken } : { textQuery: query, languageCode: 'es' }),
  });

  const data: PlacesApiResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Places API respondió con estado ${response.status}.`);
  }

  return {
    results: (data.places || []).map((place) => ({
      placeId: place.id,
      name: place.displayName?.text || 'Sin nombre',
      address: place.formattedAddress || '',
      city: guessCity(place.formattedAddress, fallbackCity),
      lat: place.location?.latitude ?? 0,
      lng: place.location?.longitude ?? 0,
      primaryType: place.primaryType,
    })),
    nextPageToken: data.nextPageToken,
  };
}

// --- Enrichment: called once per business the admin actually imports, not
// per search result, so cost scales with imports rather than searches. Uses
// Pro-tier fields (phone/website/hours/photos) — billed above the free
// Essentials tier used by searchPlaces above.

export type WorkingHoursEntry = { day: string; hours: string };

export type GooglePlaceReview = {
  author: string;
  rating: number;
  comment: string;
  date: string; // ISO string
};

export type PlaceDetails = {
  phone?: string;
  website?: string;
  workingHours: WorkingHoursEntry[];
  businessStatus?: string;
  photoName?: string;
  description?: string;
  reviews: GooglePlaceReview[];
};

interface PlacesApiDetails {
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  businessStatus?: string;
  photos?: { name: string }[];
  editorialSummary?: { text: string; languageCode?: string };
  reviews?: {
    rating?: number;
    text?: { text: string };
    authorAttribution?: { displayName?: string };
    publishTime?: string;
  }[];
  error?: { message: string };
}

function parseWeekdayDescriptions(descriptions: string[] | undefined): WorkingHoursEntry[] {
  if (!descriptions) return [];
  return descriptions.map((desc) => {
    const separatorIndex = desc.indexOf(':');
    if (separatorIndex === -1) return { day: desc, hours: '' };
    return {
      day: desc.slice(0, separatorIndex).trim(),
      hours: desc.slice(separatorIndex + 1).trim(),
    };
  });
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY no está configurada.');
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=es`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'nationalPhoneNumber,internationalPhoneNumber,websiteUri,regularOpeningHours,businessStatus,photos,editorialSummary,reviews',
    },
  });

  const data: PlacesApiDetails = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Places API (Details) respondió con estado ${response.status}.`);
  }

  return {
    phone: data.nationalPhoneNumber || data.internationalPhoneNumber || undefined,
    website: data.websiteUri || undefined,
    workingHours: parseWeekdayDescriptions(data.regularOpeningHours?.weekdayDescriptions),
    businessStatus: data.businessStatus,
    photoName: data.photos?.[0]?.name,
    description: data.editorialSummary?.text,
    reviews: (data.reviews || []).map((r) => ({
      author: r.authorAttribution?.displayName || 'Usuario de Google',
      rating: r.rating ?? 0,
      comment: r.text?.text || '',
      date: r.publishTime || new Date().toISOString(),
    })),
  };
}

// Fetches one photo and uploads it to Firebase Storage instead of embedding
// it as base64 in the Company doc (that's what made the companies collection
// balloon to ~17MB — see src/lib/storage-admin.ts). Keyed by the stable
// Places placeId rather than a Firestore doc ID, since no company doc exists
// yet at this point in importPlacesAsCompanies. Returns null (never throws)
// on any failure so a photo problem doesn't block the rest of the import.
export async function uploadPlacePhotoToStorage(photoName: string, placeId: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${apiKey}`
    );
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = contentType === 'image/png' ? 'png' : 'jpg';

    return await uploadBufferToStorage(`companies/places/${placeId}/logo.${ext}`, buffer, contentType);
  } catch {
    return null;
  }
}
