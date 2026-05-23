import type { NextPage, GetStaticProps } from "next";
import dynamic from "next/dynamic";
import type { ProductComponentType } from "src/types/shared";

import { getLatestProducts, getBestSellers } from "@Lib/api/products";

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
  let newArrivals: ProductComponentType[] = [];
  let bestSellers: ProductComponentType[] = [];

  try {
    newArrivals = await getLatestProducts();
  } catch (err) {
    console.error("[Home] Failed to fetch latest products:", err);
  }

  try {
    bestSellers = await getBestSellers();
  } catch (err) {
    console.error("[Home] Failed to fetch best sellers:", err);
  }

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
