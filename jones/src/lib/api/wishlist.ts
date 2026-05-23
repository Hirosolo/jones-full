import { http } from "@Lib/apiClient";
import type { BackendWishlistItem } from "src/types/backend";
import { transformWishlistItem } from "@Lib/transformers";
import type { WishlistType } from "src/types/shared";

export async function getWishlist(): Promise<WishlistType[]> {
  const data = await http.get<BackendWishlistItem[]>("/shop/get-wishlist/");
  return (data || []).map(transformWishlistItem);
}

export async function addToWishlist(code?: string, slug?: string): Promise<{ ok: boolean; num: number }> {
  const data = await http.post<{ ok: boolean; num: number }>("/shop/action-to-wishlist/", {
    code,
    slug,
  });
  return data;
}

export async function removeFromWishlist(code?: string, slug?: string): Promise<{ ok: boolean; num: number }> {
  const data = await http.post<{ ok: boolean; num: number }>("/shop/action-to-wishlist/", {
    code,
    slug,
    action: "remove",
  });
  return data;
}

export async function checkItemInWishlist(code?: string, slug?: string): Promise<boolean> {
  try {
    const data = await http.get<{ ok: boolean; is_wishlisted: boolean }>("/shop/check-item-wishlist/", {
      searchParams: code ? { code } : { slug },
    });
    return data.is_wishlisted || false;
  } catch {
    return false;
  }
}
