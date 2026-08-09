import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Review } from "@/lib/types";
import { Star, StarHalf, UserCircle } from "lucide-react";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.38l4.01-3.1z" />
      <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.62l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77z" />
    </svg>
  );
}

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center text-accent">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 fill-current" />
      ))}
      {halfStar && <StarHalf key="half" className="w-4 h-4 fill-current" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4" />
      ))}
    </div>
  );
};

export function ReviewCard({ review, replyAuthorName, children }: { review: Review; replyAuthorName?: string; children?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCircle className="w-8 h-8 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold">{review.author}</p>
                {review.source === 'google' && (
                  <span className="inline-flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded-full text-[10px] font-medium text-muted-foreground">
                    <GoogleIcon className="w-3 h-3" />
                    Google
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <StarRating rating={review.rating} />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-foreground/80">{review.comment}</p>
        {review.reply && (
          <div className="mt-3 ml-4 pl-4 border-l-2 border-muted">
            <p className="text-xs font-semibold">Respuesta de {replyAuthorName || 'el propietario'}</p>
            <p className="text-xs text-muted-foreground mb-1">{new Date(review.reply.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-sm text-foreground/80">{review.reply.comment}</p>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
