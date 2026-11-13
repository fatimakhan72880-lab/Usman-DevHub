import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Download,
  Printer,
  Share2,
  Mail,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Edit3,
  Save,
  Plus,
  Trash2,
  X,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  CreditCard,
  Layers,
  Code,
  DollarSign,
  Briefcase,
  Globe,
  Award,
  Hash,
  HelpCircle,
  Smartphone,
  Eye,
  Sliders,
  CheckCheck,
  Columns,
  Maximize2,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  KeyRound,
  Lock,
  Send,
  Circle
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { OrderAgreement, OrderMilestone, PartnerToken, PaidMilestoneStage } from '../types';
import {
  saveAndReturnOrderAgreement,
  getOrderAgreements,
  generateNextOrderNumber,
  ensureUniqueOrderNumber,
  findOrderByReferenceNumber,
  generateAgreementPartnerToken,
  getPartnerTokens,
  lookupPartnerByToken,
  normalizeReferralToken,
  getCompanyLogo,
  getAdminAuthStatus
} from '../services/storageService';
import { normalizeHomeServiceName, getHomeServiceCategory, HOME_SERVICE_CATEGORIES } from '../data/initialData';
import { downloadAgreementPdf, resolveOrderMilestones, dispatchAgreementWithPdf } from '../utils/pdfGenerator';
import { formatAgreementDate, toInputDateFormat, getTodayInputDate } from '../utils/dateUtils';
import { ShareDocumentModal, ShareChannel } from './ShareDocumentModal';

interface OrderAgreementStudioProps {
  order: OrderAgreement | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderSaved?: (updated: OrderAgreement) => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  PKR: '₨',
  EUR: '€',
  GBP: '£',
  AED: 'AED',
  SAR: 'SAR',
  CAD: 'CA$',
  AUD: 'AU$'
};

const SERVICE_OPTIONS = [
  {
    value: 'Web Development',
    label: 'Web Development',
    category: 'Engineering',
    sub: 'Engineering • Business, Portfolio, Corporate & Custom',
    icon: '🌐'
  },
  {
    value: '3D Animated Websites',
    label: '3D Animated Websites',
    category: 'Creative Tech',
    sub: 'Creative Tech • Interactive 3D, Cinematic & Scroll-Driven',
    icon: '🧊'
  },
  {
    value: 'E-Commerce Development',
    label: 'E-Commerce Development',
    category: 'Commerce',
    sub: 'Commerce • Custom Stores, B2B Wholesale & Marketplaces',
    icon: '🛒'
  },
  {
    value: 'Graphic Design',
    label: 'Graphic Design',
    category: 'Design & Identity',
    sub: 'Design & Identity • Logo, Product, Thumbnail & Social Media',
    icon: '🎨'
  },
  {
    value: '3D Video Animation',
    label: '3D Video Animation',
    category: 'Video Studio',
    sub: 'Video Studio • Logo, Product, Brand Animation & Promos',
    icon: '🎬'
  },
  {
    value: 'Website Deployment & Cloud Setup',
    label: 'Website Deployment & Cloud Setup',
    category: 'Cloud & Infrastructure',
    sub: 'Cloud & Infrastructure • VPS, DNS, Cloudflare & CI/CD',
    icon: '☁️'
  },
  {
    value: 'Website Maintenance',
    label: 'Website Maintenance',
    category: 'Support & SRE',
    sub: 'Support & SRE • Bug Fixing, Updates & Performance',
    icon: '🛡️'
  }
];

const CURRENCY_OPTIONS = [
  { value: 'PKR', label: 'PKR ₨', symbol: '₨' },
  { value: 'USD', label: 'USD $', symbol: '$' },
  { value: 'AED', label: 'AED', symbol: 'AED' },
  { value: 'SAR', label: 'SAR', symbol: 'SAR' },
  { value: 'EUR', label: 'EUR €', symbol: '€' },
  { value: 'GBP', label: 'GBP £', symbol: '£' }
];

const DEFAULT_BANK_DETAILS = {
  bankName: 'Meezan Bank Limited (Pakistan)',
  accountTitle: 'Muhammad Usman Afzal',
  accountNumber: '02890108342129',
  iban: 'PK43MEZN0002890108342129',
  raastId: '+92 341 2683864 (SadaPay / Nayapay / Raast)',
  extraInstructions: 'Please include your Order Number as the transfer reference and share receipt via WhatsApp or Email.'
};

export const SERVICE_CATEGORIES: Record<string, string[]> = {
  'Web Development': [
    'Business Websites',
    'Portfolio Websites',
    'Landing Pages',
    'Corporate Websites',
    'Custom Websites',
    'Website Redesign & Revamp'
  ],
  '3D Animated Websites': [
    'Interactive 3D Product Experiences',
    'Cinematic 3D Websites',
    'Scroll-Driven Animation'
  ],
  'E-Commerce Development': [
    'Custom & Any Niche Store',
    'B2B Wholesale & Bulk Commerce',
    'Multi-Vendor Marketplace',
    'Digital Products & Subscriptions'
  ],
  'Graphic Design': [
    'Logo Design',
    'Product Design',
    'Thumbnail Design',
    'Social Media Design'
  ],
  '3D Video Animation': [
    'Logo Animation',
    'Product Animation',
    'Brand Animation',
    'Promo Videos'
  ],
  'Website Deployment & Cloud Setup': [
    'Frontend & Web App Deployment',
    'Linux VPS & Docker Server Setup',
    'Domain, DNS & Cloudflare Security',
    'Automated CI/CD & GitHub Actions'
  ],
  'Website Maintenance': [
    'Bug Fixing',
    'Updates',
    'Performance Optimization'
  ]
};

// Backwards-compatibility aliases for previously saved orders
SERVICE_CATEGORIES['3D Websites'] = SERVICE_CATEGORIES['3D Animated Websites'];
SERVICE_CATEGORIES['E-Commerce'] = SERVICE_CATEGORIES['E-Commerce Development'];
SERVICE_CATEGORIES['Cloud Setup & Maintenance'] = SERVICE_CATEGORIES['Website Deployment & Cloud Setup'];
SERVICE_CATEGORIES['Custom Engineering'] = SERVICE_CATEGORIES['Web Development'];

export const SCOPE_PRESETS: Record<string, string> = {
  'Web Development': `• Full-Stack Custom Web Architecture engineered with modern React 19 / Next.js and Tailwind CSS.
• Fully responsive, mobile-first layouts with clean UX, SEO meta tags, and fast load speeds (<2.0s).
• Dynamic interactive components, smooth UI animations, and secure contact/order capture workflows.
• Complete backend API integration with database connectivity and cloud hosting deployment.
• Cross-browser testing (Desktop, iOS Safari, Android Chrome) with SSL security certificate.
• 30 calendar days of post-launch technical warranty and bug-fixing support included.`,

  '3D Animated Websites': `• Interactive 3D WebGL / Three.js digital scene embedded directly into the web application.
• Custom 3D asset optimization, materials, studio lighting rigs, and responsive camera controls.
• Cinematic scroll-triggered animations and interactive 3D model inspection.
• Full cross-browser compatibility (Desktop, Tablet, iOS Safari, Android Chrome) with fallback optimization.
• Cloud CDN hosting with WebGL shader compression for instant initial load times.
• 30 calendar days of technical support and shader performance tuning.`,

  'E-Commerce Development': `• High-conversion full-featured E-Commerce online store with seamless mobile shopping experience.
• Integrated payment gateways (Stripe, Bank Wire Transfer, COD) with 256-bit SSL encryption.
• Complete product catalog architecture, multi-currency support, tax calculation, and inventory tracking.
• Automated customer email confirmations, order tracking dashboard, and WhatsApp quick-order integration.
• Comprehensive Admin Control Panel for product management, stock management, and sales reports.
• 30 days technical support, bug fixing, and post-launch checkout optimization.`,

  'Graphic Design': `• Complete bespoke Brand Identity Package: Primary logo, secondary logo, badge icon, and monochrome marks.
• Comprehensive Brand Style Guide: Color palette specifications (HEX, RGB, CMYK, Pantone), typography rules.
• Full vector source files handoff (.AI, .EPS, .SVG, .PDF, .PNG transparent) with unlimited scaling.
• Social media brand kit (profile avatars, banners, post templates) and business card stationery mockup.
• 100% full commercial copyright and intellectual property transfer.`,

  '3D Video Animation': `• Broadcast-grade 3D Video Animation & Motion Graphics engineered in Cinema 4D / After Effects.
• Full production lifecycle: storyboard conceptualization, dynamic 3D video animation, texturing, dynamic lighting, and camera staging.
• Photorealistic rendering in Ultra HD 4K (60 FPS) optimized for commercial advertisement and social campaigns.
• Professional sound design, royalty-free background score licensing, and high-impact visual FX.
• 3 iterative revision rounds included with final deliverable packages provided in MP4 and ProRes formats.`,

  'Website Deployment & Cloud Setup': `• Zero-downtime production deployment of web application on Cloudflare Pages / Vercel / AWS.
• Custom domain configuration, DNS records propagation, and automatic SSL wildcard certificate setup.
• Production Linux VPS provisioning (Ubuntu 24.04 LTS), root security hardening, and SSH key enforcement.
• Docker containerization setup with automated multi-container orchestration (Docker Compose).
• Global edge CDN caching, automated CI/CD GitHub Actions pipelines, and 30 days monitoring support.`,

  'Website Maintenance': `• Comprehensive 24/7 uptime monitoring, security updates, and automated health checks.
• Core framework dependency updates, plugin upgrades, and vulnerability patch mitigation.
• Regular database query tuning, asset compression, and continuous Google PageSpeed 90+ optimization.
• Priority bug fixing SLA and dedicated emergency technical response support.`,

  'Custom Digital Engineering': `• End-to-end custom software architecture engineered specifically to client's operational workflow.
• Modern full-stack tech stack (React 19 / Node.js / PostgreSQL / Cloudflare) with high scalability.
• Comprehensive API architecture, role-based access control (RBAC), and enterprise security hardening.
• Source code repository handoff, technical documentation, and production cloud setup.
• 30 calendar days of post-launch technical warranty and bug fixing support included.`
};

// Backwards-compatibility aliases
SCOPE_PRESETS['3D Websites'] = SCOPE_PRESETS['3D Animated Websites'];
SCOPE_PRESETS['E-Commerce'] = SCOPE_PRESETS['E-Commerce Development'];
SCOPE_PRESETS['Cloud Setup & Maintenance'] = SCOPE_PRESETS['Website Deployment & Cloud Setup'];
SCOPE_PRESETS['Custom Engineering'] = SCOPE_PRESETS['Custom Digital Engineering'];

