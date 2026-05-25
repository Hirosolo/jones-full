import type { NextPage, GetStaticProps } from "next";
import dynamic from "next/dynamic";
import type { ProductComponentType } from "src/types/shared";

import { getLatestProducts } from "@Lib/api/products";

const CollectionSection = dynamic(
  () => import("@Components/home/CollectionSection")
);
const ProductsSection = dynamic(
  () => import("@Components/home/ProductsSection")
);
const GenderSection = dynamic(() => import("@Components/home/GenderSection"));

const Home: NextPage<HomePropTypes> = ({
  newArrivals,
  bestSellers,
  newArrivalsImgDataUrls,
  bestSellersImgDataUrls,
}) => {
  return (
    <>
      <CollectionSection />
      <ProductsSection
        productImageDataUrls={newArrivalsImgDataUrls}
        products={newArrivals}
        title="new arrivals"
        url="/category/new"
      />
      <GenderSection />
      <ProductsSection
        productImageDataUrls={bestSellersImgDataUrls}
        products={bestSellers}
        title="best sellers"
        url="/category/new?sort=best"
      />
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  let products: ProductComponentType[] = [];

  try {
    products = await getLatestProducts();
  } catch (err) {
    console.error("[Home] Failed to fetch latest products:", err);
  }

  const shuffled = [...products];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  const selected = shuffled.slice(0, 16);
  const splitIndex = Math.ceil(selected.length / 2);
  const newArrivals = selected.slice(0, splitIndex);
  const bestSellers = selected.slice(splitIndex);

  const newArrivalsImgDataUrls: Record<string, string> = {};
  const bestSellersImgDataUrls: Record<string, string> = {};

  return {
    props: {
      newArrivals,
      bestSellers,
      newArrivalsImgDataUrls,
      bestSellersImgDataUrls,
    },
    revalidate: 300, // ISR: revalidate every 5 minutes
  };
};

export default Home;

interface HomePropTypes {
  newArrivals: ProductComponentType[];
  bestSellers: ProductComponentType[];
  newArrivalsImgDataUrls: Record<string, string>;
  bestSellersImgDataUrls: Record<string, string>;
}
