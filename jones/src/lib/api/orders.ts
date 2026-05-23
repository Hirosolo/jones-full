import { http } from "@Lib/apiClient";
import type { BackendOrder, BackendOrderDetail } from "src/types/backend";

export async function createOrder(data: {
  first_name: string;
  last_name: string;
  email: string;
  street: string;
  city: string;
  country: string;
  zip_code: string;
  state?: string;
  shipping_method?: "standard" | "fast";
  cart_items: {
    product_code: string;
    quantity: number;
    attr_value_ids?: number[];
    customer_note?: string;
  }[];
}): Promise<{ ok: boolean; order_code?: string; sub_total?: number; shipping_fee?: number; total_amount?: number }> {
  return http.post("/shop/create-order/", data);
}

export async function getOrders(params?: {
  status?: string;
  created_from?: string;
  created_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<{ results: BackendOrder[]; count: number }> {
  return http.get("/shop/get-order-list/", { searchParams: params });
}

export async function getOrderDetail(orderCode: string): Promise<BackendOrderDetail | null> {
  try {
    return await http.get<BackendOrderDetail>("/shop/get-order-detail/", {
      searchParams: { order_code: orderCode },
    });
  } catch {
    return null;
  }
}
