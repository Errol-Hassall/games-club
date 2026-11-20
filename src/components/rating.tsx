import { Icon } from "#/components/icons";

export function RatingStars({
  rating,
  className = "",
  size = "h-4 w-4",
}: {
  rating: number;
  className?: string;
  size?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-gold ${className}`}
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="star"
          filled={star <= Math.round(rating)}
          className={`${size} ${star <= Math.round(rating) ? "text-gold" : "text-line"}`}
        />
      ))}
    </span>
  );
}

export function AverageRating({
  rating,
  count,
}: {
  rating: number | null;
  count: number;
}) {
  if (rating === null) return null;
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
      <RatingStars rating={rating} />
      {rating.toFixed(1)}
      <span className="font-normal">({count})</span>
    </span>
  );
}
