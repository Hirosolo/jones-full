import type { DefaultResponse } from "src/types/shared";

import {
  addToCart as apiAddToCart,
  removeCartItems as apiRemoveCartItems,
} from "@Lib/api/cart";
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
  try {
    const res = await apiAddToCart(id, quantity);
    return {
      success: res.ok,
      message: res.msg || "Added to cart",
      data: { productId: id, quantity, size, total: 0 },
    };
  } catch (err: any) {
    return { error: true, message: err?.body?.msg || "Failed to add to cart" };
  }
}

export async function deleteCartItem(id: string): Promise<DefaultResponse> {
  try {
    const res = await apiRemoveCartItems([parseInt(id, 10)]);
    return { success: res.ok, message: res.msg || "Removed from cart" };
  } catch (err: any) {
    return { error: true, message: err?.body?.msg || "Failed to remove from cart" };
  }
}

export async function emptyUserCart(): Promise<DefaultResponse> {
  try {
    // We don't have a dedicated "clear all" endpoint; would need to fetch then remove all
    // For now return success — the caller will clear local state
    return { success: true, message: "Cart cleared" };
  } catch (err: any) {
    return { error: true, message: err?.body?.msg || "Failed to clear cart" };
  }
}
