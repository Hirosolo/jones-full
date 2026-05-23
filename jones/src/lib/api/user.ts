import { http } from "@Lib/apiClient";
import type { BackendUser } from "src/types/backend";

export async function getShippingAddresses() {
  return http.get("/api/profiles/shipping-addresses/");
}

export async function manageShippingAddress(data: {
  id?: number;
  address_book_name: string;
  first_name: string;
  last_name: string;
  email: string;
  street: string;
  state?: string;
  city: string;
  country: string;
  zip_code: string;
  is_default?: boolean;
}) {
  return http.post("/api/profiles/shipping-addresses/manage/", data);
}

export async function deleteShippingAddress(id: number) {
  return http.delete(`/api/profiles/shipping-addresses/delete/${id}`);
}
