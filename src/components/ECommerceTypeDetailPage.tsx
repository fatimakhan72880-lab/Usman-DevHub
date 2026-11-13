import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  Send,
  ExternalLink,
  Code2,
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
  Layout,
  ShieldCheck,
  FileCheck,
  Share2,
  Sliders,
  Cpu,
  MessageCircle,
  ShoppingBag,
  Mail
} from 'lucide-react';
import { dispatchOrderToGmail, dispatchOrderToWhatsApp } from '../utils/orderDispatch';
import { Service, Project } from '../types';
import { ECommerceTypeInfo } from '../data/ecommerceTypes';
import { addContactMessage, getProjects } from '../services/storageService';
import { ShowcaseProjectCard } from './ShowcaseProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { snapScrollToElement } from '../utils/scroll';

interface ECommerceTypeDetailPageProps {
  ecommerceType: ECommerceTypeInfo;
  service: Service;
  onBackToECommerce: () => void;
  onSelectType?: (type: ECommerceTypeInfo) => void;
  serviceProjects: Project[];
}

export const ECommerceTypeDetailPage: React.FC<ECommerceTypeDetailPageProps> = ({
  ecommerceType,
  service,
  onBackToECommerce,
  serviceProjects
}) => {
  // Navigation & view states
  const [activeSpecTab, setActiveSpecTab] = useState<'deliverables' | 'pages' | 'features' | 'tech'>('deliverables');
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [activeVideoCardId, setActiveVideoCardId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Form states
  const [selectedCategory, setSelectedCategory] = useState<string>(ecommerceType.name);
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientMessage, setClientMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setSelectedCategory(ecommerceType.name);
    setSubmittedSuccess(false);
    setActiveSpecTab('deliverables');
    setAttemptedSubmit(false);
    setActiveVideoCardId(null);
  }, [ecommerceType.id, ecommerceType.name]);

  const handleScrollToSection = (sectionId: string) => {
    const el =
      document.getElementById(sectionId) ||
      document.getElementById('type-inquiry-section') ||
      document.getElementById('service-order-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + `#service-${service.id}/type/${ecommerceType.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isNameInvalid = attemptedSubmit && !clientName.trim();
  const isEmailInvalid = attemptedSubmit && (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.'));
  const isMessageInvalid = attemptedSubmit && !clientMessage.trim();

  const [lastOrderLinks, setLastOrderLinks] = useState<{ gmailUrl: string; waUrl: string } | null>(null);

  const validateForm = (): boolean => {
    setAttemptedSubmit(true);
    if (!clientName.trim()) {
      document.getElementById('ecommerce-inquiry-name')?.focus();
      return false;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.')) {
      document.getElementById('ecommerce-inquiry-email')?.focus();
      return false;
    }
    if (!clientMessage.trim()) {
      document.getElementById('ecommerce-inquiry-message')?.focus();
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
        service: 'E-Commerce Development',
        category: selectedCategory,
        budget: 'Custom Scope / Needs Discussion',
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
        service: 'E-Commerce Development',
        category: selectedCategory,
        budget: 'Custom Scope / Needs Discussion',
        message: clientMessage.trim()
      });
      setLastOrderLinks(links);
      setSubmittedSuccess(true);
      setAttemptedSubmit(false);
    } catch (err) {
      console.error('Failed to dispatch WhatsApp order', err);
    }
  };

  // Source projects: strictly isolate projects of THIS specific category only
  const sourceProjects = useMemo(() => {
    if (serviceProjects && serviceProjects.length > 0) return serviceProjects;
    return getProjects().filter((p) => {
      const cat = (p.category || '').toLowerCase();
      return cat.includes('e-commerce') || cat.includes('commerce');
    });
  }, [serviceProjects]);

  // Strictly filter showcase projects ONLY belonging to THIS category
  const displayProjects = useMemo(() => {
    const typeName = ecommerceType.name.toLowerCase().trim();
    return sourceProjects.filter((p) => {
      const pSub = (p.subcategory || '').toLowerCase().trim();
      return pSub === typeName;
    });
  }, [sourceProjects, ecommerceType.name]);

  const [showcaseVisibleCount, setShowcaseVisibleCount] = useState<number>(5);

  useEffect(() => {
    setShowcaseVisibleCount(5);
  }, [ecommerceType.id]);

  const displayedProjects = useMemo(() => {
    return displayProjects.slice(0, showcaseVisibleCount);
  }, [displayProjects, showcaseVisibleCount]);

  const handleShowLess = () => {
    const targetProject = displayProjects[4];
    const targetEl = targetProject
      ? document.getElementById(`ecommerce-type-showcase-${targetProject.id}`)
      : null;
    snapScrollToElement(targetEl || document.getElementById('ecommerce-type-showcase-controls'), () => {
      setShowcaseVisibleCount(5);
    });
  };

  return (
    <div id="ecommerce-type-detail-page-container" className="min-h-screen bg-[#fafafc] text-neutral-900 pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* TOP CONTEXT BAR: Breadcrumbs & Focused Category Header (Strictly Single Row) */}
        {/* ========================================================================= */}
        <div className="pb-5 sm:pb-6 border-b border-neutral-200/80">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Back Button */}
            <button
              id="back-to-ecommerce-button"
              onClick={onBackToECommerce}
              className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:text-[#1430d8] hover:border-[#1430d8]/40 shadow-xs font-semibold text-xs sm:text-sm transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-1 shrink-0" />
              <span>
                <span className="hidden sm:inline">Back to </span>
                <span>E-Commerce</span>
                <span className="hidden lg:inline"> Development</span>
              </span>
            </button>

            {/* Breadcrumb Path & Share - Strictly 1 Single Row, Never Wraps, Full Category Name Always Visible */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 max-w-full justify-end">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center flex-nowrap gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-neutral-500 font-medium whitespace-nowrap overflow-x-auto no-scrollbar py-0.5"
              >
                <button onClick={onBackToECommerce} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  Home
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <button onClick={onBackToECommerce} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  Services
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <button onClick={onBackToECommerce} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  <span>E-Commerce</span>
                  <span className="hidden md:inline"> Development</span>
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <span className="text-[#1430d8] font-bold shrink-0">
                  {ecommerceType.name}
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
        {/* HERO SECTION: Clean Responsive Layout with Key Metrics */}
        {/* ========================================================================= */}
        <div className="mt-6 sm:mt-8 max-w-4xl">
          {/* Category Pill & Focus Badge (Clean Responsive Wrapping) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3.5 sm:mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10.5px] sm:text-xs font-bold text-[#1430d8]">
              <Sparkles className="w-3.5 h-3.5 text-[#0075f7] shrink-0" />
              <span className="uppercase tracking-wider">
                {ecommerceType.categoryPill || 'E-Commerce Architecture'}
              </span>
            </div>
            {ecommerceType.badge && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100/90 border border-neutral-200/80 text-[10.5px] sm:text-xs font-medium text-neutral-700">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1430d8] shrink-0" />
                <span>{ecommerceType.badge}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-[10.5px] sm:text-xs font-semibold text-emerald-800 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
              <span>Available in: Custom Code • Shopify • WordPress &amp; WooCommerce</span>
            </div>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight sm:leading-[1.15]">
            {ecommerceType.name}
          </h1>

          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base md:text-lg text-neutral-700 leading-relaxed font-normal">
            {ecommerceType.whatIsIt || ecommerceType.tagline}
          </p>

          {/* Clean Responsive Metrics Grid */}
          <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />
                <span>Timeline</span>
              </div>
              <div className="font-display text-xs sm:text-sm md:text-base font-bold text-neutral-900 leading-snug break-words">
                {ecommerceType.estimatedDelivery}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <Layers className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />
                <span>Scope</span>
              </div>
              <div className="font-display text-xs sm:text-sm md:text-base font-bold text-neutral-900 leading-snug break-words">
                {ecommerceType.pagesIncluded ? `${ecommerceType.pagesIncluded.length} Core Pages` : '4 Core Pages'}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Performance</span>
              </div>
              <div className="font-display text-xs sm:text-sm md:text-base font-bold text-neutral-900 leading-snug break-words">
                Sub-Second Speed
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Support</span>
              </div>
              <div className="font-display text-xs sm:text-sm md:text-base font-bold text-neutral-900 leading-snug break-words">
                Post-Launch Support
              </div>
            </div>
          </div>

          {/* Target Audience Bar */}
          <div className="mt-3.5 sm:mt-4 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-100 text-[#1430d8] flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-xs sm:text-sm text-neutral-700 leading-snug">
              <span className="font-bold text-neutral-900">Recommended For: </span>
              {ecommerceType.bestFor}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => handleScrollToSection('type-inquiry-section')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-full bg-[#1430d8] hover:bg-[#0075f7] text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer w-full sm:w-auto"
            >
              <span>Request Store Quote</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleScrollToSection('type-showcase-section')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-white border border-neutral-200 text-neutral-800 hover:border-[#1430d8] hover:text-[#1430d8] font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer w-full sm:w-auto"
            >
              <Layers className="w-4 h-4 text-[#1430d8]" />
              <span>View Examples ({displayProjects.length})</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODULAR SPECIFICATIONS SUITE (Deliverables, Pages, Features, Tech Stack) */}
        {/* ========================================================================= */}
        <div className="mt-12 sm:mt-16 lg:mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] sm:text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-2">
                <FileCheck className="w-3.5 h-3.5 text-[#0075f7] shrink-0" />
                <span>Full Architectural Specifications</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight">
                Everything Included in Your {ecommerceType.name}
              </h2>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-neutral-600 max-w-2xl leading-relaxed">
                Review complete deliverables, page hierarchy, technical features, and production engineering standards.
              </p>
            </div>

            {/* Segmented Spec Tabs: Scrollable and compact on mobile */}
            <div className="flex items-center gap-1 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-neutral-100 border border-neutral-200 overflow-x-auto no-scrollbar max-w-full shrink-0">
              <button
                onClick={() => setActiveSpecTab('deliverables')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeSpecTab === 'deliverables'
                    ? 'bg-white text-[#1430d8] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Deliverables &amp; Scope
              </button>
              <button
                onClick={() => setActiveSpecTab('pages')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeSpecTab === 'pages'
                    ? 'bg-white text-[#1430d8] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Included Pages
              </button>
              <button
                onClick={() => setActiveSpecTab('features')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeSpecTab === 'features'
                    ? 'bg-white text-[#1430d8] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Technical Features
              </button>
              <button
                onClick={() => setActiveSpecTab('tech')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeSpecTab === 'tech'
                    ? 'bg-white text-[#1430d8] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Tech Stack
              </button>
            </div>
          </div>

          {/* TAB 1: DELIVERABLES & SCOPE */}
          {activeSpecTab === 'deliverables' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              {/* Left 8 cols: What Client Gets */}
              <div className="lg:col-span-8 space-y-5 sm:space-y-6">
                <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-xs">
                  <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-neutral-100 mb-4 sm:mb-6 gap-2">
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Deliverables Checklist ({ecommerceType.whatClientGets.length})</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-[#1430d8] bg-blue-50 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shrink-0">
                      Included Deliverables
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                    {ecommerceType.whatClientGets.map((deliverable, idx) => (
                      <div
                        key={idx}
                        className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-neutral-50/80 border border-neutral-200/70 flex items-start gap-2.5 sm:gap-3 hover:border-[#1430d8]/30 transition-colors"
                      >
                        <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-neutral-900 leading-snug">
                            {deliverable}
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5">
                            Professional standard, fully tested.
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Content & Store Integration */}
                  <div className="mt-5 sm:mt-6 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-blue-50/40 border border-blue-100">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-900 mb-2">
                      <Sparkles className="w-4 h-4 text-[#1430d8]" />
                      <span>Content &amp; Storefront Integration</span>
                    </div>
                    <p className="text-xs text-neutral-600 mb-3 leading-relaxed">
                      We seamlessly integrate your brand assets, catalog hierarchy, and payment gateways into the store:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Client logo and brand identity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Brand colors and typography</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Initial product catalog setup</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Payment gateway connections (Stripe, Cards &amp; COD)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Automated customer receipts &amp; invoices</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Domain connection and free SSL</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-blue-200/60 text-[11px] text-neutral-500 italic">
                      * Note: Product imagery, descriptions, and gateway merchant credentials are provided by the client.
                    </div>
                  </div>

                  {/* Estimated Timeline Note */}
                  <div className="mt-4 sm:mt-5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-100 border border-neutral-200 flex items-start gap-2.5 sm:gap-3 text-xs text-neutral-700">
                    <Clock className="w-4 h-4 text-[#1430d8] shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong>Project Timeline: </strong>
                      Delivery timeline is finalized directly with you during consultation based on custom requirements, asset readiness, and catalog size.
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 4 cols: Quality Standards & Handover Format */}
              <div className="lg:col-span-4">
                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-xs">
                  <h3 className="font-display text-sm sm:text-base font-bold text-neutral-900 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#1430d8]" />
                    <span>Handover &amp; Support</span>
                  </h3>
                  <div className="space-y-3 sm:space-y-3.5 text-xs text-neutral-600">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>100% Store Ownership:</strong> Full rights to all frontend code, storefront assets, and zero platform commission deductions.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Client-Owned Gateways:</strong> Stripe, bank merchant accounts, and domain credentials remain strictly under your control. We handle secure configuration.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Production Deployment &amp; SSL:</strong> Professional domain connection, hosting configuration, SSL setup, and live checkout testing.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Post-Launch Support:</strong> Dedicated assistance with launch questions, admin training, and agreed minor tweaks after deployment.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INCLUDED PAGES BREAKDOWN */}
          {activeSpecTab === 'pages' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {(ecommerceType.pageBreakdown || [
                  {
                    title: 'Home Page',
                    purpose: 'Establish brand credibility, highlight hero products, and guide shoppers into catalog.',
                    keySections: ['Hero Banner', 'Featured Collections', 'Customer Reviews', 'Trust Badges']
                  },
                  {
                    title: 'Catalog & Collections',
                    purpose: 'Fast product discovery with clean attribute filters, sorting, and instant search.',
                    keySections: ['Filter Bar', 'Price Sorting', 'Product Grid View', 'Quick-View Modal']
                  },
                  {
                    title: 'Product Detail Page (PDP)',
                    purpose: 'Maximize conversions with high-res galleries, variant swatches, and live stock.',
                    keySections: ['Image Gallery', 'Variant Swatches', 'Stock Status', 'Shipping Accordion']
                  },
                  {
                    title: 'Cart & Seamless Checkout',
                    purpose: 'Eliminate cart abandonment with an instant slide drawer and 1-click payment.',
                    keySections: ['Shipping Bar', '1-Click Express Pay', 'Promo Code Input', 'Order Summary']
                  }
                ]).map((page, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 sm:p-3 rounded-xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between hover:border-[#1430d8] hover:shadow-sm transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 rounded-md bg-blue-50 text-[#1430d8] font-bold text-[10px] sm:text-xs flex items-center justify-center border border-blue-100">
                            0{idx + 1}
                          </span>
                          <h3 className="font-display text-xs sm:text-sm font-bold text-neutral-900 truncate">
                            {page.title}
                          </h3>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded shrink-0">
                          Core
                        </span>
                      </div>

                      <p className="text-[11px] sm:text-xs text-neutral-600 leading-snug line-clamp-2 mb-2">
                        {page.purpose}
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-neutral-100 flex flex-wrap items-center gap-1">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mr-1">
                        Sections:
                      </span>
                      {page.keySections.map((sec, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] text-neutral-700 font-medium"
                        >
                          {sec}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Scope Notice */}
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4 text-[#1430d8] shrink-0" />
                  <span>Need extra custom pages or unique cart funnels? We customize any sitemap structure.</span>
                </div>
                <button
                  onClick={() => handleScrollToSection('type-inquiry-section')}
                  className="font-bold text-[#1430d8] hover:underline whitespace-nowrap cursor-pointer text-xs"
                >
                  Request Custom Scope →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TECHNICAL & UX FEATURES */}
          {activeSpecTab === 'features' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {(ecommerceType.technicalFeatures || [
                {
                  title: 'Sub-Second Speed',
                  description: 'Optimized asset delivery and fast server caching for 95+ Core Web Vitals.',
                  category: 'Performance & Conversion'
                },
                {
                  title: '1-Click Express Pay',
                  description: 'Instant checkout supporting Apple Pay, Google Pay, and Stripe.',
                  category: 'Payment & Security'
                },
                {
                  title: 'Multi-Currency Detection',
                  description: 'Presents local currency and regional tax rates automatically based on shopper IP.',
                  category: 'Payment & Security'
                },
                {
                  title: 'Automated Invoices & Sync',
                  description: 'Generates branded PDF invoices and dispatches order confirmation receipts.',
                  category: 'Inventory & Operations'
                }
              ]).map((feat, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-xs hover:border-[#1430d8]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded-md">
                        {feat.category}
                      </span>
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-display text-xs sm:text-sm md:text-base font-bold text-neutral-900 mb-1">
                      {feat.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: TECH STACK & PRODUCTION STANDARDS */}
          {activeSpecTab === 'tech' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              <div className="lg:col-span-8 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-xs">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                  <Cpu className="w-4 h-4 text-[#1430d8]" />
                  <span>Technology Stack &amp; Platforms</span>
                </div>
                <h3 className="font-display text-base sm:text-lg font-bold text-neutral-900 mb-1.5">
                  Custom Code • Shopify • WordPress &amp; WooCommerce
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 mb-4">
                  Available in your preferred e-commerce platform and modern frameworks:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {(ecommerceType.techStack || ['Custom Code', 'Shopify & Shopify Plus', 'WooCommerce', 'Stripe', 'Tailwind CSS', 'TypeScript']).map(
                    (tech, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200/70 flex items-center gap-2 sm:gap-2.5"
                      >
                        <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1430d8] shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">{tech}</span>
                      </div>
                    )
                  )}
                </div>

                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <h4 className="text-[11px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 sm:mb-2">
                      PCI-DSS Compliant Security
                    </h4>
                    <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                      Zero merchant credit card liability. Secure tokenized checkout via Stripe and Apple Pay with automated HTTPS encryption.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 sm:mb-2">
                      SEO-Ready Product Schema
                    </h4>
                    <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                      Rich product schema (JSON-LD) for Google Shopping, price rich snippets, stock availability, and social sharing OpenGraph tags.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommended Add-ons */}
              <div className="lg:col-span-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-xs">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2 sm:mb-3">
                  <Sliders className="w-4 h-4 text-[#1430d8]" />
                  <span>Popular Add-Ons</span>
                </div>
                <div className="space-y-2">
                  {(ecommerceType.recommendedAddOns || [
                    'Multi-Currency Auto-Detection',
                    'Automated WhatsApp Order Alerts',
                    'Product Customizer & Engraving Preview',
                    'Customer Verified Reviews & Star Ratings'
                  ]).map((addon, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-neutral-50 border border-neutral-200/60 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-neutral-800 text-xs truncate">{addon}</span>
                      <span className="text-[10px] text-[#1430d8] font-bold uppercase shrink-0">Available</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 sm:mt-4 text-[11px] text-neutral-500 leading-relaxed">
                  You can specify any of these add-ons when requesting your store proposal below.
                </div>
              </div>
            </div>
          )}
        </div>


        {/* ========================================================================= */}
        {/* RELEVANT SHOWCASE SECTION (Strictly Isolated to THIS Category Only) */}
        {/* ========================================================================= */}
        <div id="type-showcase-section" className="mt-12 sm:mt-16 lg:mt-20 scroll-mt-24 sm:scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 sm:pb-6 border-b border-neutral-200">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] sm:text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5 text-[#0075f7] shrink-0" />
                <span>{service.title} • Showcase</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight">
                {ecommerceType.name} Showcase
              </h2>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-neutral-600 max-w-2xl">
                Explore verified {ecommerceType.name} showcase projects engineered under {service.title}.
              </p>
            </div>

            <span className="text-xs sm:text-sm font-bold text-[#1430d8] bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100 self-start sm:self-auto shrink-0">
              {displayProjects.length} {displayProjects.length === 1 ? 'Project' : 'Projects'}
            </span>
          </div>

          {displayProjects.length > 0 ? (
            <>
              <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {displayedProjects.map((project) => (
                  <ShowcaseProjectCard
                    key={project.id}
                    project={project}
                    activeVideoId={activeVideoCardId}
                    onPlayVideo={(id) => setActiveVideoCardId(id)}
                    onStopVideo={() => setActiveVideoCardId(null)}
                    onOpenModal={(proj) => setPreviewProject(proj)}
                    idPrefix="ecommerce-type-showcase"
                    serviceTitle="E-Commerce Development"
                    categoryTitle={ecommerceType.name}
                  />
                ))}
              </div>

              {/* Show More / Show Less Pagination when items > 5 */}
              {displayProjects.length > 5 && (
                <div id="ecommerce-type-showcase-controls" className="mt-8 flex flex-col items-center gap-3 scroll-mb-6 sm:scroll-mb-8">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {showcaseVisibleCount < displayProjects.length && (
                      <button
                        onClick={() => setShowcaseVisibleCount((prev) => Math.min(prev + 5, displayProjects.length))}
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
            </>
          ) : (
            <div className="mt-8 p-10 sm:p-14 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 text-center">
              <Layers className="w-10 h-10 text-[#1430d8] mx-auto mb-3 opacity-60" />
              <h3 className="font-display text-base font-bold text-neutral-900">
                Tailored Case Studies Available
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
                Inquire below to review personalized case studies aligned with your specific {ecommerceType.name} product catalog.
              </p>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* DIRECT PROJECT INQUIRY & ORDER FORM (SAME UNIFIED STRUCTURE) */}
        {/* ========================================================================= */}
        <div id="type-inquiry-section" className="mt-12 sm:mt-16 lg:mt-20 scroll-mt-24 sm:scroll-mt-28">
          <div className="max-w-2xl mx-auto rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 p-5 sm:p-8 md:p-10 shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1430d8] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct Order &amp; Custom Quote</span>
            </div>
            
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0e0e0e] mt-2">
              Order {selectedCategory}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-600">
              Submit your project details below. Lead engineer Usman Afzal will review your store requirements within 4 hours.
            </p>

            {submittedSuccess ? (
              <div className="mt-6 p-6 sm:p-8 rounded-2xl bg-blue-50/80 border border-blue-200 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white text-[#1430d8] flex items-center justify-center mb-3 shadow-xs">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#0e0e0e]">
                  Proposal Request Dispatched!
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-neutral-600 max-w-sm">
                  We received your inquiry for <strong>{selectedCategory}</strong>. We will review your requirements and reach out via email shortly.
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
                <button
                  onClick={() => setSubmittedSuccess(false)}
                  className="mt-4 px-5 py-2 rounded-xl bg-neutral-900 text-white text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition-all cursor-pointer shadow-xs"
                >
                  Submit Another Query
                </button>
              </div>
            ) : (
              <form onSubmit={handleGmailOrder} noValidate className="mt-6 space-y-4">
                {/* 1. Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="ecommerce-inquiry-name" className="block text-xs font-semibold text-neutral-700">
                        Your Name *
                      </label>
                      {isNameInvalid && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          Required
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      id="ecommerce-inquiry-name"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Christian Grey"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] focus:outline-none transition-all ${
                        isNameInvalid
                          ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                          : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="ecommerce-inquiry-email" className="block text-xs font-semibold text-neutral-700">
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
                      id="ecommerce-inquiry-email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="e.g. contact@luxurybrand.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] focus:outline-none transition-all ${
                        isEmailInvalid
                          ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                          : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. Selected Category Banner */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#1430d8]" />
                      <span>Category Focus</span>
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      ✓ Pre-Selected
                    </span>
                  </div>
                  <div className="w-full px-4 py-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm font-bold text-[#1430d8] flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-[#1430d8] shrink-0" />
                      <span className="font-bold text-xs sm:text-sm">{ecommerceType.name}</span>
                    </div>
                    <span className="text-[11px] text-[#1430d8] font-semibold bg-white/90 px-2.5 py-0.5 rounded-md border border-blue-100 shrink-0">
                      {ecommerceType.estimatedDelivery}
                    </span>
                  </div>
                </div>

                {/* 3. Project Brief */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="ecommerce-inquiry-message" className="block text-xs font-semibold text-neutral-700">
                      Project Brief &amp; Products to Sell *
                    </label>
                    {isMessageInvalid && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Required
                      </span>
                    )}
                  </div>
                  <textarea
                    id="ecommerce-inquiry-message"
                    required
                    rows={4}
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    placeholder="Describe your products to sell, required payment gateways, or inspiration links..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] focus:outline-none transition-all resize-y min-h-[90px] max-h-[300px] ${
                      isMessageInvalid
                        ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                        : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                    }`}
                  />
                  <p className="mt-1.5 text-[11px] text-neutral-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Includes 100% responsive QA, fast checkout, free SSL, and post-launch support.</span>
                  </p>
                </div>

                {/* 4. Action Buttons (Side by Side in 1 Row: Send Order via Gmail & Order via WhatsApp) */}
                <div className="pt-0.5">
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    <button
                      type="submit"
                      id="submit-ecom-type-page-gmail-btn"
                      disabled={isSubmitting}
                      className="min-h-[44px] w-full py-2.5 sm:py-3 px-2.5 sm:px-4 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] active:scale-[0.99] text-white text-[11px] sm:text-xs md:text-sm font-bold leading-tight text-center transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-60"
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
                      id="submit-ecom-type-page-whatsapp-btn"
                      onClick={handleWhatsAppOrder}
                      disabled={isSubmitting}
                      className="min-h-[44px] w-full py-2.5 sm:py-3 px-2.5 sm:px-4 rounded-xl bg-[#25D366] hover:bg-[#1eb954] active:scale-[0.99] text-white text-[11px] sm:text-xs md:text-sm font-bold leading-tight text-center transition-all shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer disabled:opacity-60"
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

      {/* ========================================================================= */}
      {/* QUICK PROJECT PREVIEW MODAL */}
      {/* ========================================================================= */}
      <ProjectDetailModal
        project={previewProject}
        onClose={() => setPreviewProject(null)}
        serviceTitle="E-Commerce Development"
        categoryTitle={ecommerceType.name}
        onOpenContact={(_srv, _cat, proj) => {
          const target = proj || previewProject;
          if (target) {
            setClientMessage(
              `I am interested in a ${ecommerceType.name} storefront similar to "${target.title}".\n\nSpecific Requirements: `
            );
          }
          handleScrollToSection('type-inquiry-section');
        }}
      />
    </div>
  );
};
