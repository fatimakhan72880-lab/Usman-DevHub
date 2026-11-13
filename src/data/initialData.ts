import { Service, Project, ReferralRecord, PartnerToken } from '../types';
import serviceWebDevImg from '../assets/images/service_web_dev_1790513257884.jpg';
import service3dWebImg from '../assets/images/service_3d_web_1790513273723.jpg';
import serviceEcommerceImg from '../assets/images/service_ecommerce_1790513288467.jpg';
import serviceBrandDesignImg from '../assets/images/service_brand_design_1790513301396.jpg';
import serviceVideoAnimImg from '../assets/images/service_video_anim_1790513313691.jpg';
import serviceCloudSetupImg from '../assets/images/service_cloud_setup_1790513329153.jpg';
import serviceMaintenanceImg from '../assets/images/service_maintenance_1790513345000.jpg';

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-1',
    title: 'Web Development',
    category: 'Engineering',
    description: 'Custom web applications, WordPress websites, and high-performance platforms built for your business. Fast, responsive, and SEO-ready.',
    subcategories: [
      'Business Websites',
      'Portfolio Websites',
      'Landing Pages',
      'Corporate Websites',
      'Custom Websites',
      'Website Redesign & Revamp'
    ],
    imageUrl: serviceWebDevImg,
    status: 'active',
    order: 1,
    iconName: 'Globe',
    deliverables: ['Custom Code & Modern Web Apps', 'WordPress & CMS Integration', 'SEO & Core Web Vitals 99+', 'Full Source Code & Admin Setup'],
    timeline: 'Discussed Per Project Scope'
  },
  {
    id: 'srv-2',
    title: '3D Animated Websites',
    category: 'Creative Tech',
    description: 'Immersive digital web experiences crafted across three distinct disciplines: cinematic 3D video atmospheres, hero interactive product experiences, and scroll-driven frame reveals.',
    subcategories: [
      'Interactive 3D Product Experiences',
      'Cinematic 3D Websites',
      'Scroll-Driven Animation'
    ],
    imageUrl: service3dWebImg,
    status: 'active',
    order: 2,
    iconName: 'Box',
    deliverables: ['Hero Interactive Product & Variant Engines', 'Multi-Section Cinematic Video Backgrounds', 'Apple-Grade Frame-by-Frame Scroll Scrubbing', 'Sub-2MB Streaming & 60 FPS Mobile Performance'],
    timeline: 'Discussed Per Project Scope'
  },
  {
    id: 'srv-3',
    title: 'E-Commerce Development',
    category: 'Commerce',
    description: 'High-converting online stores built on Shopify, WooCommerce, or Custom React / Next.js architecture with fast checkout and secure payments.',
    subcategories: [
      'Custom & Any Niche Store',
      'B2B Wholesale & Bulk Commerce',
      'Multi-Vendor Marketplace',
      'Digital Products & Subscriptions'
    ],
    imageUrl: serviceEcommerceImg,
    status: 'active',
    order: 3,
    iconName: 'ShoppingBag',
    deliverables: ['Shopify, WooCommerce & Custom React Stores', 'Sub-Second Cart & 1-Click Checkout', 'Omnichannel Inventory & Currency Sync', 'Conversion Rate & Funnel Optimization'],
    timeline: 'Discussed Per Project Scope'
  },
  {
    id: 'srv-4',
    title: 'Graphic Design',
    category: 'Design & Identity',
    description: 'Memorable brand identities, logos, marketing assets, and modern visuals that make your business stand out.',
    subcategories: [
      'Logo Design',
      'Product Design',
      'Thumbnail Design',
      'Social Media Design'
    ],
    imageUrl: serviceBrandDesignImg,
    status: 'active',
    order: 4,
    iconName: 'Palette',
    deliverables: ['Complete Brand Guidelines & Vector Kit', 'Figma Design System', 'High-Resolution Export Assets', 'Typography & Palette Rules'],
    timeline: 'Discussed Per Project Scope'
  },
  {
    id: 'srv-5',
    title: '3D Video Animation',
    category: 'Video Studio',
    description: 'Short-form 3D animation videos, logo reveals, product demos, and social promos crafted for high impact.',
    subcategories: [
      'Logo Animation',
      'Product Animation',
      'Brand Animation',
      'Promo Videos'
    ],
    imageUrl: serviceVideoAnimImg,
    status: 'active',
    order: 5,
    iconName: 'Film',
    deliverables: ['4K 60fps Master (Max 1 Minute)', 'Transparent WebM Alpha for Websites', 'Sound Effects & Kinetic Captions', 'Multi-Platform Formats (16:9, 9:16)'],
    timeline: 'Discussed Per Project Scope'
  },
  {
    id: 'srv-6',
    title: 'Website Deployment & Cloud Setup',
    category: 'Cloud & Infrastructure',
    description: 'Zero-downtime cloud hosting, VPS server setup, automated CI/CD pipelines, and domain security.',
    subcategories: [
      'Frontend & Web App Deployment',
      'Linux VPS & Docker Server Setup',
      'Domain, DNS & Cloudflare Security',
      'Automated CI/CD & GitHub Actions'
    ],
    imageUrl: serviceCloudSetupImg,
    status: 'active',
    order: 6,
    iconName: 'Cloud',
    deliverables: ['Cloudflare / AWS / Azure / Vercel Infra', 'Automated SSL & HSTS', 'Global CDN Edge Caching', 'Automated Github Actions CI/CD'],
    timeline: 'Discussed Per Project Scope'
  },
  {
    id: 'srv-7',
    title: 'Website Maintenance',
    category: 'Support & SRE',
    description: '24/7 uptime monitoring, security updates, bug fixing, and continuous speed optimization for your website.',
    subcategories: [
      'Bug Fixing',
      'Updates',
      'Performance Optimization'
    ],
    imageUrl: serviceMaintenanceImg,
    status: 'active',
    order: 7,
    iconName: 'ShieldCheck',
    deliverables: ['Real-Time Uptime Alarming', 'Proactive Security Audits', 'Database Query Tuning', 'Priority Response SLA'],
    timeline: 'Discussed Per Project Scope'
  }
];

