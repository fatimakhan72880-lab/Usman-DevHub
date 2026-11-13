export interface PageBreakdownItem {
  title: string;
  purpose: string;
  keySections: string[];
}

export interface TechnicalFeatureItem {
  title: string;
  description: string;
  category: 'Design & UX' | 'Performance & SEO' | 'Conversion & Forms' | 'Engineering & Security' | 'Engineering & Quality' | 'Engineering & Deployment';
}

export interface WorkflowPhaseItem {
  step: string;
  timeline: string;
  title: string;
  description: string;
  deliverables: string[];
}

export interface WebsiteTypeInfo {
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
  pageBreakdown?: PageBreakdownItem[];
  technicalFeatures?: TechnicalFeatureItem[];
  workflowPhases?: WorkflowPhaseItem[];
  recommendedAddOns?: string[];
  techStack?: string[];
}

export const WEBSITE_TYPES_DATA: WebsiteTypeInfo[] = [
  {
    id: 'business-websites',
    name: 'Business Websites',
    tagline: 'Credible, modern digital presence engineered to convert prospective visitors into active inquiries.',
    badge: 'Most Popular for Small Business',
    categoryPill: 'Multi-Page Business Architecture',
    whatIsIt: 'Professional, multi-page business websites tailored for companies, local service providers, and startups seeking a trustworthy brand presence that communicates competence and captures qualified client leads.',
    whatClientGets: [
      'Custom Responsive UI/UX Design',
      'Core Multi-Page Architecture (Home, About, Services, Contact)',
      'Lead Capture & Inquiry System',
      'WhatsApp Business Integration',
      'Google Maps / Location Integration when required',
      'Responsive Mobile, Tablet & Desktop Design',
      'Interactive Website Animations',
      'SEO-Ready Website Structure',
      'Performance Optimization',
      'Cross-Browser Compatibility',
      'Production Deployment & SSL'
    ],
    pagesIncluded: [
      'Home (Hero value proposition, company highlights & clear inquiry CTA)',
      'About (Company background, mission, values & team/credentials)',
      'Services (Detailed offerings, capability overviews & deliverable scopes)',
      'Contact (Lead inquiry form, office location, business hours & WhatsApp integration)'
    ],
    pageBreakdown: [
      {
        title: 'Home Page',
        purpose: 'Establish immediate credibility, communicate your core value proposition, and guide visitors toward getting in touch.',
        keySections: ['Hero Value Section', 'Core Services Highlight', 'Key Benefits / Why Choose Us', 'Client Testimonials', 'Contact Call to Action']
      },
      {
        title: 'About Page',
        purpose: 'Present your business story, company background, operational values, and team credentials.',
        keySections: ['Company Background', 'Mission & Core Values', 'Team Credentials / Leadership', 'Trust Factors & Milestones']
      },
      {
        title: 'Services Page',
        purpose: 'Showcase your complete service offerings with clear scope descriptions and target client fit.',
        keySections: ['Service Category Cards', 'Deliverable Overviews', 'Engagement Workflow', 'Project Estimate Trigger']
      },
      {
        title: 'Contact Page',
        purpose: 'Provide direct channels for prospective clients to reach out with project inquiries.',
        keySections: ['Lead Capture Form', 'WhatsApp One-Click Trigger', 'Business Hours & Contact Details', 'Google Maps / Location']
      }
    ],
    technicalFeatures: [
      {
        title: 'Custom Responsive UI/UX Design',
        description: 'Clean, modern typography and touch-optimized navigation calibrated across mobile, tablet, and desktop viewports.',
        category: 'Design & UX'
      },
      {
        title: 'Interactive Website Animations',
        description: 'Tasteful entrance transitions, smooth button hover feedback, and fluid layout pacing.',
        category: 'Design & UX'
      },
      {
        title: 'Performance Optimization',
        description: 'Optimized images, efficient code structure, lightweight assets, and performance-focused implementation.',
        category: 'Performance & SEO'
      },
      {
        title: 'SEO-Ready Website Structure',
        description: 'Semantic HTML structure, optimized meta titles and descriptions, and OpenGraph metadata for professional search and social sharing presentation.',
        category: 'Performance & SEO'
      },
      {
        title: 'Lead Capture & Inquiry System',
        description: 'Clean form validation and reliable inquiry routing designed to help businesses capture customer requests efficiently.',
        category: 'Conversion & Forms'
      },
      {
        title: 'WhatsApp Business Integration',
        description: 'Seamless one-click WhatsApp communication allowing customers to connect directly from mobile and desktop devices.',
        category: 'Conversion & Forms'
      },
      {
        title: 'Cross-Browser Compatibility',
        description: 'Carefully tested for consistent rendering and reliable functionality across modern browsers including Chrome, Safari, Firefox, and Edge.',
        category: 'Engineering & Quality'
      },
      {
        title: 'Production Deployment & SSL',
        description: 'Professional domain connection, hosting configuration, SSL/HTTPS setup, and production deployment for a secure live website.',
        category: 'Engineering & Deployment'
      }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Discovery & Plan',
        description: 'Define business goals, branding & site structure.',
        deliverables: ['Sitemap Spec', 'Style Guide']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'UI/UX Design',
        description: 'Responsive desktop & mobile screen mockups.',
        deliverables: ['UI Screens', 'Design System']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Development',
        description: 'Clean modern code with forms & WhatsApp integration.',
        deliverables: ['React Build', 'Contact Forms']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'QA & Launch',
        description: 'Cross-browser check, speed testing & live deploy.',
        deliverables: ['QA Audit', 'Live Launch']
      }
    ],
    keyFeatures: [
      'Custom Responsive UI/UX Design',
      'Core Multi-Page Architecture (Home, About, Services, Contact)',
      'Lead Capture & Inquiry System',
      'WhatsApp Business Integration',
      'Google Maps / Location Integration when required',
      'Responsive Mobile, Tablet & Desktop Design',
      'Interactive Website Animations',
      'SEO-Ready Website Structure',
      'Performance Optimization',
      'Cross-Browser Compatibility',
      'Production Deployment & SSL'
    ],
    techStack: ['Custom Code', 'Shopify', 'WordPress & WooCommerce', 'TypeScript', 'Next.js & Vite', 'Tailwind CSS'],
    recommendedAddOns: ['Multi-Language Switcher', 'Client Portal Login', 'Blog / Article CMS', 'Automated Appointment Booking'],
    designAndResponsive: 'Clean, modern UI/UX with full responsive design optimized for mobile, tablet, and desktop viewports.',
    bestFor: 'Small businesses, local businesses, professional service providers, law offices, medical practices, and startups.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'portfolio-websites',
    name: 'Portfolio Websites',
    tagline: 'High-impact visual showcase crafted to spotlight creative work, technical expertise, and career milestones.',
    badge: 'Designed for Creatives & Developers',
    categoryPill: 'Visual Showcase & Case Studies',
    whatIsIt: 'Custom portfolio websites crafted to highlight your creative portfolio, engineering case studies, skills, and client achievements with editorial typography, smooth interactions, and unmistakable visual polish.',
    whatClientGets: [
      'Interactive Hero Section with Bio & Resume Download',
      'Categorized Project Showcase with Live Filtering',
      'Deep-Dive Case Study Modal & Detail Views',
      'Technical Skills & Tools Matrix with Visual Badges',
      'Client Testimonials & Industry Recognition Section',
      'Interactive Contact & Consultation Booking Form',
      'Social & Developer Profiles (GitHub, LinkedIn, Dribbble, X)',
      'Fluid Micro-Interactions and Subtle Page Entrance Animations',
      'Instant Live Cloud Deployment on Custom Domain'
    ],
    pagesIncluded: [
      'Homepage (Editorial hero, featured projects reel, core focus)',
      'About / Experience Section (Career timeline, bio, working philosophy)',
      'Projects Portfolio (Categorized grid with instant filters)',
      'Case Study Deep-Dive View (Problem, process, results, live demo link)',
      'Skills & Technologies Matrix (Categorized technical toolkit)',
      'Contact & Inquiries Section (Direct message form and socials)'
    ],
    pageBreakdown: [
      {
        title: 'Editorial Hero & Bio',
        purpose: 'Create an unforgettable first impression, highlight your specialty, and provide immediate call-to-actions.',
        keySections: ['Dynamic Headline', 'Personal / Brand Bio', 'Primary Action Buttons', 'Quick Social Dock']
      },
      {
        title: 'Interactive Project Showcase',
        purpose: 'Present your finest projects with rich thumbnails, tech tags, quick view previews, and live demo links.',
        keySections: ['Category Filter Tabs', 'Project Cards with Hover Previews', 'Case Study Deep-Dive Modal', 'Metrics & Outcome Badges']
      },
      {
        title: 'Skills & Toolkit Matrix',
        purpose: 'Demonstrate your capabilities clearly to prospective clients, employers, and collaborators.',
        keySections: ['Core Tech Stack', 'Design & Prototyping Tools', 'Methodologies & Frameworks', 'Experience Level Tags']
      },
      {
        title: 'Direct Contact & Inquiries',
        purpose: 'Make it effortless for prospective clients or recruiters to initiate a conversation or hire you.',
        keySections: ['Inquiry Form', 'Direct Email Copy Button', 'Calendar Booking Link', 'Availability Status Pill']
      }
    ],
    technicalFeatures: [
      {
        title: 'Subtle Scroll-Triggered Animations',
        description: 'Smooth stagger fades and micro-interactions powered by hardware-accelerated CSS and Motion.',
        category: 'Design & UX'
      },
      {
        title: 'High-DPI Image Optimization',
        description: 'Retina-ready visual asset compression preserving crispness without sacrificing page load speeds.',
        category: 'Performance & SEO'
      },
      {
        title: 'Social Share Card Previews',
        description: 'Custom OpenGraph cards for LinkedIn, Twitter/X, and WhatsApp that preview your portfolio beautifully.',
        category: 'Performance & SEO'
      },
      {
        title: 'Interactive Case Study Overlays',
        description: 'Non-blocking modal dialogs with smooth back-navigation and keyboard accessibility.',
        category: 'Conversion & Forms'
      },
      {
        title: 'Live Demo & Code Repository Links',
        description: 'Distinct badges directing viewers to live URL previews, GitHub repositories, or Figma design files.',
        category: 'Conversion & Forms'
      },
      {
        title: 'Lightweight Zero-Lag Code',
        description: 'Pure modern React architecture with tree-shaken components for instantaneous page loads.',
        category: 'Engineering & Security'
      }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Curation & Plan',
        description: 'Select best projects, branding & layout hierarchy.',
        deliverables: ['Asset Selection', 'Style Palette']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'Visual Design',
        description: 'Editorial layouts with clean typography.',
        deliverables: ['UI Layouts', 'Hover Effects']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Frontend Build',
        description: 'Fast filtering, modal viewer & animations.',
        deliverables: ['Filter System', 'Modal Views']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Speed & Launch',
        description: 'Lighthouse 98+ score, SEO tags & domain live.',
        deliverables: ['Speed 98+', 'Live Domain']
      }
    ],
    keyFeatures: [
      'Visual Editorial Layout with High-Contrast Typography',
      'Dynamic Project Filter Engine by Category / Tech',
      'Detailed Case Study Modal Viewer with Live Links',
      'One-Click Resume / CV Download Integration',
      'Hardware-Accelerated Smooth Entrance Animations',
      'Lighthouse 98+ Ultra-Fast Load Performance',
      'Custom OpenGraph Meta for Social Sharing',
      'Accessible Keyboard Navigation & Screen-Reader Friendly',
      'Free SSL and Custom Domain Deployment'
    ],
    techStack: ['Custom Code', 'Shopify Portfolio', 'WordPress & WooCommerce', 'Three.js & 3D', 'TypeScript', 'Tailwind CSS'],
    recommendedAddOns: ['Interactive 3D Element / Canvas', 'Blog / Articles Section', 'Interactive Dark/Light Mode', 'Client Video Testimonials'],
    designAndResponsive: 'Editorial visual hierarchy with generous white space and fluid responsiveness across all screens.',
    bestFor: 'Developers, UI/UX designers, freelance creatives, photographers, architects, agency founders, and consultants.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'landing-pages',
    name: 'Landing Pages',
    tagline: 'Focused, high-converting single-page experience engineered to present an offer and drive action.',
    badge: 'Conversion & Campaign Focused',
    categoryPill: 'High-Impact Single Page',
    whatIsIt: 'Laser-focused single-page websites engineered to present a specific offer, software product, coaching service, or promotional campaign with zero distractions and a singular, irresistible call-to-action.',
    whatClientGets: [
      'Conversion-Optimized Hero Section with Strong CTA',
      'Problem vs. Solution Value Framework',
      'Product / Service Feature Breakdown with Visual Previews',
      'Social Proof, Review Badges & Testimonial Carousel',
      'Interactive Offer / Tier Comparison Table',
      'Collapsible Frequently Asked Questions (FAQ) Accordion',
      'Sticky Floating Action Button for Mobile Users',
      'High-Conversion Lead Capture Form with Instant Notification',
      'Analytics, Google Tag Manager & Meta Pixel Tracking Hooks'
    ],
    pagesIncluded: [
      'Conversion Hero Section (Attention-grabbing hook, sub-hook, primary CTA)',
      'Value Proposition & Problem Agitation (Why conventional solutions fail)',
      'Core Features & Benefits (Key features paired with tangible outcomes)',
      'Social Proof & Case Evidence (Real client results, badges, testimonials)',
      'Pricing / Offer Architecture (Clear packages with risk-reversal guarantees)',
      'FAQ Accordion (Overcoming objections cleanly in place)',
      'Final Urgency CTA & Lead Form (Closing inquiry capture)'
    ],
    pageBreakdown: [
      {
        title: 'Hero & Primary CTA',
        purpose: 'Capture attention within 3 seconds, articulate value proposition, and provide direct action trigger.',
        keySections: ['Headline & Subheading', 'Hero Media Mockup', 'Primary CTA Button', 'Trust Proof Pill']
      },
      {
        title: 'Features & Benefits Breakdown',
        purpose: 'Translate features into concrete business benefits that resonate with prospective buyers.',
        keySections: ['Benefit Blocks with Icons', 'Visual UI Mockups', 'Feature Comparison Grid', 'Bullet Points']
      },
      {
        title: 'Social Proof & Trust Building',
        purpose: 'Eliminate hesitation by showcasing real client testimonials, metrics, and recognizable logos.',
        keySections: ['Testimonial Quotes', 'Outcome Metrics', 'Security & Guarantee Badges', 'Client Avatars']
      },
      {
        title: 'Lead Capture & FAQ',
        purpose: 'Remove lingering objections and provide an effortless form or checkout trigger.',
        keySections: ['FAQ Accordion', 'Simplified Form Fields', 'Privacy Reassurance', 'Instant Response Notice']
      }
    ],
    technicalFeatures: [
      {
        title: 'Sub-1-Second Page Load Speed',
        description: 'Optimized critical CSS, deferred scripts, and asset preloading ensuring zero bounce from slow load times.',
        category: 'Performance & SEO'
      },
      {
        title: 'Sticky Mobile Navigation Bar',
        description: 'Persistent bottom CTA banner on mobile screens guaranteeing effortless conversion at every scroll depth.',
        category: 'Conversion & Forms'
      },
      {
        title: 'Anti-Spam Streamlined Form',
        description: 'Minimal friction form fields designed for high completion rates without tedious multi-step hurdles.',
        category: 'Conversion & Forms'
      },
      {
        title: 'Pixel & Event Tracking Ready',
        description: 'Clean dataLayer hooks for Google Analytics 4, Meta Pixel, and LinkedIn Insight Tag conversion tracking.',
        category: 'Performance & SEO'
      },
      {
        title: 'A/B Test-Friendly Architecture',
        description: 'Modular section components structured to allow seamless headline, CTA, and offer testing.',
        category: 'Engineering & Security'
      },
      {
        title: 'Cross-Device Touch Optimization',
        description: '48px minimum touch targets and clear active states calibrated for seamless smartphone use.',
        category: 'Design & UX'
      }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Strategy & Copy',
        description: 'Value proposition, headline hooks & CTA plan.',
        deliverables: ['Copy Outline', 'CTA Plan']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'High-Impact UI',
        description: 'Conversion-focused visual design for mobile & web.',
        deliverables: ['UI Layouts', 'Mobile Flow']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Rapid Build',
        description: 'Fast responsive code, form webhooks & analytics.',
        deliverables: ['Clean Code', 'Webhooks']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Speed & Launch',
        description: 'Sub-second speed tuning, form test & go-live.',
        deliverables: ['Speed 99+', 'Live Campaign']
      }
    ],
    keyFeatures: [
      'Distraction-Free Conversion-Driven Layout',
      'Sticky Mobile Navigation CTA for Max Leads',
      'Fast Load Time (Sub-Second Target for Ad Campaigns)',
      'Interactive FAQ Accordion with Micro-Transitions',
      'Social Proof Badges & Testimonial Carousel',
      'Google Analytics 4 & Meta Pixel Tracking Ready',
      'Instant Email & WhatsApp Lead Notification',
      'Clean Semantic HTML5 for Organic Keyword Visibility',
      'Free SSL and Custom Domain Deployment'
    ],
    techStack: ['Custom Code', 'Shopify Landing Funnel', 'WordPress & WooCommerce', 'Next.js & Vite', 'Tailwind CSS', 'Conversion Analytics'],
    recommendedAddOns: ['Countdown Timer Banner', 'A/B Split Test Setup', 'Stripe / Card Payment Button', 'Interactive Pricing Calculator'],
    designAndResponsive: 'Distraction-free, conversion-focused layout with mobile-first responsiveness and legible typography.',
    bestFor: 'Products, SaaS software, coaching programs, paid ad campaigns, product launches, and single-offer businesses.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'corporate-websites',
    name: 'Corporate Websites',
    tagline: 'Authoritative, enterprise-ready digital presence built for organizations and established companies.',
    badge: 'Enterprise & Organization Standard',
    categoryPill: 'Multi-Department Corporate Portal',
    whatIsIt: 'Comprehensive, structured digital platforms for corporate organizations, institutions, and growing companies that require an authoritative identity, multi-department navigation, career portals, and investor-grade polish.',
    whatClientGets: [
      'Comprehensive Corporate Homepage with Executive Value Messaging',
      'About the Organization, Mission, Vision & ESG / Governance',
      'Multi-Tiered Practice Areas / Business Divisions Architecture',
      'Executive Leadership Team & Board Member Profiles',
      'Corporate Case Studies & Project Milestones Section',
      'Interactive Career Opportunities & Job Listings Module',
      'Investor / Media Center with Downloadable PDF Assets',
      'Corporate Inquiries Routing with Departmental Filtering',
      'Enterprise-Grade Accessibility (WCAG 2.1 AA Compliant)'
    ],
    pagesIncluded: [
      'Corporate Homepage (Global presence overview, core divisions, news banner)',
      'About Company & Governance (History, values, corporate leadership)',
      'Business Divisions / Solutions (Detailed breakdown of enterprise capabilities)',
      'Projects & Enterprise Case Studies (Large-scale client engagements)',
      'Careers & Culture (Open positions, workplace values, talent recruitment)',
      'News & Insights / Blog (Press releases, thought leadership, media kit)',
      'Contact & Regional Offices (Multi-location office directory and inquiry routing)'
    ],
    pageBreakdown: [
      {
        title: 'Corporate Homepage',
        purpose: 'Establish global authority, present the company scale, and guide various stakeholder groups seamlessly.',
        keySections: ['Executive Hero Banner', 'Global Division Cards', 'Key Operational Metrics', 'Press Highlights']
      },
      {
        title: 'Company & Governance',
        purpose: 'Communicate the enterprise heritage, operational principles, leadership team, and corporate accountability.',
        keySections: ['Corporate Mission', 'Leadership Bios', 'Board of Directors', 'ESG Commitments']
      },
      {
        title: 'Enterprise Solutions & Services',
        purpose: 'Outline comprehensive B2B service capabilities, industry specializations, and engagement models.',
        keySections: ['Practice Area Directory', 'Industry Verticals', 'Methodology Overview', 'RFP / Consultation CTA']
      },
      {
        title: 'Careers & Talent Acquisition',
        purpose: 'Attract top-tier talent with authentic company culture presentations and clear open vacancy listings.',
        keySections: ['Culture & Benefits', 'Open Vacancies List', 'Candidate Application Trigger', 'Employee Spotlights']
      }
    ],
    technicalFeatures: [
      {
        title: 'Enterprise Typography & Design System',
        description: 'Strict typographic hierarchy, mathematical spacing ratios, and consistent design language across all pages.',
        category: 'Design & UX'
      },
      {
        title: 'WCAG 2.1 AA Accessibility Standards',
        description: 'Comprehensive keyboard navigability, high-contrast ratios, and screen-reader descriptive ARIA attributes.',
        category: 'Design & UX'
      },
      {
        title: 'Departmental Form Routing',
        description: 'Smart inquiry dispatch routing leads automatically to Business Development, Media, or Human Resources.',
        category: 'Conversion & Forms'
      },
      {
        title: 'Global Edge Caching & CDN Delivery',
        description: 'Sub-second response times for international enterprise stakeholders across North America, Europe, and Asia.',
        category: 'Performance & SEO'
      },
      {
        title: 'Structured Organization Schema',
        description: 'Rich Google Knowledge Graph schemas for corporate entities, headquarters, and key executives.',
        category: 'Performance & SEO'
      },
      {
        title: 'Strict Security Headers & CSP',
        description: 'Content Security Policy (CSP), X-Frame-Options, and secure transmission protocols safeguarding brand reputation.',
        category: 'Engineering & Security'
      }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Architecture & Audit',
        description: 'Executive goals, department sitemap & brand standards.',
        deliverables: ['Sitemap Spec', 'Brand Audit']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'Design System',
        description: 'Enterprise Figma components & responsive templates.',
        deliverables: ['Component Kit', 'UI Screens']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Full-Stack Code',
        description: 'Modular TypeScript build, department routing & forms.',
        deliverables: ['Modular Code', 'Secure Routing']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Security & Launch',
        description: 'Accessibility check, security headers & cloud deploy.',
        deliverables: ['Security Audit', 'Cloud Launch']
      }
    ],
    keyFeatures: [
      'Authoritative Corporate Visual Identity & Design System',
      'Multi-Tiered Navigation Hierarchy with Dropdowns',
      'Executive Leadership Profiles with Modals',
      'Interactive Careers & Job Openings Directory',
      'Departmental Inquiry Routing (Sales, Press, HR)',
      'WCAG 2.1 AA Accessibility Compliance Guaranteed',
      'Enterprise Structured Data (Organization Schema.org)',
      'Global Edge CDN Performance & SSL Encryption',
      'Production Handover with Clean Documentation'
    ],
    techStack: ['Custom Code', 'Shopify Plus / B2B', 'WordPress & WooCommerce', 'TypeScript', 'PostgreSQL / MySQL', 'Edge CDN'],
    recommendedAddOns: ['Headless CMS Integration', 'Multi-Lingual Localization', 'Interactive Annual Report', 'Investor Relations Feed'],
    designAndResponsive: 'Authoritative, refined corporate design system with responsive layouts across phones, tablets, and desktop.',
    bestFor: 'Corporations, established companies, agencies, institutions, financial firms, and multi-location businesses.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'custom-websites',
    name: 'Custom Websites',
    tagline: 'Bespoke web applications and digital platforms engineered around your exact workflows and business logic.',
    badge: '100% Bespoke Architecture',
    categoryPill: 'Custom Engineering & Web Apps',
    whatIsIt: 'Full-custom web applications and digital platforms engineered from the ground up for businesses with unique operational workflows, proprietary calculation engines, user portals, database integration, or specialized API requirements.',
    whatClientGets: [
      '100% Bespoke UI/UX Design Tailored to Your Specific Brand',
      'Custom Operational Architecture Built Around Your Business Logic',
      'Authentication & Role-Based Access Control (Admin / User / Staff)',
      'Interactive Custom Calculators, Quotation Tools or Dashboards',
      'Third-Party API Integrations (Stripe, Twilio, OpenAI, CRMs)',
      'Cloud Database Integration (PostgreSQL, Firebase, or Supabase)',
      'Custom Data Export & Reporting Capabilities (CSV, PDF generation)',
      'Comprehensive Automated Testing & Edge Cloud Deployment',
      'Source Code Ownership with Clear Architectural Documentation'
    ],
    pagesIncluded: [
      'Custom Application Workspace (Tailored dashboard & real-time interface)',
      'Authentication & Onboarding (Secure sign-in, registration, password reset)',
      'Data Management & Records (Searchable, filterable records view)',
      'Configuration & User Profile (Role management, preferences, notifications)',
      'Public Marketing Pages (Custom landing views explaining your software)'
    ],
    pageBreakdown: [
      {
        title: 'Custom User Workspace / Dashboard',
        purpose: 'Deliver an intuitive, real-time command center for your users to execute operations effortlessly.',
        keySections: ['Real-Time Status Cards', 'Interactive Data Visualizations', 'Action Toolbar', 'Recent Activity Feed']
      },
      {
        title: 'Specialized Business Logic Engine',
        purpose: 'Automate calculations, scheduling algorithms, quoting engines, or workflows unique to your business.',
        keySections: ['Multi-Step Configurator', 'Instant Price / Output Calculation', 'Input Validation', 'State Persistence']
      },
      {
        title: 'Account & Access Management',
        purpose: 'Safeguard sensitive data with enterprise-grade authentication and user permission tiers.',
        keySections: ['User Profiles', 'Role-Based Permissions (RBAC)', 'Session Security', 'Audit Logs']
      },
      {
        title: 'Integrations & External APIs',
        purpose: 'Connect seamlessly to payment gateways, messaging tools, databases, or CRM platforms.',
        keySections: ['Payment Gateway (Stripe / Cards / Bank)', 'Webhook Handlers', 'Third-Party Sync', 'Automated Email Triggers']
      }
    ],
    technicalFeatures: [
      {
        title: 'Modular Full-Stack Architecture',
        description: 'Clean separation of concerns with TypeScript, modular hooks, state managers, and scalable API layers.',
        category: 'Engineering & Security'
      },
      {
        title: 'Real-Time State & Optimistic UI',
        description: 'Instant UI updates with background synchronization, providing a native desktop-speed app feel.',
        category: 'Design & UX'
      },
      {
        title: 'Role-Based Access Control (RBAC)',
        description: 'Granular permissions ensuring sensitive administrative capabilities are strictly isolated.',
        category: 'Engineering & Security'
      },
      {
        title: 'Third-Party API & Webhook Integration',
        description: 'Secure server-side proxying for payment processors, AI models, transactional emails, and CRMs.',
        category: 'Conversion & Forms'
      },
      {
        title: 'Database Schema Optimization',
        description: 'Indexed relational or document database models engineered for high query speeds and zero data loss.',
        category: 'Engineering & Security'
      },
      {
        title: 'Comprehensive Error Boundaries',
        description: 'Graceful error handling, auto-retry mechanisms, and user-friendly fallback interfaces.',
        category: 'Performance & SEO'
      }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Technical Scope',
        description: 'Map user journeys, data schemas & API blueprints.',
        deliverables: ['Tech Spec', 'Data Schema']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'App UX Prototype',
        description: 'Interactive dashboard states, wireframes & flows.',
        deliverables: ['UX Wireframes', 'Interactive UI']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Custom Engineering',
        description: 'Backend APIs, database models & custom business logic.',
        deliverables: ['API & Database', 'Custom Logic']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Stress Test & Launch',
        description: 'End-to-end testing, security hardening & cloud live.',
        deliverables: ['Test Suite', 'Cloud Deploy']
      }
    ],
    keyFeatures: [
      '100% Bespoke UI/UX Design Tailored to Your Specific Brand',
      'Custom Operational Architecture Built Around Your Business Logic',
      'Authentication & Role-Based Access Control (RBAC)',
      'Custom Pricing Calculators, Estimators or Web Portals',
      'Third-Party API Integrations (Stripe, AI, CRMs, Webhooks)',
      'Cloud Database Integration (PostgreSQL, Supabase or Firebase)',
      'High-Speed Edge Cloud Deployment with Zero Downtime',
      'Responsive Fluid Layout across Mobile, Tablet, and Desktop',
      'Complete Codebase Ownership & Architecture Documentation'
    ],
    techStack: ['Custom Code (React / Next.js)', 'Shopify Custom Stores', 'WordPress & WooCommerce Headless', 'TypeScript', 'Node.js & Express', 'PostgreSQL / Firestore'],
    recommendedAddOns: ['Automated PDF / Invoice Generation', 'Real-Time WebSocket Sync', 'Stripe Billing & Subscriptions', 'Custom Analytics Dashboard'],
    designAndResponsive: '100% custom UI/UX design tailored specifically for your brand and fully responsive across all screens.',
    bestFor: 'Businesses needing specialized functionality, client portals, quoting engines, or custom workflows beyond a template.',
    estimatedDelivery: 'Decided Upon Discussion',
    isCustom: true,
    heroImage: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'website-redesign',
    name: 'Website Redesign & Revamp',
    tagline: 'Transform slow, outdated websites into modern, high-converting digital flagships with zero downtime and protected SEO.',
    badge: 'High-ROI Modernization',
    categoryPill: 'UI/UX Overhaul & Speed Revamp',
    whatIsIt: 'A complete architectural and visual modernization service for businesses whose existing websites look outdated, load slowly, or fail to convert visitors. We redesign the entire user experience from scratch, rebuild with clean modern code, migrate all existing content without losing search engine rankings, and optimize for blazing-fast mobile conversions.',
    whatClientGets: [
      'Complete Modern UI/UX Redesign (Clean, trustworthy aesthetic)',
      'Mobile-First Responsive Layout Overhaul',
      'Full Codebase Migration to Modern Framework (React/Next.js/Modern Stack)',
      'Core Web Vitals & Speed Optimization (Sub-1s loading)',
      '100% SEO Preservation (URL structure & 301 redirect mapping)',
      'Modern Lead Capture, Forms & WhatsApp Click-to-Chat',
      'Interactive Micro-Animations & Sleek Transitions',
      'Zero-Downtime Safe Cutover & SSL Deployment',
      'Full Intellectual Property Ownership & GitHub Repo Transfer'
    ],
    pagesIncluded: [
      'Redesigned Home Page (High-impact hero, modern value flow & prominent inquiry trigger)',
      'Modernized About / Story Page (Clear leadership credentials, brand milestones & trust pillars)',
      'Refined Services / Solutions Page (Modular deliverable cards & clear value packages)',
      'High-Conversion Contact & Inquiry Page (Fast-loading lead form, maps & WhatsApp link)',
      'Legacy Content & Blog Archive (Formatted typography, clean categories & image optimization)'
    ],
    pageBreakdown: [
      {
        title: 'Modernized Home Experience',
        purpose: 'Replace clutter with a clear, high-authority hero section, crisp typography, and strategic calls to action that double conversion rates.',
        keySections: ['High-Impact Hero', 'Revamped Value Proposition', 'Social Proof & Client Badges', 'Lead Capture Call to Action']
      },
      {
        title: 'Modernized About & Trust Architecture',
        purpose: 'Establish superior brand credibility with executive team presentation, certifications, and company heritage.',
        keySections: ['Company Heritage Story', 'Leadership & Team Credentials', 'Core Values & Accreditations', 'Trust Milestones']
      },
      {
        title: 'Streamlined Services & Offerings',
        purpose: 'Restructure service presentation so prospective clients immediately understand your scopes, pricing, and outcomes.',
        keySections: ['Modular Service Cards', 'Scope Deliverables Breakdown', 'Workflow Timeline', 'Project Estimate Trigger']
      },
      {
        title: 'High-Converting Contact System',
        purpose: 'Remove friction from inquiries with lightning-fast inputs, WhatsApp integration, and direct lead notifications.',
        keySections: ['Low-Friction Lead Form', 'WhatsApp Direct Trigger', 'Location & Business Hours', 'Response Guarantee']
      },
      {
        title: 'Content & Blog Archive Migration',
        purpose: 'Modernize legacy articles, case studies, or resources with fluid typography, responsive media, and 100% link integrity.',
        keySections: ['Clean Grid Archive', 'Optimized Article Reading UI', 'Related Case Studies', 'Social Share & Inquiry CTA']
      }
    ],
    technicalFeatures: [
      {
        title: 'Legacy Codebase to Modern Stack Migration',
        description: 'Replace heavy page-builders (Elementor, bloated themes) with lightweight React/Next.js/modern semantic architecture.',
        category: 'Design & UX'
      },
      {
        title: 'SEO & Ranking Preservation',
        description: 'Meticulous URL slug mapping, meta tag preservation, and 301 redirects ensuring zero drop in Google search rankings.',
        category: 'Performance & SEO'
      },
      {
        title: 'Sub-1s Core Web Vitals Overhaul',
        description: 'Compressing heavy assets, eliminating render-blocking scripts, and achieving 95+ Google Lighthouse scores.',
        category: 'Performance & SEO'
      },
      {
        title: 'Responsive & Touch-First Calibrations',
        description: 'Full redesign calibrated for seamless touch navigation across modern iPhone, iPad, and Android screens.',
        category: 'Design & UX'
      },
      {
        title: 'Lead Conversion Friction Reduction',
        description: 'Optimized form fields, prominent WhatsApp buttons, and clear sticky triggers to maximize visitor inquiries.',
        category: 'Conversion & Forms'
      },
      {
        title: 'Zero Downtime Staging & Safe Cutover',
        description: 'We develop on a private staging link; your active website remains 100% online until you approve the final launch.',
        category: 'Engineering & Deployment'
      }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Site Audit & UX Benchmark',
        description: 'Analyze current site bottlenecks, SEO rankings & conversion leaks.',
        deliverables: ['Audit Report', 'Redesign Blueprint']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'Modern UI/UX Concept',
        description: 'Craft high-converting desktop & mobile interface wireframes.',
        deliverables: ['Figma UI Concept', 'Typography System']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Re-Engineering & Migration',
        description: 'Clean coding, asset compression, content porting & form setup.',
        deliverables: ['Staging Prototype', 'SEO Mapping']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Zero-Downtime Launch',
        description: 'Cross-browser QA, Core Web Vitals verification & live cutover.',
        deliverables: ['Live Deployment', 'SSL & DNS Setup']
      }
    ],
    keyFeatures: [
      'Complete Modern UI/UX Design Tailored to Current Industry Standards',
      'Migration of All Existing Content, Images, and Articles without Data Loss',
      '100% Google SEO Ranking Preservation with 301 Redirect Mapping',
      'Dramatic Speed Improvement (Lighthouse 95+ & Sub-Second Page Load)',
      'WhatsApp Business Direct Chat Integration',
      'Zero-Downtime Development on Private Staging Server',
      'Fluid Micro-Animations and Modern Glassmorphism Styling',
      'Mobile, Tablet, and 4K Display Calibrations',
      'Full Codebase Ownership & Transparent Milestone Delivery'
    ],
    techStack: ['Custom Code', 'Shopify Revamp & Migration', 'WordPress & WooCommerce Overhaul', 'Next.js & React', 'Tailwind CSS', 'SEO 301 Redirects'],
    recommendedAddOns: ['Speed & CDN Turbo Cache', 'Google Analytics 4 & Conversion Tracking', 'Interactive Product/Quote Calculator', 'CMS Content Management System'],
    designAndResponsive: 'Sleek, modern UI/UX overhaul built from scratch to replace outdated styling, fully responsive across all viewports.',
    bestFor: 'Companies and brands with an outdated, slow, or low-converting website who want an executive modernization without losing traffic or ranking.',
    estimatedDelivery: 'Decided Upon Discussion',
    isCustom: false,
    heroImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
  }
];

