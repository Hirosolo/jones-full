import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import bannerImage from "@Images/pexels-theia-sight-4932179.jpg";
import clothingImage from "@Images/clothing.jpg";
import accessoriesImage from "@Images/acessories.jpg";
import footwearImage from "@Images/footware.webp";
import homeDecorImage from "@Images/homedecor.jpeg";
import saleImage from "@Images/sale.jpg";

import { getCategories } from "@Lib/api/catalog";
import type { BackendCategory } from "src/types/backend";
import { getPathString } from "src/utils";

type CategoryCard = {
  className: string;
  href: string;
  imgSource: typeof clothingImage;
  title: string;
};

const fallbackCategorySectionBlocks: CategoryCard[] = [
  {
    className: "gender__block-men",
    href: "/category/clothing",
    imgSource: clothingImage,
    title: "Clothing",
  },
  {
    className: "gender__block-women",
    href: "/category/accessories",
    imgSource: accessoriesImage,
    title: "Accessories",
  },
  {
    className: "gender__block-kids",
    href: "/category/footwear",
    imgSource: footwearImage,
    title: "Footwear",
  },
  {
    className: "gender__block-babies",
    href: "/category/home-decor",
    imgSource: homeDecorImage,
    title: "Home Decor",
  },
  {
    className: "gender__block-unisex",
    href: "/category/sale",
    imgSource: saleImage,
    title: "Sale",
  },
];

export default function GenderSection() {
  const [categories, setCategories] = useState<BackendCategory[]>([]);

  useEffect(() => {
    let active = true;

    getCategories()
      .then((items) => {
        if (!active) return;
        setCategories(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!active) return;
        setCategories([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const categorySectionBlocks = buildCategoryBlocks(categories);

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
          />
          <h3 className="gender__text-overlay">
            Shop By
            <br />
            Category
          </h3>
        </div>
        <div className="gender__grid">
          {categorySectionBlocks.map(({ className, href, imgSource, title }) => (
            <div key={className} className={"gender__block " + className}>
              <Link href={href}>
                <a className="gender__block-link">
                  <Image alt="" layout="fill" src={imgSource} objectFit="cover" />
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

function buildCategoryBlocks(categories: BackendCategory[]): CategoryCard[] {
  const apiCategories = categories
    .filter((category) => (category.slug || category.name || "").trim())
    .filter((category) => (category.slug || "").toLowerCase() !== "all")
    .slice(0, fallbackCategorySectionBlocks.length);

  if (apiCategories.length === 0) {
    return fallbackCategorySectionBlocks;
  }

  return fallbackCategorySectionBlocks.map((fallback, index) => {
    const category = apiCategories[index];
    if (!category) {
      return fallback;
    }

    return {
      ...fallback,
      href: `/category/${getPathString(category.slug || category.name)}`,
      title: category.name,
    };
  });
}
