import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  Search,
  Share2,
  Download,
  Users,
  Plus,
  RefreshCw,
  Layers,
  CheckCircle2,
  FileText,
  ChevronDown,
  DollarSign,
  Wallet,
  Mail,
  MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ContactMessage, OrderAgreement, PartnerToken, ReferralRecord } from '../types';
import { ShareDocumentModal, ShareChannel } from './ShareDocumentModal';
import {
  getReferrals,
  getPartnerTokens,
  getOrderAgreements,
  getContactMessages,
  getServices,
  syncWithBackend,
  registerPartnerToken,
  getSavedOwnPartnerToken,
  getSavedOwnPartnerTokensList,
  setSavedOwnPartnerToken,
  findPartnerTokensByEmail,
  lookupPartnerByToken,
  normalizeReferralToken,
  setActiveReferredByToken,
  pruneExtraTokensForEmail,
  MAX_PDF_ARCHIVE_LIMIT,
  MAX_HOME_PARTNER_TOKENS,
  getHomePartnerTokensForEmail,
  resetPartnerActiveScreenBatch,
  addReferral,
  getActivePartnerEmail,
  setActivePartnerEmail
} from '../services/storageService';
import { INITIAL_SERVICES } from '../data/initialData';
import {
  downloadPartnerTokenPdf,
  sharePartnerTokenPdfOnWhatsApp,
  downloadLeadLockReceipt,
  downloadPartnerBatchTokensPdf
} from '../utils/partnerCertificate';

const PAYOUT_METHODS = [
  'Remitly (International Transfer)',
  'SadaPay / JazzCash / EasyPaisa',
  'Wise / Bank Transfer',
  'Payoneer / International Wire',
  'USDT (Binance / TRC20)'
];

const STAGE_LABELS: Record<ReferralRecord['status'], string> = {
  pending: 'Details Received',
  in_negotiation: 'In Negotiation',
  deal_complete: 'Deal Confirmed',
  milestone_25: '25% Kickoff Received',
  milestone_35: '35% Mid Milestone Paid',
  milestone_40: '40% Final Balance Settled',
  commission_paid: 'Full Commission Settled'
};

