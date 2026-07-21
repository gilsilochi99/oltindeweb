
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
        question: "¿Cuánto cuesta listar mi empresa?",
        answer: "El registro y listado básico en Oltinde es completamente gratuito. También ofrecemos un plan <a href='/para-empresas' class='text-black hover:underline'>Premium</a> opcional con herramientas avanzadas (documentos, ofertas, anuncios, empleos y eventos) para destacar aún más su negocio."
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
