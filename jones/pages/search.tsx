import type { ProductComponentType } from "src/types/shared";
import { NextPage, GetServerSideProps } from "next";
import SEO from "@Components/common/SEO";
import Constraints from "@Components/products/constraints";
import ProductsGrid from "@Components/products/ProductsGrid";
import { getSearchResults } from "@Lib/api/products";

const SearchPage: NextPage<SearchPageType> = ({ query, products, count }) => {
  return (
    <div>
      <SEO title={`"${query}"`} />
      <Constraints
        isSearch
        allProductsCount={count}
        currentProductsCount={products.length}
      />

      <div className="results">
        <div className={"results__container"}>
          <ProductsGrid products={products} />
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { search = "", q = "" } = query;
  const searchQuery = (search || q) as string;

  let products: ProductComponentType[] = [];
  let count = 0;

  if (searchQuery) {
    try {
      const data = await getSearchResults(searchQuery);
      products = data.products;
      count = data.total;
    } catch (err) {
      console.error("[SearchPage] Failed to fetch search results:", err);
    }
  }

  return {
    props: {
      query: searchQuery,
      products,
      count,
    },
  };
};

export default SearchPage;

interface SearchPageType {
  query: string;
  products: ProductComponentType[];
  count: number;
}
