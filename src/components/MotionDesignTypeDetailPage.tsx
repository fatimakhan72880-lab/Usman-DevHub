import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Film,
  Send,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Share2,
  Clock,
  ShieldCheck,
  Tv,
  Layers,
  Sparkles,
  Timer,
  MessageCircle,
  AlertCircle,
  Lock,
  Calendar,
  Globe,
  Mail
} from 'lucide-react';
import { dispatchOrderToGmail, dispatchOrderToWhatsApp } from '../utils/orderDispatch';
import { Service, Project } from '../types';
import { MotionDesignTypeInfo, MOTION_DESIGN_TYPES_DATA } from '../data/motionDesignTypes';
import { addContactMessage } from '../services/storageService';
import { ShowcaseProjectCard } from './ShowcaseProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { scrollToSectionWithOffset, snapScrollToElement } from '../utils/scroll';

interface MotionDesignTypeDetailPageProps {
  motionType: MotionDesignTypeInfo;
  service: Service;
  allMotionTypes?: MotionDesignTypeInfo[];
  onBackToMotionDesign: () => void;
  onSelectMotionType?: (type: MotionDesignTypeInfo) => void;
  serviceProjects: Project[];
}

export const MotionDesignTypeDetailPage: React.FC<MotionDesignTypeDetailPageProps> = ({
  motionType,
  service,
  onBackToMotionDesign,
  onSelectMotionType,
  serviceProjects
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [activeVideoCardId, setActiveVideoCardId] = useState<string | null>(null);

  // Short Form State
  const [selectedCategory, setSelectedCategory] = useState<string>(motionType.name);
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientMessage, setClientMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);
  const [lastOrderLinks, setLastOrderLinks] = useState<{ gmailUrl: string; waUrl: string } | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setSelectedCategory(motionType.name);
    setSubmittedSuccess(false);
    setAttemptedSubmit(false);
    setActiveVideoCardId(null);
  }, [motionType?.id, motionType?.name]);

  // Safe parsing helper for technologies array or string
  const parseTechList = (tech: any): string[] => {
    if (Array.isArray(tech)) return tech;
    if (typeof tech === 'string') return tech.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  // Filter projects matching this subcategory (unconditional hooks)
  const safeProjects = Array.isArray(serviceProjects) ? serviceProjects : [];
  const typeNameLower = (motionType?.name || '').toLowerCase();

  const matchingProjects = safeProjects.filter(
    (p) =>
      (p?.subcategory && p.subcategory.toLowerCase() === typeNameLower) ||
      (p?.title && p.title.toLowerCase().includes(typeNameLower))
  );

  const [showcaseVisibleCount, setShowcaseVisibleCount] = useState<number>(5);

  useEffect(() => {
    setShowcaseVisibleCount(5);
  }, [motionType?.id]);

  const displayedProjects = useMemo(() => {
    return matchingProjects.slice(0, showcaseVisibleCount);
  }, [matchingProjects, showcaseVisibleCount]);

  const handleShowLess = () => {
    const targetProject = matchingProjects[4];
    const targetEl = targetProject
      ? document.getElementById(`motion-type-showcase-${targetProject.id}`)
      : null;
    snapScrollToElement(targetEl || document.getElementById('motion-type-showcase-controls'), () => {
      setShowcaseVisibleCount(5);
    });
  };

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + `#service-${service?.id || 'srv-5'}/type/${motionType?.id || 'logo-animation'}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleScrollToForm = () => {
    const formEl = document.getElementById('service-order-form') || document.getElementById('motion-inquiry-box');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!clientName.trim()) missing.push('Your Name / Company');
    if (!clientEmail.trim()) {
      missing.push('Work Email');
    } else if (!clientEmail.includes('@') || !clientEmail.includes('.')) {
      missing.push('Valid Work Email (e.g. name@company.com)');
    }
    if (!clientMessage.trim()) missing.push('Project Brief & Deliverables');
    return missing;
  };

  const isNameInvalid = attemptedSubmit && !clientName.trim();
  const isEmailInvalid = attemptedSubmit && (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.'));
  const isMessageInvalid = attemptedSubmit && !clientMessage.trim();

  const validateForm = (): boolean => {
    setAttemptedSubmit(true);
    if (!clientName.trim()) {
      document.getElementById('motion-inquiry-name')?.focus();
      return false;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.')) {
      document.getElementById('motion-inquiry-email')?.focus();
      return false;
    }
    if (!clientMessage.trim()) {
      document.getElementById('motion-inquiry-message')?.focus();
      return false;
    }
    return true;
  };

  const handleGmailOrder = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const links = await dispatchOrderToGmail({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        service: '3D Video Animation',
        category: selectedCategory,
        budget: 'Standard Scope',
        message: clientMessage.trim()
      });
      setLastOrderLinks(links);
      setSubmittedSuccess(true);
      setAttemptedSubmit(false);
    } catch (err) {
      console.error('Failed to dispatch Gmail order', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppOrder = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const links = await dispatchOrderToWhatsApp({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        service: '3D Video Animation',
        category: selectedCategory,
        budget: 'Standard Scope',
        message: clientMessage.trim()
      });
      setLastOrderLinks(links);
      setSubmittedSuccess(true);
      setAttemptedSubmit(false);
    } catch (err) {
      console.error('Failed to dispatch WhatsApp order', err);
    }
  };

  if (!motionType) {
    return (
      <div className="min-h-screen bg-[#fbfbfe] text-[#0e0e0e] pt-28 pb-20 flex flex-col items-center justify-center">
        <p className="text-neutral-600 mb-4">Motion design package details not found.</p>
        <button
          onClick={onBackToMotionDesign}
          className="px-5 py-2 rounded-full bg-[#1430d8] text-white text-xs font-semibold"
        >
          Back to 3D Video Animation
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfe] text-[#0e0e0e] pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Breadcrumbs Bar (Strictly Single Row) */}
        <div className="pb-5 sm:pb-6 border-b border-neutral-200">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Back Button */}
            <button
              onClick={onBackToMotionDesign}
              className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:text-[#1430d8] hover:border-[#1430d8]/40 shadow-xs font-semibold text-xs sm:text-sm transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-1 shrink-0" />
              <span>
                <span className="hidden sm:inline">Back to </span>
                <span>Video Animation</span>
              </span>
            </button>

            {/* Breadcrumb Path & Share - Strictly 1 Single Row, Never Wraps, Full Category Name Always Visible */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 max-w-full justify-end">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center flex-nowrap gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-neutral-500 font-medium whitespace-nowrap overflow-x-auto no-scrollbar py-0.5"
              >
                <button onClick={onBackToMotionDesign} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  Home
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <button onClick={onBackToMotionDesign} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  Services
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <button onClick={onBackToMotionDesign} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  <span>3D Video</span>
                  <span className="hidden md:inline"> Animation</span>
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <span className="text-[#1430d8] font-bold shrink-0">
                  {motionType.name}
                </span>
              </nav>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 text-[10px] sm:text-xs font-medium transition-colors cursor-pointer shrink-0"
                title="Copy Page Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden xs:inline">{copiedLink ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clean, Focused Hero Section (No bulky distracting picture) */}
        <div className="mt-8 max-w-4xl">
          {/* Category Pill & Focus Badge (Clean Responsive Wrapping) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3.5 sm:mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10.5px] sm:text-xs font-bold text-[#1430d8]">
              <Film className="w-3.5 h-3.5 text-[#0075f7] shrink-0" />
              <span className="uppercase tracking-wider">
                {motionType.name}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100/90 border border-neutral-200/80 text-[10.5px] sm:text-xs font-medium text-neutral-700">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1430d8] shrink-0" />
              <span>Timeline: Decided Per Project Scope</span>
            </div>
          </div>

          <h1 className="font-display text-3xl xs:text-4xl sm:text-5xl font-extrabold text-[#0e0e0e] tracking-tight leading-[1.15]">
            {motionType.name}
          </h1>

          <p className="mt-3.5 text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
            {motionType.tagline}
          </p>

          <p className="mt-3 text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-3xl">
            {motionType.whatIsIt}
          </p>

          {/* Clean Responsive Metrics Grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <Timer className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />
                <span className="truncate">Video Length</span>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-[#0e0e0e]">
                Tailored to Brief
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Timeline</span>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-[#0e0e0e]">
                {motionType.estimatedDelivery}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <Tv className="w-3.5 h-3.5 text-[#0075f7] shrink-0" />
                <span className="truncate">Resolution</span>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-[#0e0e0e]">
                4K UHD (60 FPS)
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">Licensing</span>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-[#0e0e0e]">
                Full Commercial IP
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={handleScrollToForm}
              className="px-6 py-3 rounded-full bg-[#1430d8] hover:bg-[#0075f7] text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Order {motionType.name}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Deliverables Breakdown: What Client Gets */}
        <div className="mt-12 max-w-5xl">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#0e0e0e]">
                What You Receive in this Package
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mb-6 max-w-2xl">
              Everything included in your bespoke {motionType.name} project. No hidden fees or restricted exports:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(motionType.whatClientGets || []).map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50/70 border border-neutral-100">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm text-neutral-800 font-medium leading-snug">{item}</span>
                </div>
              ))}
            </div>

            {/* Deliverable File Formats */}
            <div className="mt-6 pt-5 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  Deliverable Formats & Codecs:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(motionType.deliverableFormats || []).map((fmt, fIdx) => (
                    <span
                      key={fIdx}
                      className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold border border-neutral-200/70"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              {/* Best For / Category Badge */}
              <div className="sm:max-w-xs p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-neutral-700">
                <strong className="text-[#1430d8] font-bold">Category: </strong>
                {motionType.categoryPill || motionType.name}
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Direct Order Form Section (SAME SERVICE FORM STRUCTURE) */}
        <div id="motion-inquiry-box" className="mt-8 sm:mt-16 scroll-mt-24">
          <div className="p-3.5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 shadow-lg max-w-3xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-3.5 sm:mb-6">
              <span className="text-[9px] sm:text-[11px] font-bold text-[#1430d8] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 sm:py-1 rounded-full border border-blue-100">
                {selectedCategory} Order • {motionType.estimatedDelivery}
              </span>
              <h2 className="font-display text-lg sm:text-2xl md:text-3xl font-extrabold text-[#0e0e0e] mt-1 sm:mt-1.5">
                Order Your Custom {selectedCategory}
              </h2>
              <p className="text-[11px] sm:text-sm text-neutral-600 mt-0.5 sm:mt-1 max-w-md mx-auto leading-normal sm:leading-relaxed">
                Direct engagement with Lead Engineer Usman Afzal. Studio-grade animations delivered in 4K 60fps.
              </p>
            </div>

            {submittedSuccess ? (
              <div className="py-6 sm:py-8 text-center flex flex-col items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 text-[#1430d8] flex items-center justify-center mb-2.5 sm:mb-3 shadow-sm">
                  <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="font-display text-base sm:text-xl font-bold text-[#0e0e0e]">
                  {selectedCategory} Inquiry Transmitted!
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-md">
                  Thank you! Usman Afzal has received your customized specifications for <strong>{selectedCategory}</strong> and will reach out to {clientEmail} within 4 hours.
                </p>
                {lastOrderLinks && (
                  <div className="mt-3.5 grid grid-cols-2 gap-2 w-full max-w-md">
                    <a
                      href={lastOrderLinks.gmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[42px] py-2.5 px-2.5 sm:px-3.5 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] sm:text-xs font-bold leading-tight text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0 text-white" />
                      <span>Send Order via Gmail</span>
                    </a>
                    <a
                      href={lastOrderLinks.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[42px] py-2.5 px-2.5 sm:px-3.5 rounded-xl bg-[#25D366] hover:bg-[#1eb954] text-white text-[11px] sm:text-xs font-bold leading-tight text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 shrink-0 text-white" />
                      <span>Order via WhatsApp</span>
                    </a>
                  </div>
                )}
                <button
                  onClick={() => setSubmittedSuccess(false)}
                  className="mt-3.5 sm:mt-4 px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleGmailOrder} noValidate className="space-y-3 sm:space-y-4">
                {/* 1. Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="motion-inquiry-name" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                        Your Name / Company *
                      </label>
                      {isNameInvalid && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          Required
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      id="motion-inquiry-name"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Christian Grey / Apex Studio"
                      className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] focus:outline-none transition-all ${
                        isNameInvalid
                          ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                          : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="motion-inquiry-email" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                        Work Email *
                      </label>
                      {isEmailInvalid && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          {!clientEmail.trim() ? 'Required' : 'Valid email required'}
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      id="motion-inquiry-email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="e.g. contact@luxurybrand.com"
                      className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] focus:outline-none transition-all ${
                        isEmailInvalid
                          ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                          : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. Selected Category / Focus (Pre-Selected for this category) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] sm:text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-[#1430d8]" />
                      <span>Selected Category / Focus</span>
                    </label>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Pre-Selected
                    </span>
                  </div>
                  <div className="w-full px-3.5 py-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm font-bold text-[#1430d8] flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-[#1430d8]" />
                      <span className="truncate">{motionType.name}</span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-[#1430d8] font-semibold bg-white/90 px-2.5 py-0.5 rounded-md border border-blue-100 shrink-0">
                      {motionType.estimatedDelivery}
                    </span>
                  </div>
                </div>

                {/* 3. Project Brief & Required Deliverables */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="motion-inquiry-message" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                      Project Brief &amp; Required Deliverables *
                    </label>
                    {isMessageInvalid && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Required
                      </span>
                    )}
                  </div>
                  <textarea
                    id="motion-inquiry-message"
                    required
                    rows={3}
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    placeholder={`Describe your vision for ${selectedCategory}, desired length (e.g. 10s, 30s), brand style, or references...`}
                    className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] focus:outline-none transition-all resize-y min-h-[75px] max-h-[350px] ${
                      isMessageInvalid
                        ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                        : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                    }`}
                  />
                  <p className="mt-1 text-[10px] text-neutral-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Delivered in 4K 60fps with full commercial broadcasting rights.</span>
                  </p>
                </div>

                {/* 4. Action Buttons (Side by Side: Send Order via Gmail & Order via WhatsApp) */}
                <div className="pt-1">
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    <button
                      type="submit"
                      id="submit-type-order-btn"
                      disabled={isSubmitting}
                      className="min-h-[44px] w-full py-2.5 sm:py-3 px-2.5 sm:px-4 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] sm:text-xs md:text-sm font-bold leading-tight text-center transition-all shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
                      title="Submit and send order directly via Gmail"
                    >
                      {isSubmitting ? (
                        <span>Opening Gmail...</span>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
                          <span>Send Order via Gmail</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      id="submit-type-whatsapp-btn"
                      onClick={handleWhatsAppOrder}
                      disabled={isSubmitting}
                      className="min-h-[44px] w-full py-2.5 sm:py-3 px-2.5 sm:px-4 rounded-xl bg-[#25D366] hover:bg-[#1eb954] text-white text-[11px] sm:text-xs md:text-sm font-bold leading-tight text-center transition-all shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
                      title="Send order and chat instantly on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
                      <span>Order via WhatsApp</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Featured Projects for this Category (Clean, at the bottom) */}
        {matchingProjects.length > 0 && (
          <div id="motion-type-showcase-section" className="mt-16 sm:mt-24 pt-12 border-t border-neutral-200">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{motionType.name} • Showcase</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0e0e0e] tracking-tight">
                  Featured {motionType.name} Work
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-2xl">
                  Real 3D animation projects crafted for clients worldwide:
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-bold text-[#1430d8] shadow-2xs">
                  {matchingProjects.length} Projects
                </span>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {displayedProjects.map((p) => (
                <ShowcaseProjectCard
                  key={p.id}
                  project={p}
                  activeVideoId={activeVideoCardId}
                  onPlayVideo={(id) => setActiveVideoCardId(id)}
                  onStopVideo={() => setActiveVideoCardId(null)}
                  onOpenModal={(proj) => setPreviewProject(proj)}
                  idPrefix="motion-type-showcase"
                  serviceTitle="3D Video Animation"
                  categoryTitle={motionType.name}
                />
              ))}
            </div>

            {/* Show More / Show Less Pagination when items > 5 */}
            {matchingProjects.length > 5 && (
              <div id="motion-type-showcase-controls" className="mt-8 flex flex-col items-center gap-3 scroll-mb-6 sm:scroll-mb-8">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {showcaseVisibleCount < matchingProjects.length && (
                    <button
                      onClick={() => setShowcaseVisibleCount((prev) => Math.min(prev + 5, matchingProjects.length))}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-semibold shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <span>Show More</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}

                  {showcaseVisibleCount > 5 && (
                    <button
                      onClick={handleShowLess}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 border border-neutral-200 text-xs font-semibold shadow-2xs hover:border-neutral-300 transition-all cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4 text-neutral-500" />
                      <span>Show Less</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project Preview Modal */}
      <ProjectDetailModal
        project={previewProject}
        onClose={() => setPreviewProject(null)}
        serviceTitle="3D Video Animation"
        categoryTitle={motionType.name}
        onOpenContact={(_srv, _cat, proj) => {
          const target = proj || previewProject;
          if (target) {
            setClientMessage(
              `I am interested in a ${motionType.name} project similar to "${target.title}".\n\nSpecific Requirements: `
            );
          }
          handleScrollToForm();
        }}
      />
    </div>
  );
};
