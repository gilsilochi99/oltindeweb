export const MALABO_COORDS = { lat: 3.75, lng: 8.78 };

export function hasValidCoordinates(
  loc?: { lat?: number; lng?: number } | null
): loc is { lat: number; lng: number } {
  return (
    typeof loc?.lat === 'number' &&
    typeof loc?.lng === 'number' &&
    !(loc.lat === 0 && loc.lng === 0)
  );
}
