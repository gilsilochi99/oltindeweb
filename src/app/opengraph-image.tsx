import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

// Default share image for every page (WhatsApp, Facebook, X, LinkedIn...).
// Rendered once at build time.
export const alt = 'Oltinde: el directorio verificado de Guinea Ecuatorial';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const logo = await readFile(path.join(process.cwd(), 'public/oltinde-logo.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#FFCD00', padding: '72px 80px', color: '#111111', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex' }}>
          <div style={{ display: 'flex', background: '#FFFFFF', borderRadius: 24, padding: '20px 32px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={420} height={102} alt="" />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Todo lo que buscas está aquí</div>
          <div style={{ fontSize: 34, opacity: 0.8 }}>Empresas · Tienda online · Alquileres · Trámites · Empleos</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, fontWeight: 600 }}>
          <span>El directorio verificado de Guinea Ecuatorial</span>
          <span>oltinde.com</span>
        </div>
      </div>
    ),
    size
  );
}
