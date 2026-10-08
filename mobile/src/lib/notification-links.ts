// Notifications carry website paths (the same notification shows on the web
// and in the app). Most public paths exist in the app with the same name;
// the business-panel ones are translated to the app's screens here.
export function appRouteForLink(link: string): string {
  const path = link.split('#')[0].split('?')[0];

  const company = path.match(/^\/dashboard\/companies\/([^/]+)\/(.*)$/);
  if (company) {
    const [, id, rest] = company;
    if (rest.startsWith('shop/orders')) return `/business/${id}/shop-orders`;
    if (rest.startsWith('shop')) return `/business/${id}/products`;
    if (rest.startsWith('rentals/bookings')) return `/business/${id}/bookings`;
    if (rest.startsWith('rentals')) return `/business/${id}/rentals`;
    if (rest.startsWith('orders')) return `/business/${id}/orders`;
    return `/business/${id}`;
  }
  if (path === '/dashboard/compras') return '/tienda/pedidos';
  if (path === '/dashboard/reservas') return '/alquiler/reservas';
  if (path.startsWith('/dashboard')) return '/dashboard';
  return path || '/';
}
