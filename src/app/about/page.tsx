
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, FileText, Megaphone, Star, Linkedin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const teamMembers = [
  {
    name: "Jesús Gil Eparalele Silochi",
    role: "Fundador & CEO",
    bio: "Con una profunda pasión por la tecnología y un compromiso con el progreso de Guinea Ecuatorial, Jesús fundó Oltinde. Su visión es clara: crear un ecosistema digital centralizado que no solo conecte a las empresas con los consumidores, sino que también simplifique el acceso a información vital para el desarrollo económico y social del país. Con experiencia en desarrollo de software y gestión de proyectos, Jesús identificó la necesidad de una herramienta que eliminara las barreras de información y fomentara la transparencia. Oltinde es el resultado de esa visión, una plataforma diseñada para catalizar el crecimiento, impulsar la competencia y construir un futuro más conectado y próspero para todos los ecuatoguineanos.",
    linkedinUrl: "https://www.linkedin.com/in/gilsilochi/",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-12">
      <section className="text-left">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter">Sobre Oltinde</h1>
        <div className="mt-6 text-lg text-muted-foreground space-y-4">
            <p>
                Oltinde es el ecosistema digital que impulsa a Guinea Ecuatorial, una plataforma diseñada para unificar y simplificar el acceso al tejido comercial, institucional y administrativo del país. Nacimos de la necesidad de crear un punto de encuentro centralizado, fiable y fácil de usar que conecte a la comunidad con empresas, servicios, trámites e información esencial.
            </p>
            <p>
                Nuestra misión es catalizar el crecimiento económico y la transparencia, proporcionando a los ciudadanos y empresarios las herramientas necesarias para prosperar. Creemos que al facilitar el acceso a la información, fomentamos una mayor participación, competencia y desarrollo, construyendo un futuro más conectado y próspero para Guinea Ecuatorial.
            </p>
        </div>
      </section>

      <Card className="bg-secondary/30">
        <CardHeader>
            <CardTitle>Nuestro Fundador</CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-10 flex flex-col items-start text-left gap-2">
            <h3 className="text-2xl font-bold">{teamMembers[0].name}</h3>
            <p className="text-primary font-semibold text-lg">{teamMembers[0].role}</p>
            <p className="text-muted-foreground mt-2">
              {teamMembers[0].bio}
            </p>
            <div className="mt-4">
                 <Button variant="outline" size="sm" asChild>
                    <Link href={teamMembers[0].linkedinUrl} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="mr-2 h-4 w-4" />
                        Conectar en LinkedIn
                    </Link>
                </Button>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
