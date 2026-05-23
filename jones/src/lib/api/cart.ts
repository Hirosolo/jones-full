import { http } from "@Lib/apiClient";
import type { BackendCartResponse, BackendCartItem } from "src/types/backend";
import { transformCartItem } from "@Lib/transformers";
import type { CartType } from "src/types/shared";

export async function getCartItems(): Promise<{ items: CartType[]; totalQuantity: number; subTotal: number }> {
  const data = await http.get<BackendCartResponse>("/shop/cart-items/");
  return {
    items: (data.cart_items || []).map(transformCartItem),
    totalQuantity: data.total_quantity || 0,
    subTotal: data.sub_total || 0,
  };
}

export async function addToCart(
  productCode: string,
  quantity = 1,
  attrIds: number[] = [],
  customerNote = ""
): Promise<{ ok: boolean; msg: string; quantity: number }> {
  return http.post("/shop/add-to-cart/", {
    product_code: productCode,
    quantity,
    attr_ids: attrIds,
    customer_note: customerNote,
  });
}

export async function updateCartQuantity(
  items: { id: number; quantity: number }[]
): Promise<{ ok: boolean; msg: string }> {
  return http.post("/shop/update-cart-quantity/", { items });
}

export async function removeCartItems(idList: number[]): Promise<{ ok: boolean; msg: string }> {
  return http.post("/shop/remove-cart-item/", { id_list: idList });
}

export async function mergeCartOnLogin(
  cartItems: {
    product_code: string;
    quantity: number;
    customer_note?: string;
    attr_items?: number[];
  }[]
): Promise<{ ok: boolean }> {
  return http.post("/shop/merge-cart-on-login/", { cart_items: cartItems });
}
