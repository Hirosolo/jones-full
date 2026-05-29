import { http } from "@Lib/apiClient";
import { getPathString } from "src/utils";
const CategoriesData = require("@Data/CategoriesData.json");
import type {
  BackendBrand,
  BackendCategory,
  BackendTag,
} from "src/types/backend";

const DEFAULT_CATEGORY: BackendCategory = {
  name: "All",
  slug: "all",
  order: 0,
};

type CacheEntry<T> = {
  value: T;
  timestamp: number;
};

const brandGroupsCacheKey = "/api/shop/brand-groups/";
const categoriesCacheKey = "/api/shop/categories-list/";
const sharedRequestCache = new Map<string, Promise<unknown>>();
const sharedResponseCache = new Map<string, CacheEntry<unknown>>();
const CLIENT_CACHE_TTL_MS = 60_000;

function isBrowser() {
  return typeof window !== "undefined";
}

function getCachedValue<T>(cacheKey: string): T | null {
  if (!isBrowser()) return null;
  const entry = sharedResponseCache.get(cacheKey) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CLIENT_CACHE_TTL_MS) {
    sharedResponseCache.delete(cacheKey);
    return null;
  }
  return entry.value;
}

function setCachedValue<T>(cacheKey: string, value: T): T {
  if (isBrowser()) {
    sharedResponseCache.set(cacheKey, { value, timestamp: Date.now() });
  }
  return value;
}

async function getSharedClientResource<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: { forceRefresh?: boolean } = {}
): Promise<T> {
  if (isBrowser() && !options.forceRefresh) {
    const cachedValue = getCachedValue<T>(cacheKey);
    if (cachedValue !== null) {
      return cachedValue;
    }

    const inFlight = sharedRequestCache.get(cacheKey) as Promise<T> | undefined;
    if (inFlight) {
      return inFlight;
    }
  }

  const request = fetcher().then((value) => {
    setCachedValue(cacheKey, value);
    if (isBrowser()) {
      sharedRequestCache.delete(cacheKey);
    }
    return value;
  });

  if (isBrowser()) {
    sharedRequestCache.set(cacheKey, request);
  }

  return request;
}

type BrandGroupResponse = {
  groups?: {
    name?: string;
    order?: number;
    items?: Array<{
      id?: number;
      name?: string;
      slug?: string;
      url?: string;
      order?: number;
    }>;
  }[];
};

const DEFAULT_BRAND_GROUPS: Record<string, string[]> = CategoriesData.brands;

export type BrandGroupItem = {
  name: string;
  slug: string;
  url?: string;
  order?: number;
};

function toBrandGroupItems(brandNames: string[]): BrandGroupItem[] {
  return brandNames
    .map((brandName) => ({
      name: brandName,
      slug: getPathString(brandName),
    }))
    .filter((brand) => brand.name.length > 0 && brand.slug.length > 0);
}

export async function getBrands() {
  return http.get<BackendBrand[]>("/api/shop/brands-list/");
}

export function getDefaultBrandGroups() {
  return DEFAULT_BRAND_GROUPS;
}

export async function getBrandGroups(options: { forceRefresh?: boolean } = {}) {
  return getSharedClientResource(brandGroupsCacheKey, () => http.get<BrandGroupResponse>("/api/shop/brand-groups/"), options);
}

export function normalizeBrandGroups(response?: BrandGroupResponse): Record<string, BrandGroupItem[]> {
  const groups: Record<string, BrandGroupItem[]> = {};
  const items = response?.groups || [];

  items.forEach((group) => {
    const groupName = (group.name || "").trim();
    const brands = (group.items || [])
      .map((brand) => ({
        name: (brand.name || "").trim(),
        slug: (brand.slug || "").trim() || getPathString(brand.name || ""),
        url: brand.url,
        order: brand.order,
      }))
      .filter((brand) => brand.name.length > 0 && brand.slug.length > 0);

    if (!groupName || brands.length === 0) {
      return;
    }

    groups[groupName] = brands;
  });

  return groups;
}

export async function getResolvedBrandGroups(): Promise<Record<string, BrandGroupItem[]>> {
  try {
    const response = await getBrandGroups();
    const groups = normalizeBrandGroups(response);
    return Object.keys(groups).length > 0
      ? groups
      : Object.fromEntries(
          Object.entries(DEFAULT_BRAND_GROUPS).map(([groupName, brandNames]) => [
            groupName,
            toBrandGroupItems(brandNames),
          ])
        );
  } catch {
    return Object.fromEntries(
      Object.entries(DEFAULT_BRAND_GROUPS).map(([groupName, brandNames]) => [
        groupName,
        toBrandGroupItems(brandNames),
      ])
    );
  }
}

export async function getCategories(options: { forceRefresh?: boolean } = {}) {
  return getSharedClientResource(categoriesCacheKey, async () => {
    try {
      const categories = await http.get<BackendCategory[]>("/api/shop/categories-list/");
      if (Array.isArray(categories) && categories.length > 0) {
        return categories;
      }
      const paginatedCategories = categories as unknown as { results?: BackendCategory[] };
      if (Array.isArray(paginatedCategories?.results) && paginatedCategories.results.length > 0) {
        return paginatedCategories.results;
      }
      return [DEFAULT_CATEGORY];
    } catch {
      return [DEFAULT_CATEGORY];
    }
  }, options);
}

export async function getTags() {
  return http.get<BackendTag[]>("/api/shop/tags-list/");
}
