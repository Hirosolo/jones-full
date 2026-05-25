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
import { ProductPlaceholderImg } from "src/constants";

// ─── Helpers ───

function buildMediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("//")) {
    return path;
  }
  if (path.startsWith("/")) return `${DJANGO_BASE_URL}${path}`;
  return `${DJANGO_BASE_URL}/${path}`;
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

function getPreviewPicture(bp: BackendProduct): BackendProduct["preview_picture"] | undefined {
  return (bp as any).preview_picture || (bp as any).previewPicture;
}

function getFakePrice(bp: BackendProduct): string | number | undefined {
  return (bp as any).fake_price || (bp as any).fakePrice;
}

function getTimesPurchased(bp: BackendProduct): number {
  return (bp as any).times_purchased ?? (bp as any).timesPurchased ?? 0;
}

function getAverageRating(bp: BackendProduct): number {
  return (bp as any).product_average_rating ?? (bp as any).productAverageRating ?? 0;
}

function normalizeAvailability(bp: BackendProduct | BackendProductDetail): boolean {
  const status = String((bp as any).status ?? "").trim().toLowerCase();
  if (status) {
    return status === "active" || status === "a";
  }

  const explicitAvailability = (bp as any).is_available ?? (bp as any).isAvailable;
  if (typeof explicitAvailability === "boolean") {
    return explicitAvailability;
  }

  const stock = (bp as any).stock;
  if (typeof stock === "number") {
    return stock > 0;
  }

  return false;
}

function getDescShort(bp: BackendProduct): string {
  return (
    (bp as any).desc_short_safe ||
    (bp as any).desc_short ||
    (bp as any).descShort ||
    (bp as any).desc_safe ||
    ""
  );
}

function dedupeMediaUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter((url) => {
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

function normalizeRichHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<img\b([^>]*?)\bhref=/gi, "<img$1src=");
}

// ─── Product Transformer ───

export function transformProduct(bp: BackendProduct): ProductComponentType {
  const priceOriginValue =
    (bp as any).price_origin ?? getFakePrice(bp) ?? bp.price;
  const pricePromoValue =
    (bp as any).price_promo ?? bp.price ?? priceOriginValue;
  const priceOrigin = parsePrice(priceOriginValue);
  const pricePromo = parsePrice(pricePromoValue);
  const price = pricePromo || priceOrigin;
  const discount = priceOrigin > price ? priceOrigin - price : 0;

  // Extract images from the preview picture, regardless of payload casing.
  const mediaURLs: string[] = [];
  const previewPicture = getPreviewPicture(bp);
  if (previewPicture?.w400) {
    mediaURLs.push(buildMediaUrl(previewPicture.w400));
  } else if (previewPicture?.w800) {
    mediaURLs.push(buildMediaUrl(previewPicture.w800));
  } else if (previewPicture?.w200) {
    mediaURLs.push(buildMediaUrl(previewPicture.w200));
  }

  const attrs = bp.attributes || [];
  const color = extractAttrValue(attrs, "Color") || "Multi";
  const sizes = extractAttrValues(attrs, "Size").map((s) => parseFloat(s)).filter((s) => !isNaN(s));
  const gender = parseGender(extractAttrValue(attrs, "Gender"));
  const type = parseType(extractAttrValue(attrs, "Type") || extractAttrValue(attrs, "Height"));
  const yearStr = extractAttrValue(attrs, "Year");
  const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
  const tagNames = (bp.tags || []).map((tag) => tag.name).filter(Boolean);

  return {
    id: String(bp.code || bp.slug),
    adminId: (bp as any).id || null,
    title: bp.name,
    slug: bp.slug,
    url: (bp as any).url || (bp as any).full_url || "",
    status: (bp as any).status,
    categoryName: bp.category?.name || "",
    brandName: bp.brand?.name || "",
    price,
    discount,
    priceOrigin,
    pricePromo,
    shippingCost: 0,
    gender,
    sku: bp.code || bp.slug,
    details: getDescShort(bp),
    descriptionHtml: normalizeRichHtml((bp as any).desc_safe || (bp as any).desc || ""),
    salesCount: getTimesPurchased(bp),
    color,
    sizes: sizes.length ? sizes : [8, 9, 10, 11],
    tags: tagNames,
    isAvailable: normalizeAvailability(bp),
    year: isNaN(year) ? new Date().getFullYear() : year,
    type,
    ratings: getAverageRating(bp),
    dateAdded: new Date().toISOString(),
    mediaURLs: mediaURLs.length ? mediaURLs : [ProductPlaceholderImg],
  };
}

export function transformProductDetail(bp: BackendProductDetail): ProductComponentType {
  const base = transformProduct(bp);

  const detailImages = (bp.images || []).map((url) => buildMediaUrl(url));
  const detailThumbnails = (bp.thumbnails || []).map((t) => buildMediaUrl(t.src));
  const detailMediaURLs = dedupeMediaUrls([
    ...detailImages,
    ...detailThumbnails,
  ]);

  if (detailMediaURLs.length) {
    base.mediaURLs = detailMediaURLs;
  }

  base.details = bp.desc_short_safe || bp.desc_short || "";
  base.descriptionHtml = normalizeRichHtml(bp.desc_safe || bp.desc || base.descriptionHtml || "");
  base.status = bp.status ?? base.status;
  base.url = bp.url || bp.full_url || base.url || "";
  base.relatedProducts = (bp.related_products || []).map(transformProduct);
  base.crossSell = (bp.cross_sell || []).map(transformProduct);
  base.openGraph = bp.open_graph ?? null;
  base.productReviewCount = bp.product_review_count ?? 0;
  base.productAverageRating = bp.product_average_rating ?? 0;
  base.isWishlisted = bp.is_wishlisted ?? false;
  base.isAvailable = normalizeAvailability(bp);

  // expose numeric backend id for admin linking
  (base as any).adminId = (bp as any).id || (base as any).adminId || null;
  base.categoryName = bp.category?.name || base.categoryName || "";
  base.brandName = bp.brand?.name || base.brandName || "";
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
  const reviewer = br.profile || br.user;
  return {
    userId: reviewer?.full_name || reviewer?.username || "anonymous",
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
