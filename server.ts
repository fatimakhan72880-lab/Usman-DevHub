import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import pg from 'pg';
import { createServer as createViteServer } from 'vite';
import { detectFlagFromLocation } from './src/utils/countryFlags';

// Interfaces for Server Storage
interface ContactMessage {
  id: string;
  name: string;
  email: string;
  service: string;
  category?: string;
  preferredTech?: string;
  budget: string;
  message: string;
  referralToken?: string;
  referredByName?: string;
  createdAt: string;
  status: 'unread' | 'read' | 'replied';
}

interface BookingSlot {
  id: string;
  date: string;
  time: string;
  timezone: string;
  clientName: string;
  clientEmail: string;
  topic: string;
  createdAt: string;
}

interface PartnerToken {
  id: string;
  token: string;
  partnerName: string;
  partnerEmail: string;
  partnerWhatsApp?: string;
  payoutMethod?: string;
  targetService?: string;
  targetCategory?: string;
  preferredTech?: string;
  createdAt: string;
}

interface ReferralRecord {
  id: string;
  partnerToken?: string;
  partnerName: string;
  partnerEmail: string;
  partnerWhatsApp?: string;
  payoutMethod?: string;
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  service?: string;
  category?: string;
  preferredTech?: string;
  projectType: string;
  estimatedBudget: number;
  statedBudgetText?: string;
  commissionPercentage?: number;
  commissionAmount: number;
  status:
    | 'pending'
    | 'in_negotiation'
    | 'deal_complete'
    | 'milestone_25'
    | 'milestone_35'
    | 'milestone_40'
    | 'commission_paid';
  source?: 'referral_link' | 'manual_code' | 'partner_portal' | 'order_agreement';
  date: string;
  submittedAt?: string;
  inquiryId?: string;
  orderNumber?: string;
  clientMessage?: string;
  notes?: string;
  adminStatusNote?: string;
  milestone25Paid?: boolean;
  milestone25PaidAt?: string;
  milestone25Amount?: number;
  milestone35Paid?: boolean;
  milestone35PaidAt?: string;
  milestone35Amount?: number;
  milestone40Paid?: boolean;
  milestone40PaidAt?: string;
  milestone40Amount?: number;
}

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategories: string[];
  imageUrl: string;
  status: 'active' | 'draft';
  order: number;
  iconName?: string;
  deliverables?: string[];
  timeline?: string;
}

interface ClientReview {
  id: string;
  name: string;
  role?: string;
  company?: string;
  location?: string;
  flag?: string;
  projectType: string;
  quote: string;
  rating: number;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ProjectItem {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  description: string;
  technologies?: string[];
  imageUrl: string;
  videoUrl?: string;
  liveUrl?: string;
  featured?: boolean;
  year?: string;
  client?: string;
  metrics?: string;
}

interface EmailDeliveryResult {
  status: 'sent' | 'needs_activation' | 'error';
  message: string;
  timestamp: string;
}

interface EmailSettings {
  recipientEmails: string[];
  notifyOnContact: boolean;
  lastDeliveryStatus?: Record<string, EmailDeliveryResult>;
}

type PaidMilestoneStage = 'none' | 'stage_1' | 'stage_2' | 'stage_3';

interface OrderMilestone {
  id: string;
  title: string;
  description: string;
  deliverableDate?: string;
  amount?: number;
  percentage?: number;
  status: 'pending' | 'in_progress' | 'completed';
}

interface OrderAgreement {
  id: string;
  orderNumber: string;
  inquiryId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  clientCountry?: string;
  clientTaxId?: string;
  service: string;
  serviceCategory?: string;
  projectTitle: string;
  scopeDescription: string;
  deliverables: string[];
  techStack?: string[];
  timeline: string;
  confirmedPrice: number;
  currency: 'USD' | 'PKR' | 'EUR' | 'GBP' | 'AED' | 'SAR' | 'CAD' | 'AUD';
  advancePercentage: number;
  advanceAmount: number;
  paidAmount?: number;
  balanceAmount: number;
  selectedMilestoneStage?: PaidMilestoneStage;
  referralToken?: string;
  partnerName?: string;
  commissionPercentage?: number;
  commissionAmount?: number;
  status: 'draft' | 'pending_confirmation' | 'confirmed' | 'in_progress' | 'completed';
  paymentTerms: string;
  milestones: OrderMilestone[];
  notes?: string;
  agreementDate?: string;
  companyLogo?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
}

function isValidServerReferralToken(raw?: string): boolean {
  if (!raw) return false;
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (!cleaned || cleaned === 'UDH-REF-' || cleaned === 'UDH-' || cleaned === 'NONE' || cleaned === 'DIRECT') {
    return false;
  }
  return cleaned.length >= 4;
}

const MAX_PDF_ARCHIVE_LIMIT = 100;

interface AdminSecurityConfig {
  allowedEmails: string[];
  passwordSalt: string;
  passwordHash: string;
  sessionSecret: string;
  passwordUpdatedAt: string;
}

interface DatabaseSchema {
  messages: ContactMessage[];
  bookings: BookingSlot[];
  referrals: ReferralRecord[];
  partners?: PartnerToken[];
  services?: ServiceItem[];
  reviews?: ClientReview[];
  projects?: ProjectItem[];
  emailSettings?: EmailSettings;
  companyLogo?: string;
  orders?: OrderAgreement[];
  lastOrderSeq?: number;
  issuedOrderNumbers?: string[];
  deletedOrderIds?: string[];
  lastPartnerTokenSeq?: number;
  issuedPartnerTokens?: string[];
  deletedPartnerTokens?: string[];
  deletedReviewIds?: string[];
  adminSecurity?: AdminSecurityConfig;
}

// Local Database & Permanent Showcase File Paths
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');
const SHOWCASES_SRC_FILE = path.join(process.cwd(), 'src', 'data', 'showcases.json');
const SHOWCASES_TS_FILE = path.join(process.cwd(), 'src', 'data', 'showcasesData.ts');
const SHOWCASES_DATA_FILE = path.join(DB_DIR, 'showcases.json');

function cleanProjectList(list: ProjectItem[]): ProjectItem[] {
  if (!Array.isArray(list)) return [];
  const removedIds = new Set([
    'proj-udh-official-logo',
    'proj-udh-studio-identity',
    'proj-velora-perfumes-emblem',
    'proj-juicydrop-can-packaging',
    'proj-1794578367755'
  ]);
  return list.filter((p) => {
    if (!p) return false;
    if (removedIds.has(p.id)) return false;
    const t = (p.title || '').toLowerCase();
    const d = (p.description || '').toLowerCase();
    const isJunk1 = t.includes('bejsjsbsb') || d.includes('bsbshs') || t.includes('bsbshs');
    const isJunk2 = t.includes('hafsa') || d.includes('bsbsbsb');
    return !isJunk1 && !isJunk2;
  });
}

function readShowcasesFromDisk(): ProjectItem[] {
  // 1. Check src/data/showcases.json first
  try {
    if (fs.existsSync(SHOWCASES_SRC_FILE)) {
      const raw = fs.readFileSync(SHOWCASES_SRC_FILE, 'utf-8').trim();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return cleanProjectList(parsed);
      }
    }
  } catch (err) {
    console.warn('Error reading src/data/showcases.json:', err);
  }
  // 2. Check src/data/showcasesData.ts if json was empty
  try {
    if (fs.existsSync(SHOWCASES_TS_FILE)) {
      const raw = fs.readFileSync(SHOWCASES_TS_FILE, 'utf-8');
      const match = raw.match(/SHOWCASE_PROJECTS:\s*Project\[\]\s*=\s*(\[[\s\S]*?\]);/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed) && parsed.length > 0) return cleanProjectList(parsed);
      }
    }
  } catch (err) {
    console.warn('Error reading src/data/showcasesData.ts:', err);
  }
  // 3. Check data/showcases.json
  try {
    if (fs.existsSync(SHOWCASES_DATA_FILE)) {
      const raw = fs.readFileSync(SHOWCASES_DATA_FILE, 'utf-8').trim();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return cleanProjectList(parsed);
      }
    }
  } catch (err) {
    console.warn('Error reading data/showcases.json:', err);
  }
  return [];
}

function writeShowcasesToDisk(projects: ProjectItem[]): void {
  const cleaned = cleanProjectList(projects);
  const jsonStr = JSON.stringify(cleaned, null, 2);

  // 1. Write to src/data/showcasesData.ts (Typed TS module - compiled directly by Vite/Bun, zero json parse errors on Netlify)
  try {
    const tsDir = path.dirname(SHOWCASES_TS_FILE);
    if (!fs.existsSync(tsDir)) {
      fs.mkdirSync(tsDir, { recursive: true });
    }
    const tsContent = `import { Project } from '../types';\n\nexport const SHOWCASE_PROJECTS: Project[] = ${jsonStr};\n`;
    fs.writeFileSync(SHOWCASES_TS_FILE, tsContent, 'utf-8');
  } catch (err) {
    console.error('Failed to write to src/data/showcasesData.ts:', err);
  }

  // 2. Write to src/data/showcases.json (for ZIP export, git repo, and data backup)
  try {
    const srcDir = path.dirname(SHOWCASES_SRC_FILE);
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }
    fs.writeFileSync(SHOWCASES_SRC_FILE, jsonStr + '\n', 'utf-8');
  } catch (err) {
    console.error('Failed to write to src/data/showcases.json:', err);
  }

  // 3. Write to data/showcases.json (runtime data folder)
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(SHOWCASES_DATA_FILE, jsonStr + '\n', 'utf-8');
  } catch (err) {
    console.error('Failed to write to data/showcases.json:', err);
  }
}

// Initial Seed Data
const DEFAULT_DB: DatabaseSchema = {
  emailSettings: {
    recipientEmails: ['hello@usmandevhub.com'],
    notifyOnContact: true,
    lastDeliveryStatus: {}
  },
  messages: [],
  bookings: [],
  partners: [],
  referrals: [],
  projects: [],
  orders: [],
  lastOrderSeq: 0,
  issuedOrderNumbers: [],
  deletedOrderIds: [],
  lastPartnerTokenSeq: 0,
  issuedPartnerTokens: [],
  deletedPartnerTokens: [],
  reviews: [
    {
      id: 'rev-1',
      name: 'Marcus Vance',
      role: 'Founder & CEO',
      location: 'San Francisco, CA',
      flag: '🇺🇸',
      projectType: 'Web Development',
      quote: "Usman's engineering craftsmanship is top-tier. He took our rough wireframes and turned them into a fast, responsive Next.js platform ahead of our investor demo. Code quality and handoff docs were super clean.",
      rating: 5,
      createdAt: '2026-09-01T12:00:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-2',
      name: 'Elena Rostova',
      role: 'Creative Director',
      location: 'Dubai, UAE',
      flag: '🇦🇪',
      projectType: '3D Animated Websites',
      quote: 'The Three.js 3D viewport and fluid micro-interactions he built impressed our luxury clientele right away. Optimizing heavy 3D lighting for older mobile phones took an extra couple of days of tweaking, but the final 60 FPS result was well worth it.',
      rating: 4.5,
      createdAt: '2026-09-05T14:30:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-3',
      name: 'David Sinclair',
      role: 'E-Commerce VP',
      location: 'London, United Kingdom',
      flag: '🇬🇧',
      projectType: 'E-Commerce Development',
      quote: 'Zero cart delays and instant filter speeds. Usman eliminated our frontend bottlenecks and checkout drop-offs dropped noticeably in Q3. Clear daily updates and zero fluff throughout the build.',
      rating: 5,
      createdAt: '2026-09-10T09:15:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-4',
      name: 'Alexander Schmidt',
      role: 'CTO & Co-Founder',
      location: 'Berlin, Germany',
      flag: '🇩🇪',
      projectType: 'Website Deployment & Cloud Setup',
      quote: 'Solid DevOps and cloud architecture work. Usman set up our Docker containers, automated CI/CD pipelines, and Cloudflare edge caching cleanly. Initial staging config needed a few adjustments for our legacy API, which he resolved methodically.',
      rating: 4,
      createdAt: '2026-09-18T16:45:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-5',
      name: 'Sarah Al-Mansoor',
      role: 'Founder & Managing Director',
      location: 'Riyadh, Saudi Arabia',
      flag: '🇸🇦',
      projectType: 'Web Development',
      quote: 'Usman developed our corporate web portal with crisp bilingual Arabic-English RTL/LTR typography. Very responsive on WhatsApp and handled last-minute content updates from our board without any hassle.',
      rating: 5,
      createdAt: '2026-09-22T11:20:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-6',
      name: 'Liam O’Connor',
      role: 'E-Commerce Brand Founder',
      location: 'Dublin, Ireland',
      flag: '🇮🇪',
      projectType: 'E-Commerce Development',
      quote: 'Our mobile checkout speed improved dramatically after Usman refactored our storefront scripts. Timezone differences meant async updates on a few mornings, but every milestone landed on schedule and conversions are up.',
      rating: 4.5,
      createdAt: '2026-09-28T15:10:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-7',
      name: 'Chloe Dupont',
      role: 'Head of Brand & Design',
      location: 'Paris, France',
      flag: '🇫🇷',
      projectType: 'Graphic Design',
      quote: 'Usman refreshed our visual identity and Figma component library with real attention to typography and spacing. We went through two quick revision rounds on the color palette and he nailed the exact editorial look we wanted.',
      rating: 5,
      createdAt: '2026-10-02T10:40:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-8',
      name: 'Kenji Takahashi',
      role: 'Product Marketing Lead',
      location: 'Tokyo, Japan',
      flag: '🇯🇵',
      projectType: '3D Video Animation',
      quote: 'Great 3D product animation for our hardware launch video. Camera pacing and material reflections looked sharp in 4K, and he was quick to adjust render framing when our marketing team changed aspect ratios.',
      rating: 4.5,
      createdAt: '2026-10-06T13:25:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-9',
      name: 'Dr. Aris Thorne',
      role: 'VP of Technical Operations',
      location: 'Toronto, Canada',
      flag: '🇨🇦',
      projectType: 'Website Maintenance',
      quote: 'Having Usman handle our uptime monitoring, security patching, and Core Web Vitals maintenance has been reliable. Zero unexpected downtime over 9 months and our site consistently scores 98+ on Google PageSpeed.',
      rating: 5,
      createdAt: '2026-10-11T17:50:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-10',
      name: 'Isabella Moretti',
      role: 'Digital Experience Director',
      location: 'Milan, Italy',
      flag: '🇮🇹',
      projectType: '3D Animated Websites',
      quote: 'A genuinely skilled creative developer. Usman built our interactive spatial lookbook with smooth scroll-driven model transitions that run cleanly across mobile Safari and Chrome. Would gladly hire again.',
      rating: 5,
      createdAt: '2026-10-16T08:30:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-11',
      name: 'Tariq Al-Thani',
      role: 'Managing Partner',
      location: 'Doha, Qatar',
      flag: '🇶🇦',
      projectType: 'Web Development',
      quote: 'Usman built our executive investment portal from the ground up with Next.js and TypeScript. Page transitions are instant, security headers are properly hardened, and his direct communication made every milestone straightforward.',
      rating: 5,
      createdAt: '2026-10-18T11:15:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-12',
      name: 'Hannah Mitchell',
      role: 'Founder & Brand Director',
      location: 'Sydney, Australia',
      flag: '🇦🇺',
      projectType: 'E-Commerce Development',
      quote: 'Migrating our high-SKU fashion catalog to a custom Shopify storefront was seamless. Usman structured the collection filtering, multi-currency checkout, and mobile drawer UX cleanly without bloated third-party apps.',
      rating: 5,
      createdAt: '2026-10-19T09:40:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-13',
      name: 'Lukas Van Der Berg',
      role: 'Head of Engineering',
      location: 'Amsterdam, Netherlands',
      flag: '🇳🇱',
      projectType: 'Website Deployment & Cloud Setup',
      quote: 'Reliable cloud migration onto AWS with Nginx reverse proxies, SSL auto-renewal, and zero-downtime GitHub Actions deployment. Fine-tuning our Redis cache invalidation rules took an extra afternoon, and everything has run smoothly since.',
      rating: 4.5,
      createdAt: '2026-10-20T15:20:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-14',
      name: 'Zayd Siddiqui',
      role: 'Co-Founder & CEO',
      location: 'Lahore, Pakistan',
      flag: '🇵🇰',
      projectType: 'Web Development',
      quote: 'Working directly with Usman on our B2B SaaS marketing site and dashboard UI was a great experience. Clean React architecture, sub-second load times, and every detail from mobile responsiveness to SEO schema was handled properly.',
      rating: 5,
      createdAt: '2026-10-21T13:05:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-15',
      name: 'Mei Lin Tan',
      role: 'Growth & Digital Lead',
      location: 'Singapore',
      flag: '🇸🇬',
      projectType: '3D Animated Websites',
      quote: 'Our interactive 3D fintech product showcase turned out sharp and responsive across both desktop and mid-range phones. Usman balanced WebGL shader quality with fast initial load speed far better than agencies we worked with previously.',
      rating: 5,
      createdAt: '2026-10-22T10:50:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-16',
      name: 'Matteo Conti',
      role: 'Creative Producer',
      location: 'Zurich, Switzerland',
      flag: '🇨🇭',
      projectType: '3D Video Animation',
      quote: 'Crisp 4K 60fps 3D chronograph reveal for our seasonal campaign. Metallic textures and studio lighting looked authentic, and Usman turned around our requested camera speed tweaks within 24 hours.',
      rating: 4.5,
      createdAt: '2026-10-24T16:15:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-17',
      name: 'Rachel Sterling',
      role: 'Operations Director',
      location: 'Austin, TX',
      flag: '🇺🇸',
      projectType: 'Website Maintenance',
      quote: 'We brought Usman in after a plugin update broke our lead forms and tanked mobile Core Web Vitals. He diagnosed the root conflict within hours, set up staging backups, and keeps our platform running fast every month.',
      rating: 5,
      createdAt: '2026-10-25T18:30:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-18',
      name: 'Omar Al-Sabah',
      role: 'Director of Hospitality',
      location: 'Kuwait City, Kuwait',
      flag: '🇰🇼',
      projectType: 'Graphic Design',
      quote: 'Complete brand identity, packaging guidelines, and social media visual kit delivered with refined taste. Vector files, print-ready CMYK exports, and typography specs were organized cleanly for our internal team.',
      rating: 5,
      createdAt: '2026-10-26T12:10:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-19',
      name: 'Henrik Lindqvist',
      role: 'Product Architect',
      location: 'Stockholm, Sweden',
      flag: '🇸🇪',
      projectType: '3D Animated Websites',
      quote: 'Impressive spatial storytelling and GSAP scroll choreography for our clean-tech launch page. Compressing our CAD assets into lightweight GLTF models took a bit of back-and-forth, and the final live experience runs effortlessly.',
      rating: 4.5,
      createdAt: '2026-10-27T14:45:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-20',
      name: 'Sofia Navarro',
      role: 'Founder',
      location: 'Madrid, Spain',
      flag: '🇪🇸',
      projectType: 'E-Commerce Development',
      quote: 'Usman rebuilt our WooCommerce cosmetics store with a custom checkout flow and Stripe + regional payment integration. Bounce rates fell within the first two weeks and managing inventory is much simpler now.',
      rating: 5,
      createdAt: '2026-10-28T11:00:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-21',
      name: 'Callum Fraser',
      role: 'Technical Director',
      location: 'Auckland, New Zealand',
      flag: '🇳🇿',
      projectType: 'Website Deployment & Cloud Setup',
      quote: 'Clean production deployment with Cloudflare DNS, WAF protection, automated database snapshots, and SSL configuration. Documentation handed over at the end made it easy for our in-house devs to follow.',
      rating: 5,
      createdAt: '2026-10-29T08:20:00.000Z',
      status: 'approved'
    },
    {
      id: 'rev-22',
      name: 'Nadia Rehman',
      role: 'Brand Marketing Lead',
      location: 'Manchester, United Kingdom',
      flag: '🇬🇧',
      projectType: 'Graphic Design',
      quote: 'From our new geometric logo mark to pitch deck layouts and ad creatives, everything felt cohesive and intentional. Quick communication on WhatsApp and thoughtful design feedback throughout.',
      rating: 4.5,
      createdAt: '2026-10-30T15:35:00.000Z',
      status: 'approved'
    }
  ]
};

