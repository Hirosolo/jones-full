import { http } from "@Lib/apiClient";
import type {
  BackendBrand,
  BackendCategory,
  BackendTag,
} from "src/types/backend";

export async function getBrands() {
  return http.get<BackendBrand[]>("/api/shop/brands-list/");
}

export async function getBrandGroups() {
  return http.get<{ groups: { name: string; order: number; items: BackendBrand[] }[] }>(
    "/api/shop/brand-groups/"
  );
}

export async function getCategories() {
  return http.get<BackendCategory[]>("/api/shop/categories-list/");
}

export async function getTags() {
  return http.get<BackendTag[]>("/api/shop/tags-list/");
}
