import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/shared/LegalPage';

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Qué datos personales recoge Oltinde en la web y en la app, para qué los usa, con quién los comparte y cómo ejercer sus derechos.",
  alternates: { canonical: '/privacy' },
};

export const dynamic = 'force-static';

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Política de Privacidad" current="/privacy">
      <p>
        Esta política explica qué datos personales trata Oltinde cuando usa el sitio web <strong>oltinde.com</strong> y la aplicación móvil Oltinde (juntos, la «Plataforma»), para qué los usamos, con quién los compartimos y qué derechos tiene. Oltinde es el responsable de estos datos. Para cualquier asunto de privacidad, escriba a <a href="mailto:privacidad@oltinde.com">privacidad@oltinde.com</a>.
      </p>

      <h2>1. Datos que recogemos</h2>
      <h3>Datos que usted nos da</h3>
      <ul>
        <li><strong>Cuenta:</strong> nombre, correo electrónico y contraseña (guardada cifrada por nuestro proveedor de autenticación). Si entra con Google, recibimos su nombre, correo y foto de perfil de Google.</li>
        <li><strong>Perfil y preferencias:</strong> foto, teléfono, ciudad preferida, favoritos, suscripciones a ciudades o categorías y ajustes de notificaciones.</li>
        <li><strong>Pedidos y reservas:</strong> nombre, teléfono, dirección de entrega, productos o fechas solicitadas y notas para el vendedor o anunciante.</li>
        <li><strong>Empresas y profesionales:</strong> datos de la ficha (nombre, dirección, teléfonos, correo, horarios, fotos, ubicación en el mapa) y datos de quien la gestiona.</li>
        <li><strong>Verificación de empresas:</strong> documentos que aporte para demostrar que es propietario o representante (por ejemplo, registro mercantil, licencia o documento de identidad). Se guardan en un almacenamiento privado al que solo accede el equipo de revisión.</li>
        <li><strong>Contenido publicado:</strong> reseñas, respuestas, publicaciones, itinerarios, fotos y mensajes de contacto.</li>
        <li><strong>Preguntas al Asistente:</strong> el texto de sus preguntas y las respuestas.</li>
      </ul>
      <h3>Datos que se generan al usar la Plataforma</h3>
      <ul>
        <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador o dispositivo, sistema operativo, páginas visitadas y fecha y hora, en los registros del servidor. Para limitar abusos guardamos un resumen cifrado (hash) de la IP, no la IP en claro.</li>
        <li><strong>Ubicación:</strong> solo si usted pulsa «usar mi ubicación» al marcar una dirección en el mapa (por ejemplo, la de su empresa). El navegador le pide permiso y la posición se usa únicamente para rellenar ese punto.</li>
        <li><strong>Token de notificaciones:</strong> si acepta las notificaciones, un identificador del dispositivo para poder enviárselas.</li>
        <li><strong>Estadísticas de uso de fichas:</strong> visitas y clics (por ejemplo, en «llamar» o «aplicar»), contados de forma agregada para que las empresas vean sus estadísticas.</li>
      </ul>
      <p>
        No usamos herramientas de publicidad ni de seguimiento de terceros, y no vendemos sus datos.
      </p>

      <h2>2. Para qué usamos sus datos y con qué base</h2>
      <ul>
        <li><strong>Prestar el servicio</strong> que usted pide: crear y gestionar su cuenta, publicar fichas, tramitar pedidos y solicitudes de reserva, mostrar sus favoritos y responder al Asistente. Base: la ejecución del servicio que usted solicita.</li>
        <li><strong>Avisarle</strong> por notificación y por correo de lo que afecta a su cuenta: aprobación de su ficha, estado de pedidos y reservas, respuestas a reseñas, verificación. Base: la ejecución del servicio. Puede desactivar los correos y las notificaciones en sus ajustes; algunos avisos de seguridad de la cuenta se envían siempre.</li>
        <li><strong>Verificar empresas</strong> y prevenir fraudes, suplantaciones, spam y abusos. Base: nuestro interés legítimo en mantener una plataforma fiable.</li>
        <li><strong>Mejorar la Plataforma:</strong> por ejemplo, el equipo revisa las preguntas que el Asistente no supo responder para añadir respuestas. Base: interés legítimo.</li>
        <li><strong>Cumplir obligaciones legales</strong> y atender requerimientos de las autoridades.</li>
      </ul>

      <h2>3. Con quién compartimos sus datos</h2>
      <ul>
        <li><strong>Empresas y anunciantes:</strong> cuando hace un pedido o solicita una reserva, el vendedor o anunciante recibe los datos necesarios para atenderle (nombre, teléfono, dirección o fechas).</li>
        <li><strong>Otros usuarios:</strong> su nombre y foto aparecen junto a las reseñas y publicaciones que haga públicas. Los datos de una ficha de empresa son públicos.</li>
        <li><strong>Proveedores que nos prestan servicios</strong> y tratan los datos solo siguiendo nuestras instrucciones:
          <ul>
            <li>Alojamiento web y base de datos (Namecheap).</li>
            <li>Inicio de sesión y notificaciones push (Google Firebase).</li>
            <li>Inicio de sesión con Google (Google).</li>
            <li>Envío de correos electrónicos (nuestro servidor de correo).</li>
            <li>Inteligencia artificial del Asistente (OpenRouter y los proveedores de modelos a los que da acceso, Google Gemini o Anthropic, según la configuración). A estos servicios solo se envía el texto de la pregunta y de la conversación reciente, junto con la lista de temas de ayuda y de ciudades. No se envían su nombre, correo ni datos de su cuenta.</li>
          </ul>
        </li>
        <li><strong>Autoridades:</strong> cuando la ley nos obligue o para proteger los derechos y la seguridad de los usuarios y de Oltinde.</li>
      </ul>

      <h2>4. Transferencias internacionales</h2>
      <p>
        Algunos de estos proveedores tienen servidores fuera de Guinea Ecuatorial, por ejemplo en Estados Unidos o en la Unión Europea. Los elegimos porque aplican medidas de seguridad reconocidas y solo les damos los datos necesarios para su función.
      </p>

      <h2>5. Cuánto tiempo guardamos los datos</h2>
      <ul>
        <li><strong>Cuenta y perfil:</strong> mientras la cuenta esté activa. Si pide eliminarla, los borramos o anonimizamos (ver <Link href="/eliminar-cuenta">Eliminar su cuenta</Link>).</li>
        <li><strong>Pedidos y reservas:</strong> el tiempo necesario para atenderlos y para cumplir obligaciones legales o resolver reclamaciones.</li>
        <li><strong>Documentos de verificación:</strong> mientras dure la revisión y la validez de la verificación, y después el tiempo necesario para demostrar cómo se verificó la ficha.</li>
        <li><strong>Códigos de reclamación:</strong> caducan a los 30 minutos.</li>
        <li><strong>Preguntas al Asistente y registros técnicos:</strong> el tiempo necesario para mejorar el servicio y prevenir abusos. Después los eliminamos.</li>
      </ul>

      <h2>6. La aplicación móvil</h2>
      <ul>
        <li><strong>Fotos:</strong> la app pide acceso a sus fotos solo cuando usted elige subir una imagen (logo, foto de producto o de perfil). No accede a otras fotos.</li>
        <li><strong>Notificaciones:</strong> le pedimos permiso para enviarle avisos. Puede retirarlo en los ajustes del teléfono.</li>
        <li><strong>Datos guardados en el teléfono:</strong> su sesión, el carrito, las búsquedas recientes y algunas preferencias se guardan en el propio dispositivo.</li>
        <li>La app no usa su ubicación en segundo plano, ni la cámara, ni el micrófono.</li>
      </ul>

      <h2>7. Seguridad</h2>
      <p>
        Usamos conexiones cifradas (HTTPS), contraseñas gestionadas por un proveedor de autenticación, permisos por función para el equipo de Oltinde, almacenamiento privado para los documentos de verificación y límites contra el uso abusivo. Ningún sistema es totalmente seguro. Si detectamos una brecha que ponga en riesgo sus datos, se lo comunicaremos según exija la ley.
      </p>

      <h2>8. Sus derechos</h2>
      <p>
        Puede pedir el <strong>acceso</strong> a sus datos, su <strong>rectificación</strong>, su <strong>supresión</strong>, la <strong>limitación</strong> del tratamiento, la <strong>portabilidad</strong> a otro servicio u <strong>oponerse</strong> a ciertos usos. Puede corregir muchos datos usted mismo desde su perfil y su panel. Para lo demás, escriba a <a href="mailto:privacidad@oltinde.com">privacidad@oltinde.com</a> desde el correo de su cuenta. Responderemos en un plazo máximo de 30 días. Si no está conforme con nuestra respuesta, puede acudir a la autoridad competente en materia de protección de datos.
      </p>

      <h2>9. Menores</h2>
      <p>
        La Plataforma no está dirigida a menores de 16 años y no recogemos sus datos a sabiendas. Si cree que un menor nos ha dado datos, escríbanos y los eliminaremos.
      </p>

      <h2>10. Cambios en esta política</h2>
      <p>
        Si cambiamos esta política, publicaremos la nueva versión con su fecha. Si el cambio es importante, le avisaremos en la Plataforma o por correo.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Privacidad: <a href="mailto:privacidad@oltinde.com">privacidad@oltinde.com</a>. Otras consultas: <Link href="/contact">página de contacto</Link>.
      </p>
    </LegalPage>
  );
}
