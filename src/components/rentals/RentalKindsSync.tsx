'use client';

import { registerRentalKinds, type CustomRentalKind } from '@/lib/rentals/types';

// Makes the admins' rental subcategories known to client components
// (kindsFor / kindLabel). Registers during render so the rest of the page,
// rendered after the layout, already sees them.
export function RentalKindsSync({ kinds }: { kinds: CustomRentalKind[] }) {
  registerRentalKinds(kinds);
  return null;
}
