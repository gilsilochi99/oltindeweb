import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Review } from "@/lib/types";
import { Star, StarHalf, UserCircle } from "lucide-react";

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

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCircle className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="font-semibold">{review.author}</p>
              <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <StarRating rating={review.rating} />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-foreground/80">{review.comment}</p>
      </CardContent>
    </Card>
  );
}
