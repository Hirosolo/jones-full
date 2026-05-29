import type { ProductComponentType } from "src/types/shared";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import clsx from "clsx";

import RatingStars from "./RatingStars";

import { getPathString } from "src/utils";
import { useAuthState } from "@Contexts/AuthContext";
import { ProductPlaceholderImg } from "src/constants";
import { useCurrencyFormatter } from "@Contexts/UIContext";

function isRemoteImageUrl(url: string) {
  return /^https?:\/\//i.test(url) || url.startsWith("//");
}

export default function Product(props: ProductComponentType) {
  const {
    small = false,
    title,
    categoryName,
    brandName,
    price,
    discount,
    mediaURLs,
    gender,
    ratings,
    sku,
    id,
    slug,
    blurDataUrl,
    priority = false,
    loading,
  } = props;

  const format = useCurrencyFormatter();
  const { addToWishlist, removeFromWishlist, user } = useAuthState();
  const isOnWishlist = !!user.wishlist.items[id];
  const imageCount = mediaURLs.length;
  const MAX_IMAGE_SLIDES = Math.max(1, Math.min(3, imageCount));
  const [imageIndex, setImageIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const activeImage = imageCount > 0 ? mediaURLs[imageIndex % MAX_IMAGE_SLIDES] : undefined;
  const currentImage = activeImage || ProductPlaceholderImg;
  const productHref = `/p/${getPathString(slug || id)}`;

  const handleWishlistAction = () => {
    if (isOnWishlist) {
      return removeFromWishlist(id);
    }
    addToWishlist(props);
  };

  const productMeta = [categoryName, brandName].filter(Boolean).join(" · ");

  return (
    <li
      className={`product${small ? " product--small" : ""}`}
      onPointerEnter={() => {
        if (!imageCount) return;
        clearInterval(timer.current);
        setImageIndex(imageCount > 1 ? 1 : 0);
        if (imageCount > 1) {
          timer.current = setInterval(() => {
            setImageIndex((index) => index + 1);
          }, 1000);
        }
      }}
      onPointerLeave={() => {
        clearInterval(timer.current);
        setImageIndex(0);
      }}
    >
      <Link href={productHref}>
        <a>
          <div className="product__wrapper">
            <div className="product__image">
              {isRemoteImageUrl(currentImage) ? (
                <img
                  src={currentImage}
                  className={clsx("product__image-img", "product__image-img--active")}
                  style={{ objectFit: "contain" }}
                  onError={(event) => {
                    console.log("[Product image error]", {
                      id,
                      title,
                      src: currentImage,
                    });
                    event.currentTarget.src = ProductPlaceholderImg;
                  }}
                />
              ) : (
                <Image
                  src={currentImage}
                  blurDataURL={blurDataUrl || ProductPlaceholderImg}
                  placeholder="blur"
                  layout="fill"
                  priority={priority}
                  loading={loading}
                  sizes={small ? "(max-width: 640px) 45vw, 18rem" : "(max-width: 640px) 90vw, (max-width: 992px) 45vw, (max-width: 1200px) 30vw, 25vw"}
                  className={clsx("product__image-img", "product__image-img--active")}
                  objectFit="contain"
                  quality={70}
                  alt=""
                />
              )}
              {discount ? <span className="product__tag">sale</span> : null}
              <div className="product__actions">
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label="Add to wishlist"
                  aria-disabled={user.processing}
                  onClick={(e) => {
                    if (user.processing) return;
                    e.preventDefault();
                    handleWishlistAction();
                  }}
                  className="product__add-wishlist"
                >
                  {isOnWishlist ? (
                    <AiFillHeart className="product__add-wishlist-icon" />
                  ) : (
                    <AiOutlineHeart className="product__add-wishlist-icon" />
                  )}
                </span>
              </div>
            </div>
            <article className="product__info">
              <header>
                <h3 title={title} className="product__title">
                  {title}
                </h3>
                <p className="product__type">{productMeta}</p>
              </header>
              <div className="product__rating">
                <RatingStars count={ratings} />
              </div>
              <p className="product__price">
                <span className="product__amount">
                  {format(price)}
                </span>

                {discount ? (
                  <>
                    <span className="product__discount-percentage">
                      {Math.floor((discount / (price + discount)) * 100)}% off
                    </span>
                    <span className="product__old-price">
                      <span className="product__old-amount">
                        {format(price + discount)}
                      </span>
                    </span>
                  </>
                ) : null}
              </p>
            </article>
          </div>
        </a>
      </Link>
    </li>
  );
}
