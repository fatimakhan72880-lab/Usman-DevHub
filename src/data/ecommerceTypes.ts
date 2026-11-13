export interface ECommercePageBreakdownItem {
  title: string;
  purpose: string;
  keySections: string[];
}

export interface ECommerceTechnicalFeatureItem {
  title: string;
  description: string;
  category: 'Payment & Security' | 'Performance & Conversion' | 'Inventory & Operations' | 'Design & UX' | 'Marketing & Analytics';
}

export interface ECommerceWorkflowPhaseItem {
  step: string;
  timeline: string;
  title: string;
  description: string;
  deliverables: string[];
}

export interface ECommerceTypeInfo {
  id: string;
  name: string;
  tagline: string;
  whatIsIt: string;
  whatClientGets: string[];
  pagesIncluded: string[];
  keyFeatures: string[];
  designAndResponsive: string;
  bestFor: string;
  estimatedDelivery: string;
  isCustom?: boolean;
  heroImage: string;
  badge?: string;
  categoryPill?: string;
  pageBreakdown?: ECommercePageBreakdownItem[];
  technicalFeatures?: ECommerceTechnicalFeatureItem[];
  workflowPhases?: ECommerceWorkflowPhaseItem[];
  recommendedAddOns?: string[];
  techStack?: string[];
}

