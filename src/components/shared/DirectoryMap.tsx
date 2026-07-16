'use client';

import { useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { Building2, Landmark } from 'lucide-react';
import { applyLeafletIconFix } from '@/lib/leaflet-icon-fix';
import { MALABO_COORDS } from '@/lib/map-utils';

applyLeafletIconFix();

export type DirectoryMapMarker = {
  id: string;
  name: string;
  category: string;
  type: 'company' | 'institution';
  branchName: string;
  lat: number;
  lng: number;
};

function buildDivIcon(type: DirectoryMapMarker['type']) {
  const Icon = type === 'institution' ? Landmark : Building2;
  const colorClass = type === 'institution' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground';
  const html = renderToStaticMarkup(
    <div
      className={colorClass}
      style={{
        width: 28,
        height: 28,
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
      }}
    >
      <Icon size={15} />
    </div>
  );
  return L.divIcon({
    html,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function buildPopupHtml(marker: DirectoryMapMarker) {
  return renderToStaticMarkup(
    <div className="space-y-1">
      <p className="font-semibold text-sm">{marker.name}</p>
      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">{marker.category}</span>
      <p className="text-xs text-muted-foreground">{marker.branchName}</p>
      <a
        href={marker.type === 'company' ? `/companies/${marker.id}` : `/institutions/${marker.id}`}
        className="text-xs text-black hover:underline block pt-1"
      >
        Ver detalles
      </a>
    </div>
  );
}

interface DirectoryMapProps {
  markers: DirectoryMapMarker[];
  height?: string;
  singleMarker?: boolean;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
}

export function DirectoryMap({
  markers,
  height = '600px',
  singleMarker = false,
  defaultCenter = MALABO_COORDS,
  defaultZoom = 8,
}: DirectoryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Create the map exactly once per mounted container — see LocationPicker.tsx
  // for why this guards against React 18 StrictMode's dev-only double-mount.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [defaultCenter.lat, defaultCenter.lng],
      zoom: defaultZoom,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers + viewport whenever the marker list changes.
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const icons = { company: buildDivIcon('company'), institution: buildDivIcon('institution') };

    markers.forEach((marker) => {
      L.marker([marker.lat, marker.lng], { icon: icons[marker.type] })
        .bindPopup(buildPopupHtml(marker))
        .addTo(layer);
    });

    if (markers.length > 1 && !singleMarker) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], defaultZoom);
    } else {
      map.setView([defaultCenter.lat, defaultCenter.lng], defaultZoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, singleMarker]);

  return <div ref={containerRef} style={{ height }} className="w-full rounded-lg overflow-hidden border" />;
}
