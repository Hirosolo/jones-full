import type { ProductComponentType } from "src/types/shared";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Router, useRouter } from "next/router";
import { Gender } from "src/types/shared";
import { GetStaticPaths, GetStaticProps } from "next";

import SEO from "@Components/common/SEO";
import Constraints from "@Components/products/constraints";
import ProductsGrid from "@Components/products/ProductsGrid";

import { HIGHEST_PRICE } from "src/constants";
import { useDialog } from "@Contexts/UIContext";
import ProductsProvider, {
  filterStateType,
  useProductsState,
} from "@Contexts/ProductsContext";
import { getProductsByCategory } from "@Lib/api/products";
import { getCategories } from "@Lib/api/catalog";
import { ProductPlaceholderImg } from "src/constants";
import { getPathString } from "src/utils";

const FilterAccordion = dynamic(
  () => import("@Components/products/filter/FilterAccordion"),
  { ssr: false }
);
const FilterSortSection = dynamic(
  () => import("@Components/products/FilterSortSection"),
  { ssr: false }
);

function CategoryPage({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  const { products } = useProductsState();
  const count = products.length;

  const [filterActive, setFilterActive] = useState(false);
  const { currentDialog } = useDialog();

  useEffect(() => {
    const toggleScroll = () => {
      if (typeof window !== 'undefined' && innerWidth <= 992)
        document.body.style.overflow = filterActive ? "hidden" : "auto";
    };
    toggleScroll();
    Router.events.on("routeChangeComplete", toggleScroll);
    return () => Router.events.off("routeChangeComplete", toggleScroll);
  }, [filterActive, currentDialog]);

  useEffect(() => {
    if (typeof window !== 'undefined' && innerWidth > 992) setFilterActive(true);
  }, []);

  return (
    <>
      <SEO title={categoryName || categoryId} />
      <Constraints allProductsCount={count} currentProductsCount={count} />
      <FilterSortSection toggleFilter={() => setFilterActive(!filterActive)} />

      <div className="results">
        <FilterAccordion
          active={filterActive}
          setState={() => setFilterActive(false)}
        />

        <div
          className={
            "results__container" +
            (filterActive ? " results__container--filter" : "")
          }
        >
          <ProductsGrid products={products} />
        </div>
      </div>
    </>
  );
}

export default function CategoryPageWithContext({
  categoryId,
  categoryName,
  products,
  productImagePlaceholders,
}: {
  categoryId: string;
  categoryName: string;
  products: ProductComponentType[];
  productImagePlaceholders: Record<string, string>;
}) {
  const router = useRouter();
  const ref = useRef<{ updateFilterState: Function }>(null);

  // Client-side fallback: if no products were provided by getStaticProps,
  // attempt a client fetch so we can log and inspect the API response.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (products && products.length > 0) return;
    if (!categoryId) return;

    (async () => {
      try {
        console.debug(`[CategoryPage] client fetch for category="${categoryId}"`);
        const data = await getProductsByCategory(categoryId);
        console.debug(`[CategoryPage] client received ${data.products.length} products for category="${categoryId}"`, data);
      } catch (err) {
        console.error('[CategoryPage] client fetch error', err);
      }
    })();
  }, [categoryId, products]);

  const getQueryAsFilter = () => {
    const queryAsFilter: Partial<filterStateType> = {
      price: [0, HIGHEST_PRICE],
    };

    Object.keys(router.query).forEach((param) => {
      const value = router.query[param];
      if (
        param == "categoryId" &&
        value &&
        value[0] &&
        Gender[value[0].toUpperCase() as keyof typeof Gender]
      ) {
        queryAsFilter["gender"] = value[0].toUpperCase() as Gender;
        if (value[1]) queryAsFilter["search"] = value[1];
      } else if (
        param == "categoryId" &&
        (value == "colorways" || value == "new")
      ) {
        queryAsFilter["page"] = value;
      }
      if (param == "size" || param == "year") {
        queryAsFilter[param] = Array.isArray(value)
          ? value.map((v) => Number(v))
          : [Number(value)];
      }
      if (param == "min_price" && queryAsFilter["price"]) {
        queryAsFilter["price"][0] = Number(value);
      }
      if (param == "max_price" && queryAsFilter["price"]) {
        queryAsFilter["price"][1] = Number(value);
      }
      if (param == "color" || param == "height") {
        queryAsFilter[param] = Array.isArray(value) ? value : [value ?? ""];
      }
      if (param == "sort" && typeof value == "string") {
        queryAsFilter[param] = value;
      }
    });
    return queryAsFilter;
  };

  useEffect(() => {
    ref.current?.updateFilterState?.(getQueryAsFilter());
  });

  return (
    <ProductsProvider
      productImagePlaceholders={productImagePlaceholders}
      ref={ref}
      preFilter={getQueryAsFilter()}
      products={products}
    >
      <CategoryPage categoryId={categoryId} categoryName={categoryName} />
    </ProductsProvider>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  let paths: { params: { categoryId: string[] } }[] = [];

  try {
    const cats = await getCategories();
    paths = cats.map((c) => ({
        params: { categoryId: [getPathString(c.slug || "all")] },
    }));
  } catch (err) {
    console.error("[CategoryPage] Failed to fetch categories:", err);
  }

  if (!paths.length) {
      paths = [{ params: { categoryId: ["all"] } }];
  }

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async function ({ params }) {
  const [category = "all"] = params?.categoryId as string[]; 

  let products: ProductComponentType[] = [];
  let categoryName = category;
  let resolvedCategory = category;

  try {
    const data = await getProductsByCategory(category);
    resolvedCategory = data.category?.slug || category;
    categoryName = data.category?.name || category;
    products = data.products;
    // Log fetched products for debugging (server-side log during SSG/build)
    try {
      console.log(
        `[CategoryPage] fetched ${products.length} products for category="${resolvedCategory}"`,
        products.slice(0, 5)
      );
    } catch (e) {
      // swallow logging errors to avoid breaking build
      console.error('[CategoryPage] logging error', e);
    }
  } catch (err) {
    console.error("[CategoryPage] Failed to fetch category products:", err);
  }

  const productImagePlaceholders = products.reduce<Record<string, string>>(
    (acc, product) => {
      acc[product.id] = ProductPlaceholderImg;
      return acc;
    },
    {}
  );

  return {
    props: {
      products,
      count: products.length,
      categoryId: resolvedCategory ?? "",
      categoryName,
      productImagePlaceholders,
    },
    revalidate: 300,
  };
};
