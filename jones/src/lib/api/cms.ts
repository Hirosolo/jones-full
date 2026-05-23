import { http } from "@Lib/apiClient";

export async function getMainMenus() {
  return http.get<{ menus: any[] }>("/api/utils/main-menus/");
}

export async function getFooterMenus() {
  return http.get<{ menus: any[] }>("/api/utils/footer-menus/");
}

export async function getSliders() {
  return http.get<{ sliders: any[] }>("/api/utils/sliders/");
}

export async function getStaticPage(slug: string) {
  return http.get<{ title: string; content_safe?: string }>("/api/utils/static-pages/", {
    searchParams: { slug },
  });
}

export async function search(q: string) {
  return http.get("/api/utils/search/", { searchParams: { q } });
}
