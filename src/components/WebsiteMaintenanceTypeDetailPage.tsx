import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  ChevronRight,
  Share2,
  MessageCircle,
  Check,
  AlertCircle,
  Wrench,
  CheckCircle2,
  Sparkles,
  Layers,
  Zap,
  ShieldCheck,
  Briefcase,
  FileCheck,
  Code2,
  Rocket,
  Mail
} from 'lucide-react';
import { dispatchOrderToGmail, dispatchOrderToWhatsApp } from '../utils/orderDispatch';
import { Project } from '../types';
import { WebsiteMaintenanceTypeInfo, WEBSITE_MAINTENANCE_TYPES_DATA } from '../data/websiteMaintenanceTypes';
import { ShowcaseProjectCard } from './ShowcaseProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { addContactMessage } from '../services/storageService';

interface WebsiteMaintenanceTypeDetailPageProps {
  maintenanceType: WebsiteMaintenanceTypeInfo;
  onBackToMaintenance: () => void;
  onSelectOtherType: (type: WebsiteMaintenanceTypeInfo) => void;
  serviceProjects?: Project[];
  onOpenContact?: (servicePreset?: string, categoryPreset?: string) => void;
}

export const WebsiteMaintenanceTypeDetailPage: React.FC<WebsiteMaintenanceTypeDetailPageProps> = ({
  maintenanceType,
  onBackToMaintenance,
  onSelectOtherType,
  serviceProjects = [],
  onOpenContact,
}) => {
  const [activeSpecTab, setActiveSpecTab] = useState<'deliverables' | 'coverage' | 'standards' | 'workflow'>('deliverables');
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [activeVideoCardId, setActiveVideoCardId] = useState<string | null>(null);

  const matchedCategoryProjects = serviceProjects.filter((p) => {
    const sub = (p.subcategory || '').toLowerCase();
    const target = maintenanceType.name.toLowerCase();
    return sub === target || sub.includes(target) || target.includes(sub);
  });

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [clientMessage, setClientMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const otherTypes = WEBSITE_MAINTENANCE_TYPES_DATA.filter((t) => t.id !== maintenanceType.id);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleScrollToForm = () => {
    const el = document.getElementById('maintenance-order-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGoToFullOrderPage = () => {
    if (onOpenContact) {
      onOpenContact('Website Maintenance', maintenanceType.name);
    } else {
      handleScrollToForm();
    }
  };

  const isNameInvalid = attemptedSubmit && !clientName.trim();
  const isEmailInvalid = attemptedSubmit && (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.'));
  const isMessageInvalid = attemptedSubmit && !clientMessage.trim();

  const validateForm = (): boolean => {
    setAttemptedSubmit(true);
    if (!clientName.trim()) {
      document.getElementById('maintenance-inquiry-name')?.focus();
      return false;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.')) {
      document.getElementById('maintenance-inquiry-email')?.focus();
      return false;
    }
    if (!clientMessage.trim()) {
      document.getElementById('maintenance-inquiry-message')?.focus();
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
      const fullMsg = websiteUrl.trim()
        ? `Website URL: ${websiteUrl.trim()}\n\nRequirements:\n${clientMessage.trim()}`
        : clientMessage.trim();

      const links = await dispatchOrderToGmail({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        service: 'Website Maintenance & Retainers',
        category: maintenanceType.name,
        budget: 'Custom Scope / Direct Inquiry',
        message: fullMsg
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
      const fullMsg = websiteUrl.trim()
        ? `Website URL: ${websiteUrl.trim()}\n\nRequirements:\n${clientMessage.trim()}`
        : clientMessage.trim();

      const links = await dispatchOrderToWhatsApp({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        service: 'Website Maintenance & Retainers',
        category: maintenanceType.name,
        budget: 'Custom Scope / Direct Inquiry',
        message: fullMsg
      });
      setLastOrderLinks(links);
      setSubmittedSuccess(true);
      setAttemptedSubmit(false);
    } catch (err) {
      console.error('Failed to dispatch WhatsApp order', err);
    }
  };

  const generateWhatsAppLink = () => {
    const text = `Hello Usman DevHub,\n\nI want to inquire about Website Maintenance:\n• Category: *${maintenanceType.name}*\n• Website URL: ${websiteUrl.trim() || 'Not specified'}`;
    return `https://wa.me/923412683864?text=${encodeURIComponent(text)}`;
  };

  return (
    <div id="website-maintenance-type-detail-page-container" className="min-h-screen bg-[#fafafc] text-neutral-900 pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* TOP CONTEXT BAR: Breadcrumbs & Actions (Strictly Single Row) */}
        {/* ========================================================================= */}
        <div className="pb-5 sm:pb-6 border-b border-neutral-200/80">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Back Button */}
            <button
              id="back-to-maintenance-button"
              onClick={onBackToMaintenance}
              className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:text-[#1430d8] hover:border-[#1430d8]/40 shadow-xs font-semibold text-xs sm:text-sm transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-1 shrink-0" />
              <span>
                <span className="hidden sm:inline">Back to </span>
                <span>Maintenance</span>
              </span>
            </button>

            {/* Breadcrumb Path & Share - Strictly 1 Single Row, Never Wraps, Full Category Name Always Visible */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 max-w-full justify-end">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center flex-nowrap gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-neutral-500 font-medium whitespace-nowrap overflow-x-auto no-scrollbar py-0.5"
              >
                <button onClick={onBackToMaintenance} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  Home
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <button onClick={onBackToMaintenance} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  Services
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <button onClick={onBackToMaintenance} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  <span>Maintenance</span>
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <span className="text-[#1430d8] font-bold shrink-0">
                  {maintenanceType.name}
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
        {/* HERO SECTION: Clean Responsive Layout with Key Metrics (No Days / Time) */}
        {/* ========================================================================= */}
        <div className="mt-6 sm:mt-8 max-w-4xl">
          {/* Category Pill & Focus Badge (Clean Responsive Wrapping) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3.5 sm:mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10.5px] sm:text-xs font-bold text-[#1430d8]">
              <Sparkles className="w-3.5 h-3.5 text-[#0075f7] shrink-0" />
              <span className="uppercase tracking-wider">
                {maintenanceType.categoryPill || 'Maintenance Specification'}
              </span>
            </div>
            {maintenanceType.badge && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100/90 border border-neutral-200/80 text-[10.5px] sm:text-xs font-medium text-neutral-700">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1430d8] shrink-0" />
                <span>{maintenanceType.badge}</span>
              </div>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight sm:leading-[1.15]">
            {maintenanceType.name}
          </h1>

          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base md:text-lg text-neutral-700 leading-relaxed font-normal">
            {maintenanceType.whatIsIt || maintenanceType.tagline}
          </p>

          {/* Clean Responsive Metrics Grid */}
          <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <Wrench className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />
                <span>Scope</span>
              </div>
              <div className="font-display text-xs sm:text-sm md:text-base font-bold text-neutral-900 leading-snug break-words">
                Dedicated Support
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <Layers className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />
                <span>Coverage</span>
              </div>
              <div className="font-display text-xs sm:text-sm md:text-base font-bold text-neutral-900 leading-snug break-words">
                {maintenanceType.whatClientGets.length} Deliverables
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Performance</span>
              </div>
              <div className="font-display text-xs sm:text-sm md:text-base font-bold text-neutral-900 leading-snug break-words">
                Zero Downtime
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>QA Guarantee</span>
              </div>
              <div className="font-display text-xs sm:text-sm md:text-base font-bold text-neutral-900 leading-snug break-words">
                100% Tested
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
              {maintenanceType.bestFor}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              onClick={handleScrollToForm}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-full bg-[#1430d8] hover:bg-[#0075f7] text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer w-full sm:w-auto"
            >
              <span>Order {maintenanceType.name}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleGoToFullOrderPage}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-white border border-neutral-200 text-neutral-800 hover:border-[#1430d8] hover:text-[#1430d8] font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer w-full sm:w-auto"
            >
              <Send className="w-4 h-4 text-[#1430d8]" />
              <span>Open in Full Agency Order Form</span>
            </button>

            <a
              href={generateWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-[#25D366] hover:bg-[#1eb954] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer w-full sm:w-auto"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Chat</span>
            </a>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODULAR SPECIFICATIONS SUITE */}
        {/* ========================================================================= */}
        <div className="mt-12 sm:mt-16 lg:mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] sm:text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-2">
                <FileCheck className="w-3.5 h-3.5 text-[#0075f7] shrink-0" />
                <span>Full Service Specifications</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight">
                Everything Included in {maintenanceType.name}
              </h2>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-neutral-600 max-w-2xl leading-relaxed">
                Review complete scope, deliverables checklist, engineering standards, and deployment workflow.
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
                onClick={() => setActiveSpecTab('coverage')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeSpecTab === 'coverage'
                    ? 'bg-white text-[#1430d8] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                What We Cover
              </button>
              <button
                onClick={() => setActiveSpecTab('standards')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeSpecTab === 'standards'
                    ? 'bg-white text-[#1430d8] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Quality Standards
              </button>
              <button
                onClick={() => setActiveSpecTab('workflow')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeSpecTab === 'workflow'
                    ? 'bg-white text-[#1430d8] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Workflow &amp; Tech
              </button>
            </div>
          </div>

          {/* TAB 1: DELIVERABLES & SCOPE */}
          {activeSpecTab === 'deliverables' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              <div className="lg:col-span-8 space-y-5 sm:space-y-6">
                <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-xs">
                  <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-neutral-100 mb-4 sm:mb-6 gap-2">
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Deliverables Checklist ({maintenanceType.whatClientGets.length})</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-[#1430d8] bg-blue-50 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shrink-0">
                      Included Deliverables
                    </span>
                  </div>

                  <div className="space-y-3">
                    {maintenanceType.whatClientGets.map((del, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3 hover:bg-white hover:border-[#1430d8]/30 transition-all"
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#1430d8] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-neutral-800 font-medium leading-relaxed">
                            {del}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Key Highlights */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-xs">
                  <h4 className="font-display text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#1430d8]" />
                    <span>Service Assurances</span>
                  </h4>
                  <ul className="space-y-2.5 text-xs text-neutral-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1430d8]" />
                      <span>Zero unexpected downtime during updates</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1430d8]" />
                      <span>Safe staging verification prior to live rollout</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1430d8]" />
                      <span>Full rollback backup snapshot created</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1430d8]" />
                      <span>Direct WhatsApp &amp; priority email contact</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-neutral-700">
                  <div className="font-bold text-[#1430d8] mb-1">Need Immediate Assistance?</div>
                  <p className="text-[11px] leading-relaxed text-neutral-600 mb-3">
                    Start directly with our order form below or contact our senior team directly on WhatsApp.
                  </p>
                  <button
                    onClick={handleScrollToForm}
                    className="w-full py-2 px-3 rounded-xl bg-[#1430d8] text-white text-xs font-semibold hover:bg-[#0075f7] transition-all cursor-pointer"
                  >
                    Go to Order Form
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHAT WE COVER */}
          {activeSpecTab === 'coverage' && (
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-xs">
              <h3 className="font-display text-base sm:text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#1430d8]" />
                <span>Scope &amp; Coverage Breakdown</span>
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-6 max-w-2xl">
                We handle both routine operations and mission-critical emergency tasks under {maintenanceType.name}:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Frontend Alignment & Layout Fixes', desc: 'Fix misaligned headers, broken grids, overlapping text, and modal dialog glitches.' },
                  { title: 'Form Submissions & Lead Capture', desc: 'Repair broken contact forms, validation errors, and email delivery integrations.' },
                  { title: 'Cross-Device Responsiveness', desc: 'Ensure pixel-perfect rendering across iPhone, iPad, Android, and desktop viewports.' },
                  { title: 'Script & Third-Party Library Fixes', desc: 'Fix conflicting JavaScript libraries, analytics pixels, and broken embeds.' },
                  { title: 'Content & Media Replacements', desc: 'Seamlessly update copy, banner graphics, team photos, and portfolio items.' },
                  { title: 'Core Web Vitals & Speed Tuning', desc: 'Improve LCP, CLS, and FID scores through asset compression and minification.' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#1430d8] mt-1.5 shrink-0" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900">{item.title}</h4>
                      <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: QUALITY STANDARDS */}
          {activeSpecTab === 'standards' && (
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-xs">
              <h3 className="font-display text-base sm:text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Production Engineering Standards</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs mb-2">01</div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mb-1">Pre-Release Snapshot</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed">Full database &amp; file backup created prior to altering any production assets.</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1430d8] flex items-center justify-center font-bold text-xs mb-2">02</div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mb-1">Multi-Browser QA</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed">Tested across modern Chrome, Safari, Firefox, iOS Mobile, and Android devices.</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs mb-2">03</div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mb-1">Zero Downtime Push</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed">Hotfixes and updates are deployed safely without disruption to active users.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WORKFLOW & TECH */}
          {activeSpecTab === 'workflow' && (
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-xs">
              <h3 className="font-display text-base sm:text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-[#1430d8]" />
                <span>Our Execution Flow</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {[
                  { step: '01', title: 'Audit & Diagnosis', desc: 'Examine requirements, identify root cause or scope specifications.' },
                  { step: '02', title: 'Staging Patch', desc: 'Code fixes or updates in isolated branch or staging environment.' },
                  { step: '03', title: 'Client Preview', desc: 'Review changes on staging link before deployment.' },
                  { step: '04', title: 'Live Release', desc: 'Deploy safely to production and verify live functionality.' }
                ].map((s, idx) => (
                  <div key={idx} className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/90 shadow-2xs">
                    <span className="inline-block font-display text-xs sm:text-sm font-extrabold text-[#1430d8] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md mb-1.5">{s.step}</span>
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mb-1 leading-snug">{s.title}</h4>
                    <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {matchedCategoryProjects.length > 0 && (
          <div id="maintenance-type-showcase" className="mt-10 sm:mt-14">
            <div className="mb-5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#1430d8]">
                {maintenanceType.name} Case Studies
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0e0e0e] tracking-tight mt-1">
                Verified {maintenanceType.name} Projects
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {matchedCategoryProjects.map((proj) => (
                <ShowcaseProjectCard
                  key={proj.id}
                  project={proj}
                  serviceTitle="Website Maintenance"
                  categoryTitle={maintenanceType.name}
                  activeVideoId={activeVideoCardId}
                  onPlayVideo={(id) => setActiveVideoCardId(id)}
                  onStopVideo={() => setActiveVideoCardId(null)}
                  onOpenModal={(selected) => setPreviewProject(selected)}
                  idPrefix="maintenance-type-card"
                />
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DIRECT ORDER FORM (Pre-Selected Category Box) */}
        {/* ========================================================================= */}
        <div id="maintenance-order-form" className="mt-14 sm:mt-20 scroll-mt-24">
          <div className="p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 shadow-md max-w-3xl mx-auto">
            {/* Form Header with Category Badge and Full Order Page Link */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-neutral-100 mb-6">
              <div>
                <span className="text-[10px] font-bold text-[#1430d8] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Direct Category Order
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#0e0e0e] mt-1.5">
                  Order {maintenanceType.name}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Your service category is pre-selected below. Share your requirements to begin.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoToFullOrderPage}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1430d8] hover:text-[#0075f7] bg-blue-50 hover:bg-blue-100/70 px-3.5 py-1.5 rounded-full border border-blue-200/80 transition-all cursor-pointer self-start sm:self-auto shadow-2xs"
              >
                <span>Open in Full Agency Order Form</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {submittedSuccess ? (
              <div className="py-8 text-center flex flex-col items-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-emerald-950">Inquiry Received Successfully!</h4>
                <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Thank you! We received your order request for <strong>{maintenanceType.name}</strong> and will get back to you shortly.
                </p>
                {lastOrderLinks && (
                  <div className="mt-2 grid grid-cols-2 gap-2 w-full max-w-md">
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
                  className="mt-3 px-5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleGmailOrder} noValidate className="space-y-4">
                {/* 1. Name & Work Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="maintenance-inquiry-name" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
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
                      id="maintenance-inquiry-name"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Ali Khan / Tech Solutions"
                      className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none transition-all ${
                        isNameInvalid
                          ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                          : 'border-neutral-200 bg-neutral-50 focus:border-[#1430d8]'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="maintenance-inquiry-email" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
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
                      id="maintenance-inquiry-email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="e.g. contact@business.com"
                      className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none transition-all ${
                        isEmailInvalid
                          ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                          : 'border-neutral-200 bg-neutral-50 focus:border-[#1430d8]'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. Pre-Selected Category Box (Pre-Selected for this category, No Days / Time) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] sm:text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-[#1430d8]" />
                      <span>Selected Category / Focus</span>
                    </label>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Pre-Selected for this Order
                    </span>
                  </div>
                  <div className="w-full px-3.5 py-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm font-bold text-[#1430d8] flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-[#1430d8] shrink-0" />
                      <span className="truncate">{maintenanceType.name}</span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-[#1430d8] font-semibold bg-white/90 px-2.5 py-0.5 rounded-md border border-blue-100 shrink-0">
                      {maintenanceType.categoryPill || 'Active Support'}
                    </span>
                  </div>
                </div>

                {/* 3. Website URL */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-1">
                    Website URL (Optional / Recommended)
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs sm:text-sm focus:outline-none focus:border-[#1430d8]"
                  />
                </div>

                {/* 4. Requirements */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                      Project Brief &amp; Required Deliverables *
                    </label>
                    {isMessageInvalid && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Required
                      </span>
                    )}
                  </div>
                  <textarea
                    id="maintenance-inquiry-message"
                    required
                    rows={3}
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    placeholder={`Describe the specific ${maintenanceType.name.toLowerCase()} tasks, issues, or updates you require...`}
                    className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:border-[#1430d8] leading-relaxed resize-y min-h-[75px] transition-all ${
                      isMessageInvalid
                        ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                        : 'border-neutral-200 bg-neutral-50'
                    }`}
                  />
                  <p className="mt-1 text-[10px] text-neutral-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Includes senior developer diagnosis, staging verification, and zero-downtime deployment.</span>
                  </p>
                </div>

                {/* 5. Buttons (Side by Side: Send Order via Gmail & Order via WhatsApp) */}
                <div className="pt-1">
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    <button
                      type="submit"
                      id="submit-maint-type-gmail-btn"
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
                      id="submit-maint-type-whatsapp-btn"
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

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleGoToFullOrderPage}
                    className="text-xs text-neutral-600 hover:text-[#1430d8] font-medium underline cursor-pointer"
                  >
                    Or complete in Full Agency Order Form →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OTHER MAINTENANCE CATEGORIES */}
        {/* ========================================================================= */}
        {otherTypes.length > 0 && (
          <div className="mt-12 pt-8 border-t border-neutral-200">
            <h3 className="font-display text-base sm:text-lg font-bold text-[#0e0e0e] mb-3">
              Other Maintenance Services
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {otherTypes.map((ot) => (
                <button
                  key={ot.id}
                  onClick={() => onSelectOtherType(ot)}
                  className="p-3.5 sm:p-4 rounded-xl bg-white border border-neutral-200 hover:border-[#1430d8] hover:shadow-2xs transition-all text-left cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#0e0e0e] group-hover:text-[#1430d8] transition-colors">
                      {ot.name}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                      {ot.tagline}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-[#1430d8]">
                    <span>Explore Details</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      <ProjectDetailModal
        project={previewProject}
        serviceTitle="Website Maintenance"
        categoryTitle={maintenanceType.name}
        onClose={() => setPreviewProject(null)}
        onOpenContact={(_srv, _cat, proj) => {
          setPreviewProject(null);
          if (proj) {
            setClientMessage(
              `I am interested in ${maintenanceType.name} support similar to "${proj.title}". Here are my website details: `
            );
          }
          handleScrollToForm();
        }}
      />
    </div>
  );
};
