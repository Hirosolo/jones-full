import type { NextPage, GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import type { ProductComponentType } from "src/types/shared";
import type { BackendCategory } from "src/types/backend";
import { defaultContent, type HomeContent, type SiteContent } from "src/data/defaultContent";

import { getLatestProducts } from "@Lib/api/products";
import { getCategories } from "@Lib/api/catalog";
import { getArticles } from "@Lib/api/articles";
import type { FeaturedArticleItem } from "@Components/home/FeaturedArticleSection";

const CollectionSection = dynamic(
  () => import("@Components/home/CollectionSection")
);
const FeaturedArticleSection = dynamic(
  () => import("@Components/home/FeaturedArticleSection")
);
const ProductsSection = dynamic(
  () => import("@Components/home/ProductsSection")
);
const GenderSection = dynamic(() => import("@Components/home/GenderSection"));
const FaqSection = dynamic(() => import("@Components/home/FaqSection"));

const Home: NextPage<HomePropTypes> = ({
  collectionSection,
  newArrivals,
  bestSellers,
  newArrivalsImgDataUrls,
  bestSellersImgDataUrls,
  categories,
  featuredArticles,
  homeSections,
}) => {
  return (
    <>
      <CollectionSection content={collectionSection} />
      {homeSections.latestProducts.enabled && (
        <ProductsSection
          productImageDataUrls={newArrivalsImgDataUrls}
          products={newArrivals}
          title={homeSections.latestProducts.title}
          subtitle={homeSections.latestProducts.subtitle}
          url="/category/new"
        />
      )}
      <GenderSection categories={categories} content={homeSections.categories} />
      {homeSections.bestsellers.enabled && (
        <ProductsSection
          productImageDataUrls={bestSellersImgDataUrls}
          products={bestSellers}
          title={homeSections.bestsellers.title}
          subtitle={homeSections.bestsellers.subtitle}
          url="/category/new?sort=best"
        />
      )}
      {homeSections.featuredArticles.enabled && (
        <FeaturedArticleSection
          content={homeSections.featuredArticles}
          articles={featuredArticles}
        />
      )}
      <FaqSection content={homeSections.faq} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  let products: ProductComponentType[] = [];
  let categories: BackendCategory[] = [];
  let featuredArticles: FeaturedArticleItem[] = [];
  let homeSections: HomeContent = defaultContent.home;

  try {
    products = await getLatestProducts();
  } catch (err) {
    console.error("[Home] Failed to fetch latest products:", err);
  }

  try {
    categories = await getCategories();
  } catch (err) {
    console.error("[Home] Failed to fetch categories:", err);
  }

  try {
    const response = await getArticles({ page_size: 48 });
    featuredArticles = response.articles.slice(0, 6).map((article) => ({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      featuredImage: article.featuredImage,
    }));
  } catch (err) {
    console.error("[Home] Failed to fetch featured articles:", err);
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/api/shop/cms/site-content/`, { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json().catch(() => ({}))) as Partial<SiteContent>;
      homeSections = {
        ...defaultContent.home,
        ...(data.home || {}),
      } as HomeContent;
    }
  } catch (err) {
    console.error("[Home] Failed to fetch CMS content:", err);
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
      collectionSection: homeSections.collections,
      newArrivals,
      bestSellers,
      newArrivalsImgDataUrls,
      bestSellersImgDataUrls,
      categories,
      featuredArticles,
      homeSections,
    },
  };
};

export default Home;

interface HomePropTypes {
  collectionSection: HomeContent['collections'];
  newArrivals: ProductComponentType[];
  bestSellers: ProductComponentType[];
  newArrivalsImgDataUrls: Record<string, string>;
  bestSellersImgDataUrls: Record<string, string>;
  categories: BackendCategory[];
  featuredArticles: FeaturedArticleItem[];
  homeSections: HomeContent;
}
