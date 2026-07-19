'use client';

import { useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { applyLeafletIconFix } from '@/lib/leaflet-icon-fix';
import { MALABO_COORDS } from '@/lib/map-utils';

applyLeafletIconFix();

export type ItineraryMapStop = {
  id: string;
  order: number;
  name: string;
  lat: number;
  lng: number;
};

function buildNumberedDivIcon(order: number) {
  const html = renderToStaticMarkup(
    <div
      className="bg-primary text-primary-foreground"
      style={{
        width: 28,
        height: 28,
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {order}
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

function buildPopupHtml(stop: ItineraryMapStop) {
  return renderToStaticMarkup(
    <p className="font-semibold text-sm">{stop.order}. {stop.name}</p>
  );
}

interface ItineraryMapProps {
  stops: ItineraryMapStop[];
  height?: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
}

export function ItineraryMap({
  stops,
  height = '400px',
  defaultCenter = MALABO_COORDS,
  defaultZoom = 8,
}: ItineraryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

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

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync numbered markers + the connecting route line whenever stops change.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const orderedStops = [...stops].sort((a, b) => a.order - b.order);

    orderedStops.forEach((stop) => {
      L.marker([stop.lat, stop.lng], { icon: buildNumberedDivIcon(stop.order) })
        .bindPopup(buildPopupHtml(stop))
        .addTo(layer);
    });

    if (orderedStops.length > 1) {
      L.polyline(
        orderedStops.map((s) => [s.lat, s.lng] as [number, number]),
        { color: '#1a1c1c', weight: 3, dashArray: '6 6' }
      ).addTo(layer);

      const bounds = L.latLngBounds(orderedStops.map((s) => [s.lat, s.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else if (orderedStops.length === 1) {
      map.setView([orderedStops[0].lat, orderedStops[0].lng], 14);
    } else {
      map.setView([defaultCenter.lat, defaultCenter.lng], defaultZoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  return <div ref={containerRef} style={{ height }} className="w-full rounded-lg overflow-hidden border" />;
}
