import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle, Mail } from "lucide-react";
import { MaterialIcon } from "@/components/shared/detail/MaterialIcon";
import { WhatsAppIcon, toWhatsAppHref } from "@/components/shared/WhatsAppButton";
import { cn } from "@/lib/utils";

export type ListingQuickLink = { label: string; href: string; external?: boolean };

// High-density "Yellow Pages"-style result card used across the archive
// (listing) pages and anywhere else a collection item is listed (e.g. the
// homepage's featured companies): logo box, name/category/rating on the
// left, a phone number + address on the right, a description snippet, tag
// chips, and quick links along the bottom.
export function ListingCard({
  href,
  logoSrc,
  logoAlt,
  name,
  subtitle,
  verified,
  statusBadge,
  rating,
  reviewCount,
  description,
  tags,
  metaPrimary,
  metaSecondary,
  quickLinks,
  featured,
  imageFit = 'contain',
  whatsapp,
  email,
}: {
  href: string;
  logoSrc?: string;
  logoAlt: string;
  name: string;
  subtitle?: string;
  verified?: boolean;
  statusBadge?: ReactNode;
  rating?: number;
  reviewCount?: number;
  description?: string;
  tags?: string[];
  metaPrimary?: string;
  metaSecondary?: string;
  quickLinks?: ListingQuickLink[];
  featured?: boolean;
  imageFit?: 'contain' | 'cover';
  whatsapp?: string;
  email?: string;
}) {
  return (
    <article className="bg-card border border-outline-variant p-3 sm:p-4 rounded-sm shadow-sm flex gap-3 sm:gap-4 relative">
      {logoSrc && (
        <div className={cn(
          "w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 shrink-0 rounded bg-white overflow-hidden",
          imageFit === 'contain' ? "p-1.5 sm:p-2" : undefined
        )}>
          <Image src={logoSrc} alt={logoAlt} width={128} height={128} className={cn("w-full h-full", imageFit === 'contain' ? "object-contain" : "object-cover")} />
        </div>
      )}
      <div className="flex-grow min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold normal-case text-secondary underline">
                <Link href={href}>{name}</Link>
              </h2>
              {verified && <CheckCircle className="inline-block w-4 h-4 mb-0.5 text-black shrink-0" />}
              {statusBadge}
            </div>
            {subtitle && <p className="text-xs text-secondary mt-0.5 truncate">{subtitle}</p>}
            {rating !== undefined && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex text-black">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <MaterialIcon key={i} name="star" className="!text-[18px]" filled={i < Math.round(rating)} />
                  ))}
                </div>
                <span className="text-xs text-secondary font-medium">({reviewCount ?? 0} reseña{reviewCount === 1 ? '' : 's'})</span>
              </div>
            )}
          </div>
          {(metaPrimary || metaSecondary) && (
            <div className="text-left sm:text-right flex flex-col sm:items-end shrink-0">
              {metaPrimary && <p className="text-on-background text-base sm:text-lg">{metaPrimary}</p>}
              {metaSecondary && <p className="text-[11px] text-secondary sm:max-w-[180px]">{metaSecondary}</p>}
            </div>
          )}
        </div>
        {description && (
          <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{description}</p>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map(tag => (
              <span key={tag} className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full text-[10px] uppercase">
                {tag}
              </span>
            ))}
          </div>
        )}
        {(quickLinks && quickLinks.length > 0 || whatsapp || email) && (
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-3 border-t border-outline-variant pt-3">
            {whatsapp && (
              <a
                href={toWhatsAppHref(whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contactar por WhatsApp"
                className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current" />
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                aria-label="Contactar por Email"
                className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
              >
                <Mail className="w-4 h-4" />
              </a>
            )}
            {quickLinks && quickLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="text-xs text-secondary underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
      {featured && <div className="absolute bottom-2 right-2 text-[10px] text-outline italic">Destacado</div>}
    </article>
  );
}
