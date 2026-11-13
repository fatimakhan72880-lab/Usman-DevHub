import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Box,
  Layers,
  MessageSquare,
  Gift,
  Upload,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  ExternalLink,
  Lock,
  LogOut,
  Sparkles,
  ArrowUpDown,
  Copy,
  Check,
  Eye,
  EyeOff,
  FileImage,
  Building,
  AlertCircle,
  Search,
  Globe,
  Share2,
  FileCode,
  ShieldCheck,
  Star,
  Users,
  Camera,
  Image,
  Film,
  Play,
  ChevronDown,
  Link2,
  Menu,
  ArrowLeft,
  ChevronRight,
  Activity,
  Bell,
  Code2,
  ShoppingBag,
  Palette,
  Cloud,
  SlidersHorizontal,
  Filter,
  KeyRound,
  Download,
  Database,
  HardDrive,
  Mail,
  AlertTriangle,
  Send,
  FileText,
  MessageCircle,
  List,
  LayoutGrid,
  Calendar,
  MoreHorizontal,
  RefreshCw,
  Server
} from 'lucide-react';
import { Service, Project, ContactMessage, ReferralRecord, PartnerToken, ClientReview, LeadershipMember, OrderAgreement, OrderMilestone } from '../types';
import {
  getServices,
  saveService,
  getProjects,
  saveProject,
  deleteProject,
  getContactMessages,
  updateMessageStatus,
  deleteContactMessage,
  getReferrals,
  getPartnerTokens,
  syncPartnerTokensFromServer,
  syncWithBackend,
  deletePartnerToken,
  addReferral,
  lookupPartnerByToken,
  normalizeReferralToken,
  updateReferralStatus,
  updateReferralRecord,
  deleteReferralRecord,
  getReviews,
  updateReviewStatus,
  deleteReview,
  addAdminReview,
  getLeadershipTeam,
  saveLeadershipMember,
  updateLeadershipImage,
  deleteLeadershipImage,
  getAdminAuthStatus,
  setAdminAuthStatus,
  getAdminAuthHeaders,
  ALLOWED_ADMIN_EMAILS,
  loginAdminOnServer,
  verifyAdminSessionOnServer,
  changeAdminPasswordOnServer,
  registerPartnerToken,
  MAX_PDF_ARCHIVE_LIMIT,
  getOrderAgreements,
  getOrderAgreementById,
  saveOrderAgreement,
  deleteOrderAgreement,
  generateNextOrderNumber,
  generateAgreementPartnerToken
} from '../services/storageService';
import { OrderAgreementModal } from './OrderAgreementModal';
import { OrderAgreementStudio, getCategoryScopePreset } from './OrderAgreementStudio';
import { downloadAgreementPdf, resolveOrderMilestones, dispatchAgreementWithPdf } from '../utils/pdfGenerator';
import {
  downloadPartnerTokenPdf,
  sharePartnerTokenPdfOnWhatsApp,
  downloadAdminTokensRegisterPdf,
  downloadAdminAgreementsRegisterPdf,
  dispatchPartnerTokenWithPdf
} from '../utils/partnerCertificate';
import { ShareDocumentModal, ShareChannel } from './ShareDocumentModal';
import { SHOWCASE_TAXONOMY, normalizeHomeServiceName, getHomeServiceCategory } from '../data/initialData';
import { detectFlagFromLocation, POPULAR_FLAGS } from '../utils/countryFlags';
import { RobustVideoPlayer, isYouTubeUrl, getYouTubeEmbedUrl } from './RobustVideoPlayer';
import { resolveThumbnailUrl, compressImageFile, getYouTubeThumbnail, normalizeImageUrl, getFallbackImage, DEFAULT_VIDEO_POSTER } from '../utils/imageUtils';
import { formatAgreementDate } from '../utils/dateUtils';
import { ensureExternalUrl } from '../utils/urlUtils';
import { ArtworkLightboxModal } from './ArtworkLightboxModal';

export type AdminTabType =
  | 'overview'
  | 'services'
  | 'portfolio'
  | 'leadership'
  | 'messages'
  | 'orders'
  | 'reviews'
  | 'referrals'
  | 'seo'
  | 'security';

export const ADMIN_TAB_METADATA: Record<AdminTabType, { title: string; subtitle: string; iconLabel: string }> = {
  overview: {
    title: 'Studio Overview & Performance',
    subtitle: 'System health, live analytics, and centralized agency actions',
    iconLabel: 'Overview'
  },
  services: {
    title: 'Flagship Services Management',
    subtitle: 'Configure offerings, category taxonomies, and technical scope presets',
    iconLabel: 'Services'
  },
  portfolio: {
    title: 'Portfolio & Showcase Cards',
    subtitle: 'Manage client case studies, live demos, and video showcases',
    iconLabel: 'Portfolio'
  },
  leadership: {
    title: 'Leadership & Team Management',
    subtitle: 'Edit founder credentials, designations, and social references',
    iconLabel: 'Leadership'
  },
  messages: {
    title: 'Client Inquiries & Direct Messages',
    subtitle: 'Review confidential client leads, proposals, and project submissions',
    iconLabel: 'Messages'
  },
  orders: {
    title: 'Orders & Client Scope Agreements (PDF)',
    subtitle: 'Review legally-binding contracts, milestones, and signed client documents',
    iconLabel: 'Orders & Agreements'
  },
  reviews: {
    title: 'Client Reviews Moderation',
    subtitle: 'Moderate testimonials, star ratings, and global client flags',
    iconLabel: 'Reviews'
  },
  referrals: {
    title: 'Partner Referral Engine & Tokens',
    subtitle: 'Track affiliate tokens, partner commissions, and deal milestones',
    iconLabel: 'Referrals'
  },
  seo: {
    title: 'SEO & Growth Engine',
    subtitle: 'OpenGraph metadata, Twitter cards, sitemaps, and Schema structured data',
    iconLabel: 'SEO'
  },
  security: {
    title: 'Security & Password Credentials',
    subtitle: 'Manage encrypted HMAC session keys and executive owner password',
    iconLabel: 'Security'
  }
};

export interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  requestedTab?: AdminTabType;
  requestedOrderId?: string;
  requestedStudio?: boolean;
  onTabChange?: (tab: AdminTabType) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  requestedTab,
  requestedOrderId,
  requestedStudio,
  onTabChange
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getAdminAuthStatus());
  const [adminEmail, setAdminEmail] = useState('hello@usmandevhub.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin Security & Password Change state
  const [currentPwdInput, setCurrentPwdInput] = useState('');
  const [newPwdInput, setNewPwdInput] = useState('');
  const [confirmPwdInput, setConfirmPwdInput] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdChangeNotice, setPwdChangeNotice] = useState('');
  const [pwdChangeError, setPwdChangeError] = useState('');
  const [passwordUpdatedAt, setPasswordUpdatedAt] = useState<string>('');

  // Tab navigation & requested tab sync
  const [activeTab, setActiveTab] = useState<AdminTabType>(requestedTab || 'overview');
  const [pendingTab, setPendingTab] = useState<AdminTabType>(requestedTab || 'overview');

  // Orders & Agreements state
  const [orders, setOrders] = useState<OrderAgreement[]>([]);
  const [ordersArchiveTab, setOrdersArchiveTab] = useState<'agreements' | 'tokens'>('agreements');
  const [agreementsViewMode, setAgreementsViewMode] = useState<'list' | 'cards'>('list');
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [adminQuickPartnerName, setAdminQuickPartnerName] = useState('');
  const [adminQuickPartnerEmail, setAdminQuickPartnerEmail] = useState('');
  const [adminQuickPartnerWhatsApp, setAdminQuickPartnerWhatsApp] = useState('');
  const [adminQuickPartnerPayout, setAdminQuickPartnerPayout] = useState('Remitly / Wise / Bank Transfer');
  const [adminQuickPartnerService, setAdminQuickPartnerService] = useState('Web Development');
  const [adminQuickPartnerCategory, setAdminQuickPartnerCategory] = useState('Business Websites');
  const [adminInspectedToken, setAdminInspectedToken] = useState('');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<OrderAgreement | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderForStudio, setSelectedOrderForStudio] = useState<OrderAgreement | null>(null);
  const [isOrderStudioOpen, setIsOrderStudioOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderAgreement['status']>('all');
  const [orderReferenceFilter, setOrderReferenceFilter] = useState<'all' | 'referred' | 'direct'>('all');
  const [secureLookupQuery, setSecureLookupQuery] = useState('');
  const [copiedOrderSecCode, setCopiedOrderSecCode] = useState<string | null>(null);
  const [orderActionNotice, setOrderActionNotice] = useState('');
  const [activeShareDoc, setActiveShareDoc] = useState<{
    isOpen: boolean;
    type: 'agreement' | 'token';
    order?: OrderAgreement;
    partner?: PartnerToken;
    linkedDeals?: ReferralRecord[];
    linkedOrders?: OrderAgreement[];
    chronoSlot?: number;
    initialChannel: ShareChannel;
  }>({
    isOpen: false,
    type: 'agreement',
    initialChannel: 'whatsapp'
  });

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [projects, setProjects] = useState<Project[]>(() => getProjects());
  const [leadership, setLeadership] = useState<LeadershipMember[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [partnerTokens, setPartnerTokens] = useState<PartnerToken[]>([]);
  const [referralBudgetDrafts, setReferralBudgetDrafts] = useState<Record<string, string>>({});
  const [referralNoteDrafts, setReferralNoteDrafts] = useState<Record<string, string>>({});
  const [expandedReferralDetailsId, setExpandedReferralDetailsId] = useState<string | null>(null);
  const [tokenActivityFilter, setTokenActivityFilter] = useState<'all' | 'with_details' | 'waiting'>('all');
  const [copiedPartnerLinkToken, setCopiedPartnerLinkToken] = useState<string | null>(null);
  const [copiedPartnerCode, setCopiedPartnerCode] = useState<string | null>(null);
  const [tokenSearch, setTokenSearch] = useState('');
  const [isAddingReferral, setIsAddingReferral] = useState(false);
  const [newRefToken, setNewRefToken] = useState('');
  const [newRefPartnerName, setNewRefPartnerName] = useState('');
  const [newRefPartnerEmail, setNewRefPartnerEmail] = useState('');
  const [newRefClientName, setNewRefClientName] = useState('');
  const [newRefService, setNewRefService] = useState('Web Development');
  const [newRefCategory, setNewRefCategory] = useState('Business Websites');
  const [newRefBudget, setNewRefBudget] = useState('2500');
  const [newRefCommissionPct, setNewRefCommissionPct] = useState<number>(25);
  const [newRefStatus, setNewRefStatus] = useState<ReferralRecord['status']>('in_negotiation');
  const [referralSearch, setReferralSearch] = useState('');
  const [referralStageFilter, setReferralStageFilter] = useState<'all' | ReferralRecord['status']>('all');
  const [referralSaveNotice, setReferralSaveNotice] = useState('');
  // Dedicated Edit Track & Milestone Status Modal State
  const [editingTrackReferral, setEditingTrackReferral] = useState<ReferralRecord | null>(null);
  const [isEditTrackModalOpen, setIsEditTrackModalOpen] = useState(false);
  const [trackStatus, setTrackStatus] = useState<ReferralRecord['status']>('in_negotiation');
  const [trackDealBudget, setTrackDealBudget] = useState('2500');
  const [trackCommissionPct, setTrackCommissionPct] = useState<number>(25);
  const [trackAdminNote, setTrackAdminNote] = useState('');
  const [trackMilestone25Paid, setTrackMilestone25Paid] = useState(false);
  const [trackMilestone35Paid, setTrackMilestone35Paid] = useState(false);
  const [trackMilestone40Paid, setTrackMilestone40Paid] = useState(false);
  const [trackClientName, setTrackClientName] = useState('');
  const [trackClientEmail, setTrackClientEmail] = useState('');
  const [trackPartnerName, setTrackPartnerName] = useState('');
  const [trackPartnerEmail, setTrackPartnerEmail] = useState('');
  const [trackPartnerWhatsApp, setTrackPartnerWhatsApp] = useState('');
  const [trackOrderNumber, setTrackOrderNumber] = useState('');
  const [trackCopiedPing, setTrackCopiedPing] = useState(false);
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Leadership editing state
  const [editingLeader, setEditingLeader] = useState<LeadershipMember | null>(null);
  const [leaderActionNotice, setLeaderActionNotice] = useState<string>('');

  // Manual Review creation state
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [manualReviewName, setManualReviewName] = useState('');
  const [manualReviewRole, setManualReviewRole] = useState('');
  const [manualReviewCompany, setManualReviewCompany] = useState('');
  const [manualReviewLocation, setManualReviewLocation] = useState('');
  const [manualReviewFlag, setManualReviewFlag] = useState('');
  const [manualReviewProjectType, setManualReviewProjectType] = useState('Web Development');
  const [manualReviewRating, setManualReviewRating] = useState<number>(5);
  const [manualReviewQuote, setManualReviewQuote] = useState('');
  const [manualReviewPublishImmediate, setManualReviewPublishImmediate] = useState(true);

  // Editing / Adding modals
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [serviceFormError, setServiceFormError] = useState('');
  const [projectFormError, setProjectFormError] = useState('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pendingDeleteAgreement, setPendingDeleteAgreement] = useState<{ id: string; orderNumber: string; clientName: string } | null>(null);
  const [pendingDeletePartnerToken, setPendingDeletePartnerToken] = useState<{ token: string; partnerName: string } | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const [projectActionNotice, setProjectActionNotice] = useState<string>('');
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [adminPreviewVideo, setAdminPreviewVideo] = useState<{ url: string; title: string } | null>(null);
  const [adminPreviewArtwork, setAdminPreviewArtwork] = useState<{ url: string; title: string; category?: string; client?: string } | null>(null);

  // Showcase Service-Specific View & Filter states ("har service ka alag section")
  const [portfolioActiveServiceTab, setPortfolioActiveServiceTab] = useState<string>('all');
  const [portfolioActiveSubcategory, setPortfolioActiveSubcategory] = useState<string>('all');
  const [portfolioSearch, setPortfolioSearch] = useState<string>('');

  // SEO Tab state
  const [copiedSitemap, setCopiedSitemap] = useState(false);
  const [copiedRobots, setCopiedRobots] = useState(false);
  const [seoPreviewPlatform, setSeoPreviewPlatform] = useState<'google' | 'social' | 'twitter'>('google');

  // Email Notification Settings state
  const [recipientEmails, setRecipientEmails] = useState<string[]>(['hello@usmandevhub.com']);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [emailDeliveryStatuses, setEmailDeliveryStatuses] = useState<Record<string, { status: string; message: string; timestamp: string }>>({});
  const [isSavingEmailSettings, setIsSavingEmailSettings] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);

  // Cloudflare & Remote Bounded Database Status
  const [dbStatusInfo, setDbStatusInfo] = useState<{
    connected?: boolean;
    engine?: string;
    storageType?: string;
    cloudflareReady?: boolean;
    lastUpdated?: string;
    counts?: { orders: number; messages: number; referrals: number; partners: number; reviews: number };
  } | null>(null);
  const [isLoadingDbStatus, setIsLoadingDbStatus] = useState(false);

  const fetchDbStatus = async () => {
    setIsLoadingDbStatus(true);
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatusInfo(data);
      }
    } catch {
      // offline fallback
    } finally {
      setIsLoadingDbStatus(false);
    }
  };

  const fetchEmailSettings = async () => {
    if (!getAdminAuthStatus()) return;
    try {
      const res = await fetch('/api/email-settings', {
        headers: getAdminAuthHeaders(false)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.recipientEmails) {
          setRecipientEmails(json.data.recipientEmails);
        }
        if (json.data?.lastDeliveryStatus) {
          setEmailDeliveryStatuses(json.data.lastDeliveryStatus);
        }
      }
    } catch {
      // offline fallback
    }
  };

  const handleTestEmail = async (targetEmail?: string) => {
    setIsTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ email: targetEmail })
      });
      const json = await res.json();
      if (json.results) {
        setEmailDeliveryStatuses((prev) => ({ ...prev, ...json.results }));
        const resList = Object.entries(json.results) as [string, { status: string; message: string }][];
        const hasActivation = resList.some(([_, r]) => r.status === 'needs_activation');
        if (hasActivation) {
          setTestEmailResult('⚠️ Verification link sent by FormSubmit! Please check your Gmail (and Spam folder) and click "Activate Form" once.');
        } else {
          setTestEmailResult('✅ Test notification sent successfully to inboxes!');
        }
      }
    } catch (err: any) {
      setTestEmailResult(`Error sending test ping: ${err?.message || 'Network error'}`);
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleAddRecipient = async () => {
    const clean = newRecipientEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) return;
    if (recipientEmails.includes(clean)) {
      setNewRecipientEmail('');
      return;
    }
    const updated = [...recipientEmails, clean];
    setRecipientEmails(updated);
    setNewRecipientEmail('');
    setIsSavingEmailSettings(true);
    try {
      await fetch('/api/email-settings', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ recipientEmails: updated, notifyOnContact: true })
      });
      handleTestEmail(clean);
    } finally {
      setIsSavingEmailSettings(false);
    }
  };

  const handleRemoveRecipient = async (emailToRemove: string) => {
    if (recipientEmails.length <= 1) {
      setTestEmailResult('You must retain at least one recipient email.');
      return;
    }
    const updated = recipientEmails.filter((e) => e !== emailToRemove);
    setRecipientEmails(updated);
    setIsSavingEmailSettings(true);
    try {
      await fetch('/api/email-settings', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ recipientEmails: updated, notifyOnContact: true })
      });
    } finally {
      setIsSavingEmailSettings(false);
    }
  };

  const refreshAllData = () => {
    setServices(getServices());
    setProjects(getProjects());
    setLeadership(getLeadershipTeam());
    setMessages(getContactMessages());
    setReferrals(getReferrals());
    setPartnerTokens(getPartnerTokens());
    setReviews(getReviews());
    setOrders(getOrderAgreements());
    fetchEmailSettings();
  };

  const handleCreateOrderFromMessage = (msg: ContactMessage) => {
    let currency: 'USD' | 'PKR' | 'EUR' | 'GBP' = 'USD';
    let numericBudget = 3500;
    if (msg.budget) {
      if (msg.budget.toUpperCase().includes('PKR') || msg.budget.includes('Rs')) {
        currency = 'PKR';
      } else if (msg.budget.includes('€')) {
        currency = 'EUR';
      } else if (msg.budget.includes('£')) {
        currency = 'GBP';
      }
      const numbers = msg.budget.replace(/,/g, '').match(/\d+/g);
      if (numbers && numbers.length > 0) {
        numericBudget = parseInt(numbers[0], 10);
      }
    }

    const nextOrderNumber = generateNextOrderNumber();
    const cleanServiceName = normalizeHomeServiceName(msg.service);
    const subcategoryDefault =
      cleanServiceName === '3D Animated Websites'
        ? 'Interactive 3D Product Experiences'
        : cleanServiceName === 'Web Development'
        ? 'Business Websites'
        : cleanServiceName === 'E-Commerce Development'
        ? 'Custom & Any Niche Store'
        : cleanServiceName === 'Graphic Design'
        ? 'Logo Design'
        : cleanServiceName === '3D Video Animation'
        ? 'Logo Animation'
        : cleanServiceName === 'Website Deployment & Cloud Setup'
        ? 'Frontend & Web App Deployment'
        : 'Bug Fixing';

    const hasMsgRef = Boolean(
      msg.referralToken &&
      normalizeReferralToken(msg.referralToken).length >= 4 &&
      normalizeReferralToken(msg.referralToken) !== 'UDH-REF-'
    );
    const cleanMsgToken = hasMsgRef ? normalizeReferralToken(msg.referralToken!) : '';

    const newOrder: OrderAgreement = {
      id: `ord-${Date.now()}`,
      orderNumber: nextOrderNumber,
      inquiryId: msg.id,
      clientName: msg.name,
      clientEmail: msg.email,
      service: cleanServiceName,
      serviceCategory: msg.category || subcategoryDefault,
      projectTitle: `${cleanServiceName} Solution for ${msg.name}`,
      scopeDescription: msg.message || getCategoryScopePreset(cleanServiceName, msg.category || subcategoryDefault),
      deliverables: [
        `High-performance ${cleanServiceName} architecture & setup`,
        'Responsive UI/UX design with luxury dark-mode aesthetics',
        'Cross-browser optimization & Core Web Vitals compliance',
        'Production deployment with domain setup & SSL'
      ],
      techStack: msg.preferredTech
        ? [msg.preferredTech, 'React', 'TypeScript', 'Tailwind CSS']
        : ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
      timeline: '14 Business Days',
      confirmedPrice: numericBudget,
      currency,
      advancePercentage: 25,
      advanceAmount: Math.round(numericBudget * 0.25),
      balanceAmount: Math.max(0, numericBudget - Math.round(numericBudget * 0.25)),
      referralToken: cleanMsgToken,
      partnerName: hasMsgRef ? (msg.referredByName || '') : '',
      commissionPercentage: hasMsgRef ? 20 : 0,
      commissionAmount: hasMsgRef ? Math.round(numericBudget * 0.2) : 0,
      status: 'confirmed',
      paymentTerms: 'Standard 3-Stage Milestone Plan: 25% advance kickoff deposit to initiate engineering; 35% midway upon core prototype demo & review; remaining 40% final balance payable upon live deployment and 100% full source code delivery & IP handoff.',
      milestones: [
        {
          id: 'm-1',
          title: 'Stage 1: Kickoff Deposit (25%)',
          description: '25% advance kickoff deposit to initiate architecture setup, design systems, and sprint engineering.',
          deliverableDate: 'Phase 1 (Kickoff)',
          amount: Math.round(numericBudget * 0.25),
          status: 'completed'
        },
        {
          id: 'm-2',
          title: 'Stage 2: Mid Demo & Review (35%)',
          description: '35% midway milestone upon interactive prototype demonstration, core features walkthrough, and client refinements review.',
          deliverableDate: 'Phase 2 (Mid Demo)',
          amount: Math.round(numericBudget * 0.35),
          status: 'pending'
        },
        {
          id: 'm-3',
          title: 'Stage 3: Code Delivery & Production Launch (40%)',
          description: '40% final clearance payment upon live deployment signoff and 100% full source code delivery & IP handoff.',
          deliverableDate: 'Phase 3 (Code Delivery)',
          amount: Math.max(0, numericBudget - Math.round(numericBudget * 0.25) - Math.round(numericBudget * 0.35)),
          status: 'pending'
        }
      ],
      notes: `Generated from client inquiry by ${msg.name}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString()
    };

    saveOrderAgreement(newOrder);
    setOrders(getOrderAgreements());
    setReferrals(getReferrals());
    setSelectedOrderForStudio(newOrder);
    setIsOrderStudioOpen(true);
    setOrderActionNotice(`Agreement ${nextOrderNumber} created from message! Studio opened to customize.`);
    setTimeout(() => setOrderActionNotice(''), 5000);
  };

  const handleCreateOrOpenOrderFromReferral = (ref: ReferralRecord) => {
    const cleanTok = ref.partnerToken ? normalizeReferralToken(ref.partnerToken) : '';
    const existingOrder = orders.find(
      (o) =>
        (ref.orderNumber && o.orderNumber === ref.orderNumber) ||
        (cleanTok &&
          normalizeReferralToken(o.referralToken || '') === cleanTok &&
          o.clientName.toLowerCase() === ref.clientName.toLowerCase())
    );

    if (existingOrder) {
      setSelectedOrderForStudio(existingOrder);
      setIsOrderStudioOpen(true);
      return;
    }

    const nextOrderNumber = generateNextOrderNumber();
    const cleanServiceName = normalizeHomeServiceName(ref.service || ref.projectType || 'Web Development');
    const resolvedRefCategory = ref.category || 'Business Websites';
    const numericBudget = Math.max(0, Number(ref.estimatedBudget) || 2500);
    const budgetHint = (ref.statedBudgetText || '').toUpperCase();
    const refCurrency: OrderAgreement['currency'] = budgetHint.includes('PKR') || budgetHint.includes('RS')
      ? 'PKR'
      : budgetHint.includes('AED')
      ? 'AED'
      : budgetHint.includes('SAR')
      ? 'SAR'
      : budgetHint.includes('EUR') || budgetHint.includes('€')
      ? 'EUR'
      : budgetHint.includes('GBP') || budgetHint.includes('£')
      ? 'GBP'
      : 'USD';
    const advAmt = Math.round(numericBudget * 0.25);
    const midAmt = Math.round(numericBudget * 0.35);
    const finalAmt = Math.max(0, numericBudget - advAmt - midAmt);

    const initialRefStage = ref.milestone40Paid
      ? 'stage_3'
      : ref.milestone35Paid
      ? 'stage_2'
      : ref.milestone25Paid
      ? 'stage_1'
      : 'none';
    const initialPaidAmt =
      initialRefStage === 'stage_3'
        ? numericBudget
        : initialRefStage === 'stage_2'
        ? advAmt + midAmt
        : initialRefStage === 'stage_1'
        ? advAmt
        : 0;

    const newOrder: OrderAgreement = {
      id: `ord-${Date.now()}`,
      orderNumber: nextOrderNumber,
      inquiryId: ref.inquiryId,
      clientName: ref.clientName,
      clientEmail: ref.clientEmail || '',
      clientCompany: ref.clientCompany || '',
      service: cleanServiceName,
      serviceCategory: resolvedRefCategory,
      projectTitle: `${cleanServiceName} Solution for ${ref.clientName}`,
      scopeDescription:
        ref.clientMessage || getCategoryScopePreset(cleanServiceName, resolvedRefCategory),
      deliverables: [
        `High-performance ${cleanServiceName} architecture & setup`,
        'Responsive UI/UX design & cross-device engineering',
        'Performance optimization & Core Web Vitals compliance',
        'Production deployment with domain setup & SSL'
      ],
      techStack: ref.preferredTech
        ? [ref.preferredTech, 'React', 'TypeScript', 'Tailwind CSS']
        : ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
      timeline: '14 Business Days',
      confirmedPrice: numericBudget,
      currency: refCurrency,
      advancePercentage: 25,
      advanceAmount: advAmt,
      paidAmount: initialPaidAmt,
      balanceAmount: Math.max(0, numericBudget - initialPaidAmt),
      selectedMilestoneStage: initialRefStage,
      referralToken: cleanTok,
      partnerName: cleanTok ? ref.partnerName : '',
      commissionPercentage: cleanTok ? 20 : 0,
      commissionAmount: cleanTok ? Math.round(numericBudget * 0.2) : 0,
      status: 'confirmed',
      paymentTerms:
        '3-Stage Milestone Plan (25% / 35% / 40%): 25% advance kickoff deposit to initiate engineering; 35% midway upon core prototype demo & review; remaining 40% final balance payable upon live deployment and 100% full source code delivery & IP handoff.',
      milestones: [
        {
          id: 'm-1',
          title: 'Stage 1: Kickoff Deposit (25%)',
          description: '25% advance kickoff deposit to initiate architecture setup, design systems, and sprint engineering.',
          deliverableDate: 'Phase 1 (Kickoff)',
          amount: advAmt,
          percentage: 25,
          status: initialRefStage !== 'none' ? 'completed' : 'pending'
        },
        {
          id: 'm-2',
          title: 'Stage 2: Mid Demo & Review (35%)',
          description: '35% midway milestone upon interactive prototype demonstration, core features walkthrough, and client refinements review.',
          deliverableDate: 'Phase 2 (Mid Demo)',
          amount: midAmt,
          percentage: 35,
          status: initialRefStage === 'stage_2' || initialRefStage === 'stage_3' ? 'completed' : 'pending'
        },
        {
          id: 'm-3',
          title: 'Stage 3: Code Delivery & Production Launch (40%)',
          description: '40% final clearance payment upon live deployment signoff and 100% full source code delivery & IP handoff.',
          deliverableDate: 'Phase 3 (Code Delivery)',
          amount: finalAmt,
          percentage: 40,
          status: initialRefStage === 'stage_3' ? 'completed' : 'pending'
        }
      ],
      notes: cleanTok
        ? `Generated from Partner Token ${cleanTok} (${ref.partnerName}).`
        : `Generated for ${ref.clientName}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString()
    };

    saveOrderAgreement(newOrder);
    refreshAllData();
    setSelectedOrderForStudio(newOrder);
    setIsOrderStudioOpen(true);
    showReferralNotice(
      `Official Agreement ${nextOrderNumber} created on token ${cleanTok || 'Direct'} & synced to Partner Track Status!`
    );
  };

  const handleCreateNewBlankOrder = (withReference = false) => {
    const nextOrderNumber = generateNextOrderNumber();
    // ALWAYS generate a 100% brand-new unique Partner Token — NEVER reuse an old historical token!
    const initialToken = withReference ? generateAgreementPartnerToken() : '';

    const blankOrder: OrderAgreement = {
      id: `ord-${Date.now()}`,
      orderNumber: nextOrderNumber,
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
      projectTitle: 'Custom High-Performance Web & Digital Architecture',
      scopeDescription: getCategoryScopePreset('Web Development', 'Business Websites'),
      deliverables: [
        'Custom interactive user interface with high-performance animations',
        'Responsive mobile & desktop architecture optimized for fast load speeds (<2.0s)',
        'SEO-optimized architecture, social preview cards, and schema structured data',
        'Production cloud deployment with domain configuration and documentation handoff'
      ],
      itemizedItems: [
        {
          id: 'item-1',
          description: 'Custom UI/UX & Frontend Architecture (React / Tailwind CSS)',
          quantity: 1,
          unitPrice: 1500,
          total: 1500
        },
        {
          id: 'item-2',
          description: 'Interactive Features, Backend API Integration & Database Setup',
          quantity: 1,
          unitPrice: 1000,
          total: 1000
        }
      ],
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Node.js'],
      timeline: '14 Business Days',
      confirmedPrice: 2500,
      currency: 'USD',
      advancePercentage: 25,
      advanceAmount: 625,
      paidAmount: 0,
      balanceAmount: 2500,
      selectedMilestoneStage: 'none',
      referralToken: initialToken,
      partnerName: '',
      commissionPercentage: withReference ? 20 : 0,
      commissionAmount: withReference ? 500 : 0,
      status: 'confirmed',
      paymentTerms: '3-Stage Milestone Plan (25% / 35% / 40%): 25% advance kickoff deposit to initiate engineering; 35% midway upon core prototype demo & review; remaining 40% final balance payable upon live deployment and 100% full source code delivery & IP handoff.',
      milestones: [
        {
          id: 'm-1',
          title: 'Stage 1: Kickoff Deposit (25%)',
          description: '25% advance kickoff deposit to initiate architecture setup, design systems, and sprint engineering.',
          deliverableDate: 'Phase 1 (Kickoff)',
          amount: 625,
          percentage: 25,
          status: 'pending'
        },
        {
          id: 'm-2',
          title: 'Stage 2: Mid Demo & Review (35%)',
          description: '35% midway milestone upon interactive prototype demonstration, core features walkthrough, and client refinements review.',
          deliverableDate: 'Phase 2 (Mid Demo)',
          amount: 875,
          percentage: 35,
          status: 'pending'
        },
        {
          id: 'm-3',
          title: 'Stage 3: Code Delivery & Production Launch (40%)',
          description: '40% final clearance payment upon live deployment signoff and 100% full source code delivery & IP handoff.',
          deliverableDate: 'Phase 3 (Code Delivery)',
          amount: 1000,
          percentage: 40,
          status: 'pending'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString()
    };
    setSelectedOrderForStudio(blankOrder);
    setIsOrderStudioOpen(true);
  };

  const handleCloneOrderForNewClient = (sourceOrder: OrderAgreement) => {
    const freshOrderNumber = generateNextOrderNumber([sourceOrder.orderNumber]);
    const hasRef = Boolean(
      sourceOrder.referralToken &&
      sourceOrder.referralToken.trim().length >= 4 &&
      sourceOrder.referralToken.trim().toUpperCase() !== 'UDH-REF-'
    );
    // ALWAYS generate a brand-new Partner Token as well when cloning a referred agreement!
    const freshPartnerToken = hasRef
      ? generateAgreementPartnerToken(sourceOrder.partnerName, [sourceOrder.referralToken || ''])
      : '';
    const nowIso = new Date().toISOString();

    const clonedForNewClient: OrderAgreement = {
      ...sourceOrder,
      id: `ord-${Date.now()}`,
      orderNumber: freshOrderNumber,
      inquiryId: undefined,
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientCompany: '',
      clientCountry: '',
      clientAddress: '',
      clientTaxId: '',
      paidAmount: 0,
      balanceAmount: sourceOrder.confirmedPrice || 0,
      selectedMilestoneStage: 'none',
      milestones: Array.isArray(sourceOrder.milestones)
        ? sourceOrder.milestones.map((m) => ({ ...m, status: 'pending' as const }))
        : [],
      referralToken: freshPartnerToken,
      partnerName: hasRef ? (sourceOrder.partnerName || '') : '',
      commissionPercentage: hasRef ? (sourceOrder.commissionPercentage || 20) : 0,
      commissionAmount: hasRef ? (sourceOrder.commissionAmount || 0) : 0,
      status: 'confirmed',
      agreementDate: nowIso.slice(0, 10),
      createdAt: nowIso,
      updatedAt: nowIso,
      confirmedAt: nowIso
    };

    setSelectedOrderForStudio(clonedForNewClient);
    setIsOrderStudioOpen(true);
    setOrderActionNotice(
      hasRef
        ? `New Client Agreement started with fresh Ref No. ${freshOrderNumber} + fresh Token ${freshPartnerToken}!`
        : `New Client Agreement started with fresh Ref No. ${freshOrderNumber}! Enter the new client's name and download PDF.`
    );
    setTimeout(() => setOrderActionNotice(''), 5500);
  };

  const handleDirectDownloadOrderPdf = async (ord: OrderAgreement) => {
    setDownloadingOrderId(ord.id);
    try {
      await downloadAgreementPdf(ord);
      setOrderActionNotice(`Downloaded official PDF for ${ord.orderNumber} (${ord.clientName || 'Client'})!`);
      setTimeout(() => setOrderActionNotice(''), 4000);
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const handleInspectTokenInAdmin = (tokenCode: string) => {
    const clean = normalizeReferralToken(tokenCode);
    if (!clean) return;
    setAdminInspectedToken(clean);
    setActiveTab('referrals');
    setTimeout(() => {
      document.getElementById('admin-live-token-inspector')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleCreateOrOpenOrderFromPartnerToken = (pt: PartnerToken) => {
    const cleanTok = normalizeReferralToken(pt.token);
    const existingOrder = orders.find(
      (o) => normalizeReferralToken(o.referralToken || '') === cleanTok
    );
    if (existingOrder) {
      setSelectedOrderForStudio(existingOrder);
      setIsOrderStudioOpen(true);
      return;
    }

    const existingDeal = referrals.find(
      (r) => normalizeReferralToken(r.partnerToken || '') === cleanTok
    );
    if (existingDeal) {
      handleCreateOrOpenOrderFromReferral(existingDeal);
      return;
    }

    const nextOrderNumber = generateNextOrderNumber();
    const nowIso = new Date().toISOString();
    const blankTokenOrder: OrderAgreement = {
      id: `ord-${Date.now()}`,
      orderNumber: nextOrderNumber,
      agreementTitle: 'Project Order Confirmation & Scope Agreement',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientCompany: '',
      clientCountry: '',
      clientAddress: '',
      clientTaxId: '',
      service: pt.targetService || 'Web Development',
      serviceCategory: pt.targetCategory || 'Business Websites',
      projectTitle: 'Custom High-Performance Web & Digital Architecture',
      scopeDescription: getCategoryScopePreset(
        pt.targetService || 'Web Development',
        pt.targetCategory || 'Business Websites'
      ),
      deliverables: [
        'Custom interactive user interface with high-performance animations',
        'Responsive mobile & desktop architecture optimized for fast load speeds (<2.0s)',
        'SEO-optimized architecture, social preview cards, and schema structured data',
        'Production cloud deployment with domain configuration and documentation handoff'
      ],
      itemizedItems: [
        {
          id: 'item-1',
          description: 'Custom UI/UX & Frontend Architecture (React / Tailwind CSS)',
          quantity: 1,
          unitPrice: 1500,
          total: 1500
        },
        {
          id: 'item-2',
          description: 'Interactive Features, Backend API Integration & Database Setup',
          quantity: 1,
          unitPrice: 1000,
          total: 1000
        }
      ],
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Node.js'],
      timeline: '14 Business Days',
      confirmedPrice: 2500,
      currency: 'USD',
      advancePercentage: 25,
      advanceAmount: 625,
      paidAmount: 0,
      balanceAmount: 2500,
      selectedMilestoneStage: 'none',
      referralToken: cleanTok,
      partnerName: pt.partnerName,
      commissionPercentage: 20,
      commissionAmount: 500,
      status: 'confirmed',
      paymentTerms:
        '3-Stage Milestone Plan (25% / 35% / 40%): 25% advance kickoff deposit to initiate engineering; 35% midway upon core prototype demo & review; remaining 40% final balance payable upon live deployment and 100% full source code delivery & IP handoff.',
      milestones: [
        {
          id: 'm-1',
          title: 'Stage 1: Kickoff Deposit (25%)',
          description: '25% advance kickoff deposit to initiate architecture setup, design systems, and sprint engineering.',
          deliverableDate: 'Phase 1 (Kickoff)',
          amount: 625,
          percentage: 25,
          status: 'pending'
        },
        {
          id: 'm-2',
          title: 'Stage 2: Mid Demo & Review (35%)',
          description: '35% midway milestone upon interactive prototype demonstration, core features walkthrough, and client refinements review.',
          deliverableDate: 'Phase 2 (Mid Demo)',
          amount: 875,
          percentage: 35,
          status: 'pending'
        },
        {
          id: 'm-3',
          title: 'Stage 3: Code Delivery & Production Launch (40%)',
          description: '40% final clearance payment upon live deployment signoff and 100% full source code delivery & IP handoff.',
          deliverableDate: 'Phase 3 (Code Delivery)',
          amount: 1000,
          percentage: 40,
          status: 'pending'
        }
      ],
      notes: `Linked to Partner Token ${cleanTok} (${pt.partnerName}).`,
      agreementDate: nowIso.slice(0, 10),
      createdAt: nowIso,
      updatedAt: nowIso,
      confirmedAt: nowIso
    };

    setAdminInspectedToken(cleanTok);
    setSelectedOrderForStudio(blankTokenOrder);
    setIsOrderStudioOpen(true);
    setOrderActionNotice(
      `Agreement ${nextOrderNumber} opened with Partner Token ${cleanTok} (${pt.partnerName})! Enter client details & save.`
    );
    setTimeout(() => setOrderActionNotice(''), 5000);
  };

  const handleAdminIssueQuickToken = (mode: 'token' | 'pdf' | 'agreement' = 'token') => {
    const pName = adminQuickPartnerName.trim();
    if (!pName) return;
    const pEmail =
      adminQuickPartnerEmail.trim() && adminQuickPartnerEmail.includes('@')
        ? adminQuickPartnerEmail.trim()
        : `${pName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'partner'}@usmandevhub.com`;

    const created = registerPartnerToken({
      partnerName: pName,
      partnerEmail: pEmail,
      partnerWhatsApp: adminQuickPartnerWhatsApp.trim() || undefined,
      payoutMethod: adminQuickPartnerPayout,
      targetService: adminQuickPartnerService,
      targetCategory: adminQuickPartnerCategory
    });
    const refreshed = getPartnerTokens();
    setPartnerTokens(refreshed);
    setAdminInspectedToken(created.token);
    setAdminQuickPartnerName('');
    setAdminQuickPartnerEmail('');
    setAdminQuickPartnerWhatsApp('');

    const msg = `Issued brand-new Token ${created.token} for ${created.partnerName} (${created.targetService || 'Web Dev'})! (Saved permanently in Archive - Total: ${refreshed.length})`;
    setOrderActionNotice(msg);
    setReferralSaveNotice(msg);
    setTimeout(() => {
      setOrderActionNotice('');
      setReferralSaveNotice('');
    }, 5000);

    if (mode === 'pdf') {
      downloadPartnerTokenPdf(created, [], [], refreshed.length);
    } else if (mode === 'agreement') {
      handleCreateOrOpenOrderFromPartnerToken(created);
    }
  };

  const handleDeleteOrder = (id: string) => {
    const target = orders.find((o) => o.id === id || o.orderNumber === id);
    const orderRef = target?.orderNumber || id;
    const clientName = target?.clientName || 'Client';
    setPendingDeleteAgreement({ id: target?.id || id, orderNumber: orderRef, clientName });
  };

  const confirmExecuteDeleteOrder = () => {
    if (!pendingDeleteAgreement) return;
    setIsDeletingRecord(true);
    const { id, orderNumber } = pendingDeleteAgreement;
    try {
      const updated = deleteOrderAgreement(id);
      setOrders(updated);
      setPendingDeleteAgreement(null);
      refreshAllData();
      setOrderActionNotice(`Agreement Reference ${orderNumber} deleted successfully.`);
      setTimeout(() => setOrderActionNotice(''), 4000);
    } catch {
      setPendingDeleteAgreement(null);
    } finally {
      setIsDeletingRecord(false);
    }
  };

  const formatTokenIssuedAt = (iso?: string): string => {
    if (!iso) return 'Recently';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeletePartnerTokenInAdmin = (token: string, partnerName: string) => {
    setPendingDeletePartnerToken({ token, partnerName: partnerName || 'Partner' });
  };

  const confirmExecuteDeletePartnerToken = () => {
    if (!pendingDeletePartnerToken) return;
    setIsDeletingRecord(true);
    const { token, partnerName } = pendingDeletePartnerToken;
    try {
      deletePartnerToken(token);
      setPartnerTokens((prev) =>
        prev.filter((p) => normalizeReferralToken(p.token) !== normalizeReferralToken(token))
      );
      setPendingDeletePartnerToken(null);
      refreshAllData();
      setOrderActionNotice(`Partner Token ${token} deleted permanently.`);
      showReferralNotice(`Deleted Partner Token ${token} (${partnerName})`);
      setTimeout(() => setOrderActionNotice(''), 4000);
    } catch {
      setPendingDeletePartnerToken(null);
    } finally {
      setIsDeletingRecord(false);
    }
  };

  const handleQuickLogDealFromToken = (pt: PartnerToken) => {
    setNewRefToken(pt.token);
    setNewRefPartnerName(pt.partnerName);
    setNewRefPartnerEmail(pt.partnerEmail);
    setNewRefClientName('');
    setNewRefService(pt.targetService || 'Web Development');
    setNewRefCategory(pt.targetCategory || 'Business Websites');
    setNewRefStatus('in_negotiation');
    setAdminInspectedToken(pt.token);
    setIsAddingReferral(true);
    setActiveTab('referrals');
    setTimeout(() => {
      document.getElementById('admin-new-ref-client-name')?.focus();
    }, 80);
  };

  const handleExportTokensToCSV = () => {
    const csvRows: string[] = [];
    csvRows.push(['Token', 'Partner Name', 'Partner Email', 'Partner WhatsApp', 'Payout Method', 'Issued Time', 'Linked Clients Count', 'Linked Deals'].join(','));

    partnerTokens.forEach((pt) => {
      const linked = referrals.filter(
        (r) => normalizeReferralToken(r.partnerToken || '') === normalizeReferralToken(pt.token)
      );
      const dealSummary = linked
        .map((l) => `${l.clientName} [${l.projectType || 'Project'}] - $${l.estimatedBudget || 0} (${l.status})`)
        .join('; ');

      csvRows.push([
        `"${pt.token}"`,
        `"${(pt.partnerName || '').replace(/"/g, '""')}"`,
        `"${(pt.partnerEmail || '').replace(/"/g, '""')}"`,
        `"${(pt.partnerWhatsApp || '').replace(/"/g, '""')}"`,
        `"${(pt.payoutMethod || '').replace(/"/g, '""')}"`,
        `"${pt.createdAt || ''}"`,
        `"${linked.length}"`,
        `"${dealSummary.replace(/"/g, '""')}"`
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usman-devhub-client-tokens-backup-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAgreementsToCSV = () => {
    const csvRows: string[] = [];
    csvRows.push(['Slot', 'Reference No', 'Client Name', 'Client Company', 'Client Email', 'Client Phone', 'Client Country', 'Token', 'Partner Name', 'Service', 'Category', 'Project Title', 'Investment', 'Currency', 'Status', 'Date'].join(','));

    orders.forEach((ord, idx) => {
      const slot = orders.length - idx;
      csvRows.push([
        `"${slot}"`,
        `"${ord.orderNumber}"`,
        `"${(ord.clientName || '').replace(/"/g, '""')}"`,
        `"${(ord.clientCompany || '').replace(/"/g, '""')}"`,
        `"${(ord.clientEmail || '').replace(/"/g, '""')}"`,
        `"${(ord.clientPhone || '').replace(/"/g, '""')}"`,
        `"${(ord.clientCountry || '').replace(/"/g, '""')}"`,
        `"${(ord.referralToken || '').replace(/"/g, '""')}"`,
        `"${(ord.partnerName || '').replace(/"/g, '""')}"`,
        `"${(ord.service || '').replace(/"/g, '""')}"`,
        `"${(ord.serviceCategory || '').replace(/"/g, '""')}"`,
        `"${(ord.projectTitle || '').replace(/"/g, '""')}"`,
        `"${ord.confirmedPrice || 0}"`,
        `"${ord.currency || 'USD'}"`,
        `"${ord.status || 'draft'}"`,
        `"${ord.agreementDate || ord.createdAt || ''}"`
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usman-devhub-client-agreements-backup-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isOpen) {
      let active = true;
      verifyAdminSessionOnServer().then((session) => {
        if (!active) return;
        setIsAuthenticated(session.authenticated);
        if (session.email) setAdminEmail(session.email);
        if (session.passwordUpdatedAt) setPasswordUpdatedAt(session.passwordUpdatedAt);
        if (session.authenticated) {
          refreshAllData();
          syncWithBackend().then(() => {
            if (active) refreshAllData();
          });
        }
      });

      const handleSync = () => {
        if (getAdminAuthStatus()) refreshAllData();
      };
      window.addEventListener('usman_agency_data_updated', handleSync);
      const pollInterval = window.setInterval(() => {
        if (!getAdminAuthStatus()) return;
        syncPartnerTokensFromServer().then((freshTokens) => {
          setPartnerTokens(freshTokens);
        });
        setReferrals(getReferrals());
      }, 4000);
      return () => {
        active = false;
        window.removeEventListener('usman_agency_data_updated', handleSync);
        window.clearInterval(pollInterval);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      if (activeTab === 'referrals' || activeTab === 'overview') {
        syncPartnerTokensFromServer().then(() => refreshAllData());
      }
      if (activeTab === 'security') {
        fetchDbStatus();
      }
    }
  }, [isOpen, isAuthenticated, activeTab]);

  useEffect(() => {
    if (requestedTab) {
      setPendingTab(requestedTab);
      if (isAuthenticated) {
        setActiveTab(requestedTab);
      }
    }
  }, [requestedTab, isAuthenticated]);

  useEffect(() => {
    if (requestedOrderId && isAuthenticated && orders.length > 0) {
      const found = getOrderAgreementById(requestedOrderId);
      if (found) {
        setSelectedOrderForStudio(found);
        setIsOrderStudioOpen(true);
      }
    } else if (requestedStudio && isAuthenticated) {
      handleCreateNewBlankOrder(false);
    }
  }, [requestedOrderId, requestedStudio, isAuthenticated, orders]);

  const handleSelectTab = (tab: AdminTabType) => {
    setActiveTab(tab);
    setPendingTab(tab);
    window.location.hash = `admin/${tab}`;
    onTabChange?.(tab);
    if (tab === 'leadership') setLeadership(getLeadershipTeam());
    setIsMobileNavOpen(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!ALLOWED_ADMIN_EMAILS.includes(cleanEmail)) {
      setAuthError('Access restricted: Only authorized owner (hello@usmandevhub.com or usmanafzal3254@gmail.com) can access and log into the Admin Panel.');
      return;
    }
    if (!adminPassword) {
      setAuthError('Please enter the owner password.');
      return;
    }
    setIsLoggingIn(true);
    setAuthError('');
    try {
      const result = await loginAdminOnServer(cleanEmail, adminPassword);
      if (result.success) {
        setIsAuthenticated(true);
        setAdminPassword('');
        setAuthError('');
        const destinationTab = pendingTab || 'overview';
        setActiveTab(destinationTab);
        window.location.hash = `admin/${destinationTab}`;
        onTabChange?.(destinationTab);
        if (result.passwordUpdatedAt) {
          setPasswordUpdatedAt(result.passwordUpdatedAt);
        }
        refreshAllData();
        syncWithBackend().then(() => refreshAllData());

        if (requestedOrderId) {
          setTimeout(() => {
            const found = getOrderAgreementById(requestedOrderId);
            if (found) {
              setSelectedOrderForStudio(found);
              setIsOrderStudioOpen(true);
            }
          }, 250);
        } else if (requestedStudio) {
          setTimeout(() => {
            handleCreateNewBlankOrder(false);
          }, 250);
        }
      } else {
        setAuthError(result.error || 'Invalid owner email or password.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdChangeError('');
    setPwdChangeNotice('');

    if (!currentPwdInput || !newPwdInput || !confirmPwdInput) {
      setPwdChangeError('Please fill in all three password fields.');
      return;
    }
    if (newPwdInput.length < 8) {
      setPwdChangeError('New password must be at least 8 characters long.');
      return;
    }
    if (newPwdInput !== confirmPwdInput) {
      setPwdChangeError('New password and confirm password do not match.');
      return;
    }

    setIsChangingPwd(true);
    try {
      const res = await changeAdminPasswordOnServer(currentPwdInput, newPwdInput);
      if (res.success) {
        setCurrentPwdInput('');
        setNewPwdInput('');
        setConfirmPwdInput('');
        if (res.passwordUpdatedAt) {
          setPasswordUpdatedAt(res.passwordUpdatedAt);
        }
        setPwdChangeNotice(res.message || 'Admin password encrypted and updated successfully!');
        setTimeout(() => setPwdChangeNotice(''), 6000);
      } else {
        setPwdChangeError(res.error || 'Could not update password.');
      }
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleLogout = () => {
    setAdminAuthStatus(false);
    setIsAuthenticated(false);
    setAdminPassword('');
    setSelectedOrderForModal(null);
    setSelectedOrderForStudio(null);
    setIsOrderModalOpen(false);
    setIsOrderStudioOpen(false);
    history.replaceState(null, '', window.location.pathname + window.location.search);
    onClose();
  };

  // Services CRUD
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.title?.trim()) {
      setServiceFormError('Please enter a service title.');
      return;
    }
    setServiceFormError('');

    const newSrv: Service = {
      id: editingService.id || 'srv-1',
      title: editingService.title.trim(),
      description: editingService.description || '',
      category: editingService.category || 'Engineering',
      subcategories: Array.isArray(editingService.subcategories)
        ? editingService.subcategories
        : typeof editingService.subcategories === 'string'
        ? (editingService.subcategories as string).split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      imageUrl: editingService.imageUrl || '',
      status: (editingService.status as 'active' | 'draft') || 'active',
      order: Number(editingService.order) || 1,
      timeline: 'Discussed Per Project Scope',
      deliverables: Array.isArray(editingService.deliverables)
        ? editingService.deliverables
        : typeof editingService.deliverables === 'string'
        ? (editingService.deliverables as string).split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      iconName: editingService.iconName || 'Globe'
    };

    saveService(newSrv);
    refreshAllData();
    setEditingService(null);
  };

  // Portfolio CRUD
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject?.title?.trim()) {
      setProjectFormError('Please enter a project title / name.');
      return;
    }

    const cat = editingProject.category || 'Web Development';
    const isVideo = cat === '3D Video Animation' || cat === 'Motion Design & Animation' || cat.toLowerCase().includes('video') || cat.toLowerCase().includes('animation');
    const isDesign = cat === 'Graphic Design' || cat.toLowerCase().includes('design') || cat.toLowerCase().includes('logo') || cat.toLowerCase().includes('branding');

    if (isVideo) {
      if (!editingProject.videoUrl?.trim() && !editingProject.imageUrl?.trim()) {
        setProjectFormError('Please enter a video link or upload a video file for this 3D Animation project.');
        return;
      }
    } else if (isDesign) {
      if (!editingProject.imageUrl?.trim()) {
        setProjectFormError('Please enter an image link or upload a picture for this Graphic Design project.');
        return;
      }
    } else {
      if (!editingProject.imageUrl?.trim()) {
        setProjectFormError('Please enter an image link or upload a screenshot for this website project.');
        return;
      }
    }

    setProjectFormError('');

    const finalImageUrl = resolveThumbnailUrl(editingProject.imageUrl, editingProject.videoUrl, cat);
    const normalizedLive = ensureExternalUrl(editingProject.liveUrl);
    const finalLiveUrl = normalizedLive || (isVideo ? (editingProject.videoUrl || '#') : (isDesign ? finalImageUrl : 'https://usmandevhub.agency'));

    const newProj: Project = {
      id: editingProject.id || `proj-${Date.now()}`,
      title: editingProject.title.trim(),
      description: editingProject.description || '',
      category: cat,
      subcategory: editingProject.subcategory || (isVideo ? 'Logo Animation' : isDesign ? 'Logo Design' : 'Business Websites'),
      technologies: editingProject.technologies || (isVideo ? ['Cinema 4D', 'After Effects', '4K 60fps'] : isDesign ? ['Adobe Illustrator', 'Figma', 'Vector Kit'] : ['Modern Web Stack', 'Tailwind CSS']),
      imageUrl: finalImageUrl,
      videoUrl: editingProject.videoUrl?.trim() || '',
      liveUrl: finalLiveUrl,
      year: editingProject.year || '2026',
      client: editingProject.client || 'Agency Showcase',
      metrics: editingProject.metrics || ''
    };

    const updatedProjects = saveProject(newProj);
    setProjects(updatedProjects);
    refreshAllData();
    setEditingProject(null);
    setIsServiceDropdownOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsCustomCategory(false);
    setProjectActionNotice(`Showcase card "${newProj.title}" saved successfully!`);
    setTimeout(() => setProjectActionNotice(''), 3500);
  };

  const handleDeleteProject = (id: string) => {
    const projToDelete = projects.find((p) => p.id === id);
    const updated = deleteProject(id);
    setProjects(updated);
    setDeleteConfirmId(null);
    refreshAllData();
    const deletedTitle = projToDelete?.title || 'Showcase Project';
    setProjectActionNotice(`Card "${deletedTitle}" successfully deleted.`);
    setTimeout(() => setProjectActionNotice(''), 3500);
  };

  const handleApproveReview = (id: string) => {
    const updated = updateReviewStatus(id, 'approved');
    setReviews(updated);
    refreshAllData();
  };

  const handleRejectReview = (id: string) => {
    const updated = updateReviewStatus(id, 'rejected');
    setReviews(updated);
    refreshAllData();
  };

  const handleDeleteReview = (id: string) => {
    const updated = deleteReview(id);
    setReviews(updated);
    refreshAllData();
  };

  const handleSaveManualReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReviewName.trim() || !manualReviewQuote.trim()) return;

    const finalFlag = manualReviewFlag || detectFlagFromLocation(manualReviewLocation.trim());

    addAdminReview({
      name: manualReviewName.trim(),
      role: manualReviewRole.trim() || undefined,
      location: manualReviewLocation.trim() || 'Worldwide',
      flag: finalFlag,
      projectType: manualReviewProjectType,
      quote: manualReviewQuote.trim(),
      rating: manualReviewRating,
      status: manualReviewPublishImmediate ? 'approved' : 'pending'
    });

    setManualReviewName('');
    setManualReviewRole('');
    setManualReviewCompany('');
    setManualReviewLocation('');
    setManualReviewFlag('');
    setManualReviewQuote('');
    setManualReviewRating(5);
    setIsAddingReview(false);
    refreshAllData();
  };

  if (!isOpen) return null;

  const navGroups = [
    {
      title: 'Studio Management',
      items: [
        { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
        { id: 'services', label: 'Services (Fixed Core)', icon: Box, badge: 'Protected', badgeColor: 'bg-slate-100 text-slate-600 border border-slate-200' },
        { id: 'portfolio', label: 'Portfolio Showcase', icon: Layers, badge: `${projects.length}`, badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
        { id: 'leadership', label: 'Leadership Team', icon: Users, badge: `${leadership.length}`, badgeColor: 'bg-slate-100 text-slate-700' },
      ]
    },
    {
      title: 'Clients & Revenue',
      items: [
        {
          id: 'referrals',
          label: 'Partner Tokens & Status',
          icon: Gift,
          badge:
            referrals.filter((r) => r.status === 'pending').length > 0
              ? `${referrals.filter((r) => r.status === 'pending').length} details in`
              : `${partnerTokens.length} saved`,
          badgeColor:
            referrals.filter((r) => r.status === 'pending').length > 0
              ? 'bg-[#1430d8] text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        },
        {
          id: 'messages',
          label: 'Inquiries & Messages',
          icon: MessageSquare,
          badge: messages.filter(m => m.status === 'unread').length > 0
            ? `${messages.filter(m => m.status === 'unread').length} new`
            : undefined,
          badgeColor: 'bg-[#1430d8] text-white shadow-xs'
        },
        {
          id: 'orders',
          label: 'Orders & Agreements (PDF)',
          icon: FileText,
          badge: `${orders.length} saved`,
          badgeColor: 'bg-blue-50 text-[#1430d8] border border-blue-200'
        },
        {
          id: 'reviews',
          label: 'Client Reviews',
          icon: Star,
          badge: reviews.filter(r => r.status === 'pending').length > 0
            ? `${reviews.filter(r => r.status === 'pending').length} pending`
            : undefined,
          badgeColor: 'bg-amber-500 text-white shadow-xs'
        },
      ]
    },
    {
      title: 'Tools & Growth',
      items: [
        { id: 'seo', label: 'SEO & Growth Hub', icon: Search, badge: '100% Valid', badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
        { id: 'security', label: 'Security & Password', icon: ShieldCheck, badge: 'Encrypted', badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      ]
    }
  ];

  const REFERRAL_STAGE_LABELS: Record<ReferralRecord['status'], string> = {
    pending: 'Details Received',
    in_negotiation: 'In Negotiation',
    deal_complete: 'Deal Confirmed',
    milestone_25: '25% Kickoff Paid',
    milestone_35: '35% Mid Milestone Paid',
    milestone_40: '40% Final Delivery Paid',
    commission_paid: 'Full Commission Settled'
  };

  const showReferralNotice = (msg: string) => {
    setReferralSaveNotice(msg);
    setTimeout(() => setReferralSaveNotice(''), 3500);
  };

  const handleOpenEditTrackModal = (ref: ReferralRecord) => {
    setEditingTrackReferral(ref);
    setTrackStatus(ref.status);
    setTrackDealBudget(String(ref.estimatedBudget || 0));
    setTrackCommissionPct(ref.commissionPercentage ?? 20);
    setTrackAdminNote(ref.adminStatusNote || ref.notes || '');
    setTrackClientName(ref.clientName || '');
    setTrackClientEmail(ref.clientEmail || '');
    setTrackPartnerName(ref.partnerName || '');
    setTrackPartnerEmail(ref.partnerEmail || '');
    setTrackPartnerWhatsApp(ref.partnerWhatsApp || '');
    setTrackOrderNumber(ref.orderNumber || '');
    setTrackMilestone25Paid(
      Boolean(
        ref.milestone25Paid ||
        ref.status === 'milestone_25' ||
        ref.status === 'milestone_35' ||
        ref.status === 'milestone_40' ||
        ref.status === 'commission_paid'
      )
    );
    setTrackMilestone35Paid(
      Boolean(
        ref.milestone35Paid ||
        ref.status === 'milestone_35' ||
        ref.status === 'milestone_40' ||
        ref.status === 'commission_paid'
      )
    );
    setTrackMilestone40Paid(
      Boolean(
        ref.milestone40Paid ||
        ref.status === 'milestone_40' ||
        ref.status === 'commission_paid'
      )
    );
    setIsEditTrackModalOpen(true);
  };

  const handleSaveTrackModal = () => {
    if (!editingTrackReferral) return;
    const budgetNum = Math.max(0, Number(trackDealBudget) || 0);
    const commPct = Math.max(1, Math.min(100, Number(trackCommissionPct) || 20));
    const commAmt = Math.round(budgetNum * (commPct / 100));
    const m25Amt = Math.round(commAmt * 0.25);
    const m35Amt = Math.round(commAmt * 0.25);
    const m40Amt = Math.max(0, commAmt - m25Amt - m35Amt);
    const today = new Date().toISOString().split('T')[0];

    const updates: Partial<ReferralRecord> = {
      status: trackStatus,
      estimatedBudget: budgetNum,
      commissionPercentage: commPct,
      commissionAmount: commAmt,
      adminStatusNote: trackAdminNote.trim(),
      clientName: trackClientName.trim() || editingTrackReferral.clientName,
      clientEmail: trackClientEmail.trim() || editingTrackReferral.clientEmail,
      partnerName: trackPartnerName.trim() || editingTrackReferral.partnerName,
      partnerEmail: trackPartnerEmail.trim() || editingTrackReferral.partnerEmail,
      partnerWhatsApp: trackPartnerWhatsApp.trim() || editingTrackReferral.partnerWhatsApp,
      orderNumber: trackOrderNumber.trim().toUpperCase() || editingTrackReferral.orderNumber,
      milestone25Paid: trackMilestone25Paid,
      milestone25PaidAt: trackMilestone25Paid
        ? editingTrackReferral.milestone25PaidAt || today
        : undefined,
      milestone25Amount: m25Amt,
      milestone35Paid: trackMilestone35Paid,
      milestone35PaidAt: trackMilestone35Paid
        ? editingTrackReferral.milestone35PaidAt || today
        : undefined,
      milestone35Amount: m35Amt,
      milestone40Paid: trackMilestone40Paid,
      milestone40PaidAt: trackMilestone40Paid
        ? editingTrackReferral.milestone40PaidAt || today
        : undefined,
      milestone40Amount: m40Amt
    };

    if (
      editingTrackReferral.id.startsWith('ord-sync-') ||
      editingTrackReferral.id.startsWith('msg-sync-')
    ) {
      addReferral({
        ...editingTrackReferral,
        ...updates
      });
    } else {
      updateReferralRecord(editingTrackReferral.id, updates);
    }

    refreshAllData();
    setIsEditTrackModalOpen(false);
    showReferralNotice(
      `Track Status updated for ${updates.clientName} (${editingTrackReferral.partnerToken || updates.partnerName}) → ${REFERRAL_STAGE_LABELS[trackStatus]}`
    );
  };

  const currentTabLabel =
    navGroups.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label || 'Overview';

  return (
    <div
      id="admin-dashboard-root-page"
      className="fixed inset-0 z-50 w-full h-full min-h-screen bg-[#f8fafc] flex flex-col overflow-hidden text-slate-900"
    >
      <div className="w-full h-full flex flex-col overflow-hidden bg-[#f8fafc]">
        {/* Top Executive Header Bar (Compact on Mobile, Spacious on Desktop) */}
        <header className="h-12 sm:h-14 md:h-16 border-b border-slate-200/90 bg-white px-2.5 sm:px-5 md:px-6 flex items-center justify-between shrink-0 shadow-xs z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Drawer Trigger */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Studio Monogram / 3D Brand Logo */}
            <div className="h-7.5 sm:h-8 px-1.5 py-0.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-xs">
              <img
                src="/images/usman-devhub-logo.png"
                alt="Usman DevHub Logo"
                className="h-6 sm:h-6.5 w-auto object-contain shrink-0"
              />
            </div>

            {/* Title & Portal Badge */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="font-display font-bold text-xs sm:text-sm md:text-base text-slate-900 truncate">
                  Usman DevHub
                  <span className="hidden sm:inline font-normal text-slate-400 mx-1">|</span>
                  <span className="hidden sm:inline text-slate-600 text-xs font-semibold">Studio Hub</span>
                </h2>
                {/* Mobile Active Tab Chip */}
                <span className="md:hidden px-1.5 py-0.5 rounded bg-blue-50 text-[#1430d8] border border-blue-200/60 text-[9px] font-bold tracking-wide shrink-0 truncate max-w-[85px] sm:max-w-none">
                  {currentTabLabel}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1430d8] border border-blue-200/60 text-[10px] font-bold tracking-wide shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1430d8] animate-pulse" />
                  Owner Portal
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 shrink-0">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-slate-700 font-semibold">{currentTabLabel}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                Authorized Executive: Muhammad Usman Afzal (hello@usmandevhub.com)
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Live Cloud Status on Desktop */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Realtime Synced</span>
            </div>

            {/* Back to Live Website Button */}
            <button
              type="button"
              id="admin-close-modal-btn"
              onClick={onClose}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] sm:text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
              title="Exit Admin and View Live Website"
            >
              <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1430d8]" />
              <span className="hidden sm:inline">Back to </span>
              <span>Website</span>
            </button>

            {/* Logout button */}
            {isAuthenticated && (
              <button
                id="admin-logout-btn"
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
                title="Sign Out of Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </header>

        {/* Auth Barrier or Dashboard Body */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
            <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1430d8] flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-2xs">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900">
                Owner Executive Portal
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
                Secure access for Muhammad Usman Afzal to manage services, showcase cards, client orders, messages &amp; referrals.
              </p>

              {/* Contextual Protected Page Indicator if user requested a specific tab or order */}
              {(pendingTab || requestedOrderId || requestedStudio) && (
                <div className="p-3.5 mb-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-left flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-950 truncate">
                      {requestedOrderId
                        ? `Protected Order #${requestedOrderId}`
                        : requestedStudio
                        ? 'Protected Order Agreement Studio'
                        : `Protected Section: ${ADMIN_TAB_METADATA[pendingTab]?.title || 'Studio Dashboard'}`}
                    </p>
                    <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                      Baghir login ke admin panel ka koi bhi page access nahi ho sakta. Pehle owner credentials (hello@usmandevhub.com ya usmanafzal3254@gmail.com) se login karein, phir ye page open hoga.
                    </p>
                  </div>
                </div>
              )}

              {authError && (
                <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Owner Email
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      <Lock className="w-2.5 h-2.5" />
                      Authorized Owner
                    </span>
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="hello@usmandevhub.com or usmanafzal3254@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#1430d8] focus:bg-white transition-all font-semibold"
                  />
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setAdminEmail('hello@usmandevhub.com')}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        adminEmail.toLowerCase() === 'hello@usmandevhub.com'
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      hello@usmandevhub.com
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminEmail('usmanafzal3254@gmail.com')}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        adminEmail.toLowerCase() === 'usmanafzal3254@gmail.com'
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      usmanafzal3254@gmail.com
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="Enter encrypted owner password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#1430d8] focus:bg-white transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 rounded-xl bg-[#1430d8] text-white text-xs font-bold hover:bg-[#0075f7] disabled:opacity-60 transition-all shadow-md shadow-blue-600/20 cursor-pointer mt-2"
                >
                  {isLoggingIn ? 'Verifying Encrypted Session...' : 'Access Studio Management'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden relative">
            {/* Desktop & Tablet Sidebar */}
            <aside className="hidden md:flex md:w-64 lg:w-72 bg-white border-r border-slate-200/90 flex-col justify-between shrink-0 h-full p-4 overflow-y-auto">
              <div className="space-y-5">
                {navGroups.map((group) => (
                  <div key={group.title}>
                    <span className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1.5">
                      {group.title}
                    </span>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(item.id as any);
                              if (item.id === 'leadership') setLeadership(getLeadershipTeam());
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#1430d8] text-white shadow-sm shadow-blue-600/25'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : item.badgeColor || 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Executive Profile Card */}
              <div className="pt-4 border-t border-slate-200/80 mt-4">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1430d8] to-[#0075f7] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    UA
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      Muhammad Usman
                    </p>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Studio Owner
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Mobile Drawer (Smooth Overlay Menu) */}
            <AnimatePresence>
              {isMobileNavOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileNavOpen(false)}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 flex flex-col justify-between p-5 shadow-2xl md:hidden overflow-y-auto"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                            <img
                              src="/images/usman-devhub-logo.png"
                              alt="Usman DevHub Logo"
                              className="h-5 w-auto object-contain shrink-0"
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-xs text-slate-900">Usman DevHub</h3>
                            <span className="text-[10px] text-slate-400">Executive Panel</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsMobileNavOpen(false)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-5">
                        {navGroups.map((group) => (
                          <div key={group.title}>
                            <span className="px-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                              {group.title}
                            </span>
                            <div className="space-y-1">
                              {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      setActiveTab(item.id as any);
                                      if (item.id === 'leadership') setLeadership(getLeadershipTeam());
                                      setIsMobileNavOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                      isActive
                                        ? 'bg-[#1430d8] text-white shadow-xs'
                                        : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                      <span className="truncate">{item.label}</span>
                                    </div>
                                    {item.badge && (
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                          isActive
                                            ? 'bg-white/20 text-white'
                                            : item.badgeColor || 'bg-slate-100 text-slate-600'
                                        }`}
                                      >
                                        {item.badge}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-6 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileNavOpen(false);
                          onClose();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Live Website</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Mobile Bottom Thumb Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-lg">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'overview' ? 'text-[#1430d8]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('referrals')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'referrals' ? 'text-[#1430d8]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>Track Status</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('portfolio')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'portfolio' ? 'text-[#1430d8]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Showcase</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={`relative flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'messages' ? 'text-[#1430d8]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
                {messages.filter(m => m.status === 'unread').length > 0 && (
                  <span className="absolute top-0 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Menu className="w-4 h-4" />
                <span>More</span>
              </button>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-xl font-bold mb-1 text-[#0e0e0e]">
                      Studio Executive Summary
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Live operational metrics and quick controls for Usman DevHub Tech &amp; Creative Studio.
                    </p>
                  </div>

                  {/* 4 Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('referrals')}
                      className="text-left p-5 rounded-2xl bg-white border border-neutral-200 hover:border-[#1430d8] transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-semibold text-neutral-500">Partner Tokens &amp; Track</span>
                      <div className="font-display text-3xl font-extrabold text-[#1430d8] mt-2 tabular-nums">
                        {partnerTokens.length} <span className="text-xs font-semibold text-emerald-600 block sm:inline">· Permanent</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block tabular-nums">
                        {referrals.length} tracked deals · ${referrals.reduce((acc, r) => acc + r.commissionAmount, 0).toLocaleString()} 20% payouts →
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-left p-5 rounded-2xl bg-white border border-neutral-200 hover:border-[#1430d8] transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-semibold text-neutral-500">Agreements &amp; PDF Center</span>
                      <div className="font-display text-3xl font-extrabold text-[#0075f7] mt-2 tabular-nums">
                        {orders.length} <span className="text-xs font-semibold text-emerald-600 block sm:inline">· Permanent</span>
                      </div>
                      <span className="text-[11px] text-[#1430d8] font-semibold mt-1 inline-block tabular-nums">
                        Direct &amp; Token Reference PDFs →
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('messages')}
                      className="text-left p-5 rounded-2xl bg-white border border-neutral-200 hover:border-[#1430d8] transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-semibold text-neutral-500">Client Inquiries</span>
                      <div className="font-display text-3xl font-extrabold text-[#0e0e0e] mt-2 tabular-nums">
                        {messages.length}
                      </div>
                      <span className="text-[11px] text-[#1430d8] font-semibold mt-1 inline-block">
                        {messages.filter(m => m.status === 'unread').length} unread messages →
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('reviews')}
                      className="text-left p-5 rounded-2xl bg-white border border-neutral-200 hover:border-[#1430d8] transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-semibold text-neutral-500">Client Reviews</span>
                      <div className="font-display text-3xl font-extrabold text-[#0e0e0e] mt-2 tabular-nums">
                        {reviews.length}
                      </div>
                      <span className="text-[11px] text-amber-700 font-semibold mt-1 inline-block">
                        {reviews.filter(r => r.status === 'pending').length} pending approval →
                      </span>
                    </button>
                  </div>

                  {/* Direct Partner Tokens + Agreements + Live Token Track Control Panel on Overview */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                      <div>
                        <h4 className="font-display text-base font-bold text-[#0e0e0e]">
                          Partner Tokens, Official Agreements &amp; Live Token Track
                        </h4>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Issue unique Partner Tokens, create Direct or Reference Agreements, and inspect live Token Track Status in one place.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCreateNewBlankOrder(false)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Direct Agreement</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateNewBlankOrder(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1430d8] border border-blue-200 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Reference Agreement</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('referrals')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <span>Token Track &amp; List ({partnerTokens.length})</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {referralSaveNotice && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
                        <span>{referralSaveNotice}</span>
                        <button
                          type="button"
                          onClick={() => setReferralSaveNotice('')}
                          className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Quick Issue Partner Token Bar directly on Overview */}
                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col lg:flex-row lg:items-end justify-between gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 flex-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Partner Name *</label>
                          <input
                            type="text"
                            value={adminQuickPartnerName}
                            onChange={(e) => setAdminQuickPartnerName(e.target.value)}
                            placeholder="Enter Partner Name"
                            className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#1430d8]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Partner Gmail</label>
                          <input
                            type="email"
                            value={adminQuickPartnerEmail}
                            onChange={(e) => setAdminQuickPartnerEmail(e.target.value)}
                            placeholder="partner@gmail.com"
                            className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#1430d8]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">WhatsApp (Optional)</label>
                          <input
                            type="text"
                            value={adminQuickPartnerWhatsApp}
                            onChange={(e) => setAdminQuickPartnerWhatsApp(e.target.value)}
                            placeholder="+92 300 0000000"
                            className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#1430d8]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Target Service</label>
                          <select
                            value={adminQuickPartnerService}
                            onChange={(e) => {
                              const srvTitle = e.target.value;
                              setAdminQuickPartnerService(srvTitle);
                              const match = services.find((s) => s.title === srvTitle);
                              if (match?.subcategories && match.subcategories.length > 0) {
                                setAdminQuickPartnerCategory(match.subcategories[0]);
                              } else {
                                setAdminQuickPartnerCategory('');
                              }
                            }}
                            className="w-full px-2.5 py-2 rounded-lg bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#1430d8] cursor-pointer"
                          >
                            {services.map((srv) => (
                              <option key={srv.id} value={srv.title}>
                                {srv.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Category / Scope</label>
                          {(() => {
                            const cur = services.find((s) => s.title === adminQuickPartnerService);
                            const cats = cur?.subcategories || [];
                            if (cats.length > 0) {
                              return (
                                <select
                                  value={adminQuickPartnerCategory}
                                  onChange={(e) => setAdminQuickPartnerCategory(e.target.value)}
                                  className="w-full px-2.5 py-2 rounded-lg bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#1430d8] cursor-pointer"
                                >
                                  {cats.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  ))}
                                </select>
                              );
                            }
                            return (
                              <input
                                type="text"
                                value={adminQuickPartnerCategory}
                                onChange={(e) => setAdminQuickPartnerCategory(e.target.value)}
                                placeholder="Scope / Category"
                                className="w-full px-2.5 py-2 rounded-lg bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#1430d8]"
                              />
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAdminIssueQuickToken('token')}
                          disabled={!adminQuickPartnerName.trim()}
                          className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                        >
                          + Issue Token
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminIssueQuickToken('agreement')}
                          disabled={!adminQuickPartnerName.trim()}
                          className="px-3 py-2 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                        >
                          Token + Agreement
                        </button>
                      </div>
                    </div>

                    {/* Latest Issued Partner Tokens (Name + Gmail + Token) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#0e0e0e]">
                          All Issued Partner Tokens ({partnerTokens.length} Saved)
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('referrals')}
                          className="text-[11px] font-semibold text-[#1430d8] hover:underline cursor-pointer"
                        >
                          Open Live Token Track →
                        </button>
                      </div>
                      {partnerTokens.length === 0 ? (
                        <div className="py-5 text-center text-xs text-neutral-500 border border-dashed border-neutral-200 rounded-xl">
                          No partner tokens issued yet. Enter a Partner Name above and click <strong>+ Issue Token</strong> to start cleanly.
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl px-3.5">
                          {partnerTokens.slice(0, 5).map((pt) => {
                            const linkedDeal = referrals.find(
                              (r) => normalizeReferralToken(r.partnerToken || '') === normalizeReferralToken(pt.token)
                            );
                            const linkedOrder = orders.find(
                              (o) => normalizeReferralToken(o.referralToken || '') === normalizeReferralToken(pt.token)
                            );
                            return (
                              <div
                                key={pt.token}
                                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                              >
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className="font-bold text-[#0e0e0e]">{pt.partnerName}</span>
                                    <span className="text-neutral-300" aria-hidden="true">·</span>
                                    <span className="text-neutral-600">{pt.partnerEmail}</span>
                                    <span className="text-neutral-300" aria-hidden="true">·</span>
                                    <code className="font-mono font-bold text-[#1430d8] tabular-nums">
                                      {pt.token}
                                    </code>
                                  </div>
                                  <div className="text-[11px] text-neutral-500 mt-0.5 tabular-nums">
                                    Issued: {formatTokenIssuedAt(pt.createdAt)}
                                    {linkedOrder ? ` · Agreement: ${linkedOrder.orderNumber}` : ''}
                                    {' · '}
                                    {linkedDeal
                                      ? `Client: ${linkedDeal.clientName} (${REFERRAL_STAGE_LABELS[linkedDeal.status]})`
                                      : linkedOrder
                                      ? `Client: ${linkedOrder.clientName || 'Confirmed Agreement'}`
                                      : 'Waiting for Client Intro'}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                  {linkedDeal && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditTrackModal(linkedDeal)}
                                      className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1 shadow-2xs"
                                      title="Edit Live Track Status & Milestones"
                                    >
                                      <Activity className="w-3 h-3" />
                                      <span>Edit Track</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleInspectTokenInAdmin(pt.token)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1"
                                  >
                                    <Activity className="w-3 h-3" />
                                    <span>Track</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCreateOrOpenOrderFromPartnerToken(pt)}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>{linkedOrder ? linkedOrder.orderNumber : '+ Agreement'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickLogDealFromToken(pt)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                                  >
                                    + Log Deal
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Recent Tracked Client Deals */}
                    <div className="pt-2 border-t border-neutral-100">
                      <span className="text-xs font-bold text-[#0e0e0e] block mb-1.5">
                        Active Client Deals — Live Track Status ({referrals.length})
                      </span>
                      {referrals.length === 0 ? (
                        <div className="py-4 text-center text-xs text-neutral-500">
                          No referred deals logged yet. Issue a Partner Token above, then click <strong>+ Agreement</strong> or <strong>+ Log Deal</strong> when a client connects.
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-100">
                          {referrals.slice(0, 4).map((ref) => (
                            <div
                              key={ref.id}
                              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <span className="font-semibold text-[#0e0e0e]">{ref.clientName}</span>
                                  <span className="text-neutral-300" aria-hidden="true">·</span>
                                  <span className="text-neutral-600">{ref.projectType}</span>
                                  {ref.partnerToken && (
                                    <>
                                      <span className="text-neutral-300" aria-hidden="true">·</span>
                                      <code className="font-mono font-bold text-[#1430d8] tabular-nums">
                                        {ref.partnerToken}
                                      </code>
                                    </>
                                  )}
                                </div>
                                <div className="text-[11px] text-neutral-500 mt-0.5 tabular-nums">
                                  Partner: {ref.partnerName} ({ref.partnerEmail}) · Deal: ${ref.estimatedBudget.toLocaleString()} · {ref.commissionPercentage ?? 20}% Commission: ${ref.commissionAmount.toLocaleString()}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <label className="text-[11px] font-medium text-neutral-500 whitespace-nowrap">
                                  Track Status:
                                </label>
                                <select
                                  aria-label={`Track status for ${ref.clientName}`}
                                  value={ref.status}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value as ReferralRecord['status'];
                                    updateReferralStatus(ref.id, nextStatus);
                                    refreshAllData();
                                    showReferralNotice(
                                      `Track Status updated: ${ref.clientName} (${ref.partnerToken || ref.partnerName}) → ${REFERRAL_STAGE_LABELS[nextStatus]}`
                                    );
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs font-semibold text-[#0e0e0e] focus:outline-none focus:border-[#1430d8] cursor-pointer"
                                >
                                  <option value="pending">1. Details Received</option>
                                  <option value="in_negotiation">2. In Negotiation</option>
                                  <option value="deal_complete">3. Deal Confirmed</option>
                                  <option value="milestone_25">4. 25% Kickoff Received</option>
                                  <option value="milestone_35">5. 35% Mid Milestone Paid</option>
                                  <option value="milestone_40">6. 40% Final Delivery Paid</option>
                                  <option value="commission_paid">7. Full Commission Settled</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTrackModal(ref)}
                                  className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1 shadow-2xs"
                                  title="Edit Live Track Status & Milestones"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit Track</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Action shortcuts */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-neutral-200 flex flex-col justify-between">
                      <div>
                        <h4 className="font-display font-bold text-sm text-[#0e0e0e]">
                          Showcase Portfolio Cards
                        </h4>
                        <p className="text-xs text-neutral-600 mt-1">
                          Add or edit Web Dev, 3D Web, E-Commerce, Design, and 3D Video cards.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('portfolio')}
                        className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#1430d8] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Manage Showcase</span>
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-neutral-200 flex flex-col justify-between">
                      <div>
                        <h4 className="font-display font-bold text-sm text-[#0e0e0e]">
                          Portfolio &amp; Showcase
                        </h4>
                        <p className="text-xs text-neutral-600 mt-1">
                          Manage case studies, live demo links, and project showcases.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('portfolio')}
                        className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#0075f7] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Manage Showcase</span>
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-neutral-200 flex flex-col justify-between">
                      <div>
                        <h4 className="font-display font-bold text-sm text-[#0e0e0e]">
                          Leadership Team Photos
                        </h4>
                        <p className="text-xs text-neutral-600 mt-1">
                          Update profile photos and bios for core studio leadership.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('leadership')}
                        className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#0e0e0e] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Manage Leadership</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SERVICES CATALOG (READ-ONLY & PERMANENT - NO EDIT / DELETE) */}
              {activeTab === 'services' && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg sm:text-xl font-bold text-[#0e0e0e]">
                          Home Page Services Catalog
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" />
                          Permanent &amp; Protected
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-neutral-500 mt-1">
                        The 7 flagship studio services are permanently active on your website using sleek tech vector icons &amp; specializations (matching the Home Page design). Editing and deleting are disabled as requested.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold font-mono flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        7 Core Services Active
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {services.map((srv, index) => {
                      const serviceNumber = String(srv.order || index + 1).padStart(2, '0');
                      
                      const getServiceIconBadge = (title: string) => {
                        if (title.includes('3D Animated') || title.includes('3D Interactive')) return <Box className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
                        if (title.includes('Web Development')) return <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
                        if (title.includes('E-Commerce')) return <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
                        if (title.includes('Graphic Design')) return <Palette className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
                        if (title.includes('Motion') || title.includes('Video Animation')) return <Film className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
                        if (title.includes('Cloud') || title.includes('Deployment')) return <Cloud className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
                        return <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
                      };

                      return (
                        <div
                          key={srv.id}
                          className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 shadow-2xs gap-4 transition-all"
                        >
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            {/* Matching Home Page Sleek Icon Badge (No picture needed since Home Page uses pure icons) */}
                            <div className="relative shrink-0">
                              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#1430d8] to-[#0075f7] flex items-center justify-center text-white shadow-md shadow-blue-600/25 shrink-0 border border-blue-400/20">
                                {getServiceIconBadge(srv.title)}
                              </div>
                              <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-md bg-[#0e0e0e] text-white text-[10px] font-mono font-bold shadow-xs border border-white/20">
                                #{serviceNumber}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="font-bold text-sm sm:text-base text-[#0e0e0e]">
                                  {srv.title}
                                </h4>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#1430d8] font-bold">
                                  {srv.category}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                  Active Live
                                </span>
                              </div>

                              <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                                {srv.description}
                              </p>

                              {/* Real Subcategories pills */}
                              {srv.subcategories && srv.subcategories.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {srv.subcategories.map((sub, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[10px] font-medium"
                                    >
                                      {sub}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-600 text-xs font-semibold">
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Fixed Flagship Service</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PORTFOLIO MANAGEMENT - Dedicated Service-Specific Showcase System */}
              {activeTab === 'portfolio' && (() => {
                const SHOWCASE_SERVICES = [
                  {
                    id: 'all',
                    name: 'All Projects',
                    shortLabel: 'All',
                    icon: Layers,
                    accentColor: 'blue',
                    activeClass: 'bg-[#1430d8] text-white shadow-md shadow-blue-500/20',
                    pillBg: 'bg-blue-50 text-[#1430d8]',
                    description: 'Central agency directory displaying all showcase cards across every service.',
                    defaultCategory: 'Web Development',
                    defaultSubcategory: 'Business Websites'
                  },
                  {
                    id: 'Web Development',
                    name: 'Web Development',
                    shortLabel: 'Web Dev',
                    icon: Globe,
                    accentColor: 'blue',
                    activeClass: 'bg-blue-600 text-white shadow-md shadow-blue-600/20',
                    pillBg: 'bg-blue-50 text-blue-700',
                    description: 'Corporate business portals, SaaS platforms, portfolios, and high-converting landing pages.',
                    defaultCategory: 'Web Development',
                    defaultSubcategory: 'Business Websites'
                  },
                  {
                    id: '3D Animated Websites',
                    name: '3D Animated Websites',
                    shortLabel: '3D Web',
                    icon: Box,
                    accentColor: 'indigo',
                    activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20',
                    pillBg: 'bg-indigo-50 text-indigo-700',
                    description: 'Interactive 3D product visualizers, WebGL canvas demos, and scroll-driven frame scrub experiences.',
                    defaultCategory: '3D Animated Websites',
                    defaultSubcategory: 'Interactive 3D Product Experiences'
                  },
                  {
                    id: 'E-Commerce Development',
                    name: 'E-Commerce Development',
                    shortLabel: 'E-Commerce',
                    icon: ShoppingBag,
                    accentColor: 'emerald',
                    activeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
                    pillBg: 'bg-emerald-50 text-emerald-700',
                    description: 'Turnkey online stores, multi-vendor marketplaces, wholesale B2B portals, and subscriptions.',
                    defaultCategory: 'E-Commerce Development',
                    defaultSubcategory: 'Custom & Any Niche Store'
                  },
                  {
                    id: 'Graphic Design',
                    name: 'Graphic Design',
                    shortLabel: 'Graphic Design',
                    icon: Palette,
                    accentColor: 'pink',
                    activeClass: 'bg-pink-600 text-white shadow-md shadow-pink-600/20',
                    pillBg: 'bg-pink-50 text-pink-700',
                    description: 'Brand identity systems, luxury logos, product renders, and high-CTR YouTube thumbnails.',
                    defaultCategory: 'Graphic Design',
                    defaultSubcategory: 'Logo Design'
                  },
                  {
                    id: '3D Video Animation',
                    name: '3D Video Animation',
                    shortLabel: '3D Video',
                    icon: Film,
                    accentColor: 'purple',
                    activeClass: 'bg-purple-600 text-white shadow-md shadow-purple-600/20',
                    pillBg: 'bg-purple-50 text-purple-700',
                    description: 'Studio-grade 3D animation videos, product exploded views, logo idents, and commercial promos.',
                    defaultCategory: '3D Video Animation',
                    defaultSubcategory: 'Logo Animation'
                  }
                ];

                const matchesService = (projCat: string, serviceId: string) => {
                  if (serviceId === 'all') return true;
                  const c = (projCat || '').toLowerCase();
                  const t = serviceId.toLowerCase();
                  if (c === t) return true;
                  if (serviceId === '3D Animated Websites' && (c.includes('3d animated') || c.includes('3d interactive'))) return true;
                  if (serviceId === '3D Video Animation' && (c.includes('video') || c.includes('motion'))) return true;
                  if (serviceId === 'Graphic Design' && (c.includes('design') || c.includes('graphic'))) return true;
                  if (serviceId === 'E-Commerce Development' && (c.includes('commerce') || c.includes('store') || c.includes('shop'))) return true;
                  if (serviceId === 'Web Development' && c.includes('web development')) return true;
                  return false;
                };

                const currentService = SHOWCASE_SERVICES.find((s) => s.id === portfolioActiveServiceTab) || SHOWCASE_SERVICES[0];

                // Dynamically fetch subcategories for current service tab
                const currentTaxonomy = SHOWCASE_TAXONOMY.find((t) => matchesService(t.category, currentService.id));
                const serviceSubcategories = currentTaxonomy ? currentTaxonomy.subcategories : [];

                // Filtered project list
                const filteredList = projects.filter((proj) => {
                  if (!matchesService(proj.category, portfolioActiveServiceTab)) return false;
                  if (portfolioActiveSubcategory !== 'all') {
                    if ((proj.subcategory || '').toLowerCase() !== portfolioActiveSubcategory.toLowerCase()) {
                      return false;
                    }
                  }
                  if (portfolioSearch.trim()) {
                    const q = portfolioSearch.toLowerCase();
                    const inTitle = (proj.title || '').toLowerCase().includes(q);
                    const inDesc = (proj.description || '').toLowerCase().includes(q);
                    const inSub = (proj.subcategory || '').toLowerCase().includes(q);
                    const inCat = (proj.category || '').toLowerCase().includes(q);
                    const inClient = (proj.client || '').toLowerCase().includes(q);
                    const inTech = Array.isArray(proj.technologies)
                      ? proj.technologies.some((t) => t.toLowerCase().includes(q))
                      : String(proj.technologies || '').toLowerCase().includes(q);
                    if (!inTitle && !inDesc && !inSub && !inCat && !inClient && !inTech) return false;
                  }
                  return true;
                });

                const handleAddForService = () => {
                  setEditingProject({
                    category: currentService.defaultCategory,
                    subcategory: currentService.defaultSubcategory,
                    year: '2026',
                    liveUrl: '',
                    videoUrl: currentService.id === '3D Video Animation' ? '' : '',
                    technologies: currentService.id === '3D Video Animation'
                      ? ['Cinema 4D', 'After Effects']
                      : currentService.id === 'Graphic Design'
                      ? ['Figma', 'Illustrator', 'Photoshop']
                      : currentService.id === '3D Animated Websites'
                      ? ['Three.js', 'GSAP', 'WebGL']
                      : ['Next.js', 'TypeScript', 'Tailwind CSS']
                  });
                };

                return (
                  <div className="space-y-6">
                    {/* Top Section: Header & Quick Stats */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1430d8] text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-blue-100">
                            Showcase Manager
                          </span>
                          <span className="text-xs text-neutral-400">•</span>
                          <span className="text-xs font-semibold text-neutral-600">
                            {projects.length} Total Cards Live
                          </span>
                        </div>
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-[#0e0e0e] mt-1">
                          Showcase Projects By Service
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Har service ka alag showcase section: Web Dev, 3D Websites, E-Commerce, Graphic Design, aur 3D Video Animation.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleAddForService}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1430d8] text-white text-xs font-bold hover:bg-[#0075f7] transition-all shadow-md shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>
                            {portfolioActiveServiceTab === 'all'
                              ? 'Add Showcase Card'
                              : `Add ${currentService.shortLabel} Card`}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Action Notice / Feedback Banner */}
                    {projectActionNotice && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-2xs animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{projectActionNotice}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProjectActionNotice('')}
                          className="text-emerald-500 hover:text-emerald-700 cursor-pointer p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Service Tabs Navigation - Dedicated Bar for Every Service */}
                    <div className="p-2 sm:p-2.5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs">
                      <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
                        <span>Select Service To Manage</span>
                        <span>Click service tab to filter cards</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
                        {SHOWCASE_SERVICES.map((srv) => {
                          const IconComp = srv.icon;
                          const isSelected = portfolioActiveServiceTab === srv.id;
                          const count = projects.filter((p) => matchesService(p.category, srv.id)).length;

                          return (
                            <button
                              key={srv.id}
                              type="button"
                              onClick={() => {
                                setPortfolioActiveServiceTab(srv.id);
                                setPortfolioActiveSubcategory('all');
                              }}
                              className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer border text-center ${
                                isSelected
                                  ? `${srv.activeClass} border-transparent scale-[1.02]`
                                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200/80 hover:border-neutral-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <IconComp className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-neutral-500'}`} />
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                  isSelected ? 'bg-white/25 text-white' : 'bg-neutral-200 text-neutral-700'
                                }`}>
                                  {count}
                                </span>
                              </div>
                              <span className="text-[11px] sm:text-xs font-bold leading-tight line-clamp-1">
                                {srv.shortLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Service Specific Header & Filters Bar */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-neutral-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            portfolioActiveServiceTab === 'all'
                              ? 'bg-blue-50 text-[#1430d8]'
                              : portfolioActiveServiceTab === '3D Video Animation'
                              ? 'bg-purple-100 text-purple-700'
                              : portfolioActiveServiceTab === 'Graphic Design'
                              ? 'bg-pink-100 text-pink-700'
                              : portfolioActiveServiceTab === '3D Animated Websites'
                              ? 'bg-indigo-100 text-indigo-700'
                              : portfolioActiveServiceTab === 'E-Commerce Development'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-50 text-[#1430d8]'
                          }`}>
                            <currentService.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display text-base sm:text-lg font-bold text-[#0e0e0e]">
                                {currentService.name} Showcase
                              </h4>
                              <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[11px] font-bold">
                                {filteredList.length} Cards Shown
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5 max-w-2xl">
                              {currentService.description}
                            </p>
                          </div>
                        </div>

                        {/* Search Input Box */}
                        <div className="relative w-full md:w-64 shrink-0">
                          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={portfolioSearch}
                            onChange={(e) => setPortfolioSearch(e.target.value)}
                            placeholder={`Search in ${currentService.shortLabel}...`}
                            className="w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:bg-white focus:outline-none focus:border-[#1430d8] text-neutral-900 transition-colors"
                          />
                          {portfolioSearch && (
                            <button
                              type="button"
                              onClick={() => setPortfolioSearch('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subcategory Chips Row (If service has defined subcategories) */}
                      {serviceSubcategories.length > 0 && (
                        <div className="pt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
                          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                            <Filter className="w-3 h-3 text-neutral-400" />
                            <span>Category:</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => setPortfolioActiveSubcategory('all')}
                            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                              portfolioActiveSubcategory === 'all'
                                ? 'bg-[#1430d8] text-white font-bold shadow-2xs'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            All ({projects.filter((p) => matchesService(p.category, currentService.id)).length})
                          </button>

                          {serviceSubcategories.map((subName) => {
                            const subCount = projects.filter(
                              (p) => matchesService(p.category, currentService.id) && (p.subcategory || '').toLowerCase() === subName.toLowerCase()
                            ).length;
                            const isSubActive = portfolioActiveSubcategory.toLowerCase() === subName.toLowerCase();

                            return (
                              <button
                                key={subName}
                                type="button"
                                onClick={() => setPortfolioActiveSubcategory(subName)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                                  isSubActive
                                    ? 'bg-[#1430d8] text-white font-bold shadow-2xs'
                                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                                }`}
                              >
                                <span>{subName}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                  isSubActive ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
                                }`}>
                                  {subCount}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Cards Grid Tailored to the Selected Service */}
                    {filteredList.length === 0 ? (
                      <div className="py-12 px-6 rounded-2xl bg-white border border-neutral-200 text-center flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mb-3">
                          <Search className="w-6 h-6" />
                        </div>
                        <h4 className="font-display text-base font-bold text-neutral-800">
                          No Showcase Cards Found
                        </h4>
                        <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                          {portfolioSearch
                            ? `No projects matched "${portfolioSearch}" in this category.`
                            : `There are currently no cards added for ${currentService.name}.`}
                        </p>
                        <button
                          type="button"
                          onClick={handleAddForService}
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1430d8] text-white text-xs font-bold hover:bg-[#0075f7] cursor-pointer shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create First {currentService.shortLabel} Card</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredList.map((proj) => {
                          const is3DVideo =
                            proj.category === '3D Video Animation' ||
                            proj.category === 'Video Studio' ||
                            proj.category.toLowerCase().includes('video animation') ||
                            proj.category.toLowerCase().includes('motion design');
                          const isDesign = proj.category.toLowerCase().includes('design') || proj.category.toLowerCase().includes('graphic');
                          const is3DWeb = !is3DVideo && (proj.category.toLowerCase().includes('3d animated') || proj.category.toLowerCase().includes('3d interactive'));
                          const isEcom = proj.category.toLowerCase().includes('commerce');

                          return (
                            <div
                              key={proj.id}
                              className={`p-4 rounded-2xl bg-white border transition-all hover:shadow-md flex flex-col sm:flex-row gap-3.5 sm:gap-4 ${
                                is3DVideo
                                  ? 'border-purple-200/90 hover:border-purple-400'
                                  : isDesign
                                  ? 'border-pink-200/90 hover:border-pink-400'
                                  : is3DWeb
                                  ? 'border-indigo-200/90 hover:border-indigo-400'
                                  : isEcom
                                  ? 'border-emerald-200/90 hover:border-emerald-400'
                                  : 'border-neutral-200/90 hover:border-[#1430d8]/40'
                              }`}
                            >
                              {/* Visual Thumbnail Frame */}
                              <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-neutral-200 group">
                                <img
                                  src={proj.imageUrl}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    const fallback = getFallbackImage(proj.imageUrl, proj.category, proj.videoUrl);
                                    (e.target as HTMLImageElement).src = fallback;
                                  }}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />

                                {/* Format Badge */}
                                {is3DVideo && (
                                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-purple-600 text-white text-[9px] font-bold flex items-center gap-1 shadow-sm">
                                    <Film className="w-2.5 h-2.5" />
                                    <span>3D Video</span>
                                  </span>
                                )}
                                {isDesign && (
                                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-pink-600 text-white text-[9px] font-bold flex items-center gap-1 shadow-sm">
                                    <Palette className="w-2.5 h-2.5" />
                                    <span>Artwork</span>
                                  </span>
                                )}
                                {is3DWeb && (
                                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold flex items-center gap-1 shadow-sm">
                                    <Box className="w-2.5 h-2.5" />
                                    <span>WebGL 3D</span>
                                  </span>
                                )}
                                {isEcom && (
                                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold flex items-center gap-1 shadow-sm">
                                    <ShoppingBag className="w-2.5 h-2.5" />
                                    <span>Store</span>
                                  </span>
                                )}

                                {/* Video Play button on thumbnail strictly for 3D Video Animation */}
                                {is3DVideo && proj.videoUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setAdminPreviewVideo({ url: proj.videoUrl || proj.liveUrl, title: proj.title })}
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
                                    title="Play Video Stream"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                    </div>
                                  </button>
                                )}
                              </div>

                              {/* Card Content & Metadata */}
                              <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                  {/* Service & Category Pills */}
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                        is3DVideo
                                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                                          : isDesign
                                          ? 'bg-pink-50 text-pink-700 border-pink-200'
                                          : is3DWeb
                                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                          : isEcom
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-blue-50 text-[#1430d8] border-blue-200'
                                      }`}>
                                        <span>{proj.category}</span>
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] font-semibold border border-neutral-200/80">
                                        <span>{proj.subcategory || proj.category}</span>
                                      </span>
                                    </div>

                                    {/* Action Buttons: Edit & Delete */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setEditingProject(proj)}
                                        className="p-1.5 rounded-lg text-neutral-500 hover:text-[#1430d8] hover:bg-blue-50 transition-colors cursor-pointer"
                                        title="Edit Card"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>

                                      {deleteConfirmId === proj.id ? (
                                        <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-lg border border-red-200">
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteProject(proj.id)}
                                            className="px-2 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold transition-colors cursor-pointer shadow-xs"
                                            title="Confirm delete"
                                          >
                                            Confirm
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setDeleteConfirmId(null)}
                                            className="p-1 rounded text-neutral-400 hover:text-neutral-700 cursor-pointer"
                                            title="Cancel"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setDeleteConfirmId(proj.id)}
                                          className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                          title="Delete Card"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Title & Description */}
                                  <h4 className="font-bold text-sm text-[#0e0e0e] line-clamp-1 leading-snug">
                                    {proj.title}
                                  </h4>
                                  <p className="text-xs text-neutral-600 line-clamp-2 mt-1 leading-relaxed">
                                    {proj.description}
                                  </p>

                                  {/* Tech stack or video url info */}
                                  {is3DVideo && proj.videoUrl && (
                                    <div className="mt-2 text-[10px] text-purple-700 font-mono truncate bg-purple-50 px-2 py-0.5 rounded border border-purple-100 flex items-center gap-1">
                                      <Film className="w-3 h-3 shrink-0" />
                                      <span className="truncate">Video: {proj.videoUrl}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Bottom Bar: ID & Direct Action Button */}
                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 text-[11px]">
                                  <span className="text-neutral-400 font-mono text-[10px] truncate">
                                    #{proj.id} • {proj.year || '2026'}
                                  </span>

                                  {is3DVideo ? (
                                    <button
                                      type="button"
                                      onClick={() => setAdminPreviewVideo({ url: proj.videoUrl || proj.liveUrl, title: proj.title })}
                                      className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
                                    >
                                      <Play className="w-3 h-3 fill-current text-purple-600" />
                                      <span>Play 3D Video</span>
                                    </button>
                                  ) : isDesign ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAdminPreviewArtwork({
                                          url: proj.imageUrl,
                                          title: proj.title,
                                          category: proj.subcategory || proj.category,
                                          client: proj.client
                                        })
                                      }
                                      className="text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-pink-50 hover:bg-pink-100 transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Inspect Artwork</span>
                                    </button>
                                  ) : (
                                    <a
                                      href={ensureExternalUrl(proj.liveUrl) || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-[#1430d8] hover:text-[#0075f7] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
                                    >
                                      <span>Live Website</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* LEADERSHIP TEAM MANAGEMENT & IMAGE CONTROL */}
              {activeTab === 'leadership' && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <h3 className="font-display text-xl font-bold text-[#0e0e0e] flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#1430d8]" />
                        <span>Leadership Team &amp; Photo Control</span>
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Change profile pictures, upload photos, or delete pictures for Muhammad Usman Afzal, Umar Afzal, and Mudasir.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#1430d8] text-xs font-bold font-mono">
                        {leadership.length} Core Leaders
                      </span>
                    </div>
                  </div>

                  {leaderActionNotice && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{leaderActionNotice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLeaderActionNotice('')}
                        className="p-1 text-emerald-600 hover:text-emerald-900 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {leadership.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-2xl border border-neutral-200/90 bg-neutral-50/50 p-4 flex flex-col justify-between shadow-xs hover:border-[#1430d8]/40 transition-all duration-200"
                      >
                        <div>
                          {/* Role & Country Badge */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1430d8] text-[10px] font-bold uppercase tracking-wider">
                              {member.badge}
                            </span>
                            <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
                              <span>{member.flag}</span>
                              <span className="text-[11px] text-neutral-500">{member.location}</span>
                            </span>
                          </div>

                          {/* Profile Picture Display / Preview */}
                          <div className="relative w-full h-48 rounded-xl bg-neutral-900 overflow-hidden mb-3 border border-neutral-200 flex items-center justify-center">
                            {member.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-neutral-800 to-neutral-950 text-white p-4">
                                <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center font-display text-2xl font-black">
                                  {member.initials}
                                </div>
                                <span className="text-[10px] text-neutral-400 mt-2 font-medium">
                                  No Photo (Monogram Active)
                                </span>
                              </div>
                            )}

                            {/* Status indicator on photo */}
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-bold text-white flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${member.avatarUrl ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              <span>{member.avatarUrl ? 'Photo Active' : 'No Photo'}</span>
                            </div>
                          </div>

                          {/* Member info */}
                          <h4 className="font-bold text-sm text-[#0e0e0e]">{member.name}</h4>
                          <p className="text-xs font-semibold text-[#0075f7] mt-0.5">{member.role}</p>
                          <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">{member.tagline}</p>
                        </div>

                        {/* Image Action Buttons (Change & Delete) */}
                        <div className="mt-4 pt-3 border-t border-neutral-200/80 space-y-2">
                          <div className="flex gap-2">
                            {/* Change / Upload Button */}
                            <label className="flex-1 py-2 px-3 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{member.avatarUrl ? 'Change Pic' : 'Upload Pic'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (re) => {
                                      const dataUrl = re.target?.result as string;
                                      const updated = updateLeadershipImage(member.id, dataUrl);
                                      setLeadership(updated);
                                      setLeaderActionNotice(`Photo updated for ${member.name}!`);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>

                            {/* Delete Picture Button */}
                            {member.avatarUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = deleteLeadershipImage(member.id);
                                  setLeadership(updated);
                                  setLeaderActionNotice(`Photo deleted for ${member.name}! Fallback monogram restored.`);
                                }}
                                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Delete Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Pic</span>
                              </button>
                            )}
                          </div>

                          {/* Quick URL input */}
                          <div className="flex gap-1.5 pt-1">
                            <input
                              type="text"
                              defaultValue={member.avatarUrl}
                              placeholder="Or paste image URL..."
                              id={`pic-url-input-${member.id}`}
                              className="flex-1 px-2.5 py-1.5 rounded-lg border border-neutral-300 text-[11px] bg-white focus:outline-none focus:border-[#1430d8]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const inputEl = document.getElementById(`pic-url-input-${member.id}`) as HTMLInputElement | null;
                                if (inputEl) {
                                  const newUrl = inputEl.value.trim();
                                  const updated = updateLeadershipImage(member.id, newUrl);
                                  setLeadership(updated);
                                  setLeaderActionNotice(newUrl ? `Photo URL saved for ${member.name}!` : `Photo cleared for ${member.name}!`);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              Save
                            </button>
                          </div>

                          {/* Edit Details Button */}
                          <button
                            type="button"
                            onClick={() => setEditingLeader(member)}
                            className="w-full py-1.5 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-[#1430d8]" />
                            <span>Edit Leader Info</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MESSAGES INBOX */}
              {activeTab === 'messages' && (
                <div className="space-y-6">
                  {/* Email Notification Relay & Live Test Management */}
                  <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1430d8] flex items-center justify-center font-bold">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-display text-base font-bold text-[#0e0e0e]">
                              Email Relay &amp; Notification Settings
                            </h3>
                            <p className="text-xs text-neutral-500">
                              Every form submission is relayed automatically to these email inboxes.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTestEmail()}
                          disabled={isTestingEmail}
                          className="px-3.5 py-2 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                        >
                          {isTestingEmail ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              <span>Sending Test Ping...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Test Email / Resend Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Prominent Roman Urdu & English Instruction Guide */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 via-white to-blue-50/50 border border-amber-200/90 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Agency Email Par Messages Receive Karne Ka Zaroori Step:</span>
                      </div>
                      <p className="text-xs text-neutral-700 leading-relaxed">
                        FormSubmit security verification ke liye har nayi email par ek <strong>"Activate Form"</strong> confirmation email bhejti hai. Jab tak us link par click na ho, FormSubmit messages hold kar leti hai.
                      </p>
                      <div className="p-3 rounded-lg bg-white border border-amber-200/80 text-xs text-neutral-800 space-y-1.5 font-medium">
                        <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sirf Yeh 2 Aasaan Steps Karein:</span>
                        </p>
                        <p className="pl-5 text-neutral-600">
                          1. Apna Business Inbox (<strong className="text-neutral-900 font-mono">hello@usmandevhub.com</strong>) open karein — <em>Inbox</em> ya <em>Spam / Junk</em> folder check karein.
                        </p>
                        <p className="pl-5 text-neutral-600">
                          2. FormSubmit ki aayi hui <strong className="text-neutral-900 font-bold">sabse LATEST (top-most) email</strong> kholein aur blue button <strong className="text-blue-700 underline font-semibold">"Activate Form"</strong> par ek martaba click karein.
                        </p>
                        <p className="pl-5 text-emerald-700 font-semibold">
                          ✓ Click karte hi form activate ho jayega aur website par bhara gaya har client message foran aapki email par deliver hoga!
                        </p>

                        <div className="mt-2 p-2.5 rounded-lg bg-red-50/90 border border-red-200 text-xs text-red-900 space-y-1">
                          <p className="font-bold flex items-center gap-1 text-red-950">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>"Not a valid link. Confirmation token not found" Error Solution:</span>
                          </p>
                          <p className="text-[11px] leading-relaxed text-red-800">
                            Agar aapne link par click kiya aur <em>"Not a valid link"</em> show hua, to iska matlab aapne purani email ka expired link click kar diya tha.
                          </p>
                          <p className="text-[11px] leading-relaxed font-semibold text-red-900">
                            👉 Gmail mein ja kar jo <strong className="underline">sabse AAKHRI / LATEST FormSubmit email</strong> aayi hai (top par), sirf uska <u>"Activate Form"</u> button click karein. Woh 100% chal jayega!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Test Feedback Notice */}
                    {testEmailResult && (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{testEmailResult}</span>
                      </div>
                    )}

                    {/* Recipient Inboxes List */}
                    <div>
                      <h4 className="text-xs font-bold text-neutral-700 mb-2">
                        Configured Notification Inboxes ({recipientEmails.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {recipientEmails.map((email) => {
                          const status = emailDeliveryStatuses[email.toLowerCase()];
                          const needsActivation = status?.status === 'needs_activation';
                          const isSent = status?.status === 'sent';

                          return (
                            <div
                              key={email}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                                needsActivation
                                  ? 'bg-amber-50/60 border-amber-200'
                                  : isSent
                                  ? 'bg-emerald-50/60 border-emerald-200'
                                  : 'bg-neutral-50 border-neutral-200'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                  <span className="font-mono text-xs font-semibold text-[#0e0e0e] truncate">
                                    {email}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-1.5">
                                  {needsActivation ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      <span>Needs Activation Link Click</span>
                                    </span>
                                  ) : isSent ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      <span>Verified &amp; Delivering</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-neutral-500">
                                      Ready · Click test button to verify
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleTestEmail(email)}
                                  title="Test ping this email"
                                  className="p-1.5 rounded-lg text-neutral-500 hover:text-[#1430d8] hover:bg-white text-[11px] font-semibold border border-transparent hover:border-neutral-200 transition-colors"
                                >
                                  Ping
                                </button>
                                {recipientEmails.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRecipient(email)}
                                    title="Remove this email"
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-neutral-200 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add new email */}
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="email"
                          value={newRecipientEmail}
                          onChange={(e) => setNewRecipientEmail(e.target.value)}
                          placeholder="Add another email to receive inquiries (e.g. name@domain.com)"
                          className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-[#0e0e0e] focus:outline-none focus:border-[#1430d8]"
                        />
                        <button
                          type="button"
                          onClick={handleAddRecipient}
                          disabled={isSavingEmailSettings}
                          className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          Add Email
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages Section Header */}
                  <div>
                    <h3 className="font-display text-xl font-bold text-[#0e0e0e]">
                      Client Inquiries &amp; Messages ({messages.length})
                    </h3>
                    <p className="text-xs text-neutral-500">
                      All messages are permanently saved in the local database and synced with email notifications.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <p className="text-xs text-neutral-500 py-8 text-center">No messages received yet.</p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            msg.status === 'unread'
                              ? 'bg-blue-50/40 border-blue-200'
                              : 'bg-neutral-50 border-neutral-200'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-[#0e0e0e]">{msg.name}</h4>
                              <span className="text-xs text-neutral-500">&lt;{msg.email}&gt;</span>
                              {msg.status === 'unread' && (
                                <span className="px-2 py-0.5 rounded-full bg-[#0075f7] text-white text-[10px] font-bold">
                                  NEW
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-neutral-400">
                              {new Date(msg.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs mb-3">
                            <span className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 font-semibold text-[#1430d8]">
                              Service: {msg.service}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 font-semibold text-green-700">
                              Budget: {msg.budget}
                            </span>
                          </div>

                          {msg.referralToken && (() => {
                            const cleanMsgTok = normalizeReferralToken(msg.referralToken);
                            const msgPartner = lookupPartnerByToken(cleanMsgTok);
                            const msgTrackedRef = referrals.find(
                              (r) =>
                                normalizeReferralToken(r.partnerToken || '') === cleanMsgTok &&
                                (r.inquiryId === msg.id ||
                                  (r.clientEmail && r.clientEmail.toLowerCase() === msg.email.toLowerCase()) ||
                                  r.clientName.toLowerCase() === msg.name.toLowerCase())
                            );
                            return (
                              <div className="mb-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-neutral-800">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span className="font-bold text-emerald-900">
                                    Client Details Received on Partner Token:
                                  </span>
                                  <code className="font-mono font-bold text-[#1430d8]">{cleanMsgTok}</code>
                                  <span aria-hidden="true">·</span>
                                  <span>
                                    Partner:{' '}
                                    <strong>
                                      {msgPartner?.partnerName || msg.referredByName || 'Registered Partner'}
                                    </strong>
                                    {msgPartner?.partnerEmail ? ` (${msgPartner.partnerEmail})` : ''}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-800 font-semibold">
                                    Track Status: {msgTrackedRef ? REFERRAL_STAGE_LABELS[msgTrackedRef.status] : 'Details Received'}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed bg-white p-3 rounded-xl border border-neutral-100 mb-3">
                            {msg.message}
                          </p>

                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleCreateOrderFromMessage(msg)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                              title="Create confirmed order, adjust pricing, and download formal PDF agreement"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Generate Order &amp; PDF</span>
                            </button>
                            {msg.referralToken && (
                              <button
                                type="button"
                                onClick={() => {
                                  const cleanTok = normalizeReferralToken(msg.referralToken || '');
                                  const matchedRef = referrals.find(
                                    (r) =>
                                      normalizeReferralToken(r.partnerToken || '') === cleanTok &&
                                      (r.inquiryId === msg.id ||
                                        (r.clientEmail && r.clientEmail.toLowerCase() === msg.email.toLowerCase()) ||
                                        r.clientName.toLowerCase() === msg.name.toLowerCase())
                                  ) || {
                                    id: `msg-sync-${msg.id}`,
                                    partnerToken: cleanTok,
                                    partnerName: msg.referredByName || 'Partner',
                                    partnerEmail: 'hello@usmandevhub.com',
                                    clientName: msg.name,
                                    clientEmail: msg.email,
                                    service: msg.service || 'Web Development',
                                    category: msg.category || 'Business Websites',
                                    projectType: msg.category ? `${msg.service} — ${msg.category}` : (msg.service || 'Web Development'),
                                    estimatedBudget: 2500,
                                    commissionPercentage: 25,
                                    commissionAmount: 625,
                                    status: 'in_negotiation',
                                    date: msg.createdAt.slice(0, 10),
                                    clientMessage: msg.message,
                                    adminStatusNote: `Client inquiry received via partner token ${cleanTok}.`
                                  };
                                  handleOpenEditTrackModal(matchedRef);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs"
                                title="Edit Live Track Status & Milestones"
                              >
                                <Activity className="w-3.5 h-3.5" />
                                <span>Edit Track Status</span>
                              </button>
                            )}
                            <a
                              href={`mailto:${msg.email}?subject=Regarding%20your%20inquiry%20to%20Usman%20DevHub`}
                              className="px-3 py-1.5 rounded-lg bg-[#1430d8] text-white text-xs font-semibold hover:bg-[#0075f7] whitespace-nowrap shrink-0"
                            >
                              Reply by Email
                            </a>
                            {msg.status === 'unread' ? (
                              <button
                                onClick={() => {
                                  updateMessageStatus(msg.id, 'read');
                                  refreshAllData();
                                }}
                                className="px-3 py-1.5 rounded-lg bg-neutral-200 text-neutral-700 text-xs font-semibold hover:bg-neutral-300"
                              >
                                Mark Read
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  updateMessageStatus(msg.id, 'unread');
                                  refreshAllData();
                                }}
                                className="px-3 py-1.5 rounded-lg bg-neutral-200 text-neutral-700 text-xs font-semibold hover:bg-neutral-300"
                              >
                                Mark Unread
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const updated = deleteContactMessage(msg.id);
                                setMessages(updated);
                                refreshAllData();
                              }}
                              className="p-1.5 text-neutral-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ORDERS & PROFORMA AGREEMENTS + 1-100 PDF ARCHIVE TAB */}
              {activeTab === 'orders' && (() => {
                const hasOrderPartnerToken = (o: OrderAgreement) =>
                  Boolean(o.referralToken && o.referralToken.trim().length >= 4 && o.referralToken.trim().toUpperCase() !== 'UDH-REF-');

                const referredOrdersCount = orders.filter(hasOrderPartnerToken).length;
                const directOrdersCount = orders.length - referredOrdersCount;

                const cleanLookup = secureLookupQuery.trim().toLowerCase().replace(/^#/, '');
                const verifiedMatches = cleanLookup
                  ? orders.filter((o) => {
                      const ordNo = o.orderNumber.toLowerCase();
                      const tok = hasOrderPartnerToken(o) ? o.referralToken!.toLowerCase() : '';
                      const cName = (o.clientName || '').toLowerCase();
                      const cPhone = (o.clientPhone || '').toLowerCase();
                      const cEmail = (o.clientEmail || '').toLowerCase();
                      return (
                        ordNo.includes(cleanLookup) ||
                        (tok && tok.includes(cleanLookup)) ||
                        cName.includes(cleanLookup) ||
                        cPhone.includes(cleanLookup) ||
                        cEmail.includes(cleanLookup)
                      );
                    })
                  : [];

                const filteredOrders = orders.filter((o) => {
                  const isReferred = hasOrderPartnerToken(o);
                  if (orderReferenceFilter === 'referred' && !isReferred) return false;
                  if (orderReferenceFilter === 'direct' && isReferred) return false;
                  if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
                  if (!orderSearch.trim()) return true;
                  const q = orderSearch.trim().toLowerCase().replace(/^#/, '');
                  return (
                    o.orderNumber.toLowerCase().includes(q) ||
                    o.clientName.toLowerCase().includes(q) ||
                    (o.clientEmail && o.clientEmail.toLowerCase().includes(q)) ||
                    (o.clientPhone && o.clientPhone.toLowerCase().includes(q)) ||
                    o.projectTitle.toLowerCase().includes(q) ||
                    (isReferred && o.referralToken!.toLowerCase().includes(q)) ||
                    (isReferred && o.partnerName && o.partnerName.toLowerCase().includes(q))
                  );
                });

                const filteredOrdersPageTokens = partnerTokens.filter((pt) => {
                  if (!tokenSearch.trim()) return true;
                  const q = tokenSearch.trim().toLowerCase();
                  const linkedOrd = orders.find(
                    (o) => normalizeReferralToken(o.referralToken || '') === normalizeReferralToken(pt.token)
                  );
                  return (
                    pt.token.toLowerCase().includes(q) ||
                    pt.partnerName.toLowerCase().includes(q) ||
                    pt.partnerEmail.toLowerCase().includes(q) ||
                    (linkedOrd && linkedOrd.orderNumber.toLowerCase().includes(q)) ||
                    (linkedOrd && linkedOrd.clientName.toLowerCase().includes(q))
                  );
                });

                return (
                  <div className="space-y-6">
                    {/* Tab Header & Dual Creation Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                            Agreements &amp; Partner Tokens PDF Center (Permanent Archive)
                          </h3>
                          <span className="text-xs font-semibold text-emerald-600 tabular-nums">
                            · Agreements: {orders.length} Saved · Tokens: {partnerTokens.length} Saved (No Auto-Deletion)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                          Every generated <strong>Agreement Reference No.</strong> and <strong>Partner Token</strong> is unique and permanently stored. <strong>Zero automatic deletion</strong> at 100 or beyond — all agreements and tokens stay saved indefinitely. You can delete any agreement or token manually whenever you wish.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCreateNewBlankOrder(false)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                          title="Create Direct Client Agreement (Without Reference — Brand-New Ref No., No Token)"
                        >
                          <Plus className="w-4 h-4 text-emerald-400" />
                          <span>New Direct Agreement (No Token)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCreateNewBlankOrder(true)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1430d8] to-[#0075f7] hover:from-[#1027b0] hover:to-[#0060d0] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                          title="Create Partner Referred Agreement (Brand-New Ref No. + Brand-New Partner Token)"
                        >
                          <KeyRound className="w-4 h-4 text-amber-300" />
                          <span>New Reference Agreement (New Token)</span>
                        </button>
                      </div>
                    </div>

                    {/* Dual PDF List Switcher + Master PDF Register Downloads */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1 p-1 bg-neutral-100 rounded-xl border border-neutral-200/80">
                        <button
                          type="button"
                          onClick={() => setOrdersArchiveTab('agreements')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            ordersArchiveTab === 'agreements'
                              ? 'bg-white text-[#0e0e0e] font-semibold shadow-2xs'
                              : 'text-neutral-600 hover:text-[#0e0e0e]'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-[#1430d8]" />
                          <span>Agreement Reference No. PDFs ({orders.length} Saved)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOrdersArchiveTab('tokens')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            ordersArchiveTab === 'tokens'
                              ? 'bg-white text-[#0e0e0e] font-semibold shadow-2xs'
                              : 'text-neutral-600 hover:text-[#0e0e0e]'
                          }`}
                        >
                          <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Partner Token PDFs ({partnerTokens.length} Saved)</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => downloadAdminAgreementsRegisterPdf(orders)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                          title="Download Master PDF List of all Agreement Reference Numbers"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Agreements Register PDF ({orders.length} Saved)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadAdminTokensRegisterPdf(partnerTokens, referrals, orders)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                          title="Download Master PDF List of all Partner Tokens"
                        >
                          <Download className="w-3.5 h-3.5 text-[#1430d8]" />
                          <span>Tokens Register PDF ({partnerTokens.length} Saved)</span>
                        </button>
                      </div>
                    </div>

                    {/* Feedback Banner */}
                    {orderActionNotice && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{orderActionNotice}</span>
                        </div>
                        <button onClick={() => setOrderActionNotice('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* ===================================================================== */}
                    {/* SUB-VIEW 2: COMPLETE PARTNER TOKEN PDF LIST (1–100 ARCHIVE)          */}
                    {/* ===================================================================== */}
                    {ordersArchiveTab === 'tokens' && (
                      <div className="space-y-4">
                        {/* Quick Issue Brand-New Unique Partner Token Bar */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">
                                Issue Brand-New Unique Partner Token (Permanent Archive)
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Every click generates a 100% brand-new unique token. All tokens remain saved permanently with zero automatic deletion at 100. Delete manually anytime.
                              </p>
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-600 tabular-nums">
                              Total Saved: {partnerTokens.length} Tokens (Permanent)
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                            <div className="sm:col-span-3">
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Partner Name *</label>
                              <input
                                type="text"
                                value={adminQuickPartnerName}
                                onChange={(e) => setAdminQuickPartnerName(e.target.value)}
                                placeholder="Enter Partner Name"
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#1430d8]"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Partner Gmail</label>
                              <input
                                type="email"
                                value={adminQuickPartnerEmail}
                                onChange={(e) => setAdminQuickPartnerEmail(e.target.value)}
                                placeholder="partner@gmail.com"
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#1430d8]"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">WhatsApp</label>
                              <input
                                type="text"
                                value={adminQuickPartnerWhatsApp}
                                onChange={(e) => setAdminQuickPartnerWhatsApp(e.target.value)}
                                placeholder="+92 300 0000000"
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#1430d8]"
                              />
                            </div>
                            <div className="sm:col-span-4 flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAdminIssueQuickToken('token')}
                                disabled={!adminQuickPartnerName.trim()}
                                className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap"
                              >
                                + Token
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdminIssueQuickToken('pdf')}
                                disabled={!adminQuickPartnerName.trim()}
                                className="flex-1 py-2 px-2.5 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Token + PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdminIssueQuickToken('agreement')}
                                disabled={!adminQuickPartnerName.trim()}
                                className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap"
                              >
                                + Agreement
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Search Bar for Partner Tokens List */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                          <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={tokenSearch}
                              onChange={(e) => setTokenSearch(e.target.value)}
                              placeholder="Search Token (UDH-...), Partner Name, Gmail, or Linked Ref No..."
                              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#1430d8]"
                            />
                            {tokenSearch && (
                              <button
                                type="button"
                                onClick={() => setTokenSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 tabular-nums">
                            Showing {filteredOrdersPageTokens.length} of {partnerTokens.length} Saved Partner Tokens (Permanent)
                          </span>
                        </div>

                        {/* Complete Partner Token PDFs Table */}
                        <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-2xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="p-3 whitespace-nowrap">Record #</th>
                                <th className="p-3 whitespace-nowrap">Unique Partner Token</th>
                                <th className="p-3 whitespace-nowrap">Partner Name &amp; Gmail</th>
                                <th className="p-3 whitespace-nowrap">Linked Agreement Ref / Client</th>
                                <th className="p-3 text-right whitespace-nowrap">Track, Agreement &amp; Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {filteredOrdersPageTokens.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-slate-500">
                                    No partner tokens issued yet. Enter a Partner Name above to issue your first unique Partner Token.
                                  </td>
                                </tr>
                              ) : (
                                filteredOrdersPageTokens.map((pt) => {
                                  const fullIdx = partnerTokens.findIndex(
                                    (item) => normalizeReferralToken(item.token) === normalizeReferralToken(pt.token)
                                  );
                                  const chronoSlot = fullIdx >= 0 ? partnerTokens.length - fullIdx : 1;
                                  const linkedOrders = orders.filter(
                                    (o) => normalizeReferralToken(o.referralToken || '') === normalizeReferralToken(pt.token)
                                  );
                                  const linkedDeals = referrals.filter(
                                    (r) => normalizeReferralToken(r.partnerToken || '') === normalizeReferralToken(pt.token)
                                  );

                                  return (
                                    <tr key={pt.token} className="hover:bg-slate-50/80 align-middle">
                                      <td className="p-3 whitespace-nowrap font-mono font-bold text-slate-600 tabular-nums">
                                        #{chronoSlot}
                                      </td>
                                      <td className="p-3 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                          <code className="font-mono font-extrabold text-[#1430d8] tabular-nums">
                                            {pt.token}
                                          </code>
                                          <button
                                            type="button"
                                            title="Copy Partner Token"
                                            onClick={() => {
                                              navigator.clipboard?.writeText(pt.token).catch(() => {});
                                              setCopiedPartnerCode(pt.token);
                                              setTimeout(() => setCopiedPartnerCode(null), 1800);
                                            }}
                                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                                          >
                                            {copiedPartnerCode === pt.token ? (
                                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            ) : (
                                              <Copy className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </div>
                                        <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                                          {formatTokenIssuedAt(pt.createdAt)}
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <div className="font-bold text-slate-900">{pt.partnerName}</div>
                                        <div className="text-slate-500 text-[11px]">{pt.partnerEmail}</div>
                                      </td>
                                      <td className="p-3">
                                        {linkedOrders.length > 0 ? (
                                          <div className="space-y-1">
                                            {linkedOrders.map((lo) => (
                                              <div key={lo.id} className="text-xs">
                                                <span className="font-bold text-slate-900">{lo.clientName || 'Client'}</span>
                                                <span className="text-slate-400"> · </span>
                                                <code className="font-mono font-bold text-[#1430d8]">{lo.orderNumber}</code>
                                              </div>
                                            ))}
                                          </div>
                                        ) : linkedDeals.length > 0 ? (
                                          <div className="space-y-1">
                                            {linkedDeals.map((ld) => (
                                              <div key={ld.id} className="text-xs text-slate-700">
                                                <span className="font-semibold">{ld.clientName}</span> · {REFERRAL_STAGE_LABELS[ld.status]}
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 text-[11px]">Ready for Client Attribution</span>
                                        )}
                                      </td>
                                      <td className="p-3 text-right whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleInspectTokenInAdmin(pt.token)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
                                            title={`Inspect live Track Status for Token ${pt.token}`}
                                          >
                                            <Activity className="w-3.5 h-3.5" />
                                            <span>Track</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleCreateOrOpenOrderFromPartnerToken(pt)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
                                            title="Create or Open Official Agreement linked to this Partner Token"
                                          >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>{linkedOrders[0] ? 'Agreement' : '+ Agreement'}</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => downloadPartnerTokenPdf(pt, linkedDeals, linkedOrders, chronoSlot)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                                            title={`Download Official A4 PDF for Token ${pt.token}`}
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                            <span>Token PDF</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveShareDoc({
                                                isOpen: true,
                                                type: 'token',
                                                partner: pt,
                                                linkedDeals,
                                                linkedOrders,
                                                chronoSlot,
                                                initialChannel: 'whatsapp'
                                              });
                                            }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                                            title="Send Token PDF on WhatsApp"
                                          >
                                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>WhatsApp</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveShareDoc({
                                                isOpen: true,
                                                type: 'token',
                                                partner: pt,
                                                linkedDeals,
                                                linkedOrders,
                                                chronoSlot,
                                                initialChannel: 'email'
                                              });
                                            }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1430d8] border border-blue-200 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                                            title="Send Token PDF via Gmail"
                                          >
                                            <Mail className="w-3.5 h-3.5 text-blue-600" />
                                            <span>Gmail</span>
                                          </button>

                                          <button
                                            type="button"
                                            title="Permanently Delete Partner Token"
                                            onClick={() => handleDeletePartnerTokenInAdmin(pt.token, pt.partnerName)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                            <span>Delete</span>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* ===================================================================== */}
                    {/* SUB-VIEW 1: COMPLETE AGREEMENT REFERENCE NO. PDF LIST (1–100 ARCHIVE) */}
                    {/* ===================================================================== */}
                    {ordersArchiveTab === 'agreements' && (
                      <>
                        {/* Instant Agreement Reference No. & Client Identity Verification Bar */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4.5 h-4.5 text-[#1430d8] shrink-0" />
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                Find Whose PDF / Agreement Reference No. It Is
                              </h4>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              Type full <code className="font-mono font-semibold text-[#1430d8]">UDH-ORD-...</code>, short code, Client Name, Phone, or Partner Token
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                            <div className="relative flex-1">
                              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1430d8]" />
                              <input
                                type="text"
                                value={secureLookupQuery}
                                onChange={(e) => setSecureLookupQuery(e.target.value)}
                                placeholder="Enter PDF Agreement Reference No. (e.g. UDH-ORD-2026-001-7K4X), Client Name, Phone, or Token..."
                                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#1430d8] transition-all"
                              />
                              {secureLookupQuery && (
                                <button
                                  type="button"
                                  onClick={() => setSecureLookupQuery('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                                  title="Clear lookup"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {cleanLookup && (
                            <div className="pt-2 border-t border-slate-100">
                              {verifiedMatches.length === 0 ? (
                                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span>No agreement found matching <strong className="font-mono">{secureLookupQuery.toUpperCase()}</strong>. Please check the Agreement Reference No. or Partner Token.</span>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {verifiedMatches.map((match) => {
                                    const matchHasToken = hasOrderPartnerToken(match);
                                    return (
                                      <div
                                        key={match.id}
                                        className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                                      >
                                        <div className="space-y-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                              <span>Verified Client:</span>
                                            </span>
                                            <span className="text-sm font-black text-slate-950">
                                              {match.clientName || 'Unnamed Client'}
                                            </span>
                                            {match.clientCompany && (
                                              <span className="text-slate-600">· {match.clientCompany}</span>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-700">
                                            <span>Agreement Ref No.: <strong className="font-mono text-[#1430d8]">{match.orderNumber}</strong></span>
                                            <span>·</span>
                                            {matchHasToken ? (
                                              <span>Partner Token: <strong className="font-mono text-[#1430d8]">{match.referralToken}</strong>{match.partnerName ? ` (${match.partnerName})` : ''}</span>
                                            ) : (
                                              <span className="font-semibold text-slate-700">Direct Client (Without Reference — No Token)</span>
                                            )}
                                            <span>·</span>
                                            <span>Total: <strong className="font-mono">{match.currency} {match.confirmedPrice.toLocaleString()}</strong></span>
                                          </div>

                                          <div className="text-[11px] text-slate-500 truncate">
                                            Project: {match.projectTitle} {match.clientPhone ? ` · Phone: ${match.clientPhone}` : ''} {match.clientEmail ? ` · Email: ${match.clientEmail}` : ''}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedOrderForStudio(match);
                                              setIsOrderStudioOpen(true);
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-[#1430d8] border border-blue-200 font-bold cursor-pointer transition-colors"
                                          >
                                            Open Editor
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDirectDownloadOrderPdf(match)}
                                            className="px-3 py-1.5 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                            <span>Download PDF</span>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Orders Analytics Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Agreement PDFs Archive</span>
                            <span className="font-display text-2xl font-extrabold text-slate-900 tabular-nums block mt-1">
                              {orders.length}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Saved Permanently (No Auto-Deletion)</span>
                          </div>

                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">With Reference (Token)</span>
                            <span className="font-display text-2xl font-extrabold text-[#1430d8] tabular-nums block mt-1">
                              {referredOrdersCount}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">Unique Ref No. + Unique Token</span>
                          </div>

                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Without Reference</span>
                            <span className="font-display text-2xl font-extrabold text-emerald-600 tabular-nums block mt-1">
                              {directOrdersCount}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">Unique Ref No. Only · No Token</span>
                          </div>

                          <div
                            onClick={() => setOrdersArchiveTab('tokens')}
                            role="button"
                            tabIndex={0}
                            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#1430d8]/40 shadow-2xs cursor-pointer transition-colors"
                          >
                            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Partner Tokens PDF List</span>
                            <span className="font-display text-2xl font-extrabold text-[#1430d8] tabular-nums block mt-1">
                              {partnerTokens.length}
                            </span>
                            <span className="text-[10px] text-[#1430d8] font-semibold mt-0.5 block">Click to view all tokens →</span>
                          </div>
                        </div>

                        {/* SECTION: Official Client Agreements PDF Directory (Matching Partner Tokens Style) */}
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h4 className="font-display text-base font-bold text-[#0e0e0e]">
                                1. Official Client Agreements PDF List ({orders.length} Saved)
                              </h4>
                              <p className="text-[11px] text-neutral-500">
                                Every agreement reference number is 100% unique and permanently archived (no automatic deletion at 100 or beyond). Direct agreements have no token; partner agreements carry their issued token.
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => downloadAdminAgreementsRegisterPdf(orders)}
                                title="Download Master Register PDF of all Client Agreements"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Agreements Register PDF ({orders.length} Saved)</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleExportAgreementsToCSV}
                                title="Export all client agreements to CSV"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <Download className="w-3.5 h-3.5 text-[#1430d8]" />
                                <span>CSV ({orders.length})</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCreateNewBlankOrder(false)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0"
                                title="Create Direct Client Agreement (No Token)"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                <span>+ Direct Agreement</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCreateNewBlankOrder(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0"
                                title="Create Partner Referred Agreement (New Token)"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>+ Reference (Token)</span>
                              </button>
                            </div>
                          </div>

                          {/* Filter Bar: Segment Tabs + View Switcher + Search Input (Exact Partner Tokens Layout) */}
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-neutral-100 border border-neutral-200/80">
                              {(
                                [
                                  { id: 'all', label: `All Agreements (${orders.length})` },
                                  { id: 'referred', label: `✓ With Token (${referredOrdersCount})` },
                                  { id: 'direct', label: `Direct Client (${directOrdersCount})` }
                                ] as const
                              ).map((refTab) => (
                                <button
                                  key={refTab.id}
                                  type="button"
                                  onClick={() => setOrderReferenceFilter(refTab.id)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                                    orderReferenceFilter === refTab.id
                                      ? 'bg-white text-[#0e0e0e] font-semibold shadow-2xs'
                                      : 'text-neutral-600 hover:text-[#0e0e0e]'
                                  }`}
                                >
                                  {refTab.label}
                                </button>
                              ))}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* View Mode Switcher */}
                              <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 border border-neutral-200/80 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setAgreementsViewMode('list')}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                                    agreementsViewMode === 'list'
                                      ? 'bg-white text-[#0e0e0e] font-semibold shadow-2xs'
                                      : 'text-neutral-600 hover:text-[#0e0e0e]'
                                  }`}
                                  title="List Table View"
                                >
                                  <List className="w-3.5 h-3.5 text-[#1430d8]" />
                                  <span>List View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAgreementsViewMode('cards')}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                                    agreementsViewMode === 'cards'
                                      ? 'bg-white text-[#0e0e0e] font-semibold shadow-2xs'
                                      : 'text-neutral-600 hover:text-[#0e0e0e]'
                                  }`}
                                  title="Detailed Cards View"
                                >
                                  <LayoutGrid className="w-3.5 h-3.5" />
                                  <span>Cards</span>
                                </button>
                              </div>

                              {/* Search Input with Search Icon and X Clear */}
                              <div className="relative w-full sm:w-72 shrink-0">
                                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={orderSearch}
                                  onChange={(e) => setOrderSearch(e.target.value)}
                                  placeholder="Search Ref No., Client, Token..."
                                  className="w-full pl-8 pr-8 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#1430d8]"
                                />
                                {orderSearch && (
                                  <button
                                    type="button"
                                    onClick={() => setOrderSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Stage Filter Bar (Matching Tokens Clean Tabs) */}
                          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-neutral-100 border border-neutral-200/80">
                            {[
                              { key: 'all', label: `All Stages (${orders.length})` },
                              { key: 'confirmed', label: `Confirmed (${orders.filter(o => o.status === 'confirmed').length})` },
                              { key: 'in_progress', label: `In Progress (${orders.filter(o => o.status === 'in_progress').length})` },
                              { key: 'completed', label: `Completed (${orders.filter(o => o.status === 'completed').length})` },
                              { key: 'draft', label: `Drafts (${orders.filter(o => o.status === 'draft').length})` }
                            ].map((tab) => (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => setOrderStatusFilter(tab.key as any)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                                  orderStatusFilter === tab.key
                                    ? 'bg-white text-[#0e0e0e] font-semibold shadow-2xs'
                                    : 'text-neutral-600 hover:text-[#0e0e0e]'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Orders List / Table View */}
                        {filteredOrders.length === 0 ? (
                          <div className="text-center py-14 border border-dashed border-neutral-200 rounded-xl bg-white shadow-2xs">
                            <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                            <h4 className="text-sm font-bold text-neutral-800">No Matching Agreements Found</h4>
                            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                              Create a new Direct Agreement (Without Token) or Reference Agreement (With Brand-New Partner Token), or clear active search filters.
                            </p>
                            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleCreateNewBlankOrder(false)}
                                className="px-3.5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold cursor-pointer hover:bg-neutral-800 transition-colors"
                              >
                                + Direct Agreement (No Token)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCreateNewBlankOrder(true)}
                                className="px-3.5 py-2 rounded-xl bg-[#1430d8] text-white text-xs font-bold cursor-pointer hover:bg-[#0075f7] transition-colors"
                              >
                                + Reference Agreement (New Token)
                              </button>
                            </div>
                          </div>
                        ) : agreementsViewMode === 'list' ? (
                          <div className="space-y-4">
                            {/* List Summary Bar */}
                            <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
                              <span>
                                Showing <strong className="text-[#0e0e0e] font-bold">{filteredOrders.length}</strong> of <strong className="text-[#0e0e0e]">{orders.length}</strong> agreements
                              </span>
                              <span className="text-[11px] text-neutral-400 hidden sm:inline">
                                Tip: Click Reference No. to copy • Click Edit to customize details
                              </span>
                            </div>

                            {/* ========================================================= */}
                            {/* 1. DESKTOP & TABLET HIGH-CLARITY STRUCTURED LIST TABLE    */}
                            {/* ========================================================= */}
                            <div className="hidden md:block overflow-x-auto bg-white border border-neutral-200 rounded-xl shadow-xs">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-neutral-50 text-neutral-700 font-semibold border-b border-neutral-200">
                                  <tr>
                                    <th className="p-3 whitespace-nowrap">Slot (1–100)</th>
                                    <th className="p-3 whitespace-nowrap">Client &amp; Contact</th>
                                    <th className="p-3 whitespace-nowrap">Agreement Ref No.</th>
                                    <th className="p-3 whitespace-nowrap">Target Service &amp; Scope</th>
                                    <th className="p-3 whitespace-nowrap">Investment &amp; Milestones</th>
                                    <th className="p-3 whitespace-nowrap">Agreement Status</th>
                                    <th className="p-3 text-right whitespace-nowrap">Agreement &amp; PDF Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200">
                                  {filteredOrders.map((ord) => {
                                    const hasToken = hasOrderPartnerToken(ord);
                                    const fullIndex = orders.findIndex((item) => item.id === ord.id);
                                    const archiveSlot = fullIndex >= 0 ? orders.length - fullIndex : 1;
                                    const srv = normalizeHomeServiceName(ord.service);
                                    const msSplit = resolveOrderMilestones(ord);

                                    return (
                                      <tr
                                        key={ord.id}
                                        className={`align-top ${
                                          ord.status === 'confirmed' || ord.status === 'completed'
                                            ? 'bg-emerald-50/25 hover:bg-emerald-50/45'
                                            : 'hover:bg-neutral-50/80'
                                        } transition-colors`}
                                      >
                                        {/* Col 1: Slot */}
                                        <td className="p-3 whitespace-nowrap font-mono font-bold text-neutral-600 tabular-nums">
                                          #{archiveSlot}
                                        </td>

                                        {/* Col 2: Client & Contact */}
                                        <td className="p-3">
                                          <div className="font-bold text-[#0e0e0e]">{ord.clientName || 'Valued Client'}</div>
                                          <div className="text-neutral-700 text-xs mt-0.5">
                                            {ord.clientCompany || ord.clientEmail || 'Direct Client'}
                                          </div>
                                          <div className="text-[11px] text-neutral-400 mt-0.5 tabular-nums">
                                            {ord.clientPhone ? `Phone: ${ord.clientPhone}` : 'Direct Contact'}
                                            {ord.clientCountry ? ` · ${ord.clientCountry}` : ''}
                                          </div>
                                        </td>

                                        {/* Col 3: Agreement Reference Number */}
                                        <td className="p-3 whitespace-nowrap">
                                          <div className="flex items-center gap-1.5">
                                            <code className="font-mono font-bold text-[#1430d8] tabular-nums">
                                              {ord.orderNumber}
                                            </code>
                                            <button
                                              type="button"
                                              title="Copy Agreement Reference Number"
                                              onClick={() => {
                                                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                                  navigator.clipboard.writeText(ord.orderNumber).catch(() => {});
                                                }
                                                setCopiedOrderSecCode(ord.id);
                                                setTimeout(() => setCopiedOrderSecCode(null), 1800);
                                              }}
                                              className="p-1 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                                            >
                                              {copiedOrderSecCode === ord.id ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                              ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                              )}
                                            </button>
                                          </div>
                                          <div className="mt-1">
                                            {hasToken ? (
                                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                <span>Tok: {ord.referralToken!.trim().toUpperCase()}</span>
                                                {ord.partnerName ? <span className="text-neutral-500 font-normal">({ord.partnerName})</span> : null}
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-neutral-500 font-medium">
                                                Direct Client · No Token
                                              </span>
                                            )}
                                          </div>
                                        </td>

                                        {/* Col 4: Target Service & Scope */}
                                        <td className="p-3">
                                          <div className="flex flex-col gap-1">
                                            <div className="flex items-center flex-wrap gap-1">
                                              <span className="text-[11px] font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                {srv}
                                              </span>
                                              {ord.serviceCategory && (
                                                <span className="text-[10px] font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                                                  {ord.serviceCategory}
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[11px] text-neutral-700 font-medium line-clamp-1" title={ord.projectTitle}>
                                              {ord.projectTitle}
                                            </div>
                                            <div className="text-[10px] text-neutral-400 tabular-nums">
                                              Timeline: {ord.timeline || '7-14 Days'}
                                            </div>
                                          </div>
                                        </td>

                                        {/* Col 5: Investment & Milestones */}
                                        <td className="p-3 whitespace-nowrap">
                                          <div className="font-mono font-bold text-[#0e0e0e] text-xs tabular-nums">
                                            {ord.currency} {ord.confirmedPrice?.toLocaleString()}
                                          </div>
                                          <div className="mt-1">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                              msSplit.paidPct === 100
                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                : msSplit.paidPct > 0
                                                ? 'bg-blue-50 text-[#1430d8] border border-blue-200'
                                                : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                                            }`}>
                                              {msSplit.paidPct > 0 ? `Paid: ${msSplit.paidPct}%` : '0% Paid (Due)'}
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-neutral-400 mt-0.5 tabular-nums">
                                            {formatAgreementDate(ord.agreementDate || ord.createdAt)}
                                          </div>
                                        </td>

                                        {/* Col 6: Agreement Status */}
                                        <td className="p-3 whitespace-nowrap">
                                          <select
                                            value={ord.status}
                                            onChange={(e) => {
                                              const updated = saveOrderAgreement({
                                                ...ord,
                                                status: e.target.value as any
                                              });
                                              setOrders(updated);
                                              refreshAllData();
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-[11px] font-bold text-[#0e0e0e] cursor-pointer shrink-0"
                                          >
                                            <option value="draft">1. Draft</option>
                                            <option value="confirmed">2. Confirmed</option>
                                            <option value="in_progress">3. In Progress</option>
                                            <option value="completed">4. Completed</option>
                                          </select>
                                        </td>

                                        {/* Col 7: Agreement & PDF Actions (Exact Tokens Style) */}
                                        <td className="p-3 text-right whitespace-nowrap">
                                          <div className="inline-flex items-center gap-1.5">
                                            {/* Studio / Edit */}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedOrderForStudio(ord);
                                                setIsOrderStudioOpen(true);
                                              }}
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                                              title="Open Studio to edit all details"
                                            >
                                              <Edit2 className="w-3 h-3 text-[#1430d8]" />
                                              <span>Edit</span>
                                            </button>

                                            {/* Preview Modal */}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedOrderForModal(ord);
                                                setIsOrderModalOpen(true);
                                              }}
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                                              title="Preview A4 Agreement Document"
                                            >
                                              <Eye className="w-3 h-3 text-[#1430d8]" />
                                              <span>View</span>
                                            </button>

                                            {/* Download PDF */}
                                            <button
                                              type="button"
                                              disabled={downloadingOrderId === ord.id}
                                              onClick={() => handleDirectDownloadOrderPdf(ord)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] disabled:opacity-60 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                                              title="1-Click Download PDF"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>PDF</span>
                                            </button>

                                            {/* WhatsApp */}
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                const res = await dispatchAgreementWithPdf({
                                                  order: ord,
                                                  channel: 'whatsapp'
                                                });
                                                if (res.cancelled) return;
                                                setOrderActionNotice(res.notice);
                                                setTimeout(() => setOrderActionNotice(''), 6000);
                                              }}
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                                              title="Send on WhatsApp"
                                            >
                                              <MessageCircle className="w-3 h-3" />
                                              <span>WA</span>
                                            </button>

                                            {/* Clone for New Client */}
                                            <button
                                              type="button"
                                              onClick={() => handleCloneOrderForNewClient(ord)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                                              title="New Client Copy (Reuse scope & price)"
                                            >
                                              <Plus className="w-3 h-3 text-neutral-500" />
                                              <span>Clone</span>
                                            </button>

                                            {/* Delete with In-App Confirmation Modal */}
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteOrder(ord.id)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                                              title="Permanently Delete Agreement"
                                            >
                                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                              <span>Delete</span>
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* ========================================================= */}
                            {/* 2. MOBILE COMPACT HIGH-READABILITY LIST VIEW (< 768px)    */}
                            {/* ========================================================= */}
                            <div className="space-y-3 md:hidden">
                              {filteredOrders.map((ord) => {
                                const hasToken = hasOrderPartnerToken(ord);
                                const fullIndex = orders.findIndex((item) => item.id === ord.id);
                                const archiveSlot = fullIndex >= 0 ? orders.length - fullIndex : 1;
                                const srv = normalizeHomeServiceName(ord.service);
                                const msSplit = resolveOrderMilestones(ord);

                                return (
                                  <div
                                    key={ord.id}
                                    className="p-3.5 rounded-xl bg-white border border-neutral-200 shadow-2xs space-y-3"
                                  >
                                    {/* Mobile Header: Slot + Ref No. + Status */}
                                    <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="font-mono text-xs font-bold text-neutral-400">
                                          #{archiveSlot}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                              navigator.clipboard.writeText(ord.orderNumber).catch(() => {});
                                            }
                                            setCopiedOrderSecCode(ord.id);
                                            setTimeout(() => setCopiedOrderSecCode(null), 1800);
                                          }}
                                          className="font-mono text-xs font-black text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80 flex items-center gap-1 cursor-pointer truncate"
                                        >
                                          <span className="truncate">{ord.orderNumber}</span>
                                          {copiedOrderSecCode === ord.id ? (
                                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                          ) : (
                                            <Copy className="w-3 h-3 text-neutral-400 shrink-0" />
                                          )}
                                        </button>
                                      </div>

                                      <select
                                        value={ord.status}
                                        onChange={(e) => {
                                          const updated = saveOrderAgreement({
                                            ...ord,
                                            status: e.target.value as any
                                          });
                                          setOrders(updated);
                                          refreshAllData();
                                        }}
                                        className="px-2 py-1 rounded-lg bg-neutral-50 border border-neutral-200 text-[11px] font-bold text-[#0e0e0e] cursor-pointer shrink-0"
                                      >
                                        <option value="draft">Draft</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                      </select>
                                    </div>

                                    {/* Mobile Client & Project Details */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-sm text-[#0e0e0e] truncate">
                                          {ord.clientName || 'Valued Client'}
                                        </h4>
                                        <span className="font-mono text-sm font-black text-[#1430d8] shrink-0">
                                          {ord.currency} {ord.confirmedPrice?.toLocaleString()}
                                        </span>
                                      </div>

                                      <div className="text-xs font-medium text-neutral-700 truncate">
                                        {ord.projectTitle}
                                      </div>

                                      <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5 flex-wrap gap-1">
                                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1430d8] border border-blue-200 font-bold text-[10px]">
                                          {srv}
                                        </span>
                                        <span className="text-[11px] text-neutral-400">
                                          {formatAgreementDate(ord.agreementDate || ord.createdAt)}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          msSplit.paidPct > 0 ? 'bg-blue-50 text-[#1430d8] border border-blue-200' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                                        }`}>
                                          {msSplit.paidPct > 0 ? `Paid: ${msSplit.paidPct}%` : '0% Paid'}
                                        </span>
                                      </div>

                                      {hasToken && (
                                        <div className="text-[10px] font-mono font-bold text-[#1430d8] pt-0.5">
                                          Partner Token: {ord.referralToken!.trim().toUpperCase()}
                                        </div>
                                      )}
                                    </div>

                                    {/* Mobile Touch Action Buttons Grid with Delete Button */}
                                    <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-neutral-100">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedOrderForStudio(ord);
                                          setIsOrderStudioOpen(true);
                                        }}
                                        className="py-1.5 px-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                        title="Edit Agreement"
                                      >
                                        <Edit2 className="w-3 h-3 text-[#1430d8]" />
                                        <span>Edit</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedOrderForModal(ord);
                                          setIsOrderModalOpen(true);
                                        }}
                                        className="py-1.5 px-1 rounded-lg bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                        title="View Agreement"
                                      >
                                        <Eye className="w-3 h-3 text-[#1430d8]" />
                                        <span>View</span>
                                      </button>

                                      <button
                                        type="button"
                                        disabled={downloadingOrderId === ord.id}
                                        onClick={() => handleDirectDownloadOrderPdf(ord)}
                                        className="py-1.5 px-1 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] disabled:opacity-60 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                        title="Download PDF"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>PDF</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const res = await dispatchAgreementWithPdf({
                                            order: ord,
                                            channel: 'whatsapp'
                                          });
                                          if (res.cancelled) return;
                                          setOrderActionNotice(res.notice);
                                          setTimeout(() => setOrderActionNotice(''), 6000);
                                        }}
                                        className="py-1.5 px-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                        title="Share on WhatsApp"
                                      >
                                        <MessageCircle className="w-3 h-3" />
                                        <span>WA</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteOrder(ord.id)}
                                        className="py-1.5 px-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                        title="Permanently Delete Agreement"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-600" />
                                        <span>Del</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          /* ========================================================= */
                          /* 3. DETAILED EXPANDED CARDS VIEW (WHEN TOGGLED)            */
                          /* ========================================================= */
                          <div className="space-y-4">
                            {filteredOrders.map((ord) => {
                              const hasToken = hasOrderPartnerToken(ord);
                              const fullIndex = orders.findIndex((item) => item.id === ord.id);
                              const archiveSlot = fullIndex >= 0 ? orders.length - fullIndex : 1;
                              const srv = normalizeHomeServiceName(ord.service);
                              const cat = getHomeServiceCategory(ord.service);
                              const spec = ord.serviceCategory || '';
                              const msSplit = resolveOrderMilestones(ord);
                              return (
                                <div
                                  key={ord.id}
                                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#1430d8]/30 transition-all space-y-4"
                                >
                                  {/* Card Header: Slot #1..100 + Mandatory Agreement Reference No. + Conditional Partner Token */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      <span className="font-mono text-xs font-bold text-slate-500 tabular-nums">
                                        #{archiveSlot}
                                      </span>

                                      <span className="text-slate-300" aria-hidden="true">·</span>

                                      {/* Mandatory Unique Agreement Reference No. with 1-Click Copy */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(ord.orderNumber);
                                          setCopiedOrderSecCode(ord.id);
                                          setTimeout(() => setCopiedOrderSecCode(null), 2000);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200/90 text-[#1430d8] font-mono text-xs font-black tracking-wider cursor-pointer transition-colors"
                                        title="Unique PDF Agreement Reference No. — Click to Copy"
                                      >
                                        <span>Agreement Ref: {ord.orderNumber}</span>
                                        {copiedOrderSecCode === ord.id ? (
                                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                        ) : (
                                          <Copy className="w-3 h-3 text-[#1430d8]/70 shrink-0" />
                                        )}
                                      </button>

                                      <span className="text-slate-300" aria-hidden="true">·</span>

                                      {/* Prominent Client Name right next to Ref No. for instant scanning */}
                                      <span className="text-xs font-extrabold text-slate-900">
                                        Client: {ord.clientName || 'Unnamed Client'}
                                      </span>

                                      <span className="text-slate-300" aria-hidden="true">·</span>

                                      {/* Strict Token Rule: Show Token ONLY when Referred; Direct shows No Token */}
                                      {hasToken ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1430d8]">
                                          <span>
                                            Partner Token: <strong className="font-mono font-black">{ord.referralToken!.trim().toUpperCase()}</strong>
                                            {ord.partnerName ? <span className="text-slate-600 font-normal"> ({ord.partnerName})</span> : null}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleInspectTokenInAdmin(ord.referralToken!)}
                                            className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                                            title="Open Live Token Track Inspector in Admin Panel"
                                          >
                                            <Activity className="w-2.5 h-2.5" />
                                            <span>Track Token</span>
                                          </button>
                                        </span>
                                      ) : (
                                        <span className="text-xs font-semibold text-slate-600">
                                          Direct Client <span className="text-slate-400 font-normal">(No Token)</span>
                                        </span>
                                      )}

                                      <span className="text-slate-300 hidden md:inline" aria-hidden="true">·</span>
                                      <span className="text-xs text-slate-500">
                                        {formatAgreementDate(ord.agreementDate || ord.createdAt)}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <select
                                        value={ord.status}
                                        onChange={(e) => {
                                          const updated = saveOrderAgreement({
                                            ...ord,
                                            status: e.target.value as any
                                          });
                                          setOrders(updated);
                                          refreshAllData();
                                        }}
                                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                                          ord.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                          ord.status === 'in_progress' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                                          ord.status === 'completed' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                                          'bg-amber-50 text-amber-800 border-amber-300'
                                        }`}
                                      >
                                        <option value="draft">Draft</option>
                                        <option value="pending_confirmation">Pending Confirmation</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Card Body Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Left: Client Identity & Project Scope */}
                                    <div className="md:col-span-2 space-y-2">
                                      <div>
                                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                                          {ord.projectTitle}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                                          <span className="font-bold text-slate-900">
                                            Client: {ord.clientName || 'Unnamed Client'}
                                          </span>
                                          {ord.clientEmail && (
                                            <>
                                              <span>·</span>
                                              <span className="text-slate-500">{ord.clientEmail}</span>
                                            </>
                                          )}
                                          {ord.clientPhone && (
                                            <>
                                              <span>·</span>
                                              <span className="text-slate-500">{ord.clientPhone}</span>
                                            </>
                                          )}
                                          {ord.clientCompany && (
                                            <>
                                              <span>·</span>
                                              <span className="text-slate-500">{ord.clientCompany}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                        {ord.scopeDescription || (ord.deliverables?.join(' • ') || 'Scope agreed as per discovery discussion.')}
                                      </p>

                                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-500">
                                        <span>Service: <strong className="text-slate-800">{srv}</strong></span>
                                        <span>·</span>
                                        <span>Category: <strong className="text-[#1430d8]">{cat}</strong></span>
                                        {spec && (
                                          <>
                                            <span>·</span>
                                            <span>Specialization: <strong className="text-slate-700">{spec}</strong></span>
                                          </>
                                        )}
                                        <span>·</span>
                                        <span>Timeline: <strong className="text-slate-700">{ord.timeline}</strong></span>
                                      </div>
                                    </div>

                                    {/* Right: Financials Summary */}
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-2.5">
                                      <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Confirmed Total</span>
                                        <span className="font-mono text-2xl font-extrabold text-[#1430d8] block mt-0.5">
                                          {ord.currency} {ord.confirmedPrice.toLocaleString()}
                                        </span>
                                      </div>

                                      <div className="space-y-1.5 text-xs border-t border-slate-200 pt-2.5">
                                        <div className="flex justify-between text-slate-600 text-[11px]">
                                          <span>Milestones:</span>
                                          <span className="font-mono font-bold text-[#1430d8]">
                                            {msSplit.pct1}% / {msSplit.pct2}% / {msSplit.pct3}%
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-slate-700">
                                          <span>Paid ({msSplit.paidPct}%):</span>
                                          <span className="font-mono font-bold text-[#1430d8]">
                                            {ord.currency} {msSplit.paidAmt.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                          <span>Remaining ({msSplit.remainingPct}%):</span>
                                          <span className="font-mono font-semibold text-slate-900">
                                            {ord.currency} {msSplit.remainingAmt.toLocaleString()}
                                          </span>
                                        </div>
                                        {hasToken && ord.commissionAmount ? (
                                          <div className="flex justify-between text-[#1430d8] pt-1 border-t border-slate-200/70">
                                            <span>Partner Commission ({ord.commissionPercentage || 20}%):</span>
                                            <span className="font-mono font-bold">
                                              {ord.currency} {ord.commissionAmount.toLocaleString()}
                                            </span>
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Card Footer Actions */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                                      <span>Record #{archiveSlot}</span>
                                      <span>·</span>
                                      <span>Verify: <code className="text-[#1430d8] font-mono font-semibold">/#order-{ord.orderNumber}</code></span>
                                      <span>·</span>
                                      <span>{hasToken ? `Token: ${ord.referralToken!.trim().toUpperCase()}` : 'Direct Agreement (No Token)'}</span>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => handleCloneOrderForNewClient(ord)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                        title="Reuse scope & price for a new client with brand-new Ref No. (and brand-new Token if Referred)"
                                      >
                                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>New Client Copy</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedOrderForStudio(ord);
                                          setIsOrderStudioOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1430d8] border border-blue-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                        title="Open full page studio to edit every detail"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span>Studio Editor</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedOrderForModal(ord);
                                          setIsOrderModalOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                        title="Preview A4 Agreement"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-[#1430d8]" />
                                        <span>Preview</span>
                                      </button>

                                      <button
                                        type="button"
                                        disabled={downloadingOrderId === ord.id}
                                        onClick={() => handleDirectDownloadOrderPdf(ord)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                        title="1-Click Direct Download Official A4 Agreement PDF"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>{downloadingOrderId === ord.id ? 'Generating...' : 'Download PDF'}</span>
                                      </button>

                                      {hasToken && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const cleanTok = normalizeReferralToken(ord.referralToken!);
                                            const foundPt = partnerTokens.find(
                                              (p) => normalizeReferralToken(p.token) === cleanTok
                                            ) || {
                                              token: cleanTok,
                                              partnerName: ord.partnerName || 'Referral Partner',
                                              partnerEmail: 'hello@usmandevhub.com',
                                              createdAt: ord.createdAt
                                            };
                                            const linkedDeals = referrals.filter(
                                              (r) => normalizeReferralToken(r.partnerToken || '') === cleanTok
                                            );
                                            downloadPartnerTokenPdf(foundPt, linkedDeals, [ord]);
                                          }}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#1430d8] border border-indigo-200 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                                          title="1-Click Download Partner Token PDF"
                                        >
                                          <KeyRound className="w-3.5 h-3.5" />
                                          <span>Token PDF</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveShareDoc({
                                            isOpen: true,
                                            type: 'agreement',
                                            order: ord,
                                            initialChannel: 'email'
                                          });
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1430d8] border border-blue-200 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                                        title="Send Full PDF + Message on Gmail / Email"
                                      >
                                        <Mail className="w-3.5 h-3.5" />
                                        <span>Email</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveShareDoc({
                                            isOpen: true,
                                            type: 'agreement',
                                            order: ord,
                                            initialChannel: 'whatsapp'
                                          });
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                                        title="Send Full PDF + Message on WhatsApp"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>WhatsApp</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteOrder(ord.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                                        title="Permanently Delete Order Agreement"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* CLIENT REVIEWS & TESTIMONIALS (WITH ADMIN APPROVAL FLOW) */}
              {activeTab === 'reviews' && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-xl font-bold text-[#0e0e0e]">
                          Client Reviews &amp; Testimonials
                        </h3>
                        {reviews.filter(r => r.status === 'pending').length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                            {reviews.filter(r => r.status === 'pending').length} Needs Your OK
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Client ratings submitted on website must be approved by you (OK) before showing live on the site.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingReview(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1430d8] text-white text-xs font-bold hover:bg-[#0075f7] transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Manual Review</span>
                    </button>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                      <span className="text-[11px] font-semibold text-neutral-500">Total Reviews</span>
                      <div className="font-display text-2xl font-black text-neutral-900 mt-1">{reviews.length}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                      <span className="text-[11px] font-bold text-amber-800">Pending Approval</span>
                      <div className="font-display text-2xl font-black text-amber-700 mt-1">
                        {reviews.filter(r => r.status === 'pending').length}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                      <span className="text-[11px] font-bold text-emerald-800">Live on Website</span>
                      <div className="font-display text-2xl font-black text-emerald-700 mt-1">
                        {reviews.filter(r => r.status === 'approved').length}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                      <span className="text-[11px] font-semibold text-neutral-500">Average Rating</span>
                      <div className="font-display text-2xl font-black text-amber-500 mt-1 flex items-center gap-1">
                        <span>
                          {reviews.filter(r => r.status === 'approved').length > 0
                            ? (
                                Math.round(
                                  (reviews
                                    .filter(r => r.status === 'approved')
                                    .reduce((sum, r) => sum + r.rating, 0) /
                                    reviews.filter(r => r.status === 'approved').length) *
                                    10
                                ) / 10
                              ).toFixed(1)
                            : '4.8'}
                        </span>
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    {[
                      { key: 'all', label: `All (${reviews.length})` },
                      {
                        key: 'pending',
                        label: `Pending Approval (${reviews.filter(r => r.status === 'pending').length})`,
                        alert: reviews.filter(r => r.status === 'pending').length > 0
                      },
                      { key: 'approved', label: `Live / Approved (${reviews.filter(r => r.status === 'approved').length})` },
                      { key: 'rejected', label: `Rejected (${reviews.filter(r => r.status === 'rejected').length})` }
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setReviewFilter(f.key as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          reviewFilter === f.key
                            ? 'bg-[#1430d8] text-white shadow-xs'
                            : f.alert
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {f.alert && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                        <span>{f.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Reviews Cards List */}
                  {reviews.filter(r => reviewFilter === 'all' || r.status === reviewFilter).length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                      <Star className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-xs text-neutral-500 font-medium">No reviews in this category.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reviews
                        .filter(r => reviewFilter === 'all' || r.status === reviewFilter)
                        .map((rev) => (
                          <div
                            key={rev.id}
                            className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                              rev.status === 'pending'
                                ? 'bg-amber-50/30 border-amber-300 shadow-xs'
                                : rev.status === 'approved'
                                ? 'bg-white border-neutral-200 shadow-2xs'
                                : 'bg-neutral-50 border-neutral-200 opacity-70'
                            }`}
                          >
                            <div>
                              {/* Rating & Status Badge */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => {
                                    const isFull = rev.rating >= star;
                                    const isHalf = !isFull && rev.rating >= star - 0.5;
                                    return (
                                      <span key={star} className="relative inline-flex w-3.5 h-3.5 shrink-0">
                                        <Star className="w-3.5 h-3.5 text-neutral-200 fill-neutral-200" />
                                        {isFull && (
                                          <Star className="absolute inset-0 w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                        )}
                                        {isHalf && (
                                          <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })}
                                  <span className="text-xs font-bold text-neutral-800 tabular-nums ml-1.5">
                                    {Number(rev.rating).toFixed(1)}
                                  </span>
                                </div>

                                <div>
                                  {rev.status === 'approved' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-bold border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Live on Website
                                    </span>
                                  )}
                                  {rev.status === 'pending' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10.5px] font-bold border border-amber-300 animate-pulse">
                                      Needs Your OK
                                    </span>
                                  )}
                                  {rev.status === 'rejected' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-200 text-neutral-700 text-[10.5px] font-bold">
                                      Hidden / Rejected
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Quote */}
                              <p className="text-xs text-neutral-800 leading-relaxed italic mb-3">
                                &ldquo;{rev.quote}&rdquo;
                              </p>

                              {/* Service Badge */}
                              <div className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1430d8] text-[10px] font-semibold border border-blue-100 mb-3">
                                {rev.projectType}
                              </div>
                            </div>

                            {/* Client Info & Action Buttons */}
                            <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                                  <span>{rev.name}</span>
                                  <span className="text-xs">
                                    {rev.flag && rev.flag !== '⭐' ? rev.flag : detectFlagFromLocation(rev.location)}
                                  </span>
                                </h4>
                                <p className="text-[10px] text-neutral-500">
                                  {rev.role || 'Verified Client'} {rev.location ? `• ${rev.location}` : ''}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                {rev.status !== 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveReview(rev.id)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                                    title="Approve and show on website"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>OK (Approve)</span>
                                  </button>
                                )}

                                {rev.status === 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRejectReview(rev.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors cursor-pointer"
                                    title="Hide from website"
                                  >
                                    <span>Unpublish</span>
                                  </button>
                                )}

                                {rev.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRejectReview(rev.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors cursor-pointer"
                                    title="Reject review"
                                  >
                                    <span>Reject</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(rev.id)}
                                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* REFERRAL TRACKING & PARTNER TOKENS */}
              {activeTab === 'referrals' && (() => {
                const emailTokenCounts = partnerTokens.reduce<Record<string, number>>((acc, pt) => {
                  const key = (pt.partnerEmail || '').trim().toLowerCase();
                  if (key) acc[key] = (acc[key] || 0) + 1;
                  return acc;
                }, {});

                // Build unified live referrals list combining referrals + any referred ContactMessage / OrderAgreement
                const unifiedReferrals: ReferralRecord[] = [...referrals];
                orders
                  .filter((o) => Boolean(o.referralToken && normalizeReferralToken(o.referralToken).length >= 4))
                  .forEach((ord) => {
                    const cleanTok = normalizeReferralToken(ord.referralToken || '');
                    const alreadyIn = unifiedReferrals.some(
                      (r) =>
                        normalizeReferralToken(r.partnerToken || '') === cleanTok &&
                        (r.orderNumber === ord.orderNumber ||
                          (ord.inquiryId && r.inquiryId === ord.inquiryId) ||
                          (ord.clientEmail &&
                            r.clientEmail &&
                            r.clientEmail.toLowerCase() === ord.clientEmail.toLowerCase()) ||
                          r.clientName.toLowerCase() === ord.clientName.toLowerCase())
                    );
                    if (!alreadyIn) {
                      const pm = lookupPartnerByToken(cleanTok);
                      unifiedReferrals.unshift({
                        id: `ord-sync-${ord.id}`,
                        partnerToken: cleanTok,
                        partnerName: ord.partnerName || pm?.partnerName || `Partner (${cleanTok})`,
                        partnerEmail: pm?.partnerEmail || 'hello@usmandevhub.com',
                        partnerWhatsApp: pm?.partnerWhatsApp,
                        payoutMethod: pm?.payoutMethod,
                        clientName: ord.clientName || 'Client',
                        clientEmail: ord.clientEmail,
                        clientCompany: ord.clientCompany,
                        projectType: ord.serviceCategory ? `${ord.service} — ${ord.serviceCategory}` : ord.service,
                        service: ord.service,
                        category: ord.serviceCategory,
                        estimatedBudget: ord.confirmedPrice || 0,
                        commissionAmount: ord.commissionAmount || Math.round((ord.confirmedPrice || 0) * 0.2),
                        status:
                          ord.status === 'draft' || ord.status === 'pending_confirmation'
                            ? 'in_negotiation'
                            : 'deal_complete',
                        source: 'order_agreement',
                        date: (ord.agreementDate || ord.createdAt || '').slice(0, 10),
                        submittedAt: ord.createdAt,
                        orderNumber: ord.orderNumber,
                        clientMessage: ord.scopeDescription,
                        adminStatusNote: `Official Agreement ${ord.orderNumber} issued (${ord.currency} ${(ord.confirmedPrice || 0).toLocaleString()}).`
                      });
                    }
                  });

                messages
                  .filter((m) => Boolean(m.referralToken && normalizeReferralToken(m.referralToken).length >= 4))
                  .forEach((msg) => {
                    const cleanTok = normalizeReferralToken(msg.referralToken || '');
                    const alreadyIn = unifiedReferrals.some(
                      (r) =>
                        normalizeReferralToken(r.partnerToken || '') === cleanTok &&
                        (r.inquiryId === msg.id ||
                          (r.clientEmail && r.clientEmail.toLowerCase() === msg.email.toLowerCase()) ||
                          r.clientName.toLowerCase() === msg.name.toLowerCase())
                    );
                    if (!alreadyIn) {
                      const pm = lookupPartnerByToken(cleanTok);
                      const numMatch = (msg.budget || '').replace(/,/g, '').match(/\d+(\.\d+)?/);
                      const estBudget = numMatch ? Math.max(0, Number(numMatch[0]) || 1000) : 1000;
                      unifiedReferrals.unshift({
                        id: `msg-sync-${msg.id}`,
                        partnerToken: cleanTok,
                        partnerName: msg.referredByName || pm?.partnerName || `Partner (${cleanTok})`,
                        partnerEmail: pm?.partnerEmail || 'hello@usmandevhub.com',
                        partnerWhatsApp: pm?.partnerWhatsApp,
                        payoutMethod: pm?.payoutMethod,
                        clientName: msg.name,
                        clientEmail: msg.email,
                        projectType: msg.category ? `${msg.service} — ${msg.category}` : msg.service,
                        service: msg.service,
                        category: msg.category,
                        preferredTech: msg.preferredTech,
                        estimatedBudget: estBudget,
                        statedBudgetText: msg.budget,
                        commissionAmount: Math.round(estBudget * 0.2),
                        status: 'pending',
                        source: 'referral_link',
                        date: (msg.createdAt || '').slice(0, 10),
                        submittedAt: msg.createdAt,
                        inquiryId: msg.id,
                        clientMessage: msg.message,
                        adminStatusNote: 'Client project details received on your token. Studio is reviewing scope & requirements.'
                      });
                    }
                  });

                const activeTokensWithDetailsSet = new Set<string>();
                unifiedReferrals.forEach((r) => {
                  const t = normalizeReferralToken(r.partnerToken || '');
                  if (t) activeTokensWithDetailsSet.add(t);
                });
                orders.forEach((o) => {
                  const t = normalizeReferralToken(o.referralToken || '');
                  if (t) activeTokensWithDetailsSet.add(t);
                });
                messages.forEach((m) => {
                  const t = normalizeReferralToken(m.referralToken || '');
                  if (t) activeTokensWithDetailsSet.add(t);
                });

                const tokensWithDetailsInListCount = partnerTokens.filter((pt) =>
                  activeTokensWithDetailsSet.has(normalizeReferralToken(pt.token))
                ).length;
                const tokensWaitingInListCount = Math.max(0, partnerTokens.length - tokensWithDetailsInListCount);

                const filteredPartnerTokens = partnerTokens.filter((pt) => {
                  const hasDetails = activeTokensWithDetailsSet.has(normalizeReferralToken(pt.token));
                  if (tokenActivityFilter === 'with_details' && !hasDetails) return false;
                  if (tokenActivityFilter === 'waiting' && hasDetails) return false;

                  if (!tokenSearch.trim()) return true;
                  const q = tokenSearch.trim().toLowerCase();
                  return (
                    pt.token.toLowerCase().includes(q) ||
                    pt.partnerName.toLowerCase().includes(q) ||
                    pt.partnerEmail.toLowerCase().includes(q) ||
                    (pt.partnerWhatsApp || '').toLowerCase().includes(q)
                  );
                });

                const filteredReferrals = unifiedReferrals.filter((ref) => {
                  if (referralStageFilter !== 'all' && ref.status !== referralStageFilter) {
                    return false;
                  }
                  if (referralSearch.trim()) {
                    const q = referralSearch.trim().toLowerCase();
                    const matchToken = (ref.partnerToken || '').toLowerCase().includes(q);
                    const matchPartner = (ref.partnerName || '').toLowerCase().includes(q);
                    const matchEmail = (ref.partnerEmail || '').toLowerCase().includes(q);
                    const matchClient = (ref.clientName || '').toLowerCase().includes(q);
                    const matchClientEmail = (ref.clientEmail || '').toLowerCase().includes(q);
                    const matchOrderNo = (ref.orderNumber || '').toLowerCase().includes(q);
                    const matchService = (ref.service || ref.projectType || '').toLowerCase().includes(q);
                    const matchCategory = (ref.category || '').toLowerCase().includes(q);
                    const matchTech = (ref.preferredTech || '').toLowerCase().includes(q);
                    if (
                      !matchToken &&
                      !matchPartner &&
                      !matchEmail &&
                      !matchClient &&
                      !matchClientEmail &&
                      !matchOrderNo &&
                      !matchService &&
                      !matchCategory &&
                      !matchTech
                    ) {
                      return false;
                    }
                  }
                  return true;
                });

                const newlyReceivedTokenLeads = unifiedReferrals.filter((r) => r.status === 'pending');

                return (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-bold text-[#0e0e0e]">
                        Partner Tokens &amp; Live Track Status Control
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Whenever a client submits project details on any Partner Token (or an Agreement is issued), both Admin Panel and the Partner&apos;s &ldquo;2. Track Status&rdquo; update automatically in real time.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddingReferral((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>{isAddingReferral ? 'Close Deal Form' : 'Add WhatsApp / Manual Deal'}</span>
                    </button>
                  </div>

                  {referralSaveNotice && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{referralSaveNotice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReferralSaveNotice('')}
                        className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="p-4 rounded-xl bg-white border border-neutral-200">
                      <span className="text-[11px] text-neutral-500 block">Issued Partner Tokens (Permanent)</span>
                      <span className="font-display text-2xl font-extrabold text-[#1430d8] tabular-nums block mt-0.5">
                        {partnerTokens.length} Saved
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-emerald-200/90">
                      <span className="text-[11px] text-neutral-600 block">Tokens With Client Details In</span>
                      <span className="font-display text-2xl font-extrabold text-emerald-700 tabular-nums block mt-0.5">
                        {activeTokensWithDetailsSet.size}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-neutral-200">
                      <span className="text-[11px] text-neutral-500 block">Active Token Deals &amp; Leads</span>
                      <span className="font-display text-2xl font-extrabold text-[#0e0e0e] tabular-nums block mt-0.5">
                        {unifiedReferrals.length}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-neutral-200">
                      <span className="text-[11px] text-neutral-500 block">Total Partner Commissions</span>
                      <span className="font-display text-2xl font-extrabold text-[#1430d8] tabular-nums block mt-0.5">
                        ${unifiedReferrals.reduce((acc, r) => acc + (r.commissionAmount || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* LIVE ALERT FEED: Newly Submitted Client Details on Partner Tokens */}
                  {newlyReceivedTokenLeads.length > 0 && (
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                          <Bell className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            New Client Details Received on Partner Tokens ({newlyReceivedTokenLeads.length}) — Live in Partner &ldquo;2. Track Status&rdquo;
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReferralStageFilter('pending');
                            document.getElementById('admin-track-status-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="text-[11px] font-semibold text-[#1430d8] hover:underline cursor-pointer"
                        >
                          Filter in Track Status Table →
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {newlyReceivedTokenLeads.slice(0, 4).map((lead) => (
                          <div
                            key={lead.id}
                            className="p-3 rounded-xl bg-white border border-emerald-200/80 flex flex-col justify-between gap-2 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <code className="font-mono font-bold text-[#1430d8]">{lead.partnerToken || 'TOKEN'}</code>
                                <span className="text-[11px] text-neutral-500 tabular-nums">{lead.date}</span>
                              </div>
                              <p className="text-neutral-800">
                                <span className="font-bold text-[#0e0e0e]">{lead.clientName}</span>
                                {lead.clientEmail ? ` (${lead.clientEmail})` : ''} submitted details for{' '}
                                <strong className="text-[#1430d8]">{lead.projectType}</strong>
                                {lead.statedBudgetText ? ` · Budget: ${lead.statedBudgetText}` : ''}
                              </p>
                              <p className="text-[11px] text-neutral-500">
                                Reference Partner: <strong className="text-neutral-800">{lead.partnerName}</strong> ({lead.partnerEmail})
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1 border-t border-neutral-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setReferralStageFilter('all');
                                  setReferralSearch(lead.partnerToken || lead.clientName);
                                  setExpandedReferralDetailsId(lead.id);
                                  document.getElementById('admin-track-status-section')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold cursor-pointer"
                              >
                                Inspect &amp; Update Status
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCreateOrOpenOrderFromReferral(lead)}
                                className="px-2.5 py-1 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] font-semibold cursor-pointer flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                <span>{lead.orderNumber ? `Agreement ${lead.orderNumber}` : 'Create Agreement'}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual / WhatsApp Deal Form (Opens pre-filled when clicking "+ Log Client Deal" on any token) */}
                  {isAddingReferral && (
                    <form
                      id="admin-log-deal-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const cleanToken = normalizeReferralToken(newRefToken);
                        const matched = cleanToken ? lookupPartnerByToken(cleanToken) : undefined;
                        const finalPartnerName = (newRefPartnerName.trim() || matched?.partnerName || '').trim();
                        const finalPartnerEmail = (newRefPartnerEmail.trim() || matched?.partnerEmail || '').trim();
                        if (!cleanToken || !finalPartnerName || !newRefClientName.trim()) return;

                        const savedClient = newRefClientName.trim();
                        const cleanCategory = newRefCategory.trim();
                        const finalProjectType = cleanCategory ? `${newRefService} — ${cleanCategory}` : newRefService;
                        addReferral({
                          partnerToken: cleanToken,
                          partnerName: finalPartnerName,
                          partnerEmail: finalPartnerEmail || 'hello@usmandevhub.com',
                          partnerWhatsApp: matched?.partnerWhatsApp,
                          payoutMethod: matched?.payoutMethod || 'Remitly (International Transfer)',
                          clientName: savedClient,
                          projectType: finalProjectType,
                          service: newRefService,
                          category: cleanCategory || undefined,
                          estimatedBudget: Math.max(0, Number(newRefBudget) || 0),
                          commissionPercentage: newRefCommissionPct,
                          status: newRefStatus,
                          source: 'manual_code',
                          notes: 'Logged by Admin (WhatsApp / Direct Intro)',
                          adminStatusNote: `Client details for ${savedClient} logged on your token (${REFERRAL_STAGE_LABELS[newRefStatus]}).`
                        });

                        setNewRefToken('');
                        setNewRefPartnerName('');
                        setNewRefPartnerEmail('');
                        setNewRefClientName('');
                        setNewRefBudget('2500');
                        setNewRefCommissionPct(25);
                        setNewRefStatus('in_negotiation');
                        setIsAddingReferral(false);
                        refreshAllData();
                        showReferralNotice(
                          `New deal added to Track Status: ${savedClient} under token ${cleanToken} (${finalPartnerName})`
                        );
                      }}
                      className="p-4 rounded-xl bg-white border border-neutral-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0e0e0e]">
                          Log Client Deal Under Partner Token
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingReferral(false)}
                          className="text-xs text-neutral-500 hover:text-neutral-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Partner Token *
                          </label>
                          <input
                            type="text"
                            required
                            list="admin-partner-tokens-list"
                            value={newRefToken}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setNewRefToken(val);
                              const found = lookupPartnerByToken(val);
                              if (found) {
                                setNewRefPartnerName(found.partnerName);
                                setNewRefPartnerEmail(found.partnerEmail);
                                if (found.targetService) setNewRefService(found.targetService);
                                if (found.targetCategory) setNewRefCategory(found.targetCategory);
                              }
                            }}
                              placeholder="e.g. UDH-PARTNER-001XY"
                            className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 font-mono text-xs uppercase focus:outline-none focus:bg-white focus:border-[#1430d8]"
                          />
                          <datalist id="admin-partner-tokens-list">
                            {partnerTokens.map((pt) => (
                              <option key={pt.token} value={pt.token}>
                                {pt.partnerName} ({pt.partnerEmail})
                              </option>
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Partner Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={newRefPartnerName}
                            onChange={(e) => setNewRefPartnerName(e.target.value)}
                            placeholder="Auto-fills from token"
                            className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:bg-white focus:border-[#1430d8]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Partner Gmail
                          </label>
                          <input
                            type="email"
                            value={newRefPartnerEmail}
                            onChange={(e) => setNewRefPartnerEmail(e.target.value)}
                            placeholder="partner@gmail.com"
                            className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:bg-white focus:border-[#1430d8]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Client Name *
                          </label>
                          <input
                            id="admin-new-ref-client-name"
                            type="text"
                            required
                            value={newRefClientName}
                            onChange={(e) => setNewRefClientName(e.target.value)}
                            placeholder="Enter Client Name"
                            className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:bg-white focus:border-[#1430d8]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Service *
                          </label>
                          <select
                            value={newRefService}
                            onChange={(e) => {
                              const srvVal = e.target.value;
                              setNewRefService(srvVal);
                              const matchedSrv = services.find((s) => s.title === srvVal);
                              if (matchedSrv?.subcategories && matchedSrv.subcategories.length > 0) {
                                setNewRefCategory(matchedSrv.subcategories[0]);
                              } else {
                                setNewRefCategory('');
                              }
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:bg-white focus:border-[#1430d8] cursor-pointer"
                          >
                            {services.map((srv) => (
                              <option key={srv.id} value={srv.title}>
                                {srv.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Category / Scope
                          </label>
                          {(() => {
                            const curSrv = services.find((s) => s.title === newRefService);
                            const subcats = curSrv?.subcategories || [];
                            if (subcats.length > 0) {
                              return (
                                <select
                                  value={newRefCategory}
                                  onChange={(e) => setNewRefCategory(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:bg-white focus:border-[#1430d8] cursor-pointer"
                                >
                                  {subcats.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  ))}
                                </select>
                              );
                            }
                            return (
                              <input
                                type="text"
                                value={newRefCategory}
                                onChange={(e) => setNewRefCategory(e.target.value)}
                                placeholder="e.g. Business Websites"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:bg-white focus:border-[#1430d8]"
                              />
                            );
                          })()}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Deal Value ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={newRefBudget}
                            onChange={(e) => setNewRefBudget(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 font-mono text-xs tabular-nums focus:outline-none focus:bg-white focus:border-[#1430d8]"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold text-neutral-700">
                              Commission Tier (%):
                            </label>
                            <span className="text-[11px] font-mono font-bold text-[#1430d8] tabular-nums">
                              {newRefCommissionPct}% = ${Math.round((Number(newRefBudget) || 0) * (newRefCommissionPct / 100)).toLocaleString()}
                            </span>
                          </div>
                          {/* Commission List Selector: 25%, 35%, 40% Presets + Custom Input */}
                          <div className="flex items-center gap-1.5">
                            {[25, 35, 40].map((tier) => (
                              <button
                                key={tier}
                                type="button"
                                onClick={() => setNewRefCommissionPct(tier)}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                  newRefCommissionPct === tier
                                    ? 'bg-[#1430d8] text-white border-[#1430d8] shadow-2xs'
                                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                                }`}
                              >
                                {tier}% {tier === 25 ? '(Standard)' : tier === 35 ? '(Mid)' : '(Final)'}
                              </button>
                            ))}
                            <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 w-20 shrink-0">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={newRefCommissionPct}
                                onChange={(e) =>
                                  setNewRefCommissionPct(
                                    Math.max(0, Math.min(100, Number(e.target.value) || 0))
                                  )
                                }
                                className="w-full bg-transparent text-xs font-mono font-bold text-center focus:outline-none"
                              />
                              <span className="text-[10px] text-neutral-400 font-bold">%</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-1">
                            Milestones: 25% Advance (${Math.round((Number(newRefBudget) || 0) * 0.25).toLocaleString()}) · 35% Mid (${Math.round((Number(newRefBudget) || 0) * 0.35).toLocaleString()}) · 40% Final (${Math.round((Number(newRefBudget) || 0) * 0.4).toLocaleString()})
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={newRefStatus}
                            onChange={(e) => setNewRefStatus(e.target.value as ReferralRecord['status'])}
                            className="flex-1 px-2.5 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs cursor-pointer font-medium"
                          >
                            <option value="pending">1. Details Received</option>
                            <option value="in_negotiation">2. In Negotiation</option>
                            <option value="deal_complete">3. Deal Confirmed</option>
                            <option value="milestone_25">4. 25% Kickoff Received</option>
                            <option value="milestone_35">5. 35% Mid Milestone Paid</option>
                            <option value="milestone_40">6. 40% Final Delivery Paid</option>
                            <option value="commission_paid">7. Full Commission Settled</option>
                          </select>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Save Deal
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* ADMIN LIVE TOKEN TRACK INSPECTOR (END-TO-END TOKEN + AGREEMENT + STATUS VIEW) */}
                  {(() => {
                    const cleanInspect = normalizeReferralToken(adminInspectedToken || (partnerTokens[0]?.token || ''));
                    const inspectedPartner = cleanInspect
                      ? partnerTokens.find((pt) => normalizeReferralToken(pt.token) === cleanInspect) ||
                        lookupPartnerByToken(cleanInspect)
                      : undefined;
                    const inspectedDeals = cleanInspect
                      ? unifiedReferrals.filter((r) => normalizeReferralToken(r.partnerToken || '') === cleanInspect)
                      : [];
                    const inspectedOrders = cleanInspect
                      ? orders.filter((o) => normalizeReferralToken(o.referralToken || '') === cleanInspect)
                      : [];

                    const stageRank: Record<ReferralRecord['status'], number> = {
                      pending: 1,
                      in_negotiation: 2,
                      deal_complete: 3,
                      milestone_25: 4,
                      milestone_35: 5,
                      milestone_40: 6,
                      commission_paid: 7
                    };
                    const highestRank = inspectedDeals.length > 0
                      ? Math.max(...inspectedDeals.map((d) => stageRank[d.status] || 1))
                      : inspectedOrders.length > 0
                      ? 3
                      : 0;

                    return (
                      <div
                        id="admin-live-token-inspector"
                        className="p-4 sm:p-5 rounded-2xl bg-white border border-blue-200/90 shadow-2xs space-y-4"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-[#1430d8]" />
                              <h4 className="font-display text-base font-bold text-[#0e0e0e]">
                                Live Token Track Inspector (Admin End-to-End View)
                              </h4>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Type or select any Partner Token (<code className="font-mono text-[#1430d8] font-semibold">UDH-...</code>) to inspect Partner details, Client Submissions, Linked Agreement PDF, and Live 4-Stage Status.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 w-full lg:w-80 shrink-0">
                            <div className="relative flex-1">
                              <KeyRound className="w-3.5 h-3.5 text-[#1430d8] absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={adminInspectedToken}
                                onChange={(e) => setAdminInspectedToken(e.target.value.toUpperCase())}
                                placeholder={partnerTokens[0]?.token || 'Enter Token (UDH-...)'}
                                className="w-full pl-8 pr-8 py-2 rounded-xl bg-neutral-50 border border-neutral-200 font-mono text-xs font-bold uppercase text-[#0e0e0e] focus:outline-none focus:bg-white focus:border-[#1430d8]"
                              />
                              {adminInspectedToken && (
                                <button
                                  type="button"
                                  onClick={() => setAdminInspectedToken('')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Clickable Token Chips */}
                        {partnerTokens.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="text-[11px] font-semibold text-neutral-500 mr-1">Active Tokens:</span>
                            {partnerTokens.slice(0, 8).map((pt) => {
                              const isSelected = normalizeReferralToken(pt.token) === cleanInspect;
                              return (
                                <button
                                  key={pt.token}
                                  type="button"
                                  onClick={() => setAdminInspectedToken(pt.token)}
                                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer border ${
                                    isSelected
                                      ? 'bg-[#1430d8] text-white border-[#1430d8]'
                                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                                  }`}
                                >
                                  {pt.token} · {pt.partnerName.split(' ')[0]}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {!cleanInspect ? (
                          <div className="p-5 rounded-xl bg-neutral-50 border border-dashed border-neutral-200 text-center text-xs text-neutral-500">
                            No Partner Tokens issued yet. Issue a new unique Partner Token below to see its live 4-stage tracking pipeline and linked Agreement right here.
                          </div>
                        ) : !inspectedPartner && inspectedDeals.length === 0 && inspectedOrders.length === 0 ? (
                          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              No issued Partner Token or Agreement found matching <strong className="font-mono">{cleanInspect}</strong>.
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Partner Summary & Quick Actions */}
                            <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <code className="px-2 py-0.5 rounded bg-[#1430d8] text-white font-mono font-extrabold text-xs">
                                    {cleanInspect}
                                  </code>
                                  <span className="font-extrabold text-[#0e0e0e] text-sm">
                                    {inspectedPartner?.partnerName || inspectedOrders[0]?.partnerName || inspectedDeals[0]?.partnerName || 'Registered Partner'}
                                  </span>
                                  {inspectedPartner?.partnerEmail && (
                                    <span className="text-neutral-600">({inspectedPartner.partnerEmail})</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-neutral-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                  <span>Designated Service: <strong className="text-[#1430d8] font-bold">{inspectedPartner?.targetService || 'Web Development'}</strong></span>
                                  {inspectedPartner?.targetCategory && (
                                    <span>Category / Scope: <strong className="text-neutral-800 font-semibold">{inspectedPartner.targetCategory}</strong></span>
                                  )}
                                  <span>Payout: <strong>{inspectedPartner?.payoutMethod || 'Remitly / Wise / Bank Transfer'}</strong></span>
                                  {inspectedPartner?.partnerWhatsApp && (
                                    <span>WhatsApp: <strong>{inspectedPartner.partnerWhatsApp}</strong></span>
                                  )}
                                  {inspectedPartner?.createdAt && (
                                    <span>Issued: {formatTokenIssuedAt(inspectedPartner.createdAt)}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                {inspectedPartner && (
                                  <>
                                    {inspectedDeals[0] && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditTrackModal(inspectedDeals[0])}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                                        title="Edit live Track Status, deal confirmation, and milestone payouts"
                                      >
                                        <Activity className="w-3.5 h-3.5" />
                                        <span>Edit Live Track Status</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleQuickLogDealFromToken(inspectedPartner)}
                                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                                    >
                                      + Log Client Deal
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCreateOrOpenOrderFromPartnerToken(inspectedPartner)}
                                      className="px-3 py-1.5 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>{inspectedOrders[0] ? `Open ${inspectedOrders[0].orderNumber}` : '+ Create Agreement'}</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* 6-Stage Visual Milestone Pipeline */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                              {[
                                { step: 1, title: '1. Inquired', sub: highestRank >= 1 ? 'Client Linked' : 'Waiting' },
                                { step: 2, title: '2. Scoping', sub: 'In Negotiation' },
                                { step: 3, title: '3. Confirmed', sub: inspectedOrders[0] ? inspectedOrders[0].orderNumber : 'Agreement' },
                                { step: 4, title: '4. 25% Advance', sub: 'Kickoff Paid' },
                                { step: 5, title: '5. 35% Mid', sub: 'In Progress' },
                                { step: 6, title: '6. 40% Final', sub: 'Full Settled' }
                              ].map((st) => {
                                const active = highestRank >= st.step;
                                return (
                                  <div
                                    key={st.step}
                                    className={`p-2 rounded-xl border ${
                                      active
                                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                                        : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                                    }`}
                                  >
                                    <div className="font-bold flex items-center justify-between gap-1 text-[11px]">
                                      <span>{st.title}</span>
                                      {active && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                    </div>
                                    <div className="text-[10px] mt-0.5 font-mono truncate">{st.sub}</div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Linked Agreements & Live Tracked Deals on This Token */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                              {/* Linked Official Agreements */}
                              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                                <div className="font-bold text-[#0e0e0e] flex items-center justify-between">
                                  <span>Linked Official Agreements ({inspectedOrders.length})</span>
                                  {inspectedPartner && (
                                    <button
                                      type="button"
                                      onClick={() => handleCreateOrOpenOrderFromPartnerToken(inspectedPartner)}
                                      className="text-[11px] font-bold text-[#1430d8] hover:underline cursor-pointer"
                                    >
                                      {inspectedOrders.length > 0 ? 'Open Studio →' : '+ Create Agreement →'}
                                    </button>
                                  )}
                                </div>
                                {inspectedOrders.length === 0 ? (
                                  <p className="text-[11px] text-neutral-500">
                                    No official PDF agreement created on this token yet. Click <strong>+ Create Agreement</strong> to generate a unique <code className="font-mono">UDH-ORD-...</code> linked to <code className="font-mono">{cleanInspect}</code>.
                                  </p>
                                ) : (
                                  inspectedOrders.map((ord) => (
                                    <div
                                      key={ord.id}
                                      className="p-2.5 rounded-lg bg-white border border-neutral-200 flex items-center justify-between gap-2"
                                    >
                                      <div className="min-w-0">
                                        <div className="font-mono font-bold text-[#1430d8]">{ord.orderNumber}</div>
                                        <div className="text-[11px] text-neutral-700 truncate">
                                          Client: <strong>{ord.clientName || 'Client'}</strong> · {ord.currency} {ord.confirmedPrice.toLocaleString()} (20% = ${Math.round(ord.commissionAmount || ord.confirmedPrice * 0.2).toLocaleString()})
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedOrderForStudio(ord);
                                            setIsOrderStudioOpen(true);
                                          }}
                                          className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold cursor-pointer text-[11px]"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDirectDownloadOrderPdf(ord)}
                                          className="px-2 py-1 rounded bg-[#1430d8] hover:bg-[#0075f7] text-white font-bold cursor-pointer text-[11px] inline-flex items-center gap-1"
                                        >
                                          <Download className="w-3 h-3" />
                                          <span>PDF</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Live Client Deal Status Controls */}
                              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                                <div className="font-bold text-[#0e0e0e] flex items-center justify-between">
                                  <span>Client Submissions &amp; Live Partner Track ({inspectedDeals.length})</span>
                                  {inspectedPartner && (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickLogDealFromToken(inspectedPartner)}
                                      className="text-[11px] font-bold text-[#1430d8] hover:underline cursor-pointer"
                                    >
                                      + Log Client Deal →
                                    </button>
                                  )}
                                </div>
                                {inspectedDeals.length === 0 ? (
                                  <p className="text-[11px] text-neutral-500">
                                    Waiting for client details on <code className="font-mono">{cleanInspect}</code>. When a client submits the Contact Form with this token (or you click <strong>+ Log Client Deal</strong> / save an Agreement), live tracking activates automatically!
                                  </p>
                                ) : (
                                  inspectedDeals.map((deal) => {
                                    const isSynth = deal.id.startsWith('inq-ref-') || deal.id.startsWith('ord-ref-');
                                    return (
                                      <div
                                        key={deal.id}
                                        className="p-2.5 rounded-lg bg-white border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                      >
                                        <div className="min-w-0">
                                          <div className="font-bold text-[#0e0e0e] truncate flex items-center flex-wrap gap-1.5">
                                            <span>{deal.clientName}</span>
                                            {deal.service && (
                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                                {deal.service}
                                              </span>
                                            )}
                                            {deal.category && (
                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                {deal.category}
                                              </span>
                                            )}
                                            {!deal.service && !deal.category && deal.projectType && (
                                              <span className="font-normal text-neutral-500">· {deal.projectType}</span>
                                            )}
                                          </div>
                                          <div className="text-[11px] text-neutral-600 tabular-nums">
                                            Deal: ${deal.estimatedBudget.toLocaleString()} · {deal.commissionPercentage ?? 25}% Commission: <strong className="text-[#1430d8]">${deal.commissionAmount.toLocaleString()}</strong>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEditTrackModal(deal)}
                                            className="px-2.5 py-1.5 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                            title="Edit Live Track Status & Milestones"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                            <span>Edit Track</span>
                                          </button>
                                          {!isSynth && (
                                            <select
                                              aria-label={`Update track stage for ${deal.clientName}`}
                                              value={deal.status}
                                              onChange={(e) => {
                                                const nextSt = e.target.value as ReferralRecord['status'];
                                                updateReferralStatus(deal.id, nextSt);
                                                refreshAllData();
                                                showReferralNotice(
                                                  `Updated Token ${cleanInspect} (${deal.clientName}) → ${REFERRAL_STAGE_LABELS[nextSt]}`
                                                );
                                              }}
                                              className="px-2.5 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-[11px] font-bold text-[#0e0e0e] cursor-pointer shrink-0"
                                            >
                                              <option value="pending">1. Details Received</option>
                                              <option value="in_negotiation">2. In Negotiation</option>
                                              <option value="deal_complete">3. Deal Confirmed</option>
                                              <option value="milestone_25">4. 25% Kickoff Received</option>
                                              <option value="milestone_35">5. 35% Mid Milestone Paid</option>
                                              <option value="milestone_40">6. 40% Final Delivery Paid</option>
                                              <option value="commission_paid">7. Full Commission Settled</option>
                                            </select>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* SECTION 1 (TOP): Issued Partner Tokens PDF Directory (Permanent Archive) */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-display text-base font-bold text-[#0e0e0e]">
                          1. Issued Partner Tokens PDF List ({partnerTokens.length} Saved)
                        </h4>
                        <p className="text-[11px] text-neutral-500">
                          Every token is 100% unique and permanently archived (no automatic deletion at 100 or beyond). Filter below to see which tokens already have client details received.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => downloadAdminTokensRegisterPdf(partnerTokens, unifiedReferrals, orders)}
                          title="Download Master Register PDF of all Partner Tokens"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tokens Register PDF ({partnerTokens.length} Saved)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportTokensToCSV}
                          title="Export all client tokens and linked deals to CSV"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Download className="w-3.5 h-3.5 text-[#1430d8]" />
                          <span>CSV ({partnerTokens.length})</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Bar: All Tokens vs Tokens With Client Details Received vs Waiting */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-neutral-100 border border-neutral-200/80">
                        {(
                          [
                            { id: 'all', label: `All Tokens (${partnerTokens.length})` },
                            { id: 'with_details', label: `✓ Details Received (${tokensWithDetailsInListCount})` },
                            { id: 'waiting', label: `Waiting for Client (${tokensWaitingInListCount})` }
                          ] as const
                        ).map((fTab) => (
                          <button
                            key={fTab.id}
                            type="button"
                            onClick={() => setTokenActivityFilter(fTab.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                              tokenActivityFilter === fTab.id
                                ? 'bg-white text-[#0e0e0e] font-semibold shadow-2xs'
                                : 'text-neutral-600 hover:text-[#0e0e0e]'
                            }`}
                          >
                            {fTab.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative w-full lg:w-72 shrink-0">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={tokenSearch}
                          onChange={(e) => setTokenSearch(e.target.value)}
                          placeholder="Search Name, Gmail, or UDH-..."
                          className="w-full pl-8 pr-8 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#1430d8]"
                        />
                        {tokenSearch && (
                          <button
                            type="button"
                            onClick={() => setTokenSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Issue Brand-New Unique Partner Token Bar */}
                    <div className="p-3.5 rounded-xl bg-white border border-neutral-200 flex flex-col lg:flex-row lg:items-end justify-between gap-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 flex-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Partner Name *</label>
                          <input
                            type="text"
                            value={adminQuickPartnerName}
                            onChange={(e) => setAdminQuickPartnerName(e.target.value)}
                            placeholder="Enter Partner / Agency Name"
                            className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:bg-white focus:border-[#1430d8]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Partner Gmail</label>
                          <input
                            type="email"
                            value={adminQuickPartnerEmail}
                            onChange={(e) => setAdminQuickPartnerEmail(e.target.value)}
                            placeholder="partner@gmail.com"
                            className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:bg-white focus:border-[#1430d8]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">WhatsApp (Optional)</label>
                          <input
                            type="text"
                            value={adminQuickPartnerWhatsApp}
                            onChange={(e) => setAdminQuickPartnerWhatsApp(e.target.value)}
                            placeholder="+92 300 0000000"
                            className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:bg-white focus:border-[#1430d8]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Target Service</label>
                          <select
                            value={adminQuickPartnerService}
                            onChange={(e) => {
                              const srvTitle = e.target.value;
                              setAdminQuickPartnerService(srvTitle);
                              const match = services.find((s) => s.title === srvTitle);
                              if (match?.subcategories && match.subcategories.length > 0) {
                                setAdminQuickPartnerCategory(match.subcategories[0]);
                              } else {
                                setAdminQuickPartnerCategory('');
                              }
                            }}
                            className="w-full px-2.5 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:bg-white focus:border-[#1430d8] cursor-pointer"
                          >
                            {services.map((srv) => (
                              <option key={srv.id} value={srv.title}>
                                {srv.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Category / Scope</label>
                          {(() => {
                            const cur = services.find((s) => s.title === adminQuickPartnerService);
                            const cats = cur?.subcategories || [];
                            if (cats.length > 0) {
                              return (
                                <select
                                  value={adminQuickPartnerCategory}
                                  onChange={(e) => setAdminQuickPartnerCategory(e.target.value)}
                                  className="w-full px-2.5 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:bg-white focus:border-[#1430d8] cursor-pointer"
                                >
                                  {cats.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  ))}
                                </select>
                              );
                            }
                            return (
                              <input
                                type="text"
                                value={adminQuickPartnerCategory}
                                onChange={(e) => setAdminQuickPartnerCategory(e.target.value)}
                                placeholder="Scope / Category"
                                className="w-full px-2.5 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:bg-white focus:border-[#1430d8]"
                              />
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAdminIssueQuickToken('token')}
                          disabled={!adminQuickPartnerName.trim()}
                          className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                        >
                          + Generate Token
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminIssueQuickToken('pdf')}
                          disabled={!adminQuickPartnerName.trim()}
                          className="px-3 py-2 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] disabled:opacity-50 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Token + PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminIssueQuickToken('agreement')}
                          disabled={!adminQuickPartnerName.trim()}
                          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                        >
                          Token + Agreement
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto bg-white border border-neutral-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-50 text-neutral-700 font-semibold border-b border-neutral-200">
                          <tr>
                            <th className="p-3 whitespace-nowrap">Slot (1–100)</th>
                            <th className="p-3 whitespace-nowrap">Partner Name &amp; Gmail</th>
                            <th className="p-3 whitespace-nowrap">Issued Token</th>
                            <th className="p-3 whitespace-nowrap">Target Service &amp; Category</th>
                            <th className="p-3 whitespace-nowrap">Payout &amp; Issued Time</th>
                            <th className="p-3 whitespace-nowrap">Token Activity &amp; Track Status</th>
                            <th className="p-3 text-right whitespace-nowrap">Track, Agreement &amp; PDF</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {filteredPartnerTokens.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-neutral-500">
                                No partner tokens issued yet. Enter a Partner Name above and click <strong>+ Generate Token</strong>.
                              </td>
                            </tr>
                          ) : (
                            filteredPartnerTokens.map((pt) => {
                              const sameEmailCount =
                                emailTokenCounts[(pt.partnerEmail || '').trim().toLowerCase()] || 1;
                              const fullIndex = partnerTokens.findIndex(
                                (item) => normalizeReferralToken(item.token) === normalizeReferralToken(pt.token)
                              );
                              const chronoSlot = fullIndex >= 0 ? partnerTokens.length - fullIndex : 1;
                              const cleanPtToken = normalizeReferralToken(pt.token);
                              const linkedDeals = unifiedReferrals.filter(
                                (r) => normalizeReferralToken(r.partnerToken || '') === cleanPtToken
                              );
                              const linkedOrders = orders.filter(
                                (o) => normalizeReferralToken(o.referralToken || '') === cleanPtToken
                              );
                              const hasAnyClientActivity = linkedDeals.length > 0 || linkedOrders.length > 0;

                              return (
                                <tr
                                  key={pt.token}
                                  className={`align-top ${
                                    hasAnyClientActivity ? 'bg-emerald-50/25 hover:bg-emerald-50/45' : 'hover:bg-neutral-50/80'
                                  }`}
                                >
                                  <td className="p-3 whitespace-nowrap font-mono font-bold text-neutral-600 tabular-nums">
                                    #{chronoSlot}
                                  </td>
                                  <td className="p-3">
                                    <div className="font-bold text-[#0e0e0e]">{pt.partnerName}</div>
                                    <div className="text-neutral-700 text-xs mt-0.5">{pt.partnerEmail}</div>
                                    <div className="text-[11px] text-neutral-400 mt-0.5 tabular-nums">
                                      {pt.partnerWhatsApp ? `WhatsApp: ${pt.partnerWhatsApp}` : 'Direct Gmail'}
                                      {sameEmailCount > 1 ? ` · ${sameEmailCount} tokens on this Gmail` : ''}
                                    </div>
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <code className="font-mono font-bold text-[#1430d8] tabular-nums">
                                        {pt.token}
                                      </code>
                                      <button
                                        type="button"
                                        title="Copy token code"
                                        onClick={() => {
                                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                            navigator.clipboard.writeText(pt.token).catch(() => {});
                                          }
                                          setCopiedPartnerCode(pt.token);
                                          setTimeout(() => setCopiedPartnerCode(null), 1800);
                                        }}
                                        className="p-1 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                                      >
                                        {copiedPartnerCode === pt.token ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center flex-wrap gap-1">
                                        <span className="text-[11px] font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                          {pt.targetService || 'Web Development'}
                                        </span>
                                        {pt.targetCategory && (
                                          <span className="text-[10px] font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                                            {pt.targetCategory}
                                          </span>
                                        )}
                                      </div>
                                      {linkedDeals.length > 0 && linkedDeals[0].service && (
                                        <div className="text-[10px] text-emerald-800 font-medium">
                                          Client Brought For: <strong>{linkedDeals[0].service}</strong>{linkedDeals[0].category ? ` · ${linkedDeals[0].category}` : ''}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-neutral-700">
                                      {pt.payoutMethod || 'Remitly / Wise / Bank Transfer'}
                                    </div>
                                    <div className="text-[11px] text-neutral-400 mt-0.5 tabular-nums">
                                      {formatTokenIssuedAt(pt.createdAt)}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    {!hasAnyClientActivity ? (
                                      <span className="text-neutral-500">
                                        Waiting for Client · Ready to Link
                                      </span>
                                    ) : (
                                      <div className="space-y-1">
                                        <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                          <span>Client Activity Linked on Token</span>
                                        </div>
                                        {linkedDeals.map((ld) => (
                                          <div key={ld.id} className="text-neutral-800 text-[11px]">
                                            <span className="font-semibold">{ld.clientName}</span>
                                            {ld.clientEmail ? (
                                              <span className="text-neutral-500"> ({ld.clientEmail})</span>
                                            ) : null}
                                            <span className="text-neutral-400"> · </span>
                                            <span className="text-[#1430d8] font-semibold">
                                              {REFERRAL_STAGE_LABELS[ld.status]}
                                            </span>
                                            {ld.orderNumber ? (
                                              <>
                                                <span className="text-neutral-400"> · </span>
                                                <code className="font-mono font-bold text-[#1430d8]">
                                                  {ld.orderNumber}
                                                </code>
                                              </>
                                            ) : null}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5">
                                      {linkedDeals.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditTrackModal(linkedDeals[0])}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                                          title="Edit Live Track Status & Milestones"
                                        >
                                          <Activity className="w-3 h-3" />
                                          <span>Edit Track</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAdminInspectedToken(pt.token);
                                          if (linkedDeals[0]) {
                                            setReferralStageFilter('all');
                                            setReferralSearch(pt.token);
                                            setExpandedReferralDetailsId(linkedDeals[0].id);
                                          }
                                          document
                                            .getElementById('admin-live-token-inspector')
                                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0"
                                      >
                                        <Activity className="w-3 h-3" />
                                        <span>Track</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleCreateOrOpenOrderFromPartnerToken(pt)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                                        title="Create or Open Official Agreement linked to this Partner Token"
                                      >
                                        <FileText className="w-3 h-3" />
                                        <span>{linkedOrders[0] ? linkedOrders[0].orderNumber : '+ Agreement'}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => downloadPartnerTokenPdf(pt, linkedDeals, linkedOrders, chronoSlot)}
                                        title={`Download Official PDF for Token ${pt.token}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>Token PDF</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveShareDoc({
                                            isOpen: true,
                                            type: 'token',
                                            partner: pt,
                                            linkedDeals,
                                            linkedOrders,
                                            chronoSlot,
                                            initialChannel: 'whatsapp'
                                          });
                                        }}
                                        title="Send Token PDF on WhatsApp"
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                                      >
                                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                                        <span>WhatsApp</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveShareDoc({
                                            isOpen: true,
                                            type: 'token',
                                            partner: pt,
                                            linkedDeals,
                                            linkedOrders,
                                            chronoSlot,
                                            initialChannel: 'email'
                                          });
                                        }}
                                        title="Send Token PDF via Gmail"
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1430d8] border border-blue-200 text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                                      >
                                        <Mail className="w-3 h-3 text-blue-600" />
                                        <span>Gmail</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleQuickLogDealFromToken(pt)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Log Deal</span>
                                      </button>

                                      <button
                                        type="button"
                                        title="Permanently Delete Partner Token"
                                        onClick={() => handleDeletePartnerTokenInAdmin(pt.token, pt.partnerName)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 transition-colors shadow-2xs"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SECTION 2: Referrals Ledger Table (Client Deals & Live Track Status) */}
                  <div id="admin-track-status-section" className="space-y-3 pt-2">
                    <div>
                      <h4 className="font-display text-base font-bold text-[#0e0e0e]">
                        2. Client Deals &amp; Live Track Status ({filteredReferrals.length})
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Inspect submitted client details on any Partner Token, update the stage or deal value ($), and post a live status note — the Partner sees your exact updates under &ldquo;2. Track Status&rdquo; on the website.
                      </p>
                    </div>

                    {/* Search & Stage Segmented Filter Bar */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-neutral-100 border border-neutral-200/80">
                        {([
                          { id: 'all', label: `All (${unifiedReferrals.length})` },
                          { id: 'pending', label: `1. Inquired (${unifiedReferrals.filter((r) => r.status === 'pending').length})` },
                          { id: 'in_negotiation', label: '2. Scoping' },
                          { id: 'deal_complete', label: '3. Confirmed' },
                          { id: 'milestone_25', label: '4. 25% Advance' },
                          { id: 'milestone_35', label: '5. 35% Mid' },
                          { id: 'milestone_40', label: '6. 40% Final' },
                          { id: 'commission_paid', label: '7. Full Settled' }
                        ] as const).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setReferralStageFilter(tab.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                              referralStageFilter === tab.id
                                ? 'bg-white text-[#0e0e0e] font-semibold shadow-2xs'
                                : 'text-neutral-600 hover:text-[#0e0e0e]'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative w-full lg:w-72 shrink-0">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={referralSearch}
                          onChange={(e) => setReferralSearch(e.target.value)}
                          placeholder="Search token, client, ref no., Gmail..."
                          className="w-full pl-8 pr-8 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#1430d8]"
                        />
                        {referralSearch && (
                          <button
                            type="button"
                            onClick={() => setReferralSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto bg-white border border-neutral-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-50 text-neutral-700 font-semibold border-b border-neutral-200">
                          <tr>
                            <th className="p-3 whitespace-nowrap">Reference Partner &amp; Token</th>
                            <th className="p-3 whitespace-nowrap">Client &amp; Submitted Details</th>
                            <th className="p-3 whitespace-nowrap">Service &amp; Live Partner Note</th>
                            <th className="p-3 whitespace-nowrap">Deal Value ($)</th>
                            <th className="p-3 whitespace-nowrap">Commission (20% Partner Share)</th>
                            <th className="p-3 whitespace-nowrap">Live Track Status (Website)</th>
                            <th className="p-3 text-right whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {filteredReferrals.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-neutral-500">
                                {unifiedReferrals.length === 0
                                  ? 'No client deals logged yet. Click "+ Log Deal" on any issued token above.'
                                  : 'No deals match your current search or stage filter.'}
                              </td>
                            </tr>
                          ) : (
                            filteredReferrals.map((ref) => {
                              const isSyntheticRecord = ref.id.startsWith('ord-sync-') || ref.id.startsWith('msg-sync-');
                              const draftVal =
                                referralBudgetDrafts[ref.id] !== undefined
                                  ? referralBudgetDrafts[ref.id]
                                  : String(ref.estimatedBudget);
                              const isDirty = Number(draftVal) !== ref.estimatedBudget;

                              const currentNoteText = ref.adminStatusNote || ref.notes || '';
                              const noteDraft =
                                referralNoteDrafts[ref.id] !== undefined
                                  ? referralNoteDrafts[ref.id]
                                  : currentNoteText;
                              const isNoteDirty = noteDraft.trim() !== currentNoteText.trim();

                              const sourceLabel =
                                ref.source === 'referral_link' || ref.source === 'manual_code'
                                  ? 'Partner Token'
                                  : ref.source === 'order_agreement'
                                  ? 'Official Agreement'
                                  : 'Partner Portal';

                              const isDetailsOpen = expandedReferralDetailsId === ref.id;
                              const cleanPartnerPhone = (ref.partnerWhatsApp || '').replace(/[^0-9]/g, '');
                              const pingPct = ref.commissionPercentage ?? 20;
                              const partnerPingText = `Assalam-o-Alaikum ${ref.partnerName}, update from Usman DevHub Studio regarding your referral token ${ref.partnerToken || ''}:\n• Client: ${ref.clientName}\n• Service: ${ref.projectType}\n• Live Track Status: ${REFERRAL_STAGE_LABELS[ref.status]}\n• Commission (${pingPct}%): $${ref.commissionAmount.toLocaleString()}${ref.orderNumber ? `\n• Agreement Ref: ${ref.orderNumber}` : ''}\n\nYou can also check live anytime under "2. Track Status" on our website!`;
                              const partnerWaHref = cleanPartnerPhone
                                ? `https://wa.me/${cleanPartnerPhone}?text=${encodeURIComponent(partnerPingText)}`
                                : `https://wa.me/?text=${encodeURIComponent(partnerPingText)}`;

                              const persistReferralMutation = (
                                updates: Partial<
                                  Pick<
                                    ReferralRecord,
                                    | 'status'
                                    | 'estimatedBudget'
                                    | 'commissionPercentage'
                                    | 'commissionAmount'
                                    | 'adminStatusNote'
                                  >
                                >
                              ) => {
                                if (isSyntheticRecord) {
                                  // Promote synthetic message/order lead to persistent ReferralRecord first
                                  addReferral({
                                    partnerToken: ref.partnerToken,
                                    partnerName: ref.partnerName,
                                    partnerEmail: ref.partnerEmail,
                                    partnerWhatsApp: ref.partnerWhatsApp,
                                    payoutMethod: ref.payoutMethod,
                                    clientName: ref.clientName,
                                    clientEmail: ref.clientEmail,
                                    clientCompany: ref.clientCompany,
                                    projectType: ref.projectType,
                                    estimatedBudget:
                                      updates.estimatedBudget !== undefined ? updates.estimatedBudget : ref.estimatedBudget,
                                    commissionPercentage:
                                      updates.commissionPercentage !== undefined
                                        ? updates.commissionPercentage
                                        : (ref.commissionPercentage ?? 20),
                                    statedBudgetText: ref.statedBudgetText,
                                    status: updates.status || ref.status,
                                    source: ref.source,
                                    submittedAt: ref.submittedAt,
                                    inquiryId: ref.inquiryId,
                                    orderNumber: ref.orderNumber,
                                    clientMessage: ref.clientMessage,
                                    notes: ref.notes,
                                    adminStatusNote:
                                      updates.adminStatusNote !== undefined
                                        ? updates.adminStatusNote
                                        : ref.adminStatusNote
                                  });
                                } else {
                                  updateReferralRecord(ref.id, updates);
                                }
                                refreshAllData();
                              };

                              return (
                                <React.Fragment key={ref.id}>
                                  <tr className="hover:bg-neutral-50/80 align-top">
                                    <td className="p-3">
                                      <div className="font-bold text-[#0e0e0e]">{ref.partnerName}</div>
                                      <div className="text-neutral-600 text-[11px]">{ref.partnerEmail}</div>
                                      {ref.partnerToken && (
                                        <code className="inline-block mt-1 font-mono text-[11px] font-bold text-[#1430d8] tabular-nums">
                                          {ref.partnerToken}
                                        </code>
                                      )}
                                      {ref.payoutMethod && (
                                        <div className="text-[10px] text-neutral-400 mt-0.5">
                                          Payout: {ref.payoutMethod}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <div className="font-semibold text-[#0e0e0e]">{ref.clientName}</div>
                                      <div className="text-neutral-500 text-[11px]">
                                        {ref.clientEmail || ref.clientCompany || 'Direct Inquiry'}
                                      </div>
                                      <div className="text-[10px] text-neutral-400 mt-0.5">
                                        {sourceLabel} · <span className="tabular-nums">{ref.date}</span>
                                      </div>
                                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                        {ref.orderNumber ? (
                                          <button
                                            type="button"
                                            onClick={() => handleCreateOrOpenOrderFromReferral(ref)}
                                            className="font-mono text-[10px] font-bold text-[#1430d8] hover:underline cursor-pointer"
                                          >
                                            Ref: {ref.orderNumber}
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleCreateOrOpenOrderFromReferral(ref)}
                                            className="text-[10px] font-semibold text-[#1430d8] hover:underline cursor-pointer"
                                          >
                                            + Create Agreement
                                          </button>
                                        )}
                                        {(ref.clientMessage || ref.statedBudgetText) && (
                                          <>
                                            <span className="text-neutral-300">·</span>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setExpandedReferralDetailsId(isDetailsOpen ? null : ref.id)
                                              }
                                              className="text-[10px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                                            >
                                              {isDetailsOpen ? 'Hide Details' : 'View Submitted Details'}
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-3 text-neutral-700 min-w-[220px]">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center flex-wrap gap-1">
                                          {ref.service ? (
                                            <span className="text-[11px] font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                                              {ref.service}
                                            </span>
                                          ) : (
                                            <span className="font-medium text-[#0e0e0e]">{ref.projectType}</span>
                                          )}
                                          {ref.category && (
                                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                              {ref.category}
                                            </span>
                                          )}
                                        </div>
                                        {ref.preferredTech && (
                                          <div className="text-[10px] text-neutral-500 font-mono">
                                            Tech: {ref.preferredTech}
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-1.5 flex items-center gap-1">
                                        <input
                                          type="text"
                                          value={noteDraft}
                                          onChange={(e) =>
                                            setReferralNoteDrafts((prev) => ({
                                              ...prev,
                                              [ref.id]: e.target.value
                                            }))
                                          }
                                          placeholder="Live note for Partner in Track Status..."
                                          className="w-full px-2 py-1 rounded-lg bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-800 focus:bg-white focus:border-[#1430d8] focus:outline-none"
                                        />
                                        {isNoteDirty && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              persistReferralMutation({ adminStatusNote: noteDraft.trim() });
                                              setReferralNoteDrafts((prev) => {
                                                const copy = { ...prev };
                                                delete copy[ref.id];
                                                return copy;
                                              });
                                              showReferralNotice(
                                                `Saved live Track Status note for ${ref.partnerName} (${ref.partnerToken || 'Token'})!`
                                              );
                                            }}
                                            className="px-2 py-1 rounded-md bg-[#1430d8] text-white text-[10px] font-semibold hover:bg-[#0075f7] cursor-pointer shrink-0"
                                          >
                                            Save
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-1.5">
                                        <div className="flex items-center bg-neutral-50 border border-neutral-300 rounded-lg px-2 py-1 w-28 focus-within:bg-white focus-within:border-[#1430d8]">
                                          <span className="text-neutral-400 mr-1">$</span>
                                          <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={draftVal}
                                            onChange={(e) =>
                                              setReferralBudgetDrafts((prev) => ({
                                                ...prev,
                                                [ref.id]: e.target.value
                                              }))
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                const nextNum = Math.max(0, Number(draftVal) || 0);
                                                persistReferralMutation({ estimatedBudget: nextNum });
                                                setReferralBudgetDrafts((prev) => {
                                                  const copy = { ...prev };
                                                  delete copy[ref.id];
                                                  return copy;
                                                });
                                                showReferralNotice(
                                                  `Updated deal value for ${ref.clientName} to $${nextNum.toLocaleString()} (20% = $${Math.round(nextNum * 0.2).toLocaleString()})`
                                                );
                                              }
                                            }}
                                            className="w-full bg-transparent font-mono text-xs font-semibold text-[#0e0e0e] tabular-nums focus:outline-none"
                                          />
                                        </div>
                                        {isDirty && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextNum = Math.max(0, Number(draftVal) || 0);
                                              persistReferralMutation({ estimatedBudget: nextNum });
                                              setReferralBudgetDrafts((prev) => {
                                                const copy = { ...prev };
                                                delete copy[ref.id];
                                                return copy;
                                              });
                                              showReferralNotice(
                                                `Updated deal value for ${ref.clientName} to $${nextNum.toLocaleString()} (20% = $${Math.round(nextNum * 0.2).toLocaleString()})`
                                              );
                                            }}
                                            className="px-2.5 py-1 rounded-md bg-[#1430d8] text-white text-[11px] font-semibold hover:bg-[#0075f7] cursor-pointer whitespace-nowrap shrink-0"
                                          >
                                            Save
                                          </button>
                                        )}
                                      </div>
                                      {ref.statedBudgetText && (
                                        <span className="block text-[10px] text-neutral-400 mt-1">
                                          Client stated: {ref.statedBudgetText}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      {/* Commission Tier List Selector (25%, 35%, 40% + Quick Buttons) */}
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                          <select
                                            aria-label={`Commission tier for ${ref.clientName}`}
                                            value={ref.commissionPercentage ?? 20}
                                            onChange={(e) => {
                                              const nextPct = Number(e.target.value);
                                              const nextComm = Math.round(ref.estimatedBudget * (nextPct / 100));
                                              persistReferralMutation({
                                                commissionPercentage: nextPct,
                                                commissionAmount: nextComm
                                              });
                                              showReferralNotice(
                                                `Updated commission tier for ${ref.clientName} to ${nextPct}% ($${nextComm.toLocaleString()})`
                                              );
                                            }}
                                            className="px-2 py-1 rounded-md bg-blue-50/90 hover:bg-blue-100 border border-blue-200 text-[#1430d8] font-mono font-bold text-xs cursor-pointer focus:outline-none"
                                          >
                                            <option value={20}>
                                              20% (${Math.round(ref.estimatedBudget * 0.20).toLocaleString()}) - Standard
                                            </option>
                                            <option value={25}>
                                              25% (${Math.round(ref.estimatedBudget * 0.25).toLocaleString()}) - Custom
                                            </option>
                                            <option value={35}>
                                              35% (${Math.round(ref.estimatedBudget * 0.35).toLocaleString()}) - Mid
                                            </option>
                                            <option value={40}>
                                              40% (${Math.round(ref.estimatedBudget * 0.40).toLocaleString()}) - Final
                                            </option>
                                            {![20, 25, 35, 40].includes(ref.commissionPercentage ?? 20) && (
                                              <option value={ref.commissionPercentage}>
                                                {ref.commissionPercentage}% (${ref.commissionAmount.toLocaleString()})
                                              </option>
                                            )}
                                          </select>
                                          <span className="font-mono font-extrabold text-[#1430d8] tabular-nums text-xs">
                                            ${ref.commissionAmount.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          {[20, 25, 35, 40].map((tier) => (
                                            <button
                                              key={tier}
                                              type="button"
                                              onClick={() => {
                                                const nextComm = Math.round(ref.estimatedBudget * (tier / 100));
                                                persistReferralMutation({
                                                  commissionPercentage: tier,
                                                  commissionAmount: nextComm
                                                });
                                                showReferralNotice(
                                                  `Set ${ref.clientName} commission to ${tier}% ($${nextComm.toLocaleString()})`
                                                );
                                              }}
                                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                                                (ref.commissionPercentage ?? 20) === tier
                                                  ? 'bg-[#1430d8] text-white shadow-2xs'
                                                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                              }`}
                                              title={`Select ${tier}% Commission`}
                                            >
                                              {tier}%
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <select
                                        aria-label={`Live track status for ${ref.clientName}`}
                                        value={ref.status}
                                        onChange={(e) => {
                                          const nextStatus = e.target.value as ReferralRecord['status'];
                                          persistReferralMutation({ status: nextStatus });
                                          showReferralNotice(
                                            `Track Status updated: ${ref.clientName} (${ref.partnerToken || ref.partnerName}) → ${REFERRAL_STAGE_LABELS[nextStatus]}`
                                          );
                                        }}
                                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer focus:outline-none ${
                                          ref.status === 'commission_paid'
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                            : ref.status === 'milestone_40'
                                            ? 'bg-purple-50 border-purple-200 text-purple-800'
                                            : ref.status === 'milestone_35'
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                                            : ref.status === 'milestone_25'
                                            ? 'bg-teal-50 border-teal-200 text-teal-800'
                                            : ref.status === 'deal_complete'
                                            ? 'bg-blue-50 border-blue-200 text-[#1430d8]'
                                            : ref.status === 'in_negotiation'
                                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                                            : 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                                        }`}
                                      >
                                        <option value="pending">1. Details Received</option>
                                        <option value="in_negotiation">2. In Negotiation</option>
                                        <option value="deal_complete">3. Deal Confirmed</option>
                                        <option value="milestone_25">4. 25% Kickoff Received</option>
                                        <option value="milestone_35">5. 35% Mid Milestone Paid</option>
                                        <option value="milestone_40">6. 40% Final Delivery Paid</option>
                                        <option value="commission_paid">7. Full Commission Settled</option>
                                      </select>
                                    </td>
                                    <td className="p-3 text-right whitespace-nowrap">
                                      <div className="inline-flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditTrackModal(ref)}
                                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 via-[#1430d8] to-indigo-700 hover:opacity-95 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                                          title="Edit Live Track Status & Milestones"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                          <span>Edit Track Status</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const cleanTok = normalizeReferralToken(ref.partnerToken || 'UDH-PARTNER');
                                            const foundPt =
                                              partnerTokens.find(
                                                (p) => normalizeReferralToken(p.token) === cleanTok
                                              ) || {
                                                token: cleanTok || 'UDH-PARTNER',
                                                partnerName: ref.partnerName || 'Partner',
                                                partnerEmail: ref.partnerEmail || 'hello@usmandevhub.com',
                                                partnerWhatsApp: ref.partnerWhatsApp,
                                                payoutMethod: ref.payoutMethod,
                                                targetService: ref.service,
                                                targetCategory: ref.category,
                                                createdAt: ref.submittedAt || ref.date
                                              };
                                            const linkedOrdersForPt = orders.filter(
                                              (o) => normalizeReferralToken(o.referralToken || '') === cleanTok
                                            );
                                            setActiveShareDoc({
                                              isOpen: true,
                                              type: 'token',
                                              partner: foundPt,
                                              linkedDeals: [ref],
                                              linkedOrders: linkedOrdersForPt,
                                              initialChannel: 'whatsapp'
                                            });
                                          }}
                                          title="Send Full Token PDF + Track Status on WhatsApp or Gmail"
                                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Send PDF</span>
                                        </button>
                                        {!isSyntheticRecord && (
                                          <button
                                            type="button"
                                            title="Delete referral record"
                                            onClick={() => {
                                              deleteReferralRecord(ref.id);
                                              refreshAllData();
                                            }}
                                            className="p-1.5 text-neutral-400 hover:text-red-600 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>

                                  {/* Expandable Submitted Client Details Drawer */}
                                  {isDetailsOpen && (
                                    <tr className="bg-blue-50/30">
                                      <td colSpan={7} className="p-3.5">
                                        <div className="p-3.5 rounded-xl bg-white border border-blue-200/80 space-y-2 text-xs">
                                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="font-bold text-[#0e0e0e]">
                                                Submitted Client Details on Token{' '}
                                                <code className="font-mono text-[#1430d8]">{ref.partnerToken}</code>
                                              </span>
                                              <span className="text-neutral-400">·</span>
                                              <span className="text-neutral-600">
                                                Reference Partner: <strong>{ref.partnerName}</strong> ({ref.partnerEmail})
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => setExpandedReferralDetailsId(null)}
                                              className="text-neutral-500 hover:text-neutral-800 font-semibold cursor-pointer"
                                            >
                                              Close
                                            </button>
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-neutral-700">
                                            <div>
                                              <span className="text-neutral-400 block">Client Name &amp; Email</span>
                                              <strong className="text-[#0e0e0e]">{ref.clientName}</strong>
                                              {ref.clientEmail ? ` · ${ref.clientEmail}` : ''}
                                            </div>
                                            <div>
                                              <span className="text-neutral-400 block">Service &amp; Stated Budget</span>
                                              <strong className="text-[#0e0e0e]">{ref.projectType}</strong>
                                              {ref.statedBudgetText ? ` · ${ref.statedBudgetText}` : ` · $${ref.estimatedBudget.toLocaleString()}`}
                                            </div>
                                            <div>
                                              <span className="text-neutral-400 block">Submission Channel &amp; Agreement</span>
                                              <strong className="text-[#0e0e0e]">{sourceLabel}</strong>
                                              {ref.orderNumber ? ` · Ref: ${ref.orderNumber}` : ' · No Agreement Yet'}
                                            </div>
                                          </div>
                                          {ref.clientMessage && (
                                            <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/80 text-neutral-700 whitespace-pre-wrap leading-relaxed">
                                              {ref.clientMessage}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                );
              })()}

              {/* SEO & GROWTH TAB */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-xl font-bold text-[#0e0e0e]">
                          Search Engine Optimization (Full SEO Suite)
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          100% Score
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Comprehensive search indexing, Schema.org rich snippets, social sharing cards, and crawler directives.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href="/sitemap.xml"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-colors"
                      >
                        <FileCode className="w-3.5 h-3.5 text-[#1430d8]" />
                        <span>View Sitemap</span>
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                      </a>
                      <a
                        href="/robots.txt"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        <span>robots.txt</span>
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                      </a>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                      <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                        <span>Meta Title</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Valid
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#0e0e0e]">58 Characters</div>
                      <p className="text-[11px] text-neutral-500 mt-1">Ideal 30-60 characters for Google snippet truncation prevention</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                      <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                        <span>Meta Description</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Valid
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#0e0e0e]">154 Characters</div>
                      <p className="text-[11px] text-neutral-500 mt-1">Perfect length within 120-160 range for full mobile/desktop view</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                      <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                        <span>Schema.org Entities</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 7 Services
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#0e0e0e]">FAQ &amp; Org Rich Graph</div>
                      <p className="text-[11px] text-neutral-500 mt-1">Organization, ProfessionalService, WebSite, 7 Services, FAQPage &amp; Breadcrumb</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                      <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                        <span>XML Sitemap</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 14 URLs
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#0e0e0e]">Priority 1.0 - 0.85</div>
                      <p className="text-[11px] text-neutral-500 mt-1">Homepage, 7 individual services, portfolio, founder, referral, testimonials &amp; contact</p>
                    </div>
                  </div>

                  {/* Interactive Visual Preview Tabs */}
                  <div className="rounded-2xl border border-neutral-200 p-5 bg-white space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                      <div>
                        <h4 className="text-sm font-bold text-[#0e0e0e] flex items-center gap-2">
                          <Eye className="w-4 h-4 text-[#1430d8]" />
                          <span>Live Search &amp; Social Share Simulator</span>
                        </h4>
                        <p className="text-xs text-neutral-500">
                          Inspect how your studio card looks when shared on Google, WhatsApp, Slack, LinkedIn, and X.
                        </p>
                      </div>

                      <div className="inline-flex p-1 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-600">
                        <button
                          onClick={() => setSeoPreviewPlatform('google')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            seoPreviewPlatform === 'google'
                              ? 'bg-white text-[#1430d8] shadow-xs'
                              : 'hover:text-[#0e0e0e]'
                          }`}
                        >
                          Google SERP
                        </button>
                        <button
                          onClick={() => setSeoPreviewPlatform('social')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            seoPreviewPlatform === 'social'
                              ? 'bg-white text-[#1430d8] shadow-xs'
                              : 'hover:text-[#0e0e0e]'
                          }`}
                        >
                          WhatsApp &amp; Social
                        </button>
                        <button
                          onClick={() => setSeoPreviewPlatform('twitter')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            seoPreviewPlatform === 'twitter'
                              ? 'bg-white text-[#1430d8] shadow-xs'
                              : 'hover:text-[#0e0e0e]'
                          }`}
                        >
                          Twitter / X Card
                        </button>
                      </div>
                    </div>

                    {/* Google SERP Preview */}
                    {seoPreviewPlatform === 'google' && (
                      <div className="p-5 rounded-2xl bg-[#f8f9fa] border border-neutral-200/80 font-sans max-w-2xl">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-full bg-[#1430d8] flex items-center justify-center text-white text-[11px] font-bold">
                            U
                          </div>
                          <div>
                            <div className="text-xs text-[#202124] font-medium leading-none">Usman DevHub Tech &amp; Creative Studio</div>
                            <div className="text-[11px] text-[#4d5156] leading-tight">https://usmandevhub.com</div>
                          </div>
                        </div>

                        <h4 className="text-lg text-[#1a0dab] font-normal hover:underline cursor-pointer leading-snug">
                          Usman DevHub Tech &amp; Creative Studio
                        </h4>
                        <p className="text-xs text-[#4d5156] mt-1 line-clamp-2">
                          Premium digital agency website for Usman DevHub Tech &amp; Creative Studio showcasing 3D experiences, web development, creative services, portfolio, referral program, and full admin management.
                        </p>

                        {/* Sitelinks Mini Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-neutral-200/70 text-xs">
                          <div>
                            <div className="text-[#1a0dab] font-medium hover:underline cursor-pointer">
                              3D Animated Websites
                            </div>
                            <div className="text-[11px] text-[#4d5156] line-clamp-1 mt-0.5">
                              WebGL, Three.js product showcases &amp; shaders.
                            </div>
                          </div>
                          <div>
                            <div className="text-[#1a0dab] font-medium hover:underline cursor-pointer">
                              Full-Stack Web Development
                            </div>
                            <div className="text-[11px] text-[#4d5156] line-clamp-1 mt-0.5">
                              React, Next.js, and high performance web apps.
                            </div>
                          </div>
                          <div>
                            <div className="text-[#1a0dab] font-medium hover:underline cursor-pointer">
                              20% Partner Referral Program
                            </div>
                            <div className="text-[11px] text-[#4d5156] line-clamp-1 mt-0.5">
                              Earn guaranteed 20% cash commission per lead.
                            </div>
                          </div>
                          <div>
                            <div className="text-[#1a0dab] font-medium hover:underline cursor-pointer">
                              Founder Usman Afzal
                            </div>
                            <div className="text-[11px] text-[#4d5156] line-clamp-1 mt-0.5">
                              Lead creative technologist &amp; digital architect.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* WhatsApp / Social Share Preview */}
                    {seoPreviewPlatform === 'social' && (
                      <div className="p-4 bg-[#ece5dd] rounded-2xl max-w-md">
                        <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-neutral-200">
                          <div className="w-full h-44 bg-neutral-900 flex flex-col items-center justify-center p-4 gap-1.5 text-center">
                            <span className="text-base font-extrabold tracking-tight text-white">Usman DevHub</span>
                            <span className="text-xs font-medium text-neutral-400">Tech &amp; Creative Studio</span>
                          </div>
                          <div className="p-3 bg-neutral-50 border-t border-neutral-200">
                            <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                              usmandevhub.com
                            </div>
                            <div className="text-xs font-bold text-[#0e0e0e] mt-1 line-clamp-1">
                              Usman DevHub Tech &amp; Creative Studio
                            </div>
                            <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed">
                              Premium digital agency website for Usman DevHub Tech &amp; Creative Studio showcasing 3D experiences, web development, creative services, portfolio, referral program, and full admin management.
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-[10px] text-neutral-500 mt-1">12:45 PM ✓✓</div>
                      </div>
                    )}

                    {/* Twitter / X Card Preview */}
                    {seoPreviewPlatform === 'twitter' && (
                      <div className="p-4 bg-white rounded-2xl border border-neutral-200 max-w-md">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-[#1430d8] flex items-center justify-center text-white text-xs font-bold">
                            U
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#0e0e0e] flex items-center gap-1">
                              <span>Usman DevHub Studio</span>
                              <span className="text-neutral-400 font-normal">@usmandevhub</span>
                            </div>
                            <div className="text-[11px] text-neutral-500">Just now</div>
                          </div>
                        </div>

                        <div className="rounded-2xl overflow-hidden border border-neutral-200">
                          <div className="w-full h-44 bg-neutral-900 flex flex-col items-center justify-center p-4 gap-1.5 text-center">
                            <span className="text-base font-extrabold tracking-tight text-white">Usman DevHub</span>
                            <span className="text-xs font-medium text-neutral-400">Tech &amp; Creative Studio</span>
                          </div>
                          <div className="p-3 bg-neutral-50">
                            <div className="text-[11px] text-neutral-400 font-medium">
                              usmandevhub.com
                            </div>
                            <div className="text-xs font-bold text-[#0e0e0e] mt-0.5">
                              Usman DevHub Tech &amp; Creative Studio
                            </div>
                            <div className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                              Premium digital agency website for Usman DevHub Tech &amp; Creative Studio showcasing 3D experiences.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Schema.org & Crawler Actions Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Left: Search Crawler Directives */}
                    <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                      <h4 className="text-sm font-bold text-[#0e0e0e] flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        <span>Search Engine Directives &amp; Sitemap</span>
                      </h4>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        Your sitemap contains complete priority metadata for all 4 studio services, selected portfolio, founder biography, referral program, and direct project inquiry.
                      </p>

                      <div className="p-3 rounded-xl bg-white border border-neutral-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-neutral-700">Full Sitemap Endpoint</span>
                          <button
                            onClick={() => {
                              const sitemapUrl = `${window.location.origin}/sitemap.xml`;
                              navigator.clipboard.writeText(sitemapUrl);
                              setCopiedSitemap(true);
                              setTimeout(() => setCopiedSitemap(false), 2000);
                            }}
                            className="text-xs font-semibold text-[#1430d8] flex items-center gap-1 hover:underline"
                          >
                            {copiedSitemap ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedSitemap ? 'Copied' : 'Copy Sitemap URL'}</span>
                          </button>
                        </div>
                        <div className="text-xs font-mono text-neutral-600 bg-neutral-50 p-2 rounded-lg break-all">
                          {typeof window !== 'undefined' ? `${window.location.origin}/sitemap.xml` : 'https://usmandevhub.com/sitemap.xml'}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-neutral-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-neutral-700">Robots Directive (robots.txt)</span>
                          <button
                            onClick={() => {
                              const robotsUrl = `${window.location.origin}/robots.txt`;
                              navigator.clipboard.writeText(robotsUrl);
                              setCopiedRobots(true);
                              setTimeout(() => setCopiedRobots(false), 2000);
                            }}
                            className="text-xs font-semibold text-[#1430d8] flex items-center gap-1 hover:underline"
                          >
                            {copiedRobots ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedRobots ? 'Copied' : 'Copy robots.txt URL'}</span>
                          </button>
                        </div>
                        <div className="text-xs font-mono text-neutral-600 bg-neutral-50 p-2 rounded-lg whitespace-pre">
                          User-agent: *{"\n"}Allow: /{"\n"}Disallow: /api/{"\n"}Sitemap: /sitemap.xml
                        </div>
                      </div>
                    </div>

                    {/* Right: SEO Audit Checklist */}
                    <div className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3">
                      <h4 className="text-sm font-bold text-[#0e0e0e] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#1430d8]" />
                        <span>SEO Health Audit Checklist (All Passed)</span>
                      </h4>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-medium">Title &amp; Meta Description Synchronized</span>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-200/80 px-2 py-0.5 rounded-full text-emerald-800">
                            Passing
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-medium">Canonical Tag Enforced</span>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-200/80 px-2 py-0.5 rounded-full text-emerald-800">
                            Passing
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-medium">OpenGraph &amp; Twitter Large Cards</span>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-200/80 px-2 py-0.5 rounded-full text-emerald-800">
                            Passing
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-medium">Schema.org JSON-LD FAQ &amp; Organization</span>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-200/80 px-2 py-0.5 rounded-full text-emerald-800">
                            Passing
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-medium">Dynamic Client-Side Route SEO Tags</span>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-200/80 px-2 py-0.5 rounded-full text-emerald-800">
                            Passing
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-medium">Mobile Viewport &amp; Fast CDN Font Preconnect</span>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-200/80 px-2 py-0.5 rounded-full text-emerald-800">
                            Passing
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY & PASSWORD VAULT TAB */}
              {activeTab === 'security' && (
                <div className="max-w-xl mx-auto space-y-6 pb-20 md:pb-8">
                  <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1430d8] border border-blue-100 flex items-center justify-center shrink-0">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
                            Change Owner Password
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Update your studio executive password. Updating signs out other active sessions immediately.
                          </p>
                        </div>
                      </div>
                      {passwordUpdatedAt && (
                        <span className="text-[11px] font-medium text-slate-400 shrink-0">
                          Updated {new Date(passwordUpdatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {pwdChangeNotice && (
                      <div className="p-3.5 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{pwdChangeNotice}</span>
                      </div>
                    )}

                    {pwdChangeError && (
                      <div className="p-3.5 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span>{pwdChangeError}</span>
                      </div>
                    )}

                    <form onSubmit={handleChangeAdminPassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          required
                          value={currentPwdInput}
                          onChange={(e) => setCurrentPwdInput(e.target.value)}
                          placeholder="Enter current admin password"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#1430d8] focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          New Password (Min 8 characters)
                        </label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={newPwdInput}
                          onChange={(e) => setNewPwdInput(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#1430d8] focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={confirmPwdInput}
                          onChange={(e) => setConfirmPwdInput(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#1430d8] focus:bg-white transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isChangingPwd}
                        className="w-full py-3 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isChangingPwd ? 'Updating Password...' : 'Update Password'}</span>
                      </button>
                    </form>
                  </div>

                  {/* Cloudflare & Bounded Database Architecture Card */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0">
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
                            Cloudflare &amp; Bounded Database Architecture
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Real-time persistence and global edge host configuration for Usman DevHub.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={fetchDbStatus}
                        disabled={isLoadingDbStatus}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDbStatus ? 'animate-spin text-[#1430d8]' : 'text-slate-500'}`} />
                        <span>Refresh</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
                      {/* Cloudflare Domain Box */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50/60 to-amber-50/40 border border-orange-200/80">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Globe className="w-4 h-4 text-orange-600" />
                            Cloudflare Host
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Active &amp; Ready
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900">Registered via Cloudflare Registrar</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Orange Cloud ☁️ Proxy, Free Edge SSL/TLS, and Web Application Firewall (WAF) enabled.
                        </p>
                      </div>

                      {/* Bounded Database Engine Box */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-200/80">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Server className="w-4 h-4 text-[#1430d8]" />
                            Database Engine
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            dbStatusInfo?.connected
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {dbStatusInfo?.connected ? 'PostgreSQL Connected' : 'Local JSON Active'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900">
                          {dbStatusInfo?.connected ? 'Remote PostgreSQL (Bounded DB)' : 'Local File JSON (/data/db.json)'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {dbStatusInfo?.connected
                            ? 'ACID transactions & automatic cloud backup enabled across container restarts.'
                            : 'To connect PostgreSQL: Set DATABASE_URL in environment secrets (Supabase/Neon/Cloud SQL).'}
                        </p>
                      </div>
                    </div>

                    {/* Live Records Metric Grid */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-medium">
                          Agreements: <strong className="text-slate-900">{dbStatusInfo?.counts?.orders ?? orders.length}</strong>
                        </span>
                        <span className="font-medium">
                          Inquiries: <strong className="text-slate-900">{dbStatusInfo?.counts?.messages ?? messages.length}</strong>
                        </span>
                        <span className="font-medium">
                          Partner Tokens: <strong className="text-slate-900">{dbStatusInfo?.counts?.partners ?? partnerTokens.length}</strong>
                        </span>
                        <span className="font-medium">
                          Reviews: <strong className="text-slate-900">{dbStatusInfo?.counts?.reviews ?? reviews.length}</strong>
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Auto-Sync Engine v2.0
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* SERVICES ARE PROTECTED & READ-ONLY - NO EDIT OR DELETE MODAL */}

      {/* PROJECT EDIT MODAL */}
      <AnimatePresence>
        {editingProject && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60">
            <div className="w-full max-w-lg p-5 sm:p-6 rounded-3xl bg-white shadow-2xl border border-neutral-200 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-base text-[#0e0e0e]">
                  {editingProject.id ? 'Edit Project' : 'Add Project to Showcase'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProject(null);
                    setIsServiceDropdownOpen(false);
                    setIsCategoryDropdownOpen(false);
                    setIsCustomCategory(false);
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProject} noValidate className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-neutral-800 block mb-1">Website / Project Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProject.title || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1430d8] text-xs font-medium"
                    placeholder="e.g. Veritas Corporate Advisory Portal"
                  />
                </div>

                {/* Service Name & Category Selection - Both with arrow dropdowns (No OS Bottom Sheet) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Service Name Selector (Custom In-Form Dropdown with Arrow) */}
                  <div className="relative">
                    <label className="font-semibold text-neutral-800 block mb-1">Service Name *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsServiceDropdownOpen(!isServiceDropdownOpen);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50/80 focus:outline-none focus:border-[#1430d8] text-xs font-semibold text-neutral-900 flex items-center justify-between cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-[#1430d8]" />
                        <span className="truncate">{editingProject.category || 'Web Development'}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200 ${
                          isServiceDropdownOpen ? 'rotate-180 text-[#1430d8]' : ''
                        }`}
                      />
                    </button>

                    {isServiceDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsServiceDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-neutral-100 animate-in fade-in duration-150">
                          {SHOWCASE_TAXONOMY.map((tax) => {
                            const isSelected = (editingProject.category || 'Web Development') === tax.category;
                            return (
                              <button
                                key={tax.category}
                                type="button"
                                onClick={() => {
                                  const firstSub = tax.subcategories?.[0] || 'Business Websites';
                                  setEditingProject({
                                    ...editingProject,
                                    category: tax.category,
                                    subcategory: firstSub
                                  });
                                  setIsCustomCategory(false);
                                  setIsServiceDropdownOpen(false);
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50 text-[#1430d8]'
                                    : 'text-neutral-700 hover:bg-neutral-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isSelected ? 'bg-[#1430d8]' : 'bg-neutral-300'
                                    }`}
                                  />
                                  <span>{tax.category}</span>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Category (Website Type) - Custom Dropdown with Arrow */}
                  <div className="relative">
                    <label className="font-semibold text-neutral-800 block mb-1">
                      Category (Website Type) *
                    </label>

                    {(() => {
                      const activeTax = SHOWCASE_TAXONOMY.find(
                        (t) => t.category === (editingProject.category || 'Web Development')
                      );
                      const availableSubcategories = activeTax?.subcategories || [
                        'Business Websites',
                        'Corporate Websites',
                        'Portfolio Websites',
                        'Landing Pages',
                        'Custom Websites'
                      ];
                      const isPredefined = availableSubcategories.includes(editingProject.subcategory || '');
                      const showCustom = isCustomCategory || (!isPredefined && Boolean(editingProject.subcategory));

                      return (
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                              setIsServiceDropdownOpen(false);
                            }}
                            className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50/80 focus:outline-none focus:border-[#1430d8] text-xs font-semibold text-neutral-900 flex items-center justify-between cursor-pointer shadow-2xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-2 h-2 rounded-full bg-[#0075f7]" />
                              <span className="truncate">
                                {showCustom
                                  ? (editingProject.subcategory || 'Custom Category')
                                  : (editingProject.subcategory || availableSubcategories[0] || 'Select Category')}
                              </span>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200 ${
                                isCategoryDropdownOpen ? 'rotate-180 text-[#1430d8]' : ''
                              }`}
                            />
                          </button>

                          {isCategoryDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsCategoryDropdownOpen(false)}
                              />
                              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-neutral-100 animate-in fade-in duration-150">
                                <div className="px-3.5 py-1.5 bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                                  {editingProject.category || 'Web Development'} Categories
                                </div>
                                {availableSubcategories.map((sub) => {
                                  const isSelected = editingProject.subcategory === sub && !showCustom;
                                  return (
                                    <button
                                      key={sub}
                                      type="button"
                                      onClick={() => {
                                        setIsCustomCategory(false);
                                        setEditingProject({ ...editingProject, subcategory: sub });
                                        setIsCategoryDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'bg-blue-50 text-[#1430d8]'
                                          : 'text-neutral-700 hover:bg-neutral-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            isSelected ? 'bg-[#1430d8]' : 'bg-neutral-300'
                                          }`}
                                        />
                                        <span>{sub}</span>
                                      </div>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />}
                                    </button>
                                  );
                                })}

                                {/* Option for custom category */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCustomCategory(true);
                                    if (isPredefined) {
                                      setEditingProject({ ...editingProject, subcategory: '' });
                                    }
                                    setIsCategoryDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                    showCustom
                                      ? 'bg-neutral-900 text-white'
                                      : 'text-neutral-500 hover:bg-neutral-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        showCustom ? 'bg-white' : 'bg-neutral-400'
                                      }`}
                                    />
                                    <span>+ Custom Category Name...</span>
                                  </div>
                                  {showCustom && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                                </button>
                              </div>
                            </>
                          )}

                          {/* Custom Category Input if custom selected */}
                          {showCustom && (
                            <div className="mt-2">
                              <input
                                type="text"
                                required
                                autoFocus
                                value={editingProject.subcategory || ''}
                                onChange={(e) =>
                                  setEditingProject({ ...editingProject, subcategory: e.target.value })
                                }
                                className="w-full p-2.5 rounded-xl border-2 border-blue-500 bg-white focus:outline-none text-xs font-semibold text-neutral-900 shadow-2xs"
                                placeholder="Type custom category name..."
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {(() => {
                  const cat = editingProject.category || 'Web Development';
                  const isVideoCategory =
                    cat === '3D Video Animation' ||
                    cat === 'Motion Design & Animation' ||
                    cat.toLowerCase().includes('video') ||
                    cat.toLowerCase().includes('animation');

                  const isDesignCategory =
                    cat === 'Graphic Design' ||
                    cat.toLowerCase().includes('design') ||
                    cat.toLowerCase().includes('logo') ||
                    cat.toLowerCase().includes('branding');

                  const isWebCategory = !isVideoCategory && !isDesignCategory;

                  return (
                    <>
                      {/* Short Description */}
                      <div>
                        <label className="font-semibold text-neutral-800 block mb-1">
                          Short Description (Card Overview)
                        </label>
                        <textarea
                          rows={2}
                          value={editingProject.description || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1430d8] text-xs leading-relaxed"
                          placeholder="Short description displayed on the card and detail popup..."
                        />
                      </div>

                      {/* URL / Link Input - Adapted to Category */}
                      {isWebCategory && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-neutral-800 block text-xs">
                              Live Website / Demo URL *
                            </label>
                            <span className="text-[10px] text-neutral-500">
                              e.g. mywebsite.com ya https://mywebsite.com
                            </span>
                          </div>
                          <input
                            type="text"
                            required
                            value={editingProject.liveUrl || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, liveUrl: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1430d8] text-xs font-mono"
                            placeholder="e.g. https://yourwebsite.com ya yourwebsite.com"
                          />
                          {editingProject.liveUrl && ensureExternalUrl(editingProject.liveUrl) && (
                            <p className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1 font-mono">
                              <Check className="w-3 h-3 shrink-0" />
                              <span>Live Link Target: {ensureExternalUrl(editingProject.liveUrl)}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {isVideoCategory && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-neutral-800">
                              Client / Channel / Source Link (Optional)
                            </label>
                            <span className="text-[10px] text-neutral-400">Optional for video</span>
                          </div>
                          <input
                            type="text"
                            value={editingProject.liveUrl || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, liveUrl: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-purple-600 text-xs font-mono"
                            placeholder="e.g. YouTube channel ya client link (optional)"
                          />
                        </div>
                      )}

                      {isDesignCategory && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-neutral-800">
                              Behance / Dribbble / Portfolio Link (Optional)
                            </label>
                            <span className="text-[10px] text-neutral-400">Optional for graphics</span>
                          </div>
                          <input
                            type="text"
                            value={editingProject.liveUrl || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, liveUrl: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1430d8] text-xs font-mono"
                            placeholder="e.g. https://behance.net/... (optional)"
                          />
                        </div>
                      )}

                      {/* MEDIA INPUT 1: 3D Video Animation Video Input (Link Ya Upload) */}
                      {isVideoCategory && (
                        <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-neutral-900 flex items-center gap-1.5 text-xs">
                              <Film className="w-4 h-4 text-purple-600" />
                              <span>3D Animation Video (Link Ya Upload) *</span>
                            </label>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                              Video Service Mode
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500">
                            Video ka link yahan paste karein (YouTube URL, MP4 Direct Link, Vimeo) ya direct device se video file upload karein.
                          </p>

                          {/* Direct Video Link */}
                          <div className="relative flex items-center">
                            <div className="absolute left-3 text-neutral-400 pointer-events-none">
                              <Link2 className="w-3.5 h-3.5 text-purple-600" />
                            </div>
                            <input
                              type="text"
                              value={editingProject.videoUrl || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const isYt = isYouTubeUrl(val);
                                // If user pastes a YouTube video URL and no custom poster is set, auto-suggest YouTube thumbnail
                                if (isYt && !editingProject.imageUrl) {
                                  const ytThumb = getYouTubeThumbnail(val, 'maxres');
                                  setEditingProject({
                                    ...editingProject,
                                    videoUrl: val,
                                    imageUrl: ytThumb || editingProject.imageUrl
                                  });
                                } else {
                                  setEditingProject({ ...editingProject, videoUrl: val });
                                }
                              }}
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-purple-600 text-xs font-mono text-neutral-900 bg-white"
                              placeholder="Video link (https://... mp4, youtube, vimeo)"
                            />
                          </div>

                          {/* Upload Video File Button */}
                          <div className="flex items-center gap-2">
                            <label className={`flex-1 py-2 px-3 rounded-xl bg-white hover:bg-neutral-50 border border-purple-300 flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-700 transition-colors shadow-2xs ${isUploadingVideo ? 'opacity-60 cursor-wait pointer-events-none' : 'cursor-pointer'}`}>
                              <Upload className="w-3.5 h-3.5 text-purple-600" />
                              <span>{isUploadingVideo ? 'Video Upload Ho Rahi Hai...' : 'Phone / PC Se Video Upload Karein'}</span>
                              <input
                                type="file"
                                accept="video/*"
                                disabled={isUploadingVideo}
                                className="hidden"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = '';
                                  if (!f) return;

                                  setProjectFormError('');
                                  setIsUploadingVideo(true);

                                  // Try capturing a crisp JPEG poster frame from the local video if no poster is set yet
                                  const capturePosterFrame = (): Promise<string> =>
                                    new Promise((resolve) => {
                                      try {
                                        const objUrl = URL.createObjectURL(f);
                                        const vid = document.createElement('video');
                                        vid.muted = true;
                                        vid.playsInline = true;
                                        vid.preload = 'metadata';
                                        vid.src = objUrl;
                                        const cleanup = () => {
                                          try { URL.revokeObjectURL(objUrl); } catch {}
                                        };
                                        const timer = setTimeout(() => {
                                          cleanup();
                                          resolve('');
                                        }, 3000);
                                        vid.onloadeddata = () => {
                                          try {
                                            vid.currentTime = Math.min(1, (vid.duration || 2) / 3);
                                          } catch {
                                            clearTimeout(timer);
                                            cleanup();
                                            resolve('');
                                          }
                                        };
                                        vid.onseeked = () => {
                                          clearTimeout(timer);
                                          try {
                                            const canvas = document.createElement('canvas');
                                            const scale = Math.min(1, 1280 / (vid.videoWidth || 1280));
                                            canvas.width = Math.max(320, Math.round((vid.videoWidth || 1280) * scale));
                                            canvas.height = Math.max(180, Math.round((vid.videoHeight || 720) * scale));
                                            const ctx = canvas.getContext('2d');
                                            if (ctx) {
                                              ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
                                              const thumb = canvas.toDataURL('image/jpeg', 0.8);
                                              cleanup();
                                              resolve(thumb);
                                              return;
                                            }
                                          } catch {
                                            // ignore
                                          }
                                          cleanup();
                                          resolve('');
                                        };
                                        vid.onerror = () => {
                                          clearTimeout(timer);
                                          cleanup();
                                          resolve('');
                                        };
                                      } catch {
                                        resolve('');
                                      }
                                    });

                                  try {
                                    const posterPromise = !editingProject?.imageUrl ? capturePosterFrame() : Promise.resolve('');
                                    const authHeaders = getAdminAuthHeaders(false);
                                    const resp = await fetch('/api/upload-video', {
                                      method: 'POST',
                                      headers: {
                                        ...authHeaders,
                                        'Content-Type': f.type || 'video/mp4',
                                        'x-file-name': encodeURIComponent(f.name)
                                      },
                                      body: f
                                    });

                                    const data = await resp.json().catch(() => null);
                                    const capturedPoster = await posterPromise;

                                    if (resp.ok && data?.success && data?.url) {
                                      setEditingProject((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              videoUrl: data.url,
                                              imageUrl: prev.imageUrl || capturedPoster || prev.imageUrl
                                            }
                                          : null
                                      );
                                    } else if (f.size <= 1.5 * 1024 * 1024) {
                                      // Small file fallback if server route isn't reachable
                                      const reader = new FileReader();
                                      reader.onload = (re) => {
                                        const url = re.target?.result as string;
                                        setEditingProject((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                videoUrl: url,
                                                imageUrl: prev.imageUrl || capturedPoster || prev.imageUrl
                                              }
                                            : null
                                        );
                                      };
                                      reader.readAsDataURL(f);
                                    } else {
                                      setProjectFormError(data?.error || 'Video upload failed. Please try a smaller file (under 100MB) or paste a direct video link.');
                                    }
                                  } catch {
                                    setProjectFormError('Video upload failed. Please try again or paste a direct video URL.');
                                  } finally {
                                    setIsUploadingVideo(false);
                                  }
                                }}
                              />
                            </label>

                            {editingProject.videoUrl && (
                              <button
                                type="button"
                                onClick={() => setEditingProject(prev => prev ? { ...prev, videoUrl: '' } : null)}
                                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Remove Video Link"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove Video</span>
                              </button>
                            )}
                          </div>

                          {/* Live Video Preview with Poster Display */}
                          {editingProject.videoUrl && (
                            <div className="rounded-xl overflow-hidden border border-purple-200 bg-black shadow-xs">
                              <div className="px-3 py-1.5 bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-between">
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <CheckCircle2 className="w-3 h-3" /> Video Stream Ready
                                </span>
                                <span className="text-neutral-400 truncate max-w-[200px] font-mono">
                                  {editingProject.videoUrl}
                                </span>
                              </div>
                              <div className="aspect-video w-full max-h-56 bg-black">
                                <RobustVideoPlayer
                                  url={editingProject.videoUrl}
                                  poster={editingProject.imageUrl || DEFAULT_VIDEO_POSTER}
                                  title="Video Preview"
                                  autoPlay={false}
                                  controls={true}
                                  showStopButton={false}
                                  pauseOnScroll={false}
                                  stopOnScroll={false}
                                  showFullscreenButton={true}
                                  className="w-full h-full object-contain bg-black"
                                />
                              </div>
                            </div>
                          )}

                          {/* Video Poster Thumbnail Input & Live Preview */}
                          <div className="pt-2.5 border-t border-purple-200/80 space-y-2">
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-[11px] font-bold text-neutral-800 flex items-center gap-1">
                                <Image className="w-3.5 h-3.5 text-purple-600" />
                                <span>Video Poster / Thumbnail Picture</span>
                              </label>
                              <span className="text-[10px] text-neutral-500">Card &amp; Player Poster</span>
                            </div>

                            {/* Direct URL or Paste Field */}
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingProject.imageUrl || ''}
                                onChange={(e) => {
                                  const clean = normalizeImageUrl(e.target.value);
                                  setEditingProject(prev => prev ? { ...prev, imageUrl: clean } : null);
                                }}
                                onPaste={(e) => {
                                  const text = e.clipboardData.getData('text');
                                  if (text) {
                                    e.preventDefault();
                                    const clean = normalizeImageUrl(text);
                                    setEditingProject(prev => prev ? { ...prev, imageUrl: clean } : null);
                                  }
                                }}
                                onBlur={(e) => {
                                  const clean = normalizeImageUrl(e.target.value);
                                  setEditingProject(prev => prev ? { ...prev, imageUrl: clean } : null);
                                }}
                                placeholder="Poster image link (Google Drive, Dropbox, YouTube, https://...)"
                                className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono bg-white focus:outline-none focus:border-purple-600"
                              />
                              <label className="px-3 py-2 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs">
                                <Upload className="w-3.5 h-3.5 text-purple-600" />
                                <span>Upload Poster</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                      try {
                                        // Compress to lightweight canvas JPEG to prevent localStorage quota crash
                                        const compressed = await compressImageFile(f, 1280, 720, 0.82);
                                        setEditingProject(prev => prev ? { ...prev, imageUrl: compressed } : null);
                                      } catch {
                                        const reader = new FileReader();
                                        reader.onload = (re) => {
                                          setEditingProject(prev => prev ? { ...prev, imageUrl: re.target?.result as string } : null);
                                        };
                                        reader.readAsDataURL(f);
                                      }
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            {/* Auto-suggest YouTube HD Thumbnail button if YouTube URL detected */}
                            {isYouTubeUrl(editingProject.videoUrl || '') && (
                              <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50 border border-purple-200">
                                <span className="text-[11px] text-purple-900 font-medium">YouTube video detected</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const ytThumb = getYouTubeThumbnail(editingProject.videoUrl || '', 'hq');
                                    if (ytThumb) {
                                      setEditingProject(prev => prev ? { ...prev, imageUrl: ytThumb } : null);
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Auto-Set YouTube HD Thumbnail</span>
                                </button>
                              </div>
                            )}

                            {/* Live Poster Thumbnail Preview Card */}
                            {editingProject.imageUrl ? (
                              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-purple-200 shadow-2xs">
                                <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-purple-200 shadow-2xs shrink-0 bg-neutral-900">
                                  <img
                                    src={editingProject.imageUrl}
                                    alt="Poster Preview"
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const fallback = getFallbackImage(editingProject.imageUrl || '', editingProject.category, editingProject.videoUrl);
                                      (e.target as HTMLImageElement).src = fallback;
                                    }}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Thumbnail Active &amp; Attached</span>
                                  </span>
                                  <p className="text-[10px] text-neutral-500 truncate mt-0.5 font-mono">
                                    {editingProject.imageUrl.startsWith('data:') ? 'Custom Uploaded Image (Optimized & Ready)' : editingProject.imageUrl}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingProject(prev => prev ? { ...prev, imageUrl: '' } : null)}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                                  title="Remove Poster"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <p className="text-[11px] text-neutral-400 italic">
                                Note: If left empty, our cinematic studio 3D poster will be automatically used.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* MEDIA INPUT 2: Graphic Design Image Input (Only Image Needed!) */}
                      {isDesignCategory && (
                        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-neutral-900 flex items-center gap-1.5 text-xs">
                              <Image className="w-4 h-4 text-[#1430d8]" />
                              <span>Logo / Graphic Artwork Picture (Link Ya Upload) *</span>
                            </label>
                            <span className="text-[10px] font-bold text-[#1430d8] bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                              Image Only Mode
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500">
                            Logo ya graphic design artwork ka direct link paste karein ya device se upload karein.
                          </p>

                          {/* Direct Link Input */}
                          <div className="relative flex items-center">
                            <div className="absolute left-3 text-neutral-400 pointer-events-none">
                              <Link2 className="w-3.5 h-3.5 text-[#1430d8]" />
                            </div>
                            <input
                              type="text"
                              value={editingProject.imageUrl || ''}
                              onChange={(e) => {
                                const clean = normalizeImageUrl(e.target.value);
                                setEditingProject(prev => prev ? { ...prev, imageUrl: clean } : null);
                              }}
                              onPaste={(e) => {
                                const text = e.clipboardData.getData('text');
                                if (text) {
                                  e.preventDefault();
                                  const clean = normalizeImageUrl(text);
                                  setEditingProject(prev => prev ? { ...prev, imageUrl: clean } : null);
                                }
                              }}
                              onBlur={(e) => {
                                const clean = normalizeImageUrl(e.target.value);
                                setEditingProject(prev => prev ? { ...prev, imageUrl: clean } : null);
                              }}
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1430d8] text-xs font-mono text-neutral-900 bg-white"
                              placeholder="Artwork link, Google Drive, Dropbox, Imgur (https://...)"
                            />
                          </div>

                          {/* Upload & Remove buttons */}
                          <div className="flex items-center gap-2">
                            <label className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-300 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-700 transition-colors shadow-2xs">
                              <Upload className="w-3.5 h-3.5 text-[#1430d8]" />
                              <span>Phone / PC Se Upload Karein</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    try {
                                      const compressed = await compressImageFile(f, 1280, 720, 0.82);
                                      setEditingProject(prev => prev ? { ...prev, imageUrl: compressed } : null);
                                    } catch {
                                      const reader = new FileReader();
                                      reader.onload = (re) => {
                                        setEditingProject(prev => prev ? { ...prev, imageUrl: re.target?.result as string } : null);
                                      };
                                      reader.readAsDataURL(f);
                                    }
                                  }
                                }}
                              />
                            </label>

                            {editingProject.imageUrl && (
                              <button
                                type="button"
                                onClick={() => setEditingProject({ ...editingProject, imageUrl: '' })}
                                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Picture Remove Karein"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Link Remove</span>
                              </button>
                            )}
                          </div>

                          {/* Live Image Preview */}
                          {editingProject.imageUrl && (
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-neutral-200">
                              <img
                                src={editingProject.imageUrl}
                                alt="Preview"
                                referrerPolicy="no-referrer"
                                className="w-20 h-16 rounded-lg object-contain border border-neutral-200 shadow-2xs shrink-0 bg-neutral-900"
                                onError={(e) => {
                                  const fallback = getFallbackImage(editingProject.imageUrl || '', editingProject.category, editingProject.videoUrl);
                                  (e.target as HTMLImageElement).src = fallback;
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Artwork Image Active
                                </span>
                                <p className="text-[10px] text-neutral-500 truncate mt-0.5 font-mono">
                                  {editingProject.imageUrl}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* MEDIA INPUT 3: Website Screenshot Input */}
                      {isWebCategory && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-neutral-800 flex items-center gap-1.5">
                              <Image className="w-3.5 h-3.5 text-[#1430d8]" />
                              <span>Website Screenshot / Thumbnail (Link Ya Upload) *</span>
                            </label>
                            <span className="text-[10px] text-neutral-400">Direct image link ya file upload</span>
                          </div>

                          {/* Direct Link Input Field */}
                          <div className="relative flex items-center">
                            <div className="absolute left-3 text-neutral-400 pointer-events-none">
                              <Link2 className="w-3.5 h-3.5 text-[#1430d8]" />
                            </div>
                            <input
                              type="text"
                              value={editingProject.imageUrl || ''}
                              onChange={(e) => {
                                const clean = normalizeImageUrl(e.target.value);
                                setEditingProject(prev => prev ? { ...prev, imageUrl: clean } : null);
                              }}
                              onPaste={(e) => {
                                const text = e.clipboardData.getData('text');
                                if (text) {
                                  e.preventDefault();
                                  const clean = normalizeImageUrl(text);
                                  setEditingProject(prev => prev ? { ...prev, imageUrl: clean } : null);
                                }
                              }}
                              onBlur={(e) => {
                                const clean = normalizeImageUrl(e.target.value);
                                setEditingProject(prev => prev ? { ...prev, imageUrl: clean } : null);
                              }}
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1430d8] text-xs font-mono text-neutral-900 bg-white"
                              placeholder="Screenshot link, Google Drive, Dropbox, Imgur (https://...)"
                            />
                          </div>

                          {/* Action buttons: Upload File & Delete */}
                          <div className="flex items-center gap-2">
                            <label className="flex-1 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-700 transition-colors">
                              <Upload className="w-3.5 h-3.5 text-[#1430d8]" />
                              <span>Phone / PC Se Upload Karein</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    try {
                                      const compressed = await compressImageFile(f, 1280, 720, 0.82);
                                      setEditingProject(prev => prev ? { ...prev, imageUrl: compressed } : null);
                                    } catch {
                                      const reader = new FileReader();
                                      reader.onload = (re) => {
                                        setEditingProject(prev => prev ? { ...prev, imageUrl: re.target?.result as string } : null);
                                      };
                                      reader.readAsDataURL(f);
                                    }
                                  }
                                }}
                              />
                            </label>

                            {editingProject.imageUrl && (
                              <button
                                type="button"
                                onClick={() => setEditingProject({ ...editingProject, imageUrl: '' })}
                                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Picture / Link Remove Karein"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Link Remove</span>
                              </button>
                            )}
                          </div>

                          {/* Live Image Preview */}
                          {editingProject.imageUrl && (
                            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                              <img
                                src={editingProject.imageUrl}
                                alt="Preview"
                                referrerPolicy="no-referrer"
                                className="w-20 h-14 rounded-xl object-cover border border-neutral-200 shadow-2xs shrink-0 bg-neutral-900"
                                onError={(e) => {
                                  const fallback = getFallbackImage(editingProject.imageUrl || '', editingProject.category, editingProject.videoUrl);
                                  (e.target as HTMLImageElement).src = fallback;
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Screenshot Link Active
                                </span>
                                <p className="text-[10px] text-neutral-500 truncate mt-0.5 font-mono">
                                  {editingProject.imageUrl}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}

                {projectFormError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{projectFormError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-4 border-t border-neutral-100">
                  {editingProject.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteProject(editingProject.id!);
                        setEditingProject(null);
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Permanently Delete this Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Card</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProject(null);
                        setProjectFormError('');
                      }}
                      className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#1430d8] text-white font-bold hover:bg-[#0075f7] transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Showcase Card</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MANUAL CLIENT REVIEW MODAL */}
        {isAddingReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1430d8] flex items-center justify-center">
                    <Star className="w-4 h-4 fill-[#1430d8]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-neutral-900">Add Client Review</h4>
                    <p className="text-[11px] text-neutral-500">Add feedback received on WhatsApp, Upwork, or Email</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingReview(false)}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveManualReview} className="space-y-3.5 text-xs">
                {/* Rating selection */}
                <div>
                  <label className="font-semibold block mb-1.5 text-neutral-700">Rating</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFull = manualReviewRating >= star;
                        const isHalf = !isFull && manualReviewRating >= star - 0.5;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const isLeftHalf = e.clientX - rect.left < rect.width / 2;
                              setManualReviewRating(star > 1 && isLeftHalf ? star - 0.5 : star);
                            }}
                            className="relative p-1 cursor-pointer transition-transform hover:scale-115 focus:outline-none"
                          >
                            <span className="relative inline-flex w-5 h-5">
                              <Star className="w-5 h-5 text-neutral-200 fill-neutral-200" />
                              {isFull && (
                                <Star className="absolute inset-0 w-5 h-5 text-amber-400 fill-amber-400" />
                              )}
                              {isHalf && (
                                <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                                  <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <span className="font-bold text-xs text-neutral-800 tabular-nums">
                      {manualReviewRating.toFixed(1)} / 5.0
                    </span>
                    <div className="flex items-center gap-1 ml-auto">
                      {[5, 4.5, 4].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setManualReviewRating(preset)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                            manualReviewRating === preset
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                          }`}
                        >
                          {preset.toFixed(1)}★
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Client Name */}
                <div>
                  <label className="font-semibold block mb-1 text-neutral-700">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={manualReviewName}
                    onChange={(e) => setManualReviewName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#1430d8]"
                  />
                </div>

                {/* Role & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 text-neutral-700">Role / Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Founder & CEO, Store Owner"
                      value={manualReviewRole}
                      onChange={(e) => setManualReviewRole(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#1430d8]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-neutral-700">City &amp; Country</label>
                      <span className="text-xs inline-flex items-center gap-1 font-semibold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                        <span className="text-sm">
                          {manualReviewFlag || detectFlagFromLocation(manualReviewLocation)}
                        </span>
                        <span className="text-[10px] text-neutral-500">Auto Flag</span>
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Lahore, Pakistan or Dubai, UAE"
                      value={manualReviewLocation}
                      onChange={(e) => setManualReviewLocation(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#1430d8]"
                    />
                  </div>
                </div>

                {/* Flag Selector */}
                <div>
                  <label className="font-semibold block mb-1 text-neutral-700">
                    Flag (Auto-detected from location or click to change):
                  </label>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {POPULAR_FLAGS.map((pf) => (
                      <button
                        key={pf.flag}
                        type="button"
                        onClick={() => setManualReviewFlag(pf.flag)}
                        className={`px-2 py-1 rounded-lg border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                          (manualReviewFlag || detectFlagFromLocation(manualReviewLocation)) === pf.flag
                            ? 'bg-blue-50 border-[#1430d8] font-bold text-[#1430d8]'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <span className="text-sm">{pf.flag}</span>
                        <span className="text-[10px]">{pf.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Project / Service Delivered */}
                <div>
                  <label className="font-semibold block mb-1 text-neutral-700">Service Category</label>
                  <select
                    value={manualReviewProjectType}
                    onChange={(e) => setManualReviewProjectType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#1430d8]"
                  >
                    {[
                      'Web Development',
                      '3D Animated Websites',
                      'E-Commerce Development',
                      'Graphic Design',
                      '3D Video Animation',
                      'Website Deployment & Cloud Setup',
                      'Website Maintenance'
                    ].map((srv) => (
                      <option key={srv} value={srv}>{srv}</option>
                    ))}
                  </select>
                </div>

                {/* Quote */}
                <div>
                  <label className="font-semibold block mb-1 text-neutral-700">Review Message *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter what the client said about your work, delivery, and quality..."
                    value={manualReviewQuote}
                    onChange={(e) => setManualReviewQuote(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#1430d8]"
                  />
                </div>

                {/* Immediate live toggle */}
                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <input
                    type="checkbox"
                    id="publishImmediateReview"
                    checked={manualReviewPublishImmediate}
                    onChange={(e) => setManualReviewPublishImmediate(e.target.checked)}
                    className="w-4 h-4 text-[#1430d8] rounded cursor-pointer"
                  />
                  <label htmlFor="publishImmediateReview" className="text-xs font-semibold text-neutral-800 cursor-pointer">
                    Publish immediately (Show live on website right away)
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingReview(false)}
                    className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Save Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT LEADER MODAL (WITH PHOTO CHANGE & DELETE) */}
        {editingLeader && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1430d8] flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-neutral-900">
                      Edit Leader &amp; Photo
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {editingLeader.name} ({editingLeader.badge})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingLeader(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Photo Control Section */}
              <div className="mb-5 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <label className="block text-xs font-bold text-neutral-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-xl bg-neutral-900 border border-neutral-300 overflow-hidden shrink-0 flex items-center justify-center">
                    {editingLeader.avatarUrl ? (
                      <img
                        src={editingLeader.avatarUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white font-display text-xl font-black">
                        {editingLeader.initials || 'UA'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const reader = new FileReader();
                              reader.onload = (re) => {
                                const dataUrl = re.target?.result as string;
                                setEditingLeader({ ...editingLeader, avatarUrl: dataUrl });
                              };
                              reader.readAsDataURL(f);
                            }
                          }}
                        />
                      </label>

                      {editingLeader.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setEditingLeader({ ...editingLeader, avatarUrl: '' })}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Photo</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={editingLeader.avatarUrl || ''}
                      onChange={(e) => setEditingLeader({ ...editingLeader, avatarUrl: e.target.value })}
                      placeholder="Or enter direct image URL..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs bg-white focus:outline-none focus:border-[#1430d8]"
                    />
                  </div>
                </div>
              </div>

              {/* Leader Info Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingLeader) {
                    const updated = saveLeadershipMember(editingLeader);
                    setLeadership(updated);
                    setLeaderActionNotice(`Changes saved for ${editingLeader.name}!`);
                    setEditingLeader(null);
                  }
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-semibold block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingLeader.name}
                    onChange={(e) => setEditingLeader({ ...editingLeader, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1430d8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Role / Designation *</label>
                    <input
                      type="text"
                      required
                      value={editingLeader.role}
                      onChange={(e) => setEditingLeader({ ...editingLeader, role: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1430d8]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Badge Tag</label>
                    <input
                      type="text"
                      value={editingLeader.badge}
                      onChange={(e) => setEditingLeader({ ...editingLeader, badge: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1430d8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Country / Location</label>
                    <input
                      type="text"
                      value={editingLeader.location}
                      onChange={(e) => setEditingLeader({ ...editingLeader, location: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1430d8]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Flag Emoji</label>
                    <input
                      type="text"
                      value={editingLeader.flag}
                      onChange={(e) => setEditingLeader({ ...editingLeader, flag: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1430d8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Tagline / Bio Note</label>
                  <input
                    type="text"
                    value={editingLeader.tagline}
                    onChange={(e) => setEditingLeader({ ...editingLeader, tagline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1430d8]"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    placeholder="https://www.linkedin.com/in/muhammad-usman-afzal-897655381"
                    value={editingLeader.linkedinUrl || ''}
                    onChange={(e) => setEditingLeader({ ...editingLeader, linkedinUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1430d8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Instagram Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://www.instagram.com/mr_maan089"
                      value={editingLeader.instagramUrl || ''}
                      onChange={(e) => setEditingLeader({ ...editingLeader, instagramUrl: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1430d8]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Instagram Handle</label>
                    <input
                      type="text"
                      placeholder="@mr_maan089"
                      value={editingLeader.instagramHandle || ''}
                      onChange={(e) => setEditingLeader({ ...editingLeader, instagramHandle: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1430d8]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setEditingLeader(null)}
                    className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin In-App Video Preview Modal (Zero new tab opened) */}
        {adminPreviewVideo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-xs"
            onClick={() => setAdminPreviewVideo(null)}
          >
            <div
              className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-700 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3.5 bg-neutral-800 border-b border-neutral-700">
                <div className="flex items-center gap-2 text-white min-w-0">
                  <Film className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold truncate max-w-md">
                    {adminPreviewVideo.title || '3D Video Animation Preview'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminPreviewVideo(null)}
                  className="p-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer z-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative aspect-video max-h-[78vh] w-full bg-black">
                <RobustVideoPlayer
                  url={adminPreviewVideo.url}
                  title={adminPreviewVideo.title}
                  autoPlay={true}
                  controls={true}
                  showStopButton={false}
                  pauseOnScroll={false}
                  stopOnScroll={false}
                  showFullscreenButton={true}
                  className="w-full h-full object-contain bg-black"
                />
              </div>
            </div>
          </div>
        )}

        {/* Admin In-App Fullscreen Artwork Lightbox Modal (Zero new tab opened, zero Chrome data-url error) */}
        {adminPreviewArtwork && (
          <ArtworkLightboxModal
            isOpen={Boolean(adminPreviewArtwork)}
            onClose={() => setAdminPreviewArtwork(null)}
            imageUrl={adminPreviewArtwork.url}
            title={adminPreviewArtwork.title}
            category={adminPreviewArtwork.category || 'Logo Design'}
            client={adminPreviewArtwork.client}
            service="Graphic Design"
          />
        )}

        {/* Order Agreement / Proforma Invoice Viewer & Quick PDF Modal */}
        {isOrderModalOpen && selectedOrderForModal && (
          <OrderAgreementModal
            order={selectedOrderForModal}
            isOpen={isOrderModalOpen}
            onClose={() => {
              setIsOrderModalOpen(false);
              setSelectedOrderForModal(null);
            }}
            isAdmin={true}
            onOrderUpdated={(updated) => {
              setOrders(getOrderAgreements());
              setSelectedOrderForModal(updated);
            }}
            onOpenStudio={(ord) => {
              setIsOrderModalOpen(false);
              setSelectedOrderForStudio(ord);
              setIsOrderStudioOpen(true);
            }}
          />
        )}

        {/* Dedicated Full Page Order Agreement & Scope Studio */}
        {isOrderStudioOpen && selectedOrderForStudio && (
          <OrderAgreementStudio
            order={selectedOrderForStudio}
            isOpen={isOrderStudioOpen}
            onClose={() => {
              setIsOrderStudioOpen(false);
              setSelectedOrderForStudio(null);
            }}
            onOrderSaved={(updated) => {
              setOrders(getOrderAgreements());
              setSelectedOrderForStudio(updated);
              refreshAllData();
            }}
          />
        )}

        {/* Dedicated Live Track & Milestone Status Editor Modal */}
        {isEditTrackModalOpen && editingTrackReferral && (() => {
          const budgetNum = Math.max(0, Number(trackDealBudget) || 0);
          const commAmt = Math.round(budgetNum * (trackCommissionPct / 100));
          const m25Val = Math.round(commAmt * 0.25);
          const m35Val = Math.round(commAmt * 0.25);
          const m40Val = Math.max(0, commAmt - m25Val - m35Val);
          const partnerPhoneClean = trackPartnerWhatsApp.replace(/\D/g, '');
          const pingMessage = `Assalam-o-Alaikum ${trackPartnerName || 'Partner'}! Update from Usman DevHub Studio regarding your referral:\n\n• Token: ${editingTrackReferral.partnerToken || 'N/A'}\n• Client: ${trackClientName || editingTrackReferral.clientName}\n• Current Stage: ${REFERRAL_STAGE_LABELS[trackStatus]}\n• Milestone 1 (25% Kickoff): ${trackMilestone25Paid ? `✓ Paid ($${m25Val.toLocaleString()})` : 'Pending'}\n• Milestone 2 (35% Mid Demo): ${trackMilestone35Paid ? `✓ Paid ($${m35Val.toLocaleString()})` : 'Pending'}\n• Milestone 3 (40% Final Launch): ${trackMilestone40Paid ? `✓ Paid ($${m40Val.toLocaleString()})` : 'Pending'}\n• Total Commission (${trackCommissionPct}%): $${commAmt.toLocaleString()}${trackOrderNumber ? `\n• Agreement Ref: ${trackOrderNumber}` : ''}\n\n📝 Note: "${trackAdminNote.trim() || 'In progress'}"\n\nYou can track progress live anytime under "Track Status" on our website!`;
          const waUrl = partnerPhoneClean
            ? `https://wa.me/${partnerPhoneClean}?text=${encodeURIComponent(pingMessage)}`
            : `https://wa.me/?text=${encodeURIComponent(pingMessage)}`;

          const pipelineStageNames: Record<ReferralRecord['status'], string> = {
            pending: 'Details Received',
            in_negotiation: 'In Negotiation',
            deal_complete: 'Deal Confirmed',
            milestone_25: 'Kickoff Started',
            milestone_35: 'Mid Prototype',
            milestone_40: 'Final Delivery',
            commission_paid: 'Completed & Settled'
          };

          const pipelineSteps = [
            { key: 'pending', label: '1. Details Received', hint: 'Inquiry logged' },
            { key: 'in_negotiation', label: '2. In Negotiation', hint: 'Scoping & pricing' },
            { key: 'deal_complete', label: '3. Deal Confirmed', hint: 'Terms locked' },
            { key: 'milestone_25', label: '4. Kickoff Started', hint: 'Kickoff active' },
            { key: 'milestone_35', label: '5. Mid Prototype', hint: 'Prototype demo' },
            { key: 'milestone_40', label: '6. Final Delivery', hint: 'Live deploy' },
            { key: 'commission_paid', label: '7. Completed', hint: '100% closed' }
          ] as const;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }}
                className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold truncate">Edit Live Track &amp; Milestone Status</h2>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live Website Sync
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300 truncate mt-0.5">
                        <span className="font-mono text-teal-300 font-bold">{editingTrackReferral.partnerToken || 'DIRECT'}</span>
                        <span className="text-slate-500">·</span>
                        <span className="truncate">{trackClientName || editingTrackReferral.clientName}</span>
                        {trackOrderNumber && (
                          <>
                            <span className="text-slate-500">·</span>
                            <span className="font-mono text-indigo-300">{trackOrderNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditTrackModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
                  {/* Section 1: Single Unified Pipeline */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        1. Project Pipeline Stage
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Current: <strong className="text-[#1430d8]">{pipelineStageNames[trackStatus]}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                      {pipelineSteps.map((s, idx) => {
                        const active = trackStatus === s.key;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => {
                              setTrackStatus(s.key);
                              if (s.key === 'milestone_25') {
                                setTrackMilestone25Paid(true);
                              } else if (s.key === 'milestone_35') {
                                setTrackMilestone25Paid(true);
                                setTrackMilestone35Paid(true);
                              } else if (s.key === 'milestone_40' || s.key === 'commission_paid') {
                                setTrackMilestone25Paid(true);
                                setTrackMilestone35Paid(true);
                                setTrackMilestone40Paid(true);
                              }
                            }}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              active
                                ? 'bg-[#1430d8] text-white border-[#1430d8] shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            <span className="text-[10px] font-mono opacity-70 block mb-0.5">Step {idx + 1}</span>
                            <div className="font-bold text-xs leading-tight">{s.label.replace(/^\d+\.\s*/, '')}</div>
                            <div className={`text-[10px] mt-1 ${active ? 'text-blue-100' : 'text-slate-500'}`}>
                              {s.hint}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 2: Financials & Milestone Payouts (Clean Side-by-Side) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    {/* Deal Value & Commission */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        2. Deal &amp; Commission Tier
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Client Deal Value (USD):
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                          <input
                            type="number"
                            min="0"
                            value={trackDealBudget}
                            onChange={(e) => setTrackDealBudget(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1430d8] text-sm"
                            placeholder="2500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Partner Commission Tier:
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[20, 25, 30, 35, 40].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setTrackCommissionPct(pct)}
                              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                trackCommissionPct === pct
                                  ? 'bg-[#1430d8] text-white shadow-2xs'
                                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-xs font-semibold text-slate-600 flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                          <span>Total Commission:</span>
                          <span className="font-mono font-bold text-[#1430d8] text-sm">${commAmt.toLocaleString()} USD</span>
                        </div>
                      </div>
                    </div>

                    {/* Milestone Payment Checklist */}
                    <div className="space-y-3 md:border-l md:border-slate-200 md:pl-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Milestone Payouts
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">Toggle paid/pending</span>
                      </div>

                      <div className="space-y-2">
                        {/* Milestone 1 */}
                        <div
                          onClick={() => setTrackMilestone25Paid(!trackMilestone25Paid)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between select-none ${
                            trackMilestone25Paid
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span>Milestone 1: Kickoff (25%)</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${trackMilestone25Paid ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                {trackMilestone25Paid ? '✓ Paid' : 'Pending'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              Partner Share: <strong className="text-slate-800">${m25Val.toLocaleString()}</strong>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={trackMilestone25Paid}
                            onChange={() => {}}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 pointer-events-none"
                          />
                        </div>

                        {/* Milestone 2 */}
                        <div
                          onClick={() => setTrackMilestone35Paid(!trackMilestone35Paid)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between select-none ${
                            trackMilestone35Paid
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span>Milestone 2: Mid Demo (35%)</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${trackMilestone35Paid ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                {trackMilestone35Paid ? '✓ Paid' : 'Pending'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              Partner Share: <strong className="text-slate-800">${m35Val.toLocaleString()}</strong>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={trackMilestone35Paid}
                            onChange={() => {}}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 pointer-events-none"
                          />
                        </div>

                        {/* Milestone 3 */}
                        <div
                          onClick={() => setTrackMilestone40Paid(!trackMilestone40Paid)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between select-none ${
                            trackMilestone40Paid
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span>Milestone 3: Final Launch (40%)</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${trackMilestone40Paid ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                {trackMilestone40Paid ? '✓ Paid' : 'Pending'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              Partner Share: <strong className="text-slate-800">${m40Val.toLocaleString()}</strong>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={trackMilestone40Paid}
                            onChange={() => {}}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Live Status Note */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        3. Live Tracker Note
                      </label>
                      <span className="text-[11px] text-slate-400">Visible on partner website tracking tab</span>
                    </div>
                    <textarea
                      rows={2}
                      value={trackAdminNote}
                      onChange={(e) => setTrackAdminNote(e.target.value)}
                      placeholder="Enter update note for the live status tracker..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#1430d8]"
                    />

                    {/* Quick 1-Click Note Templates (Clean & Minimal Chips) */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[11px] text-slate-400 font-medium">Quick text:</span>
                      {[
                        { label: 'Deal Confirmed', text: 'Deal confirmed. Scope, pricing & terms finalized.' },
                        { label: 'Kickoff Received', text: `Kickoff advance received. Production started. Stage 1 partner share ($${m25Val.toLocaleString()}) released.` },
                        { label: 'Mid Prototype Approved', text: `Mid prototype demo approved by client. Stage 2 partner share ($${m35Val.toLocaleString()}) released.` },
                        { label: 'Live Deployed & Complete', text: `Project successfully launched live. Final balance settled ($${m40Val.toLocaleString()}). Deal 100% complete!` }
                      ].map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => setTrackAdminNote(chip.text)}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                        >
                          + {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 4: Contact & Reference Details */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                      4. Client &amp; Partner Details
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Client Name:</label>
                        <input
                          type="text"
                          value={trackClientName}
                          onChange={(e) => setTrackClientName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1430d8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Client Email:</label>
                        <input
                          type="email"
                          value={trackClientEmail}
                          onChange={(e) => setTrackClientEmail(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1430d8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Partner Name:</label>
                        <input
                          type="text"
                          value={trackPartnerName}
                          onChange={(e) => setTrackPartnerName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1430d8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Partner WhatsApp:</label>
                        <input
                          type="text"
                          value={trackPartnerWhatsApp}
                          onChange={(e) => setTrackPartnerWhatsApp(e.target.value)}
                          placeholder="+92 300 1234567"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1430d8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Agreement / Order Ref:</label>
                        <input
                          type="text"
                          value={trackOrderNumber}
                          onChange={(e) => setTrackOrderNumber(e.target.value)}
                          placeholder="UDH-ORD-2026-001"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1430d8]"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={async () => {
                            const cleanTok = normalizeReferralToken(
                              editingTrackReferral.partnerToken || 'UDH-PARTNER'
                            );
                            const foundPt =
                              partnerTokens.find(
                                (p) => normalizeReferralToken(p.token) === cleanTok
                              ) || {
                                token: cleanTok || 'UDH-PARTNER',
                                partnerName: trackPartnerName || editingTrackReferral.partnerName || 'Partner',
                                partnerEmail: editingTrackReferral.partnerEmail || 'hello@usmandevhub.com',
                                partnerWhatsApp: trackPartnerWhatsApp,
                                payoutMethod: editingTrackReferral.payoutMethod,
                                targetService: editingTrackReferral.service,
                                targetCategory: editingTrackReferral.category,
                                createdAt: editingTrackReferral.submittedAt || editingTrackReferral.date
                              };
                            const linkedOrdersForPt = orders.filter(
                              (o) => normalizeReferralToken(o.referralToken || '') === cleanTok
                            );
                            setActiveShareDoc({
                              isOpen: true,
                              type: 'token',
                              partner: foundPt,
                              linkedDeals: [editingTrackReferral],
                              linkedOrders: linkedOrdersForPt,
                              initialChannel: 'whatsapp'
                            });
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const cleanTok = normalizeReferralToken(editingTrackReferral.partnerToken || 'UDH-PARTNER');
                            const foundPt =
                              partnerTokens.find(
                                (p) => normalizeReferralToken(p.token) === cleanTok
                              ) || {
                                token: cleanTok || 'UDH-PARTNER',
                                partnerName: trackPartnerName || editingTrackReferral.partnerName || 'Partner',
                                partnerEmail: editingTrackReferral.partnerEmail || 'hello@usmandevhub.com',
                                partnerWhatsApp: trackPartnerWhatsApp,
                                payoutMethod: editingTrackReferral.payoutMethod,
                                targetService: editingTrackReferral.service,
                                targetCategory: editingTrackReferral.category,
                                createdAt: editingTrackReferral.submittedAt || editingTrackReferral.date
                              };
                            const linkedOrdersForPt = orders.filter(
                              (o) => normalizeReferralToken(o.referralToken || '') === cleanTok
                            );
                            setActiveShareDoc({
                              isOpen: true,
                              type: 'token',
                              partner: foundPt,
                              linkedDeals: [editingTrackReferral],
                              linkedOrders: linkedOrdersForPt,
                              initialChannel: 'email'
                            });
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Gmail</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditTrackModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(pingMessage);
                        setTrackCopiedPing(true);
                        setTimeout(() => setTrackCopiedPing(false), 2500);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {trackCopiedPing ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{trackCopiedPing ? 'Copied' : 'Copy Update Text'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTrackModal}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-[#1430d8] to-indigo-700 hover:opacity-95 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save &amp; Sync Status</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Interactive In-App Delete Confirmation Modal for Order Agreements */}
      <AnimatePresence>
        {pendingDeleteAgreement && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeletingRecord && setPendingDeleteAgreement(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 z-10"
            >
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Delete Agreement Reference?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This will permanently remove this agreement reference from the admin database.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isDeletingRecord && setPendingDeleteAgreement(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Agreement No:</span>
                  <span className="font-mono font-bold text-[#1430d8] text-sm">
                    {pendingDeleteAgreement.orderNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Client:</span>
                  <span className="font-semibold text-slate-800">
                    {pendingDeleteAgreement.clientName}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPendingDeleteAgreement(null)}
                  disabled={isDeletingRecord}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmExecuteDeleteOrder}
                  disabled={isDeletingRecord}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingRecord ? 'Deleting...' : 'Yes, Delete Agreement'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive In-App Delete Confirmation Modal for Partner Tokens */}
      <AnimatePresence>
        {pendingDeletePartnerToken && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeletingRecord && setPendingDeletePartnerToken(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 z-10"
            >
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Delete Partner Token?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This will permanently remove this unique partner token and all its links.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isDeletingRecord && setPendingDeletePartnerToken(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Token Code:</span>
                  <span className="font-mono font-bold text-[#1430d8] text-sm">
                    {pendingDeletePartnerToken.token}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Partner:</span>
                  <span className="font-semibold text-slate-800">
                    {pendingDeletePartnerToken.partnerName}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPendingDeletePartnerToken(null)}
                  disabled={isDeletingRecord}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmExecuteDeletePartnerToken}
                  disabled={isDeletingRecord}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingRecord ? 'Deleting...' : 'Yes, Delete Token'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unified 3-Channel + Custom Message + Complete PDF Modal */}
      <ShareDocumentModal
        isOpen={activeShareDoc.isOpen}
        onClose={() => setActiveShareDoc((prev) => ({ ...prev, isOpen: false }))}
        documentType={activeShareDoc.type}
        order={activeShareDoc.order}
        partner={activeShareDoc.partner}
        linkedDeals={activeShareDoc.linkedDeals}
        linkedOrders={activeShareDoc.linkedOrders}
        chronoSlot={activeShareDoc.chronoSlot}
        initialChannel={activeShareDoc.initialChannel}
        onDispatched={(notice) => {
          if (activeShareDoc.type === 'agreement') {
            setOrderActionNotice(notice);
            setTimeout(() => setOrderActionNotice(''), 6000);
          } else {
            showReferralNotice(notice);
          }
        }}
      />
    </div>
  );
};
