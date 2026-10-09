// Notifications carry website paths (the same notification shows on the web
// and in the app). Most public paths exist in the app with the same name;
// the business-panel ones are translated to the app's screens here.
export function appRouteForLink(link: string): string {
  const path = link.split('#')[0].split('?')[0];

  const company = path.match(/^\/dashboard\/companies\/([^/]+)\/(.*)$/);
  if (company) {
    const [, id, rest] = company;
    if (rest.startsWith('verification')) return `/business/${id}/verification`;
    if (rest.startsWith('shop/questions')) return `/business/${id}/questions`;
    if (rest.startsWith('shop/orders')) return `/business/${id}/shop-orders`;
    if (rest.startsWith('shop')) return `/business/${id}/products`;
    if (rest.startsWith('rentals/bookings')) return `/business/${id}/bookings`;
    if (rest.startsWith('rentals')) return `/business/${id}/rentals`;
    if (rest.startsWith('orders')) return `/business/${id}/orders`;
    return `/business/${id}`;
  }
  if (path === '/dashboard/compras') return '/tienda/pedidos';
  if (path === '/dashboard/reservas') return '/alquiler/reservas';
  if (path === '/dashboard/orders') return '/food/pedidos';
  // The website splits health facilities by type; the app has one screen.
  const health = path.match(/^\/health\/(?:pharmacies|clinics|hospitals)\/([^/]+)$/);
  if (health) return `/health/${health[1]}`;
  // The website's service pages use a name slug; the app lists them by id.
  if (path.startsWith('/services/')) return '/services';
  if (path.startsWith('/admin')) return '/admin';
  if (path.startsWith('/dashboard')) return '/dashboard';
  return path || '/';
}
