import type {
  BackendProduct,
  BackendProductDetail,
  BackendCartItem,
  BackendWishlistItem,
  BackendReview,
  BackendUser,
  BackendOrder,
  BackendOrderDetail,
  BackendArticle,
  BackendArticleDetail,
} from "src/types/backend";

import type {
  ProductComponentType,
  CartType,
  WishlistType,
  Review,
  User,
  UserType,
  UserTypeNormalized,
} from "src/types/shared";

import { Gender, Category } from "src/types/shared";

import { DJANGO_BASE_URL } from "./config";

// ─── Helpers ───

function buildMediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Backend may serve from GCS or local /media/
  if (path.startsWith("/media/")) return `${DJANGO_BASE_URL}${path}`;
  return `${DJANGO_BASE_URL}/media/${path}`;
}

function extractAttrValue(
  attrs: BackendProduct["attributes"],
  attrName: string
): string | undefined {
  const group = attrs.find(
    (a) => a.name.toLowerCase() === attrName.toLowerCase()
  );
  if (!group || !group.attr.length) return undefined;
  return group.attr[0].value;
}

function extractAttrValues(
  attrs: BackendProduct["attributes"],
  attrName: string
): string[] {
  const group = attrs.find(
    (a) => a.name.toLowerCase() === attrName.toLowerCase()
  );
  if (!group) return [];
  return group.attr.map((item) => item.value);
}

function parseGender(value?: string): Gender {
  if (!value) return Gender.UNISEX;
  const upper = value.toUpperCase();
  if (upper in Gender) return Gender[upper as keyof typeof Gender];
  // Fallback heuristics
  if (upper.includes("MEN") && !upper.includes("WOMEN")) return Gender.MEN;
  if (upper.includes("WOMEN") || upper.includes("LADY")) return Gender.WOMEN;
  if (upper.includes("KID")) return Gender.KIDS;
  if (upper.includes("BABY")) return Gender.BABY;
  return Gender.UNISEX;
}

function parseType(value?: string): Category {
  if (!value) return Category.LOW;
  const upper = value.toUpperCase();
  if (upper.includes("HIGH")) return Category.HIGH;
  if (upper.includes("MID")) return Category.MID;
  if (upper.includes("LOW")) return Category.LOW;
  return Category.LOW;
}

function parsePrice(value: string | number): number {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n) ? 0 : n;
}

// ─── Product Transformer ───

export function transformProduct(bp: BackendProduct): ProductComponentType {
  const price = parsePrice(bp.price);
  const fakePrice = bp.fake_price ? parsePrice(bp.fake_price) : price;
  const discount = fakePrice > price ? fakePrice - price : 0;

  // Extract images from preview_picture
  const mediaURLs: string[] = [];
  if (bp.preview_picture?.w400) {
    mediaURLs.push(bp.preview_picture.w400);
  } else if (bp.preview_picture?.w800) {
    mediaURLs.push(bp.preview_picture.w800);
  } else if (bp.preview_picture?.w200) {
    mediaURLs.push(bp.preview_picture.w200);
  }

  const attrs = bp.attributes || [];
  const color = extractAttrValue(attrs, "Color") || "Multi";
  const sizes = extractAttrValues(attrs, "Size").map((s) => parseFloat(s)).filter((s) => !isNaN(s));
  const gender = parseGender(extractAttrValue(attrs, "Gender"));
  const type = parseType(extractAttrValue(attrs, "Type") || extractAttrValue(attrs, "Height"));
  const yearStr = extractAttrValue(attrs, "Year");
  const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

  return {
    id: String(bp.code || bp.slug),
    title: bp.name,
    price: fakePrice,
    discount,
    shippingCost: 0,
    mediaURLs: mediaURLs.length ? mediaURLs : ["/assets/images/placeholder.webp"],
    gender,
    sku: bp.code || bp.slug,
    details: bp.desc_short || "",
    salesCount: bp.times_purchased || 0,
    color,
    sizes: sizes.length ? sizes : [8, 9, 10, 11],
    year: isNaN(year) ? new Date().getFullYear() : year,
    type,
    ratings: bp.product_average_rating || 0,
    dateAdded: new Date().toISOString(),
  };
}

