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
  Smartphone,
  Tablet,
  Laptop,
  CheckCircle2,
  Clock,
  Briefcase,
  Layout,
  MessageSquare,
  ShieldCheck,
  FileCheck,
  Share2,
  Sliders,
  Cpu,
  Box,
  Film,
  MessageCircle,
  AlertCircle,
  Lock,
  Calendar,
  Globe,
  Mail
} from 'lucide-react';
import { dispatchOrderToGmail, dispatchOrderToWhatsApp } from '../utils/orderDispatch';
import { Service, Project } from '../types';
import { getProjects } from '../services/storageService';
import { ThreeDExperienceTypeInfo, THREE_D_EXPERIENCE_TYPES_DATA } from '../data/threeDExperienceTypes';
import { addContactMessage } from '../services/storageService';
import { ShowcaseProjectCard } from './ShowcaseProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { scrollToSectionWithOffset, snapScrollToElement } from '../utils/scroll';

interface ThreeDTypeDetailPageProps {
  experienceType: ThreeDExperienceTypeInfo;
  service: Service;
  onBackTo3DCatalog: () => void;
  onSelectType?: (type: ThreeDExperienceTypeInfo) => void;
  serviceProjects: Project[];
}

export const ThreeDTypeDetailPage: React.FC<ThreeDTypeDetailPageProps> = ({
  experienceType,
  service,
  onBackTo3DCatalog,
  onSelectType,
  serviceProjects
}) => {
  // Navigation & view states
  const [activeSpecTab, setActiveSpecTab] = useState<'deliverables' | 'pages' | 'features' | 'tech'>('deliverables');
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [activeVideoCardId, setActiveVideoCardId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Form states
  const [selectedCategory, setSelectedCategory] = useState<string>(experienceType.name);
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientMessage, setClientMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setSelectedCategory(experienceType.name);
    setSubmittedSuccess(false);
    setAttemptedSubmit(false);
    setActiveSpecTab('deliverables');
    setActiveVideoCardId(null);
  }, [experienceType.id, experienceType.name]);

  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId) || document.getElementById('service-order-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + `#service-srv-2/type/${experienceType.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
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
      document.getElementById('threed-inquiry-name')?.focus();
      return false;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.')) {
      document.getElementById('threed-inquiry-email')?.focus();
      return false;
    }
    if (!clientMessage.trim()) {
      document.getElementById('threed-inquiry-message')?.focus();
      return false;
    }
    return true;
  };

  const [lastOrderLinks, setLastOrderLinks] = useState<{ gmailUrl: string; waUrl: string } | null>(null);

  const handleGmailOrder = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const links = await dispatchOrderToGmail({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        service: '3D Animated Websites',
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
        service: '3D Animated Websites',
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

  // Filter 3D/video projects matching this specific experience type
  const relevantProjects = useMemo(() => {
    const all = getProjects();
    const typeName = experienceType.name.toLowerCase();
    const exactMatch = all.filter(
      (p) =>
        (p.category || '').toLowerCase().includes('3d') &&
        (p.subcategory || '').toLowerCase() === typeName
    );
    if (exactMatch.length > 0) return exactMatch;

    return all.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const sub = (p.subcategory || '').toLowerCase();
      return (
        cat.includes('3d') &&
        ((experienceType.id.includes('variant') && (sub.includes('variant') || sub.includes('product experiences'))) ||
          (experienceType.id.includes('cinematic') && (sub.includes('cinematic') || sub.includes('3d websites'))) ||
          (experienceType.id.includes('scroll') && (sub.includes('scroll') || sub.includes('animation'))))
      );
    });
  }, [experienceType]);

  const displayProjects = relevantProjects.length > 0 ? relevantProjects : serviceProjects.slice(0, 3);

  const [showcaseVisibleCount, setShowcaseVisibleCount] = useState<number>(5);

  useEffect(() => {
    setShowcaseVisibleCount(5);
  }, [experienceType.id]);

  const displayedProjects = useMemo(() => {
    return displayProjects.slice(0, showcaseVisibleCount);
  }, [displayProjects, showcaseVisibleCount]);

  const handleShowLess = () => {
    const targetProject = displayProjects[4];
    const targetEl = targetProject
      ? document.getElementById(`threed-type-showcase-${targetProject.id}`)
      : null;
    snapScrollToElement(targetEl || document.getElementById('threed-type-showcase-controls'), () => {
      setShowcaseVisibleCount(5);
    });
  };

  return (
    <div id="website-type-detail-page-container" className="min-h-screen bg-[#fbfbfe] text-[#0e0e0e] pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* TOP CONTEXT BAR: Breadcrumbs & Focused Category Header (Strictly Single Row) */}
        {/* ========================================================================= */}
        <div className="pb-5 sm:pb-6 border-b border-neutral-200/80">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Back Button */}
            <button
              id="back-to-webdev-button"
              onClick={onBackTo3DCatalog}
              className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:text-[#1430d8] hover:border-[#1430d8]/40 shadow-xs font-semibold text-xs sm:text-sm transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-1 shrink-0" />
              <span>
                <span className="hidden sm:inline">Back to </span>
                <span>3D Experiences</span>
              </span>
            </button>

            {/* Breadcrumb Path & Share - Strictly 1 Single Row, Never Wraps, Full Category Name Always Visible */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 max-w-full justify-end">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center flex-nowrap gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-neutral-500 font-medium whitespace-nowrap overflow-x-auto no-scrollbar py-0.5"
              >
                <button onClick={onBackTo3DCatalog} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  Home
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <button onClick={onBackTo3DCatalog} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  Services
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <button onClick={onBackTo3DCatalog} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  <span>3D</span>
                  <span className="hidden md:inline"> Experiences</span>
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <span className="text-[#1430d8] font-bold shrink-0">
                  {experienceType.name}
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
                {experienceType.categoryPill || '3D Experience Specification'}
              </span>
            </div>
            {experienceType.badge && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100/90 border border-neutral-200/80 text-[10.5px] sm:text-xs font-medium text-neutral-700">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1430d8] shrink-0" />
                <span>{experienceType.badge}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-[10.5px] sm:text-xs font-semibold text-emerald-800 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
              <span>Available in: Custom Code • Shopify • WordPress &amp; WooCommerce</span>
            </div>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight sm:leading-[1.15]">
            {experienceType.name}
          </h1>

          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base md:text-lg text-neutral-700 leading-relaxed font-normal">
            {experienceType.whatIsIt || experienceType.tagline}
          </p>

          {/* Clean Responsive Metrics Grid */}
          <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />
                <span>Timeline</span>
              </div>
              <div className="font-display text-xs sm:text-sm md:text-base font-bold text-neutral-900 leading-snug break-words">
                {experienceType.estimatedDelivery}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <Layers className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />
                <span>Scope</span>
              </div>
              <div className="font-display text-xs sm:text-sm md:text-base font-bold text-neutral-900 leading-snug break-words">
                {experienceType.whatClientGets.length} Core Assets
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Performance</span>
              </div>
              <div className="font-display text-xs sm:text-sm md:text-base font-bold text-neutral-900 leading-snug break-words">
                60 FPS GPU Solid
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Support</span>
              </div>
              <div className="font-display text-xs sm:text-sm md:text-base font-bold text-neutral-900 leading-snug break-words">
                Post-Launch Handover
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
              {experienceType.bestFor}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => handleScrollToSection('type-inquiry-section')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-full bg-[#1430d8] hover:bg-[#0075f7] text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer w-full sm:w-auto"
            >
              <span>Request Project Quote</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleScrollToSection('type-showcase-section')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-white border border-neutral-200 text-neutral-800 hover:border-[#1430d8] hover:text-[#1430d8] font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer w-full sm:w-auto"
            >
              <Layers className="w-4 h-4 text-[#1430d8]" />
              <span>View Examples</span>
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
                <span>What&apos;s Included &amp; Specifications</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight">
                Everything Included in Your {experienceType.name}
              </h2>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-neutral-600 max-w-2xl leading-relaxed">
                Review complete deliverables, interaction hierarchy, technical capabilities, and production engineering standards.
              </p>
            </div>

            {/* Segmented Spec Tabs */}
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
                      <span>Deliverables Checklist ({experienceType.whatClientGets.length})</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-[#1430d8] bg-blue-50 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shrink-0">
                      Included Deliverables
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                    {experienceType.whatClientGets.map((deliverable, idx) => (
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
                            Professional standard, fully tested at 60 FPS.
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Production & Asset Standards */}
                  <div className="mt-4 sm:mt-5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-50/40 border border-blue-100">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-900 mb-2">
                      <Sparkles className="w-4 h-4 text-[#1430d8]" />
                      <span>Asset &amp; Production Standards</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Client assets or custom 3D animation preparation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Sub-2MB asset optimization for instant streaming</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Touch-calibrated responsive controls for iOS &amp; Android</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>60 FPS GPU-accelerated rendering across modern browsers</span>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Timeline Note */}
                  <div className="mt-4 sm:mt-5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-100 border border-neutral-200 flex items-start gap-2.5 sm:gap-3 text-xs text-neutral-700">
                    <Clock className="w-4 h-4 text-[#1430d8] shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong>Project Timeline: </strong>
                      Delivery timeline is finalized directly with you during project consultation based on custom requirements, asset readiness, and project scope.
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 4 cols: Handover & Support */}
              <div className="lg:col-span-4">
                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-xs">
                  <h3 className="font-display text-sm sm:text-base font-bold text-neutral-900 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#1430d8]" />
                    <span>Handover &amp; Support</span>
                  </h3>
                  <div className="space-y-3 sm:space-y-3.5 text-xs text-neutral-600">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>100% Code Ownership:</strong> Full rights to all frontend code, GSAP choreography, and interaction logic.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Optimized Assets:</strong>{' '}
                        {experienceType.id === 'cinematic-video-atmosphere'
                          ? 'Lossless WebM/H.264 video compression under 2MB for fast streaming.'
                          : experienceType.id === 'scroll-driven-video-hero'
                          ? 'Lightweight WebP frame sequences and pre-cached canvas rendering pipelines.'
                          : 'Pre-cached variant texture maps and smooth transition easing curves.'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Production Deployment:</strong> Professional CDN connection, SSL setup, and seamless embed into your existing website or standalone page.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Post-Launch Support:</strong> Assistance with browser updates, mobile calibrations, and agreed tweaks.</span>
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
                {(experienceType.pageBreakdown || []).map((page, idx) => (
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
                  <span>Need bespoke 3D physics or custom interaction triggers? We can engineer any vision.</span>
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

          {/* TAB 3: TECHNICAL FEATURES */}
          {activeSpecTab === 'features' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {(experienceType.technicalFeatures || []).map((feat, idx) => (
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

          {/* TAB 4: TECH STACK */}
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
                  Built with 3D WebGL, interactive canvas rendering, and your choice of platform:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {(experienceType.techStack || ['Three.js', 'GSAP', 'WebGL 2.0', 'Vite', 'Tailwind CSS']).map(
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
                      {experienceType.id === 'cinematic-video-atmosphere'
                        ? 'Multi-Section Video Decoding'
                        : experienceType.id === 'scroll-driven-video-hero'
                        ? 'HTML5 Canvas Frame Engine'
                        : 'Fixed Ambient Canvas Isolation'}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                      {experienceType.id === 'cinematic-video-atmosphere'
                        ? 'Hardware-accelerated video decoding that auto-pauses off-screen sections to eliminate mobile battery drain.'
                        : experienceType.id === 'scroll-driven-video-hero'
                        ? 'requestAnimationFrame painter rendering pre-cached frame sequences with zero video stutter and 60 FPS precision.'
                        : 'Stable backdrop layer separated from foreground product transitions to eliminate visual background distractions.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 sm:mb-2">
                      {experienceType.id === 'cinematic-video-atmosphere'
                        ? 'Dual-Stream Codecs (<2MB)'
                        : experienceType.id === 'scroll-driven-video-hero'
                        ? 'Bi-Directional Frame Cache'
                        : 'GSAP ScrollTrigger Pipeline'}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                      {experienceType.id === 'cinematic-video-atmosphere'
                        ? 'Lossless WebM VP9 and H.264 video compression guaranteeing sub-2MB streaming per section.'
                        : experienceType.id === 'scroll-driven-video-hero'
                        ? 'Pre-cached WebP image frames in memory for instantaneous forward down-scroll and reverse up-scroll.'
                        : 'Coordinates entrance reveals, exploded spec callouts, and conversion actions across downstream sections.'}
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
                    {(experienceType.recommendedAddOns || [
                    'Interactive Sound Design & Click Foley',
                    'Augmented Reality (AR Quick Look)',
                    'Direct WebGL & Stripe Checkout Sync',
                    'Multi-Scene Video Carousel'
                  ]).map((addon, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-neutral-50 border border-neutral-200/60 flex items-center justify-between text-xs gap-2"
                    >
                      <span className="font-semibold text-neutral-800 text-xs break-words">{addon}</span>
                      <span className="text-[10px] text-[#1430d8] font-bold uppercase shrink-0">Available</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 sm:mt-4 text-[11px] text-neutral-500 leading-relaxed">
                  You can select any of these add-ons when submitting your project inquiry below.
                </div>
              </div>
            </div>
          )}
        </div>


        {/* ========================================================================= */}
        {/* RELEVANT SHOWCASE SECTION */}
        {/* ========================================================================= */}
        <div id="type-showcase-section" className="mt-12 sm:mt-16 lg:mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 sm:pb-6 border-b border-neutral-200">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] sm:text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5 text-[#0075f7] shrink-0" />
                <span>{service.title} • Showcase</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight">
                {experienceType.name} Showcase
              </h2>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-neutral-600 max-w-2xl">
                Explore verified {experienceType.name} showcase projects engineered under {service.title}.
              </p>
            </div>
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
                    idPrefix="threed-type-showcase"
                    serviceTitle="3D Animated Websites"
                    categoryTitle={experienceType.name}
                  />
                ))}
              </div>

              {/* Show More / Show Less Pagination when items > 5 */}
              {displayProjects.length > 5 && (
                <div id="threed-type-showcase-controls" className="mt-8 flex flex-col items-center gap-3 scroll-mb-6 sm:scroll-mb-8">
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
            <div className="mt-6 sm:mt-8 p-6 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 text-center">
              <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-[#1430d8] mx-auto mb-2.5 sm:mb-3 opacity-60" />
              <h3 className="font-display text-sm sm:text-base font-bold text-neutral-900">
                Tailored Case Studies Available on Request
              </h3>
              <p className="mt-1 text-xs text-neutral-500 max-w-md mx-auto">
                Inquire below to review personalized case studies, prototypes, and live deployment examples specifically aligned with your project requirements.
              </p>
            </div>
          )}
        </div>

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
                      <label htmlFor="threed-inquiry-name" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
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
                      id="threed-inquiry-name"
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
                      <label htmlFor="threed-inquiry-email" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
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
                      id="threed-inquiry-email"
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
                      <Box className="w-3.5 h-3.5 text-[#1430d8]" />
                      <span>Selected Category / Focus</span>
                    </label>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Pre-Selected
                    </span>
                  </div>
                  <div className="w-full px-3.5 py-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm font-bold text-[#1430d8] flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-[#1430d8] shrink-0" />
                      <span className="truncate">{experienceType.name}</span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-[#1430d8] font-semibold bg-white/90 px-2.5 py-0.5 rounded-md border border-blue-100 shrink-0">
                      {experienceType.estimatedDelivery}
                    </span>
                  </div>
                </div>

                {/* 3. Project Brief & Required Deliverables */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="threed-inquiry-message" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                      Project Brief &amp; Required Deliverables *
                    </label>
                    {isMessageInvalid && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Required
                      </span>
                    )}
                  </div>
                  <textarea
                    id="threed-inquiry-message"
                    required
                    rows={3}
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    placeholder="Describe your 3D product visualizer, interaction goals, required camera angles, or assets available..."
                    className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] focus:outline-none transition-all resize-y min-h-[75px] max-h-[350px] ${
                      isMessageInvalid
                        ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                        : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                    }`}
                  />
                  <p className="mt-1 text-[10px] text-neutral-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Includes 60 FPS WebGL optimization, mobile gyroscope support, and cross-browser QA.</span>
                  </p>
                </div>

                {/* 4. Action Buttons (Side by Side: Send Order via Gmail & Order via WhatsApp) */}
                <div className="pt-0.5">
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    <button
                      type="submit"
                      id="submit-threed-type-page-gmail-btn"
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
                      id="submit-threed-type-page-whatsapp-btn"
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

        {/* ========================================================================= */}
        {/* BOTTOM RETURN BAR */}
        {/* ========================================================================= */}
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onBackTo3DCatalog}
            className="group inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-neutral-600 hover:text-[#1430d8] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to 3D Animated Websites Overview</span>
          </button>
        </div>

      </div>

      {/* Project Preview Modal */}
      <ProjectDetailModal
        project={previewProject}
        onClose={() => setPreviewProject(null)}
        serviceTitle="3D Animated Websites"
        categoryTitle={experienceType.name}
        onOpenContact={(_srv, _cat, proj) => {
          const target = proj || previewProject;
          if (target) {
            setClientMessage(
              `I am interested in a ${experienceType.name} experience similar to "${target.title}".\n\nSpecific Requirements: `
            );
          }
          handleScrollToSection('service-order-form');
        }}
      />
    </div>
  );
};
