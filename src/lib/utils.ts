
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Masks all but the first 6 digits of a phone number for display in
// listing cards (privacy/anti-scraping teaser); the full number is still
// shown on the detail page.
export function maskPhone(phone?: string | null): string {
  if (!phone) return '';
  let visibleDigits = 0;
  return phone.replace(/\d/g, (digit) => {
    visibleDigits++;
    return visibleDigits <= 6 ? digit : '•';
  });
}
