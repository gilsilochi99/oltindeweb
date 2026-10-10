import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/shared/LegalPage';

export const metadata: Metadata = {
  title: "Normas de la Comunidad",
  description: "Qué se puede y qué no se puede publicar en Oltinde: fichas, reseñas, productos, alquileres, empleos y publicaciones.",
  alternates: { canonical: '/normas' },
};

export const dynamic = 'force-static';

export default function CommunityGuidelinesPage() {
  return (
    <LegalPage title="Normas de la Comunidad" current="/normas">
      <p>
        Oltinde funciona porque la gente confía en lo que encuentra. Estas normas se aplican a todo lo que se publica: fichas de empresa, reseñas y respuestas, productos, anuncios de alquiler, ofertas de empleo, ofertas y anuncios, eventos, publicaciones, itinerarios y fotos. Forman parte de los <Link href="/terms">Términos de Servicio</Link>.
      </p>

      <h2>Reseñas</h2>
      <ul>
        <li>Escriba solo sobre experiencias reales y propias con esa empresa, producto o alquiler.</li>
        <li>No publique reseñas de su propia empresa, de sus competidores ni a cambio de dinero, descuentos u otros beneficios.</li>
        <li>Critique el servicio, no a las personas: sin insultos, amenazas ni datos personales de empleados o clientes.</li>
        <li>Las empresas pueden responder a las reseñas con respeto. No pueden presionar a nadie para que cambie o borre una reseña.</li>
      </ul>

      <h2>Fichas, productos, alquileres y empleos</h2>
      <ul>
        <li>La información debe ser verdadera y estar actualizada: dirección, teléfono, horarios, precios, existencias y fotos reales.</li>
        <li>Solo puede gestionar fichas de empresas que le pertenecen o que representa.</li>
        <li>Los productos y servicios deben ser legales en Guinea Ecuatorial. Se prohíben, entre otros: armas, drogas, medicamentos sin autorización, productos falsificados o robados, animales protegidos y documentos oficiales.</li>
        <li>Los anuncios de alquiler deben corresponder a inmuebles o vehículos reales que el anunciante puede alquilar.</li>
        <li>Las ofertas de empleo deben ser reales. Está prohibido cobrar a los candidatos por presentarse, y las ofertas no pueden discriminar por etnia, religión, sexo, discapacidad u otras condiciones protegidas por la ley.</li>
      </ul>

      <h2>Contenido que no se permite en ningún caso</h2>
      <ul>
        <li>Contenido sexual o desnudos, y cualquier contenido que sexualice a menores.</li>
        <li>Violencia, amenazas, acoso o incitación al odio.</li>
        <li>Estafas, cadenas, esquemas piramidales o enlaces maliciosos.</li>
        <li>Spam: el mismo contenido repetido, publicidad fuera de lugar o datos de contacto en sitios que no corresponden.</li>
        <li>Datos personales de otras personas sin su permiso.</li>
        <li>Fotos, textos o logotipos que no son suyos y que no tiene permiso para usar.</li>
        <li>Suplantación de personas, empresas o instituciones públicas.</li>
      </ul>

      <h2>Cómo moderamos</h2>
      <p>
        Las fichas nuevas y las solicitudes de verificación las revisa nuestro equipo antes de publicarlas. El resto del contenido se publica directamente, y lo revisamos cuando recibimos un aviso o detectamos un problema. Según la gravedad, podemos editar o retirar el contenido, quitar la insignia de verificación, ocultar una ficha o suspender la cuenta. Si cree que nos hemos equivocado, escríbanos y lo revisaremos de nuevo.
      </p>

      <h2>Cómo avisarnos</h2>
      <p>
        Si ve algo que incumple estas normas, información incorrecta o un posible fraude, escríbanos desde la página de <Link href="/contact">contacto</Link> o a <a href="mailto:info@oltinde.com">info@oltinde.com</a>, indicando el enlace de la página. Lo revisaremos lo antes posible.
      </p>
    </LegalPage>
  );
}
