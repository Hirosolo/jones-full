import { useEffect, useState } from "react";
import type { Review as ReviewType } from "src/types/shared";
import RatingStars from "../common/RatingStars";
import Review from "./Review";

import { getReviews } from "@Lib/api/reviews";

export default function Reviews({ productId }: PropTypes) {
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadReviews() {
      setLoading(true);
      try {
        const data = await getReviews(productId);
        if (!mounted) return;
        setReviews(data);
      } catch (err) {
        if (!mounted) return;
        console.error("[Reviews] Failed to fetch reviews:", err);
        setReviews([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReviews();

    return () => {
      mounted = false;
    };
  }, [productId]);

  const averageRatings =
    reviews.reduce((total, { rating }) => total + rating, 0) /
    (reviews.length || 1);

  if (loading) {
    return (
      <div className="product-details__panel product-details__reviews-panel">
        <p className="product-details__prompt">Please wait while loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="product-details__panel product-details__reviews-panel">
      <div className="reviews">
        <div className="reviews__avg-ratings">
          Average Rating: <RatingStars count={averageRatings} />{" "}
          {averageRatings.toFixed(1)} ({reviews.length} Customer Reviews)
        </div>
        {!reviews.length ? (
          <p className="product-details__prompt">No reviews yet.</p>
        ) : null}
        <ul className="reviews__list">
          {reviews.map((review, index) => (
            <li
              key={`${review.userId}-${review.addedAt}-${index}`}
              className="reviews__item"
            >
              <Review {...review} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface PropTypes {
  productId: string;
}
