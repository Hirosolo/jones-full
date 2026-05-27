import Image from "next/image";
import { useRef } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

import type { SimpleSectionContent } from "src/data/defaultContent";

export interface FeaturedArticleItem {
  code: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  category: string;
  categorySlug: string;
  tags: string[];
  featured: boolean;
  featuredImage: string;
  publishedAt?: string;
  url: string;
  fullUrl: string;
}

interface FeaturedArticleSectionProps {
  content: SimpleSectionContent;
  articles: FeaturedArticleItem[];
}

export default function FeaturedArticleSection({ content, articles }: FeaturedArticleSectionProps) {
  const galleryRef = useRef<HTMLDivElement>(null);

  if (!content.enabled) return null;

  const scrollGallery = (direction: -1 | 1) => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    const firstCard = gallery.querySelector<HTMLElement>(".featured-articles__card");
    const scrollAmount = firstCard?.offsetWidth ?? gallery.clientWidth * 0.8;

    gallery.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="featured-articles">
      <div className="featured-articles__container">
        <article className="featured-articles__intro">
          <h2 className="featured-articles__heading">{content.title}</h2>
          <p className="featured-articles__sub-text">{content.subtitle}</p>
        </article>

        <div className="featured-articles__gallery-toolbar">
          <button
            type="button"
            className="featured-articles__gallery-control"
            onClick={() => scrollGallery(-1)}
            aria-label="Scroll featured articles left"
          >
            <IoIosArrowBack />
          </button>
          <button
            type="button"
            className="featured-articles__gallery-control"
            onClick={() => scrollGallery(1)}
            aria-label="Scroll featured articles right"
          >
            <IoIosArrowForward />
          </button>
        </div>

        <div ref={galleryRef} className="featured-articles__grid">
          {articles.length === 0 ? (
            <div className="featured-articles__empty">
              <p>No featured articles yet — mark some articles as featured in the admin.</p>
            </div>
          ) : (
            articles.map((article) => {
            const href = article.fullUrl || article.url || `/articles/${article.slug}`;
            const publishedLabel = formatPublishedDate(article.publishedAt);

            return (
              <a key={article.code || article.slug} className="featured-articles__card" href={href}>
                <div className="featured-articles__media">
                  <Image
                    className="featured-articles__image"
                    alt={article.title}
                    layout="fill"
                    src={article.featuredImage || "/assets/images/other-banner-vertical.png"}
                    objectFit="cover"
                  />
                </div>
                <div className="featured-articles__body">
                  <div className="featured-articles__meta">
                    <span>{article.category || "Article"}</span>
                    {publishedLabel && <span>{publishedLabel}</span>}
                  </div>
                  <h3 className="featured-articles__title">{article.title}</h3>
                  <p className="featured-articles__excerpt">{article.excerpt}</p>
                  <div className="featured-articles__footer">
                    <span className="featured-articles__author">By {article.author}</span>
                    <span className="featured-articles__link">Read article</span>
                  </div>
                </div>
              </a>
            );
            })
          )}
        </div>
      </div>
    </section>
  );
}

function formatPublishedDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}