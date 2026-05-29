import Image from "next/image";
import type { SimpleSectionContent } from "src/data/defaultContent";
import { useRef } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useRouter } from "next/router";

import useBrandGroups from "@Hooks/useBrandGroups";
import { getPathString } from "src/utils";
import { buildProductListingHref } from "src/utils";

interface CollectionSectionProps {
  content: SimpleSectionContent & { description: string };
}

export default function CollectionSection({ content }: CollectionSectionProps) {
  const { brandGroups } = useBrandGroups();
  const router = useRouter();
  const galleryRef = useRef<HTMLDivElement>(null);

  if (!content.enabled) return null;

  const scrollGallery = (direction: -1 | 1) => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    const firstCard = gallery.querySelector<HTMLElement>(
      ".collections__block--gallery"
    );
    const scrollAmount = firstCard?.offsetWidth ?? gallery.clientWidth * 0.8;

    gallery.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="collections">
      <div className="collections__container">
        <article className="collections__intro">
          <h2 className="collections__heading">
            {content.title}
          </h2>
          <p className="collections__sub-text">
            {content.subtitle}
          </p>

          <p className="collections__sub-text">{content.description}</p>
        </article>
        <div className="collections__gallery-toolbar">
          <button
            type="button"
            className="collections__gallery-control"
            onClick={() => scrollGallery(-1)}
            aria-label="Scroll gallery left"
          >
            <IoIosArrowBack />
          </button>
          <button
            type="button"
            className="collections__gallery-control"
            onClick={() => scrollGallery(1)}
            aria-label="Scroll gallery right"
          >
            <IoIosArrowForward />
          </button>
        </div>
        <div
          ref={galleryRef}
          className="collections__grid collections__grid--gallery"
        >
          {Object.entries(brandGroups).map(([group], index) => (
            <div
              key={group}
              className="collections__block collections__block--gallery"
              role="button"
              tabIndex={0}
              onClick={() => router.push(brandPath(group))}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(brandPath(group));
              }}
            >
              <div className="collections__block-link">
                <Image
                  className="collections__block-image"
                  alt=""
                  layout="fill"
                  src={brandGalleryImages[group] || brandGalleryImages.Other}
                  objectFit="cover"
                  priority
                  loading="eager"
                />
                <div className="collections__block-content">
                  <h3 className="collections__block-title">{group}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const brandGalleryImages: Record<string, string> = {
  Business: "/assets/images/bussiness-banner-vertical.png",
  Culture: "/assets/images/culture-banner-vertical.png",
  "K-Pop": "/assets/images/kPOP-banner-vertical.png",
  Movie: "/assets/images/moive-banner-vertical.png",
  Music: "/assets/images/music-banner-vertical.png",
  Other: "/assets/images/other-banner-vertical.png",
  "Rock Band": "/assets/images/rockBand-banner-vertical.png",
  Sport: "/assets/images/sport-banner-vertical.png",
  Tabletop: "/assets/images/tabletop-banner-vertical.png",
  "Video Game": "/assets/images/videoGame-banner-vertical.png",
};

const brandPath = (group: string) => buildProductListingHref({ brand: getPathString(group) });
