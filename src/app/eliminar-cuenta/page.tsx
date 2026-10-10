import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/shared/LegalPage';

export const metadata: Metadata = {
  title: "Eliminar su cuenta",
  description: "Cómo pedir que Oltinde elimine su cuenta y sus datos, qué se borra y qué se conserva.",
  alternates: { canonical: '/eliminar-cuenta' },
};

export const dynamic = 'force-static';

const SUBJECT = encodeURIComponent('Eliminar mi cuenta de Oltinde');
const BODY = encodeURIComponent('Hola, quiero que eliminen mi cuenta de Oltinde y mis datos personales.\n\nCorreo de la cuenta: \nNombre: \n');

export default function DeleteAccountPage() {
  return (
    <LegalPage title="Eliminar su cuenta" current="/eliminar-cuenta">
      <p>
        Puede eliminar su cuenta de Oltinde (web y app Android/iOS) y los datos personales asociados en cualquier momento.
      </p>

      <h2>Cómo eliminarla</h2>
      <ul>
        <li><strong>En la app:</strong> abra <strong>Cuenta → Eliminar mi cuenta</strong>, escriba ELIMINAR y confirme.</li>
        <li><strong>En la web:</strong> entre en <Link href="/profile">Mi perfil</Link> y, al final de la página, pulse <strong>Eliminar mi cuenta</strong>.</li>
      </ul>
      <p>
        La cuenta se elimina al momento y le enviamos un correo de confirmación. Si no puede entrar en su cuenta, escriba a <a href={`mailto:privacidad@oltinde.com?subject=${SUBJECT}&body=${BODY}`}>privacidad@oltinde.com</a> desde el correo con el que la creó y la eliminaremos en un plazo máximo de 30 días.
      </p>
      <p>
        Las cuentas del equipo de Oltinde (administración, edición o farmacia) deben perder antes ese rol, que retira un administrador.
      </p>

      <h2>Qué se elimina</h2>
      <ul>
        <li>Su cuenta de acceso (correo, contraseña o vínculo con Google).</li>
        <li>Su perfil: nombre, foto, teléfono y preferencias.</li>
        <li>Sus favoritos, suscripciones, notificaciones y los avisos en sus dispositivos.</li>
        <li>Sus publicaciones, comentarios, itinerarios y perfiles de profesional.</li>
        <li>Sus preguntas al Asistente.</li>
        <li>Sus solicitudes de reclamación y de verificación de empresas, con los documentos que aportó.</li>
      </ul>

      <h2>Qué se conserva y por qué</h2>
      <ul>
        <li><strong>Reseñas y preguntas sobre productos:</strong> se conservan sin su nombre, como «Usuario de Oltinde», para que las valoraciones de las empresas no cambien. Si quiere que las borremos, escríbanos.</li>
        <li><strong>Pedidos y reservas:</strong> los ya hechos se conservan, sin vínculo con su cuenta, el tiempo que exija la ley o que sea necesario para resolver reclamaciones. El vendedor o anunciante conserva la copia que recibió para atenderle.</li>
        <li><strong>Fichas de empresa:</strong> la ficha es información de la empresa, no suya. Sigue publicada sin gestor y puede reclamarla quien demuestre ser su representante. Si quiere que se retire, escríbanos.</li>
        <li><strong>Copias de seguridad:</strong> los datos borrados pueden permanecer en copias de seguridad hasta que estas se sustituyan en su ciclo normal.</li>
      </ul>

      <h2>Borrar solo algunos datos</h2>
      <p>
        No hace falta eliminar la cuenta para borrar datos concretos. Puede editar su perfil, quitar favoritos y desactivar notificaciones desde su cuenta, o escribirnos para pedir que borremos datos específicos. Más información en la <Link href="/privacy">Política de Privacidad</Link>.
      </p>
    </LegalPage>
  );
}
