
import Link from "next/link";
import { getSiteSettings } from "@/lib/data";

const exploreLinks = [
  { href: "/companies", label: "Empresas" },
  { href: "/institutions", label: "Instituciones" },
  { href: "/procedures", label: "Trámites" },
  { href: "/contribuciones", label: "Contribuciones" },
];

const companyLinks = [
  { href: "/about", label: "Sobre Nosotros" },
  { href: "/list-your-company", label: "Publicar mi Empresa" },
  { href: "/contact", label: "Contacto" },
  { href: "/faq", label: "Preguntas Frecuentes"},
];

const legalLinks = [
  { href: "/terms", label: "Términos de Servicio" },
  { href: "/privacy", label: "Política de Privacidad" },
  { href: "/guia-de-usuario", label: "Guía del Usuario" },
]

function Logo({ siteName }: { siteName: string }) {
  return (
    <Link href="/" className="flex items-center gap-2 group shrink-0">
        <span className="font-extrabold text-2xl tracking-tighter text-primary-foreground">{siteName}</span>
    </Link>
  );
}


export default async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8 text-center md:text-left">
          <div className="flex-shrink-0">
            <div className="flex justify-center md:justify-start">
              <Logo siteName={settings.siteName} />
            </div>
            {settings.siteSlogan && <p className="text-sm mt-2 text-primary-foreground/80">{settings.siteSlogan}</p>}
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <h3 className="font-bold mb-3">Explorar</h3>
              <ul className="space-y-2">
                {exploreLinks.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:underline text-primary-foreground/80 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3">Empresa</h3>
              <ul className="space-y-2">
                {companyLinks.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:underline text-primary-foreground/80 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/30 flex flex-col md:flex-row justify-between items-center text-sm gap-4">
          <p className="text-center md:text-left text-primary-foreground/80">&copy; {new Date().getFullYear()} {settings.siteName}. Todos los derechos reservados.</p>
           <nav>
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {legalLinks.map(link => (
                    <li key={link.href}>
                        <Link href={link.href} className="hover:underline transition-colors text-primary-foreground/80">
                            {link.label}
                        </Link>
                    </li>
                ))}
             </ul>
          </nav>
        </div>

      </div>
    </footer>
  );
}
