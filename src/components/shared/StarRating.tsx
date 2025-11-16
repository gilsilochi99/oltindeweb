import { Star, StarHalf, StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  className?: string;
  iconClassName?: string;
}

export const StarRating = ({
  rating,
  totalStars = 5,
  className,
  iconClassName,
}: StarRatingProps) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center text-accent", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <StarIcon
          key={`full-${i}`}
          className={cn("w-4 h-4 fill-current", iconClassName)}
        />
      ))}
      {halfStar && (
        <StarHalf
          key="half"
          className={cn("w-4 h-4 fill-current", iconClassName)}
        />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <StarIcon key={`empty-${i}`} className={cn("w-4 h-4", iconClassName)} />
      ))}
    </div>
  );
};
