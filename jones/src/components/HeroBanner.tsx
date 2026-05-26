import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { RiRadioButtonLine, RiCheckboxBlankCircleFill } from "react-icons/ri";

import { useAnnouncementState } from "@Contexts/UIContext";
import useMouseCoords from "@Hooks/useMouseCoords";
import useScrollTop from "@Hooks/useScrollTop";
import SocialIcons from "./common/SocialButtons";

import BannerImage1 from "@Images/acdc-hoodie-banner.webp";
import BannerImage2 from "@Images/monsterEnergy-cap-banner.webp";
import BannerImage3 from "@Images/starWar-cup-banner.webp";
import { MoonLoader } from "react-spinners";

const INTERVAL = 6000;

type HeroSlide = {
  order?: number;
  type: string;
  secondary: { highlighted: string; text: string };
  title: string;
  buttonText: string;
  imageSrc: {
    width: number;
    height: number;
    src: string;
  };
  url: string;
};

type BackendHeroSlide = {
  type?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  image?: string;
  link?: string;
};

const IMAGE_LOOKUP: Record<string, { width: number; height: number; src: string }> = {
  "/assets/images/acdc-hoodie-banner.webp": BannerImage1,
  "/assets/images/monsterEnergy-cap-banner.webp": BannerImage2,
  "/assets/images/starWar-cup-banner.webp": BannerImage3,
  "/img/hero-slide-1.png": BannerImage1,
  "/img/hero-slide-2.png": BannerImage2,
  "/img/hero-slide-3.png": BannerImage3,
};

function getImageSource(imagePath: string) {
  return IMAGE_LOOKUP[imagePath] || BannerImage1;
}

function splitSecondaryText(description: string) {
  const normalized = String(description || "").trim();
  if (!normalized) {
    return { highlighted: "", text: "" };
  }

  const parts = normalized.split(/\s+/);
  const highlighted = parts.shift() || "";
  return {
    highlighted,
    text: parts.join(" "),
  };
}

function stripHtml(html: string) {
  return String(html || "").replace(/<[^>]*>/g, "").trim();
}

export default function HeroBanner() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const announcementVisible = useAnnouncementState();
  const [x, y] = useMouseCoords(bannerRef.current, 25, 100);
  const scrollTop = useScrollTop();

  const short = router.pathname != "/";

  useEffect(() => {
    let cancelled = false;

    async function loadHeroSlides() {
      setLoading(true);
      try {
        const response = await fetch("/api/shop/cms/site-content/", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        const heroSlides = Array.isArray(data?.home?.hero?.defaultSlides)
          ? data.home.hero.defaultSlides
          : [];

        const normalized = heroSlides
          .map((slide: BackendHeroSlide) => {
            const title = stripHtml(String(slide?.title || "")).trim();
            const description = stripHtml(String(slide?.description || "")).trim();
            const imagePath = String(slide?.image || "").trim();
            const imageSrc = getImageSource(imagePath);
            const order = Number((slide as any)?.order || 0) || 0;
            const buttonText = stripHtml(String(slide?.buttonText || '')).trim();

            if (!title || !imagePath) {
              return null;
            }

            return {
              order,
              type: stripHtml(String(slide?.type || "")) || title,
              secondary: splitSecondaryText(description),
              buttonText: buttonText || 'buy yours',
              title,
              imageSrc,
              url: String(slide?.link || "/").trim() || "/",
            } as HeroSlide;
          })
          .filter((slide: HeroSlide | null): slide is HeroSlide => Boolean(slide)) as HeroSlide[];

        normalized.sort((a, b) => (a.order || 0) - (b.order || 0));
        console.log("[HeroBanner] loaded hero slides", normalized.length);

        if (!cancelled) {
          setSlides(normalized);
          setActiveView(0);
        }
      } catch (error) {
        console.log("[HeroBanner] failed to load hero slides", error);
        if (!cancelled) {
          setSlides([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHeroSlides();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveView(current => (current + 1) % slides.length);
    }, INTERVAL);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    if (activeView >= slides.length) {
      setActiveView(0);
    }
  }, [activeView, slides.length]);

  const activeSlide = slides[activeView] || slides[0];

  return (
    <section
      id="main-banner"
      className={
        "banner" +
        (short ? " banner--short" : "") +
        (announcementVisible ? " banner--with-announcement" : "")
      }
    >
      <div ref={bannerRef} className="banner__container">
        <div className="banner__background"></div>
        {short || loading ? null : (
          <>
            <div className="banner__indicators">
              {slides.map((_, i) => (
                <button
                  aria-label={"slide " + (i + 1)}
                  key={"indicator" + i}
                  onClick={() => setActiveView(i)}
                  className={
                    "banner__indicator" +
                    (activeView == i ? " banner__indicator--active" : "")
                  }
                >
                  {activeView == i ? (
                    <RiRadioButtonLine />
                  ) : (
                    <RiCheckboxBlankCircleFill />
                  )}
                </button>
              ))}
            </div>

            <div className="banner__social-links">
              <SocialIcons vertical />
            </div>

            <div className="banner__main">
              {!!bannerRef.current && activeSlide ? (
                <>
                  {slides.map((data, i) => (
                    <div
                      key={data.title + data.type}
                      className={
                        "banner__content" +
                        (activeView == i ? " banner__content--active" : "")
                      }
                    >
                      <div className="banner__headings">
                        <p className="banner__secondary-text">
                          <span>{data.secondary.highlighted}</span>{" "}
                          {data.secondary.text}
                        </p>
                        <h2
                          style={{
                            transform: `translate3d(${-x * 0.2}px, 0, 0)`,
                          }}
                          className="banner__title-type"
                        >
                          <span>{data.type}</span>
                        </h2>
                        <h3 className="banner__title">
                          <span>{data.title}</span>
                        </h3>
                      </div>
                      <div
                        style={{
                          transform: `translate3d(${-x * 0.8}px, ${-y * 0.4 + scrollTop * 0.1
                            }px, 0)`,
                        }}
                        className="banner__image"
                      >
                        <Image
                          className="banner__image-element"
                          layout="responsive"
                          width={data.imageSrc.width}
                          height={data.imageSrc.height}
                          src={data.imageSrc}
                          priority
                          alt={data.title}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="banner__action-button">
                    <Link href={activeSlide.url}>
                      <a className="banner__action-button-link">
                        <span key={activeSlide.buttonText}>{activeSlide.buttonText || 'buy yours'}</span>
                      </a>
                    </Link>
                  </div>
                  <style jsx>{`
                    .banner__action-button-link{display:flex;align-items:center;justify-content:center}
                    .banner__action-button-link > span{display:inline-block;position:relative;animation:heroButtonTextIn .36s ease}
                    @keyframes heroButtonTextIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                  `}</style>
                </>
              ) : loading ? (
                <div className="banner__loader">
                  <MoonLoader color="#fff" className="banner__loader-spinner" />
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
