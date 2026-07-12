
import Link from "next/link";
import { getSiteSettings } from "@/lib/data";
import { Facebook, Twitter, Instagram, Linkedin, MessageCircle, Music2 } from "lucide-react";
import type { SiteSettings } from "@/lib/types";

const socialIconMap = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Music2,
  whatsapp: MessageCircle,
} as const;

function SocialLinks({ socialMedia }: { socialMedia: SiteSettings['socialMedia'] }) {
  const entries = Object.entries(socialMedia || {}).filter(([, url]) => !!url) as [keyof typeof socialIconMap, string][];
  if (entries.length === 0) return null;

  return (
    <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
      {entries.map(([platform, url]) => {
        const Icon = socialIconMap[platform];
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
          >
            <Icon className="w-4 h-4" />
            <span className="sr-only">{platform}</span>
          </a>
        );
      })}
    </div>
  );
}

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
            <SocialLinks socialMedia={settings.socialMedia} />
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