function maskClientEmail(email?: string): string {
  if (!email || !email.includes('@')) return '';
  const [local, domain] = email.trim().split('@');
  if (!local || !domain) return '';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export const ReferralSection: React.FC = () => {
  const [activeHubTab, setActiveHubTab] = useState<'token' | 'track'>('token');
  const [allReferrals, setAllReferrals] = useState<ReferralRecord[]>(() => getReferrals());
  const [allPartners, setAllPartners] = useState<PartnerToken[]>(() => getPartnerTokens());
  const [allOrders, setAllOrders] = useState<OrderAgreement[]>(() => getOrderAgreements());
  const [allMessages, setAllMessages] = useState<ContactMessage[]>(() => getContactMessages());
  const [ownTokensList, setOwnTokensList] = useState<string[]>(() => getSavedOwnPartnerTokensList());
  const [isRefreshingTracker, setIsRefreshingTracker] = useState(false);
  const [shareModalConfig, setShareModalConfig] = useState<{
    isOpen: boolean;
    partner: PartnerToken | null;
    channel: ShareChannel;
  }>({
    isOpen: false,
    partner: null,
    channel: 'whatsapp'
  });

  const [ownPartner, setOwnPartner] = useState<PartnerToken | undefined>(() => {
    const saved = getSavedOwnPartnerToken();
    return saved ? lookupPartnerByToken(saved) : undefined;
  });

  // 'view' shows generated token card; 'create_new' creates a brand-new separate token (even with same Gmail); 'edit_current' edits active token
  const [formMode, setFormMode] = useState<'view' | 'create_new' | 'edit_current'>(() => {
    const saved = getSavedOwnPartnerToken();
    return saved && lookupPartnerByToken(saved) ? 'view' : 'create_new';
  });

  // Tab 1: Generate Token State
  const [genName, setGenName] = useState<string>(() => ownPartner?.partnerName || '');
  const [genEmail, setGenEmail] = useState<string>(() => ownPartner?.partnerEmail || '');
  const [genWhatsApp, setGenWhatsApp] = useState<string>(() => ownPartner?.partnerWhatsApp || '');
  const [genPayout, setGenPayout] = useState<string>(() => ownPartner?.payoutMethod || PAYOUT_METHODS[0]);
  const [genService, setGenService] = useState<string>(() => ownPartner?.targetService || 'Web Development');
  const [genCategory, setGenCategory] = useState<string>(() => ownPartner?.targetCategory || 'Business Websites');
  // Client details fields inside partnership form
  const [genClientName, setGenClientName] = useState<string>('');
  const [genClientEmail, setGenClientEmail] = useState<string>('');
  const [genClientPhone, setGenClientPhone] = useState<string>('');
  const [genClientMessage, setGenClientMessage] = useState<string>('');

  const [genAttempted, setGenAttempted] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedSlotToken, setCopiedSlotToken] = useState<string | null>(null);
  const [downloadedAgreement, setDownloadedAgreement] = useState(false);

  // Custom inline dropdown state to prevent mobile OS full-screen overlay dialogs
  const [isPartnerServiceOpen, setIsPartnerServiceOpen] = useState(false);
  const [isPartnerCategoryOpen, setIsPartnerCategoryOpen] = useState(false);
  const partnerServiceDropdownRef = useRef<HTMLDivElement>(null);
  const partnerCategoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (partnerServiceDropdownRef.current && !partnerServiceDropdownRef.current.contains(target)) {
        setIsPartnerServiceOpen(false);
      }
      if (partnerCategoryDropdownRef.current && !partnerCategoryDropdownRef.current.contains(target)) {
        setIsPartnerCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Active services & subcategories catalog
  const servicesList = useMemo(() => {
    const list = getServices().filter((s) => s.status === 'active');
    return (list.length > 0 ? list : INITIAL_SERVICES).sort((a, b) => a.order - b.order);
  }, []);

  const serviceCategoriesMap: Record<string, string[]> = useMemo(() => {
    const map: Record<string, string[]> = {};
    INITIAL_SERVICES.forEach((s) => {
      const clean = s.title.replace(/^\d+[\.\s\-]+/, '').trim();
      if (clean && Array.isArray(s.subcategories)) {
        map[clean] = [...s.subcategories];
        map[s.title] = [...s.subcategories];
      }
    });
    servicesList.forEach((s) => {
      const clean = s.title.replace(/^\d+[\.\s\-]+/, '').trim();
      if (clean && Array.isArray(s.subcategories)) {
        map[clean] = [...s.subcategories];
        map[s.title] = [...s.subcategories];
      }
    });
    return map;
  }, [servicesList]);

  // Tab 2: Live Token Tracker State
  const [lookupInput, setLookupInput] = useState<string>(() => getSavedOwnPartnerToken() || '');
  const [queriedToken, setLookupQueriedToken] = useState<string>(() => getSavedOwnPartnerToken() || '');
  const setQueriedToken = setLookupQueriedToken;
  const [matchedEmailTokens, setMatchedEmailTokens] = useState<PartnerToken[]>([]);
  const [searchedEmailLabel, setSearchedEmailLabel] = useState<string>('');
  const [copiedTrackToken, setCopiedTrackToken] = useState(false);
  const [downloadedReceiptId, setDownloadedReceiptId] = useState<string | null>(null);

  const refreshLiveTrackerData = async () => {
    setIsRefreshingTracker(true);
    try {
      await syncWithBackend();
    } catch {
      // ignore offline
    } finally {
      setAllReferrals(getReferrals());
      setAllPartners(getPartnerTokens());
      setAllOrders(getOrderAgreements());
      setAllMessages(getContactMessages());
      setIsRefreshingTracker(false);
    }
  };

  useEffect(() => {
    const handleSync = () => {
      const refreshedPartners = getPartnerTokens();
      setAllReferrals(getReferrals());
      setAllPartners(refreshedPartners);
      setAllOrders(getOrderAgreements());
      setAllMessages(getContactMessages());
      setOwnTokensList(getSavedOwnPartnerTokensList());

      let saved = getSavedOwnPartnerToken();
      if (!saved) {
        const activeMail = getActivePartnerEmail();
        if (activeMail) {
          const emailTokens = findPartnerTokensByEmail(activeMail);
          if (emailTokens.length > 0) {
            saved = emailTokens[0].token;
            setSavedOwnPartnerToken(saved, activeMail);
          }
        }
      }

      if (saved) {
        const found = lookupPartnerByToken(saved);
        if (found) {
          setOwnPartner(found);
          setFormMode((prev) => (prev === 'create_new' && !ownPartner ? 'view' : prev));
        }
      }
    };

    window.addEventListener('usman_agency_data_updated', handleSync);
    // Initial reconciliation
    handleSync();

    return () => window.removeEventListener('usman_agency_data_updated', handleSync);
  }, []);

  const [downloadedBatch, setDownloadedBatch] = useState(false);
  const [batchActionNotice, setBatchActionNotice] = useState<string>('');

  // Total tokens found in system for this partner's email
  const totalTokensForPartnerEmail = useMemo(() => {
    if (!ownPartner?.partnerEmail) return 0;
    const cleanMail = ownPartner.partnerEmail.trim().toLowerCase();
    return allPartners.filter((p) => p.partnerEmail.trim().toLowerCase() === cleanMail).length;
  }, [ownPartner, allPartners]);

  // All separate tokens belonging strictly to this partner's Gmail (zero leak of other accounts)
  // Max 10 tokens saved on Home Page; when 11th is added, oldest 1 is deleted from home page view
  const partnerSeparateTokens = useMemo(() => {
    if (!ownPartner?.partnerEmail) return [];
    const cleanMail = ownPartner.partnerEmail.trim().toLowerCase();
    return getHomePartnerTokensForEmail(cleanMail);
  }, [ownPartner, allPartners]);

  const handleDownload10BatchSlip = () => {
    if (!ownPartner) return;
    downloadPartnerBatchTokensPdf(ownPartner, partnerSeparateTokens);
    setDownloadedBatch(true);
    setTimeout(() => setDownloadedBatch(false), 2500);
  };

  const handleStartNextBatch = () => {
    resetPartnerActiveScreenBatch();
    setGenService('Web Development');
    setGenCategory('Business Websites');
    setBatchActionNotice('Screen reset! Every new token generated will be permanently saved under your Gmail.');
    setFormMode('create_new');
    setTimeout(() => setBatchActionNotice(''), 3500);
  };

  const handleSelectOwnToken = (tokenCode: string) => {
    const clean = normalizeReferralToken(tokenCode);
    const found = lookupPartnerByToken(clean);
    if (found) {
      setSavedOwnPartnerToken(found.token);
      setOwnPartner(found);
      setGenName(found.partnerName);
      setGenEmail(found.partnerEmail);
      setGenWhatsApp(found.partnerWhatsApp || '');
      setGenPayout(found.payoutMethod || PAYOUT_METHODS[0]);
      setGenService(found.targetService || 'Web Development');
      setGenCategory(found.targetCategory || 'Business Websites');
      setLookupInput(found.token);
      setQueriedToken(found.token);
      setFormMode('view');
    }
  };

  const handleCopySlotToken = (tok: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = normalizeReferralToken(tok);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(clean).catch(() => {});
    }
    setCopiedSlotToken(tok);
    setTimeout(() => setCopiedSlotToken(null), 2000);
  };

  const handleCopyText = (text: string, setter: (v: boolean) => void) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleDownloadPartnerAgreement = (partner: PartnerToken, slotNum?: number) => {
    const linked = allReferrals.filter(
      (r) => r.partnerToken && normalizeReferralToken(r.partnerToken) === normalizeReferralToken(partner.token)
    );
    downloadPartnerTokenPdf(partner, linked, [], slotNum);
    setDownloadedAgreement(true);
    setTimeout(() => setDownloadedAgreement(false), 2500);
  };

  const handleSharePartnerTokenWhatsApp = async (partner: PartnerToken) => {
    const linked = allReferrals.filter(
      (r) => r.partnerToken && normalizeReferralToken(r.partnerToken) === normalizeReferralToken(partner.token)
    );
    const res = await sharePartnerTokenPdfOnWhatsApp(partner, linked, []);
    if (res.cancelled) return;
    setBatchActionNotice(
      res.sharedNatively
        ? `Full 20% Slip PDF (${res.fileName}) & short message attached directly!`
        : `Full 20% Slip PDF (${res.fileName}) downloaded & WhatsApp opened — attach the PDF & send!`
    );
    setTimeout(() => setBatchActionNotice(''), 5000);
  };

  const handleDownloadLeadReceipt = (ref: ReferralRecord) => {
    downloadLeadLockReceipt(ref);
    setDownloadedReceiptId(ref.id);
    setTimeout(() => setDownloadedReceiptId(null), 2500);
  };

  const handleOpenContactFormWithToken = (token: string, srv?: string, cat?: string) => {
    if (token) {
      setActiveReferredByToken(token);
    }
    const resolvedSrv = srv || ownPartner?.targetService;
    const resolvedCat = cat || ownPartner?.targetCategory;
    if (resolvedSrv || resolvedCat) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('usman_set_contact_preset', {
            detail: { service: resolvedSrv, category: resolvedCat }
          })
        );
      }
    }
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Tab 1 Validation & Handler
  const isGenNameInvalid = genAttempted && !genName.trim();
  const isGenEmailInvalid =
    genAttempted && (!genEmail.trim() || !genEmail.includes('@') || !genEmail.includes('.'));

  const handleGenerateToken = (e: React.FormEvent) => {
    e.preventDefault();
    setGenAttempted(true);
    if (!genName.trim()) {
      document.getElementById('partner-gen-name')?.focus();
      return;
    }
    if (!genEmail.trim() || !genEmail.includes('@') || !genEmail.includes('.')) {
      document.getElementById('partner-gen-email')?.focus();
      return;
    }

    const cleanEmail = genEmail.trim().toLowerCase();
    const created = registerPartnerToken({
      partnerName: genName.trim(),
      partnerEmail: cleanEmail,
      partnerWhatsApp: genWhatsApp.trim() || undefined,
      payoutMethod: genPayout,
      targetService: genService.trim() || 'Web Development',
      targetCategory: genCategory.trim() || undefined,
      existingToken: formMode === 'edit_current' && ownPartner ? ownPartner.token : undefined
    });

    pruneExtraTokensForEmail(cleanEmail, MAX_HOME_PARTNER_TOKENS);

    setActivePartnerEmail(cleanEmail);
    setOwnPartner(created);
    setAllPartners(getPartnerTokens());
    setOwnTokensList(getSavedOwnPartnerTokensList(cleanEmail));
    setLookupInput(created.token);
    setQueriedToken(created.token);
    const activeTokens = getHomePartnerTokensForEmail(cleanEmail);
    const emailTokens = findPartnerTokensByEmail(cleanEmail).filter((pt) =>
      activeTokens.includes(normalizeReferralToken(pt.token))
    );
    setMatchedEmailTokens(emailTokens);
    setSearchedEmailLabel(cleanEmail);
    setGenAttempted(false);
    setFormMode('view');

    // Automatically link client deal if client name was entered in partnership form
    if (genClientName.trim()) {
      const trimmedClient = genClientName.trim();
      addReferral({
        partnerToken: created.token,
        partnerName: created.partnerName,
        partnerEmail: created.partnerEmail,
        partnerWhatsApp: created.partnerWhatsApp,
        payoutMethod: created.payoutMethod,
        clientName: trimmedClient,
        clientEmail: genClientEmail.trim() || undefined,
        clientCompany: genClientPhone.trim() || undefined,
        service: created.targetService || 'Web Development',
        category: created.targetCategory || 'Business Websites',
        projectType: created.targetCategory
          ? `${created.targetService} — ${created.targetCategory}`
          : (created.targetService || 'Web Development'),
        estimatedBudget: 2500,
        commissionPercentage: 20,
        status: 'pending',
        source: 'manual_code',
        clientMessage: genClientMessage.trim() || undefined,
        notes: `Client "${trimmedClient}" referred via partnership registration form under token ${created.token}.`,
        adminStatusNote: `Client details received from partner (${created.partnerName}). Studio is reviewing requirements & preparing deal confirmation.`
      });
      setAllReferrals(getReferrals());
      setGenClientName('');
      setGenClientEmail('');
      setGenClientPhone('');
      setGenClientMessage('');
      setBatchActionNotice(`Token ${created.token} issued & Client "${trimmedClient}" linked! Live track is active.`);
    } else {
      setBatchActionNotice(`Token ${created.token} generated & permanently saved for ${created.partnerEmail}!`);
    }

    try {
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.65 } });
    } catch {
      // ignore
    }
  };



  // Helper to get unified live leads/agreements for any specific token
  const getUnifiedTokenDeals = (rawToken: string): ReferralRecord[] => {
    const clean = normalizeReferralToken(rawToken);
    if (!clean) return [];

    const baseRefs = allReferrals.filter(
      (r) => r.partnerToken && normalizeReferralToken(r.partnerToken) === clean
    );
    const results: ReferralRecord[] = [...baseRefs];
    const partnerMeta = lookupPartnerByToken(clean);

    allOrders
      .filter((o) => normalizeReferralToken(o.referralToken || '') === clean)
      .forEach((ord) => {
        const alreadyCovered = results.some(
          (r) =>
            r.orderNumber === ord.orderNumber ||
            (ord.inquiryId && r.inquiryId === ord.inquiryId) ||
            (ord.clientEmail && r.clientEmail && r.clientEmail.toLowerCase() === ord.clientEmail.toLowerCase()) ||
            r.clientName.toLowerCase() === ord.clientName.toLowerCase()
        );
        if (!alreadyCovered) {
          results.unshift({
            id: `live-ord-${ord.id}`,
            partnerToken: clean,
            partnerName: ord.partnerName || partnerMeta?.partnerName || `Partner (${clean})`,
            partnerEmail: partnerMeta?.partnerEmail || 'hello@usmandevhub.com',
            payoutMethod: partnerMeta?.payoutMethod,
            clientName: ord.clientName || 'Client',
            clientEmail: ord.clientEmail,
            clientCompany: ord.clientCompany,
            service: ord.service,
            category: ord.serviceCategory,
            projectType: ord.serviceCategory ? `${ord.service} — ${ord.serviceCategory}` : ord.service,
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

    allMessages
      .filter((m) => normalizeReferralToken(m.referralToken || '') === clean)
      .forEach((msg) => {
        const alreadyCovered = results.some(
          (r) =>
            r.inquiryId === msg.id ||
            (r.clientEmail && r.clientEmail.toLowerCase() === msg.email.toLowerCase()) ||
            r.clientName.toLowerCase() === msg.name.toLowerCase()
        );
        if (!alreadyCovered) {
          const numMatch = (msg.budget || '').replace(/,/g, '').match(/\d+(\.\d+)?/);
          const estBudget = numMatch ? Math.max(0, Number(numMatch[0]) || 1000) : 1000;
          const msgSrv = msg.service || 'Web Development';
          const msgCat = msg.category;
          const msgProjType = msgCat
            ? (msgSrv.includes(msgCat) ? msgSrv : `${msgSrv} — ${msgCat}`)
            : msgSrv;

          results.unshift({
            id: `live-msg-${msg.id}`,
            partnerToken: clean,
            partnerName: msg.referredByName || partnerMeta?.partnerName || `Partner (${clean})`,
            partnerEmail: partnerMeta?.partnerEmail || 'hello@usmandevhub.com',
            payoutMethod: partnerMeta?.payoutMethod,
            clientName: msg.name,
            clientEmail: msg.email,
            service: msgSrv,
            category: msgCat,
            preferredTech: msg.preferredTech,
            projectType: msgProjType,
            estimatedBudget: estBudget,
            statedBudgetText: msg.budget,
            commissionAmount: Math.round(estBudget * 0.2),
            status: 'pending',
            source: 'referral_link',
            date: (msg.createdAt || '').slice(0, 10),
            submittedAt: msg.createdAt,
            inquiryId: msg.id,
            clientMessage: msg.message,
            adminStatusNote: `Client submitted project details for ${msgSrv}${msgCat ? ` (${msgCat})` : ''} on your token. Studio is reviewing scope & requirements.`
          });
        }
      });

    return results;
  };

  const handleRunLookup = (rawVal: string) => {
    const trimmed = rawVal.trim();
    if (!trimmed) {
      setQueriedToken('');
      setMatchedEmailTokens([]);
      setSearchedEmailLabel('');
      return;
    }

    if (trimmed.includes('@')) {
      const emailTokens = findPartnerTokensByEmail(trimmed);
      setSearchedEmailLabel(trimmed);
      setMatchedEmailTokens(emailTokens);
      if (emailTokens.length > 0) {
        const topTok = normalizeReferralToken(emailTokens[0].token);
        setQueriedToken(topTok);
        setLookupInput(topTok);
      } else {
        setQueriedToken('');
      }
      return;
    }

    const clean = normalizeReferralToken(trimmed);
    setMatchedEmailTokens([]);
    setSearchedEmailLabel('');
    setQueriedToken(clean);
  };

  const normalizedQuery = useMemo(() => {
    return normalizeReferralToken(queriedToken);
  }, [queriedToken]);

  const trackedPartnerProfile = useMemo(() => {
    if (!normalizedQuery) return undefined;
    const found = lookupPartnerByToken(normalizedQuery);
    if (found) return found;
    if (ownPartner && normalizeReferralToken(ownPartner.token) === normalizedQuery) {
      return ownPartner;
    }
    return undefined;
  }, [normalizedQuery, allPartners, ownPartner]);

  const trackedReferrals = useMemo(() => {
    if (!normalizedQuery) return [];
    return getUnifiedTokenDeals(normalizedQuery);
  }, [allReferrals, allOrders, allMessages, normalizedQuery]);

  const trackerMetrics = useMemo(() => {
    const paidCommission = trackedReferrals
      .filter((r) => r.status === 'commission_paid')
      .reduce((acc, r) => acc + (r.commissionAmount || 0), 0);
    const activeCommission = trackedReferrals
      .filter((r) => r.status !== 'commission_paid')
      .reduce((acc, r) => acc + (r.commissionAmount || 0), 0);
    return {
      count: trackedReferrals.length,
      paidCommission,
      activeCommission
    };
  }, [trackedReferrals]);


  return (
    <section
      id="referral"
      className="relative py-10 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8 bg-[#fbfbfe] border-t border-neutral-200/70"
    >
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto">
        {/* Professional Header */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] sm:text-xs font-semibold text-[#1430d8] mb-2.5 whitespace-nowrap max-w-full overflow-x-auto no-scrollbar">
            <span className="shrink-0">Partner Program</span>
            <span aria-hidden="true" className="shrink-0 text-blue-400">·</span>
            <span className="shrink-0">Guaranteed 20% Commission on Every Project</span>
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0e0e0e] tracking-tight max-w-xl leading-tight">
            Bring Clients &amp; Earn{' '}
            <span className="text-[#1430d8]">20% Commission</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-xl leading-relaxed">
            Generate your partner token, connect clients with our studio, and receive your <strong>20% total deal commission</strong> in clear milestones: <strong>5%</strong> on kickoff (when client pays 25%), <strong>5%</strong> on mid demo (when client pays 35%), and <strong>10%</strong> on final delivery (when client clears 40%).
          </p>

          {/* Minimal 3-Step Flow */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-medium text-neutral-600">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 shadow-2xs">1. Get Token &amp; Slip</span>
            <span className="text-neutral-300">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 shadow-2xs">2. Connect Client</span>
            <span className="text-neutral-300">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 shadow-2xs font-semibold text-[#1430d8]">
              3. 20% Deal Commission (5% Kickoff + 5% Mid + 10% Final)
            </span>
          </div>
        </div>

        {/* Clean Centered 2-Tab Partner Portal */}
        <div
          id="referral-partner-hub"
          className="max-w-3xl lg:max-w-4xl mx-auto"
        >
          <div className="rounded-2xl bg-white border border-neutral-200/90 p-3.5 sm:p-5 flex flex-col justify-between">
            <div>
              {/* 2-Option Segmented Tab Controls */}
              <div
                role="tablist"
                aria-label="Partner portal actions"
                className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-neutral-100 border border-neutral-200/70 mb-3 sm:mb-4"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeHubTab === 'token'}
                  onClick={() => setActiveHubTab('token')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                    activeHubTab === 'token'
                      ? 'bg-white text-[#1430d8] shadow-2xs'
                      : 'text-neutral-600 hover:text-[#0e0e0e]'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 shrink-0" />
                  <span>1. Token &amp; Slip</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeHubTab === 'track'}
                  onClick={() => {
                    refreshLiveTrackerData();
                    setActiveHubTab('track');
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                    activeHubTab === 'track'
                      ? 'bg-white text-[#1430d8] shadow-2xs'
                      : 'text-neutral-600 hover:text-[#0e0e0e]'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 shrink-0" />
                  <span>2. Track Status</span>
                </button>
              </div>

              {/* TAB 1: GET TOKEN & SIGNED AGREEMENT */}
              {activeHubTab === 'token' && (
                <div>
                  {ownPartner && formMode === 'view' ? (
                    <div className="space-y-4">
                      {/* Partner Profile Summary */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-base font-bold text-[#0e0e0e]">
                              {ownPartner.partnerName}
                            </h3>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Active Partner
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {ownPartner.partnerEmail} · Payout: <strong className="text-neutral-700 font-semibold">{ownPartner.payoutMethod || PAYOUT_METHODS[0]}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            id="new-client-token-btn"
                            onClick={() => {
                              setGenName(ownPartner.partnerName);
                              setGenEmail(ownPartner.partnerEmail);
                              setGenWhatsApp(ownPartner.partnerWhatsApp || '');
                              setGenPayout(ownPartner.payoutMethod || PAYOUT_METHODS[0]);
                              setGenService(ownPartner.targetService || 'Web Development');
                              setGenCategory(ownPartner.targetCategory || 'Business Websites');
                              setFormMode('create_new');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5 shrink-0" />
                            <span>+ New Client Token</span>
                          </button>
                        </div>
                      </div>

                      {/* Toast Notice */}
                      {batchActionNotice && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2">
                          <span className="font-medium">{batchActionNotice}</span>
                          <button
                            type="button"
                            onClick={() => setBatchActionNotice('')}
                            className="text-emerald-600 hover:text-emerald-900 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* Primary Active Token Card */}
                      <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-neutral-50 to-white border border-neutral-200/90 shadow-2xs space-y-2.5 sm:space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#1430d8] shrink-0 shadow-2xs">
                              <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 block uppercase tracking-wider">
                                Official Partner Token
                              </span>
                              <code className="font-mono text-base sm:text-lg font-extrabold text-[#1430d8] tracking-wider tabular-nums block">
                                {ownPartner.token}
                              </code>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyText(ownPartner.token, setCopiedToken)}
                              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                copiedToken
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#1430d8] hover:bg-[#0075f7] text-white'
                              }`}
                            >
                              {copiedToken ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Token</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Assigned Service & Category */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-neutral-100 text-xs">
                          <span className="text-neutral-500 font-medium">Scope:</span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1430d8] font-bold text-[11px] sm:text-xs border border-blue-100">
                            {ownPartner.targetService || 'Web Development'}
                          </span>
                          {ownPartner.targetCategory && (
                            <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 font-semibold text-[11px] sm:text-xs border border-neutral-200">
                              {ownPartner.targetCategory}
                            </span>
                          )}
                          <span className="ml-auto text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            20% Payout Guaranteed
                          </span>
                        </div>

                        {/* Milestone Commission Breakdown (5% + 5% + 10% = 20% Total Deal Commission) */}
                        <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-neutral-800 flex items-center gap-1.5 text-[11px] sm:text-xs">
                              <DollarSign className="w-3.5 h-3.5 text-[#1430d8]" />
                              <span>20% Milestone Schedule:</span>
                            </span>
                            <span className="font-mono text-[10px] sm:text-[11px] font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              5% + 5% + 10% = 20%
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                            <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-blue-50/70 border border-blue-100/90 text-left space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-500">1. Kickoff</span>
                                <span className="text-[11px] sm:text-xs font-black text-[#1430d8] font-mono">5%</span>
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-neutral-700 leading-tight">
                                On client&apos;s <strong>25% deposit</strong>.
                              </p>
                            </div>

                            <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-blue-50/70 border border-blue-100/90 text-left space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-500">2. Mid</span>
                                <span className="text-[11px] sm:text-xs font-black text-[#1430d8] font-mono">5%</span>
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-neutral-700 leading-tight">
                                On demo &amp; <strong>35% payment</strong>.
                              </p>
                            </div>

                            <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-left space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-800">3. Handover</span>
                                <span className="text-[11px] sm:text-xs font-black text-emerald-700 font-mono">10%</span>
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-neutral-700 leading-tight">
                                On delivery &amp; <strong>40% balance</strong>.
                              </p>
                            </div>
                          </div>

                          <div className="px-2.5 py-1 rounded-lg bg-neutral-50 border border-neutral-200/70 flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-600">
                            <span>Guaranteed deal commission on full project budget:</span>
                            <span className="font-mono font-bold text-[#1430d8]">5% + 5% + 10% = 20% Total Share</span>
                          </div>
                        </div>
                      </div>

                      {/* Main Action Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                        <button
                          type="button"
                          id="download-signed-partner-agreement-btn"
                          onClick={() => handleDownloadPartnerAgreement(ownPartner)}
                          className="py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                        >
                          {downloadedAgreement ? (
                            <>
                              <Check className="w-4 h-4 shrink-0 text-emerald-300" />
                              <span>20% Slip Downloaded!</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 shrink-0" />
                              <span>Download Official 20% Slip (PDF)</span>
                            </>
                          )}
                        </button>

                        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (ownPartner) {
                                setShareModalConfig({ isOpen: true, partner: ownPartner, channel: 'whatsapp' });
                              }
                            }}
                            className="py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                            title="Send Token PDF on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (ownPartner) {
                                setShareModalConfig({ isOpen: true, partner: ownPartner, channel: 'email' });
                              }
                            }}
                            className="py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                            title="Send Token PDF via Gmail"
                          >
                            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            <span>Gmail</span>
                          </button>
                        </div>
                      </div>


                      {/* Issued Tokens History (Max 10 on Home Page) */}
                      {partnerSeparateTokens.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-neutral-700 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-[#1430d8]" />
                              <span>Your Active Client Tokens (Max 10 on Home · {partnerSeparateTokens.length}/10):</span>
                            </span>
                            <button
                              type="button"
                              onClick={handleDownload10BatchSlip}
                              className="text-[11px] font-semibold text-[#1430d8] hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download Active Slips PDF</span>
                            </button>
                          </div>

                          {totalTokensForPartnerEmail > 10 && (
                            <div className="text-[11px] text-neutral-600 bg-neutral-50 border border-neutral-200/80 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                              <span>Home page saves latest 10 tokens (11th removes oldest from home).</span>
                              <span className="font-semibold text-emerald-700">All {totalTokensForPartnerEmail} saved in Admin Panel</span>
                            </div>
                          )}

                          <div className="max-h-48 overflow-y-auto divide-y divide-neutral-100 border border-neutral-200 rounded-xl bg-white shadow-2xs">
                            {partnerSeparateTokens.map((tok) => {
                              const isCurrent = normalizeReferralToken(ownPartner.token) === tok;
                              const tokenRecord = lookupPartnerByToken(tok) || { ...ownPartner, token: tok };
                              const slotDeals = getUnifiedTokenDeals(tok);
                              const latestDeal = slotDeals[0];
                              return (
                                <div key={tok} className="divide-y divide-neutral-100">
                                  <div
                                  onClick={() => handleSelectOwnToken(tok)}
                                  role="button"
                                  tabIndex={0}
                                  className={`px-3 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                    isCurrent ? 'bg-blue-50/80 text-[#1430d8]' : 'hover:bg-neutral-50 text-neutral-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <code className={`font-mono text-xs tabular-nums ${isCurrent ? 'font-bold text-[#1430d8]' : 'text-neutral-900 font-semibold'}`}>
                                      {tok}
                                    </code>
                                    {isCurrent ? (
                                      <span className="text-[10px] font-bold text-[#1430d8]">· Selected</span>
                                    ) : latestDeal ? (
                                      <span className="text-[10px] font-bold text-emerald-700">· Inquiry Received ({latestDeal.clientName})</span>
                                    ) : (
                                      <span className="text-[10px] text-neutral-400">· Ready</span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadPartnerAgreement(tokenRecord);
                                      }}
                                      className="p-1 rounded text-neutral-500 hover:text-[#1430d8] hover:bg-blue-50"
                                      title="Download PDF"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopySlotToken(tok, e)}
                                      className="p-1 rounded text-neutral-500 hover:text-[#1430d8] hover:bg-blue-50"
                                      title="Copy Token"
                                    >
                                      {copiedSlotToken === tok ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleGenerateToken} noValidate className="space-y-2.5 sm:space-y-3">
                      {ownPartner && formMode === 'create_new' && (
                        <div className="px-2.5 py-1.5 rounded-lg bg-blue-50/80 border border-blue-200/80 text-xs text-neutral-800 flex items-center justify-between">
                          <span className="truncate pr-2">
                            New token for <strong className="text-[#1430d8]">{ownPartner.partnerEmail}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormMode('view')}
                            className="text-xs font-semibold text-[#1430d8] hover:underline shrink-0"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label htmlFor="partner-gen-name" className="text-[11px] sm:text-xs font-semibold text-neutral-700">
                              Your Name *
                            </label>
                            {isGenNameInvalid && (
                              <span className="text-[10px] font-semibold text-red-600">Required</span>
                            )}
                          </div>
                          <input
                            id="partner-gen-name"
                            type="text"
                            value={genName}
                            onChange={(e) => setGenName(e.target.value)}
                            placeholder="e.g. Bilal Ahmed"
                            className={`w-full px-2.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border text-xs text-[#0e0e0e] focus:outline-none transition-colors ${
                              isGenNameInvalid
                                ? 'border-red-500 bg-red-50/30'
                                : 'bg-neutral-50 border-neutral-200 focus:bg-white focus:border-[#1430d8]'
                            }`}
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label htmlFor="partner-gen-email" className="text-[11px] sm:text-xs font-semibold text-neutral-700">
                              Your Email (Gmail) *
                            </label>
                            {isGenEmailInvalid && (
                              <span className="text-[10px] font-semibold text-red-600">Valid email</span>
                            )}
                          </div>
                          <input
                            id="partner-gen-email"
                            type="email"
                            value={genEmail}
                            onChange={(e) => setGenEmail(e.target.value)}
                            placeholder="e.g. bilal@gmail.com"
                            className={`w-full px-2.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border text-xs text-[#0e0e0e] focus:outline-none transition-colors ${
                              isGenEmailInvalid
                                ? 'border-red-500 bg-red-50/30'
                                : 'bg-neutral-50 border-neutral-200 focus:bg-white focus:border-[#1430d8]'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="partner-gen-whatsapp" className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-0.5">
                          WhatsApp Number (Optional — For Instant Milestone &amp; Deal Updates)
                        </label>
                        <input
                          id="partner-gen-whatsapp"
                          type="tel"
                          value={genWhatsApp}
                          onChange={(e) => setGenWhatsApp(e.target.value)}
                          placeholder="+92 300 1234567 or international number"
                          className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-[#0e0e0e] focus:outline-none focus:bg-white focus:border-[#1430d8]"
                        />
                      </div>

                      {/* Payout Method (Select from list) */}
                      <div className="space-y-1.5 p-2.5 sm:p-3 rounded-xl bg-neutral-50/80 border border-neutral-200/90">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <label className="block text-[11px] sm:text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-[#1430d8]" />
                            <span>Payout Method (Select from list) *</span>
                          </label>
                          <span className="text-[10px] sm:text-[11px] text-neutral-500">
                            Selected: <strong className="text-[#1430d8] font-semibold">{genPayout}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {PAYOUT_METHODS.map((method) => {
                            const isSelected = genPayout === method;
                            return (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setGenPayout(method)}
                                className={`w-full px-2.5 py-1.5 sm:py-2 rounded-lg text-left text-xs transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                                  isSelected
                                    ? 'bg-[#1430d8] text-white border-[#1430d8] font-bold shadow-2xs ring-1 ring-blue-200'
                                    : 'bg-white hover:bg-neutral-100/90 text-neutral-800 border-neutral-200/80 hover:border-neutral-300 font-medium'
                                } ${method === 'USDT (Binance / TRC20)' ? 'sm:col-span-2' : ''}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? 'border-white bg-white text-[#1430d8]'
                                        : 'border-neutral-300 bg-neutral-50'
                                    }`}
                                  >
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#1430d8]" />}
                                  </span>
                                  <span className="truncate text-xs">{method}</span>
                                </div>
                                <span
                                  className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-neutral-100 text-neutral-600'
                                  }`}
                                >
                                  {isSelected ? '✓' : 'Select'}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <p className="text-[10px] sm:text-[11px] text-neutral-500 pt-0.5">
                          Milestone payouts (5% Kickoff + 5% Mid + 10% Final = 20% Total Deal Commission) will be dispatched to this method.
                        </p>
                      </div>

                      {/* Target Service & Category */}
                      <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] sm:text-xs font-bold text-[#0e0e0e] flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#1430d8]" />
                            <span>Select Service &amp; Category *</span>
                          </span>
                          <span className="text-[10px] text-[#1430d8] font-bold">20% Slip Assigned</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 relative">
                          {/* Client Service - Custom Inline Dropdown */}
                          <div ref={partnerServiceDropdownRef} className={`relative ${isPartnerServiceOpen ? 'z-40' : 'z-20'}`}>
                            <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-0.5">
                              Client Service *
                            </label>
                            <button
                              type="button"
                              id="partner-gen-service"
                              onClick={() => {
                                setIsPartnerServiceOpen((prev) => !prev);
                                setIsPartnerCategoryOpen(false);
                              }}
                              className={`w-full px-2.5 py-1.5 sm:py-2 rounded-lg bg-white border text-xs text-[#0e0e0e] font-medium shadow-2xs transition-all cursor-pointer flex items-center justify-between text-left ${
                                isPartnerServiceOpen ? 'border-[#1430d8] ring-2 ring-blue-100' : 'border-neutral-200 hover:border-neutral-300'
                              }`}
                              aria-expanded={isPartnerServiceOpen}
                              aria-haspopup="listbox"
                            >
                              <span className="truncate pr-2 font-semibold text-neutral-900">{genService || 'Select Service'}</span>
                              <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-neutral-500 transition-transform duration-200 ${isPartnerServiceOpen ? 'rotate-180 text-[#1430d8]' : ''}`} />
                            </button>

                            {isPartnerServiceOpen && (
                              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-neutral-100 animate-in fade-in slide-in-from-top-1 duration-150">
                                <div className="p-1">
                                  {servicesList.map((srv) => {
                                    const isSelected = srv.title === genService;
                                    return (
                                      <button
                                        key={srv.id}
                                        type="button"
                                        onClick={() => {
                                          const nextSrv = srv.title;
                                          setGenService(nextSrv);
                                          const clean = nextSrv.replace(/^\d+[\.\s\-]+/, '').trim();
                                          const subcats = serviceCategoriesMap[clean] || serviceCategoriesMap[nextSrv] || [];
                                          if (subcats.length > 0) {
                                            setGenCategory(subcats[0]);
                                          } else {
                                            setGenCategory('');
                                          }
                                          setIsPartnerServiceOpen(false);
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                          isSelected ? 'bg-blue-50 text-[#1430d8] font-bold' : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
                                        }`}
                                      >
                                        <span className="truncate pr-2">{srv.title}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Category / Scope - Custom Inline Dropdown */}
                          {(() => {
                            const clean = genService.replace(/^\d+[\.\s\-]+/, '').trim();
                            const subcats = serviceCategoriesMap[clean] || serviceCategoriesMap[genService] || [];
                            if (subcats.length > 0) {
                              return (
                                <div ref={partnerCategoryDropdownRef} className={`relative ${isPartnerCategoryOpen ? 'z-40' : 'z-20'}`}>
                                  <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-0.5">
                                    Category / Scope *
                                  </label>
                                  <button
                                    type="button"
                                    id="partner-gen-category"
                                    onClick={() => {
                                      setIsPartnerCategoryOpen((prev) => !prev);
                                      setIsPartnerServiceOpen(false);
                                    }}
                                    className={`w-full px-2.5 py-1.5 sm:py-2 rounded-lg bg-white border text-xs text-[#0e0e0e] font-medium shadow-2xs transition-all cursor-pointer flex items-center justify-between text-left ${
                                      isPartnerCategoryOpen ? 'border-[#1430d8] ring-2 ring-blue-100' : 'border-neutral-200 hover:border-neutral-300'
                                    }`}
                                    aria-expanded={isPartnerCategoryOpen}
                                    aria-haspopup="listbox"
                                  >
                                    <span className="truncate pr-2 font-semibold text-neutral-900">{genCategory || 'Select Category'}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-blue-600 transition-transform duration-200 ${isPartnerCategoryOpen ? 'rotate-180 text-[#1430d8]' : ''}`} />
                                  </button>

                                  {isPartnerCategoryOpen && (
                                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-neutral-100 animate-in fade-in slide-in-from-top-1 duration-150">
                                      <div className="p-1">
                                        {subcats.map((cat) => {
                                          const isSelected = cat.toLowerCase() === genCategory.toLowerCase();
                                          return (
                                            <button
                                              key={cat}
                                              type="button"
                                              onClick={() => {
                                                setGenCategory(cat);
                                                setIsPartnerCategoryOpen(false);
                                              }}
                                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                                isSelected ? 'bg-blue-50 text-[#1430d8] font-bold' : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
                                              }`}
                                            >
                                              <span className="truncate pr-2">{cat}</span>
                                              {isSelected && <Check className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <div>
                                <label htmlFor="partner-gen-category" className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-0.5">
                                  Category / Scope *
                                </label>
                                <input
                                  id="partner-gen-category"
                                  type="text"
                                  value={genCategory}
                                  onChange={(e) => setGenCategory(e.target.value)}
                                  placeholder="e.g. Business Websites"
                                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg bg-white border border-neutral-200 text-xs text-[#0e0e0e] focus:outline-none focus:border-[#1430d8]"
                                />
                              </div>
                            );
                          })()}
                        </div>

                        <p className="text-[10px] sm:text-[11px] text-neutral-500">
                          Your official 20% partnership slip (PDF) will be issued with these details.
                        </p>
                      </div>

                      {/* Client Details Section (Optional — If client details are already available) */}
                      <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-blue-50/70 border border-emerald-200/90 space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] sm:text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Client Details (Optional — If available)</span>
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                            Auto Deal Link
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                          <div>
                            <label htmlFor="partner-gen-client-name" className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-0.5">
                              Client Name / Business Name (Optional)
                            </label>
                            <input
                              id="partner-gen-client-name"
                              type="text"
                              value={genClientName}
                              onChange={(e) => setGenClientName(e.target.value)}
                              placeholder="e.g. Tariq Mehmood / Vertex Logistics"
                              className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg bg-white border border-neutral-200 text-xs text-[#0e0e0e] focus:outline-none focus:border-[#1430d8]"
                            />
                          </div>

                          <div>
                            <label htmlFor="partner-gen-client-email" className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-0.5">
                              Client Email or Phone (Optional)
                            </label>
                            <input
                              id="partner-gen-client-email"
                              type="text"
                              value={genClientEmail}
                              onChange={(e) => setGenClientEmail(e.target.value)}
                              placeholder="e.g. client@example.com or +92 321 ..."
                              className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg bg-white border border-neutral-200 text-xs text-[#0e0e0e] focus:outline-none focus:border-[#1430d8]"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="partner-gen-client-message" className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-0.5">
                            Client Project Scope / Requirement (Optional)
                          </label>
                          <textarea
                            id="partner-gen-client-message"
                            rows={2}
                            value={genClientMessage}
                            onChange={(e) => setGenClientMessage(e.target.value)}
                            placeholder="e.g. Needs full-stack web application with responsive UI, payment gateway, and hosting setup."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs text-[#0e0e0e] focus:outline-none focus:border-[#1430d8]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="submit"
                          id="generate-partner-token-btn"
                          className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                        >
                          <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          <span>
                            {ownPartner
                              ? 'Generate New Client Token & Slip'
                              : 'Generate Partner Token & 20% Slip'}
                          </span>
                        </button>
                        {ownPartner && (
                          <button
                            type="button"
                            onClick={() => setFormMode('view')}
                            className="py-2 sm:py-2.5 px-3 sm:px-3.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: LIVE TOKEN TRACKER */}
              {activeHubTab === 'track' && (
                <div className="space-y-3.5">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRunLookup(lookupInput);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      id="partner-token-lookup-input"
                      type="text"
                      aria-label="Enter partner token or Gmail"
                      value={lookupInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLookupInput(val.includes('@') ? val : val.toUpperCase());
                      }}
                      placeholder="Enter Issued Partner Token (e.g. UDH-PARTNER-001XY) or Partner Gmail"
                      className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 font-mono text-xs text-[#0e0e0e] focus:outline-none focus:bg-white focus:border-[#1430d8] placeholder:font-sans"
                    />
                    <button
                      type="button"
                      onClick={refreshLiveTrackerData}
                      title="Refresh live token status"
                      className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingTracker ? 'animate-spin text-[#1430d8]' : ''}`} />
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Search className="w-3.5 h-3.5 shrink-0" />
                      <span>Check Status</span>
                    </button>
                  </form>

                  {/* If Partner searched by Gmail, list each separate token cleanly with count */}
                  {searchedEmailLabel && (
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/90 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#1430d8] text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-neutral-900 block">
                              {matchedEmailTokens.length > 0
                                ? `Found ${matchedEmailTokens.length} Partner Token${matchedEmailTokens.length === 1 ? '' : 's'} registered under ${searchedEmailLabel}`
                                : `No tokens registered under ${searchedEmailLabel}`
                              }
                            </span>
                            <span className="text-[11px] text-neutral-500">
                              {matchedEmailTokens.length > 0
                                ? 'All tokens below belong exclusively to this Gmail address.'
                                : 'Tokens are private. Please verify you entered the exact Gmail used when creating your token.'
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {matchedEmailTokens.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {matchedEmailTokens.map((pt, idx) => {
                            const cleanTok = normalizeReferralToken(pt.token);
                            const deals = getUnifiedTokenDeals(cleanTok);
                            const hasDetails = deals.length > 0;
                            const isSelected = normalizedQuery === cleanTok;
                            return (
                              <button
                                key={pt.token}
                                type="button"
                                onClick={() => setQueriedToken(cleanTok)}
                                className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 tabular-nums flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-[#1430d8] text-white font-bold shadow-2xs ring-2 ring-blue-300'
                                    : hasDetails
                                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 font-semibold'
                                    : 'bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-100'
                                }`}
                              >
                                <span>#{idx + 1} {pt.token}</span>
                                {hasDetails ? (
                                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-sans font-medium">
                                    Client Active
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-neutral-400 font-sans">Ready</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Switcher for Own Tokens (strictly scoped to own Gmail) */}
                  {partnerSeparateTokens.length > 0 && !searchedEmailLabel && (
                    <div className="rounded-xl bg-neutral-50 border border-neutral-200/80 p-2.5 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-neutral-600">
                        <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#1430d8]" />
                          <span>Your Tokens for {ownPartner?.partnerEmail} ({partnerSeparateTokens.length}):</span>
                        </span>
                        <span className="text-[10px] text-[#1430d8]">✓ = Client inquiry received</span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                        {partnerSeparateTokens.map((tok, idx) => {
                          const isActive = normalizedQuery === tok;
                          const hasClientDetails = getUnifiedTokenDeals(tok).length > 0;
                          return (
                            <button
                              key={tok}
                              type="button"
                              onClick={() => {
                                setMatchedEmailTokens([]);
                                setSearchedEmailLabel('');
                                setLookupInput(tok);
                                setQueriedToken(tok);
                              }}
                              className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                                isActive
                                  ? 'bg-[#1430d8] text-white font-bold shadow-2xs'
                                  : hasClientDetails
                                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold hover:bg-emerald-100'
                                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                              }`}
                            >
                              #{idx + 1} {tok} {hasClientDetails ? '· ✓' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {partnerSeparateTokens.length === 0 && !normalizedQuery && !searchedEmailLabel && (
                    <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1430d8] flex items-center justify-center mx-auto">
                        <Search className="w-5 h-5" />
                      </div>
                      <h4 className="font-display text-sm font-bold text-neutral-900">
                        Check Tokens by Partner Gmail
                      </h4>
                      <p className="text-xs text-neutral-500 max-w-md mx-auto">
                        Enter your registered Partner Gmail address above to view how many tokens exist for your account and check 20% milestone earnings. Each Gmail&apos;s tokens are private.
                      </p>
                      {ownPartner?.partnerEmail && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleRunLookup(ownPartner.partnerEmail)}
                            className="px-3.5 py-1.5 rounded-xl bg-white border border-[#1430d8]/30 hover:border-[#1430d8] text-[#1430d8] text-xs font-semibold cursor-pointer shadow-2xs transition-all inline-flex items-center gap-1.5"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Check tokens for {ownPartner.partnerEmail}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {normalizedQuery && (
                    <div className="space-y-3">
                      {/* Token Live Status Header Strip */}
                      <div
                        className={`flex flex-wrap items-center justify-between gap-2 py-2.5 px-3.5 rounded-xl border text-xs tabular-nums ${
                          trackedReferrals.length > 0
                            ? 'bg-emerald-50/70 border-emerald-200/90'
                            : 'bg-neutral-50 border-neutral-200/80'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-neutral-700">
                          <span className="font-mono font-bold text-[#1430d8]">{normalizedQuery}</span>
                          <span aria-hidden="true">·</span>
                          {trackedReferrals.length > 0 ? (
                            <span className="font-semibold text-emerald-800 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Client Inquiry Received ({trackedReferrals.length})</span>
                            </span>
                          ) : (
                            <span className="text-neutral-500">Waiting for Client Inquiry</span>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>
                            Pending 20%: <strong className="text-[#1430d8]">${trackerMetrics.activeCommission.toLocaleString()}</strong>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Paid: <strong className="text-emerald-700">${trackerMetrics.paidCommission.toLocaleString()}</strong>
                          </span>
                        </div>

                        {trackedPartnerProfile && (
                          <button
                            type="button"
                            onClick={() => handleDownloadPartnerAgreement(trackedPartnerProfile)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1430d8] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Download className="w-3 h-3 shrink-0" />
                            <span>Slip PDF</span>
                          </button>
                        )}
                      </div>

                      {/* Detailed Live Status Cards */}
                      {trackedReferrals.length === 0 ? (
                        <div className="py-6 px-4 rounded-xl border border-dashed border-neutral-200 text-center space-y-2">
                          <p className="text-xs font-semibold text-neutral-800">
                            No client inquiry submitted under <code className="font-mono text-[#1430d8]">{normalizedQuery}</code> yet.
                          </p>
                          <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                            Share this token with your client. When they submit a project, their requirements and your 20% milestone status will appear here.
                          </p>
                          {trackedPartnerProfile && (
                            <div className="pt-1 flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(normalizedQuery, setCopiedTrackToken)
                                }
                                className="px-3 py-1.5 rounded-lg bg-[#1430d8] text-white text-xs font-semibold cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                {copiedTrackToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedTrackToken ? 'Copied' : 'Copy Token'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-0.5">
                          {trackedReferrals.map((ref) => {
                            const stageOrder: ReferralRecord['status'][] = [
                              'pending',
                              'in_negotiation',
                              'deal_complete',
                              'milestone_25',
                              'milestone_35',
                              'milestone_40',
                              'commission_paid'
                            ];
                            const currentStepIdx = Math.max(0, stageOrder.indexOf(ref.status));
                            const maskedEmail = maskClientEmail(ref.clientEmail);
                            const sourceText =
                              ref.source === 'referral_link' || ref.source === 'manual_code'
                                ? 'Submitted with Partner Token'
                                : ref.source === 'order_agreement'
                                ? 'Official Studio Agreement'
                                : 'Partner Token';
                            const mStart5 = Math.round(ref.estimatedBudget * 0.05);
                            const mMid5 = Math.round(ref.estimatedBudget * 0.05);
                            const mFinal10 = Math.max(0, ref.commissionAmount - mStart5 - mMid5);

                            const displayService =
                              ref.service ||
                              (ref.projectType.includes(' — ')
                                ? ref.projectType.split(' — ')[0].trim()
                                : ref.projectType);
                            const displayCategory =
                              ref.category ||
                              (ref.projectType.includes(' — ')
                                ? ref.projectType.split(' — ')[1].replace(/\(.*\)/, '').trim()
                                : undefined);
                            const displayTech = ref.preferredTech;

                            return (
                              <div
                                key={ref.id}
                                className="p-3.5 rounded-xl bg-white border border-neutral-200/90 space-y-3"
                              >
                                {/* Top Row: Client Proof + 20% Commission + Receipt */}
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                      <p className="text-sm font-bold text-[#0e0e0e]">
                                        {ref.clientName}
                                      </p>
                                      {ref.clientCompany && (
                                        <span className="text-xs text-neutral-500">· {ref.clientCompany}</span>
                                      )}
                                      {maskedEmail && (
                                        <span className="text-[11px] font-mono text-neutral-400">
                                          ({maskedEmail})
                                        </span>
                                      )}
                                    </div>

                                    {/* Client Inquiry Badges: Form Service & Category */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#1430d8] border border-blue-200/80 text-[11px] font-bold">
                                        <Layers className="w-3 h-3 shrink-0" />
                                        <span className="text-neutral-500 font-normal">Service:</span>
                                        <span>{displayService}</span>
                                      </span>
                                      {displayCategory && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200/80 text-[11px] font-bold">
                                          <span className="text-purple-600/70 font-normal">Category:</span>
                                          <span>{displayCategory}</span>
                                        </span>
                                      )}
                                      {displayTech && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] font-medium">
                                          <span className="text-neutral-400">Tech:</span>
                                          <span>{displayTech}</span>
                                        </span>
                                      )}
                                    </div>

                                    <p className="text-xs text-neutral-600">
                                      <span>{sourceText}</span>
                                      <span aria-hidden="true"> · </span>
                                      <span className="tabular-nums">{ref.date}</span>
                                    </p>
                                    {ref.orderNumber && (
                                      <p className="text-[11px] text-[#1430d8] font-mono font-semibold flex items-center gap-1 pt-0.5">
                                        <FileText className="w-3 h-3 shrink-0" />
                                        <span>Agreement Ref: {ref.orderNumber}</span>
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <div className="text-right tabular-nums">
                                      <span className="block text-[10px] text-neutral-500">
                                        Deal: ${ref.estimatedBudget.toLocaleString()}
                                        {ref.statedBudgetText && ref.status === 'pending' ? ` (${ref.statedBudgetText})` : ''}
                                      </span>
                                      <span className="font-mono text-sm font-extrabold text-[#1430d8]">
                                        {ref.commissionPercentage ?? 20}% = ${ref.commissionAmount.toLocaleString()}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadLeadReceipt(ref)}
                                      className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                                    >
                                      {downloadedReceiptId === ref.id ? (
                                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                      ) : (
                                        <Download className="w-3 h-3 text-[#1430d8] shrink-0" />
                                      )}
                                      <span>Receipt PDF</span>
                                    </button>
                                  </div>
                                </div>

                                {ref.clientMessage && (
                                  <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200/70 text-[11px] text-neutral-600">
                                    <strong className="text-neutral-800 font-semibold">Client Inquiry Scope: </strong>
                                    <span className="line-clamp-2">{ref.clientMessage}</span>
                                  </div>
                                )}

                                {/* Milestone Visual Progress Tracker (7-Stage Pipeline) */}
                                <div className="grid grid-cols-7 gap-1 pt-0.5">
                                  {(
                                    [
                                      { key: 'pending', label: '1. Inquired' },
                                      { key: 'in_negotiation', label: '2. Scoping' },
                                      { key: 'deal_complete', label: '3. Confirmed' },
                                      { key: 'milestone_25', label: '4. 25% Paid' },
                                      { key: 'milestone_35', label: '5. 35% Mid' },
                                      { key: 'milestone_40', label: '6. 40% Final' },
                                      { key: 'commission_paid', label: '7. Settled' }
                                    ] as const
                                  ).map((step, idx) => {
                                    const isDone = ref.status === 'commission_paid' || idx <= currentStepIdx;
                                    const isCurrentStep = ref.status === step.key;
                                    return (
                                      <div key={step.key} className="space-y-1">
                                        <div
                                          className={`h-1.5 rounded-full transition-colors ${
                                            isDone
                                              ? ref.status === 'commission_paid'
                                                ? 'bg-emerald-600'
                                                : 'bg-[#1430d8]'
                                              : 'bg-neutral-200'
                                          }`}
                                        />
                                        <span
                                          className={`block text-[9px] sm:text-[10px] truncate ${
                                            isCurrentStep
                                              ? 'font-bold text-[#0e0e0e]'
                                              : isDone
                                              ? 'font-medium text-neutral-700'
                                              : 'text-neutral-400'
                                          }`}
                                        >
                                          {step.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Live Studio Status Note with Prominent Milestone Progress */}
                                <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-emerald-50/90 border border-blue-200/90 shadow-2xs space-y-2.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                                      </span>
                                      <span className="font-bold text-xs text-[#0e0e0e] tracking-tight">
                                        Live Studio Status from Admin:
                                      </span>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                        ref.status === 'milestone_25'
                                          ? 'bg-teal-100 text-teal-900 border border-teal-300'
                                          : ref.status === 'milestone_35'
                                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                          : ref.status === 'milestone_40'
                                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                          : ref.status === 'deal_complete'
                                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                          : ref.status === 'commission_paid'
                                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                          : ref.status === 'in_negotiation'
                                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                          : 'bg-neutral-100 text-neutral-800'
                                      }`}
                                    >
                                      {STAGE_LABELS[ref.status]}
                                    </span>
                                  </div>

                                  <div className="p-2.5 rounded-lg bg-white/90 border border-neutral-200/80 text-xs text-neutral-800 font-medium">
                                    &ldquo;{ref.adminStatusNote || ref.notes || 'Client details received and locked under your token. Studio is reviewing scope & requirements.'}&rdquo;
                                  </div>

                                  {/* Milestone Payment Breakdown Cards (25% Kickoff · 35% Mid · 40% Final) */}
                                  <div className="grid grid-cols-3 gap-2 pt-0.5 text-[11px] tabular-nums">
                                    <div
                                      className={`p-2 rounded-lg border transition-colors ${
                                        ref.status === 'milestone_25' ||
                                        ref.status === 'milestone_35' ||
                                        ref.status === 'milestone_40' ||
                                        ref.status === 'commission_paid' ||
                                        ref.milestone25Paid
                                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 font-semibold'
                                          : 'bg-white border-neutral-200 text-neutral-600'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-neutral-500 font-medium">1. Kickoff (5%):</span>
                                        {(ref.status === 'milestone_25' ||
                                          ref.status === 'milestone_35' ||
                                          ref.status === 'milestone_40' ||
                                          ref.status === 'commission_paid' ||
                                          ref.milestone25Paid) && (
                                          <span className="text-emerald-700 font-bold">✓ Paid</span>
                                        )}
                                      </div>
                                      <div className="font-mono text-xs font-bold text-[#1430d8] mt-0.5">
                                        ${(ref.milestone25Amount || Math.round((ref.estimatedBudget || 0) * 0.05)).toLocaleString()}
                                      </div>
                                      <span className="block text-[9px] text-neutral-400">Client 25% Deposit</span>
                                    </div>

                                    <div
                                      className={`p-2 rounded-lg border transition-colors ${
                                        ref.status === 'milestone_35' ||
                                        ref.status === 'milestone_40' ||
                                        ref.status === 'commission_paid' ||
                                        ref.milestone35Paid
                                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 font-semibold'
                                          : 'bg-white border-neutral-200 text-neutral-600'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-neutral-500 font-medium">2. Mid Demo (5%):</span>
                                        {(ref.status === 'milestone_35' ||
                                          ref.status === 'milestone_40' ||
                                          ref.status === 'commission_paid' ||
                                          ref.milestone35Paid) && (
                                          <span className="text-emerald-700 font-bold">✓ Paid</span>
                                        )}
                                      </div>
                                      <div className="font-mono text-xs font-bold text-[#1430d8] mt-0.5">
                                        ${(ref.milestone35Amount || Math.round((ref.estimatedBudget || 0) * 0.05)).toLocaleString()}
                                      </div>
                                      <span className="block text-[9px] text-neutral-400">Client 35% Payment</span>
                                    </div>

                                    <div
                                      className={`p-2 rounded-lg border transition-colors ${
                                        ref.status === 'milestone_40' ||
                                        ref.status === 'commission_paid' ||
                                        ref.milestone40Paid
                                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 font-semibold'
                                          : 'bg-white border-neutral-200 text-neutral-600'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-neutral-500 font-medium">3. Final (10%):</span>
                                        {(ref.status === 'milestone_40' ||
                                          ref.status === 'commission_paid' ||
                                          ref.milestone40Paid) && (
                                          <span className="text-emerald-700 font-bold">✓ Paid</span>
                                        )}
                                      </div>
                                      <div className="font-mono text-xs font-bold text-emerald-700 mt-0.5">
                                        ${(ref.milestone40Amount || Math.round((ref.estimatedBudget || 0) * 0.10)).toLocaleString()}
                                      </div>
                                      <span className="block text-[9px] text-emerald-600/80">Client 40% Balance</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quiet Guarantee & Payout Footer inside Partner Card */}
            <div className="mt-5 pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-neutral-600">
              <span>
                <strong>20% Deal Commission:</strong> 5% Kickoff (Client 25%) · 5% Mid (Client 35%) · 10% Final Launch (Client 40%)
              </span>
              <span className="text-neutral-400">
                Supported: Bank Wire · Wise · Payoneer · SadaPay · JazzCash · EasyPaisa · USDT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Share Document Modal with WhatsApp & Gmail Dispatch and Editable Text */}
      <ShareDocumentModal
        isOpen={shareModalConfig.isOpen}
        onClose={() => setShareModalConfig((prev) => ({ ...prev, isOpen: false }))}
        documentType="token"
        partner={shareModalConfig.partner}
        initialChannel={shareModalConfig.channel}
        onDispatched={(notice) => {
          setBatchActionNotice(notice);
          setTimeout(() => setBatchActionNotice(''), 5500);
        }}
      />
    </section>
  );
};

