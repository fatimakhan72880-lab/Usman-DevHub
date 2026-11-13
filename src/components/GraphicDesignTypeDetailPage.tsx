import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Palette,
  Send,
  ExternalLink,
  Zap,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  CheckCircle2,
  Clock,
  Briefcase,
  Share2,
  FileImage,
  Layers,
  Image,
  MessageSquare,
  ShieldCheck,
  FileCheck,
  MessageCircle,
  AlertCircle,
  Lock,
  Calendar,
  Globe,
  Mail
} from 'lucide-react';
import { dispatchOrderToGmail, dispatchOrderToWhatsApp } from '../utils/orderDispatch';
import { Service, Project } from '../types';
import { GraphicDesignTypeInfo, GRAPHIC_DESIGN_TYPES_DATA } from '../data/graphicDesignTypes';
import { addContactMessage, getProjects } from '../services/storageService';
import { ShowcaseProjectCard } from './ShowcaseProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { scrollToSectionWithOffset, snapScrollToElement } from '../utils/scroll';

interface GraphicDesignTypeDetailPageProps {
  designType: GraphicDesignTypeInfo;
  service: Service;
  allDesignTypes?: GraphicDesignTypeInfo[];
  onBackToGraphicDesign: () => void;
  onSelectDesignType?: (type: GraphicDesignTypeInfo) => void;
  serviceProjects: Project[];
}

