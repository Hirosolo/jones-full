import type { ProductComponentType } from "src/types/shared";
import { NextPage, GetStaticProps, GetStaticPaths } from "next";
import SEO from "@Components/common/SEO";
import { useCurrencyFormatter } from "@Contexts/UIContext";
import { getLatestProducts, getProductDetail, getSitemapProducts } from "@Lib/api/products";
import { ProductPlaceholderImg } from "src/constants";
import ProductsGrid from "@Components/products/ProductsGrid";
import ShareButton from "@Components/common/ShareButton";
import ProductGallery from "@Components/products/ProductGallery";
import ProductCartForm from "@Components/products/ProductCartForm";
import ProductDetails from "@Components/products/ProductDetails";
import RatingStars from "@Components/common/RatingStars";

const ProductPage: NextPage<ProductPageType> = ({
  product,
  relatedProducts,
  imageDimensions,
  blurDataUrls,
}) => {
  const format = useCurrencyFormatter();

  if (!product) {
    return <div>Product not found</div>;
  }

  const {
    id,
    title,
    gender,
    price,
    discount,
    sku,
    year,
    color,
    salesCount,
    type,
    ratings,
  } = product;

  const cartPrice = (price - discount) * 1;
  const percentageOff = discount
    ? `${Math.floor((discount / price) * 100)}% off`
    : "";

  return (
    <>
      <SEO title={product.title} />

      <div className="product-view">
        <ProductGallery
          key={`gallery-${id}`}
          product={product}
          images={product.mediaURLs}
          dimensions={imageDimensions}
          blurDataUrls={blurDataUrls}
        />

        <div className="product-view__cart">
          <p className="product-view__gender">{gender}</p>
          <h1 className="product-view__name">{title}</h1>
          <div style={{ marginTop: 8 }}>
            {/** Only show admin edit link when backend numeric id is available */}
            {(product as any).adminId ? (
              <a
                href={`/admin/myshop/product/${(product as any).adminId}/change/`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12 }}
              >
                Edit in admin
              </a>
            ) : null}
          </div>
          <RatingStars count={ratings} />

          <div className="product-view__details">
            <p className="product-view__details-info">
              <strong>Model No.:</strong> {sku.toUpperCase()}
            </p>
            <p className="product-view__details-info">
              <strong>Release Year:</strong> {year}
            </p>
            <p className="product-view__details-info">
              <strong>Upper:</strong> {type.toLocaleLowerCase()} Cut
            </p>
            <p className="product-view__details-info">
              <strong>Colorway:</strong> {color}
            </p>
          </div>

          <p className="product-view__price">
            {format(cartPrice)} <span>{percentageOff}</span>
          </p>

          <p className="product-view__sold">
            {salesCount ?? 0} Sold / Available
          </p>

          <ProductCartForm key={product.id} product={product} />
          <p className="product-view__shipping-info">Shipping is calculated at checkout.</p>

          <ShareButton
            title={product.title}
            description={product.details}
            image={product.mediaURLs[0]}
            hashtags="#jonesstore"
          />
        </div>

        <ProductDetails product={product} />
      </div>

      <div className="related-products">
        {relatedProducts.length ? (
          <>
            <h2 className="related-products__heading">Related <wbr/>Products</h2>
            <ProductsGrid products={relatedProducts} />
          </>
        ) : null}
      </div>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  let paths: { params: { productSlug: string } }[] = [];

  try {
    const sitemap = await getSitemapProducts(1, 100);
    paths = (sitemap.items || []).map((item) => ({
      params: { productSlug: item.slug },
    }));
  } catch (err) {
    console.error("[ProductPage] Failed to fetch sitemap for paths:", err);
  }

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const productSlug = params?.productSlug as string;

  let product: ProductComponentType | null = null;
  let relatedProducts: ProductComponentType[] = [];

  try {
    product = await getProductDetail(productSlug);
  } catch (err) {
    console.error("[ProductPage] Failed to fetch product detail:", err);
  }

  if (!product) {
    return { notFound: true };
  }

  try {
    if (product.relatedProducts?.length) {
      relatedProducts = product.relatedProducts.filter((p) => p.id !== product.id);
    } else {
      const latest = await getLatestProducts();
      relatedProducts = latest.filter((p) => p.id !== product.id);
    }
  } catch (err) {
    console.error("[ProductPage] Failed to fetch related products:", err);
  }

  const blurDataUrls = product.mediaURLs.reduce<Record<string, string>>(
    (acc, url) => {
      acc[url] = ProductPlaceholderImg;
      return acc;
    },
    {}
  );

  const imageDimensions = product.mediaURLs.map(() => ({
    width: 1000,
    height: 1000,
  }));

  return {
    props: {
      product,
      relatedProducts,
      imageDimensions,
      blurDataUrls,
    },
    revalidate: 300,
  };
};

export default ProductPage;

interface ProductPageType {
  product: ProductComponentType;
  relatedProducts: ProductComponentType[];
  imageDimensions: { width: number; height: number }[];
  blurDataUrls: Record<string, string>;
}
