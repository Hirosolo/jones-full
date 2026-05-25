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

export async function getBrands() {
  return http.get<BackendBrand[]>("/api/shop/brands-list/");
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
