
// Thin server-only wrapper around the Places API (New) Text Search endpoint,
// used by the admin "Importar desde Google Places" tool. Field mask is kept
// deliberately minimal (id, name, address, coordinates, type) to stay on the
// cheapest available billing tier — no phone/website/photos/hours requested.

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
  error?: { message: string };
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

export async function searchPlaces(query: string, fallbackCity: string): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY no está configurada.');
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'es' }),
  });

  const data: PlacesApiResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Places API respondió con estado ${response.status}.`);
  }

  return (data.places || []).map((place) => ({
    placeId: place.id,
    name: place.displayName?.text || 'Sin nombre',
    address: place.formattedAddress || '',
    city: guessCity(place.formattedAddress, fallbackCity),
    lat: place.location?.latitude ?? 0,
    lng: place.location?.longitude ?? 0,
    primaryType: place.primaryType,
  }));
}
