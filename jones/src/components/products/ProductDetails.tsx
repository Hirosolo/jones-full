import dynamic from "next/dynamic";
import { useState, Suspense } from "react";
import { ProductComponentType } from "src/types/shared";

export default function ProductDetails({ product }: PropTypes) {
  const [tabName, setTabName] = useState<"description" | "reviews">(
    "description"
  );

  const tabs: {
    description: JSX.Element;
    reviews: JSX.Element;
  } = {
    description: (
      <div
        className="product-details__panel product-description-panel product-description-panel--rich"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: product.descriptionHtml || product.details,
        }}
      />
    ),
    reviews: (
      <Suspense
        fallback={<div className="product-details__loading">Loading...</div>}
      >
        <Reviews productId={product.id} />
      </Suspense>
    ),
  };

  return (
    <div className="product-details">
      <div className="product-details__tabs">
        <ul>
          <li
            className={
              "product-details__tab" +
              (tabName == "description" ? " product-details__tab--active" : "")
            }
          >
            <button onClick={() => setTabName("description")}>
              Description
            </button>
          </li>
          <li
            className={
              "product-details__tab" +
              (tabName == "reviews" ? " product-details__tab--active" : "")
            }
          >
            <button onClick={() => setTabName("reviews")}>Reviews</button>
          </li>
        </ul>
      </div>
      <div className="product-details__body">{tabs[tabName]}</div>
    </div>
  );
}

const Reviews = dynamic(() => import("@Components/reviews"));

interface PropTypes {
  product: ProductComponentType;
}
