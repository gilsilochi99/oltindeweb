import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/shared/LegalPage';

export const metadata: Metadata = {
  title: "Términos de Servicio",
  description: "Condiciones de uso de Oltinde: directorio, Tienda, Alquileres, empleos, Asistente y cuentas de empresa.",
  alternates: { canonical: '/terms' },
};

export const dynamic = 'force-static';

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Términos de Servicio" current="/terms">
      <h2>1. Quiénes somos y qué cubren estos términos</h2>
      <p>
        Oltinde («Oltinde», «nosotros») es un directorio y una plataforma de servicios de Guinea Ecuatorial. Estos Términos de Servicio regulan el uso del sitio web <strong>oltinde.com</strong> y de la aplicación móvil Oltinde para Android e iOS (juntos, la «Plataforma»).
      </p>
      <p>
        Al usar la Plataforma o crear una cuenta, usted acepta estos términos, la <Link href="/privacy">Política de Privacidad</Link>, la <Link href="/cookies">Política de Cookies</Link> y las <Link href="/normas">Normas de la Comunidad</Link>. Si no está de acuerdo, no use la Plataforma.
      </p>

      <h2>2. Qué ofrece Oltinde</h2>
      <ul>
        <li><strong>Directorio:</strong> fichas de empresas, instituciones, trámites, salud (farmacias, clínicas y hospitales), profesionales, servicios, comida, eventos, empleos, lugares turísticos e itinerarios.</li>
        <li><strong>Tienda:</strong> un espacio donde empresas locales publican productos y reciben pedidos.</li>
        <li><strong>Alquileres:</strong> anuncios de casas, pisos y vehículos en alquiler, con solicitudes de reserva.</li>
        <li><strong>Asistente Oltinde:</strong> un buscador que responde preguntas con la información de la Plataforma.</li>
        <li><strong>Herramientas para empresas:</strong> gestión de la ficha, ofertas, empleos, menús, productos, alquileres, pedidos, reservas, estadísticas y planes premium.</li>
      </ul>
      <p>
        Podemos añadir, cambiar o retirar funciones en cualquier momento. Algunas funciones solo están disponibles en ciertas ciudades, para ciertas categorías o con un plan premium.
      </p>

      <h2>3. Su cuenta</h2>
      <ul>
        <li>Debe tener al menos <strong>16 años</strong> para crear una cuenta. Si actúa en nombre de una empresa, debe tener autorización para representarla.</li>
        <li>La información que nos dé debe ser verdadera y estar actualizada.</li>
        <li>Puede registrarse con correo y contraseña o con su cuenta de Google. Usted es responsable de mantener segura su contraseña y de lo que se haga desde su cuenta. Avísenos enseguida si cree que alguien la está usando sin permiso.</li>
        <li>Puede pedir la eliminación de su cuenta en cualquier momento. Consulte <Link href="/eliminar-cuenta">Eliminar su cuenta</Link>.</li>
      </ul>

      <h2>4. Fichas de empresa, reclamación y verificación</h2>
      <ul>
        <li>Quien publica o gestiona una ficha garantiza que tiene derecho a hacerlo y que la información (nombre, dirección, teléfono, horarios, fotos, precios) es correcta.</li>
        <li>Para <strong>reclamar</strong> una ficha existente puede pedirse un código enviado al correo de la ficha, o documentos que demuestren que usted es el propietario o representante.</li>
        <li>La insignia de <strong>empresa verificada</strong> indica que revisamos la documentación aportada en una fecha concreta. No es una garantía sobre la calidad, la solvencia ni el comportamiento de la empresa. La verificación caduca y puede retirarse si la información deja de ser válida.</li>
        <li>Revisamos las fichas nuevas antes de publicarlas y podemos rechazar, editar, ocultar o retirar cualquier ficha que incumpla estos términos o que creamos falsa o engañosa.</li>
        <li>Las fichas de instituciones públicas y otra información de interés general pueden publicarse a partir de fuentes públicas.</li>
      </ul>

      <h2>5. Tienda</h2>
      <ul>
        <li>Oltinde <strong>no es el vendedor</strong>. Cada producto lo vende la empresa que lo publica, que es la responsable de su descripción, precio, existencias, entrega, garantía, devoluciones y de cumplir la ley.</li>
        <li>El contrato de compra se celebra entre usted y el vendedor. Al hacer un pedido, compartimos con el vendedor los datos necesarios para atenderlo: su nombre, teléfono y dirección de entrega.</li>
        <li>Los precios se muestran en francos CFA (XAF). Oltinde no cobra pagos con tarjeta: el pago se hace al recibir el pedido o en tienda, o por <strong>Muni Dinero</strong> cuando el vendedor lo ofrece. Las condiciones de cada pago las fija el vendedor.</li>
        <li>Si tiene un problema con un pedido, hable primero con el vendedor. Si no se resuelve, escríbanos y le ayudaremos en lo que podamos, sin que ello nos haga responsables del pedido.</li>
      </ul>

      <h2>6. Alquileres</h2>
      <ul>
        <li>Los anuncios de alquiler los publican empresas y anunciantes, que son responsables del inmueble o vehículo, de su estado, de los permisos y de las condiciones del alquiler.</li>
        <li>Una <strong>solicitud de reserva</strong> no es una reserva confirmada hasta que el anunciante la acepta. El pago, la fianza, la entrega de llaves o del vehículo y la cancelación se acuerdan directamente con el anunciante.</li>
        <li>Al solicitar una reserva, compartimos con el anunciante sus datos de contacto y las fechas solicitadas.</li>
      </ul>

      <h2>7. Empleos</h2>
      <p>
        Las ofertas de empleo las publican las empresas, que son responsables de su contenido. La candidatura se envía directamente a la empresa, por su enlace o su correo. Oltinde no participa en la selección. Una oferta se cierra automáticamente cuando pasa su fecha límite. <strong>Ninguna oferta legítima debe pedirle dinero</strong> para presentar su candidatura: si ocurre, avísenos.
      </p>

      <h2>8. Asistente Oltinde</h2>
      <p>
        El Asistente responde con textos de ayuda y con resultados de la Plataforma. Cuando está activado, usa un servicio de inteligencia artificial para entender su pregunta y redactar frases cortas de introducción. Las respuestas pueden contener errores u omisiones y no son asesoramiento legal, médico, financiero ni profesional. Compruebe la información importante con la empresa o la institución correspondiente. No escriba datos personales sensibles en el Asistente.
      </p>

      <h2>9. Planes premium y pagos de empresas</h2>
      <p>
        Algunas funciones para empresas requieren un plan premium. El precio, la duración y lo que incluye cada plan se indican antes de contratarlo. Salvo que se indique otra cosa o lo exija la ley, los importes pagados no son reembolsables. Si un plan caduca o se cancela, las funciones premium dejan de estar disponibles y la ficha sigue publicada con las funciones gratuitas.
      </p>

      <h2>10. Contenido que usted publica</h2>
      <p>
        Usted conserva los derechos sobre las reseñas, fotos, textos, publicaciones, itinerarios y demás contenido que publique. Nos concede una licencia gratuita, mundial y no exclusiva para alojarlo, mostrarlo, adaptarlo al formato de la Plataforma y difundirlo dentro de ella y en su promoción, mientras siga publicado.
      </p>
      <p>
        Usted garantiza que tiene derecho a publicarlo y que cumple las <Link href="/normas">Normas de la Comunidad</Link>. Podemos moderar, ocultar o eliminar contenido que las incumpla, sin estar obligados a revisar todo el contenido antes de publicarlo.
      </p>

      <h2>11. Usos prohibidos</h2>
      <ul>
        <li>Publicar información falsa, suplantar a otra persona o empresa, o reclamar una ficha que no le pertenece.</li>
        <li>Publicar reseñas falsas o pagadas, o manipular valoraciones y estadísticas.</li>
        <li>Vender o anunciar productos o servicios ilegales, robados, falsificados o peligrosos.</li>
        <li>Enviar spam o usar los datos de contacto de la Plataforma para publicidad no solicitada.</li>
        <li>Extraer datos de forma masiva o automatizada (bots, scraping) sin nuestro permiso por escrito.</li>
        <li>Intentar acceder sin autorización a cuentas, sistemas o datos, saturar los servidores o eludir los límites de uso.</li>
        <li>Usar la Plataforma para fraudes, estafas o cualquier fin ilegal.</li>
      </ul>

      <h2>12. Propiedad intelectual</h2>
      <p>
        La marca Oltinde, el logotipo, el diseño, las ilustraciones, el software y la recopilación de datos de la Plataforma son de Oltinde o de sus licenciantes. No puede copiarlos, modificarlos ni distribuirlos sin nuestro permiso, salvo para el uso normal de la Plataforma. Los nombres y logotipos de las empresas pertenecen a sus titulares.
      </p>

      <h2>13. Exactitud de la información y responsabilidad</h2>
      <p>
        Trabajamos para que la información sea correcta, pero gran parte la aportan empresas y usuarios y puede cambiar sin aviso (horarios, precios, farmacias de guardia, requisitos de trámites). La Plataforma se ofrece «tal cual» y «según disponibilidad».
      </p>
      <p>
        En la medida en que lo permita la ley, Oltinde no responde de los productos, servicios, alquileres, ofertas de empleo ni del comportamiento de las empresas y usuarios, ni de daños indirectos o pérdidas de beneficios derivados del uso de la Plataforma. Nada en estos términos limita la responsabilidad que no pueda limitarse por ley.
      </p>

      <h2>14. Suspensión y cancelación</h2>
      <p>
        Podemos suspender o cerrar cuentas, ocultar fichas o retirar contenido si se incumplen estos términos, si lo exige la ley o para proteger a otros usuarios. Cuando sea razonable, le avisaremos y le explicaremos el motivo. Usted puede dejar de usar la Plataforma y pedir la eliminación de su cuenta cuando quiera.
      </p>

      <h2>15. Cambios en estos términos</h2>
      <p>
        Podemos actualizar estos términos. Publicaremos la nueva versión con su fecha. Si el cambio es importante, le avisaremos en la Plataforma o por correo. Si sigue usando la Plataforma después del cambio, se entiende que acepta la nueva versión.
      </p>

      <h2>16. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República de Guinea Ecuatorial. Antes de acudir a los tribunales, intentaremos resolver cualquier desacuerdo de forma amistosa. Si no es posible, serán competentes los juzgados y tribunales de Malabo, salvo que la ley establezca otra cosa.
      </p>

      <h2>17. Contacto</h2>
      <p>
        Para cualquier pregunta sobre estos términos escriba a <a href="mailto:legal@oltinde.com">legal@oltinde.com</a> o use la página de <Link href="/contact">contacto</Link>.
      </p>
    </LegalPage>
  );
}
