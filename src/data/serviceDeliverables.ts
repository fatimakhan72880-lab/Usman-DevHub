export interface ServiceDeliverableItem {
  id: string;
  title: string;
  description: string;
  format: string;
  tag: 'Core Asset' | 'Engineering' | 'Design & UX' | 'Performance' | 'Infrastructure' | 'Security' | 'Support & SLA';
  iconType: 'code' | 'layout' | 'zap' | 'shield' | 'check' | 'box' | 'film' | 'database' | 'globe';
}

export interface ServiceSubcategoryDetail {
  summary: string;
  whatIsIt?: string;
  whatClientGets?: string[];
  pagesIncluded?: string[];
  keyFeatures?: string[];
  designAndResponsive?: string;
  animationsInteractions?: string;
  formsAndIntegrations?: string[];
  deploymentSetup?: string;
  keyDeliverables: string[];
  idealFor: string;
  estimatedDelivery?: string;
}

export interface ServicePackageDetails {
  serviceId: string;
  serviceTitle: string;
  headline: string;
  subheadline: string;
  guarantees: {
    title: string;
    description: string;
    badge: string;
  }[];
  deliverables: ServiceDeliverableItem[];
  subcategoryDetails: Record<string, ServiceSubcategoryDetail>;
}

export const SERVICE_DELIVERABLES_DATA: Record<string, ServicePackageDetails> = {
  'srv-1': {
    serviceId: 'srv-1',
    serviceTitle: 'Web Development',
    headline: 'Web Development Services & Website Types',
    subheadline: 'Professional, responsive and modern websites built around your business goals.',
    guarantees: [],
    deliverables: [
      {
        id: 'deliv-web-1',
        title: 'Custom UI Design',
        description: 'Bespoke website design aligned with your brand identity and business objectives.',
        format: 'Custom Component Architecture',
        tag: 'Design & UX',
        iconType: 'layout'
      },
      {
        id: 'deliv-web-2',
        title: 'Responsive Mobile Design',
        description: 'Optimized layouts tailored for smartphones, tablets, and desktop displays.',
        format: 'Fluid Responsive Styling',
        tag: 'Design & UX',
        iconType: 'layout'
      },
      {
        id: 'deliv-web-3',
        title: 'Multiple Website Pages',
        description: 'Structured pages designed to clearly communicate your services, company story, and offerings.',
        format: 'Structured Web Pages',
        tag: 'Core Asset',
        iconType: 'globe'
      },
      {
        id: 'deliv-web-4',
        title: 'Contact Forms',
        description: 'Lead capture and client inquiry forms configured for seamless communication.',
        format: 'Interactive Form Modules',
        tag: 'Engineering',
        iconType: 'check'
      },
      {
        id: 'deliv-web-5',
        title: 'WhatsApp Integration',
        description: 'Direct WhatsApp chat triggers enabling instant messaging with prospective clients.',
        format: 'Direct Chat Action',
        tag: 'Engineering',
        iconType: 'zap'
      },
      {
        id: 'deliv-web-6',
        title: 'Smooth Website Animations',
        description: 'Subtle transitions and micro-interactions that enhance visitor engagement.',
        format: 'Motion & Interactive Styling',
        tag: 'Design & UX',
        iconType: 'zap'
      },
      {
        id: 'deliv-web-7',
        title: 'Interactive UI Elements',
        description: 'Accordions, tab navigation, modals, and sliders designed for intuitive user experience.',
        format: 'Interactive Components',
        tag: 'Engineering',
        iconType: 'code'
      },
      {
        id: 'deliv-web-8',
        title: 'Speed Optimization',
        description: 'Modern asset compression, fast loading structures, and clean code optimization.',
        format: 'Optimized Build',
        tag: 'Performance',
        iconType: 'zap'
      },
      {
        id: 'deliv-web-9',
        title: 'Deployment Setup',
        description: 'Domain configuration, SSL certificate activation, and production cloud launch.',
        format: 'Live Web Launch',
        tag: 'Infrastructure',
        iconType: 'globe'
      }
    ],
    subcategoryDetails: {
      'Business Websites': {
        summary: 'Professional websites for businesses that need a strong and modern online presence.',
        whatIsIt: 'Professional websites for businesses that need a strong and modern online presence.',
        whatClientGets: [
          'Home Page',
          'About Page',
          'Services Page',
          'Contact Page',
          'Contact Form',
          'WhatsApp Integration',
          'Responsive Mobile Design',
          'Smooth Animations',
          'Deployment Setup'
        ],
        pagesIncluded: [
          'Home Page',
          'About Page',
          'Services Page',
          'Contact Page'
        ],
        keyFeatures: [
          'Home Page',
          'About Page',
          'Services Page',
          'Contact Page',
          'Contact Form',
          'WhatsApp Integration',
          'Responsive Mobile Design',
          'Smooth Animations',
          'Deployment Setup'
        ],
        designAndResponsive: 'Modern UI/UX with full responsive design optimized for mobile, tablet, and desktop.',
        animationsInteractions: 'Smooth animations including fluid scrolling, hover effects, and subtle entrance transitions.',
        formsAndIntegrations: [
          'Contact Form',
          'WhatsApp Integration'
        ],
        deploymentSetup: 'Domain connection, hosting setup, SSL activation, and live website deployment.',
        keyDeliverables: [
          'Home Page',
          'About Page',
          'Services Page',
          'Contact Page',
          'Contact Form',
          'WhatsApp Integration',
          'Responsive Mobile Design',
          'Smooth Animations',
          'Deployment Setup'
        ],
        idealFor: 'Small businesses, local businesses, service providers and startups.',
        estimatedDelivery: 'Decided Upon Discussion'
      },
      'Portfolio Websites': {
        summary: 'Visual, modern websites created to showcase creative work, professional skills, and verified projects.',
        whatIsIt: 'Custom portfolio websites crafted to highlight your work, skills, and projects with high visual impact.',
        whatClientGets: [
          'Homepage',
          'About Section',
          'Skills / Expertise',
          'Projects / Portfolio Showcase',
          'Project Details',
          'Contact Section / Form',
          'Social Links',
          'Responsive Design',
          'Smooth Animations'
        ],
        pagesIncluded: [
          'Homepage',
          'About Section',
          'Skills / Expertise',
          'Projects / Portfolio Showcase',
          'Project Details',
          'Contact Section / Form'
        ],
        keyFeatures: [
          'Homepage',
          'About Section',
          'Skills / Expertise',
          'Projects / Portfolio Showcase',
          'Project Details',
          'Contact Section / Form',
          'Social Links',
          'Responsive Design',
          'Smooth Animations'
        ],
        designAndResponsive: 'Editorial, creative layout with clean visual hierarchy and fluid responsiveness across all screens.',
        animationsInteractions: 'Smooth animations, project hover transitions, and engaging interactive portfolio navigation.',
        formsAndIntegrations: [
          'Contact Section / Form',
          'Social Links'
        ],
        deploymentSetup: 'Domain connection, hosting setup, SSL activation, and live website deployment.',
        keyDeliverables: [
          'Homepage',
          'About Section',
          'Skills / Expertise',
          'Projects / Portfolio Showcase',
          'Project Details',
          'Contact Section / Form',
          'Social Links',
          'Responsive Design',
          'Smooth Animations'
        ],
        idealFor: 'Developers, designers, freelancers, creatives, professionals and personal brands.',
        estimatedDelivery: 'Decided Upon Discussion'
      },
      'Landing Pages': {
        summary: 'Focused single-page websites engineered to present an offer, product, or campaign with a clear call-to-action.',
        whatIsIt: 'Focused single-page websites engineered to present an offer, product, or campaign with a clear call-to-action.',
        whatClientGets: [
          'Hero Section',
          'Clear Call-to-Action',
          'Product / Service Showcase',
          'Features / Benefits',
          'Testimonials',
          'FAQ',
          'Contact / Lead Form',
          'Responsive Design',
          'Smooth Animations'
        ],
        pagesIncluded: [
          'Hero Section',
          'Product / Service Showcase',
          'Features / Benefits',
          'Testimonials',
          'FAQ',
          'Contact / Lead Form'
        ],
        keyFeatures: [
          'Hero Section',
          'Clear Call-to-Action',
          'Product / Service Showcase',
          'Features / Benefits',
          'Testimonials',
          'FAQ',
          'Contact / Lead Form',
          'Responsive Design',
          'Smooth Animations'
        ],
        designAndResponsive: 'Clean, distraction-free visual layout with mobile-first responsiveness and high legibility.',
        animationsInteractions: 'Smooth animations, call-to-action micro-interactions, and responsive FAQ accordions.',
        formsAndIntegrations: [
          'Contact / Lead Form'
        ],
        deploymentSetup: 'Fast edge hosting setup, SSL configuration, domain connection, and launch.',
        keyDeliverables: [
          'Hero Section',
          'Clear Call-to-Action',
          'Product / Service Showcase',
          'Features / Benefits',
          'Testimonials',
          'FAQ',
          'Contact / Lead Form',
          'Responsive Design',
          'Smooth Animations'
        ],
        idealFor: 'Products, services, campaigns, startups and businesses that need a focused landing page.',
        estimatedDelivery: 'Decided Upon Discussion'
      },
      'Corporate Websites': {
        summary: 'Comprehensive, structured websites for organizations and companies that need an authoritative and professional corporate presence.',
        whatIsIt: 'Comprehensive, structured websites for organizations and companies that need an authoritative and professional corporate presence.',
        whatClientGets: [
          'Professional Homepage',
          'About Company',
          'Services',
          'Team Section',
          'Projects / Case Studies',
          'Contact Page',
          'Inquiry / Contact Forms',
          'Responsive Design',
          'Professional UI/UX'
        ],
        pagesIncluded: [
          'Professional Homepage',
          'About Company',
          'Services',
          'Team Section',
          'Projects / Case Studies',
          'Contact Page'
        ],
        keyFeatures: [
          'Professional Homepage',
          'About Company',
          'Services',
          'Team Section',
          'Projects / Case Studies',
          'Contact Page',
          'Inquiry / Contact Forms',
          'Responsive Design',
          'Professional UI/UX'
        ],
        designAndResponsive: 'Authoritative, clean corporate design system with responsive layouts across phones, tablets, and desktop.',
        animationsInteractions: 'Refined, subtle transitions and clean interactive elements for a professional corporate feel.',
        formsAndIntegrations: [
          'Inquiry / Contact Forms'
        ],
        deploymentSetup: 'Enterprise-ready hosting configuration, SSL setup, custom domain mapping, and deployment.',
        keyDeliverables: [
          'Professional Homepage',
          'About Company',
          'Services',
          'Team Section',
          'Projects / Case Studies',
          'Contact Page',
          'Inquiry / Contact Forms',
          'Responsive Design',
          'Professional UI/UX'
        ],
        idealFor: 'Companies, agencies, organizations and professional businesses.',
        estimatedDelivery: 'Decided Upon Discussion'
      },
      'Custom Websites': {
        summary: 'A website built according to the client\'s specific business requirements, workflows and functionality.',
        whatIsIt: 'A website built according to the client\'s specific business requirements, workflows and functionality.',
        whatClientGets: [
          'Custom Pages',
          'Custom Features',
          'Custom Workflows',
          'Custom Forms',
          'API Integrations',
          'Database Integration',
          'Custom UI/UX',
          'Specialized Functionality',
          'Deployment Setup'
        ],
        pagesIncluded: [
          'Custom Pages (tailored to your project scope)'
        ],
        keyFeatures: [
          'Custom Pages',
          'Custom Features',
          'Custom Workflows',
          'Custom Forms',
          'API Integrations',
          'Database Integration',
          'Custom UI/UX',
          'Specialized Functionality',
          'Deployment Setup'
        ],
        designAndResponsive: '100% custom UI/UX design tailored specifically for your brand and fully responsive across all screens.',
        animationsInteractions: 'Custom interactive components and animations built to support your specific workflows.',
        formsAndIntegrations: [
          'Custom Forms',
          'API Integrations',
          'Database Integration'
        ],
        deploymentSetup: 'Cloud hosting setup, custom domain connection, SSL certificate, and production deployment.',
        keyDeliverables: [
          'Custom Pages',
          'Custom Features',
          'Custom Workflows',
          'Custom Forms',
          'API Integrations',
          'Database Integration',
          'Custom UI/UX',
          'Specialized Functionality',
          'Deployment Setup'
        ],
        idealFor: 'Businesses that need functionality or workflows beyond a standard website.',
        estimatedDelivery: 'Decided Upon Discussion'
      },
      'Website Redesign & Revamp': {
        summary: 'Complete architectural modernization and visual revamp for outdated websites—enhancing conversions and speed with zero downtime and 100% preserved SEO rankings.',
        whatIsIt: 'A comprehensive architectural and visual modernization service for businesses whose existing websites look outdated, load slowly, or fail to convert visitors. We redesign the entire user experience from scratch, rebuild with clean modern code, migrate all existing content without losing search engine rankings, and optimize for blazing-fast mobile conversions.',
        whatClientGets: [
          'Modern UI/UX Redesign',
          'Mobile-First Responsive Layout',
          'Full Codebase Modernization (React/Next.js)',
          'Core Web Vitals & Sub-Second Speed Optimization',
          '100% SEO Preservation & 301 Redirect Mapping',
          'Modern Lead Forms & WhatsApp Integration',
          'Interactive Micro-Animations',
          'Zero-Downtime Safe Cutover',
          'Full Source Code Ownership & Git Repository Transfer'
        ],
        pagesIncluded: [
          'Redesigned Home Page',
          'Modernized About / Story Page',
          'Refined Services / Solutions Page',
          'High-Conversion Contact & Inquiry Page',
          'Legacy Content & Blog Archive Migration'
        ],
        keyFeatures: [
          'Modern UI/UX Redesign',
          'Mobile-First Responsive Layout',
          'Full Codebase Modernization (React/Next.js)',
          'Core Web Vitals & Sub-Second Speed Optimization',
          '100% SEO Preservation & 301 Redirect Mapping',
          'Modern Lead Forms & WhatsApp Integration',
          'Interactive Micro-Animations',
          'Zero-Downtime Safe Cutover',
          'Full Source Code Ownership & Git Repository Transfer'
        ],
        designAndResponsive: 'Sleek, modern UI/UX overhaul built from scratch to replace outdated styling, fully responsive across all viewports.',
        animationsInteractions: 'Smooth animations including fluid scrolling, hover effects, and subtle entrance transitions.',
        formsAndIntegrations: [
          'Lead Capture Inquiry Form',
          'WhatsApp Business Direct Chat',
          'Google Analytics 4 & Conversion Tracking'
        ],
        deploymentSetup: 'Zero-downtime staging development, DNS cutover, automated SSL activation, and production cloud launch.',
        keyDeliverables: [
          'Redesigned Home Page',
          'Modernized About Page',
          'Refined Services Page',
          'High-Conversion Contact Page',
          'Legacy Content Archive Migration'
        ],
        idealFor: 'Companies and brands with an outdated, slow, or low-converting website who want an executive modernization without losing traffic or ranking.',
        estimatedDelivery: 'Decided Upon Discussion'
      },
      'Website Redesign': {
        summary: 'Complete architectural modernization and visual revamp for outdated websites—enhancing conversions and speed with zero downtime and 100% preserved SEO rankings.',
        whatIsIt: 'A comprehensive architectural and visual modernization service for businesses whose existing websites look outdated, load slowly, or fail to convert visitors. We redesign the entire user experience from scratch, rebuild with clean modern code, migrate all existing content without losing search engine rankings, and optimize for blazing-fast mobile conversions.',
        whatClientGets: [
          'Modern UI/UX Redesign',
          'Mobile-First Responsive Layout',
          'Full Codebase Modernization (React/Next.js)',
          'Core Web Vitals & Sub-Second Speed Optimization',
          '100% SEO Preservation & 301 Redirect Mapping',
          'Modern Lead Forms & WhatsApp Integration',
          'Interactive Micro-Animations',
          'Zero-Downtime Safe Cutover',
          'Full Source Code Ownership & Git Repository Transfer'
        ],
        pagesIncluded: [
          'Redesigned Home Page',
          'Modernized About / Story Page',
          'Refined Services / Solutions Page',
          'High-Conversion Contact & Inquiry Page',
          'Legacy Content & Blog Archive Migration'
        ],
        keyFeatures: [
          'Modern UI/UX Redesign',
          'Mobile-First Responsive Layout',
          'Full Codebase Modernization (React/Next.js)',
          'Core Web Vitals & Sub-Second Speed Optimization',
          '100% SEO Preservation & 301 Redirect Mapping',
          'Modern Lead Forms & WhatsApp Integration',
          'Interactive Micro-Animations',
          'Zero-Downtime Safe Cutover',
          'Full Source Code Ownership & Git Repository Transfer'
        ],
        designAndResponsive: 'Sleek, modern UI/UX overhaul built from scratch to replace outdated styling, fully responsive across all viewports.',
        animationsInteractions: 'Smooth animations including fluid scrolling, hover effects, and subtle entrance transitions.',
        formsAndIntegrations: [
          'Lead Capture Inquiry Form',
          'WhatsApp Business Direct Chat',
          'Google Analytics 4 & Conversion Tracking'
        ],
        deploymentSetup: 'Zero-downtime staging development, DNS cutover, automated SSL activation, and production cloud launch.',
        keyDeliverables: [
          'Redesigned Home Page',
          'Modernized About Page',
          'Refined Services Page',
          'High-Conversion Contact Page',
          'Legacy Content Archive Migration'
        ],
        idealFor: 'Companies and brands with an outdated, slow, or low-converting website who want an executive modernization without losing traffic or ranking.',
        estimatedDelivery: 'Decided Upon Discussion'
      }
    }
  },

  'srv-2': {
    serviceId: 'srv-2',
    serviceTitle: '3D Animated Websites',
    headline: 'Immersive 3D Animated Websites Package: Everything Included & Delivered',
    subheadline: 'Cinema-grade WebGL visuals, dynamic product & color variant animations, versatile full-bleed video backgrounds, and scroll-bound video expansion engines.',
    guarantees: [
      {
        title: '60 FPS Ultra-Smooth Playback',
        description: 'Engineered with GPU-accelerated shaders, hardware video decoding, and adaptive mobile optimization.',
        badge: '60 FPS Solid'
      },
      {
        title: 'Sub-2 Second Asset Streaming',
        description: 'Optimized WebM/MP4 compression and Draco 3D mesh optimization for instant page loads worldwide.',
        badge: 'Instant Load'
      },
      {
        title: 'Multi-Section Video Flexibility',
        description: 'Seamless video background embedding across Hero or any custom section with glassmorphic overlays.',
        badge: 'Multi-Section'
      },
      {
        title: 'Full Source & Media Rights',
        description: '100% intellectual property ownership of all custom animation code, video loops, and 3D assets.',
        badge: '100% IP'
      }
    ],
    deliverables: [
      {
        id: 'deliv-3d-1',
        title: 'Hero Direct Product Interaction Engine',
        description: 'Interactive hero section where clicking directional arrows or swatches smoothly changes the product, color, or variant with custom easing on a fixed ambient canvas.',
        format: 'React / GSAP Interactive Component',
        tag: 'Core Asset',
        iconType: 'box'
      },
      {
        id: 'deliv-3d-2',
        title: 'Multi-Section Cinematic Video Background Architecture',
        description: 'Full-bleed high-definition 3D animated video backgrounds across flagship sections paired with dedicated 3D visual stills in supporting sections for balanced pacing.',
        format: 'HTML5 Video Engine with Dual Codecs (WebM + MP4)',
        tag: 'Core Asset',
        iconType: 'film'
      },
      {
        id: 'deliv-3d-3',
        title: 'Apple-Grade Frame-by-Frame Scroll Scrubbing Engine',
        description: 'Cinematic animation sequence divided into image frames where scrolling down scrubs frames forward to reveal products opening or disassembling, and scrolling up reverses.',
        format: 'HTML5 Canvas + GSAP ScrollTrigger Engine',
        tag: 'Engineering',
        iconType: 'layout'
      },
      {
        id: 'deliv-3d-4',
        title: 'GSAP Scroll-Triggered Section Animation Engine',
        description: 'Coordinates entrance transitions, kinetic typography reveals, exploded spec callouts, and conversion actions as visitors scroll down subsequent sections.',
        format: 'GSAP ScrollTrigger Choreography',
        tag: 'Design & UX',
        iconType: 'zap'
      },
      {
        id: 'deliv-3d-5',
        title: 'Frosted Glassmorphism Overlays & Ambient Sound Controller',
        description: 'CSS backdrop-filter glass overlays ensuring 100% WCAG text contrast over moving video, paired with an interactive ambient audio soundscape and mute toggle.',
        format: 'Accessible Glass UI & Sound Controller',
        tag: 'Design & UX',
        iconType: 'check'
      },
      {
        id: 'deliv-3d-6',
        title: 'Mobile Optimization & Battery-Saving Fallbacks',
        description: 'Hardware-accelerated decoding, auto-pausing off-screen video sections, and sub-2MB asset compression for universal 60 FPS mobile playback.',
        format: 'Performance Controller & Edge Caching',
        tag: 'Performance',
        iconType: 'shield'
      },
      {
        id: 'deliv-3d-7',
        title: 'Interactive Spec Hotspots & Product Annotations',
        description: 'Pulsing micro-pins anchored to products that expand into frosted glass spec cards detailing engineering craftsmanship, materials, and benefits.',
        format: 'Interactive Hotspot Layer',
        tag: 'Design & UX',
        iconType: 'layout'
      },
      {
        id: 'deliv-3d-8',
        title: 'Complete Source Code & Optimized Assets Handover',
        description: 'Full intellectual property transfer of all custom interaction code, GSAP choreography, master video loops, and extracted frame sequences.',
        format: 'Git Repository + Production Asset Package',
        tag: 'Core Asset',
        iconType: 'box'
      }
    ],
    subcategoryDetails: {
      'Interactive 3D Product Experiences': {
        summary: 'Websites where users interact with products directly inside the hero section—clicking directional arrows, swatches, or controls to change the product, colorway, style, or variant with smooth cinematic transitions while the ambient canvas stays locked, followed by GSAP scroll-triggered animations across subsequent sections.',
        whatIsIt: 'Websites where visitors can interact directly with products in the hero section. Users click intuitive arrows or swatches to swap product colors, finishes, and models on a steady ambient canvas with fluid easing curves, while GSAP animations power component breakdowns, spec reveals, and conversion sections down the page.',
        whatClientGets: [
          'Hero Section Direct Product Interaction Engine',
          'Fixed Ambient Studio Canvas Background',
          'Directional Arrow & Color Swatch Controls',
          'Smooth Cinematic Variant Easing & Morph Transitions',
          'GSAP Scroll-Triggered Section Entrances',
          'Interactive Spec Hotspots & Technical Tooltips',
          'Mobile Swipe & Thumb Gestures',
          'Production Deployment & 100% Source Code Handover'
        ],
        keyDeliverables: [
          'Hero Direct Product Interaction Engine',
          'Fixed Ambient Canvas Background (Steady Visuals)',
          'Smooth Cinematic Variant Easing & Morph Transitions',
          'GSAP Scroll-Triggered Section Entrances & Spec Hotspots'
        ],
        idealFor: 'Footwear & sneaker brands, luxury watches & timepieces, designer audio & headphones, consumer electronics, modular furniture, and high-conversion e-commerce flagships.'
      },
      'Cinematic 3D Websites': {
        summary: 'Websites using full-screen cinematic 3D animated video backgrounds across multiple sections—combining continuous looping video in flagship zones with dedicated 3D visuals and images in supporting sections for luxury immersion, crystal-clear readability, and fast loading.',
        whatIsIt: 'Websites that utilize full-screen cinematic 3D animated video backgrounds across multiple sections to craft an unforgettable, ultra-premium brand world. Continuous animated video loops immerse visitors in hero and highlight sections, while supporting sections pair dedicated 3D visual stills and frosted glass typography for perfect narrative pacing.',
        whatClientGets: [
          'Multi-Section Cinematic 3D Video Background Engine',
          'Continuous Video Loops in Flagship Zones',
          'Dedicated 3D Visuals & Image Stills in Supporting Sections',
          'Frosted Glassmorphism Typography Overlays for 100% Readability',
          'Ambient Soundscape Design with Interactive Mute/Sound Toggle',
          'Optimized Web-Ready Video Compression (<2MB per Loop)',
          'Dual-Codec Delivery (WebM VP9 + MP4 H.264)',
          'Production CDN Deployment & 100% Source Code Handover'
        ],
        keyDeliverables: [
          'Multi-Section Cinematic 3D Video Background Architecture',
          'Continuous Video Backgrounds + Supporting 3D Visual Stills',
          'Frosted Glassmorphism UI Overlays & Typography',
          'Ambient Sound Design with Interactive Mute/Sound Toggle'
        ],
        idealFor: 'Luxury perfumes & fragrances, fine jewelry & haute horlogerie, premium beverages & distilleries, luxury real estate, and high-fashion flagships.'
      },
      'Scroll-Driven Animation': {
        summary: 'Websites where a cinematic animation sequence is divided into multiple image frames that scrub smoothly forward as users scroll down and reverse frame-by-frame when scrolling upward—allowing products to gradually open, rotate, or reveal internal engineering details in tactile Apple-style reveals.',
        whatIsIt: 'Websites where a cinema-grade animation sequence is divided into hundreds of high-resolution image frames. As visitors scroll down, the frames progress smoothly on an HTML5 Canvas to create a continuous video illusion, and scrolling up reverses the sequence frame-by-frame with zero lag, revealing products opening, disassembling, or transforming.',
        whatClientGets: [
          'Apple-Grade Frame-by-Frame Scroll Scrubbing Engine',
          'Bi-Directional Motion Control (Forward on scroll down, reverse on scroll up)',
          'Sticky Pinned Viewport Container via GSAP ScrollTrigger',
          'Smooth Product Transformations (Gradual opening, closing, 360° rotation, exploded views)',
          'Synchronized Milestone Typography Overlays Keyed to Exact Frames',
          'HTML5 Canvas 60 FPS RequestAnimationFrame Pre-Renderer',
          'Lenis Inertial Momentum Physics Integration',
          'Production Edge Deployment & 100% Source Code Handover'
        ],
        keyDeliverables: [
          'Apple-Grade Frame-by-Frame Scroll Scrubbing Engine',
          'Bi-Directional Motion Control (Forward on down-scroll, reverse on up-scroll)',
          'Pinned Viewport Container via GSAP ScrollTrigger',
          'HTML5 Canvas 60 FPS Zero-Buffer Rendering & Milestone Overlays'
        ],
        idealFor: 'Flagship tech hardware reveals (Apple/Tesla style), luxury automotive & EVs, complex mechanical watches, precision audio hardware, and industrial engineering.'
      },
      'Interactive Variant Studio': {
        summary: 'Keep your ambient website background steady while selecting different colors or products triggers unique, fluid animations for every variant.',
        keyDeliverables: ['Fixed Ambient Background Canvas', 'Dynamic Color & Material Variant Switching', 'Bespoke Per-Variant Entrance Animations', 'Interactive Variant Swatches & Tooltips'],
        idealFor: 'E-commerce flagships, sneakers/footwear, luxury watchmakers, tech accessories, and consumer hardware brands.'
      },
      'Cinematic Video Atmosphere': {
        summary: 'Embed cinematic, high-definition looping video backgrounds into the Hero section or any custom section across your website with frosted glass overlays.',
        keyDeliverables: ['Versatile Hero or Custom Section Video Embedding', 'Optimized Web-Ready 4K/1080p Video Compression', 'Glassmorphism UI Overlays & Sound/Mute Toggle', 'Mobile Autoplay Fallback & Bandwidth Optimization'],
        idealFor: 'Creative digital agencies, luxury real estate, fitness brands, high-energy fashion labels, and modern corporate landing pages.'
      },
      'Scroll-Driven Video Hero': {
        summary: 'Cinema-grade scroll-driven hero where scrolling directly commands frame-by-frame animation forward and backward.',
        keyDeliverables: ['Apple-Grade Scroll-Driven Video Playback Engine', 'Smooth Frame-Interpolated Playback Scrubbing', 'Pinned Timeline Sticky Section Control', 'Synchronized Milestone Overlays'],
        idealFor: 'Apple-style flagship product reveals, high-impact SaaS launches, viral marketing campaigns, and design studio hero showcases.'
      },
      'Scroll-Bound Cinema Zoom': {
        summary: 'Cinema-grade scroll-bound hero where videos start framed or contained and dynamically expand into an immersive fullscreen experience as the user scrolls.',
        keyDeliverables: ['Scroll-Bound Video Container Scaling Engine', 'Smooth Frame-Interpolated Playback Scrubbing', 'Full-Bleed Viewport Expansion Animation', 'Pinned Timeline Sticky Section Control'],
        idealFor: 'Apple-style flagship product reveals, high-impact SaaS launches, viral marketing campaigns, and design studio hero showcases.'
      },
      'Dynamic Product & Color Variant Showcase': {
        summary: 'Keep your ambient website background steady while selecting different colors or products triggers unique, fluid animations for every variant.',
        keyDeliverables: ['Fixed Ambient Background Canvas', 'Dynamic Color & Material Variant Switching', 'Bespoke Per-Variant Entrance Animations', 'Interactive Variant Swatches & Tooltips'],
        idealFor: 'E-commerce flagships, sneakers/footwear, luxury watchmakers, tech accessories, and consumer hardware brands.'
      },
      'Cinematic Video Background Integration': {
        summary: 'Embed cinematic, high-definition looping video backgrounds into the Hero section or any custom section across your website with frosted glass overlays.',
        keyDeliverables: ['Versatile Hero or Custom Section Video Embedding', 'Optimized Web-Ready 4K/1080p Video Compression', 'Glassmorphism UI Overlays & Sound/Mute Toggle', 'Mobile Autoplay Fallback & Bandwidth Optimization'],
        idealFor: 'Creative digital agencies, luxury real estate, fitness brands, high-energy fashion labels, and modern corporate landing pages.'
      },
      'Scroll-Driven Video Expansion Hero': {
        summary: 'Cinema-grade scroll-bound hero where videos start framed or contained and dynamically expand into an immersive fullscreen experience as the user scrolls.',
        keyDeliverables: ['Scroll-Bound Video Container Scaling Engine', 'Smooth Frame-Interpolated Playback Scrubbing', 'Full-Bleed Viewport Expansion Animation', 'Pinned Timeline Sticky Section Control'],
        idealFor: 'Apple-style flagship product reveals, high-impact SaaS launches, viral marketing campaigns, and design studio hero showcases.'
      }
    }
  },

  'srv-3': {
    serviceId: 'srv-3',
    serviceTitle: 'E-Commerce Development',
    headline: 'High-Converting E-Commerce Package: Everything Included & Delivered',
    subheadline: 'Bespoke online storefronts engineered with instant headless checkout, seamless payment gateways, and luxury aesthetics designed to maximize sales.',
    guarantees: [
      {
        title: 'Sub-Second Instant Checkout',
        description: 'Frictionless checkout experience with Apple Pay, Google Pay, credit cards, and multi-currency support.',
        badge: 'Instant Checkout'
      },
      {
        title: '100% Mobile E-Commerce Optimized',
        description: 'Tailored thumb-friendly navigation, sticky add-to-cart buttons, and quick-view modals for mobile shoppers.',
        badge: 'Mobile First'
      },
      {
        title: 'Automated Tax & Shipping Setup',
        description: 'Configured automated shipping calculation, weight tiers, tax compliance, and order tracking emails.',
        badge: 'Turnkey Store'
      },
      {
        title: 'Zero Ongoing Platform Royalties',
        description: 'Full ownership of your custom code and store configuration without Usman DevHub taking any transaction cuts.',
        badge: '0% Revenue Cut'
      }
    ],
    deliverables: [
      {
        id: 'deliv-ecom-1',
        title: 'Complete Custom Flagship Online Storefront',
        description: 'Bespoke e-commerce website built on Shopify, WooCommerce, or Custom Code with luxury branding and lightning-fast transitions.',
        format: 'Production E-Commerce Platform',
        tag: 'Core Asset',
        iconType: 'layout'
      },
      {
        id: 'deliv-ecom-2',
        title: 'Multi-Currency Payment Gateway Integration',
        description: 'Stripe, Apple Pay, Google Pay, credit/debit cards, Cash on Delivery (COD), and local gateway integrations with auto-currency detection based on customer IP.',
        format: 'Live Verified Payment Gateways',
        tag: 'Engineering',
        iconType: 'zap'
      },
      {
        id: 'deliv-ecom-3',
        title: 'Product Catalog & Dynamic Variants Management',
        description: 'Intuitive backend catalog supporting color swatches, size pickers, inventory thresholds, SKU tracking, and bulk import/export.',
        format: 'Inventory Management System',
        tag: 'Core Asset',
        iconType: 'database'
      },
      {
        id: 'deliv-ecom-4',
        title: 'High-Converting Slide-Out Cart Drawer',
        description: 'Animated cart drawer with free-shipping threshold bar, cross-sell product recommendations, and 1-click discount codes.',
        format: 'Interactive Slide-Over Cart UI',
        tag: 'Design & UX',
        iconType: 'check'
      },
      {
        id: 'deliv-ecom-5',
        title: 'Customer Account Portal & Order Tracking',
        description: 'Self-service customer portal with passwordless login, order history, tracking links, saved shipping addresses, and wishlist.',
        format: 'Customer Account Hub',
        tag: 'Core Asset',
        iconType: 'globe'
      },
      {
        id: 'deliv-ecom-6',
        title: 'Automated Transactional Emails & Invoices',
        description: 'Beautifully branded order confirmations, shipping notifications, abandoned cart recovery emails, and printable tax receipts.',
        format: 'HTML Email Templates (Resend / SendGrid / Klaviyo)',
        tag: 'Design & UX',
        iconType: 'layout'
      },
      {
        id: 'deliv-ecom-7',
        title: 'Enhanced Google Analytics 4 & Meta Pixel Setup',
        description: 'Full e-commerce event tracking: view_item, add_to_cart, begin_checkout, and purchase with accurate revenue tracking for ads.',
        format: 'GA4 + Meta Pixel + Conversion API',
        tag: 'Performance',
        iconType: 'zap'
      },
      {
        id: 'deliv-ecom-8',
        title: 'Admin Store Management Training & Handover',
        description: '1-on-1 video tutorial demonstrating how to add products, process orders, issue refunds, run discount sales, and manage inventory.',
        format: 'HD Video Guide & Client Operations PDF',
        tag: 'Support & SLA',
        iconType: 'shield'
      }
    ],
    subcategoryDetails: {
      'Custom & Any Niche Store': {
        summary: '100% bespoke e-commerce architecture engineered for any unique product or business model — from pet supplies and automotive parts to custom inventions.',
        keyDeliverables: ['Custom Product Attributes & Variant Matrix', 'Tailored Sub-Second Headless Checkout', 'Multi-Currency & Regional Tax Engine', 'Inventory Restock Alerts & Lead Capture'],
        idealFor: 'Any product, startup, or established business needing a tailored online store with zero template restrictions.'
      },
      'Fashion & Apparel Store': {
        summary: 'Editorial fashion flagships with high-resolution lookbooks, model size guides, quick-view swatches, and luxury styling.',
        keyDeliverables: ['Lookbook Grid with Shop-The-Look', 'Visual Color Swatches & Size Chart', 'Instagram Shop Feed Integration', 'VIP Early Access Gate'],
        idealFor: 'Luxury apparel, streetwear brands, couture fashion houses, and designer footwear.'
      },
      'Fashion Store': {
        summary: 'Editorial fashion flagships with high-resolution lookbooks, model size guides, quick-view swatches, and luxury styling.',
        keyDeliverables: ['Lookbook Grid with Shop-The-Look', 'Visual Color Swatches & Size Chart', 'Instagram Shop Feed Integration', 'VIP Early Access Gate'],
        idealFor: 'Luxury apparel, streetwear brands, couture fashion houses, and designer footwear.'
      },
      'Electronics & Gadgets Store': {
        summary: 'High-tech electronics storefronts with comparison tables, technical specification tabs, warranty addons, and bundle builders.',
        keyDeliverables: ['Technical Spec Comparison Sheet', 'Accessory Bundle Builder', 'Warranty & Protection Add-On', 'Express Checkout'],
        idealFor: 'Consumer electronics, audio gear, smart home accessories, and computer peripherals.'
      },
      'Electronics Store': {
        summary: 'High-tech electronics storefronts with comparison tables, technical specification tabs, warranty addons, and bundle builders.',
        keyDeliverables: ['Technical Spec Comparison Sheet', 'Accessory Bundle Builder', 'Warranty & Protection Add-On', 'Express Checkout'],
        idealFor: 'Consumer electronics, audio gear, smart home accessories, and computer peripherals.'
      },
      'Food & Gourmet Store': {
        summary: 'Gourmet kitchen and pantry stores with local delivery date pickers, temperature-control shipping options, and dietary filter tags.',
        keyDeliverables: ['Delivery Date / Time Slot Picker', 'Dietary Tag Filters (Vegan, Gluten-Free)', 'Recurring Subscription Ordering', 'Local Radius Delivery Rules'],
        idealFor: 'Artisanal bakeries, specialty coffee roasters, organic farms, and gourmet dining brands.'
      },
      'Food Store': {
        summary: 'Gourmet kitchen and pantry stores with local delivery date pickers, temperature-control shipping options, and dietary filter tags.',
        keyDeliverables: ['Delivery Date / Time Slot Picker', 'Dietary Tag Filters (Vegan, Gluten-Free)', 'Recurring Subscription Ordering', 'Local Radius Delivery Rules'],
        idealFor: 'Artisanal bakeries, specialty coffee roasters, organic farms, and gourmet dining brands.'
      },
      'Beauty & Skincare Store': {
        summary: 'Clean beauty and skincare storefronts with ingredient visualizers, skin type finder quizzes, and recurring subscription discounts.',
        keyDeliverables: ['Interactive Skin Quiz Matcher', 'Ingredient Highlight Accordion', 'Auto-Replenish Subscription Option', 'Customer Review & Photo Gallery'],
        idealFor: 'Cosmetics brands, organic skincare, fragrance houses, and personal care products.'
      },
      'Beauty Store': {
        summary: 'Clean beauty and skincare storefronts with ingredient visualizers, skin type finder quizzes, and recurring subscription discounts.',
        keyDeliverables: ['Interactive Skin Quiz Matcher', 'Ingredient Highlight Accordion', 'Auto-Replenish Subscription Option', 'Customer Review & Photo Gallery'],
        idealFor: 'Cosmetics brands, organic skincare, fragrance houses, and personal care products.'
      },
      'Luxury & High-Ticket Store': {
        summary: 'Ultra-exclusive luxury flagships with 360-degree jewelry inspection, white-glove concierge booking, and invite-only private vaults.',
        keyDeliverables: ['Private VIP Concierge Scheduling', '360-Degree Gem / Watch Loupe Viewer', 'Serial Number Certificate Verification', 'Encrypted High-Value Checkout'],
        idealFor: 'Swiss horology, fine diamonds & jewelry, luxury accessories, and rare collectibles.'
      },
      'Luxury Store': {
        summary: 'Ultra-exclusive luxury flagships with 360-degree jewelry inspection, white-glove concierge booking, and invite-only private vaults.',
        keyDeliverables: ['Private VIP Concierge Scheduling', '360-Degree Gem / Watch Loupe Viewer', 'Serial Number Certificate Verification', 'Encrypted High-Value Checkout'],
        idealFor: 'Swiss horology, fine diamonds & jewelry, luxury accessories, and rare collectibles.'
      },
      'B2B Wholesale & Bulk Commerce': {
        summary: 'Enterprise wholesale portals with tiered volume pricing, customer group discounts, net-payment terms, and corporate account management.',
        keyDeliverables: ['Tiered Volume Pricing Matrices', 'Net-30 Invoicing & PO Support', 'Quick SKU Spreadsheet Paste Ordering', 'LTL Freight & Pallet Shipping Rates'],
        idealFor: 'Manufacturers, industrial distributors, bulk suppliers, and trade commerce.'
      },
      'Multi-Vendor Marketplace': {
        summary: 'Scalable multi-seller commerce platform with vendor registration, individual seller dashboards, automated commission splits, and unified buyer checkout.',
        keyDeliverables: ['Stripe Connect Split Payouts', 'Independent Vendor Portals', 'Unified Multi-Seller Cart', 'Dispute & Review Management'],
        idealFor: 'Multi-vendor marketplaces, artisan collectives, consignment networks, and regional vendor aggregators.'
      },
      'Digital Products & Subscriptions': {
        summary: 'Frictionless automated delivery for downloadable digital goods, video courses, license keys, design presets, and recurring memberships.',
        keyDeliverables: ['Instant Post-Purchase Download & License Delivery', 'Stripe Recurring Subscriptions', 'Customer Digital Vault', 'Anti-Piracy Expiring URLs'],
        idealFor: 'Software developers, digital asset creators, courses, presets, and subscription communities.'
      }
    }
  },

  'srv-4': {
    serviceId: 'srv-4',
    serviceTitle: 'Graphic Design',
    headline: 'Complete Brand Identity & Graphic Suite: Everything Included & Delivered',
    subheadline: 'Strategic visual identities, luxury typography systems, mathematical vectors, and high-impact digital assets that distinguish your brand worldwide.',
    guarantees: [
      {
        title: '100% Vector Lossless Formats',
        description: 'Delivered in infinitely scalable mathematical vector formats (.AI, .SVG, .EPS) suitable from business cards to billboards.',
        badge: 'Infinitely Scalable'
      },
      {
        title: 'Full Commercial Trademark Ownership',
        description: 'Complete legal assignment of intellectual property rights for international trademark registration.',
        badge: '100% Yours'
      },
      {
        title: 'Complete 25+ Page Brand Guidelines',
        description: 'Comprehensive manual defining exact clear space, typography hierarchy, colors, and layout rules.',
        badge: 'Brand Manual'
      },
      {
        title: 'Print & Digital Color Systems',
        description: 'Precise color formulations for digital screens (RGB/HEX) and commercial print houses (CMYK/Pantone).',
        badge: 'Color Calibrated'
      }
    ],
    deliverables: [
      {
        id: 'deliv-des-1',
        title: 'Master Vector Logo Suite (Primary, Stacked, Submark)',
        description: 'Full family of logo variants: primary horizontal logo, stacked vertical logo, standalone monogram/icon, and inverse white/black versions.',
        format: '.AI, .SVG, .EPS, .PDF, .PNG (Transparent)',
        tag: 'Core Asset',
        iconType: 'box'
      },
      {
        id: 'deliv-des-2',
        title: 'Comprehensive Brand Style Guide Manual (25+ Pages)',
        description: 'Defines logo construction geometry, minimum sizing, clear space boundaries, forbidden uses, brand voice, and photographic moodboards.',
        format: 'Executive Brand Identity PDF Manual',
        tag: 'Core Asset',
        iconType: 'layout'
      },
      {
        id: 'deliv-des-3',
        title: 'Harmonic Color Palette (HEX, RGB, CMYK, Pantone)',
        description: 'Primary, secondary, and accent colors mathematically paired with contrast ratios meeting accessibility benchmarks (WCAG AA).',
        format: 'Color Palette Swatch Sheet + Figma Styles',
        tag: 'Design & UX',
        iconType: 'zap'
      },
      {
        id: 'deliv-des-4',
        title: 'Typography System & Web Font Pairing Package',
        description: 'Display and body font selections with strict hierarchy scales, letter-spacing rules, line heights, and licensed web font files.',
        format: 'Web Fonts (.WOFF2, .TTF) + Typography Guide',
        tag: 'Design & UX',
        iconType: 'code'
      },
      {
        id: 'deliv-des-5',
        title: 'High-CTR Social Media Kit & Banners',
        description: 'Profile avatars, header banners (Twitter/X, LinkedIn, YouTube, Facebook), and editable post templates in Figma and Photoshop.',
        format: 'Figma Master Files + High-Res PNG Exports',
        tag: 'Core Asset',
        iconType: 'layout'
      },
      {
        id: 'deliv-des-6',
        title: 'Corporate Stationery & Print Collateral',
        description: 'Luxury double-sided business card templates, letterheads, invoice templates, and branded presentation deck slides.',
        format: 'Print-Ready CMYK PDF with 3mm Bleeds',
        tag: 'Core Asset',
        iconType: 'check'
      },
      {
        id: 'deliv-des-7',
        title: 'Custom Vector Iconography Pack (20+ Icons)',
        description: 'Bespoke custom vector icon system designed to match the stroke weight and geometry of your new brand mark.',
        format: 'SVG Icons + Figma Component Library',
        tag: 'Design & UX',
        iconType: 'box'
      },
      {
        id: 'deliv-des-8',
        title: 'Full Intellectual Property & Legal Transfer Document',
        description: 'Formal signed assignment agreement confirming you own 100% of all visual assets and trademarks with zero claims or royalties.',
        format: 'Signed IP Assignment Certificate',
        tag: 'Support & SLA',
        iconType: 'shield'
      }
    ],
    subcategoryDetails: {
      'Logo Design': {
        summary: 'Iconic, memorable brand marks designed with mathematical geometry to look stunning at 16px as a favicon and on giant billboards.',
        keyDeliverables: ['3 Distinct Concept Explorations', 'Primary & Secondary Lockups', 'App Icon & Favicon Suite', 'Full Vector File Package'],
        idealFor: 'New startups, brand revamps, venture funds, and product lines needing a distinctive identity.'
      },
      'Product Design': {
        summary: 'Digital UI/UX component architectures, mobile application interfaces, and tactile physical packaging concepts.',
        keyDeliverables: ['Figma Auto-Layout Design System', 'High-Fidelity Interactive Wireframes', 'Tactile Packaging Box Renders', 'Interactive Prototype Link'],
        idealFor: 'SaaS products, mobile apps, luxury cosmetics packaging, and physical consumer goods.'
      },
      'Thumbnail Design': {
        summary: 'High-contrast, psychology-driven YouTube and media thumbnails engineered to maximize click-through rate (CTR) and visual stopping power.',
        keyDeliverables: ['Visual Focal Point Isolation', 'High-Impact Bold Typography', 'Color Grading & Lighting Passes', 'Editable PSD / Figma Templates'],
        idealFor: 'Top YouTube creators, media networks, podcast channels, and online educators.'
      },
      'Social Media Design': {
        summary: 'Consistent, eye-catching visual templates for Instagram carousels, LinkedIn thought-leadership cards, and Twitter/X announcement graphics.',
        keyDeliverables: ['10x Reusable Carousel Templates', 'Branded Story & Reel Covers', 'Twitter/X Announcement Graphics', 'Figma Template Kit'],
        idealFor: 'Brands scaling organic social presence, venture founders, and marketing teams.'
      }
    }
  },

  'srv-5': {
    serviceId: 'srv-5',
    serviceTitle: '3D Video Animation',
    headline: 'High-Impact 3D Video Animation & Motion Design',
    subheadline: 'Photorealistic 3D product animations, kinetic logo reveals, brand films, and commercial video promos (5s to 60s) engineered for high retention and conversions.',
    guarantees: [
      {
        title: 'Short-Form Video Formats',
        description: '5s to 60s video durations calibrated for maximum viewer engagement, polished delivery, and social media performance.',
        badge: 'Up to 60s'
      },
      {
        title: 'Transparent Web Video Formats',
        description: 'Delivered in lightweight WebM alpha and ProRes codecs ready for seamless website integration without background boxes.',
        badge: 'Transparent Alpha'
      },
      {
        title: '4K Ultra HD 60fps Masters',
        description: 'Rendered in crisp 4K resolution using GPU raytracing engines with cinematic lighting and color grading.',
        badge: 'Pristine 4K'
      },
      {
        title: 'Multi-Platform Aspect Ratios',
        description: 'Delivered in 16:9 widescreen, 9:16 vertical (Reels/TikTok), and 1:1 square ready for all channels.',
        badge: 'All Formats'
      }
    ],
    deliverables: [
      {
        id: 'deliv-mot-1',
        title: '4K 60fps Master Video Renders',
        description: 'Uncompressed high-bitrate ProRes 422 and MP4 master files rendered with raytraced lighting, ambient occlusion, and motion blur.',
        format: '4K Ultra HD (3840x2160) at 60fps',
        tag: 'Core Asset',
        iconType: 'film'
      },
      {
        id: 'deliv-mot-2',
        title: 'Transparent Alpha Channel Web Formats',
        description: 'Lossless transparent video ready to drop into modern websites with zero background boxes, floating over existing UI elements.',
        format: 'WebM (VP9 with Alpha) + ProRes 4444',
        tag: 'Engineering',
        iconType: 'layout'
      },
      {
        id: 'deliv-mot-3',
        title: 'Multi-Platform Aspect Ratio Cuts',
        description: 'Tailored re-framing for 16:9 widescreen (YouTube / Keynotes), 9:16 vertical (Reels / TikTok / Shorts), and 1:1 square (Feeds).',
        format: '3 Formatted Video Renders per Animation',
        tag: 'Core Asset',
        iconType: 'box'
      },
      {
        id: 'deliv-mot-4',
        title: 'Lightweight Lottie / JSON Micro-Interactions',
        description: 'Vector-based UI animations under 100KB that run smoothly inside React, iOS, and Android applications with zero video buffering.',
        format: '.JSON / Lottie Files + Bodymovin Code',
        tag: 'Performance',
        iconType: 'zap'
      },
      {
        id: 'deliv-mot-5',
        title: 'Commercial Sound Effects & Sonic Branding',
        description: 'Custom foley sound effects, spatial whooshes, clicks, and commercial license for background musical scores with zero copyright strikes.',
        format: '24-bit 48kHz WAV Audio Stems',
        tag: 'Core Asset',
        iconType: 'check'
      },
      {
        id: 'deliv-mot-6',
        title: 'Raw 3D Project Files Handover',
        description: 'Complete Cinema 4D / After Effects project files with keyed animation curves, lighting rigs, and camera setups for complete control.',
        format: 'Master .c4d / .aep Project Directory',
        tag: 'Core Asset',
        iconType: 'box'
      },
      {
        id: 'deliv-mot-7',
        title: 'Static 4K Promotional Stills Pack',
        description: 'High-resolution still renders extracted from key camera moments, perfect for website hero posters, pitch decks, and ad graphics.',
        format: '4K PNG / TIFF Still Frames',
        tag: 'Design & UX',
        iconType: 'layout'
      },
      {
        id: 'deliv-mot-8',
        title: 'Unlimited Commercial Broadcast License',
        description: 'Complete rights to use all video assets in paid television ads, social ad campaigns, outdoor billboards, and trade show keynotes.',
        format: 'Commercial Broadcast License Agreement',
        tag: 'Support & SLA',
        iconType: 'shield'
      }
    ],
    subcategoryDetails: {
      'Logo Animation': {
        summary: 'Dimensional 3D logo reveals that bring your brand mark to life with kinetic lighting, liquid morphing, or geometric assembly.',
        keyDeliverables: ['3D Kinetic Logo Reveal (3-6s)', 'Transparent Alpha Web Video', 'Looping Animated Favicon / Loader', 'Sound Design Ident'],
        idealFor: 'YouTube video intros, keynote presentations, software splash screens, and website heroes.'
      },
      'Product Animation': {
        summary: 'Photorealistic product teardowns, internal exploded views, and cinematic hardware showcases demonstrating internal mechanics.',
        keyDeliverables: ['Exploded-View Hardware Reveal', 'Material & Texture Highlights', 'Internal Mechanism Camera Flythrough', '4K Commercial Master'],
        idealFor: 'Hardware startups, consumer electronics, luxury watches, and architectural developments.'
      },
      'Brand Animation': {
        summary: 'Focused 30s to 60s brand story videos articulating your company mission through kinetic typography, abstract 3D spatial art, and musical rhythm.',
        keyDeliverables: ['30 to 60-Second Brand Video (Max 1 Minute)', 'Voiceover Synchronization', 'Full Sound Design & Mix', 'Multi-Platform Ad Cuts'],
        idealFor: 'Company rebrands, investor pitches, keynote intros, and viral social campaigns.'
      },
      'Promo Videos': {
        summary: 'Fast-paced, high-energy commercial promo videos engineered to drive product sales, app downloads, or conference registrations.',
        keyDeliverables: ['15s & 30s High-Conversion Ad Cuts', 'Kinetic On-Screen Captions', 'Call-To-Action Animated Endcard', 'Platform-Specific Formats'],
        idealFor: 'Paid social ad campaigns (Meta, TikTok, YouTube), product launches, and seasonal promos.'
      }
    }
  },

  'srv-6': {
    serviceId: 'srv-6',
    serviceTitle: 'Website Deployment & Cloud Setup',
    headline: 'Enterprise Cloud & DevOps Package: Everything Included & Delivered',
    subheadline: 'High-availability multi-region cloud infrastructure, zero-downtime CI/CD deployment pipelines, automated SSL lifecycle, and edge CDN routing.',
    guarantees: [
      {
        title: 'Zero Downtime Deployment Guarantee',
        description: 'Automated atomic deployments ensure your users never experience a broken page or 502 error during updates.',
        badge: 'Zero Downtime'
      },
      {
        title: 'Automated SSL & Security Vault',
        description: 'Free auto-renewing wildcard SSL certificates with TLS 1.3 encryption and HSTS headers enforced.',
        badge: 'TLS 1.3 SSL'
      },
      {
        title: 'Global Edge CDN Caching',
        description: 'Content cached across 280+ worldwide edge nodes for sub-50ms TTFB regardless of user location.',
        badge: '<50ms Edge TTFB'
      },
      {
        title: 'Encrypted Credential Vault Handover',
        description: 'All server credentials, SSH keys, DNS entries, and API tokens delivered in a secure password vault.',
        badge: 'Encrypted Vault'
      }
    ],
    deliverables: [
      {
        id: 'deliv-cld-1',
        title: 'Enterprise Cloud Server Infrastructure Provisioning',
        description: 'Architecture setup on AWS, Google Cloud, Vercel Enterprise, or Cloud Run with auto-scaling, health checks, and container isolation.',
        format: 'Active Cloud Infrastructure & IAM Roles',
        tag: 'Infrastructure',
        iconType: 'database'
      },
      {
        id: 'deliv-cld-2',
        title: 'Cloudflare Enterprise Global Edge CDN & Caching',
        description: 'DNS configuration with Cloudflare edge caching, automatic Brotli compression, minification, and HTTP/3 support for top performance.',
        format: 'Cloudflare Edge Ruleset & Page Rules',
        tag: 'Performance',
        iconType: 'zap'
      },
      {
        id: 'deliv-cld-3',
        title: 'Automated Wildcard SSL Certificate with Auto-Renewal',
        description: 'Let’s Encrypt / Cloudflare SSL certificate provisioning with automatic renewal, HSTS preloading, and force-HTTPS redirects.',
        format: 'Wildcard SSL Active & Configured',
        tag: 'Security',
        iconType: 'shield'
      },
      {
        id: 'deliv-cld-4',
        title: 'Zero-Downtime GitHub Actions CI/CD Pipeline',
        description: 'Automated workflow that tests code, runs builds, and deploys to production on every git push with 1-click rollback capability.',
        format: '.github/workflows CI/CD YAML Scripts',
        tag: 'Engineering',
        iconType: 'code'
      },
      {
        id: 'deliv-cld-5',
        title: 'Domain Connection & DNSSEC Configuration',
        description: 'Full domain linking, DNS record mapping (A, CNAME, TXT, MX), www to non-www canonical redirection, and DNSSEC forgery prevention.',
        format: 'Verified DNS Records & Propagation',
        tag: 'Infrastructure',
        iconType: 'globe'
      },
      {
        id: 'deliv-cld-6',
        title: 'Email Security Authentication (SPF, DKIM, DMARC)',
        description: 'Configuration of email DNS records to ensure your business emails (Google Workspace / Microsoft 365) land in inboxes, not spam.',
        format: 'Verified SPF, DKIM & DMARC Records',
        tag: 'Security',
        iconType: 'check'
      },
      {
        id: 'deliv-cld-7',
        title: 'DDoS Protection & Web Application Firewall (WAF)',
        description: 'Rule configurations to mitigate layer 7 DDoS attacks, challenge automated scrapers, and block malicious IP ranges.',
        format: 'Active WAF Rules & Security Headers',
        tag: 'Security',
        iconType: 'shield'
      },
      {
        id: 'deliv-cld-8',
        title: 'Encrypted Credential Vault & Architecture Blueprint Handover',
        description: 'Secure Bitwarden/1Password vault containing all root logins, API keys, SSH keys, recovery codes, and an architecture diagram PDF.',
        format: 'Encrypted Vault Export + Architecture Blueprint PDF',
        tag: 'Support & SLA',
        iconType: 'shield'
      }
    ],
    subcategoryDetails: {
      'Frontend & Jamstack Web Deployment': {
        summary: 'Instant edge deployment on Vercel, Netlify, or Cloudflare Pages with custom domain linking, free auto-renewing SSL, and global CDN caching.',
        keyDeliverables: ['Vercel / Netlify / Cloudflare Deployment', 'Custom Domain Connection', 'Free Auto-Renewing SSL', 'Global Edge CDN & Brotli Compression'],
        idealFor: 'Next.js, React, Vue, landing pages, and portfolios needing lightning-fast global speed.'
      },
      'Linux VPS & Docker Server Setup': {
        summary: 'Production Ubuntu VPS server setup with Docker, Nginx reverse proxy, PostgreSQL/MySQL, automated daily backups, and UFW firewall hardening.',
        keyDeliverables: ['Ubuntu VPS Provisioning & Hardening', 'Docker & Docker Compose Containerization', 'Nginx Reverse Proxy with SSL', 'Automated Daily DB Backups'],
        idealFor: 'Full-stack Node.js, Python, PHP, or Go apps requiring dedicated resources and databases.'
      },
      'Domain, DNS & Cloudflare Security': {
        summary: 'Domain linking, DNS record mapping, SSL warning fixes, Cloudflare WAF protection, and business email authentication (SPF, DKIM, DMARC).',
        keyDeliverables: ['Domain Mapping & Fast Propagation', 'Business Email Setup (SPF, DKIM, DMARC)', 'Cloudflare DDoS & WAF Protection', 'Force-HTTPS & Canonical Redirects'],
        idealFor: 'Businesses facing email spam issues, SSL errors, or migrating domain registrars.'
      },
      'Automated CI/CD & GitHub Actions': {
        summary: 'Automated build, test, and zero-downtime deployment pipelines triggered on every Git commit or pull request with 1-click rollback.',
        keyDeliverables: ['GitHub Actions CI/CD YAML Scripts', 'Zero-Downtime Deployment to VPS/Cloud', 'Encrypted GitHub Secrets Management', '1-Click Version Rollback'],
        idealFor: 'Developers and software teams tired of manual SSH deployments and server crashes.'
      }
    }
  },

  'srv-7': {
    serviceId: 'srv-7',
    serviceTitle: 'Website Maintenance',
    headline: 'Continuous SLA & Site Retainer Package: Everything Included & Delivered',
    subheadline: '24/7/365 uptime monitoring, security patching, core library upgrades, performance tuning, and guaranteed rapid bug fixes for mission-critical web assets.',
    guarantees: [
      {
        title: '24/7/365 Uptime Monitoring',
        description: 'Automated 60-second ping checks from 12 global locations with instant developer escalation.',
        badge: '99.99% Uptime'
      },
      {
        title: '15-Minute Emergency Response SLA',
        description: 'Guaranteed rapid triage and hotfixes for critical security alerts, database locks, or unexpected downtime.',
        badge: '15-Min Response'
      },
      {
        title: 'Automated Daily Off-Site Backups',
        description: 'Daily encrypted database and code snapshots stored across redundant cloud locations with 1-click restore.',
        badge: 'Daily Backups'
      },
      {
        title: 'Direct WhatsApp / Slack Access',
        description: 'Private priority channel directly with Muhammad Usman Afzal and lead engineering team.',
        badge: 'Direct VIP Line'
      }
    ],
    deliverables: [
      {
        id: 'deliv-mnt-1',
        title: '24/7 Real-Time Uptime & Heartbeat Monitoring',
        description: 'Multi-region synthetic ping monitors testing your site every 60 seconds. Instant SMS and phone escalation if latency spikes or downtime occurs.',
        format: 'Live Status Dashboard URL + Incident Alerts',
        tag: 'Support & SLA',
        iconType: 'zap'
      },
      {
        id: 'deliv-mnt-2',
        title: 'Core Dependency & Security Patching',
        description: 'Routine updates to React, Next.js, npm packages, database drivers, and security modules to patch emerging CVE vulnerabilities.',
        format: 'Security Audit & Changelog',
        tag: 'Security',
        iconType: 'shield'
      },
      {
        id: 'deliv-mnt-3',
        title: 'Automated Encrypted Cloud Backups',
        description: 'Full database and asset snapshots backed up to isolated Amazon S3 storage with point-in-time recovery and 1-click restore.',
        format: 'Automated S3 Snapshots',
        tag: 'Infrastructure',
        iconType: 'database'
      },
      {
        id: 'deliv-mnt-4',
        title: 'Continuous Google Core Web Vitals & Speed Audits',
        description: 'Ongoing monitoring of LCP, FID, and CLS scores with proactive asset compression, database query index tuning, and cache re-validation.',
        format: 'Monthly PageSpeed & Performance Scorecard',
        tag: 'Performance',
        iconType: 'zap'
      },
      {
        id: 'deliv-mnt-5',
        title: 'Dedicated Monthly Developer Hours for Revisions',
        description: 'Included developer hours each month for text updates, banner changes, new section additions, form integrations, or layout tweaks.',
        format: 'Monthly Retainer Task Allocation',
        tag: 'Core Asset',
        iconType: 'code'
      },
      {
        id: 'deliv-mnt-6',
        title: 'Priority Rapid Bug Fixing & Emergency Hotfixes',
        description: 'Expedited queue handling: any reported bug or layout anomaly is assigned to a senior engineer immediately under guaranteed SLA.',
        format: 'Priority GitHub Issue Tracking + SLA',
        tag: 'Support & SLA',
        iconType: 'check'
      },
      {
        id: 'deliv-mnt-7',
        title: 'Malware Scans, Firewall & SSL Renewal Audits',
        description: 'Daily automated scans for malicious script injections, unauthorized file modifications, spam bots, and upcoming SSL expiration warnings.',
        format: 'Daily Automated Security Health Scans',
        tag: 'Security',
        iconType: 'shield'
      },
      {
        id: 'deliv-mnt-8',
        title: 'Monthly Executive Performance & Health Report',
        description: 'Comprehensive monthly PDF outlining uptime percentage, visitor traffic trends, resolved support tickets, and strategic improvement suggestions.',
        format: 'Executive Summary PDF Report',
        tag: 'Support & SLA',
        iconType: 'layout'
      }
    ],
    subcategoryDetails: {
      'Bug Fixing': {
        summary: 'Emergency troubleshooting and rapid resolution of broken layouts, form failures, checkout errors, and API integration drops.',
        keyDeliverables: ['Root Cause Diagnostics', 'Regression Testing', 'Zero-Downtime Hotfix Deploy', 'Incident Post-Mortem Report'],
        idealFor: 'Businesses losing revenue due to intermittent site bugs or checkout drop-offs.'
      },
      'Updates': {
        summary: 'Regular content updates, product additions, seasonal banners, team member profiles, and modernizing visual sections.',
        keyDeliverables: ['Copywriting & Image Replacements', 'Promotional Banner Placement', 'New Landing Section Creation', 'Third-Party Widget Integration'],
        idealFor: 'Active companies needing an on-demand web team without hiring full-time staff.'
      },
      'Performance Optimization': {
        summary: 'Deep code and server profiling to eliminate sluggish page transitions, optimize database queries, and maintain 99+ Lighthouse scores.',
        keyDeliverables: ['Asset Compression Pipeline', 'Database Query Optimization', 'Edge Cache Invalidation Rules', 'Core Web Vitals Compliance'],
        idealFor: 'High-traffic websites, media publishers, and luxury brands where speed equals revenue.'
      }
    }
  }
};
