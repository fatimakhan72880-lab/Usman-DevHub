import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Cloud,
  Send,
  Check,
  ChevronRight,
  CheckCircle2,
  Share2,
  Clock,
  ShieldCheck,
  Layers,
  Sparkles,
  Cpu,
  Lock,
  MessageCircle,
  FolderCheck,
  AlertCircle,
  Mail
} from 'lucide-react';
import { dispatchOrderToGmail, dispatchOrderToWhatsApp } from '../utils/orderDispatch';
import { Service, Project } from '../types';
import { CloudDeploymentTypeInfo, CLOUD_DEPLOYMENT_TYPES_DATA } from '../data/cloudDeploymentTypes';
import { ShowcaseProjectCard } from './ShowcaseProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { addContactMessage } from '../services/storageService';

interface CloudDeploymentTypeDetailPageProps {
  cloudType: CloudDeploymentTypeInfo;
  service: Service;
  allCloudTypes?: CloudDeploymentTypeInfo[];
  onBackToCloud: () => void;
  onSelectCloudType?: (type: CloudDeploymentTypeInfo) => void;
  serviceProjects?: Project[];
}

export const CloudDeploymentTypeDetailPage: React.FC<CloudDeploymentTypeDetailPageProps> = ({
  cloudType,
  service,
  allCloudTypes = CLOUD_DEPLOYMENT_TYPES_DATA,
  onBackToCloud,
  onSelectCloudType,
  serviceProjects = []
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [activeVideoCardId, setActiveVideoCardId] = useState<string | null>(null);

  const matchedCategoryProjects = serviceProjects.filter((p) => {
    const sub = (p.subcategory || '').toLowerCase();
    const target = cloudType.name.toLowerCase();
    return sub === target || sub.includes(target) || target.includes(sub);
  });

  // Short Form State
  const [selectedCategory, setSelectedCategory] = useState<string>(cloudType.name);
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientMessage, setClientMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setSelectedCategory(cloudType.name);
    setSubmittedSuccess(false);
    setAttemptedSubmit(false);
  }, [cloudType?.id, cloudType?.name]);

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + `#service-${service?.id || 'srv-6'}/type/${cloudType?.id || 'frontend-web-deployment'}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleScrollToForm = () => {
    const formEl = document.getElementById('cloud-inquiry-box') || document.getElementById('service-order-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!clientName.trim()) missing.push('Your Name / Company');
    if (!clientEmail.trim()) {
      missing.push('Work Email');
    } else if (!clientEmail.includes('@') || !clientEmail.includes('.')) {
      missing.push('Valid Work Email (e.g. name@domain.com)');
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
      document.getElementById('cloud-inquiry-name')?.focus();
      return false;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.')) {
      document.getElementById('cloud-inquiry-email')?.focus();
      return false;
    }
    if (!clientMessage.trim()) {
      document.getElementById('cloud-inquiry-message')?.focus();
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
        service: 'Cloud & Infrastructure Deployment',
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
        service: 'Cloud & Infrastructure Deployment',
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

  if (!cloudType) {
    return (
      <div className="min-h-screen bg-[#fbfbfe] text-[#0e0e0e] pt-28 pb-20 flex flex-col items-center justify-center px-4">
        <p className="text-neutral-600 mb-4 text-center">Cloud deployment package details not found.</p>
        <button
          onClick={onBackToCloud}
          className="px-5 py-2.5 rounded-full bg-[#1430d8] text-white text-xs sm:text-sm font-semibold hover:bg-[#1025a8] transition-colors cursor-pointer"
        >
          Back to Cloud & Infrastructure
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfe] text-[#0e0e0e] pt-20 sm:pt-24 pb-20">
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* TOP BAR: Navigation & Breadcrumbs (Strictly Single Row) */}
        {/* ========================================================================= */}
        <div className="pb-5 sm:pb-6 border-b border-neutral-200">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Back Button */}
            <button
              onClick={onBackToCloud}
              className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:text-[#1430d8] hover:border-[#1430d8]/40 shadow-xs font-semibold text-xs sm:text-sm transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-1 shrink-0" />
              <span>
                <span className="hidden sm:inline">Back to </span>
                <span>Cloud Setup</span>
              </span>
            </button>

            {/* Breadcrumb Path & Share - Strictly 1 Single Row, Never Wraps, Full Category Name Always Visible */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 max-w-full justify-end">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center flex-nowrap gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-neutral-500 font-medium whitespace-nowrap overflow-x-auto no-scrollbar py-0.5"
              >
                <button onClick={onBackToCloud} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  Home
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <button onClick={onBackToCloud} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  Services
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <button onClick={onBackToCloud} className="hover:text-[#1430d8] transition-colors cursor-pointer shrink-0">
                  <span>Cloud</span>
                  <span className="hidden md:inline"> Setup</span>
                </button>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                <span className="text-[#1430d8] font-bold shrink-0">
                  {cloudType.name}
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
        {/* HERO SECTION: Clean, Focused Layout */}
        {/* ========================================================================= */}
        <div className="mt-6 sm:mt-8 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1430d8]/10 text-[#1430d8] border border-[#1430d8]/20">
              <Cloud className="w-3.5 h-3.5" />
              DevOps & Cloud Package
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {cloudType.estimatedDelivery}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#1430d8] border border-blue-200">
              Supports Any Tech Stack
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#0e0e0e] tracking-tight leading-[1.1]">
            {cloudType.name}
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
            {cloudType.tagline}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
            <button
              onClick={handleScrollToForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1430d8] text-white font-semibold text-xs sm:text-sm hover:bg-[#1025a8] shadow-md transition-all cursor-pointer"
            >
              <span>Order Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href={`https://wa.me/923412683864?text=${encodeURIComponent(
                `Hello Usman DevHub, I want to order Cloud Setup for: ${cloudType.name}. Please share requirements and process.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white font-semibold text-xs sm:text-sm hover:bg-[#1eb954] shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Order</span>
            </a>
          </div>

          {/* 4 Point-to-Point Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-3">
            <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-2xs">
              <span className="block text-[11px] text-neutral-400 font-medium">Delivery</span>
              <span className="text-xs sm:text-sm font-bold text-[#0e0e0e] flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#1430d8]" />
                {cloudType.estimatedDelivery}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-2xs">
              <span className="block text-[11px] text-neutral-400 font-medium">SSL & HTTPS</span>
              <span className="text-xs sm:text-sm font-bold text-[#0e0e0e] flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Free Lifetime
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-2xs">
              <span className="block text-[11px] text-neutral-400 font-medium">Tech Stack</span>
              <span className="text-xs sm:text-sm font-bold text-[#0e0e0e] flex items-center gap-1 mt-0.5">
                <Cpu className="w-3.5 h-3.5 text-[#1430d8]" />
                Any Language
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-2xs">
              <span className="block text-[11px] text-neutral-400 font-medium">Credentials</span>
              <span className="text-xs sm:text-sm font-bold text-[#0e0e0e] flex items-center gap-1 mt-0.5">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                Secure Vault
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SPECIFICATIONS & DELIVERABLES */}
        {/* ========================================================================= */}
        <div className="mt-12 sm:mt-16 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. What Is It & Best For */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
              <h2 className="font-display text-base sm:text-lg font-bold text-[#0e0e0e] mb-2.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1430d8]" />
                Package Overview
              </h2>
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
                {cloudType.whatIsIt}
              </p>
              <div className="mt-3.5 pt-3.5 border-t border-neutral-100 flex items-start sm:items-center gap-2 text-xs text-neutral-600">
                <span className="font-bold text-neutral-900 shrink-0">Best Suited For:</span>
                <span>{cloudType.bestFor}</span>
              </div>
            </div>

            {/* 2. Deliverables Handover Formats */}
            {cloudType.deliverableFormats && cloudType.deliverableFormats.length > 0 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
                <h3 className="font-display text-base sm:text-lg font-bold text-[#0e0e0e] mb-3 flex items-center gap-2">
                  <FolderCheck className="w-4 h-4 text-[#1430d8]" />
                  What You Receive Upon Handover
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {cloudType.deliverableFormats.map((deliverable, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 text-xs font-semibold text-neutral-900">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1430d8]" />
                      <span>{deliverable}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. What Client Gets (Full Deliverables List) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
            <h3 className="font-display text-base sm:text-lg font-bold text-[#0e0e0e] mb-3.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              What’s Included in This Package
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              {cloudType.whatClientGets.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-neutral-50/80 border border-neutral-100 text-xs text-neutral-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Execution Pipeline (Step-by-Step) */}
          {cloudType.workflowPhases && cloudType.workflowPhases.length > 0 && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
              <h3 className="font-display text-base sm:text-lg font-bold text-[#0e0e0e] mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1430d8]" />
                Step-by-Step Delivery Pipeline
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {cloudType.workflowPhases.map((phase, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="text-xs font-bold text-[#0e0e0e]">
                        {phase.step ? `${phase.step}. ` : ''}{phase.title}
                      </span>
                      <span className="text-[10px] font-semibold text-[#1430d8] bg-[#1430d8]/10 px-2 py-0.5 rounded-full">
                        {phase.timeline}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {phase.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Tools & Universal Stack */}
          {cloudType.toolsUsed && cloudType.toolsUsed.length > 0 && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
              <h3 className="font-display text-xs sm:text-sm font-bold text-[#0e0e0e] mb-2.5 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#1430d8]" />
                Supported Technologies & Platforms
              </h3>
              <div className="flex flex-wrap gap-2">
                {cloudType.toolsUsed.map((tool, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {matchedCategoryProjects.length > 0 && (
          <div id="cloud-type-showcase" className="mt-10 sm:mt-14">
            <div className="mb-5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#1430d8]">
                {cloudType.name} Case Studies
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0e0e0e] tracking-tight mt-1">
                Verified {cloudType.name} Deployments
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {matchedCategoryProjects.map((proj) => (
                <ShowcaseProjectCard
                  key={proj.id}
                  project={proj}
                  serviceTitle="Website Deployment & Cloud Setup"
                  categoryTitle={cloudType.name}
                  activeVideoId={activeVideoCardId}
                  onPlayVideo={(id) => setActiveVideoCardId(id)}
                  onStopVideo={() => setActiveVideoCardId(null)}
                  onOpenModal={(selected) => setPreviewProject(selected)}
                  idPrefix="cloud-type-card"
                />
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DIRECT PROJECT INQUIRY & ORDER FORM (SAME SERVICE FORM STRUCTURE) */}
        {/* ========================================================================= */}
        <div id="service-order-form" className="mt-8 sm:mt-16 scroll-mt-24">
          <div className="p-3.5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 shadow-lg max-w-3xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-3.5 sm:mb-6">
              <span className="text-[9px] sm:text-[11px] font-bold text-[#1430d8] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 sm:py-1 rounded-full border border-blue-100">
                {selectedCategory} Order • {cloudType.estimatedDelivery}
              </span>
              <h2 className="font-display text-lg sm:text-2xl md:text-3xl font-extrabold text-[#0e0e0e] mt-1 sm:mt-1.5">
                Order Your Custom {selectedCategory}
              </h2>
              <p className="text-[11px] sm:text-sm text-neutral-600 mt-0.5 sm:mt-1 max-w-md mx-auto leading-normal sm:leading-relaxed">
                Direct engagement with Lead Engineer Usman Afzal. Production-ready setup &amp; zero-downtime deployment.
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
                      <label htmlFor="cloud-inquiry-name" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
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
                      id="cloud-inquiry-name"
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
                      <label htmlFor="cloud-inquiry-email" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
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
                      id="cloud-inquiry-email"
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
                      <Cloud className="w-3.5 h-3.5 text-[#1430d8]" />
                      <span>Selected Category / Focus</span>
                    </label>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Pre-Selected
                    </span>
                  </div>
                  <div className="w-full px-3.5 py-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm font-bold text-[#1430d8] flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-[#1430d8]" />
                      <span className="truncate">{cloudType.name}</span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-[#1430d8] font-semibold bg-white/90 px-2.5 py-0.5 rounded-md border border-blue-100 shrink-0">
                      {cloudType.estimatedDelivery}
                    </span>
                  </div>
                </div>

                {/* 3. Project Brief & Required Deliverables */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="cloud-inquiry-message" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                      Project Brief &amp; Required Deliverables *
                    </label>
                    {isMessageInvalid && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Required
                      </span>
                    )}
                  </div>
                  <textarea
                    id="cloud-inquiry-message"
                    required
                    rows={3}
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    placeholder={`Describe your application requirements for ${selectedCategory} (Node, Python, React, Go, Docker, repository or cloud provider)...`}
                    className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] focus:outline-none transition-all resize-y min-h-[75px] max-h-[350px] ${
                      isMessageInvalid
                        ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                        : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                    }`}
                  />
                  <p className="mt-1 text-[10px] text-neutral-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Includes free SSL, Docker orchestration, automated CI/CD pipeline, and 24/7 uptime monitoring.</span>
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

        {/* ========================================================================= */}
        {/* BOTTOM RETURN BAR */}
        {/* ========================================================================= */}
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onBackToCloud}
            className="group inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-neutral-600 hover:text-[#1430d8] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Cloud &amp; Infrastructure Overview</span>
          </button>
        </div>

      </div>

      <ProjectDetailModal
        project={previewProject}
        serviceTitle="Website Deployment & Cloud Setup"
        categoryTitle={cloudType.name}
        onClose={() => setPreviewProject(null)}
        onOpenContact={(_srv, _cat, proj) => {
          setPreviewProject(null);
          if (proj) {
            setClientMessage(
              `I would like a ${cloudType.name} setup similar to "${proj.title}". Here are my requirements: `
            );
          }
          handleScrollToForm();
        }}
      />
    </div>
  );
};
