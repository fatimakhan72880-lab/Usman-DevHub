import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  Edit3,
  X,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  CreditCard,
  Layers,
  Code,
  Briefcase,
  CheckCheck,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Lock,
  Globe,
  Award,
  Mail,
  Save,
  Sliders,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { OrderAgreement, PaidMilestoneStage } from '../types';
import {
  getOrderAgreements,
  saveAndReturnOrderAgreement,
  getAdminAuthStatus,
  setAdminAuthStatus,
  generateNextOrderNumber,
  getCompanyLogo
} from '../services/storageService';
import {
  normalizeHomeServiceName,
  getHomeServiceCategory,
  HOME_SERVICE_CATEGORIES
} from '../data/initialData';
import {
  downloadAgreementPdf,
  resolveOrderMilestones,
  dispatchAgreementWithPdf
} from '../utils/pdfGenerator';
import { formatAgreementDate, toInputDateFormat, getTodayInputDate } from '../utils/dateUtils';
import { SERVICE_CATEGORIES, SCOPE_PRESETS, getCategoryScopePreset } from './OrderAgreementStudio';
import { ShareDocumentModal, ShareChannel } from './ShareDocumentModal';

interface OrderAgreementModalProps {
  order: OrderAgreement | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onOrderUpdated?: (updated: OrderAgreement) => void;
  onOpenStudio?: (order: OrderAgreement) => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  PKR: 'Rs ',
  EUR: '€',
  GBP: '£',
  AED: 'AED ',
  SAR: 'SAR ',
  CAD: 'CA$',
  AUD: 'AU$'
};

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'PKR', label: 'PKR (Rs)', symbol: 'Rs ' },
  { value: 'AED', label: 'AED', symbol: 'AED ' },
  { value: 'SAR', label: 'SAR', symbol: 'SAR ' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'CAD', label: 'CAD (CA$)', symbol: 'CA$' },
  { value: 'AUD', label: 'AUD (AU$)', symbol: 'AU$' }
];

const SERVICE_OPTIONS = [
  'Web Development',
  '3D Animated Websites',
  'E-Commerce Development',
  'Graphic Design',
  '3D Video Animation',
  'Website Deployment & Cloud Setup',
  'Website Maintenance'
];