export const getCategoryScopePreset = (service: string, category: string): string => {
  const normSrv =
    service === '3D Websites'
      ? '3D Animated Websites'
      : service === 'E-Commerce'
      ? 'E-Commerce Development'
      : service === 'Cloud Setup & Maintenance'
      ? 'Website Deployment & Cloud Setup'
      : service === 'Custom Engineering'
      ? 'Custom Digital Engineering'
      : service;

  const key = `${normSrv}::${category}`;
  const presets: Record<string, string> = {
    // 1. Web Development
    'Web Development::Business Websites': `• Multi-Page Corporate & Business Web Architecture (Home, About Us, Services, Portfolio, Contact).
• Custom responsive layouts engineered with modern React 19 / Next.js and Tailwind CSS.
• High-conversion inquiry capture forms, WhatsApp Business direct triggers, and Google Maps integration.
• Mobile-first responsiveness, SEO meta tags, OpenGraph preview cards, and sub-2.0s load speeds.
• Production cloud deployment on Vercel/Cloudflare with automated SSL certificates.
• 30 calendar days of post-launch technical warranty and bug-fixing support included.`,

    'Web Development::Portfolio Websites': `• High-end Personal / Creative Technologist Portfolio showcasing selected client works and case studies.
• Interactive project gallery, filtered category tags, and responsive case-study modal walkthroughs.
• Smooth micro-interactions, dark/light contrast styling, and responsive touch-first navigation.
• Direct contact inquiry forms, resume/CV downloadable asset link, and social profiles integration.
• Production cloud hosting deployment with custom domain configuration.
• 30 calendar days of technical support and performance tuning included.`,

    'Web Development::Landing Pages': `• High-conversion Single-Page Landing Page engineered specifically for paid campaigns & product conversion.
• High-impact hero section with value proposition, interactive features grid, and proof testimonials.
• Strategic sticky call-to-action (CTA), WhatsApp click-to-chat button, and instant lead capture form.
• Lighthouse performance score 95+ with Core Web Vitals optimization and instant asset caching.
• Complete analytics tracking tags, Facebook Pixel / Google Tag Manager integration ready.
• 30 calendar days of post-launch performance monitoring included.`,

    'Web Development::Corporate Websites': `• Enterprise-grade Corporate Digital Architecture engineered for established companies and organizations.
• Multi-tier page hierarchy (Company Governance, Executive Leadership, Solutions, Careers, Investor Relations).
• Strict security hardening, WCAG accessibility compliance, and enterprise SEO schema structured data.
• Role-ready dynamic contact routing, newsletter capture, and multi-language/locale architecture.
• High-availability cloud deployment with automated CI/CD and edge CDN caching.
• 30 calendar days of post-launch technical warranty and SLA support.`,

    'Web Development::Custom Websites': `• 100% Bespoke Custom Web Application engineered from scratch to meet unique business specifications.
• Custom React 19 architecture with specialized state management, API routes, and database connectivity.
• Dynamic user dashboards, custom interactive workflows, and secure authentication options.
• Cross-browser testing (Desktop, Tablet, iOS Safari, Android Chrome) with automated SSL.
• Production cloud deployment with documented architecture handoff.
• 30 calendar days of technical warranty and bug resolution included.`,

    'Web Development::Website Redesign & Revamp': `• Complete modernization and overhaul of existing legacy website into modern React 19 / Next.js architecture.
• Fresh, modern UI/UX design retaining existing brand equity while dramatically improving conversion rates.
• Full performance audit fixing slow load times, poor mobile UX, and broken legacy layouts.
• Preservation of existing SEO rankings with seamless 301 redirect mapping and clean URL structures.
• 30 calendar days of post-launch monitoring, warranty, and bug resolution.`,

    // 2. 3D Animated Websites
    '3D Animated Websites::Interactive 3D Product Experiences': `• Interactive 3D WebGL / Three.js product showcase engine embedded directly into web browser.
• 360-degree interactive camera orbit, zoom, and realistic PBR materials (roughness, metallic, studio HDR lighting).
• Live multi-variant color/material switcher allowing clients to customize product specifications in real-time.
• Mobile touch-optimized camera gestures with sub-2MB GLTF asset compression for rapid streaming.
• Cross-platform compatibility (iOS Safari, Android Chrome, Windows, Mac) with 60 FPS performance.
• 30 calendar days of shader optimization and performance support included.`,

    '3D Animated Websites::Cinematic 3D Websites': `• Immersive cinematic 3D web experience with atmospheric camera choreography and depth layering.
• Custom WebGL shaders, floating particulate systems, and dynamic lighting that reacts to cursor/scroll.
• Seamless integration with HTML content overlays, audio triggers, and responsive typography.
• GPU-accelerated rendering optimized for both low-power mobile devices and high-end desktop screens.
• Cloud CDN edge distribution with automated asset preloading.
• 30 calendar days of technical support and performance tuning included.`,

    '3D Animated Websites::Scroll-Driven Animation': `• Apple-grade frame-by-frame scroll scrubbing animation synchronized with page scroll depth.
• Photorealistic 3D exploded view sequences demonstrating internal components and product engineering.
• High-density canvas rendering engine with hardware-accelerated frame playback at 60 FPS.
• Fully responsive mobile touch scrubbing with smooth GSAP / Motion scroll interpolation.
• 30 calendar days of technical warranty and frame rate optimization.`,

    // 3. E-Commerce Development
    'E-Commerce Development::Custom & Any Niche Store': `• High-converting full-featured online store tailored specifically to client's niche catalog and market.
• Responsive product catalog with instant category filtering, search, and variant selectors.
• Sub-second shopping cart, streamlined 1-page checkout, and WhatsApp direct ordering button.
• Integrated payment gateways (Stripe, PayPal, Local Bank Wire, Cash on Delivery).
• Comprehensive Admin Control Panel for inventory management, customer orders, and sales reports.
• 30 calendar days of post-launch technical support and checkout optimization included.`,

    'E-Commerce Development::B2B Wholesale & Bulk Commerce': `• Specialized B2B E-Commerce portal with tiered wholesale pricing, MOQ (Minimum Order Quantity) rules.
• Custom quotation request workflow, tax exemption handling, and company verification gateway.
• Bulk ordering matrix, repeat order quick-reorder features, and downloadable PDF proforma invoices.
• Net-30 payment terms and wire transfer reconciliation options.
• 30 calendar days of technical warranty and workflow support included.`,

    'E-Commerce Development::Multi-Vendor Marketplace': `• Scalable marketplace architecture enabling multiple independent vendors to list and sell products.
• Individual vendor dashboards for inventory management, order fulfillment, and payout tracking.
• Automated platform commission calculation, split checkout, and vendor payouts.
• Master super-admin control panel for marketplace governance, commission rates, and dispute resolution.
• 30 calendar days of post-launch technical warranty and database support included.`,

    'E-Commerce Development::Digital Products & Subscriptions': `• Automated instant digital download delivery system with expiring signed URLs and download limits.
• Recurring billing and subscription engine with automated renewal charges and invoice generation.
• Protected client member portal for accessing purchased software, licenses, or media assets.
• 30 calendar days of technical warranty and security support included.`,

    // 4. Graphic Design
    'Graphic Design::Logo Design': `• 2 to 3 unique original logo concepts tailored to industry & brand vision.
• High-resolution vector master files (.AI, .SVG, .EPS, .PDF) with transparent background formats (.PNG, .WebP).
• Light & dark background color variants, favicon crop, and social media profile avatar sizing.
• 100% full commercial copyright ownership and trademark-ready vector delivery.`,

    'Graphic Design::Product Design': `• Custom product packaging box, bottle/pouch label, and die-line layout design.
• Photorealistic 3D product mockup renders (front & angled studio lighting).
• Print-ready CMYK 300 DPI files with bleed margins and typography outlines.
• Editable master source files (PSD / AI / Figma) and commercial printing compatibility.`,

    'Graphic Design::Thumbnail Design': `• High-CTR YouTube thumbnail designs and social media advertising creative templates.
• Eye-catching visual hierarchy, contrast balancing, facial cutout enhancement, and bold typography.
• Delivered in high-resolution PNG/JPG and editable Figma / Photoshop source files.`,

    'Graphic Design::Social Media Design': `• Cohesive branded social media templates (Instagram posts, stories, LinkedIn banners, Twitter headers).
• Custom promotional campaign creatives with typography hierarchy and brand color palettes.
• Multi-format sizing optimized for mobile social feeds.
• Full editable Figma template handoff for effortless in-house content creation.`,

    // 5. 3D Video Animation
    '3D Video Animation::Logo Animation': `• Broadcast-grade 3D dynamic logo reveal animation with cinematic materials and dramatic lighting.
• Custom sound design, audio whooshes, and impact bass drops synchronized with logo assembly.
• Master exports in Ultra HD 4K (60 FPS) and transparent WebM / ProRes 4444 for website embedding.
• 3 iterative revision rounds included with full commercial broadcasting license.`,

    '3D Video Animation::Product Animation': `• Photorealistic 3D product commercial video animation rendered in Cinema 4D / After Effects.
• 360-degree studio camera staging, exploded component breakdown, and material close-ups.
• Dynamic studio lighting rigs, depth of field effects, and licensed background soundtrack.
• Master exports in 4K 16:9 widescreen and 9:16 vertical video optimized for social media campaigns.
• 3 revision rounds included with raw project files handoff.`,

    '3D Video Animation::Brand Animation': `• High-impact 3D visual storytelling animation communicating brand ethos and key differentiators.
• Conceptual storyboard development, dynamic 3D scene animation, kinetic typography, and audio synchronization.
• Delivered in Ultra HD 4K (60 FPS) formats formatted for presentations, website hero, and ad spots.
• 3 revision rounds with full commercial usage rights transfer.`,

    '3D Video Animation::Promo Videos': `• High-octane commercial promotional video engineered for high conversions on digital ads.
• Fast-paced editing, 3D text titles, motion graphics callouts, and licensed commercial soundtrack.
• Master render in Ultra HD 4K with multiple aspect ratios (16:9, 9:16, 1:1).
• 3 iterative review rounds included.`,

    // 6. Website Deployment & Cloud Setup
    'Website Deployment & Cloud Setup::Frontend & Web App Deployment': `• Zero-downtime production deployment of web application on Cloudflare Pages / Vercel / AWS.
• Custom domain configuration, DNS records propagation, and automatic SSL wildcard certificate setup.
• Global edge CDN caching, HTTP/3 protocol activation, and automated continuous deployment from Git.
• 30 calendar days of server monitoring and deployment stability support.`,

    'Website Deployment & Cloud Setup::Linux VPS & Docker Server Setup': `• Production Linux VPS provisioning (Ubuntu 24.04 LTS), root security hardening, and SSH key enforcement.
• Docker containerization setup with automated multi-container orchestration (Docker Compose).
• Nginx reverse proxy configuration, Let's Encrypt automated SSL renewal, and UFW firewall rules.
• Automated database backup scripts to remote S3 storage and real-time server health monitoring.
• 30 calendar days of server maintenance and emergency support included.`,

    'Website Deployment & Cloud Setup::Domain, DNS & Cloudflare Security': `• Complete Cloudflare DNS setup with proxy security, DDoS attack mitigation, and Web Application Firewall (WAF).
• Custom SSL/TLS encryption mode configuration and automated HSTS protocol enforcement.
• DNS SPF, DKIM, and DMARC record configuration for business email deliverability.
• 30 calendar days of DNS monitoring and technical support.`,

    'Website Deployment & Cloud Setup::Automated CI/CD & GitHub Actions': `• Custom GitHub Actions CI/CD automated deployment workflow triggered on code repository push.
• Automated test validation, TypeScript compilation checks, and asset build optimization pipeline.
• Zero-downtime server artifact deployment with automatic rollback capabilities.
• 30 calendar days of pipeline maintenance and support.`,

    // 7. Website Maintenance
    'Website Maintenance::Bug Fixing': `• Dedicated emergency and routine debugging service for UI glitches, responsive layout breaks, and JavaScript errors.
• Cross-browser testing and fixing for mobile Safari, Chrome, and desktop environments.
• Database query and form submission error troubleshooting with rapid turnaround.
• Verification testing and post-fix deployment directly to production.`,

    'Website Maintenance::Updates': `• Framework and package dependency upgrades (React, Next.js, Tailwind, plugins) to latest stable versions.
• Security patches and vulnerability mitigation with zero regression risk.
• CMS and content updates including new sections, copy adjustments, and media replacements.
• Full backup verification before and after all system updates.`,

    'Website Maintenance::Performance Optimization': `• Comprehensive speed audit bringing Google PageSpeed / Lighthouse performance score to 90+.
• Core Web Vitals optimization: Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and Interaction to Next Paint (INP).
• Next-gen image compression (WebP/AVIF), font preloading, and edge CDN asset caching.
• JavaScript bundle trimming, tree-shaking, and code-splitting implementation.`,

    // 8. Custom Digital Engineering
    'Custom Digital Engineering::Full-Stack Custom Architecture': `• End-to-end custom software architecture engineered specifically to client's operational workflow.
• Modern full-stack tech stack (React 19 / Node.js / PostgreSQL / Cloudflare) with high scalability.
• Comprehensive API architecture, role-based access control (RBAC), and enterprise security hardening.
• Source code repository handoff, technical documentation, and production cloud setup.
• 30 calendar days of post-launch technical warranty and bug fixing support included.`,

    'Custom Digital Engineering::API & Backend Development': `• High-throughput REST & GraphQL API services with robust validation, rate limiting, and JWT authentication.
• Relational / NoSQL database design with optimized indexing, transactions, and automated migrations.
• Webhook handlers, third-party API orchestrations, and asynchronous task queues.
• 30 calendar days of API support and documentation handoff.`,

    'Custom Digital Engineering::Database & Cloud Architecture': `• Cloud infrastructure architecture design with multi-region replication, failover, and automated backups.
• Managed database cluster setup with connection pooling and security firewall protection.
• Infrastructure as Code (IaC) configuration and cloud resource monitoring.
• 30 calendar days of infrastructure maintenance and support.`,

    'Custom Digital Engineering::Specialized Software Solution': `• Custom-designed software solution solving specialized business workflow bottlenecks.
• Comprehensive UI design, responsive frontend, robust backend logic, and admin oversight.
• Deployment to private or public cloud with complete intellectual property transfer.
• 30 calendar days of post-launch technical warranty and assistance.`
  };

  return presets[key] || SCOPE_PRESETS[normSrv] || SCOPE_PRESETS[service] || `• Custom professional deliverable engineered to client specifications.\n• Responsive mobile and desktop architecture with fast load times.\n• 30 days technical warranty and support included.`;
};

export const buildPaymentTermsText = (p1: number, p2: number, p3: number): string => {
  return `3-Stage Milestone Plan (${p1}% / ${p2}% / ${p3}%): ${p1}% advance kickoff deposit to initiate engineering; ${p2}% midway upon core prototype demo & review; remaining ${p3}% final balance payable upon live deployment and 100% full source code delivery & IP handoff.`;
};

export const createStandard3StageMilestones = (
  totalPrice: number,
  pct1: number = 25,
  pct2: number = 35,
  pct3?: number,
  selectedStage: PaidMilestoneStage = 'none'
): OrderMilestone[] => {
  const safeP1 = Math.max(0, Math.min(100, Math.round(pct1)));
  const safeP2 = Math.max(0, Math.min(100 - safeP1, Math.round(pct2)));
  const safeP3 =
    typeof pct3 === 'number' && !Number.isNaN(pct3)
      ? Math.max(0, 100 - safeP1 - safeP2)
      : Math.max(0, 100 - safeP1 - safeP2);

  let stage1 = Math.round((totalPrice * safeP1) / 100);
  let stage2 = Math.round((totalPrice * safeP2) / 100);
  let stage3 = Math.max(0, totalPrice - stage1 - stage2);

  if (safeP3 === 0) {
    stage3 = 0;
    if (safeP2 > 0) {
      stage2 = Math.max(0, totalPrice - stage1);
    } else {
      stage2 = 0;
      stage1 = totalPrice;
    }
  }

  const stage1Paid =
    selectedStage === 'stage_1' || selectedStage === 'stage_2' || selectedStage === 'stage_3';
  const stage2Paid = selectedStage === 'stage_2' || selectedStage === 'stage_3';
  const stage3Paid = selectedStage === 'stage_3';

  return [
    {
      id: 'ms-1',
      title: `Stage 1: Kickoff Deposit (${safeP1}%)`,
      description: `${safeP1}% advance kickoff deposit to initiate architecture setup, design systems, and sprint engineering.`,
      deliverableDate: 'Phase 1 (Kickoff)',
      amount: stage1,
      percentage: safeP1,
      status: stage1Paid ? 'completed' : 'pending'
    },
    {
      id: 'ms-2',
      title: `Stage 2: Mid Demo & Review (${safeP2}%)`,
      description: `${safeP2}% midway milestone upon interactive prototype demonstration, core features walkthrough, and client refinements review.`,
      deliverableDate: 'Phase 2 (Mid Demo)',
      amount: stage2,
      percentage: safeP2,
      status: stage2Paid ? 'completed' : 'pending'
    },
    {
      id: 'ms-3',
      title: `Stage 3: Code Delivery & Production Launch (${safeP3}%)`,
      description: `${safeP3}% final clearance payment upon live deployment signoff and 100% full source code delivery & IP handoff.`,
      deliverableDate: 'Phase 3 (Code Delivery)',
      amount: stage3,
      percentage: safeP3,
      status: stage3Paid ? 'completed' : 'pending'
    }
  ];
};

const MILESTONE_PRESETS: Array<{ label: string; p1: number; p2: number; p3: number }> = [
  { label: '25 / 35 / 40%', p1: 25, p2: 35, p3: 40 },
  { label: '30 / 30 / 40%', p1: 30, p2: 30, p3: 40 },
  { label: '40 / 30 / 30%', p1: 40, p2: 30, p3: 30 },
  { label: '50 / 25 / 25%', p1: 50, p2: 25, p3: 25 },
  { label: '50 / 0 / 50%', p1: 50, p2: 0, p3: 50 },
  { label: '100 / 0 / 0%', p1: 100, p2: 0, p3: 0 }
];