export const HOME_SERVICE_CATEGORIES: Record<string, string> = {
  'Web Development': 'Engineering',
  '3D Animated Websites': 'Creative Tech',
  'E-Commerce Development': 'Commerce',
  'Graphic Design': 'Design & Identity',
  '3D Video Animation': 'Video Studio',
  'Website Deployment & Cloud Setup': 'Cloud & Infrastructure',
  'Website Maintenance': 'Support & SRE'
};

export const HOME_SERVICE_NAMES = [
  'Web Development',
  '3D Animated Websites',
  'E-Commerce Development',
  'Graphic Design',
  '3D Video Animation',
  'Website Deployment & Cloud Setup',
  'Website Maintenance'
] as const;

export function normalizeHomeServiceName(serviceTitle?: string): string {
  if (!serviceTitle) return 'Web Development';
  const s = serviceTitle.trim();
  if (/3d.*(animated|interactive|web|experience)/i.test(s)) return '3D Animated Websites';
  if (/e-?commerce/i.test(s)) return 'E-Commerce Development';
  if (/graphic/i.test(s)) return 'Graphic Design';
  if (/video|motion|anim/i.test(s)) return '3D Video Animation';
  if (/cloud|deploy/i.test(s)) return 'Website Deployment & Cloud Setup';
  if (/maint/i.test(s)) return 'Website Maintenance';
  if (/web/i.test(s)) return 'Web Development';
  return s;
}

export function getHomeServiceCategory(serviceTitle?: string): string {
  const norm = normalizeHomeServiceName(serviceTitle);
  return HOME_SERVICE_CATEGORIES[norm] || 'Engineering';
}

export interface ShowcaseCategory {
  category: string;
  subcategories: string[];
  description: string;
}

