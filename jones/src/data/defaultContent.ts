/**
 * Default content for the entire site.
 * This serves as both the TypeScript type definition and fallback values.
 * All hardcoded text from sections is extracted here.
 */

// --- Type Definitions ---

export interface HeroSlide {
  type: string
  title: string
  description: string
  buttonText: string
  image: string
  link: string
  order?: number
}

export interface SectionBase {
  enabled: boolean
  order: number
}

export interface HeroContent extends SectionBase {
  defaultSlides: HeroSlide[]
}

export interface SimpleSectionContent extends SectionBase {
  title: string
  subtitle: string
}

export interface YoutubeContent extends SectionBase {
  title: string
  subtitle: string
  videoId: string
}

export interface BannerCTAContent extends SectionBase {
  title: string
  description: string
  backgroundImage: string
  primaryButton: { text: string; link: string }
  secondaryButton: { text: string; link: string }
}

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqContent extends SectionBase {
  title: string
  subtitle: string
  footerText: string
  items: FaqItem[]
}

export interface SocialLink {
  platform: string
  url: string
  visible: boolean
}

export interface FooterContent {
  title: string
  description: string
  copyright: string
  contact: {
    email: string
    phone: string
    address: string
  }
  socialLinks: SocialLink[]
}

export interface SeoContent {
  title: string
  description: string
  keywords: string
  ogImage: string
}

export interface HomeContent {
  hero: HeroContent
  latestProducts: SimpleSectionContent
  categories: SimpleSectionContent
  youtube: YoutubeContent
  bannerCTA: BannerCTAContent
  featuredArticles: SimpleSectionContent
  bestsellers: SimpleSectionContent
  faq: FaqContent
}

export interface ProductSeoOverride {
  slug: string
  title: string
  description: string
  keywords: string
  ogImage: string
}

export interface SiteContent {
  seo: SeoContent
  home: HomeContent
  footer: FooterContent
  productSeo: ProductSeoOverride[]
}

// --- Default Values (extracted from hardcoded content) ---

