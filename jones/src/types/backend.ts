// Backend API response types — mirrors Django DRF serializers
// These are the raw shapes returned by the backend before transformation

// ─── Shared ───

export interface BackendOpenGraph {
  title: string;
  description: string;
  images: string[];
  url: string;
}

export interface BackendCategory {
  name: string;
  slug: string;
  url?: string;
  full_url?: string;
  desc?: string;
  image?: string;
  order?: number;
  num_product?: number;
  open_graph?: BackendOpenGraph;
}

export interface BackendBrand {
  name: string;
  slug: string;
  url?: string;
  full_url?: string;
  logo?: string;
  order?: number;
  num_product?: number;
  open_graph?: BackendOpenGraph;
}

export interface BackendTag {
  name: string;
  slug: string;
  url?: string;
  full_url?: string;
  num_product?: number;
  open_graph?: BackendOpenGraph;
}

// ─── Product Attrs ───

export interface BackendProductAttrItem {
  id: number;
  label: string;
  value: string;
  extra?: string;
  attr_order?: number;
}

export interface BackendProductAttr {
  name: string;
  attr: BackendProductAttrItem[];
}

// ─── Product Images ───

export interface BackendProductPreviewPicture {
  w200: string;
  w400: string;
  w800: string;
}

export interface BackendProductImage {
  id: number;
  order: number;
  created_at: string;
  image_url: string;
  image_thumb_url: string;
  dimension: string;
  size: number;
}

export interface BackendPhotoGalleryItem {
  key: number;
  src: string;
  width: number;
  height: number;
}

// ─── Product ───

export interface BackendProduct {
  name: string;
  slug: string;
  code: string;
  desc_short?: string;
  fake_price?: string;
  price: string;
  preview_picture: BackendProductPreviewPicture;
  attributes: BackendProductAttr[];
  status: string;
  category: BackendCategory;
  brand: BackendBrand;
  tags: BackendTag[];
  url: string;
  full_url: string;
  is_sale: boolean;
  sale_percentage: number;
  is_featured: boolean;
  best_seller: boolean;
  product_review_count: number;
  product_average_rating: number;
  is_wishlisted: boolean;
  times_purchased: number;
}

export interface BackendProductDetail extends BackendProduct {
  desc?: string;
  images: string[];
  thumbnails: BackendPhotoGalleryItem[];
  related_products: BackendProduct[];
  cross_sell: BackendProduct[];
  variants_by_color: Record<
    string,
    {
      color: { name: string; value: string; color_code?: string };
      sizes: {
        size: { name: string; value: string; order?: number };
        sku: string;
        price_origin: string;
        price_promo?: string;
      }[];
    }
  >;
  color_images: Array<{
    alt: string;
    url: string;
    color: { name: string; value: string; color_code?: string };
    order: number;
  }>;
  open_graph: BackendOpenGraph;
}

// ─── Product Variant ───

export interface BackendProductVariant {
  id: number;
  code: string;
  attr_items: { attr: string; label: string; value: string }[];
  price_origin: string;
  price_promo?: string;
  price: string;
}

// ─── Review ───

export interface BackendReviewUser {
  username: string;
  full_name: string;
}

export interface BackendReview {
  id: number;
  user?: BackendReviewUser;
  profile?: BackendReviewUser;
  rating: number;
  subject?: string;
  content_safe?: string;
  created_at: string;
}

// ─── Cart ───

export interface BackendCartAttrItem {
  id: number;
  label: string;
  value: string;
  extra?: string;
  attr_order?: number;
}

export interface BackendCartAttrGroup {
  name: string;
  attr: BackendCartAttrItem[];
}

export interface BackendCartItem {
  id: number;
  product: BackendProduct;
  attr_cart_items: BackendCartAttrGroup[];
  quantity: number;
  customer_note?: string;
  line_total: number;
}

export interface BackendCartResponse {
  ok: boolean;
  cart_items: BackendCartItem[];
  total_quantity: number;
  sub_total: number;
  total_standard_shipping_fee: number;
  total_fast_shipping_fee: number;
}

// ─── Wishlist ───

export interface BackendWishlistItem {
  id: number;
  product: BackendProduct;
  removed: boolean;
  created_at: string;
}

// ─── Order ───

export interface BackendOrderItem {
  id: number;
  product: { name: string; slug: string; code: string; price: string };
  attr_order_items: BackendCartAttrGroup[];
  quantity: number;
  price: string;
  customer_note?: string;
  line_total: number;
}

export interface BackendShippingAddress {
  first_name: string;
  last_name: string;
  email: string;
  street: string;
  state?: string;
  city: string;
  country: string;
  zip_code: string;
}

export interface BackendOrder {
  id: number;
  code: string;
  sub_total: string;
  shipping_fee: number;
  total_amount: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BackendOrderDetail extends BackendOrder {
  items: BackendOrderItem[];
  shipping_address: BackendShippingAddress;
}

// ─── User / Auth ───

export interface BackendSocialAccount {
  provider: string;
  picture: string;
}

export interface BackendUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  social_accounts: BackendSocialAccount[];
  code?: string;
  created_at?: string;
  updated_at?: string;
  ip?: string;
  ua?: string;
  metadata?: unknown;
  wish_list_count: number;
  cart_item_count: number;
}

export interface BackendJWTResponse {
  access: string;
  refresh: string;
}

// ─── Articles ───

export interface BackendArticleCategory {
  name: string;
  slug: string;
  desc_safe?: string;
  order?: number;
  meta_title?: string;
  meta_desc?: string;
  url: string;
  full_url: string;
  open_graph?: BackendOpenGraph;
}

export interface BackendArticleTag {
  name: string;
  slug: string;
  desc_safe?: string;
  order?: number;
  meta_title?: string;
  meta_desc?: string;
  url: string;
  full_url: string;
  open_graph?: BackendOpenGraph;
}

export interface BackendArticleAuthor {
  username: string;
  full_name: string;
}

export interface BackendArticle {
  code: string;
  title: string;
  slug: string;
  excerpt_safe?: string;
  author: BackendArticleAuthor;
  category: { name: string; slug: string };
  tags: { name: string; slug: string }[];
  featured: boolean;
  featured_image: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  url: string;
  full_url: string;
}

export interface BackendArticleDetail extends BackendArticle {
  content_safe?: string;
  open_graph: BackendOpenGraph;
  related_articles: BackendArticle[];
}

// ─── CMS / Utils ───

export interface BackendMenuItem {
  name: string;
  url: string;
  children?: BackendMenuItem[];
}

export interface BackendSliderItem {
  id: number;
  title?: string;
  subtitle?: string;
  image: string;
  url?: string;
  order?: number;
}

export interface BackendStaticPage {
  title: string;
  slug: string;
  content_safe?: string;
  meta_title?: string;
  meta_desc?: string;
}

// ─── Pagination ───

export interface BackendPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Product List Responses ───

export interface BackendCategoryProductResponse {
  category: BackendCategory;
  products: BackendProduct[];
}

export interface BackendBrandProductResponse {
  brand: BackendBrand;
  products: BackendProduct[];
}

export interface BackendTagProductResponse {
  tags: BackendTag;
  products: BackendProduct[];
}

export interface BackendSearchResponse {
  items: BackendProduct[];
  total: number;
  current: number;
  numPages: number;
}

export interface BackendSitemapProductResponse {
  items: { slug: string; updatedAt: string | null; images: string[] }[];
  total: number;
  current: number;
  numPages: number;
}
