import { http } from "@Lib/apiClient";
import type { BackendReview } from "src/types/backend";
import { transformReview } from "@Lib/transformers";
import type { Review } from "src/types/shared";

export async function getReviews(productSlug: string): Promise<Review[]> {
  const data = await http.get<BackendReview[]>("/api/shop/product-review/", {
    searchParams: { product_slug: productSlug },
  });
  return (data || []).map(transformReview);
}

export async function createReview(data: {
  product_code?: string;
  product_slug?: string;
  rating: number;
  reviewer_name?: string;
  subject?: string;
  content?: string;
}): Promise<{ ok: boolean; msg?: string }> {
  return http.post("/api/shop/product-review-create/", data);
}
