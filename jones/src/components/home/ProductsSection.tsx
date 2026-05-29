import type { ProductComponentType } from "src/types/shared";

import Link from "next/link";
import { useRef } from "react";
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
} from "react-icons/bs";

import Product from "../common/Product";

export default function ProductsSection({
  title,
  subtitle,
  products,
  url,
  productImageDataUrls,
}: PropTypes) {
  const productsComponent = products.map((product, index) => (
    <Product
      {...product}
      key={`${product.id}-${index}`}
      blurDataUrl={productImageDataUrls[product.id]}
      priority={false}
      loading="lazy"
    />
  ));
  const listRef = useRef<HTMLUListElement>(null);

  const scrollProducts = (direction: -1 | 1) => {
    const list = listRef.current;
    if (!list) return;

    list.scrollBy({
      left: direction * list.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <section className="products-section">
      <div className="products-section__container">
        <h2 className="products-section__heading">{title}</h2>
        {subtitle ? <p className="products-section__subheading">{subtitle}</p> : null}
        <ul ref={listRef} className="products-section__products">
          {productsComponent}
        </ul>
        <div className="products-section__scroll">
          <button
            aria-label="previous product"
            className="products-section__scroll-button"
            onClick={() => scrollProducts(-1)}
          >
            <BsFillArrowLeftCircleFill />
          </button>
          <button
            aria-label="next product"
            className="products-section__scroll-button"
            onClick={() => scrollProducts(1)}
          >
            <BsFillArrowRightCircleFill />
          </button>
        </div>
        <p className="products-section__products-link">
          <Link href={url}>
            <a>View All {title}</a>
          </Link>
        </p>
      </div>
    </section>
  );
}

interface PropTypes {
  title: string;
  subtitle?: string;
  products: ProductComponentType[];
  url: string;
  productImageDataUrls: Record<string, string>;
}
