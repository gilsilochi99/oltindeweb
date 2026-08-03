
import Link from "next/link";
import Image from "next/image";
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
    <div className="flex gap-4">
      {entries.map(([platform, url]) => {
        const Icon = socialIconMap[platform];
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white transition-colors"
          >
            <Icon className="w-[18px] h-[18px]" />
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
  { href: "/map", label: "Mapa" },
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
    <Link href="/" className="flex items-center shrink-0 mb-4 bg-white rounded-md px-2 py-1.5 w-fit">
        <Image
          src="/oltinde-logo.png"
          alt={siteName}
          width={2107}
          height={512}
          className="h-8 w-auto object-contain"
        />
    </Link>
  );
}


export default async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="bg-on-background text-white w-full pt-12 pb-8 px-4 border-t-4 border-primary-container">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
        <div className="max-w-xs">
          <Logo siteName={settings.siteName} />
          {settings.siteSlogan && <p className="text-sm text-white/70 leading-relaxed">{settings.siteSlogan}</p>}
          <div className="mt-4">
            <SocialLinks socialMedia={settings.socialMedia} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-sm">
          <div>
            <h5 className="text-white font-bold mb-4 text-sm">Directorio</h5>
            <nav className="flex flex-col gap-2 text-xs text-white/70">
              {exploreLinks.map(link => (
                <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h5 className="text-white font-bold mb-4 text-sm">Empresas</h5>
            <nav className="flex flex-col gap-2 text-xs text-white/70">
              {companyLinks.map(link => (
                <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h5 className="text-white font-bold mb-4 text-sm">Legal</h5>
            <nav className="flex flex-col gap-2 text-xs text-white/70">
              {legalLinks.map(link => (
                <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto border-t border-white/20 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[11px] text-white/60">&copy; {new Date().getFullYear()} {settings.siteName}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