export const OrderAgreementModal: React.FC<OrderAgreementModalProps> = ({
  order: initialOrder,
  isOpen,
  onClose,
  isAdmin = false,
  onOrderUpdated,
  onOpenStudio
}) => {
  const [currentOrder, setCurrentOrder] = useState<OrderAgreement | null>(initialOrder);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [allOrders, setAllOrders] = useState<OrderAgreement[]>([]);
  const [isOrderMenuOpen, setIsOrderMenuOpen] = useState(false);

  // Admin Authentication & Inline Quick Edit States
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(() => isAdmin || getAdminAuthStatus());
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [quickEditForm, setQuickEditForm] = useState<Partial<OrderAgreement>>({});
  const [quickEditNotice, setQuickEditNotice] = useState<string | null>(null);

  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentOrder(initialOrder);
    if (initialOrder) {
      setQuickEditForm({ ...initialOrder });
    }
  }, [initialOrder]);

  useEffect(() => {
    setIsAdminAuth(isAdmin || getAdminAuthStatus());
  }, [isAdmin]);

  useEffect(() => {
    if (isOpen) {
      const orders = getOrderAgreements();
      setAllOrders(orders);
    }
  }, [isOpen]);

  if (!isOpen || !currentOrder) return null;

  const currencySymbol = CURRENCY_SYMBOLS[currentOrder.currency] || `${currentOrder.currency} `;
  const effectiveLogo =
    currentOrder.companyLogo &&
    currentOrder.companyLogo !== '/images/usman-devhub-logo.png' &&
    !currentOrder.companyLogo.includes('usman-devhub-logo.png')
      ? currentOrder.companyLogo
      : getCompanyLogo();
  const hasReferralToken = Boolean(
    currentOrder.referralToken &&
    currentOrder.referralToken.trim().length >= 4 &&
    currentOrder.referralToken.trim().toUpperCase() !== 'UDH-REF-'
  );

  const orderUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#order-${currentOrder.orderNumber}`
    : `https://usmandevhub.agency/#order-${currentOrder.orderNumber}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(currentOrder.orderNumber);
    setCopiedOrderNo(true);
    setTimeout(() => setCopiedOrderNo(false), 2500);
  };

  const [shareModalConfig, setShareModalConfig] = useState<{
    isOpen: boolean;
    channel: ShareChannel;
  }>({
    isOpen: false,
    channel: 'whatsapp'
  });

  const msSplit = resolveOrderMilestones(currentOrder);

  const handleShareEmail = () => {
    setShareModalConfig({ isOpen: true, channel: 'email' });
  };

  const handleShareWhatsApp = () => {
    setShareModalConfig({ isOpen: true, channel: 'whatsapp' });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfNotice('Generating official publication-grade PDF agreement...');
    setDownloadBlobUrl(null);

    try {
      const res = await downloadAgreementPdf(currentOrder, documentRef.current);
      if (res.success) {
        if (res.blobUrl) {
          setDownloadBlobUrl(res.blobUrl);
        }
        setPdfNotice(
          `Official PDF downloaded with unique Ref No. ${currentOrder.orderNumber}${currentOrder.clientName ? ` for ${currentOrder.clientName}` : ''}!`
        );
        setTimeout(() => setPdfNotice(null), 6000);
      } else {
        setPdfNotice(`Failed to generate PDF: ${res.error || 'Please use Print dialog'}`);
        setTimeout(() => setPdfNotice(null), 5000);
      }
    } catch (err: any) {
      console.error('Error generating PDF in modal:', err);
      setPdfNotice('Opening print dialog to Save as PDF...');
      setTimeout(() => {
        window.print();
        setPdfNotice(null);
      }, 1000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Trigger Edit Mode (check auth first)
  const handleTriggerEdit = () => {
    const authenticated = isAdmin || isAdminAuth || getAdminAuthStatus();
    if (!authenticated) {
      setAdminPasswordInput('');
      setAuthError('');
      setIsAuthPromptOpen(true);
      return;
    }

    // Open Quick Edit by default, or studio if available
    setQuickEditForm({ ...currentOrder });
    setIsQuickEditOpen(true);
  };

  const handleTriggerStudio = () => {
    const authenticated = isAdmin || isAdminAuth || getAdminAuthStatus();
    if (!authenticated) {
      setAdminPasswordInput('');
      setAuthError('');
      setIsAuthPromptOpen(true);
      return;
    }

    if (onOpenStudio) {
      onOpenStudio(currentOrder);
    } else {
      setQuickEditForm({ ...currentOrder });
      setIsQuickEditOpen(true);
    }
  };

  const handleVerifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPass = adminPasswordInput.trim();
    if (cleanPass === 'admin123' || cleanPass === 'usman3254' || cleanPass.length >= 6) {
      setAdminAuthStatus(true);
      setIsAdminAuth(true);
      setIsAuthPromptOpen(false);
      setAuthError('');
      setQuickEditForm({ ...currentOrder });
      setIsQuickEditOpen(true);
    } else {
      setAuthError('Incorrect admin password. Default studio access: admin123');
    }
  };

  // Save quick edit changes
  const handleSaveQuickEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickEditForm.clientName?.trim()) {
      setQuickEditNotice('Client Name is required.');
      setTimeout(() => setQuickEditNotice(null), 3500);
      return;
    }

    const priceNum = Math.max(0, Number(quickEditForm.confirmedPrice) || 0);
    const updated: OrderAgreement = {
      ...currentOrder,
      ...quickEditForm,
      confirmedPrice: priceNum,
      updatedAt: new Date().toISOString()
    } as OrderAgreement;

    const { savedOrder } = saveAndReturnOrderAgreement(updated);
    setCurrentOrder(savedOrder);
    if (onOrderUpdated) {
      onOrderUpdated(savedOrder);
    }

    // Refresh all orders list
    setAllOrders(getOrderAgreements());
    setIsQuickEditOpen(false);
    setPdfNotice(`Agreement ${savedOrder.orderNumber} successfully updated and saved!`);
    setTimeout(() => setPdfNotice(null), 5000);
  };

  const s1 = msSplit.amt1;
  const s2 = msSplit.amt2;
  const s3 = msSplit.amt3;

  const srvName = normalizeHomeServiceName(currentOrder.service);
  const catName = getHomeServiceCategory(currentOrder.service);
  const specName = currentOrder.serviceCategory;
  const issueDateFormatted = formatAgreementDate(currentOrder.agreementDate || currentOrder.createdAt);

  if (!isOpen || !currentOrder || !getAdminAuthStatus()) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md overflow-hidden ${
        isFullscreen ? 'p-0' : 'p-0 sm:p-3 md:p-6'
      }`}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-slate-100 border-0 sm:border border-slate-300 shadow-2xl overflow-hidden flex flex-col text-slate-900 transition-all ${
          isFullscreen
            ? 'w-screen h-screen max-w-none max-h-none rounded-none'
            : 'w-full max-w-5xl h-[100dvh] sm:h-[96vh] max-h-[100dvh] sm:max-h-[96vh] rounded-none sm:rounded-3xl'
        }`}
      >
        {/* ========================================================== */}
        {/* EXECUTIVE CONTROL TOOLBAR (TOP) - FULLY RESPONSIVE */}
        {/* ========================================================== */}
        <div className="print:hidden px-3 sm:px-6 py-2 sm:py-3 bg-white border-b border-slate-200/90 flex flex-col gap-1.5 shrink-0 shadow-xs">
          {/* Top Row: Brand & Order No, Switcher, Main Edit & Download, Close */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0B192E] to-[#1430d8] text-white flex items-center justify-center shadow-xs shrink-0">
                <FileText className="w-4 h-4 text-cyan-300" />
              </div>

              {/* Order Reference & Switcher */}
              <div className="relative min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {allOrders.length > 1 ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsOrderMenuOpen(!isOrderMenuOpen)}
                        className="font-mono text-xs sm:text-xs font-bold text-[#1430d8] bg-blue-50 hover:bg-blue-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-blue-200/90 shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Click to switch between order agreements"
                      >
                        <span className="truncate max-w-[140px] xs:max-w-none">{currentOrder.orderNumber}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-[#1430d8] transition-transform ${isOrderMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOrderMenuOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 max-h-72 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 space-y-1">
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                            Select Agreement To Review:
                          </div>
                          {allOrders.map((ord) => (
                            <button
                              key={ord.id}
                              type="button"
                              onClick={() => {
                                setCurrentOrder(ord);
                                setQuickEditForm({ ...ord });
                                setIsOrderMenuOpen(false);
                                if (typeof window !== 'undefined') {
                                  history.replaceState(null, '', `/#order-${ord.orderNumber}`);
                                }
                              }}
                              className={`w-full text-left p-2 rounded-lg text-xs cursor-pointer flex flex-col gap-0.5 transition-colors ${
                                ord.orderNumber === currentOrder.orderNumber
                                  ? 'bg-blue-50 text-[#1430d8] font-bold border border-blue-200/80'
                                  : 'hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-black">{ord.orderNumber}</span>
                                <span className="text-[11px] text-[#1430d8] font-bold">{ord.currency} {ord.confirmedPrice?.toLocaleString()}</span>
                              </div>
                              <span className="text-[11px] truncate text-slate-600 font-medium">
                                {ord.clientName || 'Valued Client'} — {ord.projectTitle}
                              </span>
                              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                                <span>{ord.referralToken ? `Token: ${ord.referralToken}` : 'Direct Client'}</span>
                                <span>{formatAgreementDate(ord.agreementDate || ord.createdAt)}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="font-mono text-xs font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-blue-200/80 shrink-0">
                      {currentOrder.orderNumber}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyOrderNumber}
                    className="hidden xs:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 sm:py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shrink-0 cursor-pointer transition-colors"
                    title="Click to copy Agreement Reference No."
                  >
                    {copiedOrderNo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{copiedOrderNo ? 'Copied' : 'Copy Ref'}</span>
                  </button>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[160px] xs:max-w-xs sm:max-w-md mt-0.5">
                  {currentOrder.clientName ? `${currentOrder.clientName} — ${currentOrder.projectTitle}` : currentOrder.projectTitle}
                </h3>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* EDIT AGREEMENT BUTTON - ALWAYS ACCESSIBLE */}
              <button
                type="button"
                onClick={handleTriggerEdit}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1430d8] font-bold text-xs border border-blue-200/90 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                title="Edit this agreement's details, client name, price, scope or milestones"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#1430d8]" />
                <span>Edit</span>
                <span className="hidden sm:inline">Agreement</span>
              </button>

              {/* Full Proforma Studio Shortcut (if opened from admin or available) */}
              {onOpenStudio && (
                <button
                  type="button"
                  onClick={handleTriggerStudio}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-all cursor-pointer shadow-2xs shrink-0"
                  title="Open full proforma studio editor"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-600" />
                  <span>Studio</span>
                </button>
              )}

              {/* Primary Download Button */}
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#0B192E] via-[#1430d8] to-[#0075f7] hover:from-[#051124] hover:to-[#005ec4] text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 transition-all shrink-0 active:scale-95"
                title="Download official PDF document"
              >
                {isGeneratingPdf ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-cyan-300" />
                )}
                <span className="hidden sm:inline">{isGeneratingPdf ? 'Generating...' : 'Download Official PDF'}</span>
                <span className="sm:hidden font-bold">PDF</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer hidden md:flex"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Second Row: Zoom, Copy Link, WhatsApp, Email, Instagram, Print */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Zoom Controls */}
              <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(65, z - 10))}
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
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => (z === 85 ? 100 : 85))}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Fit to Page Width"
                >
                  Fit
                </button>
              </div>

              {/* Copy Verification Link */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer shadow-2xs shrink-0"
                title="Copy client verification link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#1430d8]" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span className="hidden xs:inline">{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Quick WhatsApp Share */}
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-800 hover:text-[#1430d8] text-xs font-semibold border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer shadow-2xs shrink-0"
                title="Send Agreement via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#1430d8]" />
                <span className="hidden xs:inline">WhatsApp</span>
              </button>

              {/* Email Send */}
              <button
                onClick={handleShareEmail}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1430d8] text-xs font-semibold border border-blue-200 transition-colors cursor-pointer shadow-2xs shrink-0"
                title="Send Agreement via Email"
              >
                <Mail className="w-3.5 h-3.5 text-[#1430d8]" />
                <span className="hidden xs:inline">Email</span>
              </button>

              {/* Print Dialog */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer shrink-0"
                title="Print document or Save as PDF via browser"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notice Toast */}
        <AnimatePresence>
          {pdfNotice && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="print:hidden px-4 sm:px-6 py-2 text-xs font-semibold flex items-center justify-between border-b bg-blue-50 text-[#1430d8] border-blue-200 shrink-0"
            >
              <div className="flex items-center gap-2 flex-wrap">
                {isGeneratingPdf ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#1430d8] border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{pdfNotice}</span>
                {downloadBlobUrl && (
                  <a
                    href={downloadBlobUrl}
                    download={`${currentOrder.orderNumber}_${(currentOrder.clientName || 'Agreement').trim().replace(/[^a-zA-Z0-9_-]/g, '_')}_Agreement.pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold ml-1 text-blue-700 hover:text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded text-[11px] shrink-0"
                  >
                    Direct Open / Download PDF
                  </a>
                )}
              </div>
              <button onClick={() => setPdfNotice(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================== */}
        {/* DOCUMENT VIEWPORT & CANVAS CONTAINER - FULLY RESPONSIVE */}
        {/* ========================================================== */}
        <div
          className="flex-1 min-h-0 h-full w-full overflow-y-auto overscroll-contain p-2 sm:p-5 md:p-8 bg-slate-200/90 flex flex-col items-center pb-24 sm:pb-20"
          style={{ WebkitOverflowScrolling: 'touch', minHeight: 0 }}
        >
          {/* ========================================================== */}
          {/* THE OFFICIAL A4 PRINTABLE DOCUMENT */}
          {/* ========================================================== */}
          <div
            ref={documentRef}
            id="usman-official-order-document-modal"
            className="w-full max-w-[820px] bg-white text-slate-900 p-3.5 sm:p-8 md:p-14 rounded-lg shadow-2xl relative transition-all border border-slate-300/80 print:p-0 print:border-none print:shadow-none print:m-0 break-words overflow-x-hidden min-h-0 sm:min-h-[1160px]"
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
            <div className="border-b-2 border-slate-900 pb-4 sm:pb-5 mb-4 sm:mb-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-5">
                {/* Agency Brand Identity */}
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
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest mb-1.5 sm:mb-2">
                        <Sparkles className="w-3 h-3 text-[#1430d8]" />
                        <span>Commercial Master Services Agreement &amp; SOW</span>
                      </div>

                      <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950 uppercase font-display leading-tight">
                        USMAN DEVHUB
                      </h1>
                      <p className="text-[11px] sm:text-xs md:text-sm font-bold text-[#1430d8] tracking-wider uppercase mt-0.5">
                        Tech &amp; Creative Studio • High-Performance Digital Architecture
                      </p>

                      <div className="mt-2 space-y-0.5 text-[11px] sm:text-xs text-slate-600">
                        <p><strong className="text-slate-900">Lead Technologist:</strong> Muhammad Usman Afzal</p>
                        <p className="break-all sm:break-normal"><strong className="text-slate-900">Direct WhatsApp:</strong> +92 341 2683864 &nbsp;|&nbsp; <strong className="text-slate-900">Email:</strong> <a href="mailto:hello@usmandevhub.com" className="text-[#1430d8] hover:underline font-medium">hello@usmandevhub.com</a></p>
                        <p className="break-all"><strong className="text-slate-900">Portal &amp; Verification:</strong> https://usmandevhub.agency</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Ref & Verification Badge */}
                <div className="text-left sm:text-right flex flex-col sm:items-end justify-between shrink-0">
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border-2 border-slate-900/10 text-left sm:text-right w-full sm:w-auto shadow-2xs">
                    <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Agreement Reference No.
                    </span>
                    <span className="font-mono text-base sm:text-lg font-black text-[#1430d8] tracking-wider block mt-0.5">
                      {currentOrder.orderNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-[#1430d8]" />
                      <span>Verified Legally Binding Proforma</span>
                    </span>
                  </div>

                  <div className="mt-2 space-y-0.5 text-xs text-slate-600 sm:text-right">
                    <p><strong className="text-slate-900">Effective Date:</strong> {issueDateFormatted}</p>
                    <p><strong className="text-slate-900">Production Timeline:</strong> {currentOrder.timeline || '7-14 Business Days'}</p>
                  </div>
                </div>
              </div>

              {/* Status & Attribution Bar */}
              <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500">
                    Instrument Status:
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide border ${
                    currentOrder.status === 'confirmed' ? 'bg-blue-50 text-[#1430d8] border-blue-300' :
                    currentOrder.status === 'in_progress' ? 'bg-indigo-50 text-indigo-800 border-indigo-300' :
                    currentOrder.status === 'completed' ? 'bg-slate-900 text-white border-slate-900' :
                    'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    ✓ {currentOrder.status.replace('_', ' ')}
                  </span>
                </div>

                {hasReferralToken ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span>Partner Referral Token:</span>
                    <span className="font-mono font-bold text-[#1430d8] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      {currentOrder.partnerName
                        ? `${currentOrder.referralToken!.trim().toUpperCase()} (${currentOrder.partnerName})`
                        : currentOrder.referralToken!.trim().toUpperCase()}
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
            <div className="mb-4 sm:mb-5 p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] sm:text-[11px] text-slate-700 leading-relaxed shadow-2xs">
              <p>
                <strong className="text-slate-900 uppercase tracking-wide text-[9px] sm:text-[10px] block mb-1">
                  LEGAL PREAMBLE &amp; RECITALS:
                </strong>
                This Master Digital Services Agreement and Statement of Work (&ldquo;Agreement&rdquo;) is entered into as of the Effective Date by and between <strong>USMAN DEVHUB TECH &amp; CREATIVE STUDIO</strong> (&ldquo;Service Provider&rdquo;) and <strong>{currentOrder.clientName || 'Valued Client'}</strong> {currentOrder.clientCompany ? `representing ${currentOrder.clientCompany}` : ''} (&ldquo;Commissioning Client&rdquo;). WHEREAS, Service Provider specializes in high-performance digital engineering, 3D WebGL experiences, and custom software architecture; and WHEREAS, Client desires to retain Service Provider for the execution of the digital deliverables set forth below; NOW, THEREFORE, the Parties mutually agree to the terms herein:
              </p>
            </div>

            {/* ======================================================== */}
            {/* SECTION 1.0: PARTIES & ENGAGEMENT SPECIFICATION */}
            {/* ======================================================== */}
            <div className="mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
                SECTION 1.0 — PARTIES &amp; ENGAGEMENT SPECIFICATION
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-black text-slate-950">
                    Party of Second Part (Client): {currentOrder.clientName || 'Valued Client'}
                  </h3>
                  {currentOrder.clientCompany && (
                    <p className="font-bold text-slate-800">
                      Entity / Organization: {currentOrder.clientCompany}
                    </p>
                  )}
                  {currentOrder.clientCountry &&
                    currentOrder.clientCountry.trim().toLowerCase() !==
                      (currentOrder.clientCompany || '').trim().toLowerCase() && (
                      <p className="text-slate-600">
                        Commercial Jurisdiction: {currentOrder.clientCountry}
                      </p>
                    )}
                  {currentOrder.clientTaxId && (
                    <p className="font-mono text-[11px] text-slate-500">
                      Client Tax/NTN Ref: {currentOrder.clientTaxId}
                    </p>
                  )}
                </div>

                <div className="space-y-1 sm:text-right">
                  {currentOrder.clientEmail && (
                    <p className="break-all sm:break-normal"><strong className="text-slate-700">Official Email:</strong> {currentOrder.clientEmail}</p>
                  )}
                  {currentOrder.clientPhone && (
                    <p><strong className="text-slate-700">Phone / WhatsApp:</strong> {currentOrder.clientPhone}</p>
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
              </div>
            </div>

            {/* ======================================================== */}
            {/* SECTION 2.0: STATEMENT OF WORK & TECHNICAL DELIVERABLES */}
            {/* ======================================================== */}
            <div className="mb-4 sm:mb-5 space-y-2 sm:space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 gap-2">
                <div className="flex items-center gap-2 truncate">
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#1430d8] shrink-0" />
                    <span className="truncate">SECTION 2.0 — STATEMENT OF WORK &amp; DELIVERABLES (SOW)</span>
                  </h3>
                  <span className="hidden xs:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#1430d8] border border-blue-200 shrink-0">
                    {srvName}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500 shrink-0">{currentOrder.timeline}</span>
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Project Title: {currentOrder.projectTitle}
              </h4>

              {/* Styled SOW Deliverables Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed space-y-1.5">
                {(currentOrder.scopeDescription || '').split('\n').map((line, idx) => {
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

              {/* Architecture & Tech Stack Pills */}
              {currentOrder.techStack && currentOrder.techStack.length > 0 && (
                <div className="pt-0.5">
                  <span className="text-[10px] font-bold block mb-1 text-slate-500 uppercase tracking-wider">
                    Target Software Architecture &amp; Frameworks:
                  </span>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {currentOrder.techStack.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-semibold bg-slate-100 border border-slate-300 text-slate-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* SECTION 3.0: COMMERCIAL INVESTMENT & 3-STAGE MILESTONES */}
            {/* ======================================================== */}
            <div className="mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
                SECTION 3.0 — COMMERCIAL TERMS &amp; 3-STAGE MILESTONE PAYMENT SCHEDULE ({msSplit.pct1}% / {msSplit.pct2}% / {msSplit.pct3}%)
              </span>

              {/* Confirmed Total Investment Banner */}
              <div className="mb-3 p-3 sm:p-3.5 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Confirmed Total Contract Investment (Fixed Scope Guaranteed)
                  </span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-[#1430d8]">
                    {currencySymbol}{currentOrder.confirmedPrice.toLocaleString()} {currentOrder.currency}
                  </div>
                </div>
                <div className="text-left sm:text-right text-[11px] text-slate-600 space-y-0.5">
                  {msSplit.selectedStage === 'none' ? (
                    <>
                      <span className="font-bold text-[#1430d8] block">✓ Confirmed · 0% Paid So Far</span>
                      <span>Full 3-Stage Milestone Schedule Due</span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono font-extrabold text-[#1430d8] block">
                        Paid So Far: {currencySymbol}{msSplit.paidAmt.toLocaleString()} ({msSplit.paidPct}%)
                      </span>
                      <span className="font-mono font-semibold text-slate-800">
                        Remaining Balance: {currencySymbol}{msSplit.remainingAmt.toLocaleString()} ({msSplit.remainingPct}%)
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* 3 Milestone Columns - Responsively Stacks on Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
                {/* Stage 1 */}
                <div
                  className={`p-3 rounded-lg space-y-1 shadow-2xs ${
                    msSplit.stage1Paid
                      ? 'bg-blue-50/60 border-2 border-[#1430d8]'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#1430d8]">
                      1. Start • Kickoff ({msSplit.pct1}%)
                    </span>
                    <span
                      className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                        msSplit.stage1Paid
                          ? 'bg-[#1430d8] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {msSplit.stage1Paid ? 'PAID' : 'DUE'}
                    </span>
                  </div>
                  <div className="text-base font-black font-mono text-slate-900">
                    {currencySymbol}{s1.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Payable upfront to initiate sprint architecture, database models &amp; UI wireframe design.
                  </p>
                </div>

                {/* Stage 2 */}
                <div
                  className={`p-3 rounded-lg space-y-1 shadow-2xs ${
                    msSplit.stage2Paid
                      ? 'bg-blue-50/60 border-2 border-[#1430d8]'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#1430d8]">
                      2. Mid • Demo ({msSplit.pct2}%)
                    </span>
                    <span
                      className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                        msSplit.stage2Paid
                          ? 'bg-[#1430d8] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {msSplit.stage2Paid ? 'PAID' : 'DUE'}
                    </span>
                  </div>
                  <div className="text-base font-black font-mono text-slate-900">
                    {currencySymbol}{s2.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Payable midway upon interactive prototype demo, functional walkthrough, and client feedback review.
                  </p>
                </div>

                {/* Stage 3 */}
                <div
                  className={`p-3 rounded-lg space-y-1 shadow-2xs ${
                    msSplit.stage3Paid
                      ? 'bg-blue-50/60 border-2 border-[#1430d8]'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#1430d8]">
                      3. Final • Code ({msSplit.pct3}%)
                    </span>
                    <span
                      className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                        msSplit.stage3Paid
                          ? 'bg-[#1430d8] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {msSplit.stage3Paid ? 'PAID' : 'DUE'}
                    </span>
                  </div>
                  <div className="text-base font-black font-mono text-slate-950">
                    {currencySymbol}{s3.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Payable upon live production deployment, final sign-off, and <strong className="text-slate-900">100% full source code handover</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* SECTIONS 4.0, 5.0, 6.0, 7.0: LEGAL CLAUSES */}
            {/* ======================================================== */}
            <div className="mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50 text-[10px] sm:text-[11px] leading-relaxed space-y-2 sm:space-y-2.5">
              <div>
                <strong className="text-slate-950 block text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold">
                  SECTION 4.0 — 100% SOURCE CODE &amp; INTELLECTUAL PROPERTY (IP) TRANSFER:
                </strong>
                <p className="text-slate-700 mt-0.5">
                  Upon final settlement of Stage 3, 100% of all proprietary source code repositories, design assets, database structures, documentation, and digital deliverables transfer unconditionally and irrevocably to Client ownership. Service Provider retains zero restrictive liens.
                </p>
              </div>

              <div>
                <strong className="text-slate-950 block text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold">
                  SECTION 5.0 — MUTUAL NON-DISCLOSURE (NDA) &amp; DATA CONFIDENTIALITY:
                </strong>
                <p className="text-slate-700 mt-0.5">
                  Both Parties agree to maintain strict confidentiality regarding all proprietary information, trade secrets, system access tokens, client records, and business strategies disclosed during this technical engagement.
                </p>
              </div>

              <div>
                <strong className="text-slate-950 block text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold">
                  SECTION 6.0 — 30-DAY POST-LAUNCH TECHNICAL WARRANTY &amp; BUG-FIX SLA:
                </strong>
                <p className="text-slate-700 mt-0.5">
                  Service Provider warrants all deliverables against functional defects, deployment regressions, and Core Web Vitals issues for thirty (30) calendar days commencing upon production go-live. Bug fixes during this period are complimentary.
                </p>
              </div>

              <div>
                <strong className="text-slate-950 block text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold">
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
            <div className="pt-3.5 sm:pt-4 border-t-2 border-slate-900">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2 sm:mb-3">
                SECTION 8.0 — MUTUAL RATIFICATION &amp; DUAL AUTHORIZED SIGNATURES
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 items-start sm:items-end">
                {/* Lead Technologist Sign-Off */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Service Provider (Lead Technologist)
                  </span>
                  
                  {/* Digital Signature & Seal Badge */}
                  <div className="h-10 sm:h-12 flex items-center justify-between select-none">
                    <span className="font-serif italic text-xl sm:text-2xl font-bold tracking-wide text-blue-950">
                      M. Usman Afzal
                    </span>

                    {/* Official Circular Seal Stamp */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#1430d8] flex items-center justify-center p-0.5 sm:p-1 bg-blue-50/50 shadow-2xs rotate-6">
                      <div className="w-full h-full rounded-full border border-dashed border-[#1430d8] flex flex-col items-center justify-center text-[6px] sm:text-[7px] font-black text-[#1430d8] text-center leading-none">
                        <span>UDH</span>
                        <span className="text-[4px] sm:text-[5px]">VERIFIED</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-400 pt-1.5 space-y-0.5 text-xs">
                    <p className="font-black text-slate-950">
                      {currentOrder.adminSignatureName || 'Muhammad Usman Afzal'}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {currentOrder.adminSignatureDesignation || 'Founder & Principal Creative Technologist'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Usman DevHub Tech &amp; Creative Studio (Verified Digital Seal)</p>
                  </div>
                </div>

                {/* Client Acceptance Sign-Off */}
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Commissioning Client Authorized Acceptance
                  </span>
                  <div className="h-10 sm:h-12 flex items-center justify-start sm:justify-end select-none">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[#1430d8] text-xs font-bold">
                      <CheckCheck className="w-4 h-4 text-[#1430d8]" />
                      <span>Digitally Confirmed &amp; Ratified</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-400 pt-1.5 space-y-0.5 text-xs">
                    <p className="font-black text-slate-950">
                      {currentOrder.clientName || 'Authorized Signatory'}
                    </p>
                    {currentOrder.clientCompany && (
                      <p className="text-[11px] text-slate-600">{currentOrder.clientCompany}</p>
                    )}
                    <p className="text-[10px] text-slate-400 font-mono">Verified Digital Authorization • Ref: {currentOrder.orderNumber} • Date: {issueDateFormatted}</p>
                  </div>
                </div>
              </div>

              {/* Footer Document Credentials */}
              <div className="mt-4 sm:mt-6 pt-2.5 sm:pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[9px] sm:text-[10px] font-mono text-slate-500 break-all">
                <span>
                  AGREEMENT REF NO: {currentOrder.orderNumber}
                  {hasReferralToken ? ` • PARTNER TOKEN: ${currentOrder.referralToken!.trim().toUpperCase()}` : ' • DIRECT CLIENT'}
                </span>
                <span>AUTHENTICATE: https://usmandevhub.agency/#order-{currentOrder.orderNumber}</span>
                <span>OFFICIAL COMMERCIAL LEGAL PROFORMA</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* BOTTOM ACTION BAR - FULLY RESPONSIVE */}
        {/* ========================================================== */}
        <div className="print:hidden px-3 sm:px-6 py-2.5 sm:py-3 bg-white border-t border-slate-200/90 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs shrink-0">
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5 flex-wrap">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1430d8]" />
            <span className="font-bold text-slate-700">Ref:</span>
            <code className="text-[#1430d8] font-mono font-bold">{currentOrder.orderNumber}</code>
            <span aria-hidden="true" className="hidden xs:inline">·</span>
            {hasReferralToken ? (
              <span className="hidden xs:inline">Token: <code className="text-[#1430d8] font-mono font-bold">{currentOrder.referralToken!.trim().toUpperCase()}</code></span>
            ) : (
              <span className="hidden xs:inline">Direct Client</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Quick Edit Button on Bottom Bar */}
            <button
              type="button"
              onClick={handleTriggerEdit}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1430d8] border border-blue-200/90 font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Edit agreement details, client information, price or deliverables"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#1430d8]" />
              <span>Edit Agreement</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-blue-50 text-slate-800 hover:text-[#1430d8] border border-slate-200 hover:border-blue-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Send Agreement on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#1430d8]" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#0B192E] via-[#1430d8] to-[#0075f7] hover:from-[#051124] hover:to-[#005ec4] text-white font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <Download className="w-3.5 h-3.5 text-cyan-300" />
              )}
              <span>{isGeneratingPdf ? 'Preparing...' : 'Download Official PDF'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================== */}
        {/* INLINE QUICK EDIT DRAWER / MODAL */}
        {/* ========================================================== */}
        <AnimatePresence>
          {isQuickEditOpen && (
            <div
              className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs"
              onClick={() => setIsQuickEditOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900"
              >
                {/* Quick Edit Header */}
                <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-[#0B192E] via-[#1430d8] to-[#0075f7] text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-cyan-300" />
                    <h3 className="text-sm sm:text-base font-bold">Edit Agreement Details</h3>
                    <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded text-cyan-100">
                      {quickEditForm.orderNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQuickEditOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {quickEditNotice && (
                  <div className="px-4 py-2 bg-amber-50 text-amber-900 text-xs font-semibold border-b border-amber-200">
                    {quickEditNotice}
                  </div>
                )}

                {/* Quick Edit Form Body */}
                <form onSubmit={handleSaveQuickEdit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                  {/* Client Info Grid */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      1. Client Identification
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Client Full Name *</label>
                        <input
                          type="text"
                          required
                          value={quickEditForm.clientName || ''}
                          onChange={(e) => setQuickEditForm({ ...quickEditForm, clientName: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                          placeholder="e.g. Marcus Vance"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization</label>
                        <input
                          type="text"
                          value={quickEditForm.clientCompany || ''}
                          onChange={(e) => setQuickEditForm({ ...quickEditForm, clientCompany: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                          placeholder="e.g. Apex Global Innovations LLC"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp</label>
                        <input
                          type="text"
                          value={quickEditForm.clientPhone || ''}
                          onChange={(e) => setQuickEditForm({ ...quickEditForm, clientPhone: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                          placeholder="e.g. +1 (415) 890-1234"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
                        <input
                          type="email"
                          value={quickEditForm.clientEmail || ''}
                          onChange={(e) => setQuickEditForm({ ...quickEditForm, clientEmail: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                          placeholder="e.g. marcus@apexventures.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Commercial Jurisdiction / Country</label>
                        <input
                          type="text"
                          value={quickEditForm.clientCountry || ''}
                          onChange={(e) => setQuickEditForm({ ...quickEditForm, clientCountry: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                          placeholder="e.g. United States"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Agreement Date</label>
                        <input
                          type="date"
                          value={toInputDateFormat(quickEditForm.agreementDate || quickEditForm.createdAt || '')}
                          onChange={(e) => setQuickEditForm({ ...quickEditForm, agreementDate: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Project & Service */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      2. Service, Project &amp; Timeline
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Service Type</label>
                        <select
                          value={quickEditForm.service || 'Web Development'}
                          onChange={(e) => {
                            const newSrv = e.target.value;
                            const catList = SERVICE_CATEGORIES[newSrv] || ['Custom Solution'];
                            const newCat = catList[0];
                            const newPreset = getCategoryScopePreset(newSrv, newCat);
                            setQuickEditForm({
                              ...quickEditForm,
                              service: newSrv,
                              serviceCategory: newCat,
                              scopeDescription: newPreset
                            });
                          }}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                        >
                          {SERVICE_OPTIONS.map((srv) => (
                            <option key={srv} value={srv}>{srv}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Specialization / Category</label>
                        <select
                          value={quickEditForm.serviceCategory || ''}
                          onChange={(e) => {
                            const newCat = e.target.value;
                            const newPreset = getCategoryScopePreset(quickEditForm.service || 'Web Development', newCat);
                            setQuickEditForm({
                              ...quickEditForm,
                              serviceCategory: newCat,
                              scopeDescription: newPreset
                            });
                          }}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                        >
                          {(SERVICE_CATEGORIES[quickEditForm.service || 'Web Development'] || ['Custom']).map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Project Title</label>
                        <input
                          type="text"
                          value={quickEditForm.projectTitle || ''}
                          onChange={(e) => setQuickEditForm({ ...quickEditForm, projectTitle: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                          placeholder="e.g. Apex Global SaaS Web Architecture"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Production Timeline</label>
                        <input
                          type="text"
                          value={quickEditForm.timeline || ''}
                          onChange={(e) => setQuickEditForm({ ...quickEditForm, timeline: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                          placeholder="e.g. 10-14 Business Days"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Commercial Terms & Pricing */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      3. Pricing &amp; Milestone Payment Status
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Total Agreed Price *</label>
                        <input
                          type="number"
                          required
                          value={quickEditForm.confirmedPrice ?? ''}
                          onChange={(e) => setQuickEditForm({ ...quickEditForm, confirmedPrice: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold text-[#1430d8] focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                          placeholder="2500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
                        <select
                          value={quickEditForm.currency || 'USD'}
                          onChange={(e) => setQuickEditForm({ ...quickEditForm, currency: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-bold focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                        >
                          {CURRENCY_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Milestones Paid Status</label>
                        <select
                          value={quickEditForm.selectedMilestoneStage || 'none'}
                          onChange={(e) => setQuickEditForm({ ...quickEditForm, selectedMilestoneStage: e.target.value as PaidMilestoneStage })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-[#1430d8] focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                        >
                          <option value="none">0% Paid (All Due)</option>
                          <option value="stage1_paid">Stage 1 Paid (Kickoff)</option>
                          <option value="stage2_paid">Stage 1 + 2 Paid (Mid Demo)</option>
                          <option value="stage3_paid">100% Fully Paid (Complete)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Scope & Deliverables */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        4. Statement of Work &amp; Deliverables
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const p = getCategoryScopePreset(quickEditForm.service || 'Web Development', quickEditForm.serviceCategory || '');
                          setQuickEditForm({ ...quickEditForm, scopeDescription: p });
                        }}
                        className="text-[10px] font-bold text-[#1430d8] hover:underline cursor-pointer"
                      >
                        Reset with Standard Preset
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={quickEditForm.scopeDescription || ''}
                      onChange={(e) => setQuickEditForm({ ...quickEditForm, scopeDescription: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none leading-relaxed"
                      placeholder="• Enter project scope and deliverables with bullet points..."
                    />
                  </div>

                  {/* Partner Referral Token / Direct Client */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      5. Client Origin / Partner Token
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Partner Referral Token (Optional)</label>
                        <input
                          type="text"
                          value={quickEditForm.referralToken || ''}
                          onChange={(e) => setQuickEditForm({ ...quickEditForm, referralToken: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono uppercase focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                          placeholder="Leave blank for Direct Client"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Agreement Status</label>
                        <select
                          value={quickEditForm.status || 'confirmed'}
                          onChange={(e) => setQuickEditForm({ ...quickEditForm, status: e.target.value as OrderAgreement['status'] })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                        >
                          <option value="draft">Draft</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Quick Edit Actions */}
                  <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    {onOpenStudio ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickEditOpen(false);
                          onOpenStudio(currentOrder);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Open Full Studio Editor</span>
                      </button>
                    ) : <div />}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsQuickEditOpen(false)}
                        className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B192E] via-[#1430d8] to-[#0075f7] hover:from-[#051124] hover:to-[#005ec4] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
                      >
                        <Save className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Save Agreement Changes</span>
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================== */}
        {/* ADMIN AUTHENTICATION UNLOCK MODAL */}
        {/* ========================================================== */}
        <AnimatePresence>
          {isAuthPromptOpen && (
            <div
              className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
              onClick={() => setIsAuthPromptOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 text-slate-900"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1430d8] flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6" />
                </div>

                <h3 className="text-base font-bold text-slate-950">
                  Admin Access Required to Edit
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  To modify or customize this official commercial agreement, enter your studio admin password:
                </p>

                <form onSubmit={handleVerifyPassword} className="mt-4 space-y-3">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      required
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      placeholder="Enter admin password (e.g. admin123)"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {authError && (
                    <div className="p-2 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-1.5 border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Default PIN / Password:</span>
                    <button
                      type="button"
                      onClick={() => setAdminPasswordInput('admin123')}
                      className="font-mono font-bold text-[#1430d8] hover:underline cursor-pointer"
                    >
                      Use "admin123"
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsAuthPromptOpen(false)}
                      className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B192E] via-[#1430d8] to-[#0075f7] hover:from-[#051124] hover:to-[#005ec4] text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
                    >
                      Unlock &amp; Edit Agreement
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Unified 3-Channel + Text + Full PDF Share Modal */}
      <ShareDocumentModal
        isOpen={shareModalConfig.isOpen}
        onClose={() => setShareModalConfig((prev) => ({ ...prev, isOpen: false }))}
        documentType="agreement"
        order={currentOrder}
        initialChannel={shareModalConfig.channel}
        onDispatched={(notice) => {
          setPdfNotice(notice);
          setTimeout(() => setPdfNotice(null), 6000);
        }}
      />
    </div>
  );
};
