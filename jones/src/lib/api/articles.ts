import { http } from "@Lib/apiClient";
import type { BackendArticle, BackendArticleDetail } from "src/types/backend";
import { transformArticle, transformArticleDetail } from "@Lib/transformers";

export async function getArticles(params?: { page?: number; page_size?: number; category?: string; tag?: string }) {
  const data = await http.get<{
    results?: BackendArticle[];
    count?: number;
    data?: { results?: BackendArticle[]; pageObj?: { paginator?: { count?: number } } };
  }>("/api/articles/listing/", {
    searchParams: params,
  });
  const results = data.results || data.data?.results || [];
  const count = data.count ?? data.data?.pageObj?.paginator?.count ?? 0;
  return {
    articles: results.map(transformArticle),
    count,
  };
}

export async function getArticleDetail(slug: string) {
  const data = await http.get<BackendArticleDetail>("/api/articles/detail/", {
    searchParams: { slug },
  });
  return transformArticleDetail(data);
}

export async function getFeaturedArticle() {
  const data = await http.get<BackendArticle>("/api/articles/featured/");
  return transformArticle(data);
}

export async function getArticleCategories() {
  const data = await http.get<BackendArticle[]>("/api/articles/category-list/");
  return data || [];
}

export async function getArticleTags() {
  const data = await http.get<BackendArticle[]>("/api/articles/tag-list/");
  return data || [];
}
