import dynamic from "next/dynamic";
import { useState, Suspense, CSSProperties } from "react";
import { MoonLoader } from "react-spinners";
import { ProductComponentType } from "src/types/shared";

export default function ProductDetails({ product }: PropTypes) {
  const [tabName, setTabName] = useState<
    "size_guide" | "reviews"
  >("size_guide");

  const tabs: {
    size_guide: JSX.Element;
    reviews: JSX.Element;
  } = {
    size_guide: (
      <Suspense
        fallback={<MoonLoader size={30} cssOverride={cssOverride} />}
      >
        <SizeGuide />
      </Suspense>
    ),
    reviews: (
      <Suspense
        fallback={<MoonLoader size={30} cssOverride={cssOverride} />}
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
              (tabName == "size_guide" ? " product-details__tab--active" : "")
            }
          >
            <button onClick={() => setTabName("size_guide")}>Size Guide</button>
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

const SizeGuide = dynamic(() => import("@Components/SizeGuide"));
const Reviews = dynamic(() => import("@Components/reviews"));

const cssOverride: CSSProperties = {
  margin: "2rem auto 0 auto",
};

interface PropTypes {
  product: ProductComponentType;
}
