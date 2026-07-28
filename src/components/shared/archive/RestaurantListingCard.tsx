import type { Company, MenuItem } from "@/lib/types";
import { ListingCard } from "./ListingCard";

// A restaurant is just a Company with a menu — this wraps ListingCard the
// same way CompanyListingCard does, adding food-specific tags (cuisine
// types, "Menú del Día" today) computed from that company's menu items.
export function RestaurantListingCard({ company, menuItems }: { company: Company; menuItems: MenuItem[] }) {
  const mainBranch = company.branches?.[0];
  const hasMenuDelDiaToday = menuItems.some(i => i.isMenuDelDia && i.available);
  const foodTypes = Array.from(new Set(menuItems.map(i => i.foodType).filter(Boolean)));
  const availableCount = menuItems.filter(i => i.available).length;

  const tags = [
    ...(hasMenuDelDiaToday ? ['Menú del Día Hoy'] : []),
    ...foodTypes.slice(0, 3),
  ];

  return (
    <ListingCard
      href={`/companies/${company.id}#menu`}
      logoSrc={company.logo}
      logoAlt={`${company.name} logo`}
      name={company.name}
      subtitle={company.category}
      description={company.description}
      tags={tags}
      metaSecondary={mainBranch ? `${mainBranch.location.address}, ${mainBranch.location.city}` : undefined}
      metaPrimary={`${availableCount} plato${availableCount === 1 ? '' : 's'}`}
      featured={company.isFeatured}
      phone={mainBranch?.contact.phone}
      whatsapp={company.contact.socialMedia?.whatsapp}
      email={company.contact.email}
      quickLinks={[{ label: 'Ver Menú', href: `/companies/${company.id}#menu` }]}
    />
  );
}
