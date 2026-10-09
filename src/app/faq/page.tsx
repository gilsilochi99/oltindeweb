import type { Metadata } from 'next';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { JsonLd } from "@/components/shared/JsonLd";
import { buildFAQSchema } from "@/lib/structured-data";
import { FAQ_ITEMS } from "@/lib/help-content";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes",
  description: "Respuestas sobre Oltinde: cómo comprar en la Tienda, reservar un alquiler, publicar su empresa, el plan Premium y más.",
  alternates: { canonical: '/faq' },
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-black inline-block border-b-2 border-primary pb-1 mb-3">
      {children}
    </p>
  );
}

const faqItems = FAQ_ITEMS;


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
