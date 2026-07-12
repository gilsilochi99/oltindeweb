'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Crosshair } from 'lucide-react';
import { applyLeafletIconFix } from '@/lib/leaflet-icon-fix';
import { MALABO_COORDS } from '@/lib/map-utils';

applyLeafletIconFix();

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: string;
}

export function LocationPicker({ lat, lng, onChange, height = '300px' }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [geoError, setGeoError] = useState<string | null>(null);

  const hasMarker = typeof lat === 'number' && typeof lng === 'number' && !(lat === 0 && lng === 0);

  // Create the map exactly once per mounted container. Guarding on mapRef.current
  // (reset to null in the cleanup below) keeps this safe even if React invokes
  // this effect twice in a row (React 18 StrictMode's dev-only double-mount),
  // which is what made react-leaflet's own MapContainer throw "Map container is
  // already initialized" here.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: hasMarker ? [lat!, lng!] : [MALABO_COORDS.lat, MALABO_COORDS.lng],
      zoom: hasMarker ? 15 : 8,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in sync with the lat/lng props without recreating the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (hasMarker) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat!, lng!]);
      } else {
        markerRef.current = L.marker([lat!, lng!]).addTo(map);
      }
      map.setView([lat!, lng!], Math.max(map.getZoom(), 15));
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [lat, lng, hasMarker]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError('La geolocalización no está disponible en este navegador.');
      return;
    }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setGeoError('No se pudo obtener su ubicación actual.');
      }
    );
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} style={{ height }} className="w-full rounded-lg overflow-hidden border" />
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {hasMarker
            ? `Ubicación seleccionada: ${lat!.toFixed(5)}, ${lng!.toFixed(5)}`
            : 'Sin ubicación seleccionada. Haga clic en el mapa para marcarla.'}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
          <Crosshair className="w-3.5 h-3.5 mr-1.5" />
          Usar mi ubicación actual
        </Button>
      </div>
      {geoError && <p className="text-xs text-destructive">{geoError}</p>}
    </div>
  );
}
