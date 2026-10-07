
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { JsonLd } from "@/components/shared/JsonLd";
import { buildFAQSchema } from "@/lib/structured-data";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-black inline-block border-b-2 border-primary pb-1 mb-3">
      {children}
    </p>
  );
}

const faqItems = [
    {
        question: "¿Qué es Oltinde?",
        answer: "Oltinde es el directorio digital más completo de Guinea Ecuatorial. Nuestro objetivo es conectar a la comunidad con empresas, servicios, instituciones y trámites de manera fácil, rápida y fiable."
    },
    {
        question: "¿Qué es la Tienda Oltinde?",
        answer: "Es nuestra nueva tienda online: un marketplace donde las empresas de Guinea Ecuatorial venden sus productos con precio en XAF, fotos y stock. Puede comprar a varias empresas en un solo pedido. Entre desde <a href='/tienda' class='text-black hover:underline'>Tienda</a> en el menú."
    },
    {
        question: "¿Cómo pago en la Tienda? ¿Es seguro?",
        answer: "En la web no se cobra nada ni se piden datos de tarjeta. Usted elige pagar en efectivo al recibir o recoger el pedido, o con Muni Dinero, y lo coordina directamente con el vendedor."
    },
    {
        question: "¿Cómo recibo mi compra y cuánto cuesta el envío?",
        answer: "Cada vendedor indica si ofrece recogida en tienda (gratis) y/o envío a domicilio. La tarifa de envío depende de su ciudad y algunos vendedores lo hacen gratis a partir de cierto importe. Lo verá antes de confirmar el pedido."
    },
    {
        question: "¿Necesito una cuenta para comprar?",
        answer: "No es obligatorio: puede comprar como invitado indicando su nombre y teléfono, y seguir el pedido con el enlace de la página de confirmación. Con una <a href='/signup' class='text-black hover:underline'>cuenta gratuita</a> verá todos sus pedidos en <a href='/dashboard/compras' class='text-black hover:underline'>Mis Compras</a>, recibirá notificaciones, podrá valorar productos y usar la lista de deseos."
    },
    {
        question: "¿Puedo cancelar un pedido de la Tienda?",
        answer: "Sí, mientras el vendedor no haya empezado a prepararlo (pedido pendiente o confirmado), desde Mis Compras o desde el enlace de su pedido. Después, contacte directamente con el vendedor."
    },
    {
        question: "¿Cómo vendo mis productos en Oltinde?",
        answer: "Las empresas <a href='/para-empresas' class='text-black hover:underline'>Premium</a> tienen la sección 'Tienda' en su panel: publican productos con variantes, precios y stock, configuran envíos y pagos, gestionan pedidos, crean cupones y ven sus estadísticas. Consulte la <a href='/guia-de-usuario#vender' class='text-black hover:underline'>guía para vendedores</a>."
    },
    {
        question: "¿Qué es Alquileres?",
        answer: "Es la nueva sección de <a href='/alquiler' class='text-black hover:underline'>Alquiler</a>: casas, pisos, oficinas y locales, y también coches, todoterrenos y furgonetas, publicados por empresas verificadas. Hay alquileres por noches o días, con calendario de disponibilidad, y alquileres por meses."
    },
    {
        question: "¿Cómo reservo una casa o un coche?",
        answer: "En el anuncio, elija 'Por noches' (o 'Por días' para vehículos) o 'Por meses', marque las fechas en el calendario y envíe la solicitud con su nombre y teléfono. La empresa la acepta o la rechaza y usted recibe un aviso. Mientras está pendiente, las fechas quedan reservadas para usted. Si tiene dudas antes de reservar, use los botones de WhatsApp o Llamar del anuncio."
    },
    {
        question: "¿Cómo se paga un alquiler? ¿Y la fianza?",
        answer: "En la web no se cobra nada. El precio total aparece antes de enviar la solicitud; el pago y la fianza (si la hay, se devuelve al final) se acuerdan directamente con la empresa cuando acepta la reserva."
    },
    {
        question: "¿Puedo cancelar una reserva de alquiler?",
        answer: "Sí. Mientras esté pendiente, o aceptada pero aún no haya empezado, cancélela desde <a href='/dashboard/reservas' class='text-black hover:underline'>Mis reservas</a> o desde el enlace de su reserva (no necesita cuenta). Las fechas quedan libres de nuevo."
    },
    {
        question: "¿Cómo publico mis inmuebles o vehículos en alquiler?",
        answer: "Las empresas <a href='/para-empresas' class='text-black hover:underline'>Premium</a> tienen la sección 'Alquileres' en su panel: publican anuncios con fotos y precios, marcan en el calendario las fechas no disponibles y aceptan o rechazan las solicitudes. Consulte la <a href='/guia-de-usuario#publicar-alquiler' class='text-black hover:underline'>guía para anunciantes</a>."
    },
    {
        question: "¿Cuánto cuesta listar mi empresa?",
        answer: "El registro y listado básico en Oltinde es completamente gratuito. También ofrecemos un plan <a href='/para-empresas' class='text-black hover:underline'>Premium</a> opcional con herramientas avanzadas (tienda online, alquileres, documentos, ofertas, anuncios, empleos y eventos) para destacar aún más su negocio."
    },
    {
        question: "¿Cómo registro mi empresa en el directorio?",
        answer: "Es muy sencillo. Primero, <a href='/signup' class='text-black hover:underline'>cree una cuenta de usuario gratuita</a>. Luego, desde su panel de control, podrá acceder al formulario para añadir su empresa. Complete la información y envíela para su revisión."
    },
     {
        question: "¿Cómo sé si la información de una empresa es de confianza?",
        answer: "Busque la insignia de 'Verificado' en el perfil de la empresa. Esta insignia significa que nuestro equipo ha confirmado: nombre legal y CIF válidos, al menos un método de contacto confirmado, y la ubicación de al menos una sede."
    },
    {
        question: "¿La información sobre los trámites está actualizada?",
        answer: "Nos esforzamos por mantener la información de los trámites lo más actualizada posible. Sin embargo, los requisitos y costos pueden cambiar. Siempre recomendamos confirmar los detalles con la institución responsable antes de iniciar cualquier procedimiento."
    },
    {
        question: "¿Cómo me entero de las nuevas ofertas y anuncios?",
        answer: "Puede visitar las secciones de <a href='/offers' class='text-black hover:underline'>Ofertas</a> y <a href='/announcements' class='text-black hover:underline'>Anuncios</a>. Para recibir notificaciones directas, puede suscribirse a sus empresas o categorías de interés haciendo clic en el botón 'Suscribirse' en sus perfiles."
    },
    {
        question: "¿Puedo publicar ofertas de empleo?",
        answer: "Sí. Con una cuenta <a href='/para-empresas' class='text-black hover:underline'>Premium</a>, puede publicar vacantes en la <a href='/jobs' class='text-black hover:underline'>Bolsa de Trabajo</a> desde el panel de su empresa: tipo de contrato, salario, requisitos y cómo aplicar."
    },
    {
        question: "¿Cómo organizo un evento?",
        answer: "Las empresas Premium pueden crear eventos (ferias, conferencias, encuentros) desde su panel de control. Aparecerán en la sección de <a href='/events' class='text-black hover:underline'>Eventos</a> y notificaremos a sus seguidores."
    },
    {
        question: "¿Qué son los Itinerarios?",
        answer: "Los <a href='/itineraries' class='text-black hover:underline'>Itinerarios</a> son planes de viaje creados por la comunidad, con un mapa y un recorrido paso a paso por varios <a href='/places' class='text-black hover:underline'>Lugares Turísticos</a>. Cualquier usuario registrado puede crear el suyo y compartirlo."
    },
    {
        question: "¿Puedo sugerir un lugar turístico que no está en el directorio?",
        answer: "¡Claro! Vaya a <a href='/places/suggest' class='text-black hover:underline'>Sugerir un Lugar</a>, complete los datos y márquelo en el mapa. Un administrador revisará su sugerencia antes de publicarla."
    },
    {
        question: "¿Puedo dejar una reseña sobre una empresa o un trámite?",
        answer: "¡Sí! Su opinión es muy valiosa. Puede dejar una reseña y una calificación en la página de detalles de cualquier empresa, institución o trámite. Para ello, necesitará tener una cuenta de usuario."
    },
    {
        id: "verificacion",
        question: "¿Qué es el proceso de verificación?",
        answer: "La verificación es una revisión manual que realiza nuestro equipo para asegurar que la información en el directorio sea precisa y confiable. Concretamente, confirmamos: nombre legal y CIF válidos, al menos un método de contacto confirmado, y la ubicación de al menos una sede. Las empresas verificadas obtienen una insignia de confianza en su perfil, lo que aumenta la credibilidad ante los clientes."
    },
    {
        question: "¿Puedo editar la información de mi empresa más tarde?",
        answer: "¡Por supuesto! Una vez que su empresa esté listada, tendrá acceso a un panel de control donde podrá actualizar toda su información, gestionar reseñas, publicar anuncios y ofertas en cualquier momento."
    },
    {
        question: "¿Cómo puedo reportar información incorrecta en un perfil?",
        answer: "Si encuentra datos incorrectos o desactualizados en el perfil de una empresa, institución o trámite, puede usar el botón 'Reportar Información Incorrecta' en la página de detalles correspondiente. Agradecemos su colaboración para mantener la calidad de nuestro directorio."
    },
    {
        question: "¿Oltinde tiene modo oscuro?",
        answer: "Sí. Puede cambiar entre modo claro, oscuro o seguir la configuración de su dispositivo desde el icono de sol/luna en la cabecera del sitio."
    },
    {
        question: "¿Puedo compartir una empresa, empleo o itinerario en redes sociales?",
        answer: "Sí. En la página de detalles de cualquier empresa, empleo, evento, itinerario o lugar turístico encontrará botones para compartir en Facebook, X (Twitter), WhatsApp e Instagram."
    },
    {
        question: "¿Cómo sé qué farmacia está de guardia hoy?",
        answer: "En la sección <a href='/health' class='text-black hover:underline'>Salud</a> y en <a href='/health/pharmacies' class='text-black hover:underline'>Farmacias</a> puede ver cuáles están \"De Guardia Hoy\" y filtrar solo por esas. Los administradores actualizan el calendario de guardia cada mes."
    },
    {
        question: "¿Cómo pido comida a domicilio en Oltinde?",
        answer: "Entre en el perfil de un restaurante y busque la sección Menú. Añada los platos que desee al carrito, elija recoger en el local o entrega con Situka, y confirme el pedido: se enviará automáticamente por WhatsApp al restaurante."
    },
    {
        question: "¿Puedo pagar mi pedido de comida en línea?",
        answer: "Puede elegir pagar directamente con el restaurante (efectivo o coordinado por WhatsApp) o con Muni Dinero. El cobro automático por Muni Dinero está en preparación; por ahora, el pago se coordina directamente con el restaurante."
    },
    {
        question: "¿Cómo activo el menú de comida para mi restaurante?",
        answer: "Registre o edite su negocio con la categoría \"Restaurante\". Con una cuenta <a href='/para-empresas' class='text-black hover:underline'>Premium</a>, verá la opción 'Menú' en su panel de control para añadir sus platos y empezar a recibir pedidos."
    },
    {
        question: "¿Puedo publicar mi perfil como profesional independiente?",
        answer: "Sí, y es gratis. Cree una cuenta, vaya a su <a href='/dashboard/professional' class='text-black hover:underline'>Panel de Profesional</a> y complete su título, categoría, habilidades, servicios con precio orientativo y ejemplos de trabajos realizados. Su perfil se publica de inmediato en <a href='/professionals' class='text-black hover:underline'>Profesionales</a> y en el buscador."
    },
    {
        question: "¿Cómo encuentro un profesional o técnico de confianza?",
        answer: "Visite la sección <a href='/professionals' class='text-black hover:underline'>Profesionales</a> y filtre por categoría o ciudad, o simplemente pregúntele al buscador algo como \"electricistas en Malabo\". Puede contactar directamente por teléfono, WhatsApp o email desde el perfil de cada profesional."
    },
];