export function transformProductDetail(bp: BackendProductDetail): ProductComponentType {
  const base = transformProduct(bp);

  // Override mediaURLs with full gallery images
  if (bp.images && bp.images.length) {
    base.mediaURLs = bp.images.map((url) => buildMediaUrl(url));
  }
  // Also include thumbnails if available
  if (bp.thumbnails && bp.thumbnails.length) {
    base.mediaURLs = bp.thumbnails.map((t) => buildMediaUrl(t.src));
  }

  base.details = bp.desc || bp.desc_short || "";
  return base;
}

// ─── Cart Transformer ───

export function transformCartItem(bc: BackendCartItem): CartType {
  const product = transformProduct(bc.product);
  const size = bc.attr_cart_items
    .find((g) => g.name.toLowerCase() === "size")
    ?.attr[0]?.value;

  return {
    cartId: bc.id,
    productId: product.id,
    size: size ? parseFloat(size) : 8,
    quantity: bc.quantity,
    total: bc.line_total,
    product,
  };
}

// ─── Wishlist Transformer ───

export function transformWishlistItem(bw: BackendWishlistItem): WishlistType {
  return {
    userId: "",
    productId: String(bw.product.code || bw.product.slug),
    product: transformProduct(bw.product),
  };
}

// ─── Review Transformer ───

export function transformReview(br: BackendReview): Review {
  return {
    userId: br.user?.username || "anonymous",
    productId: "",
    comment: br.content_safe || br.subject || "",
    rating: br.rating,
    addedAt: br.created_at,
  };
}

// ─── User Transformer ───

export function transformUser(bu: BackendUser): User {
  return {
    id: String(bu.id),
    username: bu.username,
    email: bu.email,
    role: "USER" as any, // backend doesn't expose role in this serializer
    phoneNumber: undefined,
    deactivated: false,
    firstName: bu.first_name,
    lastName: bu.last_name,
    avatarURL: bu.social_accounts?.[0]?.picture || "",
  };
}

export function transformUserToUserType(bu: BackendUser): UserType {
  return {
    ...transformUser(bu),
    wishlist: [],
    cart: [],
    isAuth: true,
  };
}

// ─── Order Transformer ───

export function transformOrder(bo: BackendOrder | BackendOrderDetail) {
  return {
    id: bo.id,
    code: bo.code,
    subTotal: parsePrice(bo.sub_total),
    shippingFee: bo.shipping_fee || 0,
    totalAmount: parsePrice(bo.total_amount),
    status: bo.status,
    createdAt: bo.created_at,
    updatedAt: bo.updated_at,
    items: "items" in bo ? bo.items : undefined,
    shippingAddress: "shipping_address" in bo ? bo.shipping_address : undefined,
  };
}

// ─── Article Transformer ───

export function transformArticle(ba: BackendArticle) {
  return {
    code: ba.code,
    title: ba.title,
    slug: ba.slug,
    excerpt: ba.excerpt_safe || "",
    author: ba.author?.full_name || ba.author?.username || "ADMIN.WEB",
    category: ba.category?.name || "",
    categorySlug: ba.category?.slug || "",
    tags: ba.tags?.map((t) => t.name) || [],
    featuredImage: ba.featured_image ? buildMediaUrl(ba.featured_image) : "",
    publishedAt: ba.published_at,
    url: ba.url,
    fullUrl: ba.full_url,
  };
}

export function transformArticleDetail(ba: BackendArticleDetail) {
  return {
    ...transformArticle(ba),
    content: ba.content_safe || "",
    relatedArticles: ba.related_articles?.map(transformArticle) || [],
  };
}
