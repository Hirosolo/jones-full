import type { FooterContent } from "@Data/defaultContent";

export const FOOTER_SEED: FooterContent = {
  title: 'Jones',
  description: 'Premium sneaker culture, styled for the Jones community.',
  copyright: 'Jones LLC. All Rights Reserved',
  contact: {
    address: '46 Lakeshore St. Knoxville, TN 37918',
    phone: '+1 (312) 478 6691',
    email: 'support@jones.com',
    hours: '10:00 - 18:00, Mon - Sat',
  },
  aboutLinks: [
    { label: 'About Us', link: '/about', target: '_self', rel: 'noopener noreferrer', visible: true },
    { label: 'Delivery Information', link: '/delivery-info', target: '_self', rel: 'noopener noreferrer', visible: true },
    { label: 'Contact Us', link: '/contact', target: '_self', rel: 'noopener noreferrer', visible: true },
    { label: 'Returns', link: '/returns', target: '_self', rel: 'noopener noreferrer', visible: true },
    { label: 'F.A.Q', link: '/faq', target: '_self', rel: 'noopener noreferrer', visible: true },
    { label: 'Site Map', link: '/sitemap.xml', target: '_self', rel: 'noopener noreferrer', visible: true },
  ],
  quickLinks: [
    { label: 'Sign In', link: '/signin', target: '_self', rel: 'noopener noreferrer', visible: true },
    { label: 'View Cart', link: '/', target: '_self', rel: 'noopener noreferrer', visible: true },
    { label: 'Track My Order', link: '/track-order', target: '_self', rel: 'noopener noreferrer', visible: true },
  ],
  newsletter: {
    title: 'newsletter',
    description: 'Sign up to our newsletter and we\'ll keep you up-to-date with the latest arrivals and special offers.',
    disclaimer: 'By signing up you are confirming that you have read, understood and accept our Privacy Policy.',
  },
  socialLinks: [
    { platform: 'facebook', url: 'https://www.facebook.com/jonesstore/', visible: true },
    { platform: 'instagram', url: 'https://www.instagram.com/jonesstore/', visible: true },
    { platform: 'youtube', url: 'https://www.youtube.com/c/jonesstore', visible: true },
    { platform: 'twitter', url: 'https://twitter.com/jonesstore', visible: true },
    { platform: 'pinterest', url: 'https://www.pinterest.com/jonesstore/', visible: true },
    { platform: 'github', url: 'https://github.com/VektorTech/jones-store', visible: true },
  ],
  gutter: {
    termsLinks: [
      { label: 'Terms', link: '/terms', target: '_self', rel: 'noopener noreferrer', visible: true },
      { label: 'Privacy', link: '/privacy', target: '_self', rel: 'noopener noreferrer', visible: true },
    ],
    copy: 'Jones LLC. All Rights Reserved',
    languageLabel: 'English',
    currencyLabelPrefix: '$',
  },
};