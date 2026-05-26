import type { DefaultResponse } from "src/types/shared";

import {
  addToWishlist as apiAddToWishlist,
  removeFromWishlist as apiRemoveFromWishlist,
} from "@Lib/api/wishlist";

export async function postWishlistItem(id: string): Promise<DefaultResponse> {
  try {
    const res = await apiAddToWishlist(undefined, id);
    return { success: res.ok, message: "Added to wishlist", data: res };
  } catch (err: any) {
    return { error: true, message: err?.body?.msg || "Failed to add to wishlist" };
  }
}

export async function deleteWishlistItem(id: string): Promise<DefaultResponse> {
  try {
    const res = await apiRemoveFromWishlist(undefined, id);
    return { success: res.ok, message: "Removed from wishlist", data: res };
  } catch (err: any) {
    return { error: true, message: err?.body?.msg || "Failed to remove from wishlist" };
  }
}

export async function postCartItem(
  id: string,
  quantity: number,
  size: number
): Promise<DefaultResponse> {
  return {
    error: true,
    message: "Cart is disabled on this site.",
  };
}

export async function deleteCartItem(id: string): Promise<DefaultResponse> {
  return {
    error: true,
    message: "Cart is disabled on this site.",
  };
}

export async function emptyUserCart(): Promise<DefaultResponse> {
  return {
    error: true,
    message: "Cart is disabled on this site.",
  };
}
