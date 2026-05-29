import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

import type { SimpleSectionContent } from "src/data/defaultContent";

export interface FeaturedArticleItem {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
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
            const href = `/articles/${article.slug}`;

            const stripHtml = (text: string | undefined | null) => {
              if (!text) return "";
              return text.replace(/<[^>]*>/g, "").trim();
            };
            return (
              <Link key={article.slug} href={href}>
                <a className="featured-articles__card">
                  <div className="featured-articles__media">
                    <Image
                      className="featured-articles__image"
                      alt={article.title}
                      layout="fill"
                      src={article.featuredImage || "/assets/images/other-banner-vertical.png"}
                      objectFit="cover"
                      priority
                      loading="eager"
                    />
                  </div>
                  <div className="featured-articles__body">
                    <h3 className="featured-articles__title">{article.title}</h3>
                    <p className="featured-articles__excerpt">{stripHtml(article.excerpt)}</p>
                    <span className="featured-articles__link">Read article</span>
                  </div>
                </a>
              </Link>
            );
            })
          )}
        </div>
      </div>
    </section>
  );
}
