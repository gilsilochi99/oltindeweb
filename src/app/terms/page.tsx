
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline">Términos de Servicio</CardTitle>
      </CardHeader>
      <CardContent className="prose max-w-none dark:prose-invert">
        <p><em>Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>
        
        <h2>1. Acuerdo de los Términos</h2>
        <p>
          Estos Términos de Servicio constituyen un acuerdo legalmente vinculante hecho entre usted, ya sea personalmente o en nombre de una entidad ("usted") y Oltinde ("nosotros", "nos" o "nuestro"), con respecto a su acceso y uso del sitio web de Oltinde, así como cualquier otra forma de medio, canal de medios, sitio web móvil o aplicación móvil relacionada, vinculada o conectada de otro modo (colectivamente, el "Sitio").
        </p>
        <p>
          Usted acepta que al acceder al Sitio, ha leído, entendido y aceptado estar sujeto a todos estos Términos de Servicio. Si no está de acuerdo con todos estos Términos de Servicio, se le prohíbe expresamente usar el Sitio y debe suspender su uso de inmediato.
        </p>

        <h2>2. Propiedad Intelectual</h2>
        <p>
          A menos que se indique lo contrario, el Sitio es nuestra propiedad propietaria y todo el código fuente, bases de datos, funcionalidad, software, diseños de sitios web, audio, video, texto, fotografías y gráficos en el Sitio (colectivamente, el "Contenido") y las marcas comerciales, marcas de servicio y logotipos contenidos en él (las "Marcas") son de nuestra propiedad o están bajo nuestro control o licenciados para nosotros, y están protegidos por las leyes de derechos de autor y marcas registradas.
        </p>

        <h2>3. Representaciones del Usuario</h2>
        <p>
          Al usar el Sitio, usted representa y garantiza que: (1) toda la información de registro que envíe será verdadera, precisa, actual y completa; (2) mantendrá la precisión de dicha información y la actualizará rápidamente según sea necesario; (3) tiene la capacidad legal y acepta cumplir con estos Términos de Servicio; (4) no es menor de edad en la jurisdicción en la que reside; (5) no accederá al Sitio a través de medios automatizados o no humanos, ya sea a través de un bot, script o de otro modo.
        </p>

        <h2>4. Actividades Prohibidas</h2>
        <p>
          No puede acceder ni utilizar el Sitio para ningún propósito que no sea aquel para el que ponemos el Sitio a su disposición. El Sitio no se puede utilizar en relación con ningún esfuerzo comercial, excepto aquellos que están específicamente respaldados o aprobados por nosotros.
        </p>

        <h2>5. Terminación</h2>
        <p>
          Estos Términos de Servicio permanecerán en pleno vigor y efecto mientras utilice el Sitio. SIN LIMITAR NINGUNA OTRA DISPOSICIÓN DE ESTOS TÉRMINOS DE SERVICIO, NOS RESERVAMOS EL DERECHO DE, A NUESTRA ÚNICA DISCRECIÓN Y SIN PREVIO AVISO NI RESPONSABILIDAD, NEGAR EL ACCESO Y EL USO DEL SITIO (INCLUYENDO EL BLOQUEO DE CIERTAS DIRECCIONES IP), A CUALQUIER PERSONA POR CUALQUIER MOTIVO O SIN MOTIVO.
        </p>

        <h2>6. Ley Aplicable</h2>
        <p>
          Estos Términos de Servicio y su uso del Sitio se rigen e interpretan de acuerdo con las leyes de Guinea Ecuatorial.
        </p>
        
        <h2>7. Contacto</h2>
        <p>
          Para resolver una queja sobre el Sitio o para recibir más información sobre el uso del Sitio, contáctenos en: <a href="mailto:legal@oltinde.com">legal@oltinde.com</a>.
        </p>
      </CardContent>
    </Card>
  );
}

    