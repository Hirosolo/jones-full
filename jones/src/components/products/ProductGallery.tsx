import Image from "next/image";
import { useEffect, useState } from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

import Carousel from "@Components/Carousel";
import { useAuthState } from "@Contexts/AuthContext";
import { ProductPlaceholderImg } from "src/constants";
import { ProductComponentType } from "src/types/shared";

function isRemoteImageUrl(url: string) {
  return /^https?:\/\//i.test(url) || url.startsWith("//");
}

export default function ProductGallery({
  product,
  images,
  dimensions,
  blurDataUrls,
}: PropTypes) {
  const [activeImage, setActiveImage] = useState(0);
  const { addToWishlist, removeFromWishlist, user } = useAuthState();
  const isOnWishlist = !!user.wishlist.items[product.id];

  useEffect(() => {
    console.log("[ProductGallery debug]", {
      productId: product.id,
      title: product.title,
      images,
      activeImage,
      activeImageUrl: images[activeImage],
    });
  }, [product.id, product.title, images, activeImage]);

  const renderImage = (index: number) => {
    const url = images[index];
    if (!url) return null;
    const imageSrc = shouldLoadSlide(index) ? url : ProductPlaceholderImg;

    if (isRemoteImageUrl(imageSrc)) {
      return (
        <img
          className="product-gallery__image"
          key={"image:" + url}
          src={imageSrc}
          onClick={() => window.open(url, "_blank")}
          alt={`${product.title} image ${index + 1}`}
          style={{ objectFit: "contain" }}
          onError={(event) => {
            console.log("[ProductGallery image error]", {
              productId: product.id,
              title: product.title,
              src: imageSrc,
            });
            event.currentTarget.src = ProductPlaceholderImg;
          }}
        />
      );
    }

    return (
      <Image
        className="product-gallery__image"
        key={"image:" + url}
        priority={index === 0}
        loading={index === activeImage ? "eager" : "lazy"}
        sizes="(max-width: 991px) calc((100vw - 3rem) * 0.52), calc((100vw - 5rem) * 0.52)"
        src={imageSrc}
        onClick={() => window.open(url, "_blank")}
        placeholder="blur"
        blurDataURL={blurDataUrls[url] || ProductPlaceholderImg}
        width={dimensions[index]?.width ?? 1000}
        height={dimensions[index]?.height ?? 1000}
        quality={70}
        alt={`${product.title} image ${index + 1}`}
      />
    );
  };

  const shouldLoadSlide = (index: number) => {
    if (images.length <= 2) return true;
    const isActive = index === activeImage;
    const isNext = index === (activeImage + 1) % images.length;
    const isPrev = index === (activeImage - 1 + images.length) % images.length;
    return isActive || isNext || isPrev;
  };

  return (
    <div className="product-gallery">
      <div className="product-gallery__container">
        <div className="product-gallery__images">
          <ul>
            {images.map((url, i) => (
              <li key={url}>
                <button
                  className={i == activeImage ? "product-gallery__thumb-active" : ""}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Show image ${i + 1} of ${images.length}`}
                  aria-pressed={i === activeImage}
                >
                  {isRemoteImageUrl(url) ? (
                    <img
                      src={url}
                      width={80}
                      height={60}
                      style={{ objectFit: "contain", width: "100%", height: "auto" }}
                      alt={`${product.title} thumbnail ${i + 1}`}
                      onError={(event) => {
                        console.log("[ProductGallery thumbnail error]", {
                          productId: product.id,
                          title: product.title,
                          src: url,
                        });
                        event.currentTarget.src = ProductPlaceholderImg;
                      }}
                    />
                  ) : (
                    <Image
                      src={url}
                      width={80}
                      height={60}
                      sizes="80px"
                      placeholder="blur"
                      blurDataURL={blurDataUrls[url] || ProductPlaceholderImg}
                      style={{ objectFit: "contain", width: "100%", height: "auto" }}
                      quality={65}
                      alt={`${product.title} thumbnail ${i + 1}`}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="product-gallery__picture">
          <div className="product-gallery__picture-container">
            {images.length > 1 ? (
              <Carousel
                onUpdate={(i: number) => setActiveImage(i)}
                aIndex={activeImage}
                key={`carousel-${product.id}`}
              >
                {images.map((_, i) => renderImage(i))}
              </Carousel>
            ) : (
              renderImage(0)
            )}
          </div>
          <button
            aria-label="add to wishlist"
            disabled={user.processing}
            onClick={() =>
              isOnWishlist
                ? removeFromWishlist(product.id)
                : addToWishlist(product)
            }
            className="product-gallery__wish"
          >
            {isOnWishlist ? <AiFillHeart /> : <AiOutlineHeart />}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PropTypes {
  product: ProductComponentType;
  images: string[];
  dimensions: { width: number; height: number }[];
  blurDataUrls: Record<string, string>;
}
