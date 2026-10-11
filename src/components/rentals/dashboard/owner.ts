// Whose rentals a dashboard view shows: a company (scope = its id) or the
// signed-in private advertiser (scope = 'me').
export type RentalOwner = {
  scope: string;
  /** Company name, or "Mis alquileres". */
  name: string;
  /** Dashboard base path, e.g. /dashboard/companies/<id>/rentals or /dashboard/alquileres. */
  basePath: string;
  /** Public page of the advertiser (companies only). */
  profileHref?: string;
  isIndividual: boolean;
};

export function companyRentalOwner(company: { id: string; name: string }): RentalOwner {
  return { scope: company.id, name: company.name, basePath: `/dashboard/companies/${company.id}/rentals`, profileHref: `/companies/${company.id}`, isIndividual: false };
}

export const PRIVATE_RENTAL_OWNER: RentalOwner = { scope: 'me', name: 'Mis alquileres', basePath: '/dashboard/alquileres', isIndividual: true };
