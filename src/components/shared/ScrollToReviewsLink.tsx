'use client';

import { MaterialIcon } from './detail/MaterialIcon';
import { stitch } from './detail/stitch-tokens';

// Plain `<a href="#id">` can't work here: the reviews section renders twice
// (StitchDetailKit's mobileEnd duplicate-and-hide pattern — see DetailShell)
// with two different ids, and only one is ever actually laid out at a given
// breakpoint. `display:none` elements aren't valid scroll targets, so we
// scroll to whichever of the two candidate ids is actually visible.
export function ScrollToReviewsLink({ ids }: { ids: string[] }) {
  const handleClick = () => {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.offsetParent !== null) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full mt-4 border py-2.5 rounded text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#eeeeee] transition-colors"
      style={{ borderColor: stitch.outline, color: stitch.secondary }}
    >
      <MaterialIcon name="edit_note" className="!text-[18px]" /> Escribir una Reseña
    </button>
  );
}
