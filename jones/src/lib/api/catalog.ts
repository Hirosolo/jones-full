import CategoriesData from "@Data/CategoriesData.json";
import { http } from "@Lib/apiClient";
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
export type BrandGroupsMap = Record<string, string[]>;

export async function getBrands() {
  return http.get<BackendBrand[]>("/api/shop/brands-list/");
}

const DEFAULT_BRAND_GROUPS: BrandGroupsMap = CategoriesData.brands;

type BackendBrandGroupsResponse = {
  groups: { name: string; order: number; items: { name: string }[] }[];
};

export function getDefaultBrandGroups(): BrandGroupsMap {
  return DEFAULT_BRAND_GROUPS;
}

function normalizeBrandGroups(response?: BackendBrandGroupsResponse | null): BrandGroupsMap {
  const groups: BrandGroupsMap = {};
  const items = response?.groups || [];

  items.forEach((group) => {
    const groupName = (group.name || "").trim();
    const brandNames = (group.items || [])
      .map((brand) => (brand.name || "").trim())
      .filter(Boolean);

    if (!groupName || brandNames.length === 0) return;
    groups[groupName] = brandNames;
  });

  return groups;
}

export async function getResolvedBrandGroups(): Promise<BrandGroupsMap> {
  try {
    const response = await http.get<BackendBrandGroupsResponse>("/api/shop/brand-groups/");
    const groups = normalizeBrandGroups(response);
    return Object.keys(groups).length > 0 ? groups : DEFAULT_BRAND_GROUPS;
  } catch {
    return DEFAULT_BRAND_GROUPS;
  }
}

export async function getBrandGroups() {
  return http.get<{ groups: { name: string; order: number; items: BackendBrand[] }[] }>(
    "/api/shop/brand-groups/"
  );
}

export async function getCategories() {
  try {
    const categories = await http.get<BackendCategory[]>("/api/shop/categories-list/");
    if (Array.isArray(categories) && categories.length > 0) {
      return categories;
    }
    return [DEFAULT_CATEGORY];
  } catch {
    return [DEFAULT_CATEGORY];
  }
}

export async function getTags() {
  return http.get<BackendTag[]>("/api/shop/tags-list/");
}
