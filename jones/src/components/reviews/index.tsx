import Link from "next/link";
import { useState, useEffect } from "react";
import type { User, Review as ReviewType } from "src/types/shared";
import { Role } from "src/types/shared";
import { toast } from "react-toastify";

import Button from "../formControls/Button";
import TextField from "../formControls/TextField";
import Form from "../common/Form";
import RatingStars from "../common/RatingStars";
import Modal from "../Modal";
import Review from "./Review";

import { useAuthState } from "@Contexts/AuthContext";
import { createReview, getReviews } from "@Lib/api/reviews";

export default function Reviews({ productId }: PropTypes) {
  const [reviewModal, setReviewModal] = useState(false);
  const [reviews, setReviews] = useState<(ReviewType & { user: User })[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthState();

  useEffect(() => {
    let mounted = true;

    async function loadReviews() {
      setLoading(true);
      try {
        const data = await getReviews(productId);
        if (!mounted) return;
        setReviews(
          data.map((review) => ({
            ...review,
            user: {
              id: review.userId || "anonymous",
              username: review.userId || "Anonymous",
              email: "",
              role: Role.USER,
            },
          }))
        );
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
      {user?.isAuth ? (
        <>
          <Button onClick={() => setReviewModal(true)}>Write A Review</Button>{" "}
          <Modal
            title="Write Review"
            visible={reviewModal}
            onClose={() => setReviewModal(false)}
          >
            <div className="product-details__reviews-form">
              <Form
                method="POST"
                action="#"
                beforeSubmit={async (params) => {
                  const rating = Number(params.rating || 0);
                  if (!rating) {
                    toast("Please select a rating first", { type: "error" });
                    return [params, false];
                  }

                  try {
                    const response = await createReview({
                      product_code: productId,
                      rating,
                      subject: String(params.subject || ""),
                      content: String(params.body || ""),
                    });

                    if (!response?.ok) {
                      toast(response?.msg || "Failed to submit review", {
                        type: "error",
                      });
                      return [params, false];
                    }

                    const data = await getReviews(productId);
                    setReviews(
                      data.map((review) => ({
                        ...review,
                        user: {
                          id: review.userId || "anonymous",
                          username: review.userId || "Anonymous",
                          email: "",
                          role: Role.USER,
                        },
                      }))
                    );
                    toast("Review submitted", { type: "success" });
                    setReviewModal(false);
                  } catch (err) {
                    console.error("[Reviews] Failed to submit review:", err);
                    toast("Failed to submit review", { type: "error" });
                  }

                  return [params, false];
                }}
              >
                <RatingStars interactive />
                <TextField name="subject" label="Title" />
                <TextField name="body" multiline label="Your review" />
                <Button>Submit Review</Button>
              </Form>
            </div>
          </Modal>{" "}
        </>
      ) : (
        <p className="product-details__prompt">
          Please{" "}
          <Link href="/signin">
            <a className="product-details__link">login</a>
          </Link>{" "}
          to submit a review.
        </p>
      )}
      <div className="reviews">
        <div className="reviews__avg-ratings">
          Average Rating: <RatingStars count={averageRatings} />{" "}
          {averageRatings.toFixed(1)} ({reviews.length} Customer Reviews)
        </div>
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
