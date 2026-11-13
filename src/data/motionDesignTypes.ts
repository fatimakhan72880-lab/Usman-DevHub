export interface MotionDesignWorkflowPhase {
  step: string;
  timeline: string;
  title: string;
  description: string;
  deliverables: string[];
}

export interface MotionDesignTechnicalFeature {
  title: string;
  description: string;
  category: '3D Simulation & Physics' | 'Rendering & Materials' | 'Animation & Choreography' | 'Sound Design & Audio' | 'Delivery & Formats';
}

export interface MotionDesignTypeInfo {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  categoryPill?: string;
  durationRange: string;
  maxDuration: string;
  whatIsIt: string;
  whatClientGets: string[];
  deliverableFormats: string[];
  bestFor: string;
  estimatedDelivery: string;
  heroImage: string;
  sampleHighlights: { title: string; desc: string }[];
  workflowPhases?: MotionDesignWorkflowPhase[];
  technicalFeatures?: MotionDesignTechnicalFeature[];
  aspectRatios?: string[];
  toolsUsed?: string[];
}

export const MOTION_DESIGN_TYPES_DATA: MotionDesignTypeInfo[] = [
  {
    id: 'logo-animation',
    name: 'Logo Animation',
    tagline: 'Cinematic 3D logo reveals with realistic materials, dynamic lighting, and custom sound design.',
    badge: 'Brand Identity & Video Intros',
    categoryPill: 'Dimensional Logo Ident',
    durationRange: 'Tailored to Brief',
    maxDuration: 'Custom Length',
    whatIsIt: 'Custom 3D logo reveals and animated idents created from your vector artwork. Delivered in 4K 60 FPS with transparent backgrounds for website heroes, video openers, and social channels.',
    whatClientGets: [
      'Dimensional 3D Vector Extrusion & Realistic Material Shading',
      '4K Ultra HD 60 FPS Master Video (ProRes & MP4)',
      'Transparent Background WebM & Alpha MOV (for web overlays)',
      'Custom Sound Effects (SFX) & Audio Impact Design',
      'Landscape 16:9 (YouTube/Deck) + Vertical 9:16 (Reels/TikTok) Formats',
      'Seamless Looping Variant for stream overlays & digital displays',
      'Light & Dark Background Lighting Presets',
      '100% Commercial Broadcasting & Intellectual Property Rights'
    ],
    deliverableFormats: [
      '4K Master MP4 (H.264 / H.265 High Bitrate)',
      'ProRes 4444 with Transparent Alpha Channel',
      'Transparent WebM for Website Hero Overlays',
      'Lottie / JSON Micro-Animation File',
      'High-Resolution 4K Still Poster (PNG)'
    ],
    bestFor: 'Startups, YouTube channels, keynote presentations, web headers, and gaming brands.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    aspectRatios: ['16:9 Landscape', '9:16 Vertical Reel', '1:1 Square'],
    toolsUsed: ['Cinema 4D', 'Octane Render', 'After Effects', 'DaVinci Resolve'],
    sampleHighlights: [
      { title: 'Dynamic Light Choreography', desc: 'Precision rim lights and reflections highlighting brand contours' },
      { title: 'Transparent Alpha WebM', desc: 'Embed directly on web pages with no background boxes' },
      { title: 'Custom Foley Sound Sync', desc: 'Studio-grade audio impacts and swooshes mastered for clarity' }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Vector Ingestion & Style Direction',
        description: 'Review vector assets, define motion personality, and create style frames.',
        deliverables: ['Vector prep & 3D extrusion preview', 'Material moodboard', 'Camera plan']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: '3D Simulation & Camera Rigging',
        description: 'Choreograph camera movement, particle dynamics, and fluid logo assembly.',
        deliverables: ['Animation preview draft', 'Camera trajectory sign-off']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'GPU Raytracing & Materials',
        description: 'Render photorealistic frames with physical materials, reflections, and motion blur.',
        deliverables: ['High-resolution 4K render sequence', 'Lighting composite']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Sound Design & Final Delivery',
        description: 'Add cinematic sound effects, finalize color grading, and export all formats.',
        deliverables: ['4K ProRes & MP4 masters', 'Transparent WebM file', 'Commercial license']
      }
    ],
    technicalFeatures: [
      {
        title: 'Volumetric Raytracing',
        description: 'Physically accurate lighting with realistic reflections and refractions.',
        category: 'Rendering & Materials'
      },
      {
        title: 'Alpha Channel Transparency',
        description: 'Transparent background for seamless integration over any web design.',
        category: 'Delivery & Formats'
      },
      {
        title: 'Custom Sound Design (SFX)',
        description: 'Tailored audio impacts and whooshes balanced for all devices.',
        category: 'Sound Design & Audio'
      },
      {
        title: '60 FPS Fluidity',
        description: 'Silky-smooth frame cadence with crisp motion clarity.',
        category: 'Animation & Choreography'
      }
    ]
  },
  {
    id: 'product-animation',
    name: 'Product Animation',
    tagline: 'Photorealistic 3D product visualizers, exploded assembly views, and hardware reveals.',
    badge: 'Hardware & E-Commerce Showcase',
    categoryPill: 'Hyper-Realistic Product Visualizer',
    durationRange: 'Tailored to Brief',
    maxDuration: 'Custom Length',
    whatIsIt: 'High-impact 3D product animations engineered to showcase physical hardware, consumer electronics, and luxury goods with realistic materials, smooth camera moves, and exploded views.',
    whatClientGets: [
      '3D CAD / Mesh Optimization & Texture Mapping from Reference Photos',
      'Exploded Mechanical Part Disassembly showing internal components',
      'Cinematic Camera Fly-Throughs with Dynamic Depth of Field',
      'Photorealistic PBR Materials (Metals, Glass, Carbon, Polymers)',
      '4K Ultra HD Master Video (15s – 60s Commercial Quality)',
      '360° Smooth Turntable Loop Animation for Storefronts',
      '5x Ultra-High Resolution 4K Still Renders for Marketing',
      'Fast-Paced Social Cutdowns (15s & 6s Ad Formats)',
      'Custom Motion Graphic Spec Badges & Feature Callouts'
    ],
    deliverableFormats: [
      '4K UHD ProRes Master File',
      'Web-Optimized H.264 / H.265 MP4 for fast streaming',
      '16:9 Landscape & 9:16 Vertical (Reels/TikTok)',
      'Still Render Bundle: 5x 4K PNGs with Transparent Background',
      'Turntable 360 Loop (Seamless MP4)'
    ],
    bestFor: 'Consumer electronics, luxury timepieces, cosmetics, industrial products, and Kickstarter campaigns.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
    aspectRatios: ['16:9 Landscape', '9:16 Vertical Reel', '1:1 Square', '4:5 Feed'],
    toolsUsed: ['Cinema 4D', 'Octane Render', 'Substance Painter', 'After Effects', 'DaVinci Resolve'],
    sampleHighlights: [
      { title: 'Exploded View Assembly', desc: 'Smooth mechanical part expansion revealing internal engineering' },
      { title: 'Photorealistic PBR Shading', desc: 'Tactile roughness, metallic, and refraction materials' },
      { title: 'Multi-Channel Ad Cuts', desc: '16:9 website hero master with 9:16 vertical cuts for social ads' }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Asset Ingestion & Materials',
        description: 'Import client product assets, applying photorealistic PBR materials and studio lighting.',
        deliverables: ['Product asset inspection', 'Material test renders', 'Lighting setup']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'Camera Choreography & Exploded Rig',
        description: 'Rig internal parts for mechanical disassembly and set up dynamic macro camera angles.',
        deliverables: ['Animation draft preview', 'Key camera angles lock-in']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'GPU Raytracing & Rendering',
        description: 'Render multi-pass 4K frames with physical lighting caustics and depth passes.',
        deliverables: ['4K multi-layer sequence', 'Motion blur and depth passes']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Color Grading, Audio & Delivery',
        description: 'Add typographic spec callouts, color grade, sync dynamic sound FX, and export.',
        deliverables: ['4K Master Commercial Video', '15s & 30s Social Cuts', '5x Still Render Pack']
      }
    ],
    technicalFeatures: [
      {
        title: 'Sub-Millimeter Part Rigging',
        description: 'Hierarchical rigging allowing complex exploded views of mechanical assemblies.',
        category: 'Animation & Choreography'
      },
      {
        title: 'Physically Based Shading (PBR)',
        description: 'Micro-surface detail, brushed metals, and optical coatings for tactile realism.',
        category: 'Rendering & Materials'
      },
      {
        title: 'Dynamic Feature Callouts',
        description: 'Animated kinetic pins highlighting specs, battery life, and materials.',
        category: 'Delivery & Formats'
      },
      {
        title: 'E-Commerce Turntable Loop',
        description: 'Smooth 360-degree continuous rotation for web storefronts.',
        category: '3D Simulation & Physics'
      }
    ]
  },
  {
    id: 'brand-animation',
    name: 'Brand Animation',
    tagline: 'Cinematic 3D brand commercial films, spatial environments, and kinetic visual storytelling.',
    badge: 'Enterprise Brand Identity & Keynotes',
    categoryPill: 'Cinematic Brand Film',
    durationRange: 'Tailored to Brief',
    maxDuration: 'Custom Length',
    whatIsIt: 'Compelling short-form 3D brand videos combining abstract environments, fluid dynamics, kinetic typography, and synchronized sound design to elevate your brand presence.',
    whatClientGets: [
      'Comprehensive Creative Storyboard & Visual Style Frames',
      'Custom 3D Abstract Environments & Atmospheric Lighting',
      'Dynamic Fluid / Fabric / Particle Simulations',
      'Kinetic 3D Typography & Value Proposition Animation',
      '30s – 60s Brand Video in 4K UHD 60 FPS',
      'Original Foley & Cinematic Musical Sound Mixing',
      'Professional Voiceover Sync & Audio Master Track',
      'Color Graded in DaVinci Resolve',
      'Multi-Platform Suite: 16:9 Main Commercial & 9:16 Mobile Cuts'
    ],
    deliverableFormats: [
      '4K ProRes 422HQ Master Film',
      'H.264 / H.265 Web Stream Master',
      '16:9 Landscape + 9:16 Vertical Reel Formats',
      'Clean Textless Version for International Use',
      'Broadcast-Ready Audio Master'
    ],
    bestFor: 'SaaS companies, fintech, corporate rebrands, investor pitch decks, and digital campaigns.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80',
    aspectRatios: ['16:9 Cinematic', '9:16 Vertical Reel', '1:1 Square'],
    toolsUsed: ['Houdini', 'Cinema 4D', 'Redshift', 'After Effects', 'DaVinci Resolve Studio'],
    sampleHighlights: [
      { title: 'Abstract 3D Landscapes', desc: 'Surreal spatial worlds and fluid particle simulations' },
      { title: 'Kinetic 3D Typography', desc: 'Dimensional titles interacting with lighting and geometry' },
      { title: 'Film-Grade Color Grading', desc: 'Cinematic color harmony and dynamic range tonality' }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Script & Style Frames',
        description: 'Craft a punchy 30s-60s script and create high-fidelity 3D visual style frames.',
        deliverables: ['30s-60s narrative script', 'Key style frames', 'Voiceover guidance']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: '3D Scene Assembly & Motion',
        description: 'Build 3D environments, set up lighting, and choreograph fluid simulations.',
        deliverables: ['Animatic video preview', 'Camera speed & timing lock']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Raytracing & Simulation Bake',
        description: 'Execute GPU render passes baking volumetric light and motion vector blur.',
        deliverables: ['Multi-pass 4K render sequence', 'Atmospheric compositing']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Audio Mixing & Final Master',
        description: 'Finalize voiceover, Foley sound effects, music mixing, and DaVinci color grading.',
        deliverables: ['4K ProRes & MP4 Master Film', '16:9 & 9:16 Deliverables', 'Textless Master']
      }
    ],
    technicalFeatures: [
      {
        title: 'Procedural Particle & Fluid Fields',
        description: 'Simulation physics driven by organic vector fields for elegant motion.',
        category: '3D Simulation & Physics'
      },
      {
        title: 'Volumetric Atmosphere & Lighting',
        description: 'True 3D light cone dispersion with particulate scattering for depth.',
        category: 'Rendering & Materials'
      },
      {
        title: 'Broadcast Audio Mixing',
        description: 'Balanced multi-stem sound design meeting streaming loudness standards.',
        category: 'Sound Design & Audio'
      },
      {
        title: '3D Kinetic Letterforms',
        description: 'Lettering casting physical shadows and transitioning with geometric elegance.',
        category: 'Animation & Choreography'
      }
    ]
  },
  {
    id: 'promo-videos',
    name: 'Promo Videos',
    tagline: 'High-energy 3D commercial promos, product launch trailers, and viral social campaign videos.',
    badge: 'High Conversion & Ad ROAS',
    categoryPill: 'Product Launch & Commercial Promo',
    durationRange: 'Tailored to Brief',
    maxDuration: 'Custom Length',
    whatIsIt: 'Fast-paced 3D promotional videos crafted with scroll-stopping 3-second hooks, dynamic beat-synced motion, and high-impact call-to-action endcards for social ad campaigns and product launches.',
    whatClientGets: [
      'High-Energy 30s–60s Commercial Promo Video (Full Story & Hook)',
      '15-Second Cutdown Optimized for Meta & TikTok Ads',
      '6-Second Bumper Ad for YouTube Pre-Roll Campaigns',
      'Dynamic 3D Product & UI Animations Synced to Music',
      'Bold Animated Value Callouts & Promotional Offer CTA',
      '9:16 Vertical + 16:9 Landscape + 1:1 Square Renders',
      'Burned-In Subtitles & Clean SRT Subtitle File for Silent Feeds',
      'End-Screen Offer Cards with Promo Codes & App Store Badges'
    ],
    deliverableFormats: [
      '4K & 1080p MP4 for YouTube, TikTok & Instagram',
      'Vertical 9:16 MP4 (1080x1920) for Reels & Shorts',
      'Square 1:1 MP4 for Social Feeds & Ads',
      'SRT Captions File + Burned-in Variant',
      'High-Resolution Still Poster for Video Thumbnails'
    ],
    bestFor: 'Mobile app launches, digital products, e-commerce drops, and paid ad funnels.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
    aspectRatios: ['9:16 Vertical Reel', '16:9 Landscape', '1:1 Square', '4:5 Feed'],
    toolsUsed: ['Cinema 4D', 'After Effects', 'Premiere Pro', 'DaVinci Resolve'],
    sampleHighlights: [
      { title: 'Scroll-Stopping 3-Second Hook', desc: 'Engineered to capture viewer attention immediately in social feeds' },
      { title: 'Multi-Aspect Ratio Ready', desc: 'Adapted natively for vertical 9:16, 16:9 horizontal, and square' },
      { title: 'High-Converting Offer CTA', desc: 'Punchy animated end-screens driving viewers to immediate action' }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Hook Strategy & Scripting',
        description: 'Define pain points, script 3-second hook, feature showcase, and call-to-action.',
        deliverables: ['Script & Timing Grid', 'Music track selection', 'Visual reference board']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: '3D Assets & Motion Rigging',
        description: 'Animate products, mockups, and kinetic text synced to the musical beat.',
        deliverables: ['Animation preview draft', 'Key text placement check']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Lighting & Renders',
        description: 'Render high-impact camera moves with motion blur, light sweeps, and color accents.',
        deliverables: ['Rendered 3D scene sequences', 'Multi-layer composite']
      },
      {
        step: '04',
        timeline: 'Phase 4',
        title: 'Sound Design, Captions & Delivery',
        description: 'Layer punchy sound FX, add captions, generate 9:16 and 16:9 cuts, and deliver.',
        deliverables: ['Main Commercial (16:9, 9:16, 1:1)', '15s & 6s Cutdowns', 'SRT Captions file']
      }
    ],
    technicalFeatures: [
      {
        title: 'Beat-Synced Editing',
        description: 'Frame cuts and camera transitions snapped to music for high watch retention.',
        category: 'Animation & Choreography'
      },
      {
        title: 'Cross-Platform Ad Formats',
        description: 'Safe zones ensuring text and essential action are never blocked by app UI.',
        category: 'Delivery & Formats'
      },
      {
        title: 'Kinetic Typography',
        description: 'Bold titles readable instantly during silent mobile playback.',
        category: 'Delivery & Formats'
      },
      {
        title: 'Commercial Sound Effects Library',
        description: 'Sub-bass drops, riser sweeps, and impacts licensed for commercial advertising.',
        category: 'Sound Design & Audio'
      }
    ]
  }
];
