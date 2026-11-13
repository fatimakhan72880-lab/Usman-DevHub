import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Send,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Share2,
  MessageCircle,
  Check,
  AlertCircle,
  Zap,
  Wrench,
  Layers,
  SlidersHorizontal,
  Mail,
  RefreshCw,
  Rocket
} from 'lucide-react';
import { dispatchOrderToGmail, dispatchOrderToWhatsApp } from '../utils/orderDispatch';
import { Service, Project } from '../types';
import { WEBSITE_MAINTENANCE_TYPES_DATA, WebsiteMaintenanceTypeInfo } from '../data/websiteMaintenanceTypes';
import { WebsiteMaintenanceTypeDetailPage } from './WebsiteMaintenanceTypeDetailPage';
import { ShowcaseProjectCard } from './ShowcaseProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { addContactMessage } from '../services/storageService';
import { scrollToSectionWithOffset } from '../utils/scroll';

interface WebsiteMaintenanceDetailViewProps {
  service: Service;
  allServices: Service[];
  onBack: () => void;
  onSelectOtherService: (service: Service) => void;
  serviceProjects?: Project[];
  onOpenContact?: (servicePreset?: string, categoryPreset?: string) => void;
}

export const WebsiteMaintenanceDetailView: React.FC<WebsiteMaintenanceDetailViewProps> = ({
  service,
  allServices,
  onBack,
  onSelectOtherService,
  serviceProjects = [],
  onOpenContact,
}) => {
  const [activeDetailMaintenanceType, setActiveDetailMaintenanceType] = useState<WebsiteMaintenanceTypeInfo | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [selectedFormat, setSelectedFormat] = useState<string>(WEBSITE_MAINTENANCE_TYPES_DATA[0].name);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [activeVideoCardId, setActiveVideoCardId] = useState<string | null>(null);
  const [portfolioFilter, setPortfolioFilter] = useState<string>('All');
  const [showcaseVisibleCount, setShowcaseVisibleCount] = useState<number>(5);

  const availableMaintenanceCategories = useMemo(() => {
    return ['All', ...WEBSITE_MAINTENANCE_TYPES_DATA.map((t) => t.name)];
  }, []);

  const filteredMaintenanceProjects = useMemo(() => {
    if (portfolioFilter === 'All') return serviceProjects;
    return serviceProjects.filter(
      (p) => (p.subcategory || '').toLowerCase().trim() === portfolioFilter.toLowerCase().trim()
    );
  }, [serviceProjects, portfolioFilter]);

  useEffect(() => {
    setShowcaseVisibleCount(5);
    setActiveVideoCardId(null);
  }, [portfolioFilter]);

  const displayedMaintenanceProjects = useMemo(
    () => filteredMaintenanceProjects.slice(0, showcaseVisibleCount),
    [filteredMaintenanceProjects, showcaseVisibleCount]
  );

  // Form State
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [clientMessage, setClientMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const websiteMaintenanceFaqs = [
    {
      q: 'What types of websites do you maintain, and what is covered?',
      a: 'We maintain all website platforms—including WordPress, WooCommerce, Shopify, and Custom Code. Maintenance covers core CMS updates, plugin & theme patches, 24/7 uptime monitoring, automated cloud backups, database optimization, speed tuning, and bug fixes.'
    },
    {
      q: 'How frequently are backups performed and where are they stored?',
      a: 'We run automated daily and weekly backups of your entire codebase and database, stored across encrypted, geographically isolated off-site cloud storage with 1-click restore capability.'
    },
    {
      q: 'How quickly do you respond if my website goes down or encounters an error?',
      a: 'Our 24/7 automated monitoring pings your site every 60 seconds. In the event of an anomaly or outage, our engineering team is alerted immediately with priority resolution protocols.'
    },
    {
      q: 'Can maintenance hours be used for new feature additions or content edits?',
      a: 'Yes! Routine maintenance plans include reserved engineering time each month for banner updates, copy changes, new product/service additions, and layout adjustments.'
    },
    {
      q: 'Do you provide monthly performance and security health reports?',
      a: 'Yes, you receive a transparent monthly report summarizing uptime percentage, security scan results, traffic metrics, Core Web Vitals speed scores, and completed updates.'
    },
    {
      q: 'How do payment milestones work for custom revamps or maintenance sprints?',
      a: 'Project sprints follow our transparent 3-stage payment schedule: 25% at start, 35% mid-sprint upon staging verification, and 40% upon live completion (supported via Remitly, Wise, Payoneer, Bank Wire, SadaPay, JazzCash, EasyPaisa, and USDT).'
    }
  ];

  // Scroll restoration tracking
  const maintenanceScrollPosRef = useRef<number>(0);
  const isNavigatingToTypeRef = useRef<boolean>(false);
  const isRestoringTypeScrollRef = useRef<boolean>(false);

  // Continuously track scroll position on Maintenance overview page
  useEffect(() => {
    if (!activeDetailMaintenanceType) {
      const handleScroll = () => {
        if (!isNavigatingToTypeRef.current && !isRestoringTypeScrollRef.current) {
          maintenanceScrollPosRef.current = window.scrollY;
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [activeDetailMaintenanceType]);

  // Synchronously restore scroll position before browser paint when returning from type detail
  useLayoutEffect(() => {
    if (!activeDetailMaintenanceType && isRestoringTypeScrollRef.current) {
      const prevY = maintenanceScrollPosRef.current;
      if (prevY > 0) {
        window.scrollTo({ top: prevY, left: 0, behavior: 'instant' as ScrollBehavior });
        let count = 0;
        let rafId: number;
        const enforce = () => {
          count++;
          if (Math.abs(window.scrollY - prevY) > 2 && count < 12) {
            window.scrollTo({ top: prevY, left: 0, behavior: 'instant' as ScrollBehavior });
            rafId = requestAnimationFrame(enforce);
          } else {
            isRestoringTypeScrollRef.current = false;
          }
        };
        rafId = requestAnimationFrame(enforce);
        return () => {
          cancelAnimationFrame(rafId);
          isRestoringTypeScrollRef.current = false;
        };
      } else {
        isRestoringTypeScrollRef.current = false;
      }
    }
  }, [activeDetailMaintenanceType]);

  // Sync hash routing: #service-srv-7/type/<slug>
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash.includes('/type/')) {
        const rawTypeId = hash.split('/type/')[1]?.toLowerCase() || '';
        const typeId = rawTypeId.replace(/\/.*$/, '').replace(/\?.*$/, '').replace(/#.*$/, '');
        const found = WEBSITE_MAINTENANCE_TYPES_DATA.find(
          (t) =>
            t.id === typeId ||
            t.name.toLowerCase().replace(/\s+/g, '-') === typeId ||
            (typeId.includes('speed') && t.id === 'performance-optimization') ||
            (typeId.includes('bug') && t.id === 'bug-fixing') ||
            (typeId.includes('update') && t.id === 'updates')
        );
        if (found) {
          setActiveDetailMaintenanceType((current) => {
            if (current && current.id === found.id) {
              return current;
            }
            if (!current) {
              if (window.scrollY > 0) {
                maintenanceScrollPosRef.current = window.scrollY;
              }
              isNavigatingToTypeRef.current = true;
            }
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
            setTimeout(() => {
              isNavigatingToTypeRef.current = false;
            }, 100);
            return found;
          });
        }
      } else if (!hash.includes('/type/')) {
        setActiveDetailMaintenanceType((current) => {
          if (current) {
            isRestoringTypeScrollRef.current = true;
          }
          return null;
        });
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, []);

  const handleOpenTypeDetailPage = (type: WebsiteMaintenanceTypeInfo) => {
    if (activeDetailMaintenanceType?.id === type.id) return;
    maintenanceScrollPosRef.current = window.scrollY;
    isNavigatingToTypeRef.current = true;
    setActiveDetailMaintenanceType(type);
    window.location.hash = `service-${service.id}/type/${type.id}`;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleBackToMaintenanceOverview = () => {
    isRestoringTypeScrollRef.current = true;
    setActiveDetailMaintenanceType(null);
    window.location.hash = `service-${service.id}`;
  };

  const handleCopyServiceLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!clientName.trim()) missing.push('Full Name / Company');
    if (!clientEmail.trim()) {
      missing.push('Work Email');
    } else if (!clientEmail.includes('@') || !clientEmail.includes('.')) {
      missing.push('Valid Email (e.g. name@domain.com)');
    }
    if (!clientMessage.trim()) missing.push('Project Brief & Requirements');
    return missing;
  };

  const isNameInvalid = attemptedSubmit && !clientName.trim();
  const isEmailInvalid = attemptedSubmit && (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.'));
  const isMessageInvalid = attemptedSubmit && !clientMessage.trim();

  const validateForm = (): boolean => {
    setAttemptedSubmit(true);
    if (!clientName.trim()) {
      document.getElementById('maint-detail-name')?.focus();
      return false;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.')) {
      document.getElementById('maint-detail-email')?.focus();
      return false;
    }
    if (!clientMessage.trim()) {
      document.getElementById('maint-detail-message')?.focus();
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
        category: selectedFormat,
        budget: 'Custom Maintenance Scope',
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

  const handleWhatsAppOrder = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    try {
      const fullMsg = websiteUrl.trim()
        ? `Website URL: ${websiteUrl.trim()}\n\nRequirements:\n${clientMessage.trim()}`
        : clientMessage.trim();

      const links = await dispatchOrderToWhatsApp({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        service: 'Website Maintenance & Retainers',
        category: selectedFormat,
        budget: 'Custom Maintenance Scope',
        message: fullMsg
      });
      setLastOrderLinks(links);
      setSubmittedSuccess(true);
      setAttemptedSubmit(false);
    } catch (err) {
      console.error('Failed to dispatch WhatsApp order', err);
    }
  };

  const handleQuickInquireForCategory = (type: WebsiteMaintenanceTypeInfo) => {
    setSelectedFormat(type.name);
    scrollToSectionWithOffset('#service-inquiry-section');
  };

  // Previous & Next service calculation
  const sortedServices = [...allServices].sort((a, b) => (a.order || 0) - (b.order || 0));
  const currentIdx = sortedServices.findIndex((s) => s.id === service.id);
  const prevService = currentIdx > 0 ? sortedServices[currentIdx - 1] : null;
  const nextService = currentIdx < sortedServices.length - 1 ? sortedServices[currentIdx + 1] : null;

  // Render Category Sub-Detail Page if active
  if (activeDetailMaintenanceType) {
    return (
      <WebsiteMaintenanceTypeDetailPage
        maintenanceType={activeDetailMaintenanceType}
        onBackToMaintenance={handleBackToMaintenanceOverview}
        onSelectOtherType={(t) => {
          setActiveDetailMaintenanceType(t);
          window.location.hash = `service-${service.id}/type/${t.id}`;
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        }}
        serviceProjects={serviceProjects}
        onOpenContact={onOpenContact}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfe] text-[#0e0e0e] pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* TOP BREADCRUMB / ACTIONS BAR */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-neutral-200">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:text-[#1430d8] hover:border-[#1430d8]/40 shadow-2xs font-semibold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to All Services</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
            <button onClick={onBack} className="hover:text-[#1430d8] transition-colors cursor-pointer">
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            <button onClick={onBack} className="hover:text-[#1430d8] transition-colors cursor-pointer">
              Services
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-[#1430d8] font-semibold">
              Website Maintenance
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyServiceLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 text-xs font-medium transition-colors cursor-pointer"
              title="Copy Page Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
            {prevService && (
              <button
                onClick={() => onSelectOtherService(prevService)}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-neutral-600 hover:text-[#1430d8] text-xs font-medium transition-colors cursor-pointer"
              >
                <span>Prev: {prevService.title}</span>
              </button>
            )}
            {nextService && (
              <button
                onClick={() => onSelectOtherService(nextService)}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-neutral-600 hover:text-[#1430d8] text-xs font-medium transition-colors cursor-pointer"
              >
                <span>Next: {nextService.title}</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. HERO SECTION (Clean, Minimal & High Impact) */}
        {/* ========================================================================= */}
        <div className="mt-8 sm:mt-12 max-w-3xl">
          <div className="inline-flex items-center flex-nowrap gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-4 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-[#0075f7] shrink-0" />
            <span>Support &amp; Ongoing Care</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#0e0e0e] tracking-tight leading-tight">
            Website Maintenance
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed">
            Professional maintenance to keep your website fast, bug-free, and updated. Choose bug fixing, content updates, or speed optimization on demand.
          </p>

          {/* Short & Clean Supported Platforms Note */}
          <div className="mt-4 inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200 text-xs text-neutral-700">
            <span className="font-semibold text-emerald-800">Available For:</span>
            <span className="font-medium text-emerald-950">Custom Code</span>
            <span className="text-emerald-300">•</span>
            <span className="font-medium text-emerald-950">Shopify</span>
            <span className="text-emerald-300">•</span>
            <span className="font-medium text-emerald-950">WordPress &amp; WooCommerce</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={() => scrollToSectionWithOffset('#service-inquiry-section')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1430d8] hover:bg-[#0075f7] text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <span>Request Maintenance</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. WHAT'S INCLUDED (Scope Overview) */}
        {/* ========================================================================= */}
        <div id="whats-included-section" className="mt-10 sm:mt-14">
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
            <div className="max-w-2xl mb-4 sm:mb-5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-[#1430d8] uppercase tracking-wider mb-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#0075f7]" />
                <span>Scope Overview</span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#0e0e0e] tracking-tight">
                What We Cover
              </h2>
              <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
                Clear and straightforward support for your web applications:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
              {[
                {
                  id: 'bug-fixing',
                  title: 'Bug Fixing',
                  desc: 'Mobile layout alignment fixes, repairing broken contact forms, fixing button clicks, and troubleshooting console script errors.',
                  icon: Wrench,
                  tag: 'Quick Resolution'
                },
                {
                  id: 'updates',
                  title: 'Updates',
                  desc: 'Text revisions, replacing images, adding new promotional banners, uploading new products, and updating contact details.',
                  icon: RefreshCw,
                  tag: 'Content & Media'
                },
                {
                  id: 'performance-optimization',
                  title: 'Performance Optimization',
                  desc: 'Compressing heavy images to WebP, minifying unused code, caching setup, and improving Google PageSpeed scores.',
                  icon: Rocket,
                  tag: 'Speed & Tuning'
                }
              ].map((item, idx) => {
                const matchedType = WEBSITE_MAINTENANCE_TYPES_DATA.find((t) => t.id === item.id);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (matchedType) handleOpenTypeDetailPage(matchedType);
                    }}
                    className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-left border border-neutral-200/90 bg-white hover:border-[#1430d8]/50 hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-md sm:rounded-lg bg-blue-50 text-[#1430d8] font-bold text-[10px] sm:text-[11px] flex items-center justify-center border border-blue-100">
                          0{idx + 1}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                          {matchedType?.estimatedDelivery || 'Decided Upon Discussion'}
                        </span>
                      </div>
                      <h3 className="font-display text-xs sm:text-[13px] font-bold text-[#0e0e0e] group-hover:text-[#1430d8] transition-colors leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-semibold text-[#1430d8]">
                      <span>Explore Details</span>
                      <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-[#1430d8] group-hover:text-white transition-colors">
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. SIMPLE 3-STEP PROCESS */}
        {/* ========================================================================= */}
        <div id="process-section" className="mt-10 sm:mt-14">
          <div className="max-w-2xl mb-4 sm:mb-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1430d8]">How It Works</span>
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#0e0e0e] tracking-tight mt-0.5">
              Simple 3-Step Process
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                step: '01',
                title: 'Share Requirements',
                desc: 'Send us the fixes, text updates, or speed tasks your website needs.'
              },
              {
                step: '02',
                title: 'Quick Execution',
                desc: 'We implement changes, test on phone & desktop, and share a preview.'
              },
              {
                step: '03',
                title: 'Live & Smooth',
                desc: 'Changes go live safely with zero website downtime.'
              }
            ].map((st, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-xl bg-white border border-neutral-200/90 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <span className="font-display text-lg font-black text-[#1430d8] mb-1 block">
                    {st.step}
                  </span>
                  <h3 className="font-display text-xs sm:text-sm font-bold text-[#0e0e0e] mb-0.5">
                    {st.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-500 leading-snug">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {serviceProjects && serviceProjects.length > 0 && (
          <div id="maintenance-showcase-section" className="mt-12 sm:mt-16 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-200">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Website Maintenance • Showcase</span>
                </div>
                <h2 className="font-display text-xl sm:text-3xl font-extrabold text-[#0e0e0e] tracking-tight">
                  Website Maintenance Showcase
                </h2>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-bold text-[#1430d8] shadow-2xs self-start sm:self-auto">
                {filteredMaintenanceProjects.length} of {serviceProjects.length} Projects
              </span>
            </div>

            <div className="mt-6 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/90 shadow-2xs">
              <div className="flex items-center justify-between gap-2.5 mb-2.5 px-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1430d8] shrink-0">
                    <SlidersHorizontal className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-neutral-900 uppercase tracking-wider whitespace-nowrap">
                    Filter by Category
                  </span>
                  <span className="text-neutral-300 text-xs">·</span>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#1430d8] whitespace-nowrap">
                    {filteredMaintenanceProjects.length} {filteredMaintenanceProjects.length === 1 ? 'project' : 'projects'}
                  </span>
                </div>

                {portfolioFilter !== 'All' && (
                  <button
                    onClick={() => setPortfolioFilter('All')}
                    className="text-[11px] sm:text-xs font-semibold text-[#1430d8] hover:text-[#0075f7] bg-blue-50/80 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Show All ({serviceProjects.length})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5 w-full touch-pan-x">
                {availableMaintenanceCategories.map((cat, idx) => {
                  const count =
                    cat === 'All'
                      ? serviceProjects.length
                      : serviceProjects.filter(
                          (p) => (p.subcategory || '').toLowerCase().trim() === cat.toLowerCase().trim()
                        ).length;
                  const isActive = portfolioFilter === cat;

                  return (
                    <button
                      key={idx}
                      onClick={() => setPortfolioFilter(cat)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-[#1430d8] text-white shadow-xs font-bold'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950 border border-neutral-200/80 hover:border-neutral-300'
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white text-neutral-500 border border-neutral-200/70'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredMaintenanceProjects.length > 0 ? (
              <>
                <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {displayedMaintenanceProjects.map((proj) => (
                    <ShowcaseProjectCard
                      key={proj.id}
                      project={proj}
                      serviceTitle="Website Maintenance"
                      activeVideoId={activeVideoCardId}
                      onPlayVideo={(id) => setActiveVideoCardId(id)}
                      onStopVideo={() => setActiveVideoCardId(null)}
                      onOpenModal={(selected) => setPreviewProject(selected)}
                      idPrefix="maintenance-showcase-card"
                    />
                  ))}
                </div>

                {filteredMaintenanceProjects.length > 5 && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    {showcaseVisibleCount < filteredMaintenanceProjects.length && (
                      <button
                        onClick={() => setShowcaseVisibleCount((prev) => Math.min(prev + 5, filteredMaintenanceProjects.length))}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-semibold shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <span>Show More</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}

                    {showcaseVisibleCount > 5 && (
                      <button
                        onClick={() => setShowcaseVisibleCount((prev) => Math.max(prev - 5, 5))}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 border border-neutral-200 text-xs font-semibold shadow-2xs hover:border-neutral-300 transition-all cursor-pointer"
                      >
                        <ChevronUp className="w-4 h-4 text-neutral-500" />
                        <span>Show Less</span>
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-8 p-10 text-center rounded-3xl bg-white border border-neutral-200">
                <Layers className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <h4 className="font-display text-base font-bold text-neutral-700">
                  No projects found for category &quot;{portfolioFilter}&quot;
                </h4>
                <button
                  onClick={() => setPortfolioFilter('All')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#1430d8] text-white text-xs font-semibold cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. SERVICE INQUIRY FORM (Matches Order Form Categories 100%) */}
        {/* ========================================================================= */}
        <div id="service-inquiry-section" className="mt-14 sm:mt-20 scroll-mt-24">
          <div className="p-4 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 shadow-md max-w-2xl mx-auto">
            <div className="text-center max-w-lg mx-auto mb-4 sm:mb-6">
              <span className="text-[10px] font-bold text-[#1430d8] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Quick Order & Inquiry
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0e0e0e] mt-1.5">
                Request Website Maintenance
              </h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                Select your category and share your website details to get started.
              </p>
            </div>

            {submittedSuccess ? (
              <div className="py-6 text-center flex flex-col items-center bg-emerald-50 rounded-2xl border border-emerald-200 p-4 sm:p-6">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-display text-base font-bold text-[#0e0e0e]">
                  Inquiry Received!
                </h3>
                <p className="text-xs text-neutral-600 mt-1 max-w-md">
                  Thank you! We received your request for <strong>{selectedFormat}</strong> and will reach out to {clientEmail} promptly.
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
                  className="mt-3.5 px-4 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleGmailOrder} noValidate className="space-y-3.5">
                {/* 1. Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="maint-detail-name" className="block text-[11px] font-semibold text-neutral-700">
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
                      id="maint-detail-name"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Ali Khan / Tech Solutions"
                      className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none transition-all ${
                        isNameInvalid
                          ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                          : 'border-neutral-200 bg-neutral-50 focus:border-[#1430d8]'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="maint-detail-email" className="block text-[11px] font-semibold text-neutral-700">
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
                      id="maint-detail-email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="e.g. contact@business.com"
                      className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none transition-all ${
                        isEmailInvalid
                          ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                          : 'border-neutral-200 bg-neutral-50 focus:border-[#1430d8]'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. Maintenance Category Selection (Buttons Grid - 2 per row) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-neutral-800 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-[#1430d8]" />
                      <span>Select Maintenance Category *</span>
                    </label>
                    <span className="text-[9px] font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {selectedFormat}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {WEBSITE_MAINTENANCE_TYPES_DATA.map((t, idx) => {
                      const isSelected = selectedFormat === t.name;
                      const isFullWidth = t.name.toLowerCase().includes('performance') || idx === 2;
                      return (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setSelectedFormat(t.name)}
                          className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                            isFullWidth ? 'col-span-2 w-full' : 'col-span-1'
                          } ${
                            isSelected
                              ? 'bg-[#1430d8] text-white border-[#1430d8] shadow-xs ring-2 ring-[#1430d8]/20'
                              : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                          }`}
                        >
                          <span className="font-semibold text-xs truncate w-full">
                            {t.name}
                          </span>
                          <span className={`text-[10px] mt-0.5 truncate w-full ${isSelected ? 'text-blue-100' : 'text-neutral-500'}`}>
                            {t.categoryPill || 'Support'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Website URL */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Website URL (Optional / Recommended)
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-xs sm:text-sm focus:outline-none focus:border-[#1430d8]"
                  />
                </div>

                {/* 4. Requirements */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="maint-detail-message" className="block text-[11px] font-semibold text-neutral-700">
                      Project Brief &amp; Requirements *
                    </label>
                    {isMessageInvalid && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Required
                      </span>
                    )}
                  </div>
                  <textarea
                    id="maint-detail-message"
                    required
                    rows={3}
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    placeholder="Describe what needs fixing, updating, or optimizing on your website..."
                    className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:border-[#1430d8] leading-relaxed resize-y min-h-[75px] transition-all ${
                      isMessageInvalid
                        ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                        : 'border-neutral-200 bg-neutral-50'
                    }`}
                  />
                  <p className="mt-1 text-[10px] text-neutral-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Includes senior developer review, staging test, and zero-downtime deployment.</span>
                  </p>
                </div>

                <div className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200/80 flex flex-wrap items-center justify-between gap-2 text-[10.5px] sm:text-[11px] text-neutral-600 tabular-nums">
                  <span className="font-semibold text-neutral-700">Payment Schedule:</span>
                  <span>
                    <strong className="text-[#1430d8]">25%</strong> Project Start · <strong className="text-[#1430d8]">35%</strong> Mid-Project · <strong className="text-[#1430d8]">40%</strong> Final Handover
                  </span>
                </div>

                {/* 5. Buttons (Side by Side: Send Order via Gmail & Order via WhatsApp) */}
                <div className="pt-1">
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    <button
                      type="submit"
                      id="submit-maint-page-gmail-btn"
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
                      id="submit-maint-page-whatsapp-btn"
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

        {/* ========================================================================= */}
        {/* FAQ & DETAILS SECTION */}
        {/* ========================================================================= */}
        <div id="maintenance-faq-section" className="mt-16 sm:mt-24">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-3">
              <HelpCircle className="w-3.5 h-3.5 text-[#0075f7]" />
              <span>FAQ &amp; Details</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0e0e0e] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Clear answers regarding maintenance coverage, security safeguards, and response guarantees:
            </p>
          </div>

          <div className="space-y-3 max-w-4xl">
            {websiteMaintenanceFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-neutral-200/90 bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-neutral-50/70 transition-colors cursor-pointer"
                  >
                    <span className="font-display text-sm sm:text-base font-bold text-[#0e0e0e]">
                      {faq.q}
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-[#1430d8] shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100/80 whitespace-pre-line">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PREV / NEXT SERVICE NAVIGATION */}
        {/* ========================================================================= */}
        <div className="mt-16 sm:mt-24 pt-8 sm:pt-10 border-t border-neutral-200/80">
          <div className="flex items-stretch justify-between gap-4 sm:gap-12 md:gap-24 lg:gap-36 w-full max-w-7xl xl:max-w-[1400px] mx-auto px-2 sm:px-4">
            {/* Previous Service Button */}
            {prevService ? (
              <button
                onClick={() => onSelectOtherService(prevService)}
                className="group flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-white border border-neutral-200 hover:border-[#1430d8] hover:shadow-xs transition-all text-left cursor-pointer flex-1 sm:flex-initial sm:w-[220px] md:w-[250px] lg:w-[270px] min-w-0"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-neutral-100 group-hover:bg-[#1430d8] group-hover:text-white text-neutral-600 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-0.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-neutral-400 tracking-wider leading-none">
                    Previous Service
                  </div>
                  <div className="text-[11px] sm:text-xs md:text-[13px] font-bold text-[#0e0e0e] group-hover:text-[#1430d8] leading-tight sm:leading-snug mt-1 transition-colors truncate" title={prevService.title}>
                    {prevService.order ? String(prevService.order).padStart(2, '0') + '. ' : ''}{prevService.title.replace(/^\d+[\.\s\-]+/, '')}
                  </div>
                </div>
              </button>
            ) : <div className="hidden sm:block" />}

            {/* Next Service Button */}
            {nextService ? (
              <button
                onClick={() => onSelectOtherService(nextService)}
                className="group flex items-center justify-end gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-white border border-neutral-200 hover:border-[#1430d8] hover:shadow-xs transition-all text-right cursor-pointer flex-1 sm:flex-initial sm:w-[220px] md:w-[250px] lg:w-[270px] min-w-0 ml-auto"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-neutral-400 tracking-wider leading-none">
                    Next Service
                  </div>
                  <div className="text-[11px] sm:text-xs md:text-[13px] font-bold text-[#0e0e0e] group-hover:text-[#1430d8] leading-tight sm:leading-snug mt-1 transition-colors truncate" title={nextService.title}>
                    {nextService.order ? String(nextService.order).padStart(2, '0') + '. ' : ''}{nextService.title.replace(/^\d+[\.\s\-]+/, '')}
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-neutral-100 group-hover:bg-[#1430d8] group-hover:text-white text-neutral-600 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            ) : <div className="hidden sm:block" />}
          </div>
        </div>
      </div>

      <ProjectDetailModal
        project={previewProject}
        serviceTitle="Website Maintenance"
        onClose={() => setPreviewProject(null)}
        onOpenContact={(_srv, cat, proj) => {
          setPreviewProject(null);
          if (cat) setSelectedFormat(cat);
          if (proj) {
            setClientMessage(
              `I am interested in website maintenance similar to "${proj.title}" (${cat || proj.subcategory || selectedFormat}). Here are my website details: `
            );
          }
          scrollToSectionWithOffset('#service-inquiry-section');
        }}
      />
    </div>
  );
};