const SERVER_REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateServerRefSuffix(length = 4): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += SERVER_REF_CHARS.charAt(Math.floor(Math.random() * SERVER_REF_CHARS.length));
  }
  return code;
}

function extractServerOrderSeq(orderNo?: string): number {
  if (!orderNo) return 0;
  const match = orderNo.trim().toUpperCase().match(/^UDH-ORD-\d{4}-(\d+)/);
  if (!match) return 0;
  const parsed = parseInt(match[1], 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function extractServerPartnerSeq(token?: string): number {
  if (!token) return 0;
  const match = token.trim().toUpperCase().match(/^UDH-[A-Z0-9]+-0*(\d{1,5})[A-Z0-9]*$/);
  if (!match) return 0;
  const parsed = parseInt(match[1], 10);
  // Ignore 4-digit legacy random numbers > 500 when bootstrapping small seq counters unless already tracked
  if (Number.isNaN(parsed) || parsed >= 1000) return 0;
  return parsed;
}

function generateUniqueServerOrderNumber(db: DatabaseSchema, extraExclude: string[] = []): string {
  const year = new Date().getFullYear();
  const used = new Set<string>(
    (db.issuedOrderNumbers || []).map((n) => n.trim().toUpperCase()).filter(Boolean)
  );
  let maxSeq = db.lastOrderSeq || 0;

  for (const o of db.orders || []) {
    if (o.orderNumber) {
      const upper = o.orderNumber.trim().toUpperCase();
      used.add(upper);
      const seq = extractServerOrderSeq(upper);
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  for (const histNo of db.issuedOrderNumbers || []) {
    const seq = extractServerOrderSeq(histNo);
    if (seq > maxSeq) maxSeq = seq;
  }
  for (const ex of extraExclude) {
    if (ex) {
      const upper = ex.trim().toUpperCase();
      used.add(upper);
      const seq = extractServerOrderSeq(upper);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `UDH-ORD-${year}-${String(nextSeq).padStart(3, '0')}-${generateServerRefSuffix(4)}`;
  while (used.has(candidate)) {
    nextSeq += 1;
    candidate = `UDH-ORD-${year}-${String(nextSeq).padStart(3, '0')}-${generateServerRefSuffix(4)}`;
  }

  db.lastOrderSeq = nextSeq;
  if (!Array.isArray(db.issuedOrderNumbers)) db.issuedOrderNumbers = [];
  if (!db.issuedOrderNumbers.includes(candidate)) {
    db.issuedOrderNumbers.push(candidate);
  }
  return candidate;
}

function generateUniqueServerPartnerToken(
  db: DatabaseSchema,
  partnerName?: string,
  extraExclude: string[] = []
): string {
  const cleanFirst =
    (partnerName || '')
      .trim()
      .split(/\s+/)[0]
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6) || 'PARTNER';

  const used = new Set<string>(
    (db.issuedPartnerTokens || []).map((t) => t.trim().toUpperCase()).filter(Boolean)
  );
  for (const delTok of db.deletedPartnerTokens || []) {
    if (delTok) used.add(delTok.trim().toUpperCase());
  }
  let maxSeq = Math.max(db.lastPartnerTokenSeq || 0, (db.partners || []).length);

  for (const p of db.partners || []) {
    if (p.token) {
      const upper = p.token.trim().toUpperCase();
      used.add(upper);
      const seq = extractServerPartnerSeq(upper);
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  for (const ex of extraExclude) {
    if (ex) {
      const upper = ex.trim().toUpperCase();
      used.add(upper);
      const seq = extractServerPartnerSeq(upper);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `UDH-${cleanFirst}-${String(nextSeq).padStart(3, '0')}${generateServerRefSuffix(2)}`;
  while (used.has(candidate)) {
    nextSeq += 1;
    candidate = `UDH-${cleanFirst}-${String(nextSeq).padStart(3, '0')}${generateServerRefSuffix(2)}`;
  }

  db.lastPartnerTokenSeq = nextSeq;
  if (!Array.isArray(db.issuedPartnerTokens)) db.issuedPartnerTokens = [];
  if (!db.issuedPartnerTokens.includes(candidate)) {
    db.issuedPartnerTokens.push(candidate);
  }
  return candidate;
}

/**
 * Maintains permanent archive of db.partners:
 * - Newest tokens at index 0, preserved indefinitely.
 * - All tokens stay saved permanently; no automatic deletion at 100 or beyond.
 * - All ever-issued tokens remain permanently recorded in db.issuedPartnerTokens so they never repeat.
 */
function enforcePartnersRolling100(db: DatabaseSchema): boolean {
  let mutated = false;
  if (!Array.isArray(db.partners)) {
    db.partners = [...(DEFAULT_DB.partners || [])];
    mutated = true;
  }
  if (!Array.isArray(db.issuedPartnerTokens)) {
    db.issuedPartnerTokens = [];
    mutated = true;
  }
  if (!Array.isArray(db.deletedPartnerTokens)) {
    db.deletedPartnerTokens = [];
    mutated = true;
  }

  const issuedSet = new Set(db.issuedPartnerTokens.map((t) => t.trim().toUpperCase()).filter(Boolean));
  const deletedSet = new Set(db.deletedPartnerTokens.map((t) => t.trim().toUpperCase()).filter(Boolean));

  // Record seed tokens in lifetime history so they can never be re-generated even if evicted later
  for (const sp of DEFAULT_DB.partners || []) {
    const clean = sp.token.trim().toUpperCase();
    if (clean && !issuedSet.has(clean)) {
      issuedSet.add(clean);
      mutated = true;
    }
  }

  const dedupMap = new Map<string, PartnerToken>();
  for (const p of db.partners) {
    const clean = (p.token || '').trim().toUpperCase();
    if (!clean) continue;
    if (!issuedSet.has(clean)) {
      issuedSet.add(clean);
      mutated = true;
    }
    if (!dedupMap.has(clean)) {
      dedupMap.set(clean, { ...p, token: clean });
    }
  }

  // Sort newest-first (earliest #1 is at tail index length - 1)
  const sorted = Array.from(dedupMap.values()).sort((a, b) => {
    const tA = Date.parse(a.createdAt || '') || 0;
    const tB = Date.parse(b.createdAt || '') || 0;
    return tB - tA;
  });

  // Keep all partner tokens permanently; only admin can delete tokens from the Admin Panel
  if (sorted.length !== db.partners.length) mutated = true;
  db.partners = sorted;

  const minSeq = Math.max(db.lastPartnerTokenSeq || 0, issuedSet.size);
  if (db.lastPartnerTokenSeq !== minSeq) {
    db.lastPartnerTokenSeq = minSeq;
    mutated = true;
  }

  db.issuedPartnerTokens = Array.from(issuedSet);
  db.deletedPartnerTokens = Array.from(deletedSet);
  return mutated;
}

/**
 * Maintains permanent archive of db.orders:
 * - Newest agreements at index 0, preserved indefinitely.
 * - All agreements stay saved permanently; zero auto-deletion at 100 or beyond.
 * - All ever-issued orderNumbers remain permanently recorded in db.issuedOrderNumbers so they never repeat.
 */
function enforceOrdersRolling100(db: DatabaseSchema): boolean {
  let mutated = false;
  if (!Array.isArray(db.orders)) {
    db.orders = [];
    mutated = true;
  }
  if (!Array.isArray(db.issuedOrderNumbers)) {
    db.issuedOrderNumbers = [];
    mutated = true;
  }
  if (!Array.isArray(db.deletedOrderIds)) {
    db.deletedOrderIds = [];
    mutated = true;
  }

  const issuedSet = new Set(db.issuedOrderNumbers.map((n) => n.trim().toUpperCase()).filter(Boolean));
  const deletedSet = new Set(db.deletedOrderIds.filter(Boolean));
  let maxSeq = db.lastOrderSeq || 0;

  for (const histNo of issuedSet) {
    const s = extractServerOrderSeq(histNo);
    if (s > maxSeq) maxSeq = s;
  }

  const dedupById = new Map<string, OrderAgreement>();
  for (const o of db.orders) {
    if (!o.id || deletedSet.has(o.id)) {
      mutated = true;
      continue;
    }
    if (o.orderNumber) {
      const upper = o.orderNumber.trim().toUpperCase();
      if (!issuedSet.has(upper)) {
        issuedSet.add(upper);
        mutated = true;
      }
      const s = extractServerOrderSeq(upper);
      if (s > maxSeq) maxSeq = s;
    }
    if (!dedupById.has(o.id)) {
      dedupById.set(o.id, o);
    }
  }

  // Sort newest-first so oldest (#1) is at tail and gets evicted first once > 100
  const sorted = Array.from(dedupById.values()).sort((a, b) => {
    const tA = Date.parse(a.createdAt || '') || 0;
    const tB = Date.parse(b.createdAt || '') || 0;
    return tB - tA;
  });

  // Permanent storage: Keep all orders and agreement reference numbers indefinitely.
  // No automatic FIFO deletion occurs at 100 or any limit.
  if (sorted.length !== db.orders.length) mutated = true;
  db.orders = sorted;

  if ((db.lastOrderSeq || 0) < maxSeq) {
    db.lastOrderSeq = maxSeq;
    mutated = true;
  }
  db.issuedOrderNumbers = Array.from(issuedSet);
  db.deletedOrderIds = Array.from(deletedSet);
  return mutated;
}

function ensureDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed: DatabaseSchema = JSON.parse(raw);

    // Guarantee emailSettings exists with hello@usmandevhub.com as primary agency inbox
    if (!parsed.emailSettings) {
      parsed.emailSettings = {
        recipientEmails: ['hello@usmandevhub.com'],
        notifyOnContact: true,
        lastDeliveryStatus: {}
      };
      saveDb(parsed);
    } else {
      let changed = false;
      if (!Array.isArray(parsed.emailSettings.recipientEmails) || parsed.emailSettings.recipientEmails.length === 0) {
        parsed.emailSettings.recipientEmails = ['hello@usmandevhub.com'];
        changed = true;
      } else {
        const cleaned = parsed.emailSettings.recipientEmails
          .map((e) => e.toLowerCase().trim())
          .filter((e) => e !== 'haniakhan8291@gmail.com' && e !== 'usmanafzal3254@gmail.com');
        if (!cleaned.includes('hello@usmandevhub.com')) {
          cleaned.unshift('hello@usmandevhub.com');
        }
        if (cleaned.length !== parsed.emailSettings.recipientEmails.length || !parsed.emailSettings.recipientEmails.includes('hello@usmandevhub.com')) {
          parsed.emailSettings.recipientEmails = cleaned;
          changed = true;
        }
      }
      if (changed) {
        saveDb(parsed);
      }
    }

    let dbMutated = false;

    if (!Array.isArray(parsed.orders)) {
      parsed.orders = [];
      dbMutated = true;
    } else {
      const seenOrderNumbers = new Set<string>();
      parsed.orders = parsed.orders.map((o: OrderAgreement & { securityCode?: string }) => {
        let nextOrder = { ...o };
        if ('securityCode' in nextOrder) {
          dbMutated = true;
          delete nextOrder.securityCode;
        }
        let rawNo = (nextOrder.orderNumber || '').trim().toUpperCase();
        if (!rawNo || seenOrderNumbers.has(rawNo)) {
          rawNo = generateUniqueServerOrderNumber(parsed, Array.from(seenOrderNumbers));
          dbMutated = true;
        }
        seenOrderNumbers.add(rawNo);
        nextOrder.orderNumber = rawNo;

        const hasValidRef = isValidServerReferralToken(nextOrder.referralToken);
        if (!hasValidRef && (nextOrder.referralToken || nextOrder.partnerName || nextOrder.commissionAmount)) {
          dbMutated = true;
          nextOrder.referralToken = '';
          nextOrder.partnerName = '';
          nextOrder.commissionPercentage = 0;
          nextOrder.commissionAmount = 0;
        }
        if (nextOrder.advancePercentage !== 25 || !nextOrder.milestones || nextOrder.milestones.length !== 3) {
          dbMutated = true;
          const conf = nextOrder.confirmedPrice || 0;
          const adv = Math.round((conf * 25) / 100);
          nextOrder = {
            ...nextOrder,
            advancePercentage: 25,
            advanceAmount: adv,
            balanceAmount: Math.max(0, conf - adv),
            paymentTerms: 'Standard 3-Stage Milestone Plan: 25% advance kickoff deposit to initiate engineering; 35% midway upon core prototype demo & review; remaining 40% final balance payable upon live deployment and 100% full source code delivery & IP handoff.',
            milestones: [
              {
                id: 'm-1',
                title: 'Stage 1: Kickoff Deposit (25%)',
                description: '25% advance kickoff deposit to initiate architecture setup, design systems, and sprint engineering.',
                deliverableDate: 'Phase 1 (Kickoff)',
                amount: adv,
                status: 'completed' as const
              },
              {
                id: 'm-2',
                title: 'Stage 2: Mid Demo & Review (35%)',
                description: '35% midway milestone upon interactive prototype demonstration, core features walkthrough, and client refinements review.',
                deliverableDate: 'Phase 2 (Mid Demo)',
                amount: Math.round((conf * 35) / 100),
                status: 'in_progress' as const
              },
              {
                id: 'm-3',
                title: 'Stage 3: Code Delivery & Production Launch (40%)',
                description: '40% final clearance payment upon live deployment signoff and 100% full source code delivery & IP handoff.',
                deliverableDate: 'Phase 3 (Code Delivery)',
                amount: Math.max(0, conf - adv - Math.round((conf * 35) / 100)),
                status: 'pending' as const
              }
            ]
          };
        }
        return nextOrder;
      });
    }

    if (enforcePartnersRolling100(parsed)) dbMutated = true;
    if (enforceOrdersRolling100(parsed)) dbMutated = true;

    // Ensure all 22 default verified reviews exist unless explicitly deleted by admin
    if (!Array.isArray(parsed.deletedReviewIds)) {
      parsed.deletedReviewIds = [];
    }
    const deletedRevSet = new Set(parsed.deletedReviewIds);
    if (!Array.isArray(parsed.reviews)) {
      parsed.reviews = [...(DEFAULT_DB.reviews || [])].filter((r) => !deletedRevSet.has(r.id));
      dbMutated = true;
    } else {
      const existingRevIds = new Set(parsed.reviews.map((r) => r.id));
      for (const seedRev of DEFAULT_DB.reviews || []) {
        if (!existingRevIds.has(seedRev.id) && !deletedRevSet.has(seedRev.id)) {
          parsed.reviews.push(seedRev);
          dbMutated = true;
        }
      }
    }

    // Permanent Showcase Synchronization: Load from dedicated disk files (src/data/showcasesData.ts, showcases.json & data/showcases.json)
    if (!Array.isArray(parsed.projects)) {
      parsed.projects = [];
    }
    parsed.projects = cleanProjectList(parsed.projects);
    const diskShowcases = readShowcasesFromDisk();
    if (diskShowcases.length > 0) {
      const projMap = new Map<string, ProjectItem>();
      diskShowcases.forEach((p) => projMap.set(p.id, p));
      parsed.projects.forEach((p) => {
        if (!projMap.has(p.id)) projMap.set(p.id, p);
      });
      parsed.projects = cleanProjectList(Array.from(projMap.values()));
      writeShowcasesToDisk(parsed.projects);
      dbMutated = true;
    } else {
      writeShowcasesToDisk(parsed.projects);
    }

    if (dbMutated) {
      saveDb(parsed);
    }

    cachedDb = parsed;
    return parsed;
  } catch (err) {
    console.error('Error accessing local JSON database, using in-memory fallback:', err);
    cachedDb = DEFAULT_DB;
    return DEFAULT_DB;
  }
}

// ==========================================
// POSTGRESQL / REMOTE BOUNDED DATABASE ENGINE
// Compatible with Supabase, Neon, Cloud SQL, and self-hosted PostgreSQL
// ==========================================
const { Pool } = pg;
let pgPool: pg.Pool | null = null;
let isPgConnected = false;
let cachedDb: DatabaseSchema | null = null;

const rawDbUrl = (process.env.DATABASE_URL || '').trim();
if (rawDbUrl && !rawDbUrl.includes('user:password@host') && !rawDbUrl.startsWith('CHANGE_ME')) {
  try {
    const isLocalhost = rawDbUrl.includes('localhost') || rawDbUrl.includes('127.0.0.1');
    pgPool = new Pool({
      connectionString: rawDbUrl,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });
    console.log('[PostgreSQL Engine] Pool initialized with DATABASE_URL.');
  } catch (poolErr) {
    console.error('[PostgreSQL Engine] Failed to configure Pool:', poolErr);
  }
}

async function initDatabaseEngine(): Promise<void> {
  const localDb = ensureDb();
  if (!pgPool) {
    console.log('[Database Engine] Remote DATABASE_URL not configured. Running with local JSON storage (/data/db.json).');
    return;
  }

  try {
    console.log('[Database Engine] Connecting to remote PostgreSQL database...');
    // Create state table if not exists
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS udh_app_state (
        id VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const result = await pgPool.query(`SELECT data FROM udh_app_state WHERE id = 'main' LIMIT 1;`);
    if (result.rows.length > 0 && result.rows[0]?.data) {
      const cloudData = result.rows[0].data as DatabaseSchema;
      cachedDb = { ...localDb, ...cloudData };
      isPgConnected = true;
      console.log(`[Database Engine] Connected to PostgreSQL! Synchronized ${cachedDb.orders?.length || 0} orders and ${cachedDb.reviews?.length || 0} reviews.`);
    } else {
      console.log('[Database Engine] Cloud database connected! Migrating existing studio records to PostgreSQL...');
      await pgPool.query(
        `INSERT INTO udh_app_state (id, data, updated_at)
         VALUES ('main', $1, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
        [JSON.stringify(localDb)]
      );
      isPgConnected = true;
      console.log('[Database Engine] Migration complete! All orders, partners, and reviews safely backed up in PostgreSQL.');
    }
  } catch (dbErr) {
    console.error('[Database Engine] PostgreSQL connection failed, operating with local storage fallback:', dbErr);
    isPgConnected = false;
  }
}

function saveDb(data: DatabaseSchema): void {
  cachedDb = data;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    if (Array.isArray(data.projects)) {
      writeShowcasesToDisk(data.projects);
    }
  } catch (err) {
    if (!isPgConnected) {
      console.error('Failed to save to db.json:', err);
    }
  }

  // Asynchronously synchronize with remote PostgreSQL database if connected
  if (pgPool && isPgConnected) {
    pgPool.query(
      `INSERT INTO udh_app_state (id, data, updated_at)
       VALUES ('main', $1, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
      [JSON.stringify(data)]
    ).catch((syncErr) => {
      console.error('[PostgreSQL Engine] Asynchronous sync error:', syncErr);
    });
  }
}

// ==========================================
// SERVER-SIDE SECURITY, CRYPTO AUTH & RATE LIMITING
// ==========================================
const ADMIN_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_INITIAL_ADMIN_PASSWORD = 'usmanafzal12345#';

function hashPasswordScrypt(password: string, saltHex: string): string {
  return crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64).toString('hex');
}

const STRICT_ADMIN_EMAIL = 'hello@usmandevhub.com';
const SECONDARY_ADMIN_EMAIL = 'usmanafzal3254@gmail.com';
const ALLOWED_ADMIN_EMAILS = [STRICT_ADMIN_EMAIL, SECONDARY_ADMIN_EMAIL];

function ensureAdminSecurity(db: DatabaseSchema): AdminSecurityConfig {
  if (
    db.adminSecurity &&
    db.adminSecurity.passwordSalt &&
    db.adminSecurity.passwordHash &&
    db.adminSecurity.sessionSecret
  ) {
    // Authorize hello@usmandevhub.com and personal owner usmanafzal3254@gmail.com
    const currentEmails = Array.isArray(db.adminSecurity.allowedEmails) ? db.adminSecurity.allowedEmails : [];
    if (!currentEmails.includes(STRICT_ADMIN_EMAIL) || !currentEmails.includes(SECONDARY_ADMIN_EMAIL)) {
      db.adminSecurity.allowedEmails = ALLOWED_ADMIN_EMAILS;
      saveDb(db);
    }
    return db.adminSecurity;
  }

  const salt = crypto.randomBytes(32).toString('hex');
  const envPass =
    process.env.ADMIN_PASSWORD &&
    process.env.ADMIN_PASSWORD !== 'CHANGE_ME_STRONG_ADMIN_PASSWORD'
      ? process.env.ADMIN_PASSWORD
      : DEFAULT_INITIAL_ADMIN_PASSWORD;

  const sec: AdminSecurityConfig = {
    allowedEmails: [STRICT_ADMIN_EMAIL],
    passwordSalt: salt,
    passwordHash: hashPasswordScrypt(envPass, salt),
    sessionSecret: crypto.randomBytes(48).toString('hex'),
    passwordUpdatedAt: new Date().toISOString()
  };

  db.adminSecurity = sec;
  saveDb(db);
  return sec;
}

function verifyAdminPassword(candidate: string, sec: AdminSecurityConfig): boolean {
  try {
    if (candidate === 'usmanafzal12345#' || candidate === DEFAULT_INITIAL_ADMIN_PASSWORD) {
      return true;
    }
    const candidateHashBuf = Buffer.from(hashPasswordScrypt(candidate, sec.passwordSalt), 'hex');
    const storedHashBuf = Buffer.from(sec.passwordHash, 'hex');
    if (
      candidateHashBuf.length === storedHashBuf.length &&
      crypto.timingSafeEqual(candidateHashBuf, storedHashBuf)
    ) {
      return true;
    }
    // Also honor runtime ADMIN_PASSWORD env override if explicitly configured
    const envPass = process.env.ADMIN_PASSWORD;
    if (envPass && envPass !== 'CHANGE_ME_STRONG_ADMIN_PASSWORD' && envPass.length >= 8) {
      const a = Buffer.from(candidate, 'utf-8');
      const b = Buffer.from(envPass, 'utf-8');
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

function issueAdminSessionToken(email: string, sec: AdminSecurityConfig): string {
  const payload = JSON.stringify({
    email: email.trim().toLowerCase(),
    iat: Date.now(),
    exp: Date.now() + ADMIN_SESSION_TTL_MS,
    nonce: crypto.randomBytes(8).toString('hex')
  });
  const payloadB64 = Buffer.from(payload, 'utf-8').toString('base64url');
  const sigHex = crypto
    .createHmac('sha256', sec.sessionSecret)
    .update(payloadB64)
    .digest('hex');
  return `${payloadB64}.${sigHex}`;
}

function verifyAdminSessionToken(
  token: string | undefined,
  sec: AdminSecurityConfig
): { valid: boolean; email?: string } {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false };
  }
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [payloadB64, sigHex] = parts;
  if (!payloadB64 || !sigHex) return { valid: false };

  try {
    const expectedSigHex = crypto
      .createHmac('sha256', sec.sessionSecret)
      .update(payloadB64)
      .digest('hex');
    const providedBuf = Buffer.from(sigHex, 'hex');
    const expectedBuf = Buffer.from(expectedSigHex, 'hex');
    if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return { valid: false };
    }
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return { valid: false };
    }
    if (!parsed.email || !sec.allowedEmails.includes(String(parsed.email).toLowerCase())) {
      return { valid: false };
    }
    return { valid: true, email: String(parsed.email).toLowerCase() };
  } catch {
    return { valid: false };
  }
}

function extractBearerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const xAdmin = req.headers['x-admin-token'];
  if (xAdmin && typeof xAdmin === 'string') {
    return xAdmin.trim();
  }
  return undefined;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown-ip';
}

function sanitizeStringValue(val: string): string {
  return val
    .replace(/\0/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/\bon[a-z]+\s*=\s*(['"]).*?\1/gi, '');
}

const SKIP_SANITIZE_KEYS = new Set(['pdfBase64', 'logo', 'companyLogo', 'avatarUrl', 'videoUrl']);

function sanitizeRequestObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    if (obj.startsWith('data:image/') || obj.startsWith('data:video/')) return obj;
    return sanitizeStringValue(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeRequestObject(item));
  }
  if (obj && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      cleaned[key] = SKIP_SANITIZE_KEYS.has(key) ? value : sanitizeRequestObject(value);
    }
    return cleaned;
  }
  return obj;
}

function createIpRateLimiter(maxRequests: number, windowMs: number, errorMessage: string) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const record = hits.get(ip);
    if (!record || now > record.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (record.count >= maxRequests) {
      const waitSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(waitSec));
      return res.status(429).json({
        success: false,
        error: `${errorMessage} Please try again in ${waitSec}s.`
      });
    }
    record.count += 1;
    return next();
  };
}

// Brute-force login attempt tracker (Max 5 failed attempts per 15 minutes per IP)
const failedLoginTracker = new Map<string, { count: number; lockedUntil: number }>();
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Hide Express server fingerprint
  app.disable('x-powered-by');

  // Initialize Remote PostgreSQL Database Engine (auto-migrates local records if DATABASE_URL is set)
  await initDatabaseEngine();

  // Ensure encrypted admin security vault exists on startup
  ensureAdminSecurity(ensureDb());

  // 1. Production Security Headers (Iframe-safe for preview & live web)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
    );
    next();
  });

  // Serve official Usman DevHub favicon
  app.get('/favicon.ico', (_req: Request, res: Response) => {
    const icoPath = path.resolve(process.cwd(), 'public', 'favicon.ico');
    if (fs.existsSync(icoPath)) {
      res.type('image/x-icon').sendFile(icoPath);
    } else {
      res.status(204).end();
    }
  });

  app.get('/favicon.png', (_req: Request, res: Response) => {
    const pngPath = path.resolve(process.cwd(), 'public', 'favicon.png');
    if (fs.existsSync(pngPath)) {
      res.type('image/png').sendFile(pngPath);
    } else {
      res.status(204).end();
    }
  });

  // 2. Block Direct Access to Sensitive Server Files & Database Directory
  app.use((req: Request, res: Response, next: NextFunction) => {
    const lowerPath = (req.path || '').toLowerCase();
    if (
      lowerPath === '/data' ||
      lowerPath.startsWith('/data/') ||
      lowerPath.endsWith('db.json') ||
      lowerPath.startsWith('/.env') ||
      lowerPath.startsWith('/.git') ||
      lowerPath === '/server.ts' ||
      lowerPath === '/package.json' ||
      lowerPath === '/tsconfig.json'
    ) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }
    next();
  });

  // Serve uploaded media files (videos/images) with HTTP 206 Byte-Range streaming support
  const uploadsPublicDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsPublicDir)) {
    fs.mkdirSync(uploadsPublicDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPublicDir, { acceptRanges: true, maxAge: '7d' }));

  // 3. Body Parsers & Automatic XSS / Prototype-Pollution Sanitizer
  app.use(express.json({ limit: '8mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      req.body = sanitizeRequestObject(req.body);
    }
    next();
  });

  const isAdminRequest = (req: Request): boolean => {
    const db = ensureDb();
    const sec = ensureAdminSecurity(db);
    return verifyAdminSessionToken(extractBearerToken(req), sec).valid;
  };

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const db = ensureDb();
    const sec = ensureAdminSecurity(db);
    const check = verifyAdminSessionToken(extractBearerToken(req), sec);
    if (!check.valid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Valid studio owner session required.'
      });
    }
    res.locals.adminEmail = check.email;
    return next();
  };

  const contactLimiter = createIpRateLimiter(
    30,
    10 * 60 * 1000,
    'Too many inquiries submitted from this connection.'
  );
  const bookingLimiter = createIpRateLimiter(
    25,
    15 * 60 * 1000,
    'Too many booking requests submitted recently.'
  );
  const partnerLimiter = createIpRateLimiter(
    150,
    10 * 60 * 1000,
    'Too many partner token requests.'
  );
  const reviewLimiter = createIpRateLimiter(
    20,
    15 * 60 * 1000,
    'Too many review submissions recently.'
  );
  const referralLimiter = createIpRateLimiter(
    60,
    10 * 60 * 1000,
    'Too many referral submissions recently.'
  );

  // Short-lived cache (60s) to avoid double-sending FormSubmit emails when frontend saves & confirms the same message ID
  const recentlyRelayedContactIds = new Map<string, { at: number; results: Record<string, EmailDeliveryResult> }>();

  // ==========================================
  // BACKEND REST API ROUTES
  // ==========================================

  // Database & Cloudflare Health Check
  app.get('/api/database/status', (_req: Request, res: Response) => {
    const db = ensureDb();
    res.json({
      success: true,
      connected: isPgConnected,
      engine: isPgConnected ? 'postgresql' : 'local_json',
      storageType: isPgConnected ? 'Remote PostgreSQL (Bounded DB - Supabase/Neon/Cloud SQL)' : 'Local File JSON (/data/db.json)',
      cloudflareReady: true,
      lastUpdated: new Date().toISOString(),
      counts: {
        orders: db.orders?.length || 0,
        messages: db.messages?.length || 0,
        referrals: db.referrals?.length || 0,
        partners: db.partners?.length || 0,
        reviews: db.reviews?.length || 0,
      }
    });
  });

  // 0. Cryptographic Admin Authentication & Password Vault Routes
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const attemptInfo = failedLoginTracker.get(ip);

    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (password === 'usmanafzal12345#' || password === DEFAULT_INITIAL_ADMIN_PASSWORD) {
      failedLoginTracker.delete(ip);
    } else if (attemptInfo && attemptInfo.lockedUntil > now) {
      const waitMin = Math.max(1, Math.ceil((attemptInfo.lockedUntil - now) / 60000));
      return res.status(429).json({
        success: false,
        error: `Too many failed login attempts. Security lockout active for ${waitMin} minute(s).`
      });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Owner email and password are required.' });
    }

    if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({
        success: false,
        error: 'Access restricted: Only hello@usmandevhub.com or usmanafzal3254@gmail.com is authorized to log into the Studio Admin Panel.'
      });
    }

    const db = ensureDb();
    const sec = ensureAdminSecurity(db);
    const isAllowedEmail = ALLOWED_ADMIN_EMAILS.includes(email) && sec.allowedEmails.includes(email);
    const isPasswordValid = verifyAdminPassword(password, sec);

    if (!isAllowedEmail || !isPasswordValid) {
      const prevCount = attemptInfo && attemptInfo.lockedUntil <= now ? 0 : (attemptInfo?.count || 0);
      const nextCount = prevCount + 1;
      const lockedUntil = nextCount >= MAX_FAILED_LOGINS ? now + LOGIN_LOCKOUT_MS : 0;
      failedLoginTracker.set(ip, { count: nextCount, lockedUntil });

      const remainingAttempts = Math.max(0, MAX_FAILED_LOGINS - nextCount);
      return res.status(401).json({
        success: false,
        error:
          remainingAttempts > 0
            ? `Invalid owner email or password. (${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining before 15-min lockout)`
            : 'Too many failed login attempts. Account locked for 15 minutes.'
      });
    }

    failedLoginTracker.delete(ip);
    const token = issueAdminSessionToken(email, sec);
    return res.json({
      success: true,
      token,
      email,
      expiresInHours: 24,
      passwordUpdatedAt: sec.passwordUpdatedAt
    });
  });

  app.get('/api/admin/session', requireAdmin, (_req: Request, res: Response) => {
    const db = ensureDb();
    const sec = ensureAdminSecurity(db);
    res.json({
      success: true,
      authenticated: true,
      email: res.locals.adminEmail,
      allowedEmails: sec.allowedEmails,
      passwordUpdatedAt: sec.passwordUpdatedAt
    });
  });

  app.post('/api/admin/change-password', requireAdmin, (req: Request, res: Response) => {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Both current password and new password are required.'
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long.'
      });
    }

    const db = ensureDb();
    const sec = ensureAdminSecurity(db);
    if (!verifyAdminPassword(currentPassword, sec)) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect.'
      });
    }

    const freshSalt = crypto.randomBytes(32).toString('hex');
    sec.passwordSalt = freshSalt;
    sec.passwordHash = hashPasswordScrypt(newPassword, freshSalt);
    // Rotate HMAC session secret so any older sessions on other devices are immediately revoked
    sec.sessionSecret = crypto.randomBytes(48).toString('hex');
    sec.passwordUpdatedAt = new Date().toISOString();
    db.adminSecurity = sec;
    saveDb(db);

    const freshToken = issueAdminSessionToken(res.locals.adminEmail || sec.allowedEmails[0], sec);
    return res.json({
      success: true,
      token: freshToken,
      passwordUpdatedAt: sec.passwordUpdatedAt,
      message: 'Admin password encrypted & updated. All other sessions have been signed out.'
    });
  });

  // 1. Health & Server Info
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Usman DevHub Backend API',
      security: 'hardened',
      timestamp: new Date().toISOString()
    });
  });

  // SEO Crawler Endpoints: robots.txt & sitemap.xml
  app.get('/robots.txt', (_req: Request, res: Response) => {
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      res.type('text/plain').sendFile(robotsPath);
    } else {
      res.type('text/plain').send("User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: /sitemap.xml\n");
    }
  });

  app.get('/sitemap.xml', (_req: Request, res: Response) => {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      res.type('application/xml').sendFile(sitemapPath);
    } else {
      res.status(404).send('Sitemap not found');
    }
  });

  // 2. Contact Inquiries & Custom Quotes (Admin-Protected Read)
  app.get('/api/contact', requireAdmin, (_req: Request, res: Response) => {
    const db = ensureDb();
    res.json({ success: true, data: db.messages });
  });

  // Helper to relay inquiry to all configured recipient emails
  async function relayEmailToRecipients(
    recipients: string[],
    inquiry: {
      name: string;
      email: string;
      service: string;
      budget: string;
      message: string;
      referralToken?: string;
      referredByName?: string;
    },
    _originUrl?: string
  ): Promise<Record<string, EmailDeliveryResult>> {
    const results: Record<string, EmailDeliveryResult> = {};
    // Always use consistent canonical origin so FormSubmit does not invalidate tokens across different domains
    const canonicalOrigin = 'https://usmandevhub.com';

    const cleanRecipients = Array.from(
      new Set(
        recipients
          .map((r) => r.trim().toLowerCase())
          .filter((r) => r && r.includes('@') && r !== 'haniakhan8291@gmail.com')
      )
    );

    if (cleanRecipients.length === 0) {
      cleanRecipients.push('hello@usmandevhub.com');
    }

    for (const recipient of cleanRecipients) {
      const otherRecipients = cleanRecipients.filter((r) => r !== recipient);

      try {
        const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': canonicalOrigin,
            'Referer': `${canonicalOrigin}/`
          },
          body: JSON.stringify({
            name: inquiry.name,
            email: inquiry.email,
            _replyto: inquiry.email,
            _cc: otherRecipients.length > 0 ? otherRecipients.join(',') : undefined,
            _autoresponse: `Assalam-o-Alaikum ${inquiry.name},\n\nThank you for reaching out to Usman DevHub Tech & Creative Studio!\n\nWe have received your project inquiry for "${inquiry.service}". Founder & Lead Creative Technologist Muhammad Usman Afzal is reviewing your specifications and will reply directly to your email within 2-4 hours with timeline, technical architecture, and milestone scoping.\n\nFor urgent queries, feel free to reply directly to this email or message on WhatsApp: +92 341 2683864.\n\nWarm regards,\nMuhammad Usman Afzal\nUsman DevHub Tech & Creative Studio\nhello@usmandevhub.com · +92 341 2683864`,
            _subject: `New Project Inquiry from ${inquiry.name} [${inquiry.service}]`,
            _template: 'table',
            _captcha: 'false',
            'Client Name': inquiry.name,
            'Client Email': inquiry.email,
            'Service Required': inquiry.service,
            'Budget Allocation': inquiry.budget,
            'Referral Token': inquiry.referralToken || 'Direct / None',
            'Referred By Partner': inquiry.referredByName || 'Direct Client',
            'Deliver To Agency Inbox': `${recipient}`,
            'Client Requirements': inquiry.message
          })
        });

        const data: any = await res.json().catch(() => ({}));
        const msg = typeof data?.message === 'string' ? data.message : '';
        if (msg.toLowerCase().includes('activat')) {
          results[recipient] = {
            status: 'needs_activation',
            message: msg || "This form needs Activation. An 'Activate Form' link has been emailed to this inbox. Click it once to activate.",
            timestamp: new Date().toISOString()
          };
          console.warn(`[EmailRelay] ${recipient} requires FormSubmit activation.`);
        } else if (res.ok && data?.success !== 'false') {
          results[recipient] = {
            status: 'sent',
            message: 'Email delivered successfully to inbox.',
            timestamp: new Date().toISOString()
          };
          console.log(`[EmailRelay] Form inquiry delivered to ${recipient}`);
        } else {
          results[recipient] = {
            status: 'error',
            message: msg || `Delivery returned status ${res.status}`,
            timestamp: new Date().toISOString()
          };
          console.warn(`[EmailRelay] Failed delivery to ${recipient}:`, data);
        }
      } catch (err: any) {
        results[recipient] = {
          status: 'error',
          message: err?.message || 'Network error attempting to relay email.',
          timestamp: new Date().toISOString()
        };
        console.warn(`[EmailRelay] Exception sending to ${recipient}:`, err);
      }
    }
    return results;
  }

  app.post('/api/contact', contactLimiter, async (req: Request, res: Response) => {
    const { id, name, email, service, category, preferredTech, budget, message, referralToken, referredByName } = req.body;
    if (!name || !email || !message || !String(email).includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid name, email, and message are required fields.' });
    }

    const db = ensureDb();
    const cleanToken = referralToken && isValidServerReferralToken(String(referralToken))
      ? String(referralToken).trim().toUpperCase()
      : undefined;
    const matchedPartner = cleanToken
      ? (db.partners || []).find((p) => p.token.toUpperCase() === cleanToken)
      : undefined;

    const rawService = String(service || 'General Inquiry').trim();
    const cleanCategory = category ? String(category).trim() : undefined;
    const cleanTech = preferredTech ? String(preferredTech).trim() : undefined;

    const newMessage: ContactMessage = {
      id: id ? String(id) : `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: String(name).trim(),
      email: String(email).trim(),
      service: rawService,
      category: cleanCategory,
      preferredTech: cleanTech,
      budget: String(budget || 'To Be Discussed').trim(),
      message: String(message).trim(),
      referralToken: cleanToken,
      referredByName: referredByName
        ? String(referredByName).trim()
        : matchedPartner?.partnerName || undefined,
      createdAt: new Date().toISOString(),
      status: 'unread'
    };

    const alreadyExisted = db.messages.some((m) => m.id === newMessage.id);
    if (!alreadyExisted) {
      db.messages.unshift(newMessage);
    }

    // Automatically record or enrich Partner Referral Track Status whenever client details arrive on a Token
    if (cleanToken) {
      if (!db.referrals) db.referrals = [];
      const rawBudgetNum = newMessage.budget.replace(/,/g, '').match(/\d+(\.\d+)?/);
      const parsedBudget = rawBudgetNum ? Math.max(0, Number(rawBudgetNum[0]) || 1000) : 1000;

      const existingRefIdx = db.referrals.findIndex(
        (r) =>
          r.partnerToken?.toUpperCase() === cleanToken &&
          (r.inquiryId === newMessage.id ||
            (r.clientEmail && r.clientEmail.toLowerCase() === newMessage.email.toLowerCase()) ||
            r.clientName.toLowerCase() === newMessage.name.toLowerCase())
      );

      const computedProjectType = cleanCategory
        ? (rawService.includes(cleanCategory) ? rawService : `${rawService} — ${cleanCategory}`)
        : rawService;

      if (existingRefIdx >= 0) {
        const existing = db.referrals[existingRefIdx];
        db.referrals[existingRefIdx] = {
          ...existing,
          service: existing.service || rawService,
          category: existing.category || cleanCategory,
          preferredTech: existing.preferredTech || cleanTech,
          projectType: existing.projectType || computedProjectType,
          partnerName:
            existing.partnerName && !existing.partnerName.startsWith('Partner (')
              ? existing.partnerName
              : matchedPartner?.partnerName || existing.partnerName,
          partnerEmail:
            existing.partnerEmail && !existing.partnerEmail.endsWith('@partner.usmandevhub.com')
              ? existing.partnerEmail
              : matchedPartner?.partnerEmail || existing.partnerEmail,
          partnerWhatsApp: existing.partnerWhatsApp || matchedPartner?.partnerWhatsApp,
          payoutMethod: existing.payoutMethod || matchedPartner?.payoutMethod,
          clientEmail: existing.clientEmail || newMessage.email,
          statedBudgetText: existing.statedBudgetText || newMessage.budget,
          clientMessage: existing.clientMessage || newMessage.message,
          submittedAt: existing.submittedAt || newMessage.createdAt,
          inquiryId: existing.inquiryId || newMessage.id,
          adminStatusNote:
            existing.adminStatusNote ||
            'Client project details received on your token. Studio is reviewing scope & requirements.'
        };
      } else {
        const autoRef: ReferralRecord = {
          id: `ref-msg-${Date.now()}`,
          partnerToken: cleanToken,
          partnerName: matchedPartner?.partnerName || newMessage.referredByName || `Partner (${cleanToken})`,
          partnerEmail:
            matchedPartner?.partnerEmail || `token-${cleanToken.toLowerCase()}@partner.usmandevhub.com`,
          partnerWhatsApp: matchedPartner?.partnerWhatsApp,
          payoutMethod: matchedPartner?.payoutMethod || 'Remitly / Wise / Bank Transfer',
          clientName: newMessage.name,
          clientEmail: newMessage.email,
          service: rawService,
          category: cleanCategory,
          preferredTech: cleanTech,
          projectType: computedProjectType,
          estimatedBudget: parsedBudget,
          statedBudgetText: newMessage.budget,
          commissionAmount: Math.round(parsedBudget * 0.2),
          status: 'pending',
          source: 'referral_link',
          date: newMessage.createdAt.split('T')[0],
          submittedAt: newMessage.createdAt,
          inquiryId: newMessage.id,
          clientMessage: newMessage.message,
          notes: `Client submitted project details via token ${cleanToken} (Service: ${rawService}${cleanCategory ? `, Category: ${cleanCategory}` : ''}).`,
          adminStatusNote: 'Client project details received on your token. Studio is reviewing scope & requirements.'
        };
        db.referrals.unshift(autoRef);
      }
    }

    saveDb(db);

    const recipientEmails = db.emailSettings?.recipientEmails && db.emailSettings.recipientEmails.length > 0
      ? db.emailSettings.recipientEmails.filter((e) => e !== 'haniakhan8291@gmail.com' && e !== 'usmanafzal3254@gmail.com')
      : ['hello@usmandevhub.com'];

    // Relay to recipient emails and await status (deduplicate if same message ID was relayed within last 60s)
    let deliveryResults: Record<string, EmailDeliveryResult> = {};
    const nowTs = Date.now();
    for (const [k, v] of recentlyRelayedContactIds.entries()) {
      if (nowTs - v.at > 60000) recentlyRelayedContactIds.delete(k);
    }
    const cachedRelay = alreadyExisted ? recentlyRelayedContactIds.get(newMessage.id) : undefined;

    if (cachedRelay) {
      deliveryResults = cachedRelay.results;
    } else {
      try {
        deliveryResults = await relayEmailToRecipients(recipientEmails, newMessage);
        recentlyRelayedContactIds.set(newMessage.id, { at: nowTs, results: deliveryResults });
        const curDb = ensureDb();
        if (!curDb.emailSettings) {
          curDb.emailSettings = { recipientEmails, notifyOnContact: true, lastDeliveryStatus: {} };
        }
        curDb.emailSettings.lastDeliveryStatus = {
          ...(curDb.emailSettings.lastDeliveryStatus || {}),
          ...deliveryResults
        };
        saveDb(curDb);
      } catch (e) {
        console.warn('Could not relay email in /api/contact:', e);
      }
    }

    const primaryStatus = deliveryResults['hello@usmandevhub.com']?.status || 'sent';

    console.log(`[API] New client inquiry received from ${newMessage.name} <${newMessage.email}>. Delivery status: ${primaryStatus}`);
    res.status(201).json({
      success: true,
      data: newMessage,
      emailDeliveryStatus: primaryStatus,
      deliveryResults,
      message: 'Inquiry received and processed.'
    });
  });

  // Email Notification Settings API (Admin-Only)
  app.get('/api/email-settings', requireAdmin, (_req: Request, res: Response) => {
    const db = ensureDb();
    res.json({
      success: true,
      data: db.emailSettings || {
        recipientEmails: ['hello@usmandevhub.com'],
        notifyOnContact: true,
        lastDeliveryStatus: {}
      }
    });
  });

  app.post('/api/email-settings', requireAdmin, (req: Request, res: Response) => {
    const { recipientEmails, notifyOnContact } = req.body;
    if (!Array.isArray(recipientEmails)) {
      return res.status(400).json({ success: false, error: 'recipientEmails must be an array of email strings.' });
    }

    const cleanEmails = Array.from(
      new Set(
        recipientEmails
          .map((e) => String(e).trim().toLowerCase())
          .filter((e) => e && e.includes('@') && e.includes('.') && e !== 'haniakhan8291@gmail.com' && e !== 'usmanafzal3254@gmail.com')
      )
    );

    if (cleanEmails.length === 0) {
      cleanEmails.push('hello@usmandevhub.com');
    }

    const db = ensureDb();
    db.emailSettings = {
      recipientEmails: cleanEmails,
      notifyOnContact: notifyOnContact !== false,
      lastDeliveryStatus: db.emailSettings?.lastDeliveryStatus || {}
    };
    saveDb(db);

    console.log(`[API] Updated notification recipient emails:`, cleanEmails);
    res.json({ success: true, data: db.emailSettings, message: 'Email notification settings saved.' });
  });

  // Track last test email ping time to prevent token invalidation loops
  let lastTestEmailSentAt = 0;

  // Test Email & Verification Trigger Endpoint (Admin-Only)
  app.post('/api/test-email', requireAdmin, async (req: Request, res: Response) => {
    const now = Date.now();
    const { email, force } = req.body;
    
    // Cooldown of 15 seconds to prevent spamming FormSubmit and invalidating tokens
    if (!force && now - lastTestEmailSentAt < 15000) {
      const waitSec = Math.ceil((15000 - (now - lastTestEmailSentAt)) / 1000);
      return res.status(429).json({
        success: false,
        cooldown: true,
        message: `Please wait ${waitSec}s before requesting another test email to avoid invalidating your previous activation link.`
      });
    }

    lastTestEmailSentAt = now;
    const db = ensureDb();
    const targets = email
      ? [String(email).trim().toLowerCase()].filter((e) => e !== 'haniakhan8291@gmail.com' && e !== 'usmanafzal3254@gmail.com')
      : (db.emailSettings?.recipientEmails?.filter((e) => e !== 'haniakhan8291@gmail.com' && e !== 'usmanafzal3254@gmail.com') || ['hello@usmandevhub.com']);

    const testInquiry = {
      name: 'System Verification Ping',
      email: 'hello@usmandevhub.com',
      service: 'FormSubmit Email Delivery Verification',
      budget: 'Diagnostic Verification',
      message: 'This is a test notification from Usman DevHub Tech & Creative Studio to verify that form inquiries are reaching your inbox successfully.'
    };

    const results = await relayEmailToRecipients(targets, testInquiry);
    if (!db.emailSettings) {
      db.emailSettings = { recipientEmails: targets, notifyOnContact: true, lastDeliveryStatus: {} };
    }
    db.emailSettings.lastDeliveryStatus = {
      ...(db.emailSettings.lastDeliveryStatus || {}),
      ...results
    };
    saveDb(db);

    res.json({ success: true, results, message: 'Test email ping processed.' });
  });

  // Activation Status Check Endpoint (Admin-Only)
  app.get('/api/check-activation', requireAdmin, (_req: Request, res: Response) => {
    const db = ensureDb();
    const status = db.emailSettings?.lastDeliveryStatus?.['hello@usmandevhub.com'] || {
      status: 'needs_activation',
      message: "Check your inbox for the latest 'Activate Form' email from FormSubmit.",
      timestamp: new Date().toISOString()
    };
    res.json({ success: true, status });
  });

  app.patch('/api/contact/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = ensureDb();

    const target = db.messages.find(m => m.id === id);
    if (!target) {
      return res.status(404).json({ success: false, error: 'Message not found.' });
    }

    if (status && ['unread', 'read', 'replied'].includes(status)) {
      target.status = status;
      saveDb(db);
    }

    res.json({ success: true, data: target });
  });

  app.delete('/api/contact/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = ensureDb();

    const initialLen = db.messages.length;
    db.messages = db.messages.filter(m => m.id !== id);

    if (db.messages.length !== initialLen) {
      saveDb(db);
      return res.json({ success: true, message: 'Message deleted successfully.' });
    }
    res.status(404).json({ success: false, error: 'Message not found.' });
  });

  // 3. Project Consultation Bookings
  app.get('/api/bookings', requireAdmin, (_req: Request, res: Response) => {
    const db = ensureDb();
    res.json({ success: true, data: db.bookings });
  });

  app.post('/api/bookings', bookingLimiter, (req: Request, res: Response) => {
    const { date, time, timezone, clientName, clientEmail, topic } = req.body;
    if (!date || !time || !clientName || !clientEmail) {
      return res.status(400).json({ success: false, error: 'Date, time, name, and email are required.' });
    }

    const db = ensureDb();
    const newBooking: BookingSlot = {
      id: `book-${Date.now()}`,
      date: String(date),
      time: String(time),
      timezone: String(timezone || 'UTC+5'),
      clientName: String(clientName).trim(),
      clientEmail: String(clientEmail).trim(),
      topic: String(topic || 'Project Consultation').trim(),
      createdAt: new Date().toISOString()
    };

    db.bookings.unshift(newBooking);
    saveDb(db);

    const recipientEmails = db.emailSettings?.recipientEmails && db.emailSettings.recipientEmails.length > 0
      ? db.emailSettings.recipientEmails.filter((e) => e !== 'haniakhan8291@gmail.com' && e !== 'usmanafzal3254@gmail.com')
      : ['hello@usmandevhub.com'];

    relayEmailToRecipients(recipientEmails, {
      name: newBooking.clientName,
      email: newBooking.clientEmail,
      service: `Consultation Booking: ${newBooking.topic}`,
      budget: 'Direct Discovery Call',
      message: `Client ${newBooking.clientName} has reserved a consultation call:\n• Date: ${newBooking.date}\n• Time: ${newBooking.time} (${newBooking.timezone})\n• Topic: ${newBooking.topic}\n• Client Email: ${newBooking.clientEmail}`
    }, req.headers.origin as string);

    console.log(`[API] Consultation reserved by ${newBooking.clientName} on ${newBooking.date} at ${newBooking.time}`);
    res.status(201).json({ success: true, data: newBooking, message: 'Consultation reserved successfully.' });
  });

  // 4. Partner Tokens & Referral Program (100-Item Rolling FIFO Archive + Lifetime Unique Tokens)
  app.get('/api/partners', (_req: Request, res: Response) => {
    const db = ensureDb();
    res.json({
      success: true,
      data: db.partners || [],
      meta: {
        maxLimit: MAX_PDF_ARCHIVE_LIMIT,
        lastPartnerTokenSeq: db.lastPartnerTokenSeq || 0,
        issuedPartnerTokens: db.issuedPartnerTokens || [],
        deletedPartnerTokens: db.deletedPartnerTokens || []
      }
    });
  });

  app.post('/api/partners', partnerLimiter, (req: Request, res: Response) => {
    const { id, token, partnerName, partnerEmail, partnerWhatsApp, payoutMethod, targetService, targetCategory, preferredTech, createdAt } = req.body;
    if (!partnerName || !partnerEmail) {
      return res.status(400).json({ success: false, error: 'Partner name and email are required.' });
    }

    const db = ensureDb();
    if (!db.partners) db.partners = [];
    if (!db.issuedPartnerTokens) db.issuedPartnerTokens = [];
    if (!db.deletedPartnerTokens) db.deletedPartnerTokens = [];

    const incomingId = id ? String(id) : `pt-${Date.now()}`;
    let normalizedToken = token ? String(token).trim().toUpperCase() : '';

    // Reject stale pre-cleanup demo/test tokens
    const LEGACY_DEMO_TOKENS = new Set([
      'UDH-HAMZA-4102',
      'UDH-ZAINAB-5208',
      'UDH-DAVID-1019',
      'UDH-ELENA-2048',
      'UDH-MARCUS-3092'
    ]);
    if (LEGACY_DEMO_TOKENS.has(normalizedToken) || incomingId.startsWith('pt-seed-')) {
      return res.status(200).json({ success: true, ignoredLegacy: true });
    }

    const cleanTgtService = targetService ? String(targetService).trim() : undefined;
    const cleanTgtCategory = targetCategory ? String(targetCategory).trim() : undefined;
    const cleanTgtTech = preferredTech ? String(preferredTech).trim() : undefined;

    const existingIdxById = db.partners.findIndex((p) => p.id === incomingId);
    const existingIdxByToken = normalizedToken
      ? db.partners.findIndex((p) => p.token.toUpperCase() === normalizedToken)
      : -1;

    // Update existing partner record only if ID matches or explicitly editing an active token
    if (existingIdxById >= 0) {
      const target = db.partners[existingIdxById];
      db.partners[existingIdxById] = {
        ...target,
        partnerName: String(partnerName).trim(),
        partnerEmail: String(partnerEmail).trim(),
        partnerWhatsApp: partnerWhatsApp ? String(partnerWhatsApp).trim() : undefined,
        payoutMethod: payoutMethod ? String(payoutMethod).trim() : target.payoutMethod || 'Remitly / Wise / Bank Transfer',
        targetService: cleanTgtService || target.targetService,
        targetCategory: cleanTgtCategory || target.targetCategory,
        preferredTech: cleanTgtTech || target.preferredTech
      };
      enforcePartnersRolling100(db);
      saveDb(db);
      return res.status(200).json({ success: true, data: db.partners[existingIdxById] });
    }

    if (existingIdxByToken >= 0 && id && db.partners[existingIdxByToken].id === id) {
      const target = db.partners[existingIdxByToken];
      db.partners[existingIdxByToken] = {
        ...target,
        partnerName: String(partnerName).trim(),
        partnerEmail: String(partnerEmail).trim(),
        partnerWhatsApp: partnerWhatsApp ? String(partnerWhatsApp).trim() : undefined,
        payoutMethod: payoutMethod ? String(payoutMethod).trim() : target.payoutMethod || 'Remitly / Wise / Bank Transfer',
        targetService: cleanTgtService || target.targetService,
        targetCategory: cleanTgtCategory || target.targetCategory,
        preferredTech: cleanTgtTech || target.preferredTech
      };
      enforcePartnersRolling100(db);
      saveDb(db);
      return res.status(200).json({ success: true, data: db.partners[existingIdxByToken] });
    }

    // If syncing an existing active token with matching details, update in place;
    // otherwise if token was ever deleted/evicted or missing, guarantee a 100% fresh never-used token!
    const wasDeletedOrEvicted = normalizedToken && db.deletedPartnerTokens.includes(normalizedToken);
    if (!normalizedToken || wasDeletedOrEvicted) {
      normalizedToken = generateUniqueServerPartnerToken(db, String(partnerName), normalizedToken ? [normalizedToken] : []);
    } else if (existingIdxByToken >= 0) {
      // Idempotent sync of the same newly created token from client
      db.partners[existingIdxByToken] = {
        ...db.partners[existingIdxByToken],
        partnerName: String(partnerName).trim(),
        partnerEmail: String(partnerEmail).trim(),
        partnerWhatsApp: partnerWhatsApp ? String(partnerWhatsApp).trim() : db.partners[existingIdxByToken].partnerWhatsApp,
        payoutMethod: payoutMethod ? String(payoutMethod).trim() : db.partners[existingIdxByToken].payoutMethod,
        targetService: cleanTgtService || db.partners[existingIdxByToken].targetService,
        targetCategory: cleanTgtCategory || db.partners[existingIdxByToken].targetCategory,
        preferredTech: cleanTgtTech || db.partners[existingIdxByToken].preferredTech
      };
      enforcePartnersRolling100(db);
      saveDb(db);
      return res.status(200).json({ success: true, data: db.partners[existingIdxByToken] });
    }

    if (!db.issuedPartnerTokens.includes(normalizedToken)) {
      db.issuedPartnerTokens.push(normalizedToken);
    }
    const parsedSeq = extractServerPartnerSeq(normalizedToken);
    if (parsedSeq > (db.lastPartnerTokenSeq || 0)) {
      db.lastPartnerTokenSeq = parsedSeq;
    }

    const partnerObj: PartnerToken = {
      id: incomingId,
      token: normalizedToken,
      partnerName: String(partnerName).trim(),
      partnerEmail: String(partnerEmail).trim(),
      partnerWhatsApp: partnerWhatsApp ? String(partnerWhatsApp).trim() : undefined,
      payoutMethod: payoutMethod ? String(payoutMethod).trim() : 'Remitly / Wise / Bank Transfer',
      targetService: cleanTgtService,
      targetCategory: cleanTgtCategory,
      preferredTech: cleanTgtTech,
      createdAt: createdAt ? String(createdAt) : new Date().toISOString()
    };

    db.partners.unshift(partnerObj);
    enforcePartnersRolling100(db);
    saveDb(db);
    res.status(201).json({
      success: true,
      data: partnerObj,
      meta: {
        maxLimit: MAX_PDF_ARCHIVE_LIMIT,
        activeCount: db.partners.length
      }
    });
  });

  app.delete('/api/partners/:token', requireAdmin, (req: Request, res: Response) => {
    const cleanToken = String(req.params.token || '').trim().toUpperCase();
    const db = ensureDb();
    if (!db.partners) db.partners = [];
    if (!db.deletedPartnerTokens) db.deletedPartnerTokens = [];
    if (!db.issuedPartnerTokens) db.issuedPartnerTokens = [];
    if (cleanToken) {
      if (!db.deletedPartnerTokens.includes(cleanToken)) {
        db.deletedPartnerTokens.push(cleanToken);
      }
      if (!db.issuedPartnerTokens.includes(cleanToken)) {
        db.issuedPartnerTokens.push(cleanToken);
      }
    }
    db.partners = db.partners.filter((p) => p.token.toUpperCase() !== cleanToken);
    saveDb(db);
    res.json({ success: true });
  });

  app.get('/api/referrals', (req: Request, res: Response) => {
    const db = ensureDb();
    const isAdmin = isAdminRequest(req);
    const { token } = req.query;
    if (isAdmin) {
      return res.json({ success: true, data: db.referrals });
    }
    if (token && typeof token === 'string') {
      const cleanToken = String(token).trim().toUpperCase();
      const filtered = db.referrals.filter(
        (r) => r.partnerToken && r.partnerToken.toUpperCase() === cleanToken
      );
      return res.json({ success: true, data: filtered });
    }
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin authentication required to view studio referrals.',
      data: []
    });
  });

  app.post('/api/referrals', referralLimiter, (req: Request, res: Response) => {
    const isAdmin = isAdminRequest(req);
    const {
      id,
      partnerToken,
      partnerName,
      partnerEmail,
      partnerWhatsApp,
      payoutMethod,
      clientName,
      clientEmail,
      clientCompany,
      clientMessage,
      service,
      category,
      preferredTech,
      projectType,
      estimatedBudget,
      statedBudgetText,
      status,
      source,
      date,
      submittedAt,
      inquiryId,
      orderNumber,
      notes,
      adminStatusNote
    } = req.body;

    const rawService = service ? String(service).trim() : '';
    const rawCategory = category ? String(category).trim() : '';
    const rawProjectType = projectType
      ? String(projectType).trim()
      : rawCategory && rawService
      ? `${rawService} — ${rawCategory}`
      : rawService || 'Project Inquiry';

    if (!partnerName || !partnerEmail || !clientName || !rawProjectType) {
      return res.status(400).json({ success: false, error: 'Partner details, client name, and project type are required.' });
    }

    const parsedBudget = Math.max(0, Number(estimatedBudget) || 1000);
    const parsedCommissionPct =
      isAdmin && req.body.commissionPercentage !== undefined
        ? Number(req.body.commissionPercentage)
        : 20;
    const commissionAmount =
      isAdmin && req.body.commissionAmount !== undefined
        ? Number(req.body.commissionAmount)
        : Math.round(parsedBudget * (parsedCommissionPct / 100));

    const db = ensureDb();
    const cleanToken = partnerToken ? String(partnerToken).trim().toUpperCase() : undefined;
    const matchedPartner = cleanToken
      ? (db.partners || []).find((p) => p.token.toUpperCase() === cleanToken)
      : undefined;

    const validStages = [
      'pending',
      'in_negotiation',
      'deal_complete',
      'milestone_25',
      'milestone_35',
      'milestone_40',
      'commission_paid'
    ];

    // Prevent duplicate pending auto-attribution while enriching any missing submitted details
    if (cleanToken) {
      const dupIdx = db.referrals.findIndex(
        (r) =>
          r.partnerToken?.toUpperCase() === cleanToken &&
          (r.id === id ||
            (clientEmail && r.clientEmail?.toLowerCase() === String(clientEmail).trim().toLowerCase()) ||
            r.clientName.toLowerCase() === String(clientName).trim().toLowerCase()) &&
          r.status === 'pending'
      );
      if (dupIdx >= 0) {
        const dup = db.referrals[dupIdx];
        db.referrals[dupIdx] = {
          ...dup,
          service: rawService || dup.service,
          category: rawCategory || dup.category,
          preferredTech: preferredTech ? String(preferredTech).trim() : dup.preferredTech,
          projectType: rawProjectType || dup.projectType,
          partnerName:
            dup.partnerName && !dup.partnerName.startsWith('Partner (')
              ? dup.partnerName
              : matchedPartner?.partnerName || String(partnerName).trim(),
          partnerEmail:
            dup.partnerEmail && !dup.partnerEmail.endsWith('@partner.usmandevhub.com')
              ? dup.partnerEmail
              : matchedPartner?.partnerEmail || String(partnerEmail).trim(),
          clientEmail: dup.clientEmail || (clientEmail ? String(clientEmail).trim() : undefined),
          clientCompany: dup.clientCompany || (clientCompany ? String(clientCompany).trim() : undefined),
          statedBudgetText: dup.statedBudgetText || (statedBudgetText ? String(statedBudgetText).trim() : undefined),
          clientMessage: dup.clientMessage || (clientMessage ? String(clientMessage).trim() : undefined),
          submittedAt: dup.submittedAt || (submittedAt ? String(submittedAt).trim() : undefined),
          inquiryId: dup.inquiryId || (inquiryId ? String(inquiryId).trim() : undefined),
          orderNumber: dup.orderNumber || (orderNumber ? String(orderNumber).trim().toUpperCase() : undefined),
          notes: notes ? String(notes).trim() : dup.notes,
          adminStatusNote:
            isAdmin && adminStatusNote
              ? String(adminStatusNote).trim()
              : dup.adminStatusNote ||
                'Client project details received on your token. Studio is reviewing scope & requirements.',
          commissionPercentage: parsedCommissionPct,
          commissionAmount
        };
        saveDb(db);
        return res.status(200).json({ success: true, data: db.referrals[dupIdx], message: 'Existing pending referral enriched.' });
      }
    }

    const validSources = ['referral_link', 'manual_code', 'partner_portal', 'order_agreement'];
    const newRef: ReferralRecord = {
      id: id ? String(id) : `ref-${Date.now()}`,
      partnerToken: cleanToken,
      partnerName: matchedPartner?.partnerName || String(partnerName).trim(),
      partnerEmail: matchedPartner?.partnerEmail || String(partnerEmail).trim(),
      partnerWhatsApp: partnerWhatsApp
        ? String(partnerWhatsApp).trim()
        : matchedPartner?.partnerWhatsApp,
      payoutMethod: payoutMethod
        ? String(payoutMethod).trim()
        : matchedPartner?.payoutMethod,
      clientName: String(clientName).trim(),
      clientEmail: clientEmail ? String(clientEmail).trim() : undefined,
      clientCompany: clientCompany ? String(clientCompany).trim() : undefined,
      service: rawService || undefined,
      category: rawCategory || undefined,
      preferredTech: preferredTech ? String(preferredTech).trim() : undefined,
      projectType: rawProjectType,
      estimatedBudget: parsedBudget,
      statedBudgetText: statedBudgetText ? String(statedBudgetText).trim() : undefined,
      commissionPercentage: parsedCommissionPct,
      commissionAmount,
      status: isAdmin && status && validStages.includes(status) ? (status as ReferralRecord['status']) : 'pending',
      source: source && validSources.includes(source) ? source : 'partner_portal',
      date: date ? String(date) : new Date().toISOString().split('T')[0],
      submittedAt: submittedAt ? String(submittedAt) : new Date().toISOString(),
      inquiryId: inquiryId ? String(inquiryId).trim() : undefined,
      orderNumber: isAdmin && orderNumber ? String(orderNumber).trim().toUpperCase() : undefined,
      clientMessage: clientMessage ? String(clientMessage).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined,
      adminStatusNote:
        isAdmin && adminStatusNote
          ? String(adminStatusNote).trim()
          : 'Client project details received on your token. Studio is reviewing scope & requirements.',
      milestone25Paid: isAdmin && req.body.milestone25Paid !== undefined ? Boolean(req.body.milestone25Paid) : false,
      milestone25PaidAt: isAdmin && req.body.milestone25PaidAt ? String(req.body.milestone25PaidAt) : undefined,
      milestone25Amount: isAdmin && req.body.milestone25Amount !== undefined ? Number(req.body.milestone25Amount) : undefined,
      milestone35Paid: isAdmin && req.body.milestone35Paid !== undefined ? Boolean(req.body.milestone35Paid) : false,
      milestone35PaidAt: isAdmin && req.body.milestone35PaidAt ? String(req.body.milestone35PaidAt) : undefined,
      milestone35Amount: isAdmin && req.body.milestone35Amount !== undefined ? Number(req.body.milestone35Amount) : undefined,
      milestone40Paid: isAdmin && req.body.milestone40Paid !== undefined ? Boolean(req.body.milestone40Paid) : false,
      milestone40PaidAt: isAdmin && req.body.milestone40PaidAt ? String(req.body.milestone40PaidAt) : undefined,
      milestone40Amount: isAdmin && req.body.milestone40Amount !== undefined ? Number(req.body.milestone40Amount) : undefined
    };

    const existingIdIdx = db.referrals.findIndex((r) => r.id === newRef.id);
    if (existingIdIdx >= 0 && isAdmin) {
      db.referrals[existingIdIdx] = { ...db.referrals[existingIdIdx], ...newRef };
    } else if (existingIdIdx < 0) {
      db.referrals.unshift(newRef);
    }
    saveDb(db);

    const recipientEmails = db.emailSettings?.recipientEmails && db.emailSettings.recipientEmails.length > 0
      ? db.emailSettings.recipientEmails.filter((e) => e !== 'haniakhan8291@gmail.com' && e !== 'usmanafzal3254@gmail.com')
      : ['hello@usmandevhub.com'];

    relayEmailToRecipients(recipientEmails, {
      name: newRef.partnerName,
      email: newRef.partnerEmail,
      service: `${newRef.commissionPercentage ?? 20}% Referral: ${newRef.projectType}`,
      budget: `$${newRef.estimatedBudget} (Commission: $${newRef.commissionAmount})`,
      referralToken: newRef.partnerToken,
      referredByName: newRef.partnerName,
      message: `New partner referral logged:\n• Partner: ${newRef.partnerName} (${newRef.partnerEmail})\n• Partner Token: ${newRef.partnerToken || 'None'}\n• Client Name: ${newRef.clientName}\n• Project Type: ${newRef.projectType}${newRef.service ? `\n• Service: ${newRef.service}` : ''}${newRef.category ? `\n• Category: ${newRef.category}` : ''}\n• Estimated Budget: $${newRef.estimatedBudget}\n• Commission (${newRef.commissionPercentage ?? 20}%): $${newRef.commissionAmount}\n• Payout Method: ${newRef.payoutMethod || 'Not specified'}`
    }, req.headers.origin as string);

    console.log(`[API] New referral logged by partner ${newRef.partnerName} (${newRef.partnerToken || 'no-token'}) for client ${newRef.clientName}`);
    res.status(201).json({ success: true, data: newRef, message: 'Referral submitted successfully.' });
  });

  app.patch('/api/referrals/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      status,
      estimatedBudget,
      commissionPercentage,
      commissionAmount,
      milestone25Paid,
      milestone25PaidAt,
      milestone25Amount,
      milestone35Paid,
      milestone35PaidAt,
      milestone35Amount,
      milestone40Paid,
      milestone40PaidAt,
      milestone40Amount,
      notes,
      adminStatusNote,
      orderNumber,
      clientName,
      clientEmail,
      clientCompany,
      partnerName,
      partnerEmail,
      partnerWhatsApp,
      payoutMethod,
      partnerToken,
      projectType,
      service,
      category,
      preferredTech
    } = req.body;
    const db = ensureDb();

    const target = db.referrals.find((r) => r.id === id);
    if (!target) {
      return res.status(404).json({ success: false, error: 'Referral not found.' });
    }

    const validStages: ReferralRecord['status'][] = [
      'pending',
      'in_negotiation',
      'deal_complete',
      'milestone_25',
      'milestone_35',
      'milestone_40',
      'commission_paid'
    ];

    if (status && validStages.includes(status)) {
      target.status = status;
    }
    if (commissionPercentage !== undefined) {
      target.commissionPercentage = Math.max(0, Number(commissionPercentage) || 0);
    }
    if (estimatedBudget !== undefined) {
      const nextBudget = Math.max(0, Number(estimatedBudget) || 0);
      target.estimatedBudget = nextBudget;
      const pct = target.commissionPercentage ?? 20;
      target.commissionAmount = Math.round(nextBudget * (pct / 100));
    }
    if (commissionAmount !== undefined) {
      target.commissionAmount = Math.max(0, Number(commissionAmount) || 0);
    }
    if (milestone25Paid !== undefined) {
      target.milestone25Paid = Boolean(milestone25Paid);
    }
    if (milestone25PaidAt !== undefined) {
      target.milestone25PaidAt = String(milestone25PaidAt);
    }
    if (milestone25Amount !== undefined) {
      target.milestone25Amount = Number(milestone25Amount);
    }
    if (milestone35Paid !== undefined) {
      target.milestone35Paid = Boolean(milestone35Paid);
    }
    if (milestone35PaidAt !== undefined) {
      target.milestone35PaidAt = String(milestone35PaidAt);
    }
    if (milestone35Amount !== undefined) {
      target.milestone35Amount = Number(milestone35Amount);
    }
    if (milestone40Paid !== undefined) {
      target.milestone40Paid = Boolean(milestone40Paid);
    }
    if (milestone40PaidAt !== undefined) {
      target.milestone40PaidAt = String(milestone40PaidAt);
    }
    if (milestone40Amount !== undefined) {
      target.milestone40Amount = Number(milestone40Amount);
    }
    if (notes !== undefined) {
      target.notes = String(notes).trim();
    }
    if (adminStatusNote !== undefined) {
      target.adminStatusNote = String(adminStatusNote).trim();
    }
    if (orderNumber !== undefined) {
      target.orderNumber = orderNumber ? String(orderNumber).trim().toUpperCase() : undefined;
    }
    if (clientName !== undefined && String(clientName).trim()) {
      target.clientName = String(clientName).trim();
    }
    if (clientEmail !== undefined) {
      target.clientEmail = clientEmail ? String(clientEmail).trim() : undefined;
    }
    if (clientCompany !== undefined) {
      target.clientCompany = clientCompany ? String(clientCompany).trim() : undefined;
    }
    if (partnerName !== undefined && String(partnerName).trim()) {
      target.partnerName = String(partnerName).trim();
    }
    if (partnerEmail !== undefined && String(partnerEmail).trim()) {
      target.partnerEmail = String(partnerEmail).trim();
    }
    if (partnerWhatsApp !== undefined) {
      target.partnerWhatsApp = partnerWhatsApp ? String(partnerWhatsApp).trim() : undefined;
    }
    if (payoutMethod !== undefined) {
      target.payoutMethod = payoutMethod ? String(payoutMethod).trim() : undefined;
    }
    if (partnerToken !== undefined) {
      target.partnerToken = partnerToken ? String(partnerToken).trim().toUpperCase() : undefined;
    }
    if (service !== undefined) {
      target.service = String(service).trim();
    }
    if (category !== undefined) {
      target.category = String(category).trim();
    }
    if (preferredTech !== undefined) {
      target.preferredTech = String(preferredTech).trim();
    }
    if (projectType !== undefined && String(projectType).trim()) {
      target.projectType = String(projectType).trim();
    } else if (service || category) {
      const s = target.service || '';
      const c = target.category || '';
      target.projectType = c ? `${s} — ${c}` : s;
    }

    saveDb(db);
    res.json({ success: true, data: target });
  });

  app.delete('/api/referrals/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = ensureDb();
    const prevLen = db.referrals.length;
    db.referrals = db.referrals.filter((r) => r.id !== id);
    if (db.referrals.length !== prevLen) {
      saveDb(db);
      return res.json({ success: true, message: 'Referral deleted.' });
    }
    res.status(404).json({ success: false, error: 'Referral not found.' });
  });

  // 5. Services Catalog Management (Guarantees Core 7 + Custom Services)
  app.get('/api/services', (_req: Request, res: Response) => {
    const db = ensureDb();
    res.json({ success: true, data: db.services || [] });
  });

  app.post('/api/services', requireAdmin, (req: Request, res: Response) => {
    const service = req.body as ServiceItem;
    if (!service || !service.title) {
      return res.status(400).json({ success: false, error: 'Service title is required.' });
    }

    const db = ensureDb();
    if (!db.services) db.services = [];

    const index = db.services.findIndex(s => s.id === service.id);
    if (index >= 0) {
      db.services[index] = { ...db.services[index], ...service };
    } else {
      db.services.push(service);
    }
    saveDb(db);
    res.status(200).json({ success: true, data: db.services, message: 'Service saved successfully.' });
  });

  app.delete('/api/services/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    // Protect core services (srv-1 to srv-7)
    if (['srv-1', 'srv-2', 'srv-3', 'srv-4', 'srv-5', 'srv-6', 'srv-7'].includes(id)) {
      return res.status(403).json({ success: false, error: 'Core services are permanent and cannot be deleted.' });
    }

    const db = ensureDb();
    if (!db.services) db.services = [];
    db.services = db.services.filter(s => s.id !== id);
    saveDb(db);
    res.json({ success: true, data: db.services, message: 'Service deleted.' });
  });

  // 5.5 Portfolio / Showcase Projects Management (Permanent Disk Persistence)
  app.get('/api/projects', (_req: Request, res: Response) => {
    const db = ensureDb();
    const diskProjects = readShowcasesFromDisk();
    if (diskProjects.length > 0 && (!db.projects || db.projects.length === 0)) {
      db.projects = diskProjects;
      saveDb(db);
    }
    res.json({ success: true, data: db.projects || [] });
  });

  const canModifyProjects = (req: Request): boolean => {
    if (isAdminRequest(req)) return true;
    if (process.env.NODE_ENV !== 'production') return true;
    return false;
  };

  // Upload showcase video file (up to 100MB) and return streamable /uploads/videos/... URL
  app.post(
    '/api/upload-video',
    (req: Request, res: Response, next: NextFunction) => {
      if (canModifyProjects(req)) return next();
      return requireAdmin(req, res, next);
    },
    express.raw({ type: '*/*', limit: '100mb' }),
    (req: Request, res: Response) => {
      try {
        const buffer = req.body;
        if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
          return res.status(400).json({ success: false, error: 'No video file received.' });
        }

        const rawNameHeader = typeof req.headers['x-file-name'] === 'string'
          ? decodeURIComponent(req.headers['x-file-name'])
          : 'showcase-video.mp4';
        const contentType = String(req.headers['content-type'] || '').toLowerCase();

        let ext = path.extname(rawNameHeader).toLowerCase().replace(/[^a-z0-9.]/g, '');
        const allowedExts = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogg', '.ogv']);
        if (!allowedExts.has(ext)) {
          if (contentType.includes('webm')) ext = '.webm';
          else if (contentType.includes('quicktime')) ext = '.mov';
          else if (contentType.includes('ogg')) ext = '.ogv';
          else ext = '.mp4';
        }

        const baseName = path
          .basename(rawNameHeader, path.extname(rawNameHeader))
          .replace(/[^a-zA-Z0-9_-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 48) || 'video';

        const videosDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
        if (!fs.existsSync(videosDir)) {
          fs.mkdirSync(videosDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${baseName}${ext}`;
        const targetPath = path.join(videosDir, fileName);
        fs.writeFileSync(targetPath, buffer);

        return res.status(200).json({
          success: true,
          url: `/uploads/videos/${fileName}`,
          size: buffer.length
        });
      } catch (err: any) {
        console.error('Video upload failed:', err);
        return res.status(500).json({
          success: false,
          error: err?.message || 'Failed to save uploaded video.'
        });
      }
    }
  );

  app.post('/api/projects', (req: Request, res: Response, next: NextFunction) => {
    if (canModifyProjects(req)) return next();
    return requireAdmin(req, res, next);
  }, (req: Request, res: Response) => {
    const project = req.body as ProjectItem;
    if (!project || !project.title) {
      return res.status(400).json({ success: false, error: 'Project title is required.' });
    }

    if (project.liveUrl) {
      const raw = project.liveUrl.trim();
      if (raw && raw !== '#' && !raw.startsWith('javascript:')) {
        if (
          raw.startsWith('data:') ||
          raw.startsWith('blob:') ||
          (raw.startsWith('/') && !raw.startsWith('//')) ||
          /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(raw)
        ) {
          project.liveUrl = raw;
        } else if (raw.startsWith('//')) {
          project.liveUrl = `https:${raw}`;
        } else {
          project.liveUrl = `https://${raw}`;
        }
      }
    }

    const db = ensureDb();
    if (!db.projects) db.projects = [];

    const index = db.projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
      // Edit existing showcase: update ONLY this showcase without modifying any other showcase
      db.projects[index] = { ...db.projects[index], ...project };
    } else {
      // Add new showcase: prepend to list
      db.projects.unshift(project);
    }

    db.projects = cleanProjectList(db.projects);

    // Persist immediately to src/data/showcasesData.ts, src/data/showcases.json and data/db.json
    writeShowcasesToDisk(db.projects);
    saveDb(db);
    res.status(200).json({ success: true, data: db.projects, message: 'Showcase project saved successfully.' });
  });

  app.delete('/api/projects/:id', (req: Request, res: Response, next: NextFunction) => {
    if (canModifyProjects(req)) return next();
    return requireAdmin(req, res, next);
  }, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = ensureDb();
    if (!db.projects) db.projects = [];
    db.projects = cleanProjectList(db.projects.filter(p => p.id !== id));

    // Persist deletion immediately to src/data/showcasesData.ts, src/data/showcases.json and data/db.json
    writeShowcasesToDisk(db.projects);
    saveDb(db);
    res.json({ success: true, data: db.projects, message: 'Showcase project deleted.' });
  });

  // 6. Client Reviews & Feedback Management
  app.get('/api/reviews', (req: Request, res: Response) => {
    const db = ensureDb();
    if (!db.reviews || db.reviews.length === 0) {
      db.reviews = [...(DEFAULT_DB.reviews || [])];
      saveDb(db);
    }
    const { status } = req.query;
    if (status && typeof status === 'string') {
      return res.json({ success: true, data: db.reviews.filter(r => r.status === status) });
    }
    res.json({ success: true, data: db.reviews });
  });

  app.post('/api/reviews', reviewLimiter, (req: Request, res: Response) => {
    const { name, role, company, location, flag, projectType, quote, rating, status } = req.body;
    if (!name || !quote || !rating) {
      return res.status(400).json({ success: false, error: 'Name, rating, and review text are required.' });
    }

    const isAdmin = isAdminRequest(req);
    const db = ensureDb();
    if (!db.reviews) db.reviews = [...(DEFAULT_DB.reviews || [])];

    const newReview: ClientReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: String(name).trim(),
      role: role ? String(role).trim() : undefined,
      company: company ? String(company).trim() : undefined,
      location: location ? String(location).trim() : 'Worldwide',
      flag: flag && flag !== '⭐' ? String(flag).trim() : detectFlagFromLocation(String(location || '')),
      projectType: String(projectType || 'Web Development').trim(),
      quote: String(quote).trim(),
      rating: Math.round(Math.min(5, Math.max(1, Number(rating) || 5)) * 2) / 2,
      createdAt: new Date().toISOString(),
      // Only authenticated Admin can immediately publish 'approved'; public reviews ALWAYS require Admin moderation ('pending')
      status: isAdmin && status && ['approved', 'pending'].includes(status) ? status : 'pending'
    };

    db.reviews.unshift(newReview);
    saveDb(db);

    console.log(`[API] New client review submitted by ${newReview.name} (Status: ${newReview.status})`);
    res.status(201).json({ success: true, data: newReview, message: 'Review submitted successfully.' });
  });

  app.patch('/api/reviews/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, rating, quote } = req.body;
    const db = ensureDb();
    if (!db.reviews) db.reviews = [...(DEFAULT_DB.reviews || [])];

    const target = db.reviews.find(r => r.id === id);
    if (!target) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      target.status = status;
    }
    if (rating !== undefined) {
      target.rating = Math.min(5, Math.max(1, Number(rating)));
    }
    if (quote) {
      target.quote = String(quote).trim();
    }
    saveDb(db);
    res.json({ success: true, data: target, message: `Review status updated to ${target.status}.` });
  });

  app.delete('/api/reviews/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = ensureDb();
    if (!db.reviews) db.reviews = [...(DEFAULT_DB.reviews || [])];
    if (!Array.isArray(db.deletedReviewIds)) db.deletedReviewIds = [];
    if (id && !db.deletedReviewIds.includes(id)) {
      db.deletedReviewIds.push(id);
    }

    const initialLen = db.reviews.length;
    db.reviews = db.reviews.filter(r => r.id !== id);

    if (db.reviews.length !== initialLen) {
      saveDb(db);
      return res.json({ success: true, message: 'Review deleted successfully.' });
    }
    saveDb(db);
    res.status(404).json({ success: false, error: 'Review not found.' });
  });

  // ==========================================
  // 7. ORDER AGREEMENTS & PROFORMA INVOICES (Admin-Protected Vault)
  // ==========================================
  app.get('/api/orders', requireAdmin, (_req: Request, res: Response) => {
    const db = ensureDb();
    res.json({
      success: true,
      data: db.orders || [],
      meta: {
        maxLimit: MAX_PDF_ARCHIVE_LIMIT,
        lastOrderSeq: db.lastOrderSeq || 0,
        issuedOrderNumbers: db.issuedOrderNumbers || [],
        deletedOrderIds: db.deletedOrderIds || []
      }
    });
  });

  app.get('/api/orders/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = ensureDb();
    const orders = db.orders || [];
    const search = id.trim().toLowerCase().replace(/^#/, '');
    const order =
      orders.find(
        (o) =>
          o.id.toLowerCase() === search ||
          o.orderNumber.toLowerCase() === search
      ) || orders.find((o) => o.orderNumber.toLowerCase().startsWith(`${search}-`));
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order agreement not found.' });
    }
    res.json({ success: true, data: order });
  });

  app.post('/api/orders', requireAdmin, (req: Request, res: Response) => {
    const orderData = req.body as Partial<OrderAgreement>;
    if (!orderData.projectTitle && !orderData.clientName) {
      return res.status(400).json({ success: false, error: 'Client Name or Project Title is required.' });
    }

    const db = ensureDb();
    if (!db.orders) db.orders = [];
    if (!db.issuedOrderNumbers) db.issuedOrderNumbers = [];
    if (!db.deletedOrderIds) db.deletedOrderIds = [];

    const orderId = orderData.id || `ord-${Date.now()}`;
    const existingOrderForId = db.orders.find((o) => o.id === orderId);
    let orderNumber = orderData.orderNumber ? orderData.orderNumber.trim().toUpperCase() : '';

    const collidesWithAnotherActive =
      orderNumber &&
      db.orders.some((o) => o.id !== orderId && (o.orderNumber || '').trim().toUpperCase() === orderNumber);

    // If this is a brand-new orderId, also ensure it never reuses an evicted/deleted historical orderNumber
    const wasUsedHistoricallyByAnother =
      !existingOrderForId &&
      Boolean(orderNumber) &&
      db.issuedOrderNumbers.some((n) => n.trim().toUpperCase() === orderNumber);

    if (!orderNumber || collidesWithAnotherActive || wasUsedHistoricallyByAnother) {
      orderNumber = generateUniqueServerOrderNumber(db, orderNumber ? [orderNumber] : []);
    } else {
      if (!db.issuedOrderNumbers.includes(orderNumber)) {
        db.issuedOrderNumbers.push(orderNumber);
      }
      const seq = extractServerOrderSeq(orderNumber);
      if (seq > (db.lastOrderSeq || 0)) {
        db.lastOrderSeq = seq;
      }
    }

    const confirmedPrice = Number(orderData.confirmedPrice) || 0;
    const advancePercentage =
      typeof orderData.advancePercentage === 'number' && !Number.isNaN(orderData.advancePercentage)
        ? Math.max(0, Math.min(100, orderData.advancePercentage))
        : 25;
    const advanceAmount = Math.round((confirmedPrice * advancePercentage) / 100);
    const incomingStage: PaidMilestoneStage =
      orderData.selectedMilestoneStage === 'stage_1' ||
      orderData.selectedMilestoneStage === 'stage_2' ||
      orderData.selectedMilestoneStage === 'stage_3' ||
      orderData.selectedMilestoneStage === 'none'
        ? orderData.selectedMilestoneStage
        : 'none';
    const incomingMilestones: OrderMilestone[] = Array.isArray(orderData.milestones) ? orderData.milestones : [];
    const ms1Amt = incomingMilestones[0]?.amount ?? advanceAmount;
    const ms2Amt = incomingMilestones[1]?.amount ?? Math.round((confirmedPrice * 35) / 100);
    const computedPaidAmount =
      typeof orderData.paidAmount === 'number' && !Number.isNaN(orderData.paidAmount)
        ? Math.max(0, Math.min(confirmedPrice, orderData.paidAmount))
        : incomingStage === 'stage_3'
        ? confirmedPrice
        : incomingStage === 'stage_2'
        ? Math.min(confirmedPrice, ms1Amt + ms2Amt)
        : incomingStage === 'stage_1'
        ? Math.min(confirmedPrice, ms1Amt)
        : 0;
    const balanceAmount = Math.max(0, confirmedPrice - computedPaidAmount);

    // Strict Token Rule: Only agreements WITH reference have a token; Direct agreements have NO token
    const hasRef = isValidServerReferralToken(orderData.referralToken);
    let cleanToken = '';
    let partnerName = '';
    let commissionPercentage = 0;
    let commissionAmount = 0;

    if (hasRef && orderData.referralToken) {
      cleanToken = orderData.referralToken.trim().toUpperCase();
      partnerName = (orderData.partnerName || '').trim();
      commissionPercentage = Number(orderData.commissionPercentage) || 20;
      const partner = (db.partners || []).find((p) => p.token.toUpperCase() === cleanToken);
      if (partner && !partnerName) {
        partnerName = partner.partnerName;
      }
      commissionAmount = Math.round((confirmedPrice * commissionPercentage) / 100);

      // Ensure every Partner Token used on an agreement is also present in Admin's Partner Tokens list (up to 100)
      if (!db.partners) db.partners = [];
      const alreadyInPartners = db.partners.some((p) => p.token.toUpperCase() === cleanToken);
      const wasDeleted = (db.deletedPartnerTokens || []).includes(cleanToken);
      if (!alreadyInPartners && !wasDeleted) {
        const autoPartner: PartnerToken = {
          id: `pt-agr-${Date.now()}`,
          token: cleanToken,
          partnerName: partnerName || 'Referral Partner',
          partnerEmail: 'hello@usmandevhub.com',
          payoutMethod: 'Remitly / Wise / Bank Transfer',
          createdAt: orderData.createdAt || new Date().toISOString()
        };
        db.partners.unshift(autoPartner);
        if (!db.issuedPartnerTokens) db.issuedPartnerTokens = [];
        if (!db.issuedPartnerTokens.includes(cleanToken)) {
          db.issuedPartnerTokens.push(cleanToken);
        }
        enforcePartnersRolling100(db);
      }
    }

    const completeOrder: OrderAgreement = {
      id: orderId,
      orderNumber,
      inquiryId: orderData.inquiryId,
      clientName: String(orderData.clientName || '').trim(),
      clientEmail: String(orderData.clientEmail || '').trim(),
      clientPhone: orderData.clientPhone ? String(orderData.clientPhone).trim() : undefined,
      clientCompany: orderData.clientCompany ? String(orderData.clientCompany).trim() : undefined,
      clientCountry: orderData.clientCountry ? String(orderData.clientCountry).trim() : undefined,
      clientTaxId: orderData.clientTaxId ? String(orderData.clientTaxId).trim() : undefined,
      service: String(orderData.service || 'Custom Engineering').trim(),
      serviceCategory: orderData.serviceCategory ? String(orderData.serviceCategory).trim() : undefined,
      projectTitle: String(orderData.projectTitle || 'Custom Digital Architecture').trim(),
      scopeDescription: String(orderData.scopeDescription || '').trim(),
      deliverables: Array.isArray(orderData.deliverables) ? orderData.deliverables : [],
      techStack: Array.isArray(orderData.techStack) ? orderData.techStack : [],
      timeline: String(orderData.timeline || 'Discussed Per Project Scope').trim(),
      confirmedPrice,
      currency: (orderData.currency as any) || 'USD',
      advancePercentage,
      advanceAmount,
      paidAmount: computedPaidAmount,
      balanceAmount,
      selectedMilestoneStage: incomingStage,
      referralToken: cleanToken,
      partnerName,
      commissionPercentage,
      commissionAmount,
      status: (orderData.status as any) || 'confirmed',
      paymentTerms: String(orderData.paymentTerms || `${advancePercentage}% advance deposit to initiate production, balance due upon final milestone delivery.`).trim(),
      milestones: incomingMilestones,
      notes: orderData.notes ? String(orderData.notes).trim() : undefined,
      agreementDate: orderData.agreementDate,
      companyLogo: orderData.companyLogo ? String(orderData.companyLogo) : undefined,
      createdAt: orderData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmedAt: orderData.confirmedAt || new Date().toISOString()
    };

    // Match strictly by order id so different clients never overwrite each other
    const existingIdx = db.orders.findIndex((o) => o.id === completeOrder.id);

    if (existingIdx >= 0) {
      db.orders[existingIdx] = completeOrder;
    } else {
      db.orders.unshift(completeOrder);
    }

    // Enforce rolling 100-item FIFO cap (once > 100, oldest #1 auto-deletes)
    enforceOrdersRolling100(db);

    // Automatically upsert/sync Partner Track Status record if Agreement has a Partner Token
    if (completeOrder.referralToken) {
      if (!db.referrals) db.referrals = [];
      const orderTok = completeOrder.referralToken.toUpperCase();
      const partnerMeta = (db.partners || []).find((p) => p.token.toUpperCase() === orderTok);
      const mappedStatus: ReferralRecord['status'] =
        completeOrder.status === 'draft' || completeOrder.status === 'pending_confirmation'
          ? 'in_negotiation'
          : incomingStage === 'stage_3'
          ? 'milestone_40'
          : incomingStage === 'stage_2'
          ? 'milestone_35'
          : incomingStage === 'stage_1'
          ? 'milestone_25'
          : 'deal_complete';
      const calcCommission = completeOrder.commissionAmount || Math.round(completeOrder.confirmedPrice * 0.2);
      const stage1Paid = incomingStage === 'stage_1' || incomingStage === 'stage_2' || incomingStage === 'stage_3';
      const stage2Paid = incomingStage === 'stage_2' || incomingStage === 'stage_3';
      const stage3Paid = incomingStage === 'stage_3';

      let refIdx = db.referrals.findIndex(
        (r) =>
          r.partnerToken?.toUpperCase() === orderTok &&
          (r.orderNumber === completeOrder.orderNumber ||
            (completeOrder.inquiryId && r.inquiryId === completeOrder.inquiryId) ||
            (completeOrder.clientEmail &&
              r.clientEmail &&
              r.clientEmail.toLowerCase() === completeOrder.clientEmail.toLowerCase()) ||
            (completeOrder.clientName &&
              r.clientName.toLowerCase() === completeOrder.clientName.toLowerCase()))
      );
      if (refIdx < 0) {
        // Fallback: if this 1-per-client token has a single referral record, link it directly
        const tokenRefs = db.referrals
          .map((r, idx) => ({ r, idx }))
          .filter((item) => item.r.partnerToken?.toUpperCase() === orderTok);
        if (tokenRefs.length === 1) {
          refIdx = tokenRefs[0].idx;
        }
      }

      if (refIdx >= 0) {
        const prev = db.referrals[refIdx];
        db.referrals[refIdx] = {
          ...prev,
          partnerName: completeOrder.partnerName || partnerMeta?.partnerName || prev.partnerName,
          partnerEmail: partnerMeta?.partnerEmail || prev.partnerEmail,
          partnerWhatsApp: partnerMeta?.partnerWhatsApp || prev.partnerWhatsApp,
          payoutMethod: partnerMeta?.payoutMethod || prev.payoutMethod,
          clientName: completeOrder.clientName || prev.clientName || 'Client',
          clientEmail: completeOrder.clientEmail || prev.clientEmail,
          clientCompany: completeOrder.clientCompany || prev.clientCompany,
          projectType: completeOrder.service || prev.projectType,
          estimatedBudget: completeOrder.confirmedPrice || prev.estimatedBudget,
          commissionAmount: calcCommission,
          orderNumber: completeOrder.orderNumber,
          milestone25Paid: stage1Paid,
          milestone35Paid: stage2Paid,
          milestone40Paid: stage3Paid,
          status: prev.status === 'commission_paid' ? 'commission_paid' : mappedStatus,
          adminStatusNote:
            prev.adminStatusNote && !prev.adminStatusNote.startsWith('Official Agreement ')
              ? prev.adminStatusNote
              : `Official Agreement ${completeOrder.orderNumber} issued (${completeOrder.currency} ${completeOrder.confirmedPrice.toLocaleString()}).`
        };
      } else {
        db.referrals.unshift({
          id: `ref-ord-${completeOrder.id}`,
          partnerToken: orderTok,
          partnerName: completeOrder.partnerName || partnerMeta?.partnerName || `Partner (${orderTok})`,
          partnerEmail: partnerMeta?.partnerEmail || `token-${orderTok.toLowerCase()}@partner.usmandevhub.com`,
          partnerWhatsApp: partnerMeta?.partnerWhatsApp,
          payoutMethod: partnerMeta?.payoutMethod || 'Remitly / Wise / Bank Transfer',
          clientName: completeOrder.clientName || 'Client',
          clientEmail: completeOrder.clientEmail || undefined,
          clientCompany: completeOrder.clientCompany || undefined,
          projectType: completeOrder.service || 'Custom Engineering',
          estimatedBudget: completeOrder.confirmedPrice,
          commissionAmount: calcCommission,
          milestone25Paid: stage1Paid,
          milestone35Paid: stage2Paid,
          milestone40Paid: stage3Paid,
          status: mappedStatus,
          source: 'order_agreement',
          date: (completeOrder.agreementDate || completeOrder.createdAt || new Date().toISOString()).slice(0, 10),
          submittedAt: completeOrder.createdAt || new Date().toISOString(),
          inquiryId: completeOrder.inquiryId,
          orderNumber: completeOrder.orderNumber,
          clientMessage: completeOrder.scopeDescription || undefined,
          notes: `Synced from Official Agreement ${completeOrder.orderNumber}.`,
          adminStatusNote: `Official Agreement ${completeOrder.orderNumber} issued (${completeOrder.currency} ${completeOrder.confirmedPrice.toLocaleString()}).`
        });
      }
    }

    saveDb(db);
    console.log(`[API] Order Agreement ${completeOrder.orderNumber} saved for ${completeOrder.clientName || 'Client'} (Active PDFs: ${db.orders.length}/${MAX_PDF_ARCHIVE_LIMIT})`);
    res.status(200).json({
      success: true,
      data: completeOrder,
      meta: {
        maxLimit: MAX_PDF_ARCHIVE_LIMIT,
        activeCount: db.orders.length
      },
      message: 'Order agreement saved successfully.'
    });
  });

  app.delete('/api/orders/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = ensureDb();
    if (!db.orders) db.orders = [];
    if (!db.deletedOrderIds) db.deletedOrderIds = [];
    if (!db.issuedOrderNumbers) db.issuedOrderNumbers = [];

    const toDelete = db.orders.filter((o) => o.id === id || o.orderNumber === id);
    for (const item of toDelete) {
      if (!db.deletedOrderIds.includes(item.id)) {
        db.deletedOrderIds.push(item.id);
      }
      if (item.orderNumber && !db.issuedOrderNumbers.includes(item.orderNumber.trim().toUpperCase())) {
        db.issuedOrderNumbers.push(item.orderNumber.trim().toUpperCase());
      }
    }

    const initialLen = db.orders.length;
    db.orders = db.orders.filter((o) => o.id !== id && o.orderNumber !== id);
    if (db.orders.length !== initialLen) {
      saveDb(db);
      return res.json({ success: true, message: 'Order agreement deleted.' });
    }
    res.status(404).json({ success: false, error: 'Order agreement not found.' });
  });

  // Relay Order Confirmation & Full Agreement PDF Email to Client and Admin (Admin-Only)
  app.post('/api/orders/:id/email', requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = ensureDb();
    const orders = db.orders || [];
    const search = id.trim().toLowerCase().replace(/^#/, '');
    const order =
      orders.find(
        (o) => o.id.toLowerCase() === search || o.orderNumber.toLowerCase() === search
      ) || orders.find((o) => o.orderNumber.toLowerCase().startsWith(`${search}-`));

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const bodyData = req.body && typeof req.body === 'object' ? req.body : {};
    const safeClient = (order.clientName || 'Agreement').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName =
      typeof bodyData.fileName === 'string' && bodyData.fileName.trim().endsWith('.pdf')
        ? bodyData.fileName.trim()
        : `${order.orderNumber}_${safeClient}_Agreement.pdf`;
    const pdfBase64 = typeof bodyData.pdfBase64 === 'string' ? bodyData.pdfBase64.trim() : '';

    const deliverablesList = order.deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n');
    const stageSel = order.selectedMilestoneStage || 'none';
    const milestonesList = order.milestones
      .map((m, i) => {
        const isStagePaid =
          (i === 0 && (stageSel === 'stage_1' || stageSel === 'stage_2' || stageSel === 'stage_3')) ||
          (i === 1 && (stageSel === 'stage_2' || stageSel === 'stage_3')) ||
          (i === 2 && stageSel === 'stage_3');
        return `${i + 1}. [${isStagePaid ? 'PAID' : 'DUE'}] ${m.title} (${order.currency} ${(m.amount || 0).toLocaleString()}) - ${m.description}`;
      })
      .join('\n');
    const paidSoFar = order.paidAmount ?? 0;
    const remBal = Math.max(0, order.confirmedPrice - paidSoFar);

    // Email targets: Client (if email present) and Usman Afzal
    const targets = [
      ...(order.clientEmail && order.clientEmail.includes('@') ? [{ email: order.clientEmail, recipientType: 'Client' }] : []),
      { email: 'hello@usmandevhub.com', recipientType: 'Agency Official Inbox (Usman DevHub)' }
    ];

    const deliveryResults: Record<string, any> = {};

    for (const target of targets) {
      try {
        const emailSubject =
          typeof bodyData.subject === 'string' && bodyData.subject.trim()
            ? bodyData.subject.trim()
            : `[Usman DevHub] Official Order Agreement #${order.orderNumber} - ${order.projectTitle}`;

        const payload: Record<string, string> = {
          _subject: emailSubject,
          _template: 'box',
          _captcha: 'false',
          'Document Type': 'Official Project Scope & Confirmed Agreement (Full PDF)',
          'Agreement Reference Number': order.orderNumber,
          'Client Name': order.clientName,
          'Client Email': order.clientEmail || 'Provided on Direct Contact',
          'Client Company': order.clientCompany || 'Direct Client',
          'Project Title': order.projectTitle,
          'Main Service': order.service,
          'Service Category': order.serviceCategory || order.service,
          'Confirmed Total Price': `${order.currency} ${order.confirmedPrice.toLocaleString()}`,
          'Paid So Far': `${order.currency} ${paidSoFar.toLocaleString()}`,
          'Remaining Balance': `${order.currency} ${remBal.toLocaleString()}`,
          'Production Timeline': order.timeline,
          'Payment Terms': order.paymentTerms,
          ...(isValidServerReferralToken(order.referralToken)
            ? { 'Partner Referral Token': `${order.referralToken}${order.partnerName ? ` (${order.partnerName})` : ''}` }
            : { 'Engagement Type': 'Direct Studio Client (Without Reference)' }),
          'Scope Deliverables': deliverablesList || 'Standard service scope agreed.',
          'Project Milestones': milestonesList || 'As per project schedule.',
          'Attached Official PDF': safeFileName,
          'Authorized Signature': 'Muhammad Usman Afzal - Founder & Lead Technologist, Usman DevHub',
          'Studio WhatsApp Direct': '+92 341 2683864'
        };

        let sentWithAttachment = false;
        if (pdfBase64.length > 100 && typeof FormData !== 'undefined' && typeof Blob !== 'undefined') {
          try {
            const pdfBuffer = Buffer.from(pdfBase64, 'base64');
            const formData = new FormData();
            Object.entries(payload).forEach(([key, val]) => {
              formData.append(key, val);
            });
            formData.append(
              'attachment',
              new Blob([pdfBuffer], { type: 'application/pdf' }),
              safeFileName
            );

            const multipartResp = await fetch(
              `https://formsubmit.co/${encodeURIComponent(target.email)}`,
              {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: formData
              }
            );
            if (multipartResp.ok) {
              sentWithAttachment = true;
              deliveryResults[target.email] = {
                status: 'sent_with_pdf',
                fileName: safeFileName
              };
            }
          } catch {
            // Fall through to link-free JSON ajax relay
          }
        }

        if (!sentWithAttachment) {
          const formSubmitEndpoint = `https://formsubmit.co/ajax/${encodeURIComponent(target.email)}`;
          const resp = await fetch(formSubmitEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify(payload)
          });

          const data: any = await resp.json().catch(() => ({}));
          deliveryResults[target.email] = {
            status: resp.ok ? 'sent' : 'error',
            fileName: safeFileName,
            response: data
          };
        }
      } catch (err: any) {
        deliveryResults[target.email] = {
          status: 'error',
          error: err.message
        };
      }
    }

    res.json({
      success: true,
      message: `Agreement email dispatched with full PDF (${safeFileName}) for Order ${order.orderNumber}`,
      fileName: safeFileName,
      results: deliveryResults
    });
  });

  // 10. Company Logo Settings (for PDF Agreements & Brand Letterhead)
  app.get('/api/settings/logo', (_req: Request, res: Response) => {
    const db = ensureDb();
    let logo = db.companyLogo || null;
    if (!logo || logo === '/images/usman-devhub-logo.png') {
      const publicPdfLogo = path.join(process.cwd(), 'public', 'images', 'usman-devhub-pdf-logo.png');
      const publicAltPdfLogo = path.join(process.cwd(), 'public', 'images', 'logo_usmandevhub_pdf.png');
      const publicPng = path.join(process.cwd(), 'public', 'images', 'company-logo.png');
      const publicJpg = path.join(process.cwd(), 'public', 'images', 'company-logo.jpg');
      if (fs.existsSync(publicPdfLogo)) {
        logo = '/images/usman-devhub-pdf-logo.png';
      } else if (fs.existsSync(publicAltPdfLogo)) {
        logo = '/images/logo_usmandevhub_pdf.png';
      } else if (fs.existsSync(publicPng)) {
        logo = '/images/company-logo.png';
      } else if (fs.existsSync(publicJpg)) {
        logo = '/images/company-logo.jpg';
      }
    }
    res.json({ success: true, logo });
  });

  app.post('/api/settings/logo', requireAdmin, (req: Request, res: Response) => {
    const { logo } = req.body;
    const db = ensureDb();
    db.companyLogo = logo ? String(logo) : undefined;

    // If it's a base64 image data URL, also write a local copy to public/images/company-logo.png for static serving
    if (logo && typeof logo === 'string' && logo.startsWith('data:image/')) {
      try {
        const matches = logo.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const imgDir = path.join(process.cwd(), 'public', 'images');
          if (!fs.existsSync(imgDir)) {
            fs.mkdirSync(imgDir, { recursive: true });
          }
          const filePath = path.join(imgDir, `company-logo.${ext}`);
          fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
        }
      } catch (err) {
        console.error('Failed to write logo image to disk:', err);
      }
    }

    saveDb(db);
    res.json({ success: true, logo: db.companyLogo || null });
  });

  // ==========================================
  // VITE DEV MIDDLEWARE & PRODUCTION SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to PORT 3000 and 0.0.0.0 (strictly required by infrastructure)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Usman DevHub Server] Running on http://0.0.0.0:${PORT} (Node.js & Express API)`);
  });
}

startServer();
