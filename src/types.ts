export interface Service {
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

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  technologies: string[];
  imageUrl: string;
  videoUrl?: string;
  liveUrl: string;
  featured?: boolean;
  year?: string;
  client?: string;
  metrics?: string;
}

export interface ContactMessage {
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

export interface PartnerToken {
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

export interface ReferralRecord {
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
  commissionPercentage?: number; // 20% default (or custom)
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

export interface BookingSlot {
  date: string;
  time: string;
  timezone: string;
  clientName: string;
  clientEmail: string;
  topic: string;
}

export interface ClientReview {
  id: string;
  name: string;
  role?: string;
  company?: string;
  location?: string;
  flag?: string;
  projectType: string;
  quote: string;
  rating: number; // 1 to 5
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

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

export type PaidMilestoneStage = 'none' | 'stage_1' | 'stage_2' | 'stage_3';

export interface OrderMilestone {
  id: string;
  title: string;
  description: string;
  deliverableDate?: string;
  amount?: number;
  percentage?: number;
  status: 'pending' | 'in_progress' | 'completed';
  stage?: number;
  paid?: boolean;
  paidAt?: string;
}

export interface OrderDeliverableItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OrderAgreement {
  id: string;
  orderNumber: string;
  agreementTitle?: string;
  inquiryId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  clientCountry?: string;
  clientAddress?: string;
  clientTaxId?: string;
  service: string;
  serviceCategory?: string;
  projectTitle: string;
  scopeDescription: string;
  deliverables: string[];
  itemizedItems?: OrderDeliverableItem[];
  techStack?: string[];
  timeline: string;
  expectedDeliveryDate?: string;
  revisionPolicy?: string;
  warrantyTerms?: string;
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  taxPercentage?: number;
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
  legalTerms?: string;
  bankDetails?: {
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    raastId?: string;
    extraInstructions?: string;
  };
  adminSignatureName?: string;
  adminSignatureDesignation?: string;
  themeMode?: 'light' | 'dark';
  companyLogo?: string;
  agreementDate?: string; // Manually specified date chosen by user (e.g. "2026-10-28")
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
}

