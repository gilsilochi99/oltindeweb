import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12.06 0C5.4 0 0 5.4 0 12.06c0 3.48 1.5 6.6 3.96 8.76L0 24l3.3-3.84c2.04 1.44 4.5 2.28 7.08 2.28h.06c6.66 0 12.06-5.4 12.06-12.06C24.18 5.4 18.72 0 12.06 0zm0 0" />
    <path
      d="M12.06 22.92c-5.94 0-10.8-4.86-10.8-10.8 0-2.94 1.2-5.58 3.12-7.5l-2.1-2.46 2.58-2.22 2.22 2.58c1.92-1.2 4.14-1.92 6.54-1.92h.06c5.94 0 10.8 4.86 10.8 10.8-.06 5.94-4.86 10.8-10.8 10.8zm0 0"
      fill="#fff"
    />
    <path
      d="M18.9 15.3c-.42-.24-2.52-1.2-2.88-1.38-.42-.18-.72-.24-.96.24-.3.42-.96 1.38-1.2 1.62-.24.24-.48.3-.9.06-.42-.24-1.8-1.14-3.42-2.94-1.26-1.44-2.1-3.24-2.4-3.78-.3-.54-.06-.84.18-1.08.18-.18.42-.48.6-.72s.24-.42.36-.72c.12-.24.06-.48 0-.72-.12-.24-.96-2.4-.96-2.4s-.3-.24-.6-.24h-.36c-.3 0-.66.06-1.02.42-.36.36-1.38 1.38-1.38 3.3 0 1.92 1.44 3.84 1.62 4.08.18.24 2.76 4.44 6.72 5.88 1.02.36 1.8.42 2.4.36.66-.06 2.52-1.02 2.52-1.02s.42-.48.18-.9zm0 0"
      fill="#fff"
    />
  </svg>
);

export function toWhatsAppHref(value: string, text?: string): string {
  const base = value.startsWith('http') ? value : `https://wa.me/${value}`;
  if (!text) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}text=${encodeURIComponent(text)}`;
}

interface WhatsAppButtonProps {
  value?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'icon' | 'default';
  className?: string;
}

export function WhatsAppButton({ value, variant = 'default', size = 'icon', className }: WhatsAppButtonProps) {
  if (!value) return null;
  return (
    <Button variant={variant} size={size} className={cn(className)} asChild>
      <a href={toWhatsAppHref(value)} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon className="h-4 w-4 fill-current" />
      </a>
    </Button>
  );
}
