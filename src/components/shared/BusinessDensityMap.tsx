
'use client';

import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import gnqGeo from '@/lib/gnq-geo.json';
import type { CityDensity } from '@/lib/data';

// Real Guinea Ecuatorial boundary (mainland Río Muni + Bioko island),
// extracted once from world-atlas's countries-50m dataset and bundled as a
// static ~3KB GeoJSON file — no need for the full world map at runtime.
const GNQ_GEO_DATA = { type: 'FeatureCollection' as const, features: [gnqGeo as any] };

export function BusinessDensityMap({ cities, size = 340 }: { cities: CityDensity[]; size?: number }) {
  const maxCount = Math.max(1, ...cities.map(c => c.count));

  return (
    <div className="mx-auto" style={{ width: '100%', maxWidth: size }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [9.9, 2.3], scale: 5200 }}
        width={340}
        height={340}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GNQ_GEO_DATA}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: { fill: 'hsl(48 60% 92%)', stroke: 'hsl(48 90% 45%)', strokeWidth: 1.25, outline: 'none' },
                  hover: { fill: 'hsl(48 90% 88%)', stroke: 'hsl(48 90% 45%)', strokeWidth: 1.25, outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
        {cities.map((c) => {
          const radius = 3 + (c.count / maxCount) * 8;
          return (
            <Marker key={c.city} coordinates={[c.lng, c.lat]}>
              <circle r={radius} fill="hsl(48 100% 50%)" stroke="#1a1a1a" strokeWidth={0.75} />
              <text textAnchor="middle" y={-radius - 4} style={{ fontSize: 9, fontWeight: 700, fill: '#333' }}>
                {c.city}
              </text>
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}
