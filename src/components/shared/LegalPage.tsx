import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Shared frame for the legal pages: title, date of the current version, the
// text, and links to the other policies.

export const LEGAL_UPDATED = "10 de octubre de 2026";

export const LEGAL_PAGES = [
  { href: "/terms", label: "Términos de Servicio" },
  { href: "/privacy", label: "Política de Privacidad" },
  { href: "/cookies", label: "Política de Cookies" },
  { href: "/normas", label: "Normas de la Comunidad" },
  { href: "/eliminar-cuenta", label: "Eliminar su cuenta" },
];

export function LegalPage({ title, current, children }: { title: string; current: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline normal-case">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">Última actualización: {LEGAL_UPDATED}</p>
      </CardHeader>
      <CardContent className="prose max-w-none dark:prose-invert prose-h2:text-xl prose-h2:mt-8 prose-h3:text-base">
        {children}
        <hr />
        <p className="text-sm">Otras políticas de Oltinde:</p>
        <ul className="text-sm">
          {LEGAL_PAGES.filter((p) => p.href !== current).map((p) => (
            <li key={p.href}><Link href={p.href}>{p.label}</Link></li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
