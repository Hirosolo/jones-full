import type { ProductComponentType } from "src/types/shared";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  ForwardedRef,
} from "react";

import { HIGHEST_PRICE } from "src/constants";
import { compareObjects, buildProductListingHref, getPathString } from "src/utils";
import Router from "next/router";

export interface filterStateType {
  search?: string;
  sort?: string;
  page: string;
  gender: string;
  category: string;
  brand: string;
  color: string[];
  size: number[];
  height: string[];
  price: [number, number];
  year: number[];
}
export type filterStateKeys = keyof filterStateType;

const _filterState: filterStateType = {
  page: "",
  gender: "",
  category: "",
  brand: "",
  color: [],
  size: [],
  height: [],
  price: [0, HIGHEST_PRICE] as [number, number],
  year: [],
};

interface ProductStateType {
  products: ProductComponentType[];
  filterState: filterStateType;
  sortBy: string;
  productImagePlaceholders: Record<string, string>;
  filterListings: (action: { [type: string]: unknown }) => void;
  sortListings: (sortBy: string) => void;
  clearFilters: () => void;
}

const ProductsState: ProductStateType = {
  products: [],
  filterState: _filterState,
  sortBy: "",
  productImagePlaceholders: {},
  filterListings: () => null,
  sortListings: () => null,
  clearFilters: () => null,
};

const getGenderPredicate =
  (gender: string) => (product: ProductComponentType) =>
    product.gender == gender;

const getColorPredicate =
  (colors: string[]) => (product: ProductComponentType) =>
    colors.includes(product.color);

const getSizesPredicate =
  (sizes: number[]) => (product: ProductComponentType) =>
    sizes.some((size) => product.sizes.includes(Number(size)));

const getHeightPredicate =
  (height: string[]) => (product: ProductComponentType) =>
    height.includes(product.type);

const getPricePredicate =
  ([minPrice, maxPrice]: [minPrice: number, maxPrice: number]) =>
  (product: ProductComponentType) => {
    if (maxPrice >= HIGHEST_PRICE) {
      return product.price >= minPrice;
    }
    return product.price >= minPrice && product.price <= maxPrice;
  };

const getYearPredicate = (years: number[]) => (product: ProductComponentType) =>
  years.includes(product.year ?? new Date().getFullYear());

const getSearchPredicate =
  (search: string) => (product: ProductComponentType) => {
    const pattern = new RegExp(
      search
        .split("-")
        .map((word) => `(?=.*${word})`)
        .join("")
    );
    return pattern.test(product.title.toLowerCase());
  };

const getCategoryPredicate =
  (category: string) => (product: ProductComponentType) =>
    getPathString(product.categoryName || "") === category;

const getBrandPredicate =
  (brand: string) => (product: ProductComponentType) =>
    getPathString(product.brandName || "") === brand;

interface FilterPredicateType<T> {
  (value: T, index: number, array: T[]): boolean | unknown;
}
const compose = <T extends unknown>(...predicates: FilterPredicateType<T>[]) =>
  predicates.reduceRight<FilterPredicateType<T>>(
    (acc, current) => (value, index, array) =>
      acc(value, index, array) && current(value, index, array),
    () => true
  );

const actions: { [type: string]: Function } = {
  page: () => () => true,
  search: getSearchPredicate,
  gender: getGenderPredicate,
  category: getCategoryPredicate,
  brand: getBrandPredicate,
  color: getColorPredicate,
  size: getSizesPredicate,
  height: getHeightPredicate,
  price: getPricePredicate,
  year: getYearPredicate,
};

const ProductsContext = createContext<ProductStateType>(ProductsState);

export const useProductsState = () => useContext(ProductsContext);

function ProductsProvider(
  {
    products,
    children,
    preFilter = {},
    productImagePlaceholders,
  }: {
    products: ProductComponentType[];
    children: ReactNode;
    preFilter?: Partial<filterStateType>;
    productImagePlaceholders: ProductStateType["productImagePlaceholders"];
  },
  ref: ForwardedRef<{ updateFilterState: Function } | null>
) {
  const filterState = useRef<filterStateType>({
    ..._filterState,
    ...preFilter,
  });
  const sortByRef = useRef("");
  const getFilteredListings = () => {
    const combinedPredicates = compose<ProductComponentType>(
      ...Object.keys(filterState.current).map((type) => {
        const value =
          filterState.current[type as keyof typeof filterState.current];
        if (type != "sort" && value && value.length) {
          return actions[type](value);
        }
        return () => true;
      })
    );

    return products.filter(combinedPredicates);
  };

  const filterListings = (action: { [type: string]: unknown }) => {
    filterState.current = { ...filterState.current, ...action };
    setProductListing(getFilteredListings());

    Router.replace(
      buildProductListingHref(
        filterState.current as unknown as Record<
          string,
          string | number | Array<string | number> | undefined
        >
      ),
      undefined,
      {
        scroll: false,
        shallow: true,
      }
    );
  };

  const clearFilters = () => {
    filterState.current = { ..._filterState };
    setProductListing(getFilteredListings());

    Router.replace("/p", undefined, {
      scroll: false,
      shallow: true,
    });
  };

  const sortListings = (sortBy: string) => {
    sortByRef.current = sortBy;

    let compare: (
      a: ProductComponentType,
      b: ProductComponentType
    ) => number = (aProduct, bProduct) =>
      new Date(bProduct.dateAdded).valueOf() -
      new Date(aProduct.dateAdded).valueOf();
    if (sortBy == "asc_price") {
      compare = (aProduct, bProduct) => aProduct.price - bProduct.price;
    } else if (sortBy == "price") {
      compare = (aProduct, bProduct) => bProduct.price - aProduct.price;
    } else if (sortBy == "asc_ratings") {
      compare = (aProduct, bProduct) => aProduct.ratings - bProduct.ratings;
    } else if (sortBy == "ratings") {
      compare = (aProduct, bProduct) => bProduct.ratings - aProduct.ratings;
    } else if (sortBy == "year_new") {
      compare = (aProduct, bProduct) =>
        (bProduct.year ?? 0) - (aProduct.year ?? 0);
    } else if (sortBy == "year_old") {
      compare = (aProduct, bProduct) =>
        (aProduct.year ?? 0) - (bProduct.year ?? 0);
    } else if (sortBy == "best") {
      compare = (aProduct, bProduct) =>
        bProduct.salesCount - aProduct.salesCount;
    }

    setProductListing((listings) => [...listings].sort(compare));
  };

  const [productListing, setProductListing] = useState(getFilteredListings());

  useEffect(() => {
    filterState.current = {
      ..._filterState,
      ...preFilter,
    };
    sortByRef.current = filterState.current.sort ?? "";
    setProductListing(getFilteredListings());

    if (sortByRef.current) {
      sortListings(sortByRef.current);
    }
  }, [products]);

  useImperativeHandle(ref, () => ({
    updateFilterState: (preFilter: Partial<filterStateType>) => {
      const filterStateUpdated = { ..._filterState, ...preFilter };

      if (!compareObjects(filterState.current, filterStateUpdated)) {
        filterState.current = filterStateUpdated;
        setProductListing(getFilteredListings());
        sortByRef.current = filterState.current.sort ?? "";
        if (sortByRef.current) sortListings(sortByRef.current);
      }
    },
  }));

  return (
    <ProductsContext.Provider
      value={{
        filterListings,
        sortListings,
        clearFilters,
        products: productListing,
        productImagePlaceholders,
        filterState: filterState.current,
        sortBy: sortByRef.current,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export default forwardRef(ProductsProvider);
