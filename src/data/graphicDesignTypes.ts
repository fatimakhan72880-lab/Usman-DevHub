export interface GraphicDesignTypeInfo {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  whatIsIt: string;
  whatClientGets: string[];
  deliverableFormats: string[];
  bestFor: string;
  estimatedDelivery: string;
  heroImage: string;
  sampleHighlights: { title: string; desc: string }[];
}

export const GRAPHIC_DESIGN_TYPES_DATA: GraphicDesignTypeInfo[] = [
  {
    id: 'logo-design',
    name: 'Logo Design',
    tagline: 'Distinctive, high-impact vector logo design tailored to represent your brand identity.',
    badge: 'Brand Identity',
    whatIsIt: 'Professional logo design created from scratch. You get clean, memorable vector logos tailored to your industry, suitable for websites, social media, merchandise, and print.',
    whatClientGets: [
      '2 to 3 Unique Original Logo Concepts',
      'High-Resolution Vector Files (AI, SVG, EPS, PDF)',
      'Transparent Background Formats (PNG, WebP)',
      'Light & Dark Background Color Variants',
      'Favicon & Social Media Profile Avatar Crop',
      'Full Commercial Rights & Trademark Ownership',
      'Revisions Included Until Fully Satisfied'
    ],
    deliverableFormats: [
      'Vector Master (.AI, .SVG, .EPS)',
      'Transparent PNG (300 DPI High-Res)',
      'Web-Ready JPG & Favicon Kit',
      'Print-Ready PDF'
    ],
    bestFor: 'New startups, personal brands, business rebranding, shops, and digital businesses.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80',
    sampleHighlights: [
      { title: 'Clean & Minimalist', desc: 'Modern geometric shapes with timeless readability' },
      { title: 'Infinitely Scalable', desc: 'Looks crisp from a 16px favicon up to huge outdoor billboards' },
      { title: 'Ready to Use', desc: 'Instant formats for web, app, printing, and merchandise' }
    ]
  },
  {
    id: 'product-design',
    name: 'Product Design',
    tagline: 'Product packaging, bottle/box labels, and realistic 3D visual mockups.',
    badge: 'Packaging & Labels',
    whatIsIt: 'Eye-catching product packaging, bottle/box labels, pouch designs, and realistic 3D product mockups designed to attract customers and boost shelf and online store appeal.',
    whatClientGets: [
      'Custom Label & Packaging Box Layout Design',
      'Realistic 3D Product Mockup Renders (Front & Angled Views)',
      'Print-Ready Files with Die-lines & Bleeds (CMYK, 300 DPI)',
      'Editable Master Source Files (PSD / AI / Figma)',
      'Barcode, Ingredients & Specs Area Placement',
      'Full Commercial Printing Compatibility'
    ],
    deliverableFormats: [
      'Print-Ready PDF (CMYK + 3mm Bleed)',
      'Layered PSD / Adobe Illustrator Files',
      'High-Res 3D Mockup PNG & JPG (300 DPI)'
    ],
    bestFor: 'Physical goods, cosmetics, food & beverage, tech accessories, and e-commerce brands.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
    sampleHighlights: [
      { title: 'Realistic 3D Mockups', desc: 'Photorealistic views ready to display on your online store' },
      { title: 'Print Precision', desc: 'Exact millimeter measurements and die-lines for printing houses' },
      { title: 'Retail Shelf Appeal', desc: 'Colors and typography tuned to catch the buyer’s eye instantly' }
    ]
  },
  {
    id: 'thumbnail-design',
    name: 'Thumbnail Design',
    tagline: 'High-CTR, attention-grabbing thumbnails designed for YouTube and video platforms.',
    badge: 'High-CTR Focus',
    whatIsIt: 'Vibrant, high-contrast video thumbnails engineered to stand out in the feed, capture instant attention, and maximize click-through rates (CTR).',
    whatClientGets: [
      'Custom Designed 1080p Full HD Thumbnail (1920x1080)',
      'Bold, Readable Typography on Both Mobile & Desktop',
      'Subject & Face Cutouts with Glow, Shadows & Color Pop',
      'Optimized File Size for Fast Platform Upload (< 2MB)',
      'Quick Turnaround & Fast Revisions',
      'Editable Master Source File Option'
    ],
    deliverableFormats: [
      'Full HD JPG (1920x1080 optimized for YouTube)',
      'High-Res Transparent PNG',
      'Layered PSD / Canva / Figma File'
    ],
    bestFor: 'YouTube creators, podcasts, tutorials, businesses running video ads, and course creators.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    sampleHighlights: [
      { title: 'Click-Worthy Visuals', desc: 'Strong focal point, emotional contrast, and curiosity triggers' },
      { title: 'Mobile Screen Tested', desc: 'Tested for crystal-clear readability on small mobile feeds' },
      { title: 'Fast Delivery', desc: 'Get your thumbnails ready right on schedule with your video upload' }
    ]
  },
  {
    id: 'social-media-design',
    name: 'Social Media Design',
    tagline: 'Professional social media posts, story graphics, and promotional announcement banners.',
    badge: 'Social & Promo',
    whatIsIt: 'Clean, visually attractive graphics for social media channels. From Instagram carousels and promotional flyers to Facebook and LinkedIn banners, delivered ready to post.',
    whatClientGets: [
      'Custom Social Media Post Graphics (Square 1:1 & Story 9:16)',
      'Header Banners for LinkedIn, Twitter/X, and Facebook',
      'Promotional Sale, Discount & Event Announcements',
      'Branded Color Palette & Typography Consistency',
      'High-Resolution Image Exports Ready to Upload',
      'Editable Master Files for Future Text Tweaks'
    ],
    deliverableFormats: [
      'High-Res PNG (1080x1080 Square, 1080x1920 Story)',
      'Header Banners JPG (Exact Social Dimensions)',
      'Figma / PSD Editable Templates'
    ],
    bestFor: 'Businesses, founders, coaches, e-commerce stores, and digital marketing campaigns.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1200&q=80',
    sampleHighlights: [
      { title: 'Ready to Post', desc: 'Exported in exact dimensions for Instagram, LinkedIn, and Facebook' },
      { title: 'Brand Consistency', desc: 'Consistent visual identity across all your channels' },
      { title: 'Engaging Layouts', desc: 'Clean typography and imagery that stops user scrolling' }
    ]
  }
];
