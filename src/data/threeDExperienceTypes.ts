export interface ThreeDPageBreakdownItem {
  title: string;
  purpose: string;
  keySections: string[];
}

export interface ThreeDTechnicalFeatureItem {
  title: string;
  description: string;
  category: '3D & Visuals' | 'Video & Motion' | 'Performance & FPS' | 'Interactivity & Controls' | 'Engineering & Code';
}

export interface ThreeDWorkflowPhaseItem {
  step: string;
  timeline: string;
  title: string;
  description: string;
  deliverables: string[];
}

export interface ThreeDHowItWorksInfo {
  summary: string;
  heroMechanics: string;
  subsequentSections: string;
  distinctiveValue: string;
}

export interface ThreeDVisualEffectItem {
  title: string;
  description: string;
}

export interface ThreeDSuitableIndustryItem {
  name: string;
  exampleUse: string;
  badge?: string;
}

export interface ThreeDDifferentiationInfo {
  vsOtherTypes: string;
  idealClientGoal: string;
}

export interface ThreeDExperienceTypeInfo {
  id: string;
  name: string;
  tagline: string;
  whatIsIt: string;
  whatClientGets: string[];
  pagesIncluded?: string[];
  keyFeatures: string[];
  designAndResponsive: string;
  bestFor: string;
  estimatedDelivery: string;
  isCustom?: boolean;
  heroImage: string;
  badge?: string;
  categoryPill?: string;
  pageBreakdown?: ThreeDPageBreakdownItem[];
  technicalFeatures?: ThreeDTechnicalFeatureItem[];
  workflowPhases?: ThreeDWorkflowPhaseItem[];
  recommendedAddOns?: string[];
  techStack?: string[];

  // Tailored breakdown
  howItWorks?: ThreeDHowItWorksInfo;
  visualEffects?: ThreeDVisualEffectItem[];
  suitableIndustries?: ThreeDSuitableIndustryItem[];
  differentiation?: ThreeDDifferentiationInfo;
}

