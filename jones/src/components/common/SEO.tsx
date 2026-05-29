import Head from "next/head";
import { useRouter } from "next/router";

import { DOMAIN_NAME } from "@Lib/config";

type SeoJsonLd = Record<string, unknown> | Record<string, unknown>[];

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  canonicalPath?: string;
  name?: string;
  ogType?: string;
  ogImage?: string;
  twitterHandle?: string;
  keywords?: string[];
  noindex?: boolean;
  jsonLd?: SeoJsonLd;
}

const DEFAULT_SITE_URL = DOMAIN_NAME ?? "http://localhost:3000";

function normalizeSiteUrl(url: string) {
  return url.replace(/\/$/, "");
}

function resolveUrl(input: string, baseUrl: string) {
  try {
    return new URL(input, `${normalizeSiteUrl(baseUrl)}/`).toString();
  } catch {
    return input;
  }
}

export default function SEO({
  title = "Shop Jones Merchandise",
  description = "Jones. Your destination for premium merchandise, apparel, and accessories.",
  canonical = DEFAULT_SITE_URL,
  canonicalPath,
  name = "Jones",
  ogType = "website",
  ogImage = "/assets/images/banner-bg-eindhoven.webp",
  twitterHandle = "@creator",
  keywords,
  noindex = false,
  jsonLd,
}: SEOProps) {
  const router = useRouter();
  const siteUrl = normalizeSiteUrl(canonical || DEFAULT_SITE_URL);
  const canonicalUrl = canonicalPath
    ? resolveUrl(canonicalPath, siteUrl)
    : canonical && normalizeSiteUrl(canonical) === siteUrl
      ? resolveUrl(router.asPath, siteUrl)
      : canonical;
  const resolvedImage = resolveUrl(ogImage, siteUrl);
  const robotsContent = noindex ? "noindex,nofollow" : "index,follow";

  return (
    <Head>
      <title>{`${title} | ${name}`}</title>
      <meta name="description" content={description} />
      {keywords?.length ? <meta name="keywords" content={keywords.join(", ")} /> : null}

      <meta key="og_locale" property="og:locale" content="en_IE" />
      <meta property="og:title" content={title} />
      <meta property="og:site_name" content={name} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta key="og_image" property="og:image" content={resolvedImage} />
      <meta
        key="og_image:alt"
        property="og:image:alt"
        content={`${title} | ${name}`}
      />
      <meta key="og_image:width" property="og:image:width" content="1200" />
      <meta key="og_image:height" property="og:image:height" content="630" />

      <meta
        key="twitter:card"
        name="twitter:card"
        content="summary_large_image"
      />
      <meta key="twitter:site" name="twitter:site" content={twitterHandle} />
      <meta
        key="twitter:creator"
        name="twitter:creator"
        content={twitterHandle}
      />
      <meta key="twitter:title" name="twitter:title" content={title} />
      <meta
        key="twitter:description"
        name="twitter:description"
        content={description}
      />
      <meta key="twitter:image" name="twitter:image" content={resolvedImage} />
      <meta
        key="twitter:image:alt"
        name="twitter:image:alt"
        content={`${title} | ${name}`}
      />

      <meta name="robots" content={robotsContent} />

      <link rel="canonical" href={canonicalUrl} />

      {jsonLd ? (
        <script
          key="jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
    </Head>
  );
}
