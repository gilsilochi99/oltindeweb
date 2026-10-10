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
        Puede pedir en cualquier momento que eliminemos su cuenta de Oltinde (web y app Android/iOS) y los datos personales asociados.
      </p>

      <h2>Cómo pedirlo</h2>
      <ol>
        <li>
          Envíe un correo a <a href={`mailto:privacidad@oltinde.com?subject=${SUBJECT}&body=${BODY}`}>privacidad@oltinde.com</a> con el asunto «Eliminar mi cuenta de Oltinde», <strong>desde el correo con el que creó la cuenta</strong>. Así sabemos que la petición es suya.
        </li>
        <li>Si gestiona empresas en Oltinde, indique si quiere que también se eliminen sus fichas o si va a pasar su gestión a otra persona.</li>
        <li>Le confirmaremos la recepción y eliminaremos la cuenta en un plazo máximo de <strong>30 días</strong>. Le avisaremos por correo cuando esté hecho.</li>
      </ol>
      <p>
        En la app, abra <strong>Cuenta → Eliminar mi cuenta</strong> para llegar a esta página. Si no puede usar el correo de la cuenta, escríbanos igualmente y le pediremos otra forma de confirmar que es el titular.
      </p>

      <h2>Qué se elimina</h2>
      <ul>
        <li>Su cuenta de acceso (correo, contraseña o vínculo con Google).</li>
        <li>Su perfil: nombre, foto, teléfono y preferencias.</li>
        <li>Sus favoritos, suscripciones, ajustes de notificaciones y los tokens de notificaciones de sus dispositivos.</li>
        <li>Sus preguntas al Asistente asociadas a su cuenta.</li>
        <li>Los documentos de verificación que haya aportado, salvo lo indicado abajo.</li>
      </ul>

      <h2>Qué se conserva y por qué</h2>
      <ul>
        <li><strong>Pedidos y reservas:</strong> los datos de pedidos y reservas ya hechos se conservan el tiempo que exija la ley o que sea necesario para resolver reclamaciones, y después se borran. El vendedor o anunciante conserva la copia que recibió para atenderle.</li>
        <li><strong>Reseñas y publicaciones:</strong> se eliminan o se anonimizan («Usuario de Oltinde»), según prefiera. Indíquelo en su correo; si no dice nada, las eliminamos.</li>
        <li><strong>Fichas de empresa:</strong> la ficha es información de la empresa, no suya. Si no pide eliminarla, puede seguir publicada sin gestor o pasar a quien demuestre ser su representante.</li>
        <li><strong>Copias de seguridad:</strong> los datos borrados pueden permanecer en copias de seguridad cifradas hasta que estas se sustituyan en su ciclo normal.</li>
      </ul>

      <h2>Borrar solo algunos datos</h2>
      <p>
        No hace falta eliminar la cuenta para borrar datos concretos. Puede editar su perfil, quitar favoritos y desactivar notificaciones desde su cuenta, o escribirnos para pedir que borremos datos específicos. Más información en la <Link href="/privacy">Política de Privacidad</Link>.
      </p>
    </LegalPage>
  );
}
