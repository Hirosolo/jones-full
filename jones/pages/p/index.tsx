import type { GetStaticProps, NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Router, useRouter } from "next/router";

import SEO from "@Components/common/SEO";
import Constraints from "@Components/products/constraints";
import ProductsGrid from "@Components/products/ProductsGrid";
import ProductsProvider, {
  filterStateType,
  useProductsState,
} from "@Contexts/ProductsContext";
import { useDialog } from "@Contexts/UIContext";
import { HIGHEST_PRICE, ProductPlaceholderImg } from "src/constants";
import { getAllProducts } from "@Lib/api/products";
import type { ProductComponentType } from "src/types/shared";

const FilterAccordion = dynamic(
  () => import("@Components/products/filter/FilterAccordion"),
  { ssr: false }
);
const FilterSortSection = dynamic(
  () => import("@Components/products/FilterSortSection"),
  { ssr: false }
);

function parseListingQuery(routerQuery: Record<string, string | string[] | undefined>) {
  const preFilter: Partial<filterStateType> = {
    price: [0, HIGHEST_PRICE],
  };

  Object.entries(routerQuery).forEach(([param, value]) => {
    if (!value) {
      return;
    }

    if (param === "size" || param === "year") {
      preFilter[param] = Array.isArray(value)
        ? value.map((item) => Number(item))
        : [Number(value)];
      return;
    }

    if (param === "min_price" && preFilter.price) {
      preFilter.price[0] = Number(value);
      return;
    }

    if (param === "max_price" && preFilter.price) {
      preFilter.price[1] = Number(value);
      return;
    }

    if (param === "color" || param === "height") {
      preFilter[param] = Array.isArray(value) ? value : [value];
      return;
    }

    if (param === "sort" && typeof value === "string") {
      preFilter.sort = value;
      return;
    }

    if (
      param === "gender" ||
      param === "page" ||
      param === "search" ||
      param === "category" ||
      param === "brand"
    ) {
      preFilter[param] = Array.isArray(value) ? value[0] : value;
    }
  });

  return preFilter;
}

function ListingPage() {
  const { products } = useProductsState();
  const [filterActive, setFilterActive] = useState(false);
  const { currentDialog } = useDialog();

  useEffect(() => {
    const toggleScroll = () => {
      if (typeof window !== "undefined" && innerWidth <= 992) {
        document.body.style.overflow = filterActive ? "hidden" : "auto";
      }
    };

    toggleScroll();
    Router.events.on("routeChangeComplete", toggleScroll);
    return () => Router.events.off("routeChangeComplete", toggleScroll);
  }, [filterActive, currentDialog]);

  useEffect(() => {
    if (typeof window !== "undefined" && innerWidth > 992) {
      setFilterActive(true);
    }
  }, []);

  return (
    <>
      <SEO title="All Products" />
      <Constraints allProductsCount={products.length} currentProductsCount={products.length} />
      <FilterSortSection toggleFilter={() => setFilterActive(!filterActive)} />

      <div className="results">
        <FilterAccordion active={filterActive} setState={() => setFilterActive(false)} />

        <div className={"results__container" + (filterActive ? " results__container--filter" : "")}>
          <ProductsGrid products={products} />
        </div>
      </div>
    </>
  );
}

export default function AllProductsPage({
  products,
  productImagePlaceholders,
}: {
  products: ProductComponentType[];
  productImagePlaceholders: Record<string, string>;
}) {
  const router = useRouter();
  const ref = useRef<{ updateFilterState: Function }>(null);

  const preFilter = parseListingQuery(router.query as Record<string, string | string[] | undefined>);

  useEffect(() => {
    ref.current?.updateFilterState?.(preFilter);
  });

  return (
    <ProductsProvider
      ref={ref}
      products={products}
      productImagePlaceholders={productImagePlaceholders}
      preFilter={preFilter}
    >
      <ListingPage />
    </ProductsProvider>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  let products: ProductComponentType[] = [];

  try {
    products = await getAllProducts();
  } catch (error) {
    console.error("[AllProductsPage] Failed to fetch products:", error);
  }

  const productImagePlaceholders = products.reduce<Record<string, string>>(
    (accumulator, product) => {
      accumulator[product.id] = ProductPlaceholderImg;
      return accumulator;
    },
    {}
  );

  return {
    props: {
      products,
      productImagePlaceholders,
    },
    revalidate: 300,
  };
};