import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { MaterialIcon } from "@/components/shared/detail/MaterialIcon";

export type ListingQuickLink = { label: string; href: string; external?: boolean };

// High-density "Yellow Pages"-style result card used across the archive
// (listing) pages: logo box, name/category/rating on the left, a phone
// number + address on the right, quick links along the bottom.
export function ListingCard({
  href,
  logoSrc,
  logoAlt,
  name,
  subtitle,
  verified,
  rating,
  reviewCount,
  metaPrimary,
  metaSecondary,
  quickLinks,
  featured,
}: {
  href: string;
  logoSrc?: string;
  logoAlt: string;
  name: string;
  subtitle?: string;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  metaPrimary?: string;
  metaSecondary?: string;
  quickLinks?: ListingQuickLink[];
  featured?: boolean;
}) {
  return (
    <article className="bg-white border border-outline-variant p-4 rounded-sm shadow-sm flex gap-4 relative">
      {logoSrc && (
        <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 border border-outline-variant rounded p-2 bg-white">
          <Image src={logoSrc} alt={logoAlt} width={128} height={128} className="w-full h-full object-contain" />
        </div>
      )}
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-secondary hover:underline">
              <Link href={href}>{name}</Link>
              {verified && <CheckCircle className="inline-block w-4 h-4 ml-1.5 mb-0.5 text-primary" />}
            </h2>
            {subtitle && <p className="text-xs text-secondary mt-0.5 truncate">{subtitle}</p>}
            {rating !== undefined && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <MaterialIcon key={i} name="star" className="!text-[18px]" filled={i < Math.round(rating)} />
                  ))}
                </div>
                <span className="text-xs text-secondary font-medium">({reviewCount ?? 0} reseña{reviewCount === 1 ? '' : 's'})</span>
              </div>
            )}
          </div>
          {(metaPrimary || metaSecondary) && (
            <div className="text-right flex flex-col items-end shrink-0">
              {metaPrimary && <p className="text-on-background font-bold text-lg whitespace-nowrap">{metaPrimary}</p>}
              {metaSecondary && <p className="text-[11px] text-secondary max-w-[180px]">{metaSecondary}</p>}
            </div>
          )}
        </div>
        {quickLinks && quickLinks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-outline-variant pt-3">
            {quickLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="text-xs font-bold text-secondary hover:underline"
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