export const OrderAgreementStudio: React.FC<OrderAgreementStudioProps> = ({
  order: initialOrder,
  isOpen,
  onClose,
  onOrderSaved
}) => {
  // View mode: 'editor' (form only), 'preview' (light document only), 'split' (side-by-side on desktop)
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'editor';
    }
    return 'split';
  });

  // Zoom level for document review (100% standard A4)
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Working state for the order agreement
  const [formData, setFormData] = useState<OrderAgreement>(() => {
    if (initialOrder) {
      const confPrice = initialOrder.confirmedPrice || 0;
      const resolvedMs = resolveOrderMilestones(initialOrder);
      const ms = createStandard3StageMilestones(
        confPrice,
        resolvedMs.pct1,
        resolvedMs.pct2,
        resolvedMs.pct3,
        resolvedMs.selectedStage
      );
      const initialCat = initialOrder.serviceCategory || SERVICE_CATEGORIES[initialOrder.service]?.[0] || 'Business Websites';
      return {
        ...initialOrder,
        orderNumber: (initialOrder.orderNumber && initialOrder.orderNumber.trim())
          ? initialOrder.orderNumber.trim().toUpperCase()
          : generateNextOrderNumber(),
        agreementDate: initialOrder.agreementDate || toInputDateFormat(initialOrder.createdAt),
        serviceCategory: initialCat,
        advancePercentage: resolvedMs.pct1,
        advanceAmount: resolvedMs.amt1,
        paidAmount: resolvedMs.paidAmt,
        balanceAmount: resolvedMs.remainingAmt,
        selectedMilestoneStage: resolvedMs.selectedStage,
        paymentTerms: buildPaymentTermsText(resolvedMs.pct1, resolvedMs.pct2, resolvedMs.pct3),
        milestones: ms,
        companyLogo: initialOrder.companyLogo || getCompanyLogo() || ''
      };
    }
    return {
      id: `ord-${Date.now()}`,
      orderNumber: generateNextOrderNumber(),
      agreementTitle: 'Project Order Confirmation & Scope Agreement',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientCompany: '',
      clientCountry: '',
      clientAddress: '',
      clientTaxId: '',
      service: 'Web Development',
      serviceCategory: 'Business Websites',
      projectTitle: 'Custom Business Websites',
      scopeDescription: getCategoryScopePreset('Web Development', 'Business Websites'),
      deliverables: [
        'Custom interactive user interface with high-performance animations',
        'Responsive mobile & desktop architecture optimized for fast load speeds (<2.0s)',
        'SEO-optimized architecture, social preview cards, and schema structured data',
        'Production cloud deployment with domain configuration and documentation handoff'
      ],
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Node.js'],
      timeline: '10-14 Business Days',
      expectedDeliveryDate: '',
      revisionPolicy: '3 iterative rounds of milestone review and refinements included prior to final signoff.',
      warrantyTerms: '30 calendar days of technical bug-fix warranty and cloud stability guarantee included after live launch.',
      subtotalAmount: 150000,
      discountAmount: 0,
      taxAmount: 0,
      taxPercentage: 0,
      confirmedPrice: 150000,
      currency: 'PKR',
      advancePercentage: 25,
      advanceAmount: 37500,
      paidAmount: 0,
      balanceAmount: 150000,
      selectedMilestoneStage: 'none',
      referralToken: '',
      partnerName: '',
      commissionPercentage: 20,
      commissionAmount: 0,
      status: 'confirmed',
      paymentTerms: buildPaymentTermsText(25, 35, 40),
      milestones: createStandard3StageMilestones(150000, 25, 35, 40, 'none'),
      bankDetails: { ...DEFAULT_BANK_DETAILS },
      adminSignatureName: 'Muhammad Usman Afzal',
      adminSignatureDesignation: 'Founder & Principal Creative Technologist',
      notes: 'Official agreement prepared following mutual discovery discussion. All intellectual property transfers to client upon final balance settlement.',
      legalTerms: 'All source code, design assets, and custom deliverables transfer 100% to client ownership upon receipt of final clearance payment. Strict confidentiality (NDA) is guaranteed.',
      companyLogo: getCompanyLogo() || '',
      agreementDate: getTodayInputDate(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString()
    };
  });

  // Action states
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);
  const [shareModalConfig, setShareModalConfig] = useState<{ isOpen: boolean; channel: ShareChannel }>({
    isOpen: false,
    channel: 'whatsapp'
  });

  const [registeredPartners, setRegisteredPartners] = useState<PartnerToken[]>(() => getPartnerTokens());
  const effectiveLogo =
    formData.companyLogo &&
    formData.companyLogo !== '/images/usman-devhub-logo.png' &&
    !formData.companyLogo.includes('usman-devhub-logo.png')
      ? formData.companyLogo
      : getCompanyLogo();

  const isCleanStudioToken = (raw?: string): boolean => {
    if (!raw) return false;
    const cleaned = normalizeReferralToken(raw);
    return Boolean(cleaned && cleaned.length >= 4 && cleaned !== 'UDH-REF-' && cleaned !== 'UDH-' && cleaned !== 'NONE' && cleaned !== 'DIRECT');
  };

  // Acquisition source state: 'direct' (Without Reference / No Token) vs 'referred' (With Reference / Token Required)
  const [clientSource, setClientSource] = useState<'direct' | 'referred'>(() => {
    return isCleanStudioToken(initialOrder?.referralToken || formData.referralToken) ? 'referred' : 'direct';
  });

  // Track baseline client identity so changing client name never silently reuses another client's Ref No.
  const [savedBaseline, setSavedBaseline] = useState<{
    id: string;
    orderNumber: string;
    clientName: string;
    isPersisted: boolean;
    downloadedPdfInSession: boolean;
  }>(() => {
    const existing = initialOrder
      ? getOrderAgreements().find((o) => o.id === initialOrder.id)
      : undefined;
    return {
      id: initialOrder?.id || formData.id,
      orderNumber: (initialOrder?.orderNumber || formData.orderNumber || '').trim().toUpperCase(),
      clientName: (initialOrder?.clientName || '').trim(),
      isPersisted: Boolean(existing),
      downloadedPdfInSession: false
    };
  });

  useEffect(() => {
    if (isOpen) {
      setRegisteredPartners(getPartnerTokens());
      setTokenError(null);
      setDownloadBlobUrl(null);
      if (initialOrder) {
        const allSaved = getOrderAgreements();
        const existingInDb = allSaved.find((o) => o.id === initialOrder.id);
        const normSrv = normalizeHomeServiceName(initialOrder.service);
        const confPrice = initialOrder.confirmedPrice || 0;
        const resolvedMs = resolveOrderMilestones(initialOrder);
        const ms = createStandard3StageMilestones(
          confPrice,
          resolvedMs.pct1,
          resolvedMs.pct2,
          resolvedMs.pct3,
          resolvedMs.selectedStage
        );
        const initialCat = initialOrder.serviceCategory || SERVICE_CATEGORIES[normSrv]?.[0] || 'Business Websites';
        const hasValidRef = isCleanStudioToken(initialOrder.referralToken);
        const cleanRef = hasValidRef ? normalizeReferralToken(initialOrder.referralToken!) : '';
        const ensuredId = (initialOrder.id && initialOrder.id.trim()) ? initialOrder.id.trim() : `ord-${Date.now()}`;
        const ensuredOrderNo = ensureUniqueOrderNumber(initialOrder.orderNumber, ensuredId, allSaved);

        setFormData({
          ...initialOrder,
          id: ensuredId,
          orderNumber: ensuredOrderNo,
          referralToken: cleanRef,
          partnerName: hasValidRef ? (initialOrder.partnerName || '') : '',
          commissionPercentage: hasValidRef ? (initialOrder.commissionPercentage || 20) : 0,
          commissionAmount: hasValidRef ? (initialOrder.commissionAmount ?? Math.round((confPrice * (initialOrder.commissionPercentage || 20)) / 100)) : 0,
          agreementDate: initialOrder.agreementDate || toInputDateFormat(initialOrder.createdAt),
          service: normSrv,
          serviceCategory: initialCat,
          advancePercentage: resolvedMs.pct1,
          advanceAmount: resolvedMs.amt1,
          paidAmount: resolvedMs.paidAmt,
          balanceAmount: resolvedMs.remainingAmt,
          selectedMilestoneStage: resolvedMs.selectedStage,
          paymentTerms: buildPaymentTermsText(resolvedMs.pct1, resolvedMs.pct2, resolvedMs.pct3),
          milestones: ms,
          bankDetails: initialOrder.bankDetails || { ...DEFAULT_BANK_DETAILS },
          adminSignatureName: initialOrder.adminSignatureName || 'Muhammad Usman Afzal',
          adminSignatureDesignation: initialOrder.adminSignatureDesignation || 'Founder & Principal Creative Technologist',
          revisionPolicy: initialOrder.revisionPolicy || '3 iterative rounds of milestone review and refinements included prior to final signoff.',
          warrantyTerms: initialOrder.warrantyTerms || '30 calendar days of technical bug-fix warranty and cloud stability guarantee included after live launch.'
        });
        setClientSource(hasValidRef ? 'referred' : 'direct');
        setSavedBaseline({
          id: ensuredId,
          orderNumber: ensuredOrderNo,
          clientName: (initialOrder.clientName || '').trim(),
          isPersisted: Boolean(existingInDb),
          downloadedPdfInSession: false
        });
      }
    }
  }, [isOpen, initialOrder]);

  const documentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Custom inline dropdown states (avoids Android native modal overlays)
  const [isServiceMenuOpen, setIsServiceMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isPartnerMenuOpen, setIsPartnerMenuOpen] = useState(false);

  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const partnerDropdownRef = useRef<HTMLDivElement>(null);

  // Close custom dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target as Node)) {
        setIsServiceMenuOpen(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(e.target as Node)) {
        setIsCurrencyMenuOpen(false);
      }
      if (partnerDropdownRef.current && !partnerDropdownRef.current.contains(e.target as Node)) {
        setIsPartnerMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-adapt view mode if user resizes browser
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && viewMode === 'split') {
        setViewMode('editor');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Quick Scope Preset & Sync (Service + Category)
  const handleApplyPreset = (serviceName: string, categoryName?: string) => {
    const srv = serviceName === 'Cloud & Maintenance' ? 'Cloud Setup & Maintenance' : serviceName;
    const cat = categoryName || SERVICE_CATEGORIES[srv]?.[0] || 'Business Websites';
    const text = getCategoryScopePreset(srv, cat);
    handleScopeChange(text);
    setFormData((prev) => ({
      ...prev,
      service: srv,
      serviceCategory: cat,
      projectTitle: !prev.projectTitle || prev.projectTitle.startsWith('Custom ') ? `Custom ${cat}` : prev.projectTitle
    }));
  };

  const handleSelectService = (serviceValue: string) => {
    const cats = SERVICE_CATEGORIES[serviceValue] || ['Custom Solution'];
    const currentCatStillValid = cats.includes(formData.serviceCategory || '');
    const newCat = currentCatStillValid ? (formData.serviceCategory || cats[0]) : cats[0];
    const newScope = getCategoryScopePreset(serviceValue, newCat);
    const newTitle = `Custom ${newCat}`;

    handleScopeChange(newScope);
    setFormData((prev) => ({
      ...prev,
      service: serviceValue,
      serviceCategory: newCat,
      projectTitle: !prev.projectTitle || prev.projectTitle.startsWith('Custom ') ? newTitle : prev.projectTitle
    }));
  };

  const handleSelectCategory = (catName: string) => {
    const newScope = getCategoryScopePreset(formData.service, catName);
    const newTitle = `Custom ${catName}`;

    handleScopeChange(newScope);
    setFormData((prev) => ({
      ...prev,
      serviceCategory: catName,
      projectTitle: !prev.projectTitle || prev.projectTitle.startsWith('Custom ') ? newTitle : prev.projectTitle
    }));
  };

  const handleScopeChange = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const extracted = lines
      .filter((l) => l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || /^\d+[\.\)]/.test(l))
      .map((l) => l.replace(/^[•\-\*]\s*/, '').replace(/^\d+[\.\)]\s*/, '').trim())
      .filter((l) => l.length > 0);

    setFormData((prev) => ({
      ...prev,
      scopeDescription: text,
      deliverables: extracted.length > 0 ? extracted : (text ? [text.slice(0, 100)] : [])
    }));
  };

  // Helper to append bullet point in textarea
  const handleInsertBullet = () => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = formData.scopeDescription || '';
    const prefix = (start > 0 && current[start - 1] !== '\n') ? '\n• ' : '• ';
    const newText = current.substring(0, start) + prefix + current.substring(end);
    handleScopeChange(newText);
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + prefix.length;
    }, 50);
  };

  const handleApplyMilestoneSplit = (p1: number, p2: number, p3?: number) => {
    const safeP1 = Math.max(0, Math.min(100, Math.round(p1)));
    const safeP2 = Math.max(0, Math.min(100 - safeP1, Math.round(p2)));
    const safeP3 =
      typeof p3 === 'number' && !Number.isNaN(p3)
        ? Math.max(0, 100 - safeP1 - safeP2)
        : Math.max(0, 100 - safeP1 - safeP2);

    setFormData((prev) => {
      const total = prev.confirmedPrice || 0;
      const curStage: PaidMilestoneStage = resolveOrderMilestones(prev).selectedStage;
      const ms = createStandard3StageMilestones(total, safeP1, safeP2, safeP3, curStage);
      const advance = ms[0]?.amount ?? Math.round((total * safeP1) / 100);
      const mid = ms[1]?.amount ?? Math.round((total * safeP2) / 100);
      const paid =
        curStage === 'stage_3'
          ? total
          : curStage === 'stage_2'
          ? Math.min(total, advance + mid)
          : curStage === 'stage_1'
          ? Math.min(total, advance)
          : 0;
      return {
        ...prev,
        advancePercentage: safeP1,
        advanceAmount: advance,
        paidAmount: paid,
        balanceAmount: Math.max(0, total - paid),
        selectedMilestoneStage: curStage,
        paymentTerms: buildPaymentTermsText(safeP1, safeP2, safeP3),
        milestones: ms
      };
    });
  };

  const handleSelectMilestoneStage = (nextStage: PaidMilestoneStage) => {
    setFormData((prev) => {
      const total = prev.confirmedPrice || 0;
      const cur = resolveOrderMilestones(prev);
      const ms = createStandard3StageMilestones(total, cur.pct1, cur.pct2, cur.pct3, nextStage);
      const s1Amt = ms[0]?.amount ?? cur.amt1;
      const s2Amt = ms[1]?.amount ?? cur.amt2;
      const paid =
        nextStage === 'stage_3'
          ? total
          : nextStage === 'stage_2'
          ? Math.min(total, s1Amt + s2Amt)
          : nextStage === 'stage_1'
          ? Math.min(total, s1Amt)
          : 0;
      return {
        ...prev,
        selectedMilestoneStage: nextStage,
        paidAmount: paid,
        balanceAmount: Math.max(0, total - paid),
        milestones: ms
      };
    });
  };

  const handleStagePercentageInput = (stageIdx: 0 | 1 | 2, rawVal: string) => {
    const parsed = rawVal === '' ? 0 : Math.max(0, Math.min(100, Math.round(Number(rawVal) || 0)));
    const cur = resolveOrderMilestones(formData);
    let nextP1 = cur.pct1;
    let nextP2 = cur.pct2;
    let nextP3 = cur.pct3;

    if (stageIdx === 0) {
      nextP1 = parsed;
      if (nextP1 + nextP2 > 100) {
        nextP2 = Math.max(0, 100 - nextP1);
      }
      nextP3 = Math.max(0, 100 - nextP1 - nextP2);
    } else if (stageIdx === 1) {
      nextP2 = parsed;
      if (nextP1 + nextP2 > 100) {
        nextP1 = Math.max(0, 100 - nextP2);
        nextP3 = 0;
      } else {
        nextP3 = Math.max(0, 100 - nextP1 - nextP2);
      }
    } else {
      nextP3 = parsed;
      if (nextP1 + nextP3 > 100) {
        nextP1 = Math.max(0, 100 - nextP3);
        nextP2 = 0;
      } else {
        nextP2 = Math.max(0, 100 - nextP1 - nextP3);
      }
    }

    handleApplyMilestoneSplit(nextP1, nextP2, nextP3);
  };

  const handleTotalConfirmedPriceChange = (val: number) => {
    const newPrice = Math.max(0, val);
    const curSplit = resolveOrderMilestones(formData);
    const updatedMilestones = createStandard3StageMilestones(
      newPrice,
      curSplit.pct1,
      curSplit.pct2,
      curSplit.pct3,
      curSplit.selectedStage
    );
    const advance = updatedMilestones[0]?.amount ?? Math.round((newPrice * curSplit.pct1) / 100);
    const mid = updatedMilestones[1]?.amount ?? Math.round((newPrice * curSplit.pct2) / 100);
    const paid =
      curSplit.selectedStage === 'stage_3'
        ? newPrice
        : curSplit.selectedStage === 'stage_2'
        ? Math.min(newPrice, advance + mid)
        : curSplit.selectedStage === 'stage_1'
        ? Math.min(newPrice, advance)
        : 0;
    const balance = Math.max(0, newPrice - paid);
    let comm = 0;
    if (formData.referralToken) {
      comm = Math.round((newPrice * (formData.commissionPercentage || 20)) / 100);
    }
    setFormData((prev) => ({
      ...prev,
      confirmedPrice: newPrice,
      subtotalAmount: newPrice,
      advancePercentage: curSplit.pct1,
      advanceAmount: advance,
      paidAmount: paid,
      balanceAmount: balance,
      selectedMilestoneStage: curSplit.selectedStage,
      commissionAmount: comm,
      milestones: updatedMilestones
    }));
  };

  if (!isOpen) return null;

  const currencySymbol = CURRENCY_SYMBOLS[formData.currency] || formData.currency;
  const activeMilestoneSplit = resolveOrderMilestones(formData);

  const duplicateRefOwner = findOrderByReferenceNumber(formData.orderNumber, formData.id);
  const duplicateTokenOwner = clientSource === 'referred' && isCleanStudioToken(formData.referralToken)
    ? getOrderAgreements().find(
        (o) =>
          o.id !== formData.id &&
          Boolean(o.referralToken) &&
          normalizeReferralToken(o.referralToken!) === normalizeReferralToken(formData.referralToken!)
      )
    : undefined;

  const isDifferentClientOnSavedAgreement = Boolean(
    savedBaseline.isPersisted &&
    savedBaseline.clientName &&
    formData.id === savedBaseline.id &&
    formData.clientName.trim() &&
    formData.clientName.trim().toLowerCase() !== savedBaseline.clientName.toLowerCase()
  );

  // Fork current scope/pricing into a brand-new client agreement with a fresh ID, fresh Ref No., AND fresh Partner Token
  const handleForkAsNewClientAgreement = (keepCurrentTypedClient = true) => {
    const freshId = `ord-${Date.now()}`;
    const freshOrderNo = generateNextOrderNumber(
      [formData.orderNumber, savedBaseline.orderNumber].filter(Boolean)
    );
    const freshToken = clientSource === 'referred'
      ? generateAgreementPartnerToken(formData.partnerName, [formData.referralToken || ''])
      : '';
    const nowIso = new Date().toISOString();

    setFormData((prev) => {
      const curSplit = resolveOrderMilestones(prev);
      const resetStage: PaidMilestoneStage = keepCurrentTypedClient ? curSplit.selectedStage : 'none';
      const freshMs = createStandard3StageMilestones(
        prev.confirmedPrice || 0,
        curSplit.pct1,
        curSplit.pct2,
        curSplit.pct3,
        resetStage
      );
      const nextPaid = keepCurrentTypedClient ? curSplit.paidAmt : 0;
      return {
        ...prev,
        id: freshId,
        orderNumber: freshOrderNo,
        referralToken: clientSource === 'referred' ? freshToken : '',
        inquiryId: undefined,
        clientName: keepCurrentTypedClient ? prev.clientName : '',
        clientPhone: keepCurrentTypedClient ? prev.clientPhone : '',
        clientEmail: keepCurrentTypedClient ? prev.clientEmail : '',
        clientCompany: keepCurrentTypedClient ? prev.clientCompany : '',
        clientCountry: keepCurrentTypedClient ? prev.clientCountry : '',
        selectedMilestoneStage: resetStage,
        paidAmount: nextPaid,
        balanceAmount: Math.max(0, (prev.confirmedPrice || 0) - nextPaid),
        milestones: freshMs,
        agreementDate: getTodayInputDate(),
        createdAt: nowIso,
        updatedAt: nowIso,
        confirmedAt: nowIso
      };
    });
    setSavedBaseline({
      id: freshId,
      orderNumber: freshOrderNo,
      clientName: keepCurrentTypedClient ? formData.clientName.trim() : '',
      isPersisted: false,
      downloadedPdfInSession: false
    });
    setDownloadBlobUrl(null);
    setViewMode((prev) => (prev === 'preview' ? 'editor' : prev));
    setSaveNotice(
      clientSource === 'referred'
        ? `New unique Ref ${freshOrderNo} + new Partner Token ${freshToken} generated! Old codes are never reused.`
        : `New unique Agreement Ref No. ${freshOrderNo} generated! Previous client agreement kept separate.`
    );
    setTimeout(() => setSaveNotice(null), 4500);
  };

  const prepareValidatedOrder = (autoForkIfPostPdfDifferentClient = false): OrderAgreement | null => {
    let targetId = (formData.id && formData.id.trim()) ? formData.id.trim() : `ord-${Date.now()}`;
    let candidateOrderNo = (formData.orderNumber || '').trim().toUpperCase();
    let candidateToken = formData.referralToken || '';

    // If a PDF was already downloaded for Client A in this session and user changed Client Name to Client B,
    // automatically assign a brand-new ID + unique Agreement Reference No. + unique Partner Token!
    if (
      autoForkIfPostPdfDifferentClient &&
      savedBaseline.downloadedPdfInSession &&
      savedBaseline.clientName &&
      targetId === savedBaseline.id &&
      formData.clientName.trim() &&
      formData.clientName.trim().toLowerCase() !== savedBaseline.clientName.toLowerCase()
    ) {
      targetId = `ord-${Date.now()}`;
      candidateOrderNo = generateNextOrderNumber([formData.orderNumber, savedBaseline.orderNumber].filter(Boolean));
      if (clientSource === 'referred') {
        candidateToken = generateAgreementPartnerToken(formData.partnerName, [formData.referralToken || '']);
      }
    }

    const ensuredOrderNumber = ensureUniqueOrderNumber(candidateOrderNo, targetId);

    if (clientSource === 'referred') {
      if (!isCleanStudioToken(candidateToken)) {
        const msg = 'Reference agreement requires a valid Partner Token! Click "New Unique Token", select a partner, or switch to "Without Reference (No Token)".';
        setTokenError(msg);
        if (viewMode === 'preview') {
          setViewMode('editor');
        }
        return null;
      }
      setTokenError(null);
      let cleanToken = normalizeReferralToken(candidateToken);
      const alreadyUsedOnOtherAgreement = getOrderAgreements().some(
        (o) => o.id !== targetId && Boolean(o.referralToken) && normalizeReferralToken(o.referralToken!) === cleanToken
      );
      if (alreadyUsedOnOtherAgreement) {
        cleanToken = generateAgreementPartnerToken(formData.partnerName, [cleanToken]);
      }
      const pct = formData.commissionPercentage || 20;
      const comm = Math.round((formData.confirmedPrice * pct) / 100);
      return {
        ...formData,
        id: targetId,
        orderNumber: ensuredOrderNumber,
        referralToken: cleanToken,
        partnerName: (formData.partnerName || '').trim(),
        commissionPercentage: pct,
        commissionAmount: comm,
        updatedAt: new Date().toISOString()
      };
    }

    // Without Reference (Direct Client): strictly NO token
    setTokenError(null);
    return {
      ...formData,
      id: targetId,
      orderNumber: ensuredOrderNumber,
      referralToken: '',
      partnerName: '',
      commissionPercentage: 0,
      commissionAmount: 0,
      updatedAt: new Date().toISOString()
    };
  };

  // Save Agreement & optionally show preview
  const handleSaveOrder = (switchToPreview = true) => {
    const validated = prepareValidatedOrder(false);
    if (!validated) return;

    const { savedOrder } = saveAndReturnOrderAgreement(validated);
    setFormData(savedOrder);
    setSavedBaseline((prev) => ({
      id: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      clientName: (savedOrder.clientName || '').trim(),
      isPersisted: true,
      downloadedPdfInSession: prev.id === savedOrder.id ? prev.downloadedPdfInSession : false
    }));
    if (onOrderSaved) {
      onOrderSaved(savedOrder);
    }
    if (switchToPreview) {
      setViewMode('preview');
      setSaveNotice(`Agreement ${savedOrder.orderNumber} saved! Official A4 Preview is ready below.`);
    } else {
      setSaveNotice(`Agreement ${savedOrder.orderNumber} saved successfully!`);
    }
    setTimeout(() => setSaveNotice(null), 4000);
  };

  // URLs & Links
  const orderUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#order-${formData.orderNumber}`
    : `https://usmandevhub.agency/#order-${formData.orderNumber}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(formData.orderNumber || '');
    setCopiedOrderNo(true);
    setTimeout(() => setCopiedOrderNo(false), 2500);
  };

  const handleRegenerateOrderNumber = () => {
    const nextNo = generateNextOrderNumber(formData.orderNumber ? [formData.orderNumber] : []);
    setFormData((prev) => ({ ...prev, orderNumber: nextNo }));
  };

  // Validates & saves agreement first so the full PDF data is saved & ready before dispatching
  const ensureSavedOrderForDispatch = (): OrderAgreement | null => {
    const validated = prepareValidatedOrder(true);
    if (!validated) return null;
    const { savedOrder } = saveAndReturnOrderAgreement(validated);
    setFormData(savedOrder);
    setSavedBaseline({
      id: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      clientName: (savedOrder.clientName || '').trim(),
      isPersisted: true,
      downloadedPdfInSession: true
    });
    if (onOrderSaved) {
      onOrderSaved(savedOrder);
    }
    return savedOrder;
  };

  // 1. Send Full PDF + Custom Message via Email (Gmail Web or Native Mail)
  const handleShareEmail = (_mode: 'auto' | 'gmail' | 'mailto' = 'auto') => {
    const saved = ensureSavedOrderForDispatch();
    if (!saved) return;
    setShareModalConfig({ isOpen: true, channel: 'email' });
  };

  // 2. Send Full PDF + Custom Message via WhatsApp
  const handleShareWhatsApp = () => {
    const saved = ensureSavedOrderForDispatch();
    if (!saved) return;
    setShareModalConfig({ isOpen: true, channel: 'whatsapp' });
  };

  // Print Document
  const handlePrint = () => {
    window.print();
  };

  // 4. Download High-Resolution A4 PDF (Universal & Guaranteed to never fail)
  const handleDownloadPdf = async () => {
    const validated = prepareValidatedOrder(true);
    if (!validated) return;

    const { savedOrder } = saveAndReturnOrderAgreement(validated);
    setFormData(savedOrder);
    setSavedBaseline({
      id: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      clientName: (savedOrder.clientName || '').trim(),
      isPersisted: true,
      downloadedPdfInSession: true
    });
    if (onOrderSaved) {
      onOrderSaved(savedOrder);
    }

    setIsGeneratingPdf(true);
    setPdfNotice(`Generating official PDF (${savedOrder.orderNumber})...`);
    setDownloadBlobUrl(null);

    if (viewMode === 'editor') {
      setViewMode('preview');
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    try {
      const res = await downloadAgreementPdf(savedOrder, documentRef.current);
      if (res.success) {
        if (res.blobUrl) {
          setDownloadBlobUrl(res.blobUrl);
        }
        setPdfNotice(
          `PDF downloaded with unique Ref No. ${savedOrder.orderNumber}${savedOrder.clientName ? ` for ${savedOrder.clientName}` : ''}!`
        );
        setTimeout(() => setPdfNotice(null), 6500);
      } else {
        setPdfNotice(`PDF Download Error: ${res.error || 'Please use Print dialog'}`);
        setTimeout(() => setPdfNotice(null), 5000);
      }
    } catch (err: any) {
      console.error('Error in PDF download flow:', err);
      setPdfNotice('Generating fallback PDF via print dialog...');
      setTimeout(() => {
        window.print();
        setPdfNotice(null);
      }, 1000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!isOpen || !getAdminAuthStatus()) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      {/* ============================================================== */}
      {/* TOP COMMAND BAR (RESPONSIVE & ZERO MOBILE OVERLAP) */}
      {/* ============================================================== */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 shrink-0 shadow-2xs z-30">
        {/* Main Row */}
        <div className="h-14 sm:h-16 px-2.5 sm:px-6 flex items-center justify-between gap-2 max-w-full">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shrink-0"
              title="Return to Admin Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span
                  className="font-mono text-[10px] sm:text-xs font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/80 shadow-2xs truncate max-w-[125px] xs:max-w-[175px] sm:max-w-none"
                  title={formData.orderNumber}
                >
                  {formData.orderNumber}
                </span>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate hidden sm:block max-w-xs md:max-w-md">
                  {formData.clientName ? `${formData.clientName} — ${formData.projectTitle}` : 'Agreement Studio'}
                </h2>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {formData.clientName
                  ? `${formData.clientName}${clientSource === 'referred' && isCleanStudioToken(formData.referralToken) ? ` · Token: ${normalizeReferralToken(formData.referralToken!)}` : ' · Direct Client'}`
                  : 'Agreement Studio'}
              </p>
            </div>
          </div>

          {/* Center on Desktop: View Switcher */}
          <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-100 border border-slate-200/80 rounded-xl text-xs shrink-0">
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-white text-[#1430d8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Form Editor</span>
            </button>

            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white text-[#1430d8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>A4 Document</span>
            </button>

            <button
              onClick={() => setViewMode('split')}
              className={`flex px-3 py-1.5 rounded-lg font-bold items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white text-[#1430d8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
          </div>

          {/* Right: Actions (3 Send Channels + Save + New + Download PDF) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Start Fresh Client Agreement (New Unique Ref No.) */}
            <button
              type="button"
              onClick={() => handleForkAsNewClientAgreement(false)}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] sm:text-xs transition-all cursor-pointer shadow-2xs shrink-0"
              title="Start a separate agreement for a new client with a brand-new unique Agreement Reference No."
            >
              <Plus className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden md:inline">New Client</span>
              <span className="md:hidden">New</span>
            </button>

            {/* Save Button */}
            <button
              onClick={() => handleSaveOrder(false)}
              className="flex items-center gap-1 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1430d8] font-bold text-xs border border-blue-200 transition-all cursor-pointer shadow-2xs shrink-0"
              title="Save Agreement"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Save</span>
            </button>

            {/* 1. Email Send (Desktop Header) */}
            <button
              onClick={() => handleShareEmail('auto')}
              className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-[#1430d8] text-xs font-semibold border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              title="Send Agreement via Email"
            >
              <Mail className="w-3.5 h-3.5 text-[#1430d8]" />
              <span className="hidden xl:inline">Email</span>
            </button>

            {/* 2. WhatsApp Send (Desktop Header) */}
            <button
              onClick={handleShareWhatsApp}
              className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-[#1430d8] text-xs font-semibold border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              title="Send Agreement via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#1430d8]" />
              <span className="hidden xl:inline">WhatsApp</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="p-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer shadow-2xs shrink-0"
              title="Copy client-facing public link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#1430d8]" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {/* Download Official PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#1430d8] to-[#0075f7] hover:from-[#1027b0] hover:to-[#0060d0] text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 shrink-0"
              title="Generate and download A4 PDF"
            >
              {isGeneratingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
              <span className="sm:hidden font-bold">PDF</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Header: Segmented View Switcher (Visible on screens < 1024px) */}
        <div className="lg:hidden px-3 pb-2 pt-1 border-t border-slate-100 flex items-center gap-2">
          <div className="grid grid-cols-2 gap-1 w-full p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-white text-[#1430d8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Form Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white text-[#1430d8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>A4 Document</span>
            </button>
          </div>
        </div>
      </header>

      {/* Save / PDF Banner Notice */}
      <AnimatePresence>
        {pdfNotice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-50 text-[#1430d8] border-b border-blue-200 px-4 sm:px-6 py-2 text-xs font-semibold flex items-center justify-between"
          >
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              {isGeneratingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-[#1430d8] border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="truncate">{pdfNotice}</span>
              {downloadBlobUrl && (
                <a
                  href={downloadBlobUrl}
                  download={`${formData.orderNumber}_${(formData.clientName || 'Agreement').trim().replace(/[^a-zA-Z0-9_-]/g, '_')}_Agreement.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold ml-1 text-blue-700 hover:text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded text-[11px] shrink-0"
                >
                  Direct Open / Download PDF
                </a>
              )}
            </div>
            <button onClick={() => setPdfNotice(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
        {saveNotice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-emerald-50 text-emerald-800 border-b border-emerald-200 px-4 sm:px-6 py-2 text-xs font-semibold flex items-center justify-between"
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{saveNotice}</span>
            </div>
            <button onClick={() => setSaveNotice(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MAIN WORKSPACE BODY (FULLY RESPONSIVE) */}
      {/* ============================================================== */}
      <div className="flex-1 min-h-0 h-full w-full overflow-hidden flex flex-col lg:flex-row relative">
        {/* ============================================================ */}
        {/* FORM EDITOR COLUMN */}
        {/* ============================================================ */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div
            className={`flex-1 min-h-0 h-full overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-4 bg-[#f8fafc] border-r border-slate-200/90 pb-28 lg:pb-8 max-w-full ${
              viewMode === 'split' ? 'w-full lg:w-1/2' : 'w-full max-w-4xl mx-auto'
            }`}
            style={{ WebkitOverflowScrolling: 'touch', minHeight: 0 }}
          >
            {/* SECTION 1: ESSENTIAL HIGHLIGHTS ONLY */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5 max-w-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1430d8] flex items-center justify-center font-bold shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      Essential Agreement Details
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate hidden xs:block">
                      Key points — write full scope in the box below
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyOrderNumber}
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#1430d8] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 shrink-0 cursor-pointer transition-colors"
                    title="Click to copy Agreement Reference No."
                  >
                    <span>{formData.orderNumber}</span>
                    {copiedOrderNo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#1430d8]" />}
                  </button>
                </div>
              </div>

              {/* Mandatory Unique Agreement Reference No. (Single Identifier on BOTH Direct & Reference) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1430d8]" />
                    <span>Agreement Reference No. (Mandatory · Unique Per PDF)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateOrderNumber}
                    className="text-[10px] font-bold text-[#1430d8] hover:underline flex items-center gap-1 cursor-pointer"
                    title="Generate a brand-new unique Agreement Reference No."
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>New Unique Ref No.</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.orderNumber || ''}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value.toUpperCase() })}
                    className={`w-full px-3 py-1.5 bg-white border rounded-lg text-xs font-mono font-bold text-[#1430d8] focus:border-[#1430d8] focus:outline-none uppercase ${
                      duplicateRefOwner ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200'
                    }`}
                    placeholder="UDH-ORD-2026-003-8K4M"
                  />
                  <button
                    type="button"
                    onClick={handleCopyOrderNumber}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1"
                    title="Copy Agreement Reference No."
                  >
                    {copiedOrderNo ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedOrderNo ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                {duplicateRefOwner ? (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong>{formData.orderNumber}</strong> already belongs to <strong>{duplicateRefOwner.clientName || 'another saved agreement'}</strong>. Every PDF automatically gets its own unique Ref No.
                    </span>
                    <button
                      type="button"
                      onClick={handleRegenerateOrderNumber}
                      className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] cursor-pointer shrink-0"
                    >
                      Assign Unique Ref Now
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Every agreement &amp; PDF carries its own unique <strong>Agreement Reference No.</strong> (both With Reference and Without Reference) so you always know whose agreement is being discussed.
                  </p>
                )}
              </div>

              {/* Row 1: Client Name & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Client Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName || ''}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                    placeholder="e.g. Muhammad Bilal"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    WhatsApp / Phone *
                  </label>
                  <input
                    type="text"
                    value={formData.clientPhone || ''}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                    placeholder="e.g. +92 341 2683864"
                  />
                </div>
              </div>

              {/* Row 1B: Client Email, Company/Brand & City/Country (Directly Visible for PDF Accuracy) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Client Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail || ''}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs font-medium text-slate-900 focus:bg-white focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                    placeholder="e.g. client@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Company / Brand (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.clientCompany || ''}
                    onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs font-medium text-slate-900 focus:bg-white focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                    placeholder="e.g. Apex Global LLC"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    City / Country (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.clientCountry || ''}
                    onChange={(e) => setFormData({ ...formData, clientCountry: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs font-medium text-slate-900 focus:bg-white focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                    placeholder="e.g. Dubai, UAE"
                  />
                </div>
              </div>

              {/* Safeguard Prompt if Admin changes Client Name on an Already-Saved Agreement */}
              {isDifferentClientOnSavedAgreement && (
                <div className="p-3 rounded-xl bg-blue-50/90 border border-blue-200 text-xs text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />
                      <span>Making an agreement for a new client ({formData.clientName.trim()})?</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Ref <strong className="font-mono text-[#1430d8]">{savedBaseline.orderNumber}</strong> is currently saved for <strong>{savedBaseline.clientName}</strong>. Give {formData.clientName.trim()} a separate Ref No. so both PDFs stay distinct:
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleForkAsNewClientAgreement(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white font-bold text-xs cursor-pointer shadow-2xs"
                    >
                      Assign New Unique Ref No.
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSavedBaseline((prev) => ({
                          ...prev,
                          clientName: formData.clientName.trim()
                        }))
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] cursor-pointer"
                    >
                      Same Client (Typo Fix)
                    </button>
                  </div>
                </div>
              )}

              {/* Row 2: Project Title & Custom Agreement Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.projectTitle || ''}
                    onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs font-bold text-slate-900 focus:bg-white focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                    placeholder="e.g. Modern 3D E-Commerce Platform"
                  />
                </div>

                <div className="sm:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-900 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#1430d8]" />
                      <span>Agreement Date *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, agreementDate: getTodayInputDate() }))}
                      className="text-[10px] font-bold text-[#1430d8] hover:underline cursor-pointer"
                      title="Set to today's date"
                    >
                      Today
                    </button>
                  </div>
                  <input
                    type="date"
                    value={toInputDateFormat(formData.agreementDate || formData.createdAt)}
                    onChange={(e) => setFormData({ ...formData, agreementDate: e.target.value })}
                    className="w-full px-3 py-2 bg-blue-50/60 border border-blue-200 rounded-xl text-sm sm:text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between truncate">
                    <span>On Agreement:</span>
                    <strong className="text-slate-900 font-bold ml-1">{formatAgreementDate(formData.agreementDate || formData.createdAt)}</strong>
                  </div>
                </div>
              </div>

              {/* Row 2: 1. Main Service Discipline */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-800">
                    1. Main Service (Discipline) *
                  </label>
                  <span className="text-[10px] font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 truncate">
                    Active: {formData.service} ({getHomeServiceCategory(formData.service)})
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 max-h-48 overflow-y-auto space-y-1">
                  {SERVICE_OPTIONS.map((item) => {
                    const isSelected = formData.service === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => handleSelectService(item.value)}
                        className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1430d8] text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">{item.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs ${isSelected ? 'font-black text-white' : 'font-bold text-slate-900'} truncate`}>
                                {item.label}
                              </span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#1430d8] border border-blue-100'
                              }`}>
                                {item.category}
                              </span>
                            </div>
                            <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'} truncate mt-0.5`}>
                              {item.sub}
                            </div>
                          </div>
                        </div>

                        {/* Radio indicator */}
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                          isSelected ? 'border-white bg-white' : 'border-slate-400 bg-slate-50'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#1430d8]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: 2. Service Specialization / Project Type */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/90 space-y-2">
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
                  <label className="block text-[11px] font-black text-slate-900">
                    2. Service Specialization / Type (for {formData.service} — {getHomeServiceCategory(formData.service)}) *
                  </label>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded self-start xs:self-auto truncate">
                    Type: {formData.serviceCategory || 'Select Specialization'}
                  </span>
                </div>

                {/* Inline selectable category pills/cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                  {(SERVICE_CATEGORIES[formData.service] || ['Custom Architecture', 'Specialized Solution']).map((catName) => {
                    const isCatSelected = formData.serviceCategory === catName;
                    return (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => handleSelectCategory(catName)}
                        className={`px-2.5 py-2 rounded-lg text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                          isCatSelected
                            ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span className="truncate">{catName}</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isCatSelected ? 'border-white bg-white' : 'border-slate-400 bg-slate-50'
                        }`}>
                          {isCatSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom category name editable input */}
                <div className="flex items-center gap-2 pt-1 border-t border-blue-200/60">
                  <span className="text-[10px] font-bold text-blue-900 shrink-0">Edit Category Name:</span>
                  <input
                    type="text"
                    value={formData.serviceCategory || ''}
                    onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                    className="w-full px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Specialized Business Portal"
                  />
                </div>
              </div>

              {/* Row 3: Total Price, Advance & Timeline (Responsive Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {/* Currency & Total Price */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Total Confirmed Price *
                  </label>
                  <div className="flex gap-1.5">
                    {/* Custom Currency Dropdown */}
                    <div className="relative" ref={currencyDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCurrencyMenuOpen(!isCurrencyMenuOpen);
                          setIsServiceMenuOpen(false);
                          setIsPartnerMenuOpen(false);
                        }}
                        className={`w-24 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 border rounded-xl text-xs font-bold text-slate-900 flex items-center justify-between gap-1 cursor-pointer shrink-0 transition-all ${
                          isCurrencyMenuOpen ? 'border-[#1430d8] ring-2 ring-blue-500/20 bg-white' : 'border-slate-200'
                        }`}
                      >
                        <span className="font-mono">{formData.currency} {currencySymbol}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isCurrencyMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isCurrencyMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 w-28 p-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 space-y-0.5">
                          {CURRENCY_OPTIONS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, currency: c.value as any }));
                                setIsCurrencyMenuOpen(false);
                              }}
                              className={`w-full px-2 py-1.5 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer ${
                                formData.currency === c.value ? 'bg-blue-50 text-[#1430d8]' : 'hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <span>{c.label}</span>
                              {formData.currency === c.value && <Check className="w-3.5 h-3.5 text-[#1430d8]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={formData.confirmedPrice}
                      onChange={(e) => handleTotalConfirmedPriceChange(Number(e.target.value))}
                      className="w-full min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs font-mono font-black text-slate-950 focus:bg-white focus:border-[#1430d8] focus:outline-none"
                      placeholder="150000"
                    />
                  </div>
                </div>

                {/* Active Milestone Summary */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-800">
                      Milestone Split (%)
                    </label>
                    <span className="text-[10px] font-bold text-[#1430d8] font-mono">
                      Kickoff: {currencySymbol}{activeMilestoneSplit.amt1.toLocaleString()} ({activeMilestoneSplit.pct1}%)
                    </span>
                  </div>
                  <div className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-[#1430d8] text-white shadow-xs ring-2 ring-blue-500/20 flex items-center justify-between">
                    <span className="font-mono truncate">
                      {activeMilestoneSplit.pct1}% / {activeMilestoneSplit.pct2}% / {activeMilestoneSplit.pct3}%
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-white/20 text-white shrink-0">
                      Editable Below
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Delivery Timeline
                  </label>
                  <input
                    type="text"
                    value={formData.timeline || ''}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#1430d8] focus:outline-none"
                    placeholder="e.g. 7-10 Days / 2 Weeks"
                  />
                </div>
              </div>

              {/* EDITABLE 3-STAGE MILESTONE PAYMENT PLAN + 4-OPTION PAYMENT STAGE SELECTOR */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] font-bold text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-900 font-extrabold">
                    <CreditCard className="w-3.5 h-3.5 text-[#1430d8]" />
                    <span>
                      3-Stage Milestone Plan ({activeMilestoneSplit.pct1}% / {activeMilestoneSplit.pct2}% / {activeMilestoneSplit.pct3}%) — Select Option &amp; Edit %
                    </span>
                  </span>
                  <span className="text-[#1430d8] font-mono">
                    100% Total = {currencySymbol}{formData.confirmedPrice.toLocaleString()}
                  </span>
                </div>

                {/* Quick 1-Tap Percentage Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-slate-500 mr-0.5">Quick Splits:</span>
                  {MILESTONE_PRESETS.map((preset) => {
                    const isActivePreset =
                      activeMilestoneSplit.pct1 === preset.p1 &&
                      activeMilestoneSplit.pct2 === preset.p2 &&
                      activeMilestoneSplit.pct3 === preset.p3;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleApplyMilestoneSplit(preset.p1, preset.p2, preset.p3)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer border ${
                          isActivePreset
                            ? 'bg-[#1430d8] border-[#1430d8] text-white shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-[#1430d8]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* 4-OPTION SELECTOR: OPTION 0 (UNSELECTED / NO STAGE PAID) + OPTIONS 1, 2, 3 */}
                <div className="pt-2 border-t border-slate-200/90 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[10px] text-slate-600">
                    <span className="font-bold text-slate-800">
                      Select Payment Stage (4 Options — Update &amp; Re-Send Anytime):
                    </span>
                    <span className="font-mono font-semibold text-[#1430d8]">
                      {activeMilestoneSplit.selectedStage === 'none'
                        ? 'Unselected (0% Paid)'
                        : activeMilestoneSplit.selectedStage === 'stage_1'
                        ? `Option 1: Start Paid (${activeMilestoneSplit.pct1}%)`
                        : activeMilestoneSplit.selectedStage === 'stage_2'
                        ? `Option 2: Up to Mid Paid (${activeMilestoneSplit.paidPct}%)`
                        : 'Option 3: 100% Final Paid'}
                    </span>
                  </div>

                  {/* 4th Option (Unselected / Default): None of the 3 Milestones Selected */}
                  <button
                    type="button"
                    onClick={() => handleSelectMilestoneStage('none')}
                    className={`w-full p-2.5 sm:p-3 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      activeMilestoneSplit.selectedStage === 'none'
                        ? 'bg-blue-50/70 border-2 border-[#1430d8] shadow-xs ring-2 ring-[#1430d8]/10'
                        : 'bg-white border border-slate-200 hover:border-blue-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {activeMilestoneSplit.selectedStage === 'none' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#1430d8] shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-extrabold text-slate-900">
                          No Stage Selected — Agreement Confirmed Only (0% Paid)
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          Default unselected option — send initial confirmed agreement before advance payment
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-mono text-[10px] sm:text-[11px] font-bold shrink-0 ${
                        activeMilestoneSplit.selectedStage === 'none' ? 'text-[#1430d8]' : 'text-slate-500'
                      }`}
                    >
                      0% Paid
                    </span>
                  </button>

                  {/* Options 1, 2, 3: Selectable Milestone Cards with Editable % Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Option 1: 1. Start (Kickoff) */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        handleSelectMilestoneStage(
                          activeMilestoneSplit.selectedStage === 'stage_1' ? 'none' : 'stage_1'
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectMilestoneStage(
                            activeMilestoneSplit.selectedStage === 'stage_1' ? 'none' : 'stage_1'
                          );
                        }
                      }}
                      className={`p-3 rounded-xl text-left space-y-1.5 transition-all cursor-pointer select-none ${
                        activeMilestoneSplit.selectedStage === 'stage_1'
                          ? 'bg-blue-50/70 border-2 border-[#1430d8] shadow-xs ring-2 ring-[#1430d8]/10'
                          : activeMilestoneSplit.stage1Paid
                          ? 'bg-blue-50/35 border border-blue-300 shadow-2xs'
                          : 'bg-white border border-slate-200 hover:border-blue-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="flex items-center gap-1.5 min-w-0">
                          {activeMilestoneSplit.stage1Paid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                          <span className="text-[11px] font-extrabold text-[#1430d8] truncate">
                            1. Start (Kickoff)
                          </span>
                        </span>
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 bg-white border border-blue-200 rounded-lg px-2 py-0.5 shrink-0"
                        >
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={activeMilestoneSplit.pct1}
                            onChange={(e) => handleStagePercentageInput(0, e.target.value)}
                            className="w-9 bg-transparent font-mono font-black text-xs text-right text-[#1430d8] focus:outline-none"
                            aria-label="Stage 1 Kickoff Percentage"
                          />
                          <span className="text-[10px] font-mono font-bold text-[#1430d8]">%</span>
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-mono font-black text-sm text-slate-900">
                          {currencySymbol}{activeMilestoneSplit.amt1.toLocaleString()}
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            activeMilestoneSplit.stage1Paid ? 'text-[#1430d8]' : 'text-slate-400'
                          }`}
                        >
                          {activeMilestoneSplit.selectedStage === 'stage_1'
                            ? '✓ Selected · Paid'
                            : activeMilestoneSplit.stage1Paid
                            ? '✓ Paid'
                            : 'Tap to Select'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Due upfront to start software engineering
                      </p>
                    </div>

                    {/* Option 2: 2. Mid (Demo) */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        handleSelectMilestoneStage(
                          activeMilestoneSplit.selectedStage === 'stage_2' ? 'none' : 'stage_2'
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectMilestoneStage(
                            activeMilestoneSplit.selectedStage === 'stage_2' ? 'none' : 'stage_2'
                          );
                        }
                      }}
                      className={`p-3 rounded-xl text-left space-y-1.5 transition-all cursor-pointer select-none ${
                        activeMilestoneSplit.selectedStage === 'stage_2'
                          ? 'bg-blue-50/70 border-2 border-[#1430d8] shadow-xs ring-2 ring-[#1430d8]/10'
                          : activeMilestoneSplit.stage2Paid
                          ? 'bg-blue-50/35 border border-blue-300 shadow-2xs'
                          : 'bg-white border border-slate-200 hover:border-blue-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="flex items-center gap-1.5 min-w-0">
                          {activeMilestoneSplit.stage2Paid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                          <span className="text-[11px] font-extrabold text-[#1430d8] truncate">
                            2. Mid (Demo)
                          </span>
                        </span>
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 bg-white border border-blue-200 rounded-lg px-2 py-0.5 shrink-0"
                        >
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={activeMilestoneSplit.pct2}
                            onChange={(e) => handleStagePercentageInput(1, e.target.value)}
                            className="w-9 bg-transparent font-mono font-black text-xs text-right text-[#1430d8] focus:outline-none"
                            aria-label="Stage 2 Mid Demo Percentage"
                          />
                          <span className="text-[10px] font-mono font-bold text-[#1430d8]">%</span>
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-mono font-black text-sm text-slate-900">
                          {currencySymbol}{activeMilestoneSplit.amt2.toLocaleString()}
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            activeMilestoneSplit.stage2Paid ? 'text-[#1430d8]' : 'text-slate-400'
                          }`}
                        >
                          {activeMilestoneSplit.selectedStage === 'stage_2'
                            ? '✓ Selected · Paid'
                            : activeMilestoneSplit.stage2Paid
                            ? '✓ Paid'
                            : 'Tap to Select'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Due upon prototype review &amp; refinements
                      </p>
                    </div>

                    {/* Option 3: 3. Final (Code) — Clean Studio Blue / White (Zero Green) */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        handleSelectMilestoneStage(
                          activeMilestoneSplit.selectedStage === 'stage_3' ? 'none' : 'stage_3'
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectMilestoneStage(
                            activeMilestoneSplit.selectedStage === 'stage_3' ? 'none' : 'stage_3'
                          );
                        }
                      }}
                      className={`p-3 rounded-xl text-left space-y-1.5 transition-all cursor-pointer select-none ${
                        activeMilestoneSplit.selectedStage === 'stage_3'
                          ? 'bg-blue-50/70 border-2 border-[#1430d8] shadow-xs ring-2 ring-[#1430d8]/10'
                          : 'bg-white border border-slate-200 hover:border-blue-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="flex items-center gap-1.5 min-w-0">
                          {activeMilestoneSplit.stage3Paid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                          <span className="text-[11px] font-extrabold text-[#1430d8] truncate">
                            3. Final (Code)
                          </span>
                        </span>
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 bg-white border border-blue-200 rounded-lg px-2 py-0.5 shrink-0"
                        >
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={activeMilestoneSplit.pct3}
                            onChange={(e) => handleStagePercentageInput(2, e.target.value)}
                            className="w-9 bg-transparent font-mono font-black text-xs text-right text-[#1430d8] focus:outline-none"
                            aria-label="Stage 3 Final Delivery Percentage"
                          />
                          <span className="text-[10px] font-mono font-bold text-[#1430d8]">%</span>
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-mono font-black text-sm text-slate-900">
                          {currencySymbol}{activeMilestoneSplit.amt3.toLocaleString()}
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            activeMilestoneSplit.stage3Paid ? 'text-[#1430d8]' : 'text-slate-400'
                          }`}
                        >
                          {activeMilestoneSplit.selectedStage === 'stage_3'
                            ? '✓ Selected · Paid'
                            : 'Tap to Select'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Due upon launch &amp; 100% full code transfer
                      </p>
                    </div>
                  </div>

                  {/* Live Paid vs Remaining Balance Reconciliation Strip */}
                  <div className="px-3 py-2 rounded-lg bg-white border border-slate-200/90 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-600">
                      Paid So Far:{' '}
                      <strong className="font-mono font-extrabold text-[#1430d8]">
                        {currencySymbol}{activeMilestoneSplit.paidAmt.toLocaleString()} ({activeMilestoneSplit.paidPct}%)
                      </strong>
                    </span>
                    <span className="text-slate-600">
                      Remaining Balance:{' '}
                      <strong className="font-mono font-extrabold text-slate-900">
                        {currencySymbol}{activeMilestoneSplit.remainingAmt.toLocaleString()} ({activeMilestoneSplit.remainingPct}%)
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* CLIENT ACQUISITION SOURCE: WITHOUT REFERENCE (NO TOKEN) VS WITH REFERENCE (PARTNER TOKEN REQUIRED) */}
              <div className="p-3 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3">
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Reference &amp; Partner Token Mode</span>
                    <span className="text-[10px] text-slate-500 font-normal hidden xs:inline">(Direct vs Partner Referred)</span>
                  </label>
                  {clientSource === 'referred' ? (
                    <span className="text-[11px] font-bold text-[#1430d8] font-mono self-start xs:self-auto">
                      With Reference · Partner Token Active
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-600 self-start xs:self-auto">
                      Without Reference · Direct Client (No Token)
                    </span>
                  )}
                </div>

                {/* Clean Studio Royal Blue / White Two-Choice Toggle (Zero Green Clutter) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setClientSource('direct');
                      setTokenError(null);
                      setFormData((prev) => ({
                        ...prev,
                        referralToken: '',
                        partnerName: '',
                        commissionPercentage: 0,
                        commissionAmount: 0
                      }));
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-start gap-2.5 cursor-pointer border text-left ${
                      clientSource === 'direct'
                        ? 'bg-[#1430d8] border-[#1430d8] text-white shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <User className={`w-4 h-4 shrink-0 ${clientSource === 'direct' ? 'text-white' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className="truncate font-black">Without Reference (No Token)</div>
                      <div className={`text-[10px] truncate font-normal ${clientSource === 'direct' ? 'text-blue-100' : 'text-slate-500'}`}>
                        Direct client · Zero token · Ref: {formData.orderNumber}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setClientSource('referred');
                      setTokenError(null);
                      const tok = isCleanStudioToken(formData.referralToken)
                        ? normalizeReferralToken(formData.referralToken!)
                        : generateAgreementPartnerToken(formData.partnerName);
                      const pName = formData.partnerName || (lookupPartnerByToken(tok)?.partnerName || '');
                      const pct = formData.commissionPercentage || 20;
                      const comm = Math.round((formData.confirmedPrice * pct) / 100);
                      setFormData((prev) => ({
                        ...prev,
                        referralToken: tok,
                        partnerName: pName,
                        commissionPercentage: pct,
                        commissionAmount: comm
                      }));
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-start gap-2.5 cursor-pointer border text-left ${
                      clientSource === 'referred'
                        ? 'bg-[#1430d8] border-[#1430d8] text-white shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Award className={`w-4 h-4 shrink-0 ${clientSource === 'referred' ? 'text-amber-300' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className="truncate font-black">With Reference (Partner Token)</div>
                      <div className={`text-[10px] truncate font-normal ${clientSource === 'referred' ? 'text-blue-100' : 'text-slate-500'}`}>
                        Referred client · Always new token · Ref: {formData.orderNumber}
                      </div>
                    </div>
                  </button>
                </div>

                {/* If With Reference: Show Mandatory Partner Token & Partner Details Controls */}
                {clientSource === 'referred' && (
                  <div className="pt-3 mt-1 border-t border-slate-200/90 space-y-3 bg-white p-3 sm:p-3.5 rounded-xl border border-blue-200/80 shadow-xs">
                    {tokenError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{tokenError}</span>
                      </div>
                    )}

                    {/* Header bar of Referral box with quick reset/remove action */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-black text-slate-900 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-[#1430d8]" />
                        <span>Reference Partner Token &amp; Attribution (Always Unique · Never Repeats)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setClientSource('direct');
                          setTokenError(null);
                          setFormData((prev) => ({
                            ...prev,
                            referralToken: '',
                            partnerName: '',
                            commissionPercentage: 0,
                            commissionAmount: 0
                          }));
                        }}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                      >
                        Remove Reference (Switch to No Token)
                      </button>
                    </div>

                    {/* Quick Pick Issued Partner Token OR Mint Brand-New Partner Token */}
                    <div className="relative" ref={partnerDropdownRef}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-700">
                          Select Issued Partner Token or Mint New Partner Token
                        </label>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {registeredPartners.length} issued token{registeredPartners.length === 1 ? '' : 's'} in Admin
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRegisteredPartners(getPartnerTokens());
                          setIsPartnerMenuOpen(!isPartnerMenuOpen);
                          setIsServiceMenuOpen(false);
                          setIsCurrencyMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm sm:text-xs font-semibold text-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          isPartnerMenuOpen ? 'border-[#1430d8] ring-2 ring-blue-500/20 bg-white' : 'border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        <span className="truncate">
                          {formData.referralToken
                            ? `${formData.partnerName || 'Partner'} · Token: ${formData.referralToken.toUpperCase()}`
                            : registeredPartners.length > 0
                            ? '-- Select an issued Partner Token (UDH-...) or type below --'
                            : '-- Type Partner Name & click "New Unique Token" below --'}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isPartnerMenuOpen ? 'rotate-180 text-[#1430d8]' : ''}`} />
                      </button>

                      {isPartnerMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 p-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const freshTok = generateAgreementPartnerToken(formData.partnerName, [
                                formData.referralToken || ''
                              ]);
                              const pct = formData.commissionPercentage || 20;
                              const comm = Math.round((formData.confirmedPrice * pct) / 100);
                              setTokenError(null);
                              setFormData((prev) => ({
                                ...prev,
                                referralToken: freshTok,
                                commissionPercentage: pct,
                                commissionAmount: comm
                              }));
                              setIsPartnerMenuOpen(false);
                            }}
                            className="w-full px-2.5 py-2 rounded-lg text-xs font-bold text-[#1430d8] bg-blue-50/70 hover:bg-blue-100/80 text-left flex items-center justify-between cursor-pointer"
                          >
                            <span>+ Generate Brand-New Unique Partner Token</span>
                            <span className="font-mono text-[10px]">UDH-NEW</span>
                          </button>

                          {registeredPartners.map((p) => {
                            const cleanPtTok = normalizeReferralToken(p.token);
                            const usedOnOtherOrder = getOrderAgreements().find(
                              (o) =>
                                o.id !== formData.id &&
                                Boolean(o.referralToken) &&
                                normalizeReferralToken(o.referralToken!) === cleanPtTok
                            );
                            const isSelectedToken =
                              normalizeReferralToken(formData.referralToken || '') === cleanPtTok;

                            return (
                              <button
                                key={p.token}
                                type="button"
                                onClick={() => {
                                  const chosenTok = usedOnOtherOrder
                                    ? generateAgreementPartnerToken(p.partnerName, [
                                        p.token,
                                        formData.referralToken || ''
                                      ])
                                    : cleanPtTok;
                                  const pct = formData.commissionPercentage || 20;
                                  const comm = Math.round((formData.confirmedPrice * pct) / 100);
                                  setTokenError(null);
                                  setFormData((prev) => ({
                                    ...prev,
                                    referralToken: chosenTok,
                                    partnerName: p.partnerName,
                                    commissionPercentage: pct,
                                    commissionAmount: comm
                                  }));
                                  setIsPartnerMenuOpen(false);
                                }}
                                className={`w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-left flex items-center justify-between gap-2 cursor-pointer ${
                                  isSelectedToken ? 'bg-blue-50 text-[#1430d8] font-bold' : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-bold flex items-center gap-1.5">
                                    <span>{p.partnerName}</span>
                                    <code className="font-mono text-[11px] text-[#1430d8]">{cleanPtTok}</code>
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate">
                                    {p.partnerEmail}
                                    {usedOnOtherOrder
                                      ? ` · Used on ${usedOnOtherOrder.orderNumber} (mints new token)`
                                      : ' · Ready to link & sync Track Status'}
                                  </div>
                                </div>
                                <span
                                  className={`text-[10px] font-bold shrink-0 ${
                                    usedOnOtherOrder ? 'text-amber-700' : 'text-emerald-700'
                                  }`}
                                >
                                  {usedOnOtherOrder ? '+ New Token' : 'Use Token'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* The 2 Primary Editable Inputs: Token + Partner Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Mandatory Editable Token Input + 1-Click Auto-Generate */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-slate-800">
                            Partner Referral Token <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const generated = generateAgreementPartnerToken(formData.partnerName, [
                                formData.referralToken || ''
                              ]);
                              setTokenError(null);
                              const pct = formData.commissionPercentage || 20;
                              setFormData((prev) => ({
                                ...prev,
                                referralToken: generated,
                                commissionPercentage: pct,
                                commissionAmount: Math.round((prev.confirmedPrice * pct) / 100)
                              }));
                            }}
                            className="text-[10px] font-bold text-[#1430d8] hover:underline flex items-center gap-1 cursor-pointer"
                            title="Generate a brand-new never-before-used Partner Token"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>New Unique Token</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.referralToken || ''}
                          onChange={(e) => {
                            const upper = e.target.value.toUpperCase();
                            if (isCleanStudioToken(upper)) setTokenError(null);
                            const matched = lookupPartnerByToken(upper) || registeredPartners.find(p => p.token.toUpperCase() === upper);
                            const pct = formData.commissionPercentage || 20;
                            const comm = Math.round((formData.confirmedPrice * pct) / 100);
                            setFormData((prev) => ({
                              ...prev,
                              referralToken: upper,
                              partnerName: matched ? matched.partnerName : prev.partnerName,
                              commissionPercentage: pct,
                              commissionAmount: comm
                            }));
                          }}
                          className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm sm:text-xs font-mono font-bold text-[#1430d8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 uppercase tracking-wider ${
                            tokenError ? 'border-rose-400 bg-rose-50/40' : duplicateTokenOwner ? 'border-amber-400 bg-amber-50/40' : 'border-blue-300'
                          }`}
                          placeholder="e.g. UDH-PARTNER-006K9"
                        />
                        {duplicateTokenOwner ? (
                          <div className="mt-1 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-900 flex items-center justify-between gap-1.5">
                            <span>Already used on {duplicateTokenOwner.orderNumber}. Auto-replaces with new token on save.</span>
                            <button
                              type="button"
                              onClick={() => {
                                const fresh = generateAgreementPartnerToken(formData.partnerName, [formData.referralToken || '']);
                                setFormData((prev) => ({ ...prev, referralToken: fresh }));
                              }}
                              className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold cursor-pointer shrink-0"
                            >
                              New Token
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            100% unique token · Auto-added to Admin Token PDF list (1–100)
                          </span>
                        )}
                      </div>

                      {/* Fully Editable Partner Name Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-slate-800">
                            Partner Full Name
                          </label>
                          <span className="text-[9px] text-slate-500 font-medium">Editable</span>
                        </div>
                        <input
                          type="text"
                          value={formData.partnerName || ''}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              partnerName: e.target.value
                            }));
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          placeholder="e.g. Partner Full Name / Agency"
                        />
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Person / agency receiving referral commission
                        </span>
                      </div>
                    </div>

                    {/* Commission Rate & Live Payout Strip (Fully Editable) */}
                    <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-slate-900 block truncate">
                            {formData.partnerName ? `Partner: ${formData.partnerName}` : 'Partner Token Active'}
                          </span>
                          <span className="text-[10px] text-slate-600 block truncate">
                            Token: <code className="font-mono font-bold text-[#1430d8]">{formData.referralToken || 'PENDING ENTRY'}</code>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-200 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left sm:text-right space-y-1">
                          <label className="text-[9px] uppercase font-bold text-blue-900 block">Commission %</label>
                          <div className="flex items-center gap-1 justify-start sm:justify-end">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={formData.commissionPercentage || 20}
                              onChange={(e) => {
                                const pct = Number(e.target.value);
                                const safePct = Math.max(0, Math.min(100, pct));
                                const comm = Math.round((formData.confirmedPrice * safePct) / 100);
                                setFormData((prev) => ({
                                  ...prev,
                                  commissionPercentage: safePct,
                                  commissionAmount: comm
                                }));
                              }}
                              className="w-14 px-2 py-1 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-center text-[#1430d8] focus:outline-none"
                            />
                            <span className="font-bold text-slate-600">%</span>
                          </div>
                          {/* Quick 20%, 25%, 35%, 40% Tier Buttons */}
                          <div className="flex items-center gap-1 justify-start sm:justify-end">
                            {[20, 25, 35, 40].map((tier) => (
                              <button
                                key={tier}
                                type="button"
                                onClick={() => {
                                  const comm = Math.round((formData.confirmedPrice * tier) / 100);
                                  setFormData((prev) => ({
                                    ...prev,
                                    commissionPercentage: tier,
                                    commissionAmount: comm
                                  }));
                                }}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                                  (formData.commissionPercentage || 20) === tier
                                    ? 'bg-[#1430d8] text-white'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}
                              >
                                {tier}%
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="text-right pl-3 border-l border-blue-200">
                          <span className="text-[9px] uppercase font-bold text-blue-900 block">Partner Payout</span>
                          <span className="font-mono font-black text-xs sm:text-sm text-[#1430d8]">
                            {currencySymbol}{formData.commissionAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* SECTION 2: THE SPACIOUS DEDICATED WRITING AREA */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white border-2 border-blue-300/90 shadow-sm space-y-3.5 max-w-full overflow-hidden">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                    <ClipboardPaste className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      Project Scope, Deliverables &amp; Custom Terms
                    </h3>
                    <p className="text-[11px] text-blue-900/80 truncate hidden xs:block">
                      Write or paste all your project details and specifications here
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end xs:self-auto shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={handleInsertBullet}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1430d8] font-bold text-xs border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                    title="Insert bullet point (•)"
                  >
                    <span>+ Bullet (•)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(formData.service, formData.serviceCategory)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#1430d8] text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                    title="Reset scope text to the default template for the currently selected service card above"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-500" />
                    <span>Reset to Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScopeChange('')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* THE SPACIOUS TEXT WRITING AREA */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  rows={12}
                  value={formData.scopeDescription}
                  onChange={(e) => handleScopeChange(e.target.value)}
                  className="w-full px-3.5 sm:px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-sans text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all leading-relaxed min-h-[240px] sm:min-h-[300px]"
                  placeholder={`Write or paste all your deliverables, custom milestones, and project terms here...\n\nExample:\n• Full-Stack Custom Web Architecture engineered with modern React 19 / Next.js and Tailwind CSS.\n• Fully responsive, mobile-first layouts with clean UX, SEO meta tags, and fast load speed (<2.0s).\n• Complete backend API integration with database connectivity and cloud hosting deployment.\n• 30 calendar days of post-launch technical warranty and bug-fixing support included.`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Lines: {formData.scopeDescription.split('\n').filter(Boolean).length}</span>
                <span>Characters: {formData.scopeDescription.length}</span>
              </div>
            </div>



            {/* SECTION 3: 3-OPTION SEND & OFFICIAL PDF DOWNLOAD HUB */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5 max-w-full overflow-hidden">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1430d8] flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      Send Full PDF + Short Message (Email &amp; WhatsApp)
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      Sends full PDF file + short message on Gmail / Email or WhatsApp (no PDF link)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#1430d8] self-start xs:self-auto">
                  Ref: {formData.orderNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Email Recipient
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail || ''}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#1430d8] focus:outline-none"
                    placeholder="client@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={formData.clientPhone || ''}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#1430d8] focus:outline-none"
                    placeholder="+92 300 1234567"
                  />
                </div>
              </div>

              {/* THE 2 DIRECT SEND OPTIONS: 1. EMAIL  |  2. WHATSAPP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option 1: Send via Email */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleShareEmail('auto')}
                    className="w-full py-3 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1430d8] border border-blue-200 font-extrabold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>1. Send on Gmail / Email</span>
                  </button>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleShareEmail('gmail')}
                      className="hover:text-[#1430d8] hover:underline cursor-pointer font-semibold"
                    >
                      Gmail Web
                    </button>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => handleShareEmail('mailto')}
                      className="hover:text-[#1430d8] hover:underline cursor-pointer font-semibold"
                    >
                      Mail App
                    </button>
                  </div>
                </div>

                {/* Option 2: Send via WhatsApp */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="w-full py-3 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-900 hover:text-[#1430d8] border border-slate-200 hover:border-blue-200 font-extrabold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <MessageCircle className="w-4 h-4 text-[#1430d8] shrink-0" />
                    <span>2. Send on WhatsApp</span>
                  </button>
                  <span className="text-[10px] text-slate-500 text-center">
                    Full PDF + short message on WhatsApp
                  </span>
                </div>
              </div>

              {/* Save & View Preview + Download Official PDF */}
              <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSaveOrder(true)}
                  className="w-full py-3.5 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white font-black text-sm shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <Eye className="w-4 h-4" />
                  <span>Save &amp; View Preview</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* RIGHT COLUMN: THE OFFICIAL CLEAN A4 DOCUMENT PREVIEW */}
        {/* (Kept in DOM so documentRef & preview are always immediately ready) */}
        {/* ============================================================ */}
        <div
          className={`${
            viewMode === 'preview' || viewMode === 'split'
              ? 'flex-1 min-h-0 h-full w-full overflow-y-auto overscroll-contain p-2.5 sm:p-6 md:p-8 bg-slate-200/80 flex flex-col items-center pb-28 lg:pb-8 ' +
                (viewMode === 'preview' ? 'w-full' : 'w-full lg:w-1/2')
              : 'hidden'
          }`}
          style={{ WebkitOverflowScrolling: 'touch', minHeight: 0 }}
        >
          {/* Top Toolbar in Preview Mode (Includes Email, WhatsApp, Instagram & PDF Download) */}
          <div className="w-full max-w-[794px] mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-white/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Form</span>
              </button>
              <span className="font-bold text-slate-900 hidden md:inline">A4 Proforma Ready</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Zoom Controls */}
              <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                  className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="px-1.5 py-0.5 text-[11px] font-bold text-slate-700 hover:text-slate-900 cursor-pointer font-mono"
                  title="Reset Zoom to 100%"
                >
                  {zoomLevel}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(135, z + 10))}
                  className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleShareEmail('auto')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-[#1430d8] font-bold text-xs flex items-center gap-1 cursor-pointer border border-slate-200 transition-colors"
                title="Send via Email"
              >
                <Mail className="w-3.5 h-3.5 text-[#1430d8]" />
                <span>Email</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-[#1430d8] font-bold text-xs flex items-center gap-1 cursor-pointer border border-slate-200 transition-colors"
                title="Send via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#1430d8]" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs hidden sm:flex items-center gap-1 cursor-pointer border border-slate-200 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-3 py-1.5 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
              </button>
            </div>
          </div>

            {/* THE OFFICIAL PRINTABLE A4 DOCUMENT */}
            <div
              ref={documentRef}
              id="usman-official-order-document-light"
              className="w-full max-w-[820px] min-h-0 sm:min-h-[1160px] bg-white text-slate-900 p-3.5 sm:p-8 md:p-14 rounded-lg shadow-2xl border border-slate-300/80 relative print:p-0 print:border-none print:shadow-none print:m-0 mb-12 break-words overflow-x-hidden transition-all"
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
                transformOrigin: 'top center'
              }}
            >
              {/* Top Luxury Executive Accent Ribbon */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0B192E] via-[#1430d8] to-[#00c2ff]" />

              {/* Subtle Watermark Seal in Background */}
              <div className="absolute right-6 top-20 opacity-[0.025] pointer-events-none select-none hidden sm:block">
                <svg width="380" height="380" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="92" stroke="#0B192E" strokeWidth="6" strokeDasharray="6 6" />
                  <circle cx="100" cy="100" r="80" stroke="#0B192E" strokeWidth="2" />
                  <path d="M60 70 L100 45 L140 70 L140 130 L100 155 L60 130 Z" stroke="#0B192E" strokeWidth="4" />
                  <text x="100" y="105" textAnchor="middle" fill="#0B192E" fontSize="16" fontWeight="bold" fontFamily="sans-serif">USMAN DEVHUB</text>
                  <text x="100" y="120" textAnchor="middle" fill="#0B192E" fontSize="7" fontWeight="bold" letterSpacing="2">OFFICIAL LEGAL PROFORMA</text>
                </svg>
              </div>

              {/* ======================================================== */}
              {/* 1. DOCUMENT HEADER & OFFICIAL STUDIO LETTERHEAD */}
              {/* ======================================================== */}
              <div className="border-b-2 border-slate-900 pb-5 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  {/* Studio Brand Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {effectiveLogo && (
                        <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={effectiveLogo}
                            alt="Usman DevHub Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-[10px] font-extrabold uppercase tracking-widest mb-2">
                          <Sparkles className="w-3 h-3 text-[#1430d8]" />
                          <span>Commercial Master Services Agreement &amp; Statement of Work</span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950 uppercase font-display">
                          USMAN DEVHUB
                        </h1>
                        <p className="text-xs sm:text-sm font-bold text-[#1430d8] tracking-wider uppercase mt-0.5">
                          Tech &amp; Creative Studio • High-Performance Digital Architecture
                        </p>

                        <div className="mt-2.5 space-y-0.5 text-xs text-slate-600">
                          <p><strong className="text-slate-900">Lead Technologist:</strong> Muhammad Usman Afzal</p>
                          <p><strong className="text-slate-900">Direct WhatsApp:</strong> +92 341 2683864   |   <strong className="text-slate-900">Official Email:</strong> <a href="mailto:hello@usmandevhub.com" className="text-[#1430d8] hover:underline font-medium">hello@usmandevhub.com</a></p>
                          <p><strong className="text-slate-900">Portal &amp; Verification:</strong> https://usmandevhub.agency</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ref & Date Badge (Light Card) */}
                  <div className="text-left sm:text-right flex flex-col sm:items-end justify-between shrink-0">
                    <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-900/10 text-left sm:text-right w-full sm:w-auto shadow-2xs">
                      <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        Agreement Reference No.
                      </span>
                      <span className="font-mono text-base sm:text-lg font-black text-[#1430d8] tracking-wider block mt-0.5">
                        {formData.orderNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-[#1430d8]" />
                        <span>Verified Legally Binding Proforma</span>
                      </span>
                    </div>

                    <div className="mt-2 space-y-0.5 text-xs text-slate-600 sm:text-right">
                      <p><strong className="text-slate-900">Issue Date:</strong> {formatAgreementDate(formData.agreementDate || formData.createdAt)}</p>
                      <p><strong className="text-slate-900">Timeline:</strong> {formData.timeline || '7-14 Business Days'}</p>
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500">
                      Instrument Status:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-blue-50 text-[#1430d8] border border-blue-200">
                      ✓ CONFIRMED &amp; RATIFIED
                    </span>
                  </div>

                  {clientSource === 'referred' && isCleanStudioToken(formData.referralToken) ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span>Partner Referral Token:</span>
                      <span className="font-mono font-bold text-[#1430d8] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {formData.partnerName
                          ? `${normalizeReferralToken(formData.referralToken!)} (${formData.partnerName})`
                          : normalizeReferralToken(formData.referralToken!)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 font-medium">
                      Engagement Mode: <strong className="text-slate-800 font-semibold">Direct Client (Without Reference)</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* ======================================================== */}
              {/* OFFICIAL LEGAL PREAMBLE & RECITALS */}
              {/* ======================================================== */}
              <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 leading-relaxed shadow-2xs">
                <p>
                  <strong className="text-slate-900 uppercase tracking-wide text-[10px] block mb-1">
                    LEGAL PREAMBLE &amp; RECITALS:
                  </strong>
                  This Master Digital Services Agreement and Statement of Work (&ldquo;Agreement&rdquo;) is entered into as of the Effective Date by and between <strong>USMAN DEVHUB TECH &amp; CREATIVE STUDIO</strong> (&ldquo;Service Provider&rdquo;) and <strong>{formData.clientName || 'Valued Client'}</strong> {formData.clientCompany ? `representing ${formData.clientCompany}` : ''} (&ldquo;Commissioning Client&rdquo;). WHEREAS, Service Provider specializes in high-performance digital engineering, 3D WebGL experiences, and custom software architecture; and WHEREAS, Client desires to retain Service Provider for the execution of the digital deliverables set forth below; NOW, THEREFORE, the Parties mutually agree to the terms herein:
                </p>
              </div>

              {/* ======================================================== */}
              {/* SECTION 1.0: PARTIES & ENGAGEMENT SPECIFICATION */}
              {/* ======================================================== */}
              <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
                  SECTION 1.0 — PARTIES &amp; ENGAGEMENT SPECIFICATION
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-950">Party of Second Part (Client): {formData.clientName || 'Valued Client'}</h3>
                    {formData.clientCompany && (
                      <p className="font-bold text-slate-800">Entity / Organization: {formData.clientCompany}</p>
                    )}
                    {formData.clientCountry &&
                      formData.clientCountry.trim().toLowerCase() !== (formData.clientCompany || '').trim().toLowerCase() && (
                        <p className="text-slate-600">Commercial Jurisdiction: {formData.clientCountry}</p>
                      )}
                    {formData.clientTaxId && (
                      <p className="font-mono text-[11px] text-slate-500">Client Tax/NTN Ref: {formData.clientTaxId}</p>
                    )}
                  </div>

                  {(() => {
                    const srvName = normalizeHomeServiceName(formData.service);
                    const catName = getHomeServiceCategory(formData.service);
                    const specName = formData.serviceCategory;
                    return (
                      <div className="space-y-1 sm:text-right">
                        {formData.clientEmail && (
                          <p><strong className="text-slate-700">Official Email:</strong> {formData.clientEmail}</p>
                        )}
                        {formData.clientPhone && (
                          <p><strong className="text-slate-700">Phone / WhatsApp:</strong> {formData.clientPhone}</p>
                        )}
                        <p>
                          <strong className="text-slate-700">Service Category:</strong>{' '}
                          <span className="font-bold text-[#1430d8]">{srvName}</span>
                        </p>
                        <p>
                          <strong className="text-slate-700">Specialization:</strong>{' '}
                          <span className="font-semibold text-slate-800">{specName || catName}</span>
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTION 2.0: STATEMENT OF WORK & TECHNICAL DELIVERABLES */}
              {/* ======================================================== */}
              <div className="mb-5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-2 truncate">
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#1430d8]" />
                      <span>SECTION 2.0 — STATEMENT OF WORK &amp; DELIVERABLES (SOW)</span>
                    </h3>
                    {(() => {
                      const srv = normalizeHomeServiceName(formData.service);
                      return (
                        <span className="hidden xs:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#1430d8] border border-blue-200">
                          {srv}
                        </span>
                      );
                    })()}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 shrink-0">{formData.timeline}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">
                  Project Title: {formData.projectTitle}
                </h4>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed space-y-1.5">
                  {formData.scopeDescription.split('\n').map((line, idx) => {
                    const clean = line.trim();
                    if (!clean) return <div key={idx} className="h-1" />;

                    if (clean.startsWith('•') || clean.startsWith('-') || clean.startsWith('*') || /^\d+[\.\)]/.test(clean)) {
                      const textOnly = clean.replace(/^[•\-\*]\s*/, '').replace(/^\d+[\.\)]\s*/, '');
                      return (
                        <div key={idx} className="flex items-start gap-2 py-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1430d8] shrink-0 mt-0.5" />
                          <span className="font-medium text-slate-900 min-w-0 flex-1">{textOnly}</span>
                        </div>
                      );
                    }

                    return (
                      <p key={idx} className="text-slate-700">
                        {clean}
                      </p>
                    );
                  })}
                </div>

                {formData.techStack && formData.techStack.length > 0 && (
                  <div className="pt-0.5">
                    <span className="text-[10px] font-bold block mb-1 text-slate-500 uppercase tracking-wider">
                      Target Software Architecture &amp; Frameworks:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.techStack.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 border border-slate-300 text-slate-800"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* SECTION 3.0: COMMERCIAL INVESTMENT & 3-STAGE MILESTONE SCHEDULE */}
              {/* ======================================================== */}
              <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
                  SECTION 3.0 — COMMERCIAL TERMS &amp; 3-STAGE MILESTONE PAYMENT SCHEDULE ({activeMilestoneSplit.pct1}% / {activeMilestoneSplit.pct2}% / {activeMilestoneSplit.pct3}%)
                </span>

                {/* Confirmed Total Investment Banner (Light Card) */}
                <div className="mb-3.5 p-3.5 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      Confirmed Total Contract Investment (Fixed Scope Guaranteed)
                    </span>
                    <div className="text-2xl font-black font-mono text-[#1430d8]">
                      {currencySymbol}{formData.confirmedPrice.toLocaleString()} {formData.currency}
                    </div>
                  </div>
                  <div className="text-left sm:text-right text-[11px] text-slate-600 space-y-0.5">
                    {activeMilestoneSplit.selectedStage === 'none' ? (
                      <>
                        <span className="font-bold text-[#1430d8] block">✓ Confirmed · 0% Paid So Far</span>
                        <span>Full 3-Stage Milestone Schedule Due</span>
                      </>
                    ) : (
                      <>
                        <span className="font-mono font-extrabold text-[#1430d8] block">
                          Paid So Far: {currencySymbol}{activeMilestoneSplit.paidAmt.toLocaleString()} ({activeMilestoneSplit.paidPct}%)
                        </span>
                        <span className="font-mono font-semibold text-slate-800">
                          Remaining Balance: {currencySymbol}{activeMilestoneSplit.remainingAmt.toLocaleString()} ({activeMilestoneSplit.remainingPct}%)
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 3 Milestone Columns (Clean White / Studio Blue — Zero Green) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Stage 1 */}
                  <div
                    className={`p-3 rounded-lg space-y-1 shadow-2xs ${
                      activeMilestoneSplit.stage1Paid
                        ? 'bg-blue-50/60 border-2 border-[#1430d8]'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#1430d8]">
                        1. Start • Kickoff ({activeMilestoneSplit.pct1}%)
                      </span>
                      <span
                        className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                          activeMilestoneSplit.stage1Paid
                            ? 'bg-[#1430d8] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {activeMilestoneSplit.stage1Paid ? 'PAID' : 'DUE'}
                      </span>
                    </div>
                    <div className="text-base font-black font-mono text-slate-900">
                      {currencySymbol}{activeMilestoneSplit.amt1.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Payable upfront to initiate sprint architecture, database models &amp; UI wireframe design.
                    </p>
                  </div>

                  {/* Stage 2 */}
                  <div
                    className={`p-3 rounded-lg space-y-1 shadow-2xs ${
                      activeMilestoneSplit.stage2Paid
                        ? 'bg-blue-50/60 border-2 border-[#1430d8]'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#1430d8]">
                        2. Mid • Demo ({activeMilestoneSplit.pct2}%)
                      </span>
                      <span
                        className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                          activeMilestoneSplit.stage2Paid
                            ? 'bg-[#1430d8] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {activeMilestoneSplit.stage2Paid ? 'PAID' : 'DUE'}
                      </span>
                    </div>
                    <div className="text-base font-black font-mono text-slate-900">
                      {currencySymbol}{activeMilestoneSplit.amt2.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Payable midway upon interactive prototype demo, functional walkthrough, and client feedback review.
                    </p>
                  </div>

                  {/* Stage 3 (Clean White / Studio Blue — Zero Green) */}
                  <div
                    className={`p-3 rounded-lg space-y-1 shadow-2xs ${
                      activeMilestoneSplit.stage3Paid
                        ? 'bg-blue-50/60 border-2 border-[#1430d8]'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#1430d8]">
                        3. Final • Code ({activeMilestoneSplit.pct3}%)
                      </span>
                      <span
                        className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                          activeMilestoneSplit.stage3Paid
                            ? 'bg-[#1430d8] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {activeMilestoneSplit.stage3Paid ? 'PAID' : 'DUE'}
                      </span>
                    </div>
                    <div className="text-base font-black font-mono text-slate-900">
                      {currencySymbol}{activeMilestoneSplit.amt3.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Payable upon live production deployment, final sign-off, and <strong>100% full source code handover</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTIONS 4.0, 5.0, 6.0, 7.0: LEGAL CLAUSES */}
              {/* ======================================================== */}
              <div className="mb-5 p-4 rounded-xl border border-slate-200 bg-slate-50 text-[11px] leading-relaxed space-y-2.5">
                <div>
                  <strong className="text-slate-950 block text-[10px] uppercase tracking-wider font-extrabold">
                    SECTION 4.0 — 100% SOURCE CODE &amp; INTELLECTUAL PROPERTY (IP) TRANSFER:
                  </strong>
                  <p className="text-slate-700 mt-0.5">
                    Upon final settlement of Stage 3, 100% of all proprietary source code repositories, design assets, database structures, documentation, and digital deliverables transfer unconditionally and irrevocably to Client ownership. Service Provider retains zero restrictive liens.
                  </p>
                </div>

                <div>
                  <strong className="text-slate-950 block text-[10px] uppercase tracking-wider font-extrabold">
                    SECTION 5.0 — MUTUAL NON-DISCLOSURE (NDA) &amp; DATA CONFIDENTIALITY:
                  </strong>
                  <p className="text-slate-700 mt-0.5">
                    Both Parties agree to maintain strict confidentiality regarding all proprietary information, trade secrets, system access tokens, client records, and business strategies disclosed during this technical engagement.
                  </p>
                </div>

                <div>
                  <strong className="text-slate-950 block text-[10px] uppercase tracking-wider font-extrabold">
                    SECTION 6.0 — 30-DAY POST-LAUNCH TECHNICAL WARRANTY &amp; BUG-FIX SLA:
                  </strong>
                  <p className="text-slate-700 mt-0.5">
                    Service Provider warrants all deliverables against functional defects, deployment regressions, and Core Web Vitals issues for thirty (30) calendar days commencing upon production go-live. Bug fixes during this period are complimentary.
                  </p>
                </div>

                <div>
                  <strong className="text-slate-950 block text-[10px] uppercase tracking-wider font-extrabold">
                    SECTION 7.0 — CHANGE ORDERS &amp; SPRINT REVISIONS POLICY:
                  </strong>
                  <p className="text-slate-700 mt-0.5">
                    Minor revisions within original scope specifications are executed seamlessly. Any material architectural expansion or newly introduced feature sets will be estimated as a formal written Change Order without delaying ongoing milestones.
                  </p>
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTION 8.0: MUTUAL RATIFICATION & DUAL AUTHORIZED SIGNATURES */}
              {/* ======================================================== */}
              <div className="pt-4 border-t-2 border-slate-900">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-3">
                  SECTION 8.0 — MUTUAL RATIFICATION &amp; DUAL AUTHORIZED SIGNATURES
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-start sm:items-end">
                  {/* Lead Technologist Sign-Off */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Service Provider (Lead Technologist)
                    </span>
                    <div className="h-12 flex items-center justify-between select-none">
                      <span className="font-serif italic text-2xl font-bold tracking-wide text-blue-950">
                        M. Usman Afzal
                      </span>
                      {/* Official Seal Stamp */}
                      <div className="w-12 h-12 rounded-full border-2 border-[#1430d8] flex items-center justify-center p-1 bg-blue-50/50 shadow-2xs rotate-6">
                        <div className="w-full h-full rounded-full border border-dashed border-[#1430d8] flex flex-col items-center justify-center text-[7px] font-black text-[#1430d8] text-center leading-none">
                          <span>UDH</span>
                          <span className="text-[5px]">VERIFIED</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-slate-400 pt-1.5 space-y-0.5 text-xs">
                      <p className="font-black text-slate-950">{formData.adminSignatureName || 'Muhammad Usman Afzal'}</p>
                      <p className="text-[11px] text-slate-600">{formData.adminSignatureDesignation || 'Founder & Principal Creative Technologist'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Usman DevHub Tech &amp; Creative Studio (Verified Digital Seal)</p>
                    </div>
                  </div>

                  {/* Client Acceptance Sign-Off */}
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Commissioning Client Authorized Acceptance
                    </span>
                    <div className="h-12 flex items-center justify-start sm:justify-end select-none">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1430d8] text-xs font-bold">
                        <CheckCheck className="w-4 h-4 text-[#1430d8]" />
                        <span>Digitally Confirmed &amp; Ratified</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-400 pt-1.5 space-y-0.5 text-xs">
                      <p className="font-black text-slate-950">{formData.clientName || 'Authorized Signatory'}</p>
                      {formData.clientCompany && (
                        <p className="text-[11px] text-slate-600">{formData.clientCompany}</p>
                      )}
                      <p className="text-[10px] text-slate-400 font-mono">Verified Digital Authorization • Ref: {formData.orderNumber} • Date: {formatAgreementDate(formData.agreementDate || formData.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Document Credentials */}
                <div className="mt-6 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] font-mono text-slate-500 break-all">
                  <span>
                    AGREEMENT REF NO: {formData.orderNumber}
                    {clientSource === 'referred' && isCleanStudioToken(formData.referralToken)
                      ? ` • PARTNER TOKEN: ${normalizeReferralToken(formData.referralToken!)}`
                      : ' • DIRECT CLIENT'}
                  </span>
                  <span>AUTHENTICATE: https://usmandevhub.agency/#order-{formData.orderNumber}</span>
                  <span>OFFICIAL COMMERCIAL LEGAL PROFORMA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* ============================================================== */}
      {/* MOBILE FLOATING STICKY ACTION BAR (< lg screens) — 3 SEND OPTIONS + PREVIEW + PDF */}
      {/* ============================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 px-2.5 py-2.5 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg z-40 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleSaveOrder(true)}
          className="flex-1 min-w-0 py-2.5 px-2.5 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Preview</span>
        </button>

        {/* 1. Email */}
        <button
          type="button"
          onClick={() => handleShareEmail('auto')}
          className="py-2.5 px-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-[#1430d8] border border-slate-200 font-bold text-[11px] flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
          title="Send via Email"
        >
          <Mail className="w-3.5 h-3.5 text-[#1430d8]" />
          <span className="hidden xs:inline">Email</span>
        </button>

        {/* 2. WhatsApp */}
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="py-2.5 px-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-[#1430d8] border border-slate-200 font-bold text-[11px] flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
          title="Send via WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#1430d8]" />
          <span className="hidden xs:inline">WA</span>
        </button>

        {/* 3. Download PDF */}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
          title="Download Official PDF"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isGeneratingPdf ? '...' : 'PDF'}</span>
        </button>
      </div>

      {/* Unified 3-Channel + Text + Full PDF Share Modal */}
      <ShareDocumentModal
        isOpen={shareModalConfig.isOpen}
        onClose={() => setShareModalConfig((prev) => ({ ...prev, isOpen: false }))}
        documentType="agreement"
        order={formData}
        initialChannel={shareModalConfig.channel}
        onDispatched={(notice) => {
          setSaveNotice(notice);
          setTimeout(() => setSaveNotice(null), 6000);
        }}
      />
    </div>
  );
};
