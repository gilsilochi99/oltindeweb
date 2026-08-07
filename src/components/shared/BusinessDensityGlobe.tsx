
'use client';

import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';
import type { CityDensity } from '@/lib/data';

// Decorative hero globe showing where Oltinde-listed businesses are
// concentrated. The dot-matrix world backdrop is cobe's default map (it
// doesn't ship a "just this country" render mode) — narrative focus comes
// from only ever plotting markers on real Guinea Ecuatorial cities, sized by
// how many active businesses are there. Draggable like the reference globe;
// auto-rotates when left alone.
interface BusinessDensityGlobeProps {
  cities: CityDensity[];
  size?: number;
  baseColor?: [number, number, number];
  markerColor?: [number, number, number];
  glowColor?: [number, number, number];
  dark?: number;
}

export function BusinessDensityGlobe({
  cities,
  size = 300,
  baseColor = [0.85, 0.87, 0.92],
  markerColor = [0.86, 0.66, 0.02], // Oltinde yellow
  glowColor = [0.95, 0.95, 0.97],
  dark = 0,
}: BusinessDensityGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    let phi = 4.9; // initial rotation, tuned so Guinea Ecuatorial faces forward on load
    const theta = 0.25;
    let width = 0;

    const onResize = () => {
      if (canvasRef.current) width = canvasRef.current.offsetWidth;
    };
    window.addEventListener('resize', onResize);
    onResize();

    const maxCount = Math.max(1, ...cities.map(c => c.count));
    const markers = cities.map(c => ({
      location: [c.lat, c.lng] as [number, number],
      size: 0.06 + (c.count / maxCount) * 0.09,
    }));

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi,
      theta,
      dark,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor,
      markerColor,
      glowColor,
      markers,
      opacity: 0.9,
    });

    // cobe v2 has no onRender push-callback — the caller drives the loop and
    // pushes updated state via globe.update() each frame.
    let frameId: number;
    const animate = () => {
      if (pointerInteracting.current === null) {
        phi += 0.003;
      }
      globe.update({ phi: phi + pointerInteractionMovement.current, width: width * 2, height: width * 2 });
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, [cities]);

  return (
    <div className="relative mx-auto" style={{ width: '100%', maxWidth: size, aspectRatio: 1 }}>
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
          if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta / 200;
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta / 100;
          }
        }}
        style={{ width: '100%', height: '100%', cursor: 'grab', contain: 'layout paint size' }}
      />
    </div>
  );
}
