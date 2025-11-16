
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline">Política de Privacidad</CardTitle>
      </CardHeader>
      <CardContent className="prose max-w-none dark:prose-invert">
        <p><em>Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>
        
        <h2>1. Introducción</h2>
        <p>
          Bienvenido a Oltinde. Nos comprometemos a proteger su privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y salvaguardamos su información cuando visita nuestro sitio web.
        </p>

        <h2>2. Recopilación de su Información</h2>
        <p>
          Podemos recopilar información sobre usted de varias maneras. La información que podemos recopilar en el Sitio incluye:
        </p>
        <ul>
          <li>
            <strong>Datos Personales:</strong> Información de identificación personal, como su nombre, dirección de correo electrónico y número de teléfono, que usted nos proporciona voluntariamente cuando se registra en el Sitio o elige participar en diversas actividades relacionadas con el Sitio.
          </li>
          <li>
            <strong>Datos Derivados:</strong> Información que nuestros servidores recopilan automáticamente cuando accede al Sitio, como su dirección IP, su tipo de navegador, su sistema operativo, sus tiempos de acceso y las páginas que ha visto directamente antes y después de acceder al Sitio.
          </li>
        </ul>

        <h2>3. Uso de su Información</h2>
        <p>
          Tener información precisa sobre usted nos permite brindarle una experiencia fluida, eficiente y personalizada. Específicamente, podemos usar la información recopilada sobre usted a través del Sitio para:
        </p>
        <ul>
          <li>Crear y gestionar su cuenta.</li>
          <li>Enviarle por correo electrónico un boletín informativo y otras promociones.</li>
          <li>Aumentar la eficiencia y el funcionamiento del Sitio.</li>
          <li>Notificarle las actualizaciones del Sitio.</li>
        </ul>

        <h2>4. Seguridad de su Información</h2>
        <p>
          Utilizamos medidas de seguridad administrativas, técnicas y físicas para ayudar a proteger su información personal. Si bien hemos tomado medidas razonables para asegurar la información personal que nos proporciona, tenga en cuenta que a pesar de nuestros esfuerzos, ninguna medida de seguridad es perfecta o impenetrable, y no se puede garantizar ningún método de transmisión de datos contra ninguna interceptación u otro tipo de uso indebido.
        </p>
        
        <h2>5. Contacto</h2>
        <p>
          Si tiene preguntas o comentarios sobre esta Política de Privacidad, por favor contáctenos en: <a href="mailto:privacidad@oltinde.com">privacidad@oltinde.com</a>.
        </p>
      </CardContent>
    </Card>
  );
}

    