export const SHOWCASE_TAXONOMY: ShowcaseCategory[] = [
  {
    category: 'Web Development',
    description: 'Modern, high-converting websites and scalable corporate web solutions built with enterprise code.',
    subcategories: [
      'Business Websites',
      'Corporate Websites',
      'Portfolio Websites',
      'Landing Pages',
      'Custom Websites',
      'Website Redesign & Revamp'
    ]
  },
  {
    category: '3D Animated Websites',
    description: 'Cinematic full-screen video atmospheres, hero-level interactive product experiences, and frame-by-frame scroll reveals.',
    subcategories: [
      'Interactive 3D Product Experiences',
      'Cinematic 3D Websites',
      'Scroll-Driven Animation'
    ]
  },
  {
    category: 'E-Commerce Development',
    description: 'High-performing storefronts for ANY industry, product, or catalog size with instant checkouts and turnkey operations.',
    subcategories: [
      'Custom & Any Niche Store',
      'B2B Wholesale & Bulk Commerce',
      'Multi-Vendor Marketplace',
      'Digital Products & Subscriptions'
    ]
  },
  {
    category: 'Graphic Design',
    description: 'Strategic visual identities, luxury brand typography systems, iconic vectors, and high-impact digital assets.',
    subcategories: [
      'Logo Design',
      'Product Design',
      'Thumbnail Design',
      'Social Media Design'
    ]
  },
  {
    category: '3D Video Animation',
    description: 'High-impact 3D animation videos, photorealistic product reveals, kinetic logo idents, and commercial promo videos.',
    subcategories: [
      'Logo Animation',
      'Product Animation',
      'Brand Animation',
      'Promo Videos'
    ]
  },
  {
    category: 'Website Deployment & Cloud Setup',
    description: 'Zero-downtime cloud hosting, Linux VPS & Docker servers, automated CI/CD pipelines, and Cloudflare edge security.',
    subcategories: [
      'Frontend & Web App Deployment',
      'Linux VPS & Docker Server Setup',
      'Domain, DNS & Cloudflare Security',
      'Automated CI/CD & GitHub Actions'
    ]
  },
  {
    category: 'Website Maintenance',
    description: '24/7 uptime monitoring, rapid bug fixing, content & patch updates, and Core Web Vitals speed optimization.',
    subcategories: [
      'Bug Fixing',
      'Updates',
      'Performance Optimization'
    ]
  }
];

import { SHOWCASE_PROJECTS } from './showcasesData';

export const INITIAL_PROJECTS: Project[] = Array.isArray(SHOWCASE_PROJECTS) ? SHOWCASE_PROJECTS : [];

export const INITIAL_PARTNERS: PartnerToken[] = [
  {
    id: 'pt-1793389889855',
    token: 'UDH-PART-882X',
    partnerName: 'Bilal Ahmed',
    partnerEmail: 'bilal.ahmed@example.com',
    payoutMethod: 'Remitly / Wise / Bank Transfer',
    targetService: 'Web Development',
    targetCategory: 'Business Websites',
    createdAt: '2026-10-30T19:33:00.000Z'
  }
];

export const INITIAL_REFERRALS: ReferralRecord[] = [
  {
    id: 'ref-1793389889855',
    partnerToken: 'UDH-PART-882X',
    partnerName: 'Bilal Ahmed',
    partnerEmail: 'bilal.ahmed@example.com',
    clientName: 'Tariq Mahmood',
    clientEmail: 'tariq@example.com',
    clientCompany: 'Apex Global Ventures',
    service: 'Web Development',
    category: 'Business Websites',
    projectType: 'Web Development',
    estimatedBudget: 2500,
    commissionPercentage: 20,
    commissionAmount: 500,
    status: 'milestone_25',
    source: 'order_agreement',
    orderNumber: 'UDH-ORD-2026-009-K4Z1',
    date: '2026-10-30',
    submittedAt: '2026-10-30T19:33:00.000Z',
    milestone25Paid: true,
    milestone25PaidAt: '2026-10-30T19:33:00.000Z',
    milestone25Amount: 125
  }
];

export interface LeadershipMember {
  id: string;
  name: string;
  role: string;
  tagline: string;
  location: string;
  flag: string;
  badge: string;
  avatarUrl: string;
  initials: string;
  instagramUrl?: string;
  instagramHandle?: string;
  linkedinUrl?: string;
}

