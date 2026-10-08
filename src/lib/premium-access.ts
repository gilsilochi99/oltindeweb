import { prisma } from './db';
import { getSiteSettings } from './data';
import { categoryAllowsFeature, PREMIUM_FEATURES, type PremiumFeature } from './premium-features';

// Server-side check for premium features: the company must be Premium and
// its category must be allowed by the admin's rules. Returns the message to
// show when access is denied, or null when the company may use the feature.
export async function premiumFeatureDenied(
  company: { isPremium?: boolean | null; category?: string | null },
  feature: PremiumFeature,
): Promise<string | null> {
  const label = PREMIUM_FEATURES[feature];
  if (!company.isPremium) return `${label}: función disponible para empresas Premium.`;
  const { premiumFeatureRules } = await getSiteSettings();
  if (!categoryAllowsFeature(premiumFeatureRules, feature, company.category ?? undefined)) {
    return `${label} no está disponible para empresas de la categoría "${company.category || 'sin categoría'}". Contacte con Oltinde si su empresa lo necesita.`;
  }
  return null;
}

/** Same check by company id, for actions that only have the id at hand. */
export async function companyFeatureDenied(companyId: string, feature: PremiumFeature): Promise<string | null> {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { isPremium: true, category: true } });
  if (!company) return 'Empresa no encontrada.';
  return premiumFeatureDenied(company, feature);
}
