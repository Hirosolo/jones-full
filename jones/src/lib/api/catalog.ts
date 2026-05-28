import { http } from "@Lib/apiClient";
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

type BrandGroupResponse = {
  groups?: {
    name?: string;
    order?: number;
    items?: Array<{
      name?: string;
      slug?: string;
      url?: string;
      order?: number;
    }>;
  }[];
};

const DEFAULT_BRAND_GROUPS: Record<string, string[]> = CategoriesData.brands;

export async function getBrands() {
  return http.get<BackendBrand[]>("/api/shop/brands-list/");
}

export function getDefaultBrandGroups() {
  return DEFAULT_BRAND_GROUPS;
}

export async function getBrandGroups() {
  return http.get<BrandGroupResponse>("/api/shop/brand-groups/");
}

export function normalizeBrandGroups(response?: BrandGroupResponse) {
  const groups: Record<string, string[]> = {};
  const items = response?.groups || [];

  items.forEach((group) => {
    const groupName = (group.name || "").trim();
    const brandNames = (group.items || [])
      .map((brand) => (brand.name || "").trim())
      .filter(Boolean);

    if (!groupName || brandNames.length === 0) {
      return;
    }

    groups[groupName] = brandNames;
  });

  return groups;
}

export async function getResolvedBrandGroups() {
  try {
    const response = await getBrandGroups();
    const groups = normalizeBrandGroups(response);
    return Object.keys(groups).length > 0 ? groups : DEFAULT_BRAND_GROUPS;
  } catch {
    return DEFAULT_BRAND_GROUPS;
  }
}

export async function getCategories() {
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
}

export async function getTags() {
  return http.get<BackendTag[]>("/api/shop/tags-list/");
}
