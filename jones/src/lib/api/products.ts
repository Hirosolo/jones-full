import { http } from "@Lib/apiClient";
import type {
  BackendProduct,
  BackendProductDetail,
  BackendCategoryProductResponse,
  BackendBrandProductResponse,
  BackendTagProductResponse,
  BackendSearchResponse,
  BackendReview,
  BackendSitemapProductResponse,
} from "src/types/backend";
import { transformProduct, transformProductDetail, transformReview } from "@Lib/transformers";
import type { ProductComponentType, Review } from "src/types/shared";

// ─── Public Product APIs (no auth required) ───

export async function getProductsByCategory(
  slug: string,
  params?: { page?: number; page_size?: number; brand?: string; color?: string; size?: string }
): Promise<{ category: { name: string; slug: string; desc?: string; image?: string }; products: ProductComponentType[]; total: number }> {
  const data = await http.get<BackendCategoryProductResponse & { items?: BackendCategoryProductResponse; total?: number }>("/api/shop/category-product-list/", {
    searchParams: { slug, ...params },
  });
  const payload = data && "items" in data && data.items ? data.items : data;
  return {
    category: {
      name: payload.category?.name || slug,
      slug: payload.category?.slug || slug,
      desc: payload.category?.desc,
      image: payload.category?.image,
    },
    products: (payload.products || []).map(transformProduct),
    total: payload.total ?? (payload.products?.length || 0),
  };
}

export async function getProductsByBrand(
  slug: string,
  params?: { page?: number; page_size?: number; category?: string; color?: string; size?: string }
): Promise<{ brand: { name: string; slug: string; logo?: string }; products: ProductComponentType[]; total: number }> {
  const data = await http.get<BackendBrandProductResponse>("/api/shop/brand-product-list/", {
    searchParams: { slug, ...params },
  });
  return {
    brand: {
      name: data.brand?.name || slug,
      slug: data.brand?.slug || slug,
      logo: data.brand?.logo,
    },
    products: (data.products || []).map(transformProduct),
    total: data.products?.length || 0,
  };
}

export async function getProductsByTag(
  slug: string,
  params?: { page?: number; page_size?: number }
): Promise<{ tag: { name: string; slug: string }; products: ProductComponentType[]; total: number }> {
  const data = await http.get<BackendTagProductResponse>("/api/shop/tag-product-list/", {
    searchParams: { slug, ...params },
  });
  return {
    tag: {
      name: data.tags?.name || slug,
      slug: data.tags?.slug || slug,
    },
    products: (data.products || []).map(transformProduct),
    total: data.products?.length || 0,
  };
}

export async function getProductDetail(slug: string): Promise<ProductComponentType | null> {
  try {
    const data = await http.get<BackendProductDetail>("/api/shop/product-detail/", {
      searchParams: { slug },
    });
    if (!data || (data as any).ok === false) return null;
    return transformProductDetail(data);
  } catch {
    return null;
  }
}

export async function getBestSellers(): Promise<ProductComponentType[]> {
  const data = await http.get<BackendProduct[]>("/api/shop/best-selling-products/");
  return (data || []).map(transformProduct);
}

export async function getLatestProducts(): Promise<ProductComponentType[]> {
  const data = await http.get<BackendProduct[]>("/api/shop/latest-products/");
  return (data || []).map(transformProduct);
}

export async function getFeaturedProducts(): Promise<ProductComponentType[]> {
  const data = await http.get<BackendProduct[]>("/api/shop/featured-products/");
  return (data || []).map(transformProduct);
}

export async function getWeeklyBestsellers(): Promise<ProductComponentType[]> {
  const data = await http.get<BackendProduct[]>("/api/shop/weekly-bestsellers/");
  return (data || []).map(transformProduct);
}

export async function getSearchResults(
  q: string,
  page = 1,
  page_size = 10
): Promise<{ products: ProductComponentType[]; total: number; current: number; numPages: number }> {
  const data = await http.get<BackendSearchResponse>("/api/shop/search-products/", {
    searchParams: { q, page, page_size },
  });
  return {
    products: (data.items || []).map(transformProduct),
    total: data.total || 0,
    current: data.current || 1,
    numPages: data.numPages || 1,
  };
}

export async function getProductReviews(productSlug: string): Promise<Review[]> {
  const data = await http.get<BackendReview[]>("/api/shop/product-review/", {
    searchParams: { product_slug: productSlug },
  });
  return (data || []).map(transformReview);
}

export async function getSitemapProducts(
  page = 1,
  page_size = 500
): Promise<BackendSitemapProductResponse> {
  return http.get("/api/shop/sitemap-products/", {
    searchParams: { page, page_size },
  });
}
