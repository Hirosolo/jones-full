import type { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import SEO from "@Components/common/SEO";
import { DOMAIN_NAME } from "@Lib/config";
import { getArticleDetail } from "@Lib/api/articles";

interface ArticlePageProps {
  article: {
    title: string;
    slug: string;
    excerpt: string;
    featuredImage: string;
    author: string;
    category: string;
    categorySlug: string;
    publishedAt: string | null;
    content: string;
    openGraph?: {
      title: string;
      description: string;
      images: string[];
      url: string;
    } | null;
    relatedArticles: {
      title: string;
      slug: string;
      excerpt: string;
      featuredImage: string;
    }[];
  };
}

const ArticleDetailPage: NextPage<ArticlePageProps> = ({ article }) => {
  const bannerImage = article.featuredImage || null;
  const formattedPublishedAt = article.publishedAt
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
      }).format(new Date(article.publishedAt))
    : "";
  const canonicalUrl = `${DOMAIN_NAME.replace(/\/$/, "")}/articles/${article.slug}`;


  return (
    <>
      <SEO
        title={article.title}
        description={article.excerpt || article.title}
        canonical={canonicalUrl}
        ogType="article"
        ogImage={bannerImage ?? ''}
      />

      <article className="article-page">
        <header className="article-page__banner">
          {bannerImage && (
            <>
              <div className="article-page__banner-media">
                <Image
                  src={bannerImage}
                  alt={article.title}
                  layout="fill"
                  objectFit="cover"
                  priority
                  sizes="100vw"
                />
              </div>
              <div className="article-page__banner-overlay" />
            </>
          )}
          <div className="article-page__banner-content page__container">
            <p className="article-page__eyebrow">Blog</p>
            <h1 className="article-page__title">{article.title}</h1>
            {article.excerpt && <p className="article-page__excerpt">{article.excerpt}</p>}
            <div className="article-page__meta">
              {article.author && <span className="article-page__meta-item">By {article.author}</span>}
              {article.category && (
                <span className="article-page__meta-item">
                  {article.categorySlug ? (
                    <Link href={`/category/${article.categorySlug}`}>
                      <a>{article.category}</a>
                    </Link>
                  ) : (
                    article.category
                  )}
                </span>
              )}
              {formattedPublishedAt && (
                <span className="article-page__meta-item">{formattedPublishedAt}</span>
              )}
            </div>
          </div>
        </header>

        <section className="article-page__content-wrap page__container">
          <div
            className="article-page__content"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </section>

        {article.relatedArticles.length > 0 && (
          <section className="article-page__related page__container">
            <div className="article-page__related-head">
              <p className="article-page__eyebrow">Related</p>
              <h2 className="article-page__related-title">More articles</h2>
            </div>

            <div className="article-page__related-grid">
              {article.relatedArticles.map((related) => (
                <Link key={related.slug} href={`/articles/${related.slug}`}>
                  <a className="article-page__related-card">
                    <div className="article-page__related-media">
                      <Image
                        src={related.featuredImage || "/assets/images/other-banner-vertical.png"}
                        alt={related.title}
                        layout="fill"
                        objectFit="cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="article-page__related-body">
                      <h3 className="article-page__related-card-title">{related.title}</h3>
                      {related.excerpt && (
                        <p className="article-page__related-excerpt">{related.excerpt}</p>
                      )}
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<ArticlePageProps> = async ({ params }) => {
  const slug = params?.slug;

  if (typeof slug !== "string" || !slug.trim()) {
    return { notFound: true };
  }

  try {
    const article = await getArticleDetail(slug);
    const { content: _content, ...articleInfo } = article;

    // Strip HTML tags from excerpts so they render as plain text on the page
    const stripHtml = (text: string | undefined | null) => {
      if (!text) return "";
      return text.replace(/<[^>]*>/g, "").trim();
    };

    console.log("[ArticleDetail] fetched article:", articleInfo);

    return {
      props: {
        article: {
          title: article.title,
          slug: article.slug,
          excerpt: stripHtml(article.excerpt),
          featuredImage: article.featuredImage,
          author: article.author,
          category: article.category,
          categorySlug: article.categorySlug,
          publishedAt: article.publishedAt || null,
          content: article.content,
          openGraph: article.openGraph || null,
          relatedArticles: article.relatedArticles.map((relatedArticle) => ({
            title: relatedArticle.title,
            slug: relatedArticle.slug,
            excerpt: stripHtml(relatedArticle.excerpt),
            featuredImage: relatedArticle.featuredImage,
          })),
        },
      },
    };
  } catch {
    return { notFound: true };
  }
};

export default ArticleDetailPage;