export const LEADERSHIP_TEAM: LeadershipMember[] = [
  {
    id: 'leader-1',
    name: 'Muhammad Usman Afzal',
    role: 'Founder & Full-Stack Developer',
    tagline: 'Custom Code, 3D WebGL & Full-Stack Engineering',
    location: 'Pakistan',
    flag: '🇵🇰',
    badge: 'Founder & Lead',
    avatarUrl: '/images/muhammad-usman-afzal.jpg',
    initials: 'UA',
    instagramUrl: 'https://www.instagram.com/mr_maan089?obrf=MWFyYjlhZ2MzZnRtdw==',
    instagramHandle: '@mr_maan089',
    linkedinUrl: 'https://www.linkedin.com/in/muhammad-usman-afzal-897655381'
  },
  {
    id: 'leader-2',
    name: 'Mudasir',
    role: 'Co-Founder & Partnerships',
    tagline: 'EU Partnerships, Contracts & Timezone Alignment',
    location: 'Romania',
    flag: '🇷🇴',
    badge: 'Co-Founder',
    avatarUrl: '/images/mudasir.jpg',
    initials: 'M'
  },
  {
    id: 'leader-3',
    name: 'Umar Afzal',
    role: 'Engineering Lead',
    tagline: 'Core Engineering, QA & Production Delivery',
    location: 'Pakistan',
    flag: '🇵🇰',
    badge: 'Engineering Lead',
    avatarUrl: '/images/umar-afzal.jpg',
    initials: 'UA'
  }
];

export const FOUNDER_INFO = {
  name: 'Muhammad Usman Afzal',
  role: 'Founder & Full-Stack Developer',
  brand: 'Usman DevHub Tech & Creative Studio',
  email: 'hello@usmandevhub.com',
  avatarUrl: '/images/muhammad-usman-afzal.jpg',
  linkedinUrl: 'https://www.linkedin.com/in/muhammad-usman-afzal-897655381',
  instagramUrl: 'https://www.instagram.com/mr_maan089?obrf=MWFyYjlhZ2MzZnRtdw==',
  instagramHandle: '@mr_maan089',
  bio: 'Muhammad Usman Afzal is the Founder and Lead Developer at Usman DevHub, specializing in bespoke Custom Code in any language or stack, Shopify stores, WordPress & WooCommerce platforms, and interactive Three.js 3D web experiences for clients worldwide.',
  skills: [
    {
      title: 'Custom Code & Full-Stack Web Development',
      level: 'Core Discipline',
      description: 'Handcrafted web applications in any code or architecture (React, Next.js, TypeScript, Node.js, PHP, or pure HTML/CSS/JS) with zero limitations.',
      icon: 'Cpu'
    },
    {
      title: '3D Web & Interactive WebGL Experiences',
      level: 'Core Discipline',
      description: 'Three.js, WebGL 2.0 shaders, interactive 3D product configurators, scroll-driven canvas animations, and 60 FPS mobile performance.',
      icon: 'Layers'
    },
    {
      title: 'E-Commerce Engineering (Shopify & WooCommerce)',
      level: 'Core Discipline',
      description: 'High-converting online stores on Shopify Plus, WooCommerce, and headless Custom Code storefronts with instant Stripe checkout.',
      icon: 'ShoppingBag'
    },
    {
      title: 'Cloud Setup, DevOps & Server Deployment',
      level: 'Core Discipline',
      description: 'Zero-downtime Linux VPS hosting, Docker containers, Cloudflare edge caching, SSL automation, and automated GitHub CI/CD pipelines.',
      icon: 'Server'
    },
    {
      title: 'Website Maintenance & Speed Optimization',
      level: 'Core Discipline',
      description: '24/7 uptime monitoring, rapid bug fixes, security patch updates, and Core Web Vitals optimization targeting 95+ Lighthouse speed scores.',
      icon: 'ShieldCheck'
    }
  ],
  stats: [
    { label: 'Projects Completed', value: '75+' },
    { label: 'Client Satisfaction', value: '100%' },
    { label: 'Uptime & Quality', value: '99.9%' },
    { label: 'Partner Commission Paid', value: '$45,000+' }
  ]
};