export const ECOMMERCE_TYPES_DATA: ECommerceTypeInfo[] = [
  {
    id: 'custom-any-store',
    name: 'Custom & Any Niche Store',
    tagline: 'Bespoke online storefront engineered for any product niche and brand aesthetic.',
    badge: 'Any Niche • Bespoke',
    categoryPill: 'Custom Storefront Architecture',
    isCustom: true,
    whatIsIt: 'Tailored digital store engineered for your unique products with sub-second checkout, mobile-first UX, and zero platform transaction cuts.',
    whatClientGets: [
      'Custom Responsive Storefront UI/UX',
      'Dynamic Product Variants & Swatches',
      '1-Click Mobile Express Checkout',
      'Multi-Currency & Regional Taxes',
      'Live Inventory & Stock Alerts',
      'Automated Invoices & Order Receipts',
      'Production Deployment & Free SSL',
      'Complete Admin Training & Handover'
    ],
    pagesIncluded: [
      'Home (Brand hero, featured products & reviews)',
      'Catalog (Smart filters, instant search & sorting)',
      'Product Page (Gallery, swatches & sticky buy bar)',
      'Cart & Checkout (Slide-out drawer & express pay)'
    ],
    pageBreakdown: [
      {
        title: 'Home Page',
        purpose: 'Establish brand credibility, highlight hero products, and guide shoppers into the catalog.',
        keySections: ['Hero Banner', 'Featured Collections', 'Customer Reviews', 'Trust Badges']
      },
      {
        title: 'Catalog & Collections',
        purpose: 'Fast product discovery with clean attribute filters, sorting, and instant search.',
        keySections: ['Filter Bar', 'Price Sorting', 'Product Grid View', 'Quick-View Modal']
      },
      {
        title: 'Product Detail Page (PDP)',
        purpose: 'Maximize conversions with high-res galleries, variant swatches, and live stock.',
        keySections: ['Image Gallery', 'Variant Swatches', 'Stock Status', 'Shipping Accordion']
      },
      {
        title: 'Cart & Seamless Checkout',
        purpose: 'Eliminate cart abandonment with an instant slide drawer and 1-click payment.',
        keySections: ['Shipping Bar', '1-Click Express Pay', 'Promo Code Input', 'Order Summary']
      }
    ],
    technicalFeatures: [
      {
        title: 'Sub-Second Speed',
        description: 'Optimized asset delivery and fast caching for 95+ Core Web Vitals.',
        category: 'Performance & Conversion'
      },
      {
        title: '1-Click Express Pay',
        description: 'Instant checkout supporting Apple Pay, Google Pay, and Stripe.',
        category: 'Payment & Security'
      },
      {
        title: 'Multi-Currency Auto-Detection',
        description: 'Presents local currency and regional tax rates automatically based on location.',
        category: 'Payment & Security'
      },
      {
        title: 'Automated Invoices & Sync',
        description: 'Generates branded PDF invoices and dispatches order confirmation receipts.',
        category: 'Inventory & Operations'
      }
    ],
    keyFeatures: [
      'Tailored to any product niche with custom options',
      'Sub-second 1-click mobile express checkout',
      'Multi-currency auto-conversion',
      'Real-time inventory deduction & stock alerts',
      'Zero platform transaction fees or revenue cuts'
    ],
    designAndResponsive: '100% responsive, touch-calibrated layouts for iPhone, Android, tablet, and desktop.',
    bestFor: 'DTC brands, specialty retail, fashion, electronics, cosmetics, and unique product lines.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80',
    techStack: ['Custom Code', 'Shopify / Shopify Plus', 'WordPress & WooCommerce', 'Stripe API', 'Tailwind CSS'],
    recommendedAddOns: [
      'Multi-Currency Auto-Detection',
      'Automated WhatsApp Order Alerts',
      'Product Customizer & Engraving Preview',
      'Customer Verified Reviews & Star Ratings'
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Catalog Architecture',
        description: 'Define catalog hierarchy, product variants, and payment methods.',
        deliverables: ['Catalog schema', 'Payment gateway spec', 'Design direction']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'Storefront UI Design',
        description: 'Design responsive desktop and mobile storefront layouts and cart drawers.',
        deliverables: ['Responsive UI screens', 'Product page wireframes', 'Cart drawer UX']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Build & Integration',
        description: 'Develop performant code, connect payment gateways, and configure receipts.',
        deliverables: ['Storefront codebase', 'Stripe setup', 'Inventory sync hooks']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'QA & Live Launch',
        description: 'End-to-end checkout testing, domain SSL cutover, and admin handover.',
        deliverables: ['Live transaction test', 'Domain & SSL launch', 'Admin training guide']
      }
    ]
  },
  {
    id: 'b2b-wholesale',
    name: 'B2B Wholesale & Bulk Commerce',
    tagline: 'Wholesale portal with tiered volume pricing, customer discounts, and purchase orders.',
    badge: 'High Order Volume',
    categoryPill: 'B2B Corporate Commerce',
    whatIsIt: 'Wholesale commerce portal built for distributors and manufacturers needing gated corporate pricing, quick bulk ordering, and Net-30 invoice terms.',
    whatClientGets: [
      'Gated Corporate Buyer Login & Vetting',
      'Tiered Bulk Volume Pricing Matrices',
      'Quick CSV / SKU Bulk Order Sheet Entry',
      'Net-30 Invoicing & Purchase Order Support',
      'Tax-Exemption Certificate Verification',
      'Pallet & Freight Shipping Calculations',
      'Production Deployment & Free SSL',
      'Corporate Admin Training & Handover'
    ],
    pagesIncluded: [
      'Wholesale Home (Trade credibility & buyer login)',
      'Tiered Catalog (Volume price discounts & tiers)',
      'Quick Bulk Pad (Rapid SKU order entry)',
      'Corporate Dashboard (Credit limits & invoices)'
    ],
    pageBreakdown: [
      {
        title: 'Wholesale Portal Home',
        purpose: 'Establish trade authority, outline corporate terms, and provide buyer login.',
        keySections: ['Trade Login', 'Volume Benefits', 'Product Lines', 'Credit Terms']
      },
      {
        title: 'Bulk Order Matrix & Quick Pad',
        purpose: 'Enable procurement managers to add dozens of variants and bulk quantities rapidly.',
        keySections: ['Fast Grid Inputs', 'Volume Discounts', 'CSV Bulk Upload', 'Quote PDF']
      },
      {
        title: 'Corporate Account Dashboard',
        purpose: 'Give purchasing departments full visibility over open invoices, past POs, and re-orders.',
        keySections: ['Credit Limit Status', 'Download Invoices', '1-Click Repeat Order', 'Tax Exemption']
      },
      {
        title: 'Quote & PO Checkout',
        purpose: 'Facilitate formal procurement checkouts with purchase order numbers or credit lines.',
        keySections: ['Purchase Order Input', 'Net-30 Terms', 'Freight Options', 'Signoff Approval']
      }
    ],
    technicalFeatures: [
      {
        title: 'Dynamic Tiered Pricing',
        description: 'Displays custom wholesale pricing tiers only to approved commercial accounts.',
        category: 'Payment & Security'
      },
      {
        title: 'Purchase Order & Net Terms',
        description: 'Supports formal purchase order number entry and corporate invoice terms.',
        category: 'Payment & Security'
      },
      {
        title: 'Freight & Pallet Calculation',
        description: 'Calculates LTL freight and pallet shipping rates based on gross freight weight.',
        category: 'Inventory & Operations'
      },
      {
        title: 'ERP & Accounting Sync',
        description: 'Syncs invoices and bulk orders with accounting systems smoothly.',
        category: 'Inventory & Operations'
      }
    ],
    keyFeatures: [
      'Tiered bulk volume discount matrix per SKU',
      'Quick order spreadsheet / CSV bulk upload',
      'Net-30 / Net-60 invoicing & Purchase Order support',
      'Gated wholesale pricing & dealer registration vetting',
      'LTL freight & pallet shipping rate calculations'
    ],
    designAndResponsive: 'Structured layout optimized for procurement teams and mobile field reps.',
    bestFor: 'Manufacturers, industrial distributors, bulk apparel suppliers, and B2B trade brands.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    techStack: ['Custom Code', 'Shopify Plus / B2B', 'WordPress & WooCommerce B2B', 'Stripe Invoicing', 'PostgreSQL'],
    recommendedAddOns: [
      'QuickBooks / Xero Automated Accounting Sync',
      'Custom RFQ (Request for Quote) Negotiation Portal',
      'Automated Tax-Exemption Verification Logic',
      'Multi-Branch Corporate Sub-Accounts'
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Wholesale Tier Modeling',
        description: 'Define corporate buyer workflows, discount matrices, and tax rules.',
        deliverables: ['Pricing hierarchy', 'Dealer vetting spec', 'Permissions roadmap']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'B2B Interface Design',
        description: 'Design quick order pads, CSV upload flows, and formal quotation request sheets.',
        deliverables: ['Bulk order UI', 'Quotation builder', 'Account dashboard screens']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Logic & PO Integration',
        description: 'Develop Net-30 checkout, gated customer groups, and freight calculation.',
        deliverables: ['PO / Net-30 gateway', 'Dynamic pricing engine', 'Tax exemption logic']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Testing & Handover',
        description: 'Simulate high-volume bulk orders, verify accounting sync, and train team.',
        deliverables: ['Bulk stress test', 'Accounting sync audit', 'Admin walkthrough']
      }
    ]
  },
  {
    id: 'marketplace-multi-vendor',
    name: 'Multi-Vendor Marketplace',
    tagline: 'Multi-seller platform with vendor portals, automated payouts, and unified checkout.',
    badge: 'Multi-Seller Platform',
    categoryPill: 'Marketplace Architecture',
    whatIsIt: 'Full-featured marketplace allowing multiple independent sellers to list products, while the platform collects automated commissions.',
    whatClientGets: [
      'Vendor Onboarding & Stripe Connect Payouts',
      'Independent Seller Management Dashboards',
      'Unified Shopping Cart & Multi-Seller Checkout',
      'Automated Platform Commission Deductions',
      'Customer-to-Vendor Direct Messaging System',
      'Vendor Verification Badges & Customer Ratings',
      'Production Deployment & High-Traffic Cloud Setup',
      'Master Admin Marketplace Documentation'
    ],
    pagesIncluded: [
      'Marketplace Home (Curated sellers & discovery)',
      'Marketplace Catalog (Filter by seller location & rating)',
      'Seller Storefront (Vendor banner, reviews & catalog)',
      'Unified Cart & Checkout (Single transaction split)'
    ],
    pageBreakdown: [
      {
        title: 'Marketplace Home',
        purpose: 'Showcase verified sellers, trending products, and invite new vendor applications.',
        keySections: ['Featured Sellers', 'Trending Finds', 'Category Grid', 'Vendor Sign-up']
      },
      {
        title: 'Individual Seller Storefront',
        purpose: 'Provide each merchant with their own branded profile, reviews, and catalog.',
        keySections: ['Vendor Cover & Avatar', 'Verification Badges', 'Vendor Catalog', 'Direct Contact']
      },
      {
        title: 'Vendor Operations Dashboard',
        purpose: 'Give sellers self-service tools to manage inventory, fulfill orders, and track payouts.',
        keySections: ['Sales Analytics', 'Product Manager', 'Order Fulfillment', 'Stripe Connect Payouts']
      },
      {
        title: 'Unified Multi-Seller Cart',
        purpose: 'Allow shoppers to buy items from multiple vendors in a single checkout transaction.',
        keySections: ['Split Shipping', 'Single Payment Gateway', 'Order Tracking', 'Vendor Receipt Routing']
      }
    ],
    technicalFeatures: [
      {
        title: 'Stripe Connect Split Payouts',
        description: 'Splits customer payment instantly between platform commission and vendor accounts.',
        category: 'Payment & Security'
      },
      {
        title: 'Multi-Origin Shipping Engine',
        description: 'Calculates discrete shipping costs for items dispatched from different warehouses.',
        category: 'Inventory & Operations'
      },
      {
        title: 'Automated Commission Ledger',
        description: 'Tracks platform earnings, dispute fees, and automated vendor disbursements.',
        category: 'Marketing & Analytics'
      },
      {
        title: 'High-Traffic Cloud Scaling',
        description: 'Engineered with Redis caching and serverless functions for flash-sale traffic surges.',
        category: 'Performance & Conversion'
      }
    ],
    keyFeatures: [
      'Self-service vendor registration & automated onboarding',
      'Independent seller dashboards for catalog & order fulfillment',
      'Stripe Connect instant commission splits & payouts',
      'Unified buyer cart handling items from multiple sellers',
      'Vendor review rating system & direct customer inquiry'
    ],
    designAndResponsive: 'Vibrant, community-driven marketplace layout with clear seller differentiation.',
    bestFor: 'Multi-vendor marketplaces, artisan collectives, consignment networks, and boutique hubs.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=1200&q=80',
    techStack: ['Custom Code', 'Shopify Marketplace', 'WordPress & WooCommerce', 'Stripe Connect', 'PostgreSQL', 'Tailwind CSS'],
    recommendedAddOns: [
      'Real-Time In-App Buyer-Seller Chat',
      'Promoted Products / Sponsored Vendor Ads Engine',
      'Custom Delivery Distance Geolocation Calculation',
      'Automated Multi-Vendor Review Syndication'
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Rules & Commission Setup',
        description: 'Establish vendor vetting, platform commission percentages, and payout schedules.',
        deliverables: ['Commission schedule', 'Vendor policy rules', 'Dispute architecture']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'Dual Interface Design',
        description: 'Design the public shopping experience and private vendor seller dashboard.',
        deliverables: ['Public catalog screens', 'Seller storefront profiles', 'Vendor dashboard UI']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Stripe Connect Integration',
        description: 'Build split-order routing, Stripe Connect payouts, and multi-seller checkout.',
        deliverables: ['Stripe Connect onboarding', 'Split shipping engine', 'Unified cart checkout']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Multi-Seller Testing & Launch',
        description: 'Test multi-vendor split transactions, audit payout ledgers, and launch.',
        deliverables: ['Split test transactions', 'Commission ledger check', 'Production cloud launch']
      }
    ]
  },
  {
    id: 'digital-subscriptions',
    name: 'Digital Products & Subscriptions',
    tagline: 'Automated delivery for digital downloads, license keys, courses, and recurring passes.',
    badge: 'Instant Automated Delivery',
    categoryPill: 'Digital & Membership Commerce',
    whatIsIt: 'Digital storefront engineered for selling downloadable files, software licenses, courses, and recurring memberships with zero manual fulfillment.',
    whatClientGets: [
      'Secure Time-Expiring Download Links',
      'Automated License Key Generation & Validation',
      'Stripe Billing Recurring Subscriptions',
      'Customer Member Vault & Download Library',
      'PDF Anti-Piracy Watermarking Protection',
      '1-Click Mobile Express Payment',
      'Production Deployment & High-Speed CDN',
      'Digital Asset Setup & Admin Walkthrough'
    ],
    pagesIncluded: [
      'Digital Home (Software demos & bundle offers)',
      'Product Detail (Video preview & instant buy CTA)',
      'Pricing Tiers (Monthly vs annual toggle)',
      'Customer Member Vault (Owned files, keys & invoices)'
    ],
    pageBreakdown: [
      {
        title: 'Digital Showcase Home',
        purpose: 'Drive instant digital sales with software screenshots, video demos, and social proof.',
        keySections: ['Animated Demo Hero', 'Feature Highlights', 'Customer Reviews', '1-Click Buy CTA']
      },
      {
        title: 'Product & Bundle Page',
        purpose: 'Detailed file breakdowns, compatibility specs, and instant download checkout.',
        keySections: ['Preview Player', 'Included Files', 'Changelog', 'Instant Buy Button']
      },
      {
        title: 'Membership & Pricing Tiers',
        purpose: 'Convert one-time buyers into recurring subscribers with clear tiered benefits.',
        keySections: ['Monthly / Annual Switcher', 'Comparison Matrix', 'Subscriber Perks', 'Guarantee']
      },
      {
        title: 'Customer Member Vault',
        purpose: 'Give buyers a permanent cloud dashboard to access files, updates, and license keys.',
        keySections: ['Cloud Downloads', 'Copy License Key', 'Billing Management', 'Order History']
      }
    ],
    technicalFeatures: [
      {
        title: 'Expiring Time-Locked URLs',
        description: 'Generates secure cryptographic links that expire to stop unauthorized sharing.',
        category: 'Payment & Security'
      },
      {
        title: 'Dynamic License Key Minting',
        description: 'Auto-generates unique software keys and validates active activations.',
        category: 'Performance & Conversion'
      },
      {
        title: 'Stripe Billing Engine',
        description: 'Manages recurring monthly or annual memberships and automatic renewals.',
        category: 'Payment & Security'
      },
      {
        title: 'Global CDN Delivery',
        description: 'Ultra-fast file downloads powered by edge caching worldwide.',
        category: 'Performance & Conversion'
      }
    ],
    keyFeatures: [
      'Secure time-expiring download links (Cloudflare R2 / AWS S3)',
      'Automated unique software license key generation & validation',
      'Stripe Billing recurring monthly / annual membership management',
      'Customer digital member vault with permanent file re-downloads',
      'Instant sub-second delivery with zero manual fulfillment effort'
    ],
    designAndResponsive: 'Sleek, modern creator-focused aesthetic optimized for high digital conversion.',
    bestFor: 'Software developers, digital asset creators, courses, design presets, and memberships.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    techStack: ['Custom Code', 'Shopify Digital', 'WordPress & WooCommerce', 'Stripe Billing', 'Tailwind CSS', 'TypeScript'],
    recommendedAddOns: [
      'Discord / Telegram Automated Community Role Bot',
      'PDF Anti-Piracy Dynamic Watermarking Engine',
      'Affiliate Referral Commission Tracking Portal',
      'Multi-Tier Lifetime Access Pass Bundles'
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Asset & Tier Architecture',
        description: 'Define digital product assets, download policies, and recurring membership tiers.',
        deliverables: ['Digital asset mapping', 'Subscription tier spec', 'License delivery rules']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'High-Converting UI Design',
        description: 'Design digital product landing pages, tier comparison tables, and member vault.',
        deliverables: ['Product landing screens', 'Pricing matrix UI', 'Member vault dashboard']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Stripe Billing & Storage Build',
        description: 'Implement automated license minting, expiring file links, and Stripe webhooks.',
        deliverables: ['Stripe Billing integration', 'Secure storage setup', 'Instant email delivery']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Delivery Testing & Launch',
        description: 'Perform end-to-end test purchases, verify download links, and launch.',
        deliverables: ['Transaction test runs', 'Download link audit', 'Store management guide']
      }
    ]
  }
];