export const GraphicDesignTypeDetailPage: React.FC<GraphicDesignTypeDetailPageProps> = ({
  designType,
  service,
  onBackToGraphicDesign,
  onSelectDesignType,
  serviceProjects
}) => {
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [activeVideoCardId, setActiveVideoCardId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Simple inquiry form state
  const [selectedCategory, setSelectedCategory] = useState<string>(designType.name);
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientMessage, setClientMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setSelectedCategory(designType.name);
    setSubmittedSuccess(false);
    setAttemptedSubmit(false);
    setActiveVideoCardId(null);
  }, [designType.id, designType.name]);

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + `#service/${service.id}/type/${designType.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleScrollToForm = () => {
    const formEl = document.getElementById('service-order-form') || document.getElementById('type-inquiry-section');
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

  const [lastOrderLinks, setLastOrderLinks] = useState<{ gmailUrl: string; waUrl: string } | null>(null);

  const validateForm = (): boolean => {
    setAttemptedSubmit(true);
    if (!clientName.trim()) {
      document.getElementById('design-inquiry-name')?.focus();
      return false;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.')) {
      document.getElementById('design-inquiry-email')?.focus();
      return false;
    }
    if (!clientMessage.trim()) {
      document.getElementById('design-inquiry-message')?.focus();
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
        service: 'Graphic Design',
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
        service: 'Graphic Design',
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

  // Robust filtering: strictly only projects matching this specific design category
  const matchedProjects = useMemo(() => {
    const all = getProjects();
    const typeName = designType.name.toLowerCase().trim();
    return all.filter((p) => {
      const cat = (p.category || '').toLowerCase().trim();
      const sub = (p.subcategory || '').toLowerCase().trim();
      if (!cat.includes('graphic') && !cat.includes('design')) {
        return false;
      }
      return sub === typeName || sub.includes(typeName) || typeName.includes(sub);
    });
  }, [designType.name]);

  const [showcaseVisibleCount, setShowcaseVisibleCount] = useState<number>(5);

  useEffect(() => {
    setShowcaseVisibleCount(5);
  }, [designType.id]);

  const displayedProjects = useMemo(() => {
    return matchedProjects.slice(0, showcaseVisibleCount);
  }, [matchedProjects, showcaseVisibleCount]);

  const handleShowLess = () => {
    const targetProject = matchedProjects[4];
    const targetEl = targetProject
      ? document.getElementById(`graphic-type-showcase-${targetProject.id}`)
      : null;
    snapScrollToElement(targetEl || document.getElementById('graphic-type-showcase-controls'), () => {
      setShowcaseVisibleCount(5);
    });
  };

  return (
    <div id="graphic-type-detail-page-container" className="min-h-screen bg-[#fafafc] text-neutral-900 pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* TOP CONTEXT BAR: Breadcrumbs & Focused Category Header (Strictly Single Row) */}
        {/* ========================================================================= */}
        <div className="pb-5 sm:pb-6 border-b border-neutral-200/80">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Back Button */}
            <button
              id="back-to-graphic-button"
              onClick={onBackToGraphicDesign}
              className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:text-[#1430d8] hover:border-[#1430d8]/40 shadow-xs font-semibold text-xs sm:text-sm transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-1 shrink-0" />
              <span>
                <span className="hidden sm:inline">Back to </span>
                <span>Graphic Design</span>
              </span>
            </button>

            {/* Breadcrumb Path & Share - Strictly 1 Single Row, Never Wraps, Full Category Name Always Visible */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 max-w-full justify-end">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center flex-nowrap gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-neutral-500 font-medium whitespace-nowrap overflow-x-auto no-scrollbar py-0.5"
              >
                <button onClick={onBackToGraphicDesign} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  Home
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <button onClick={onBackToGraphicDesign} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  Services
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <button onClick={onBackToGraphicDesign} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  <span>Graphic</span>
                  <span className="hidden md:inline"> Design</span>
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <span className="text-[#1430d8] font-bold shrink-0">
                  {designType.name}
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

        {/* ========================================================================= */}
        {/* HERO SECTION: Dedicated to this specific category only */}
        {/* ========================================================================= */}
        <div className="mt-6 sm:mt-8 max-w-4xl">
          {/* Category Pill & Focus Badge (Clean Responsive Wrapping) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3.5 sm:mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10.5px] sm:text-xs font-bold text-[#1430d8]">
              <Sparkles className="w-3.5 h-3.5 text-[#0075f7] shrink-0" />
              <span className="uppercase tracking-wider">
                {designType.name}
              </span>
            </div>
            {designType.badge && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100/90 border border-neutral-200/80 text-[10.5px] sm:text-xs font-medium text-neutral-700">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1430d8] shrink-0" />
                <span>{designType.badge}</span>
              </div>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight sm:leading-[1.15]">
            {designType.name}
          </h1>

          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base md:text-lg text-neutral-700 leading-relaxed font-normal">
            {designType.whatIsIt || designType.tagline}
          </p>

          {/* Clean Responsive Metrics Grid */}
          <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />
                <span className="truncate">Timeline</span>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-neutral-900">
                {designType.estimatedDelivery}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Revisions</span>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-neutral-900">
                Included
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <FileImage className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Source Files</span>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-neutral-900">
                100% Handover
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">Rights</span>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-neutral-900">
                Full Commercial
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleScrollToForm}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1430d8] hover:bg-[#0075f7] text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <span>Request This Design</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Deliverables Section (Clean & Full Width) */}
        <div className="mt-12 max-w-5xl">
          {/* What Client Gets */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-display text-lg sm:text-xl font-bold text-[#0e0e0e]">
                What You Receive in this Package
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mb-6">
              Straightforward delivery with everything required to use your designs immediately.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {designType.whatClientGets.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50/70 border border-neutral-100">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-neutral-800">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Deliverable File Formats */}
            <div className="mt-6 pt-5 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  Deliverable Formats & Files:
                </span>
                <div className="flex flex-wrap gap-2">
                  {designType.deliverableFormats.map((fmt, fIdx) => (
                    <span
                      key={fIdx}
                      className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold border border-neutral-200/70"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              {/* Best For */}
              <div className="sm:max-w-xs p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-neutral-700">
                <strong className="text-[#1430d8] font-bold">Best For: </strong>
                {designType.bestFor}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DEDICATED CATEGORY SHOWCASE SECTION AT BOTTOM */}
        {/* ========================================================================= */}
        {matchedProjects.length > 0 && (
          <div id="graphic-type-showcase-section" className="mt-16 sm:mt-24 pt-12 border-t border-neutral-200">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{designType.name} • Showcase</span>
                </div>
                <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0e0e0e] tracking-tight">
                  {designType.name} Showcase & Portfolio
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-2xl">
                  Real custom projects created and delivered in our {designType.name} studio:
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-bold text-[#1430d8] shadow-2xs">
                  {matchedProjects.length} Projects
                </span>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {displayedProjects.map((project) => (
                <ShowcaseProjectCard
                  key={project.id}
                  project={project}
                  activeVideoId={activeVideoCardId}
                  onPlayVideo={(id) => setActiveVideoCardId(id)}
                  onStopVideo={() => setActiveVideoCardId(null)}
                  onOpenModal={(proj) => setPreviewProject(proj)}
                  idPrefix="graphic-type-showcase"
                  serviceTitle="Graphic Design"
                  categoryTitle={designType.name}
                />
              ))}
            </div>

            {/* Show More / Show Less Pagination when items > 5 */}
            {matchedProjects.length > 5 && (
              <div id="graphic-type-showcase-controls" className="mt-8 flex flex-col items-center gap-3 scroll-mb-6 sm:scroll-mb-8">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {showcaseVisibleCount < matchedProjects.length && (
                    <button
                      onClick={() => setShowcaseVisibleCount((prev) => Math.min(prev + 5, matchedProjects.length))}
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

        {/* ========================================================================= */}
        {/* DIRECT PROJECT INQUIRY & ORDER FORM (SAME SERVICE FORM STRUCTURE) */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* DIRECT PROJECT INQUIRY & ORDER FORM (SAME SERVICE FORM STRUCTURE) */}
        {/* ========================================================================= */}
        <div id="service-order-form" className="mt-8 sm:mt-16 pt-6 sm:pt-8 border-t border-neutral-200 scroll-mt-24">
          <div className="max-w-2xl mx-auto rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 p-4 sm:p-6 md:p-8 shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1430d8] text-[10px] sm:text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct Order &amp; Custom Quote</span>
            </div>
            
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0e0e0e] mt-2">
              Order {selectedCategory}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-600">
              Submit your project details below. Muhammad Usman Afzal will review your scope within 4 hours.
            </p>

            {submittedSuccess ? (
              <div className="mt-6 p-6 rounded-2xl bg-blue-50/80 border border-blue-200 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white text-[#1430d8] flex items-center justify-center mb-2.5 shadow-sm">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#0e0e0e]">
                  Proposal Request Dispatched!
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-neutral-600 max-w-md">
                  We received your inquiry for <strong>{selectedCategory}</strong>. Founder Muhammad Usman Afzal will reach out via email shortly.
                </p>
                {lastOrderLinks && (
                  <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-md">
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
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={() => setSubmittedSuccess(false)}
                    className="px-5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-all cursor-pointer shadow-xs"
                  >
                    Submit Another Query
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGmailOrder} noValidate className="mt-5 space-y-3 sm:space-y-4">
                {/* 1. Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="design-inquiry-name" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
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
                      id="design-inquiry-name"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Elena Rostova / Lumina Labs"
                      className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] focus:outline-none transition-all ${
                        isNameInvalid
                          ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                          : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="design-inquiry-email" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
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
                      id="design-inquiry-email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="e.g. elena@company.com"
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
                      <Palette className="w-3.5 h-3.5 text-[#1430d8]" />
                      <span>Selected Category / Focus</span>
                    </label>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Pre-Selected
                    </span>
                  </div>
                  <div className="w-full px-3.5 py-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm font-bold text-[#1430d8] flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-[#1430d8]" />
                      <span className="truncate">{designType.name}</span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-[#1430d8] font-semibold bg-white/90 px-2.5 py-0.5 rounded-md border border-blue-100 shrink-0">
                      {designType.estimatedDelivery}
                    </span>
                  </div>
                </div>

                {/* 3. Project Brief & Required Deliverables */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="design-inquiry-message" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                      Project Brief &amp; Required Deliverables *
                    </label>
                    {isMessageInvalid && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Required
                      </span>
                    )}
                  </div>
                  <textarea
                    id="design-inquiry-message"
                    required
                    rows={3}
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    placeholder={`Describe your design requirements for ${selectedCategory} (brand name, preferred colors, style references, or file needs)...`}
                    className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] focus:outline-none transition-all resize-y min-h-[75px] max-h-[350px] ${
                      isMessageInvalid
                        ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                        : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                    }`}
                  />
                  <p className="mt-1 text-[10px] text-neutral-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Includes 100% vector source files (AI, SVG, PNG), brand color codes, and commercial usage rights.</span>
                  </p>
                </div>

                {/* 4. Action Buttons (Side by Side: Send Order via Gmail & Order via WhatsApp) */}
                <div className="pt-0.5">
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    <button
                      type="submit"
                      id="submit-type-order-btn"
                      disabled={isSubmitting}
                      className="min-h-[44px] w-full py-2.5 sm:py-3 px-2.5 sm:px-4 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] sm:text-xs md:text-sm font-bold leading-tight text-center transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 active:scale-[0.99] disabled:opacity-60"
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
                      className="min-h-[44px] w-full py-2.5 sm:py-3 px-2.5 sm:px-4 rounded-xl bg-[#25D366] hover:bg-[#1eb954] text-white text-[11px] sm:text-xs md:text-sm font-bold leading-tight text-center transition-all shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
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

      </div>

      {/* Modal Preview for Sample Project */}
      <ProjectDetailModal
        project={previewProject}
        onClose={() => setPreviewProject(null)}
        serviceTitle="Graphic Design"
        categoryTitle={designType.name}
        onOpenContact={(_srv, _cat, proj) => {
          const target = proj || previewProject;
          if (target) {
            setClientMessage(
              `I am interested in a ${designType.name} project similar to "${target.title}".\n\nSpecific Requirements: `
            );
          }
          handleScrollToForm();
        }}
      />
    </div>
  );
};
