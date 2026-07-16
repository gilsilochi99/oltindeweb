
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import Link from "next/link";

const faqItems = [
    {
        question: "¿Qué es Oltinde?",
        answer: "Oltinde es el directorio digital más completo de Guinea Ecuatorial. Nuestro objetivo es conectar a la comunidad con empresas, servicios, instituciones y trámites de manera fácil, rápida y fiable."
    },
    {
        question: "¿Cuánto cuesta listar mi empresa?",
        answer: "El registro y listado básico en Oltinde es completamente gratuito. Planeamos ofrecer paquetes premium opcionales en el futuro con características avanzadas para destacar aún más su negocio."
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
    }
];


export default function FAQPage() {
  return (
    <div className="space-y-8">
        <section className="text-center">
            <HelpCircle className="w-12 h-12 text-black mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter">Preguntas Frecuentes</h1>
            <p className="max-w-3xl mx-auto mt-4 text-lg text-muted-foreground">
                Encuentre respuestas a las dudas más comunes sobre Oltinde.
            </p>
        </section>

        <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6 md:p-8">
                 <Accordion type="single" collapsible className="w-full">
                    {faqItems.map((item, index) => (
                        <AccordionItem value={`item-${index}`} key={index} id={item.id}>
                            <AccordionTrigger className="text-lg text-left hover:no-underline font-semibold">
                                {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-base text-muted-foreground">
                               <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>

        <Card className="text-center bg-secondary/50">
            <CardHeader>
                <CardTitle>¿No encuentra lo que busca?</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Si tiene más preguntas, no dude en <Link href="/contact" className="text-black font-semibold hover:underline">contactarnos</Link>. Estamos aquí para ayudarle.</p>
            </CardContent>
        </Card>
    </div>
  )
}
