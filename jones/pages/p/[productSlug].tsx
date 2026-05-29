import type { ProductComponentType } from "src/types/shared";
import { NextPage, GetStaticProps, GetStaticPaths } from "next";
import SEO from "@Components/common/SEO";
import { useCurrencyFormatter } from "@Contexts/UIContext";
import { DJANGO_BASE_URL, DOMAIN_NAME } from "@Lib/config";
import { getLatestProducts, getProductDetail, getSitemapProducts } from "@Lib/api/products";
import { ProductPlaceholderImg } from "src/constants";
import ProductsGrid from "@Components/products/ProductsGrid";
import ShareButton from "@Components/common/ShareButton";
import ProductGallery from "@Components/products/ProductGallery";
import ProductCartForm from "@Components/products/ProductCartForm";
import ProductDetails from "@Components/products/ProductDetails";
import RatingStars from "@Components/common/RatingStars";

async function resolveAliasSlug(productSlug: string): Promise<string | null> {
  try {
    const response = await fetch(`${DJANGO_BASE_URL}/api/shop/product-slug-aliases/`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => ({}))) as { aliases?: Record<string, string> };
    const mappedSlug = payload.aliases?.[productSlug];

    return mappedSlug && mappedSlug !== productSlug ? mappedSlug : null;
  } catch (error) {
    console.error("[ProductPage] Failed to resolve slug alias:", error);
    return null;
  }
}

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
    price,
    discount,
    salesCount,
    ratings,
    categoryName,
    brandName,
    isAvailable,
    tags,
    productReviewCount,
    productAverageRating,
  } = product;

  const salePrice = price;
  const originalPrice = discount ? price + discount : price;
  const percentageOff = discount
    ? `${Math.floor((discount / originalPrice) * 100)}% off`
    : "";
  const productTags = tags || [];
  const availabilityLabel = isAvailable
    ? "In stock"
    : "Out of stock";
  const shortDescription = product.details
    ? product.details.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
    : "";
  const canonicalUrl = `${DOMAIN_NAME.replace(/\/$/, "")}/p/${product.slug || product.id}`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: shortDescription || title,
    image: product.mediaURLs,
    brand: brandName ? { "@type": "Brand", name: brandName } : undefined,
    sku: String(product.id),
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: salePrice,
      availability: isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: canonicalUrl,
    },
  };

  return (
    <>
      <SEO
        title={product.title}
        description={shortDescription || `${title} available now at Jones.`}
        canonical={canonicalUrl}
        ogImage={product.mediaURLs[0] || "/assets/images/banner-bg-eindhoven.webp"}
        jsonLd={productJsonLd}
      />

      <div className="product-view">
        <ProductGallery
          key={`gallery-${id}`}
          product={product}
          images={product.mediaURLs}
          dimensions={imageDimensions}
          blurDataUrls={blurDataUrls}
        />

        <div className="product-view__cart">
          <h1 className="product-view__name">{title}</h1>
          <div className="product-view__separator" />
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

          <div className="product-view__pricing">
            {discount ? (
              <span className="product-view__sale-badge">{percentageOff}</span>
            ) : null}
            <p className="product-view__price product-view__price--sale">
              <span className="product-view__sale-price">{format(salePrice)}</span>
              {discount ? (
                <span className="product-view__original-price">{format(originalPrice)}</span>
              ) : null}
            </p>
            {discount ? (
              <p className="product-view__deal-copy">
                Limited-time offer — you save {format(discount)} today.
              </p>
            ) : (
              <p className="product-view__deal-copy">Best price available right now.</p>
            )}
          </div>

          <RatingStars count={productAverageRating ?? ratings} />

          <div className="product-view__details">
            <p className="product-view__details-info">
              <strong>Brand:</strong> {brandName || "N/A"}
            </p>
            <p className="product-view__details-info">
              <strong>Category:</strong> {categoryName || "N/A"}
            </p>
            <p className="product-view__details-info">
              <strong>Availability:</strong> {availabilityLabel}
            </p>
            <p className="product-view__details-info">
              <strong>Reviews:</strong> {productReviewCount ?? 0}
            </p>
            <div className="product-view__details-info product-view__tags-row">
              <strong>Tags:</strong>
              <div className="product-view__tags">
                {productTags.length ? (
                  productTags.map((tag) => (
                    <span className="product-view__tag" key={tag}>
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span>N/A</span>
                )}
              </div>
            </div>
          </div>

          <p className="product-view__sold">
            {salesCount ?? 0} Sold / Available
          </p>

          <div className="product-view__separator" />

          {shortDescription ? (
            <p className="product-view__summary">{shortDescription}</p>
          ) : null}

          <div className="product-view__separator" />

          <a
            className="product-view__buy"
            href={product.url || `/p/${product.slug || product.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy now
          </a>

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
  const requestedSlug = params?.productSlug as string;

  let resolvedSlug = requestedSlug;
  let product: ProductComponentType | null = null;
  let relatedProducts: ProductComponentType[] = [];

  try {
    product = await getProductDetail(resolvedSlug);

    if (!product) {
      const aliasSlug = await resolveAliasSlug(requestedSlug);

      if (aliasSlug) {
        resolvedSlug = aliasSlug;
        product = await getProductDetail(resolvedSlug);
      }
    }
  } catch (err) {
    console.error("[ProductPage] Failed to fetch product detail:", err);
  }

  if (!product) {
    return { notFound: true };
  }

  try {
    if (product.relatedProducts?.length) {
      relatedProducts = product.relatedProducts.filter((p) => p.id !== product!.id);
    } else {
      const latest = await getLatestProducts();
      relatedProducts = latest.filter((p) => p.id !== product!.id);
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