import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/shared/LegalPage';

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Qué cookies y almacenamiento del navegador usa Oltinde y para qué.",
  alternates: { canonical: '/cookies' },
};

export const dynamic = 'force-static';

const ROWS: { name: string; kind: string; purpose: string; duration: string }[] = [
  { name: 'oltinde_session', kind: 'Cookie propia, necesaria', purpose: 'Mantener su sesión iniciada de forma segura.', duration: '14 días' },
  { name: 'Sesión de Firebase', kind: 'Almacenamiento del navegador, necesario', purpose: 'Inicio de sesión (correo o Google) a través de Google Firebase.', duration: 'Hasta que cierre la sesión' },
  { name: 'Carrito de la Tienda y de comida', kind: 'Almacenamiento del navegador, necesario', purpose: 'Recordar los productos que ha añadido.', duration: 'Hasta que haga el pedido o lo vacíe' },
  { name: 'Ciudad preferida', kind: 'Almacenamiento del navegador, preferencia', purpose: 'Mostrarle primero resultados de su ciudad.', duration: 'Hasta que la cambie o borre los datos del navegador' },
  { name: 'Búsquedas recientes', kind: 'Almacenamiento del navegador, preferencia', purpose: 'Mostrarle sus últimas búsquedas.', duration: 'Hasta que las borre' },
  { name: 'Aviso de instalación', kind: 'Almacenamiento del navegador, preferencia', purpose: 'No volver a mostrar el aviso «Instale Oltinde» si lo cerró.', duration: 'Hasta que borre los datos del navegador' },
  { name: 'Caché sin conexión', kind: 'Service worker, necesario', purpose: 'Que algunas páginas se abran rápido o sin conexión.', duration: 'Se renueva automáticamente' },
];

export default function CookiesPolicyPage() {
  return (
    <LegalPage title="Política de Cookies" current="/cookies">
      <p>
        Las cookies y el almacenamiento del navegador son pequeños datos que un sitio web guarda en su dispositivo. Oltinde usa solo los <strong>necesarios</strong> para que la web funcione y algunos de <strong>preferencia</strong> para recordar sus elecciones.
      </p>
      <p>
        <strong>No usamos cookies de publicidad, de seguimiento ni de analítica de terceros.</strong> Por eso no le mostramos un aviso de consentimiento.
      </p>

      <h2>Qué guardamos</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-4 font-semibold">Nombre</th>
              <th className="py-2 pr-4 font-semibold">Tipo</th>
              <th className="py-2 pr-4 font-semibold">Para qué</th>
              <th className="py-2 font-semibold">Duración</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.name} className="border-b align-top">
                <td className="py-2 pr-4 font-medium">{r.name}</td>
                <td className="py-2 pr-4">{r.kind}</td>
                <td className="py-2 pr-4">{r.purpose}</td>
                <td className="py-2">{r.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Contenido de terceros</h2>
      <p>
        Algunas páginas muestran mapas o contenido de otros servicios, como los botones de Google para iniciar sesión. Esos servicios pueden usar sus propias cookies según sus políticas.
      </p>

      <h2>Cómo borrarlas</h2>
      <p>
        Puede borrar las cookies y los datos del sitio desde los ajustes de su navegador. Si borra las necesarias, se cerrará su sesión y se vaciará su carrito.
      </p>

      <h2>La aplicación móvil</h2>
      <p>
        La app no usa cookies de navegador. Guarda en el teléfono su sesión, el carrito, las búsquedas recientes y sus preferencias, tal como explica la <Link href="/privacy">Política de Privacidad</Link>.
      </p>
    </LegalPage>
  );
}
