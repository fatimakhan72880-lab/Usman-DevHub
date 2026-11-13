export interface WebsiteMaintenanceTypeInfo {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  categoryPill?: string;
  whatIsIt: string;
  whatClientGets: string[];
  bestFor: string;
  estimatedDelivery?: string;
}

export const WEBSITE_MAINTENANCE_TYPES_DATA: WebsiteMaintenanceTypeInfo[] = [
  {
    id: 'bug-fixing',
    name: 'Bug Fixing',
    tagline: 'Rapid troubleshooting and fixes for layout glitches, broken forms, mobile errors, and buttons.',
    badge: 'Fixes & Hotpatches',
    categoryPill: 'Troubleshooting & Fixes',
    whatIsIt: 'Fast response troubleshooting and hotfixes for unexpected layout glitches, broken contact forms, responsive display errors, or console bugs.',
    whatClientGets: [
      'Fixing mobile responsive layout & alignment bugs',
      'Repairing broken forms, submit buttons, and notifications',
      'Troubleshooting frontend errors and script glitches',
      'Cross-browser testing (Chrome, Safari, iOS, Android)',
      'Safe code patch deployment with zero downtime'
    ],
    bestFor: 'WordPress, Shopify, WooCommerce, or Custom websites facing broken layouts, non-working buttons, checkout issues, or sudden display errors.',
    estimatedDelivery: 'Decided Upon Discussion'
  },
  {
    id: 'updates',
    name: 'Updates',
    tagline: 'Adding new content, text revisions, image swaps, promotional banners, and section changes.',
    badge: 'Content & Media',
    categoryPill: 'Content & Updates',
    whatIsIt: 'Routine on-demand updates whenever you need fresh text, new photos, promotional banners, or new sections added to your website.',
    whatClientGets: [
      'Text, copywriting, and high-resolution photo replacements',
      'Adding promotional banners, announcement bars, and new sections',
      'Uploading new products, services, or portfolio items',
      'Contact detail updates, WhatsApp links, and social integrations',
      'Staging preview link provided before changes go live'
    ],
    bestFor: 'WordPress, Shopify, or Custom Code websites that frequently update announcements, product listings, banners, or portfolio items.',
    estimatedDelivery: 'Decided Upon Discussion'
  },
  {
    id: 'performance-optimization',
    name: 'Performance Optimization',
    tagline: 'Speed enhancement, image compression, script cleanup, and Google PageSpeed score tuning.',
    badge: 'Speed & Tuning',
    categoryPill: 'Speed & Performance',
    whatIsIt: 'Complete speed and performance tuning to make your website load fast, reduce visitor bounce rates, and score high on Google PageSpeed.',
    whatClientGets: [
      'Heavy image compression and conversion to next-gen WebP format',
      'Minification of JavaScript/CSS and cleaning up unused scripts',
      'Browser caching and CDN edge network configuration',
      'Speed score improvements for both mobile and desktop',
      'Before and after verified speed comparison report'
    ],
    bestFor: 'WordPress, WooCommerce, Shopify, or Custom sites that feel slow to load, lose visitors on mobile, or need better Google PageSpeed scores.',
    estimatedDelivery: 'Decided Upon Discussion'
  }
];
