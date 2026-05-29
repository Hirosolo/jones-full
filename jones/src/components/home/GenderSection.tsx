import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import type { SimpleSectionContent } from "src/data/defaultContent";
import type { BackendCategory } from "src/types/backend";
import { getPathString } from "src/utils";
import { buildProductListingHref } from "src/utils";

import bannerImage from "@Images/pexels-theia-sight-4932179.jpg";
import clothingImage from "@Images/clothing.jpg";
import accessoriesImage from "@Images/acessories.jpg";
import footwearImage from "@Images/footware.webp";
import homeDecorImage from "@Images/homedecor.jpeg";
import saleImage from "@Images/sale.jpg";

type CategorySectionItem = BackendCategory & {
  image?: string;
  img?: string;
};

interface GenderSectionProps {
  categories: CategorySectionItem[];
  content: SimpleSectionContent;
}

function resolveCategoryImage(
  category: CategorySectionItem | undefined,
  fallbackImage: string | StaticImageData
): string | StaticImageData {
  const value = (category?.image || category?.img || "").trim();
  if (!value) return fallbackImage;
  if (value.startsWith("/api/media/")) return value;
  if (value.startsWith("/media/")) return `/api/media/${value.slice("/media/".length)}`;
  if (value.startsWith("/api/image-proxy")) return value;
  if (value.startsWith("//")) {
    return `/api/image-proxy?url=${encodeURIComponent(`https:${value}`)}`;
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value);
      if (parsed.pathname.startsWith("/media/")) {
        return `/api/media/${parsed.pathname.slice("/media/".length)}`;
      }
      return `/api/image-proxy?url=${encodeURIComponent(value)}`;
    } catch {
      return value;
    }
  }
  return value;
}

export default function GenderSection({ categories, content }: GenderSectionProps) {
  if (!content.enabled) return null;

  const categoryBlocks = categorySectionBlocks.map((fallbackBlock, index) => {
    const category = [...categories]
      .filter((item) => (item.name || "").trim())
      .sort((left, right) => {
        const leftOrder = left.order ?? 0;
        const rightOrder = right.order ?? 0;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return (left.name || "").localeCompare(right.name || "");
      })[index];

    return {
      className: fallbackBlock.className,
      href: category?.slug ? buildProductListingHref({ category: category.slug }) : fallbackBlock.href,
      imgSource: resolveCategoryImage(category, fallbackBlock.imgSource),
      title: category?.name || fallbackBlock.title,
    };
  });

  return (
    <section className="gender">
      <div className="gender__container">
        <div className="gender__tall-img">
          <Image
            alt=""
            objectFit="cover"
            objectPosition="bottom"
            layout="fill"
            src={bannerImage}
            priority
            loading="eager"
          />
          <h3 className="gender__text-overlay">
            {content.title}
          </h3>
        </div>
        <div className="gender__grid">
          {categoryBlocks.map(({ className, href, imgSource, title }) => (
            <div key={className} className={"gender__block " + className}>
              <Link href={href}>
                <a className="gender__block-link">
                  <Image alt="" layout="fill" src={imgSource} objectFit="cover" priority loading="eager" />
                  <h3 className="gender__block-title">
                    <span>{title}</span>
                  </h3>
                </a>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const categorySectionBlocks = [
  {
    className: "gender__block-men",
    href: buildProductListingHref({ category: "clothing" }),
    imgSource: clothingImage,
    title: "Clothing",
  },
  {
    className: "gender__block-women",
    href: buildProductListingHref({ category: "accessories" }),
    imgSource: accessoriesImage,
    title: "Accessories",
  },
  {
    className: "gender__block-kids",
    href: buildProductListingHref({ category: "footwear" }),
    imgSource: footwearImage,
    title: "Footwear",
  },
  {
    className: "gender__block-babies",
    href: buildProductListingHref({ category: "home-decor" }),
    imgSource: homeDecorImage,
    title: "Home Decor",
  },
  {
    className: "gender__block-unisex",
    href: buildProductListingHref({ category: "sale" }),
    imgSource: saleImage,
    title: "Sale",
  },
];