export const THREE_D_EXPERIENCE_TYPES_DATA: ThreeDExperienceTypeInfo[] = [
  // =========================================================================
  // 1. INTERACTIVE 3D PRODUCT EXPERIENCES
  // =========================================================================
  {
    id: 'interactive-variant-studio',
    name: 'Interactive 3D Product Experiences',
    tagline: 'Hero product customizer with instant variant switching on a fixed backdrop, powered by GSAP scroll motion below.',
    badge: 'Hero Customizer & GSAP Motion',
    categoryPill: 'Hero Customizer & GSAP Motion',
    whatIsIt: 'Websites where visitors interact directly with your product in the hero section. Clicking arrows or swatches seamlessly switches colors, finishes, and models on a stable backdrop, while subsequent sections reveal technical details through custom GSAP scroll animations.',
    whatClientGets: [
      'Interactive Hero Product Stage',
      'Instant Color, Finish & Model Switching',
      'Fluid Easing Variant Transitions',
      'GSAP Scroll-Triggered Spec Reveals',
      'Interactive Component Hotspots',
      'Mobile Touch & Swipe Gestures',
      'Production Edge CDN & Full Code Handover'
    ],
    pagesIncluded: [
      'Interactive Hero Stage (Direct variant controls on a stable canvas)',
      'GSAP Narrative Scroll (Component breakdown and feature reveals)',
      'Interactive Spec Hotspots (Clickable material and engineering callouts)',
      'Conversion Action Bar (Sticky inquiry/checkout bar synced to active variant)'
    ],
    keyFeatures: [
      'Direct hero interaction: click arrows or swatches to switch product styles instantly',
      'Stable ambient background stays locked, keeping complete focus on product changes',
      'Cinematic easing curves ensure variant swaps feel fluid and seamless',
      'Subsequent sections feature custom GSAP scroll-triggered feature reveals'
    ],
    pageBreakdown: [
      {
        title: 'Stage 01: Ambient Studio Canvas',
        purpose: 'Provides a clean backdrop and lighting that stay locked as products switch.',
        keySections: ['Studio lighting', 'Contact floor shadow', 'Brand typography']
      },
      {
        title: 'Stage 02: Variant Switcher Engine',
        purpose: 'Renders the product center-stage with instant color, finish, and style controls.',
        keySections: ['Arrow navigation', 'Color swatches', 'Smooth morph easing']
      },
      {
        title: 'Stage 03: GSAP Feature Reveals',
        purpose: 'Guides visitors through technical specifications with scroll-triggered animations.',
        keySections: ['ScrollTrigger reveals', 'Interactive hotspots', 'Conversion action']
      }
    ],
    technicalFeatures: [
      {
        title: 'Direct Hero Interaction Binding',
        description: 'Zero-delay click and swipe controls mapped directly to product states.',
        category: 'Interactivity & Controls'
      },
      {
        title: 'Fixed Ambient Canvas Isolation',
        description: 'Separates the background layer to keep 100% focus on product morphing.',
        category: '3D & Visuals'
      },
      {
        title: 'GSAP ScrollTrigger Pipeline',
        description: 'Choreographs component entrances and spec callouts on scroll.',
        category: 'Video & Motion'
      },
      {
        title: 'Pre-Cached Asset Pipeline',
        description: 'Preloaded textures ensuring instant switching with zero lag.',
        category: 'Performance & FPS'
      }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Asset & Variant Prep',
        description: 'Map product colors, materials, and angles from client renders or photos.',
        deliverables: ['Variant Asset Map', 'Optimized Textures']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'Hero Interaction Engine',
        description: 'Develop the fixed canvas, arrow/swatch controls, and smooth easing transitions.',
        deliverables: ['Interactive Hero Canvas', 'Transition Easing']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'GSAP Scroll Choreography',
        description: 'Build scroll-triggered component reveals, spec hotspots, and conversion actions.',
        deliverables: ['GSAP Scroll Animations', 'Hotspot Callouts']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Launch & Handover',
        description: 'Optimize mobile gestures, verify 60 FPS performance, and deploy live.',
        deliverables: ['Global CDN Deployment', 'Complete Source Code']
      }
    ],
    recommendedAddOns: [
      'Interactive Component Hotspots (Clickable spec pins on active variant)',
      'Direct Headless Cart & Stripe Checkout Integration',
      'Tactile Audio Foley FX (Subtle audio clicks on variant swap)',
      'Multi-Angle Perspective Toggle'
    ],
    techStack: ['Custom Code', 'Shopify 3D Integration', 'WordPress & WooCommerce 3D', 'Three.js & 3D WebGL', 'GSAP', 'Tailwind CSS'],
    designAndResponsive: '60 FPS framerate with adaptive texture resolution and touch-friendly mobile controls.',
    bestFor: 'Sneakers & footwear, luxury watches, audio gear, consumer electronics, and modern DTC brands.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',

    howItWorks: {
      summary: 'Visitors configure products directly in the hero section, while GSAP powers interactive reveals as they scroll.',
      heroMechanics: 'Visitors use arrows or color swatches to switch variants smoothly on a steady, locked studio background.',
      subsequentSections: 'Below the hero, GSAP ScrollTrigger reveals component specs and craftsmanship as users scroll down.',
      distinctiveValue: 'Self-directed product exploration in the hero paired with dynamic scroll storytelling below.'
    },
    visualEffects: [
      {
        title: 'Fixed Ambient Canvas',
        description: 'Locked studio lighting and floor shadows keep full focus on the product.'
      },
      {
        title: 'Fluid Variant Morphing',
        description: 'Custom cubic-bezier curves ensure product swaps feel natural and seamless.'
      },
      {
        title: 'GSAP Scroll-Triggered Entrances',
        description: 'Subsequent sections cascade smoothly into view to highlight engineering details.'
      },
      {
        title: 'Interactive Spec Hotspots',
        description: 'Clickable pins expand into frosted cards detailing craftsmanship and materials.'
      }
    ],
    suitableIndustries: [
      {
        name: 'Sneakers & Footwear',
        exampleUse: 'Switch colorways, sole styles, and materials directly in the hero.',
        badge: 'High Conversion'
      },
      {
        name: 'Haute Horlogerie & Watches',
        exampleUse: 'Toggle dials, bezel metals (gold, titanium), and strap choices.',
        badge: 'Luxury E-Commerce'
      },
      {
        name: 'Consumer Electronics & Audio',
        exampleUse: 'Showcase headphones and hardware across finishes and editions.',
        badge: 'Tech Flagship'
      },
      {
        name: 'Designer Eyewear & Fashion',
        exampleUse: 'Switch frame silhouettes, lens tints, and materials in real time.',
        badge: 'Fashion & DTC'
      }
    ],
    differentiation: {
      vsOtherTypes: 'Choose Interactive 3D Product Experiences when buyers need to customize colors and styles directly in the hero before exploring animated features below.',
      idealClientGoal: 'Ideal for conversion-driven brands where customizable finishes and style choices drive purchase decisions.'
    }
  },

  // =========================================================================
  // 2. CINEMATIC 3D WEBSITES
  // =========================================================================
  {
    id: 'cinematic-video-atmosphere',
    name: 'Cinematic 3D Websites',
    tagline: 'Full-screen cinematic 3D animated video backgrounds across sections for an immersive luxury brand presence.',
    badge: 'Cinematic Video Immersion',
    categoryPill: 'Full-Screen Video Atmospheres',
    whatIsIt: 'Websites using full-screen cinematic 3D animated video backgrounds across multiple sections. Key sections feature continuous looping video atmospheres, while supporting sections pair dedicated 3D visuals with frosted glass typography for a prestige brand experience.',
    whatClientGets: [
      'Multi-Section 3D Video Background Engine',
      'Continuous Looping Video for Flagship Sections',
      'Dedicated 3D Visuals & Stills for Supporting Sections',
      'Frosted Glassmorphism Typography Overlays',
      'Ambient Soundscape with Interactive Audio Toggle',
      'Sub-2MB Fast Streaming (WebM + MP4)',
      'Production Edge CDN & Full Code Handover'
    ],
    pagesIncluded: [
      'Cinematic Hero Section (Full-bleed 4K looping 3D video atmosphere)',
      'Continuous Video Highlight Sections (Ambient video driving brand mood)',
      'Editorial Visual Sections (Curated 3D stills and product narrative)',
      'Interactive Audio Controller (Discreet ambient sound toggle)'
    ],
    keyFeatures: [
      'Full-screen 3D video backgrounds deliver a high-fashion, film-quality brand atmosphere',
      'Multi-section pacing: continuous video in hero zones, dedicated 3D visuals in others',
      'Frosted glass overlays ensure editorial contrast and crystal-clear text readability',
      'Sub-2MB dual-codec streaming guarantees instant playback with zero buffering'
    ],
    pageBreakdown: [
      {
        title: 'Stage 01: Atmosphere Strategy',
        purpose: 'Determines which sections feature continuous video loops and which use static visuals.',
        keySections: ['Hero video atmosphere', 'Ambient highlights', 'Supporting visual cards']
      },
      {
        title: 'Stage 02: Compression & Loop Mastering',
        purpose: 'Optimizes video streams under 2MB while preserving high-definition visual fidelity.',
        keySections: ['Dual codec (WebM + MP4)', 'Seamless loop points', 'Zero-buffer preload']
      },
      {
        title: 'Stage 03: Glass UI & Audio Design',
        purpose: 'Ensures editorial typography floats with perfect contrast over moving video.',
        keySections: ['Frosted glass cards', 'Contrast gradients', 'Sound toggle indicator']
      }
    ],
    technicalFeatures: [
      {
        title: 'Multi-Section Video Stream Optimization',
        description: 'Hardware-accelerated decoding that auto-pauses off-screen sections to save battery.',
        category: 'Performance & FPS'
      },
      {
        title: 'Dual Codec Delivery (WebM + H.264)',
        description: 'Next-gen WebM for modern browsers with MP4 fallback for universal compatibility.',
        category: 'Video & Motion'
      },
      {
        title: 'Frosted Glassmorphism Compositing',
        description: 'Backdrop blur layers that preserve 100% WCAG text contrast over moving video.',
        category: '3D & Visuals'
      },
      {
        title: 'Mobile Low-Power Battery Guard',
        description: 'Smart battery detection that reduces mobile decoding overhead gracefully.',
        category: 'Engineering & Code'
      }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Footage & Asset Curation',
        description: 'Storyboard the flow, selecting continuous video sequences and 3D visual assets.',
        deliverables: ['Atmosphere Storyboard', 'Video Curation Plan']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'Loop Mastering & Compression',
        description: 'Master seamless loop points, encode dual-stream WebM/MP4, and engineer audio toggle.',
        deliverables: ['Seamless Video Loops', 'Sub-2MB Compression']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Glass UI Integration',
        description: 'Code backdrop-filter overlays, transition fades, and Safari autoplay compliance.',
        deliverables: ['Frosted Glass UI', 'Autoplay Compliance QA']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'CDN Deployment & Speed QA',
        description: 'Configure edge delivery, verify 95+ Lighthouse speed, and transfer source code.',
        deliverables: ['Global CDN Deployment', 'Complete Source Code']
      }
    ],
    recommendedAddOns: [
      'Custom Ambient Audio Soundscape (Tailored looping soundtrack for brand mood)',
      'Multi-Scene Section Video Switcher (Allows visitors to toggle backdrops)',
      'Cursor-Linked Video Parallax Shift',
      'Video Editing & Color Grading'
    ],
    techStack: ['Custom Code', 'Shopify Video Stores', 'WordPress & WooCommerce Video', 'HTML5 Video Engine', 'GSAP', 'Tailwind CSS'],
    designAndResponsive: 'Film-grade visual depth with zero buffering and intelligent section-by-section video pausing.',
    bestFor: 'Luxury products, perfumes & fragrances, fine jewelry, spirits & beverages, and luxury real estate.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',

    howItWorks: {
      summary: 'Envelops visitors in a luxury atmosphere using full-screen 3D video backgrounds in key sections, balanced with static visuals for speed.',
      heroMechanics: 'The hero opens with a looping 3D video backdrop, layered with frosted glass typography for crisp contrast.',
      subsequentSections: 'Subsequent sections balance continuous video highlights with static 3D visual cards for fast loading.',
      distinctiveValue: 'Delivers immediate, film-quality brand prestige and visual luxury from the moment the page opens.'
    },
    visualEffects: [
      {
        title: 'Full-Bleed 4K Video Backgrounds',
        description: 'Continuous motion bringing scenes to life with spatial sweeps and atmospheric depth.'
      },
      {
        title: 'Multi-Section Hybrid Pacing',
        description: 'Continuous video in hero zones balanced with dedicated 3D visual stills in supporting sections.'
      },
      {
        title: 'Frosted Glassmorphism Depth',
        description: 'Backdrop blur layers ensuring 100% WCAG contrast and crystal-clear readability.'
      },
      {
        title: 'Ambient Soundscape Controller',
        description: 'Subtle sound design with an interactive wave visualizer and discreet mute/unmute toggle.'
      }
    ],
    suitableIndustries: [
      {
        name: 'Luxury Perfumes & Fragrances',
        exampleUse: 'Fluid vapor trails, liquid motion, and botanical notes in full-screen video.',
        badge: 'High Prestige'
      },
      {
        name: 'Fine Jewelry & Watches',
        exampleUse: 'Refractive light caustics and diamond sparkle reflections in spatial depth.',
        badge: 'Ultra Luxury'
      },
      {
        name: 'Premium Beverages & Spirits',
        exampleUse: 'Effervescent liquids, ice condensation, and cellar barrels creating sensory appeal.',
        badge: 'Sensory Appeal'
      },
      {
        name: 'Luxury Real Estate & Architecture',
        exampleUse: 'Cinematic drone sweeps, architectural light studies, and terrace views.',
        badge: 'High Value'
      }
    ],
    differentiation: {
      vsOtherTypes: 'Choose Cinematic 3D Websites when your primary goal is emotional brand prestige, atmospheric world-building, and immediate visual awe.',
      idealClientGoal: 'Perfect for luxury brands seeking a film-like presence with universal device compatibility and instant loading speeds.'
    }
  },

  // =========================================================================
  // 3. SCROLL-DRIVEN ANIMATION
  // =========================================================================
  {
    id: 'scroll-driven-video-hero',
    name: 'Scroll-Driven Animation',
    tagline: 'Frame-by-frame animation where scrolling down advances motion and scrolling up reverses it for Apple-style product reveals.',
    badge: 'Apple-Style Frame Scrubbing',
    categoryPill: 'Scroll-Scrubbed Image Sequences',
    whatIsIt: 'Websites where an animation sequence is divided into high-resolution image frames. As visitors scroll down, frames progress smoothly like a video; scrolling up reverses the sequence frame-by-frame. This allows products to gradually open, rotate, or reveal internal engineering in direct sync with scroll gestures.',
    whatClientGets: [
      'Frame-by-Frame Scroll Scrubbing Engine',
      'Bi-Directional Forward & Reverse Motion Control',
      'Sticky Pinned Viewport Container (GSAP ScrollTrigger)',
      'Gradual Product Reveals (Open, Rotate, Explode)',
      'HTML5 Canvas 60 FPS requestAnimationFrame Loop',
      'Synchronized Milestone Spec Overlays',
      'Production Edge CDN & Full Code Handover'
    ],
    pagesIncluded: [
      'Sticky Viewport Stage (Pins the hero while scroll gestures command frame progression)',
      'Interactive Scrubbing Timeline (Maps 0% to 100% of user scroll to precise sequence frames)',
      'Kinetic Spec Milestones (Callout cards that fade in at specific sequence timestamps)',
      'Seamless Section Exit (Unpins gracefully into pricing, tech specs, or direct inquiry)'
    ],
    keyFeatures: [
      'Animation sequence divided into precision-optimized image frames',
      'User scroll speed directly commands animation playback forward and in reverse',
      'Product gradually opens, rotates, or reveals internal engineering as the user scrolls',
      'HTML5 Canvas rendering engine guarantees rock-solid 60 FPS without video stutter'
    ],
    pageBreakdown: [
      {
        title: 'Stage 01: Frame Extraction & Optimization',
        purpose: 'Extracts WebP image frames from 3D animations and optimizes compression under 2MB.',
        keySections: ['WebP frame encoding', 'Preload cache manager', 'Scroll distance calibration']
      },
      {
        title: 'Stage 02: Pinned Canvas Scrubbing Engine',
        purpose: 'Develops the GSAP ScrollTrigger pin container and HTML5 Canvas frame painter.',
        keySections: ['requestAnimationFrame canvas loop', 'Lenis inertial momentum', 'Bi-directional frame painter']
      },
      {
        title: 'Stage 03: Synchronized Milestone Callouts',
        purpose: 'Binds typography, specs, and feature callouts to trigger at exact frame percentages.',
        keySections: ['Floating engineering specs', 'Opacity interpolation', 'Graceful section unpin exit']
      }
    ],
    technicalFeatures: [
      {
        title: 'HTML5 Canvas Frame Pre-Renderer',
        description: 'Renders sequential frames using requestAnimationFrame for stutter-free 60 FPS playback.',
        category: 'Performance & FPS'
      },
      {
        title: 'GSAP ScrollTrigger Viewport Pinning',
        description: 'Locks the viewport while translating scroll distance into continuous frame progression.',
        category: 'Interactivity & Controls'
      },
      {
        title: 'Bi-Directional Frame Cache',
        description: 'Keeps cached frames in memory so reverse scrolling upward is instantaneous and smooth.',
        category: 'Engineering & Code'
      },
      {
        title: 'Lenis Inertial Momentum Smoothing',
        description: 'Smooths trackpad and mousewheel gestures into silky, video-like frame motion.',
        category: 'Video & Motion'
      }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Frame Sequence Preparation',
        description: 'Extract and compress optimized image frame sequences from 3D renders or video.',
        deliverables: ['Frame Storyboard', 'WebP Frame Optimization']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'Canvas Scrubbing Engine',
        description: 'Code the GSAP ScrollTrigger container, canvas renderer, and bi-directional scrub loop.',
        deliverables: ['Canvas Scrubbing Engine', 'GSAP ScrollTrigger Pin Setup']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Milestone Spec Callouts',
        description: 'Sync floating callouts to exact frame milestones and calibrate touch gestures.',
        deliverables: ['Synchronized Spec Milestones', 'Mobile Touch Scrubbing']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Launch & Certification',
        description: 'Certify 60 FPS across desktop and mobile, deploy to global CDN, and hand over source code.',
        deliverables: ['Global CDN Deployment', 'Complete Source Code']
      }
    ],
    recommendedAddOns: [
      'Clickable Hotspots During Scroll Scrubbing (Interact with components at specific frames)',
      'Scroll-Linked Audio Foley (Subtle mechanical clicks synchronized to scroll motion)',
      'Dual Mode: Auto-Play Button + Manual Scroll Scrubbing Toggle',
      'Multi-Chapter Milestone Navigation'
    ],
    techStack: ['Custom Code', 'Shopify Interactive', 'WordPress & WooCommerce Interactive', 'Three.js & GSAP', 'HTML5 Canvas', 'Lenis Smooth Scroll'],
    designAndResponsive: 'Edge-to-edge frame rendering pinned to screen height, with adaptive touch sensitivity.',
    bestFor: 'Flagship tech hardware reveals, automotive & EVs, complex mechanical watches, and precision consumer audio.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',

    howItWorks: {
      summary: 'Binds an animation sequence to user scrolling: scrolling down progresses the animation, while scrolling up reverses it smoothly.',
      heroMechanics: 'The viewport gently pins while scrolling. Scrolling down acts as a film scrubber to open or rotate the product; scrolling up reverses.',
      subsequentSections: 'Once the sequence finishes, the container unpins seamlessly into technical specifications and inquiry options.',
      distinctiveValue: 'Transforms passive reading into tactile product exploration reminiscent of Apple and Tesla flagship reveals.'
    },
    visualEffects: [
      {
        title: 'Frame-by-Frame Scrubbing',
        description: 'User scroll gestures directly advance and reverse animation frames in real time.'
      },
      {
        title: 'Internal Component Exploded Views',
        description: 'Products gradually peel open or rotate to showcase hidden engineering and mechanisms.'
      },
      {
        title: 'Pinned Viewport Immersion',
        description: 'Locks the screen during the sequence so the narrative unfolds without accidental scrolling past.'
      },
      {
        title: 'Synchronized Kinetic Overlays',
        description: 'Engineering specs and headlines fade in and out at exact millisecond frame timestamps.'
      }
    ],
    suitableIndustries: [
      {
        name: 'Flagship Tech Hardware',
        exampleUse: 'Laptops, phones, and robotics opening up to reveal microchips and internal hardware.',
        badge: 'Flagship Tech'
      },
      {
        name: 'Complex Mechanical Watches',
        exampleUse: 'Disassemble intricate balance wheels, escapements, and gear layers on scroll.',
        badge: 'Horology'
      },
      {
        name: 'Automotive & Electric Vehicles',
        exampleUse: 'Reveal chassis aerodynamics, skateboard battery packs, and interior cockpits.',
        badge: 'Automotive'
      },
      {
        name: 'Precision Audio Hardware',
        exampleUse: 'Acoustic diaphragms and neodymium magnets expanding outward as you scroll.',
        badge: 'Acoustic Tech'
      }
    ],
    differentiation: {
      vsOtherTypes: 'Choose Scroll-Driven Animation when you have a flagship, highly engineered product whose internal beauty and build quality are best revealed through tactile, frame-by-frame scroll storytelling.',
      idealClientGoal: 'Perfect for brands aiming to create a jaw-dropping product launch that wows investors and discerning customers.'
    }
  }
];
