import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let applied = false;

function toSrc(image: unknown): string {
  return typeof image === 'string' ? image : (image as { src: string }).src;
}

// Next.js's image loader turns .png imports into { src, width, height } objects
// instead of raw URL strings, which breaks Leaflet's default marker icon lookup
// under webpack. This patches the default icon to use the resolved src.
export function applyLeafletIconFix() {
  if (applied) return;
  applied = true;

  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: toSrc(markerIcon2x),
    iconUrl: toSrc(markerIcon),
    shadowUrl: toSrc(markerShadow),
  });
}