export default function FAQPage() {
  return (
    <div className="flex flex-col gap-16 md:gap-20 -m-4 md:-m-10 mb-12 md:mb-20">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-[var(--section-muted)]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <Eyebrow>Ayuda</Eyebrow>
          <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight text-foreground/90">
            Preguntas Frecuentes
          </h1>
          <p className="max-w-2xl mx-auto mt-5 text-lg text-muted-foreground">
            Encuentre respuestas a las dudas más comunes sobre Oltinde: desde publicar su empresa hasta planificar un viaje.
          </p>
        </div>
      </section>

      <JsonLd data={buildFAQSchema(faqItems)} />

      {/* FAQ list */}
      <section className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-card border rounded-xl p-6 md:p-8">
          <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                  <AccordionItem value={`item-${index}`} key={index} id={item.id}>
                      <AccordionTrigger className="text-base md:text-lg text-left hover:no-underline font-semibold">
                          {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-base text-muted-foreground">
                         <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                      </AccordionContent>
                  </AccordionItem>
              ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-16 bg-primary">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case text-primary-foreground">¿No encuentra lo que busca?</h2>
          <p className="text-primary-foreground/80 mt-2 max-w-xl mx-auto">
            Estamos aquí para ayudarle. Escríbanos y le responderemos lo antes posible.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">Contáctenos <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
