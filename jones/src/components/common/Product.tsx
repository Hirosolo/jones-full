import type { ProductComponentType } from "src/types/shared";

import { useEffect, useRef, useState } from "react";
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

const loggedProductDebugIds = new Set<string>();

export default function Product(props: ProductComponentType) {
  const {
    small = false,
    title,
    price,
    discount,
    mediaURLs,
    gender,
    ratings,
    sku,
    id,
    blurDataUrl,
  } = props;

  const format = useCurrencyFormatter();
  const { addToWishlist, removeFromWishlist, user } = useAuthState();
  const isOnWishlist = !!user.wishlist.items[id];
  const MAX_IMAGE_SLIDES = Math.min(3, mediaURLs.length);
  const [imageIndex, setImageIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const activeImage = mediaURLs[imageIndex % MAX_IMAGE_SLIDES] || mediaURLs[0];
  const currentImage = activeImage || ProductPlaceholderImg;

  useEffect(() => {
    if (loggedProductDebugIds.has(id)) {
      return;
    }

    loggedProductDebugIds.add(id);
    console.log("[Product image debug]", {
      id,
      title,
      mediaURLs,
      activeImage: currentImage,
    });
  }, [id, title, mediaURLs, currentImage]);

  const handleWishlistAction = () => {
    if (isOnWishlist) {
      return removeFromWishlist(id);
    }
    addToWishlist(props);
  };

  return (
    <li
      className={`product${small ? " product--small" : ""}`}
      onPointerEnter={() => {
        clearInterval(timer.current);
        setImageIndex(1);
        timer.current = setInterval(() => {
          setImageIndex((index) => index + 1);
        }, 1000);
      }}
      onPointerLeave={() => {
        clearInterval(timer.current);
        setImageIndex(0);
      }}
    >
      <Link href={`/product/${getPathString(title + " " + sku)}`}>
        <a>
          <div className="product__wrapper">
            <div className="product__image">
              {isRemoteImageUrl(currentImage) ? (
                <img
                  src={currentImage}
                  className={clsx("product__image-img", "product__image-img--active")}
                  style={{ objectFit: "contain" }}
                  alt=""
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
                <p className="product__type">{gender}</p>
                <h3 title={title} className="product__title">
                  {title}
                </h3>
              </header>
              <div className="product__rating">
                <RatingStars count={ratings} />
              </div>
              <p className="product__price">
                <span className="product__amount">
                  {format(price - discount)}
                </span>

                {discount ? (
                  <>
                    <span className="product__discount-percentage">
                      {Math.floor((discount / price) * 100)}% off
                    </span>
                    <span className="product__old-price">
                      <span className="product__old-amount">
                        {format(price)}
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