export const defaultContent: SiteContent = {
  seo: {
    title: 'FulfillNext - Discover. Design. Define Your Style',
    description: 'Discover premium Print On Demand (POD) fashion, custom t-shirts, personalized accessories, and trending lifestyle products at FulfillNext.',
    keywords: 'FulfillNext, Print On Demand, POD, custom t-shirts, personalized products, fashion, trending, lifestyle',
    ogImage: '/images/FulfillNext-og.png',
  },

  home: {
    hero: {
      enabled: true,
      order: 1,
      defaultSlides: [
        {
          type: 'signature',
          title: 'Discover. Design. Define Your Style',
          description: 'Premium trending products with worldwide shipping',
          buttonText: 'SHOP NOW',
          image: '/img/hero-slide-1.png',
          link: '/c/',
        },
        {
          type: 'modern',
          title: 'New Arrivals',
          description: 'Explore the latest collection of fashion, accessories & home decor',
          buttonText: 'EXPLORE',
          image: '/img/hero-slide-2.png',
          link: '/c/',
        },
        {
          type: 'classic',
          title: 'Premium Quality',
          description: 'Custom-designed products made just for you',
          buttonText: 'DISCOVER',
          image: '/img/hero-slide-3.png',
          link: '/c/',
        },
      ],
    },

    latestProducts: {
      enabled: true,
      order: 2,
      title: 'Best Sellers This Week',
      subtitle: 'Top picks our customers love this week',
    },

    categories: {
      enabled: true,
      order: 5,
      title: 'Categories',
      subtitle: '',
    },

    youtube: {
      enabled: true,
      order: 6,
      title: 'Watch Our Latest Video',
      subtitle: 'Discover the latest trends and products from FulfillNext',
      videoId: 'FNMBpEYPTn4',
    },

    bannerCTA: {
      enabled: true,
      order: 7,
      title: 'Discover the Creative Collection for Spring & Summer 2026',
      description: 'Shop Custom Designs Across Fashion, Footwear, Home & Living, Gifts, and Decor. Enjoy Up to 40% Off on All Orders Over $50 – Perfect for the New Season!',
      backgroundImage: '/img/BannerCTA.jpg',
      primaryButton: { text: 'Shop Now', link: '/c/' },
      secondaryButton: { text: 'View Catalog', link: '/c/' },
    },

    featuredArticles: {
      enabled: true,
      order: 8,
      title: 'Featured Articles',
      subtitle: 'Explore our curated articles on web development trends, tips, and design insights to stay informed and inspired.',
    },

    bestsellers: {
      enabled: true,
      order: 9,
      title: 'Our Bestsellers',
      subtitle: 'Shop our most popular products that customers love',
    },

    faq: {
      enabled: true,
      order: 10,
      title: 'Frequently Asked Questions',
      subtitle: 'Find answers to common questions about our products and services.',
      footerText: 'Still have questions? Our customer support team is here to help you 24/7',
      items: [
        {
          question: 'Shipping — how long will delivery take and how can I track my order?',
          answer: 'Delivery times vary depending on your location and the shipping method selected. Once your order is processed, we will send an email/SMS with a tracking number so you can monitor the shipment. For estimated delivery times to your area, please refer to our Shipping & Delivery page or contact Customer Support.',
        },
        {
          question: 'What is your return/exchange policy if an item is defective or not as described?',
          answer: 'We accept returns and exchanges within 14 days of receipt for defective, damaged, or materially misdescribed items. Please keep the item, packaging, and receipt in original condition. To initiate a return or exchange, visit the Returns & Exchanges page or contact support with photos and your order number — our team will guide you through the process and offer a refund or replacement.',
        },
        {
          question: 'Can products be personalized (name printing, engraving, color options)?',
          answer: 'Many items — such as mugs, drinkware, gift items, and selected accessories — support personalization (e.g., printing or engraving). Available personalization options are shown on the product page; you can enter your custom text when adding the product to your cart. Please note that personalized items are generally not eligible for return unless there is a manufacturing defect.',
        },
        {
          question: 'How can I find material, sizing, and care instructions for a product?',
          answer: 'Each product page includes a Specifications or Product Details section listing materials, dimensions, weight, and care instructions (for example: hand wash for printed mugs, gentle wash for clothing). If you need additional technical details, use the "Ask a question about this product" feature on the product page or contact us directly — we\'ll provide precise information to help you make an informed purchase.',
        },
        {
          question: 'Do you offer bulk orders or corporate gifting services — are there discounts or custom packaging?',
          answer: 'Yes — we handle bulk orders and corporate gifting (including personalization and custom packaging). Please submit your request with quantity, product codes, and customization requirements through our Business Inquiry form or business email. Our sales team will respond with pricing, production lead times, and discount options within 48 business hours.',
        },
      ],
    },
  },

  footer: {
    title: 'FULFILLNEXT',
    description: 'FulfillNext is a leading brand in the United States, offering a wide range of high-quality products at affordable prices. With a strong emphasis on creativity and innovation, we stay ahead of the latest trends and transform them into stylish collections that cater to modern lifestyles. Our mission is to do more than just provide products – we aim to inspire confidence and celebrate individuality, ensuring every shopping experience is memorable and on-trend.',
    copyright: 'FulfillNext - All rights reserved - Detective team',
    contact: {
      email: 'support@fulfillnext.shop',
      phone: '+1 (205) 693-8884',
      address: '82920 Kuhic Route, Krajcikville, MS 75052-3698',
    },
    socialLinks: [
      { platform: 'facebook', url: 'https://www.facebook.com/people/FulfillNext-Store/61588882165061/', visible: true },
      { platform: 'twitter', url: 'https://x.com/fulfillnextcom', visible: true },
      { platform: 'instagram', url: 'https://www.instagram.com/fulfillnextstore/', visible: true },
      { platform: 'youtube', url: 'https://www.youtube.com/@FulfillNext-store', visible: true },
      { platform: 'pinterest', url: 'https://www.pinterest.com/fulfillnextcom/', visible: true },
      { platform: 'linkedin', url: 'https://www.linkedin.com/in/fulfillnext', visible: false },
    ],
  },

  productSeo: [],
}