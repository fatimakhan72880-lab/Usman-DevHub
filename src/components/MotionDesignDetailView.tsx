import React, { useState, useMemo, useLayoutEffect, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Film,
  Send,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Clock,
  Share2,
  Video,
  Layers,
  ShieldCheck,
  Volume2,
  Tv,
  Smartphone,
  Cpu,
  PenTool,
  Eye,
  Compass,
  SlidersHorizontal,
  HelpCircle,
  MessageCircle,
  AlertCircle,
  Mail
} from 'lucide-react';
import { dispatchOrderToGmail, dispatchOrderToWhatsApp } from '../utils/orderDispatch';
import { Service, Project } from '../types';
import { addContactMessage } from '../services/storageService';
import { MOTION_DESIGN_TYPES_DATA, MotionDesignTypeInfo } from '../data/motionDesignTypes';
import { MotionDesignTypeDetailPage } from './MotionDesignTypeDetailPage';
import { scrollToSectionWithOffset, snapScrollToElement } from '../utils/scroll';
import { ShowcaseProjectCard } from './ShowcaseProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';

interface MotionDesignDetailViewProps {
  service: Service;
  allServices: Service[];
  onBack: () => void;
  onSelectOtherService: (service: Service) => void;
  serviceProjects: Project[];
}

export const MotionDesignDetailView: React.FC<MotionDesignDetailViewProps> = ({
  service,
  allServices,
  onBack,
  onSelectOtherService,
  serviceProjects
}) => {
  const [activeDetailMotionType, setActiveDetailMotionType] = useState<MotionDesignTypeInfo | null>(null);
  const [portfolioFilter, setPortfolioFilter] = useState<string>('All');
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [activeVideoCardId, setActiveVideoCardId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Form State
  const [selectedFormat, setSelectedFormat] = useState<string>(MOTION_DESIGN_TYPES_DATA[0].name);
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientMessage, setClientMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Navigation between services
  const currentIndex = allServices.findIndex((s) => s.id === service.id);
  const prevService = currentIndex > 0 ? allServices[currentIndex - 1] : allServices[allServices.length - 1];
  const nextService = currentIndex >= 0 && currentIndex < allServices.length - 1 ? allServices[currentIndex + 1] : allServices[0];

  // Category-specific dynamic title and meta
  const getCategoryFormMeta = (formatName: string) => {
    if (formatName === 'Logo Animation') {
      return {
        badge: '3D Logo Animation',
        title: 'Order Your 3D Logo Animation',
        description: 'Provide your logo requirements. Founder Usman Afzal will review your vector artwork and reply within 4 hours.',
        whatsappText: `Hello Usman DevHub, I want to order 3D Logo Animation.`,
        placeholder: 'Describe your brand vibe, desired logo motion (e.g. metallic, neon, particles), or reference links...'
      };
    } else if (formatName === 'Product Animation') {
      return {
        badge: '3D Product Animation',
        title: 'Order Your 3D Product Video Animation',
        description: 'Detail your product video requirements. Usman Afzal will review specifications and reply within 4 hours.',
        whatsappText: `Hello Usman DevHub, I want to order 3D Product Video Animation.`,
        placeholder: 'Detail your product features to emphasize (materials, exploded view, 360 spin), and reference links...'
      };
    } else if (formatName === 'Brand Animation') {
      return {
        badge: '3D Brand Animation',
        title: 'Order Your 3D Brand Animation',
        description: 'Commission a bespoke 3D brand film. Usman Afzal will review your creative direction within 4 hours.',
        whatsappText: `Hello Usman DevHub, I want to order 3D Brand Animation.`,
        placeholder: 'Share your brand story, core values, visual mood, or reference videos...'
      };
    } else {
      return {
        badge: '3D Commercial Ads',
        title: 'Order Your 3D Commercial / Promo Video',
        description: 'High-conversion 3D video ads for social campaigns and launches.',
        whatsappText: `Hello Usman DevHub, I want to order a 3D Commercial / Promo Video.`,
        placeholder: 'Describe your campaign goal, target audience, preferred video length (e.g. 15s, 30s), or references...'
      };
    }
  };

  const motionFaqs = [
    {
      q: 'What video lengths do you produce?',
      a: 'We produce short, high-impact 3D animation videos tailored to your exact requirements—whether you need a quick 5–10 second logo reveal or a 15–30 second product reel. You tell us the duration you need, and we build it to spec.'
    },
    {
      q: 'What formats and resolutions are delivered?',
      a: 'All animations are rendered in 4K Ultra HD at 60 FPS. You receive broadcast-ready ProRes 422, web-optimized MP4, and formatted cuts for both landscape (16:9) and vertical (9:16) social channels.'
    },
    {
      q: 'Can 3D videos have a transparent background for websites?',
      a: 'Yes, absolutely! We export transparent WebM (VP9 codec) and ProRes 4444 files with alpha channels so your 3D animation floats seamlessly directly over your website sections without background boxes.'
    },
    {
      q: 'What assets do I need to supply to begin?',
      a: '• Logo Animation: Vector logo file (.AI, .SVG, or .EPS).\n• Product Animation: Product CAD/STEP files or reference photos with dimensions.\n• Promo/Brand Video: Key talking points, brand guidelines, and target aspect ratio (16:9 or 9:16).'
    },
    {
      q: 'How are the project timeline and payment milestones structured?',
      a: 'Delivery timeline is agreed upon during consultation based on your scope, backed by a clear 3-stage payment schedule: 25% at project start (storyboard & 3D setup), 35% mid-project (motion & lighting preview), and 40% upon final 4K render delivery (via Remitly, Wise, Payoneer, Bank Wire, SadaPay, JazzCash, or USDT).'
    }
  ];

  const motionScrollPosRef = useRef<number>(0);
  const isNavigatingToTypeRef = useRef<boolean>(false);
  const isRestoringTypeScrollRef = useRef<boolean>(false);

  // Track scroll position on Motion Design overview
  useEffect(() => {
    if (!activeDetailMotionType) {
      const handleScroll = () => {
        if (!isNavigatingToTypeRef.current && !isRestoringTypeScrollRef.current) {
          motionScrollPosRef.current = window.scrollY;
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [activeDetailMotionType]);

  // Synchronously restore scroll position before browser paint when returning from detail page
  useLayoutEffect(() => {
    if (!activeDetailMotionType && isRestoringTypeScrollRef.current) {
      const prevY = motionScrollPosRef.current;
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
  }, [activeDetailMotionType]);

  // Safe parsing helper for technologies array or string
  const parseTechList = (tech: any): string[] => {
    if (Array.isArray(tech)) return tech;
    if (typeof tech === 'string') return tech.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  // Hash-based routing for direct link and back/forward browser navigation
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash.includes('/type/')) {
        const rawTypeId = hash.split('/type/')[1]?.toLowerCase() || '';
        const typeId = rawTypeId.replace(/\/.*$/, '').replace(/\?.*$/, '').replace(/#.*$/, '');
        const found = MOTION_DESIGN_TYPES_DATA.find(
          (t) =>
            t.id === typeId ||
            t.name.toLowerCase().replace(/\s+/g, '-') === typeId ||
            t.id.includes(typeId) ||
            typeId.includes(t.id) ||
            t.name.toLowerCase().includes(typeId.replace(/-/g, ' '))
        ) || MOTION_DESIGN_TYPES_DATA[0];

        if (found) {
          setActiveDetailMotionType((current) => {
            if (current && current.id === found.id) return current;
            if (!current) {
              if (window.scrollY > 0) {
                motionScrollPosRef.current = window.scrollY;
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
        setActiveDetailMotionType((current) => {
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

  const handleOpenDetail = (mType: MotionDesignTypeInfo) => {
    if (activeDetailMotionType?.id === mType.id) return;
    motionScrollPosRef.current = window.scrollY;
    isNavigatingToTypeRef.current = true;
    setActiveDetailMotionType(mType);
    window.location.hash = `service-${service.id}/type/${mType.id}`;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    setTimeout(() => {
      isNavigatingToTypeRef.current = false;
    }, 100);
  };

  const handleBackToOverview = () => {
    isRestoringTypeScrollRef.current = true;
    setActiveDetailMotionType(null);
    window.location.hash = `service-${service.id}`;
  };

  const handleOrderFormat = (formatName: string) => {
    setSelectedFormat(formatName);
    const formEl = document.getElementById('service-inquiry-section');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + `#service-${service.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isNameInvalid = attemptedSubmit && !clientName.trim();
  const isEmailInvalid = attemptedSubmit && (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.'));
  const isMessageInvalid = attemptedSubmit && !clientMessage.trim();

  const validateForm = (): boolean => {
    setAttemptedSubmit(true);
    if (!clientName.trim()) {
      document.getElementById('motion-detail-name')?.focus();
      return false;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.')) {
      document.getElementById('motion-detail-email')?.focus();
      return false;
    }
    if (!clientMessage.trim()) {
      document.getElementById('motion-detail-message')?.focus();
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
        service: '3D Video Animation',
        category: selectedFormat,
        budget: 'Custom Scope',
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
        category: selectedFormat,
        budget: 'Custom Scope',
        message: clientMessage.trim()
      });
      setLastOrderLinks(links);
      setSubmittedSuccess(true);
      setAttemptedSubmit(false);
    } catch (err) {
      console.error('Failed to dispatch WhatsApp order', err);
    }
  };

  // Filter showcase projects (hooks must always execute unconditionally before any return)
  const availableCategories = ['All', 'Logo Animation', 'Product Animation', 'Brand Animation', 'Promo Videos'];
  const filteredProjects = serviceProjects.filter((p) => {
    if (portfolioFilter === 'All') return true;
    return p.subcategory?.toLowerCase() === portfolioFilter.toLowerCase();
  });

  const [showcaseVisibleCount, setShowcaseVisibleCount] = useState<number>(5);

  useEffect(() => {
    setShowcaseVisibleCount(5);
    setActiveVideoCardId(null);
  }, [portfolioFilter]);

  const displayedProjects = useMemo(() => {
    return filteredProjects.slice(0, showcaseVisibleCount);
  }, [filteredProjects, showcaseVisibleCount]);

  const handleShowLess = () => {
    const targetProject = filteredProjects[4];
    const targetEl = targetProject
      ? document.getElementById(`motion-showcase-${targetProject.id}`)
      : null;
    snapScrollToElement(targetEl || document.getElementById('motion-design-showcase-controls'), () => {
      setShowcaseVisibleCount(5);
    });
  };

  // If a subcategory detail page is open, render the dedicated type page
  if (activeDetailMotionType) {
    return (
      <MotionDesignTypeDetailPage
        motionType={activeDetailMotionType}
        service={service}
        allMotionTypes={MOTION_DESIGN_TYPES_DATA}
        onBackToMotionDesign={handleBackToOverview}
        onSelectMotionType={(type) => handleOpenDetail(type)}
        serviceProjects={serviceProjects}
      />
    );
  }

  return (
    <div id="service-detail-page-container" className="min-h-screen bg-[#fbfbfe] text-[#0e0e0e] pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Navigation & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-neutral-200">
          <button
            id="service-detail-back-button"
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
            <span className="text-[#1430d8] font-bold">3D Video Animation</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
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
        {/* 1. HERO SECTION */}
        {/* ========================================================================= */}
        <div id="service-hero-section" className="mt-8 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="inline-flex items-center flex-nowrap gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] sm:text-xs font-semibold text-[#1430d8] whitespace-nowrap max-w-full overflow-x-auto no-scrollbar">
              <Film className="w-3.5 h-3.5 text-[#0075f7] shrink-0" />
              <span className="uppercase tracking-wider text-[10px] sm:text-[11px] font-bold shrink-0">3D Video Animation</span>
              <span className="w-1 h-1 rounded-full bg-[#1430d8] shrink-0" />
              <span className="text-neutral-600 font-semibold shrink-0">Motion Studio</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>4K 60 FPS • High-Impact Commercials</span>
            </div>
          </div>

          <h1 className="font-display text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0e0e0e] tracking-tight leading-[1.12]">
            3D Video Animation
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed font-normal max-w-3xl">
            High-impact 3D animation videos engineered to captivate and convert. From photorealistic product teardowns and kinetic logo reveals to high-energy commercial promo reels (5s to 60s).
          </p>

          {/* Direct CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#service-inquiry-section"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1430d8] hover:bg-[#0075f7] text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <span>Start Your 3D Video</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. WHAT WE ANIMATE (Motion Categories) */}
        {/* ========================================================================= */}
        <div id="motion-categories-section" className="mt-16 sm:mt-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-3">
              <Film className="w-3.5 h-3.5 text-[#0075f7]" />
              <span>What We Create</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0e0e0e] tracking-tight">
              Motion Categories
            </h2>
            <p className="mt-3 text-sm sm:text-base text-neutral-600 leading-relaxed">
              Four specialized 3D animation styles crafted for website heroes, product teasers, and high-impact social campaigns:
            </p>
          </div>

          <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {MOTION_DESIGN_TYPES_DATA.map((type, idx) => (
              <button
                key={type.id}
                id={`btn-motion-type-card-${idx}`}
                onClick={() => handleOpenDetail(type)}
                className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-left border border-neutral-200/90 bg-white hover:border-[#1430d8]/50 hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-md sm:rounded-lg bg-blue-50 text-[#1430d8] font-bold text-[10px] sm:text-[11px] flex items-center justify-center border border-blue-100">
                      0{idx + 1}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                      {type.estimatedDelivery}
                    </span>
                  </div>

                  {type.badge && (
                    <span className="text-[9px] font-bold text-[#1430d8] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full inline-block mb-1.5">
                      {type.badge}
                    </span>
                  )}

                  <h3 className="font-display text-xs sm:text-[13px] font-bold text-[#0e0e0e] group-hover:text-[#1430d8] transition-colors leading-tight">
                    {type.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                    {type.tagline}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-semibold">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrderFormat(type.name);
                    }}
                    className="text-[#1430d8] hover:text-[#0075f7] inline-flex items-center gap-1 cursor-pointer font-bold text-[11px]"
                  >
                    <span>Select for Order</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-neutral-500 group-hover:text-[#1430d8] transition-colors text-[10px] font-medium">
                    Details &rarr;
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. WHAT'S INCLUDED */}
        {/* ========================================================================= */}
        <div id="whats-included-section" className="mt-10 sm:mt-14">
          <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/90 shadow-2xs">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] sm:text-[11px] font-bold text-[#1430d8] uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3 h-3 text-[#0075f7]" />
                <span>What&apos;s Included</span>
              </div>
              <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-[#0e0e0e] tracking-tight">
                What Our 3D Video Animation Service Includes
              </h2>
              <p className="mt-1 text-xs sm:text-[13px] text-neutral-500 leading-relaxed">
                Core deliverables and capabilities provided across our 3D video animation projects:
              </p>
            </div>

            {/* Compact Overview Grid */}
            <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {[
                { title: '4K UHD 60 FPS Renders', icon: Tv },
                { title: 'Cinema 4D, Octane & After Effects', icon: Cpu },
                { title: 'Transparent Alpha WebM Exports', icon: Video },
                { title: 'Custom Foley & Sound Design', icon: Volume2 },
                { title: '16:9 Landscape & 9:16 Reels', icon: Smartphone },
                { title: 'Full Commercial Broadcasting IP', icon: ShieldCheck },
                { title: 'Color Grading & Lighting', icon: Sparkles },
                { title: 'Fast Delivery & Milestone Check-ins', icon: Clock }
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#fbfbfe] border border-neutral-200/70 hover:border-[#1430d8]/30 hover:bg-white transition-all flex items-start gap-2 sm:gap-2.5"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-[#1430d8] flex items-center justify-center shrink-0 border border-blue-100/60 shadow-2xs mt-0.5">
                      <IconComp className="w-3.5 h-3.5 text-[#1430d8]" />
                    </div>
                    <span className="font-display text-xs sm:text-[13px] font-semibold text-[#0e0e0e] leading-snug break-words">
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. OUR PROCESS */}
        {/* ========================================================================= */}
        <div id="process-section" className="mt-10 sm:mt-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] sm:text-[11px] font-bold text-[#1430d8] uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5 text-[#0075f7]" />
              <span>Step-by-Step Flow</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-[#0e0e0e] tracking-tight">
              Our Process
            </h2>
            <p className="mt-1 text-xs sm:text-[13px] text-neutral-500 leading-relaxed">
              A transparent, cinematic 4-stage pipeline from visual direction to final 4K master delivery:
            </p>
          </div>

          <div className="mt-4 sm:mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[
              {
                step: '01',
                title: 'Brief & Storyboard',
                desc: 'Analyze CAD/vectors, script visual flow, and confirm style frames.',
                icon: Compass
              },
              {
                step: '02',
                title: '3D Motion Choreography',
                desc: 'Choreograph camera movement, lighting dynamics, and fluid 3D video animation in 60 FPS.',
                icon: PenTool
              },
              {
                step: '03',
                title: 'GPU Raytracing',
                desc: 'Calculate physical light caustics, reflections, and cinematic lighting.',
                icon: Cpu
              },
              {
                step: '04',
                title: 'Sound & 4K Handoff',
                desc: 'Composite audio impacts, DaVinci color grading, and deliver ProRes/WebM.',
                icon: CheckCircle2
              }
            ].map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-neutral-200/80 bg-white hover:border-[#1430d8]/30 transition-all flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                      <span className="font-display text-base sm:text-lg font-extrabold text-[#1430d8]">
                        {p.step}
                      </span>
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-blue-50 text-[#1430d8] flex items-center justify-center">
                        <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1430d8]" />
                      </div>
                    </div>
                    <h3 className="font-display text-xs sm:text-sm font-bold text-[#0e0e0e] mb-1 leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. PORTFOLIO SHOWCASE */}
        {/* ========================================================================= */}
        <div id="service-portfolio-showcase-section" className="mt-16 sm:mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>3D Video Animation • Showcase</span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0e0e0e] tracking-tight">
                Featured 3D Video Projects
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-2xl">
                Explore real 3D video commercial projects crafted for clients worldwide:
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-bold text-[#1430d8] shadow-2xs">
                {filteredProjects.length} of {serviceProjects.length} Projects
              </span>
            </div>
          </div>

          {/* Compact Category Filter Bar - Single Row Layout */}
          <div className="mt-6 sm:mt-8 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/90 shadow-2xs">
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
                  {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
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

            {/* All category types in a sleek horizontal row */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5 w-full touch-pan-x">
              {availableCategories.map((cat, idx) => {
                const count = cat === 'All'
                  ? serviceProjects.length
                  : serviceProjects.filter((p) => (p.subcategory || '').toLowerCase().includes(cat.toLowerCase())).length;
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

          {/* Projects Grid */}
          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {displayedProjects.map((p) => (
              <ShowcaseProjectCard
                key={p.id}
                project={p}
                activeVideoId={activeVideoCardId}
                onPlayVideo={(id) => setActiveVideoCardId(id)}
                onStopVideo={() => setActiveVideoCardId(null)}
                onOpenModal={(proj) => setPreviewProject(proj)}
                idPrefix="motion-showcase"
                serviceTitle="3D Video Animation"
              />
            ))}
          </div>

          {/* Show More / Show Less Pagination when items > 5 */}
          {filteredProjects.length > 5 && (
            <div id="motion-design-showcase-controls" className="mt-8 flex flex-col items-center gap-3 scroll-mb-6 sm:scroll-mb-8">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {showcaseVisibleCount < filteredProjects.length && (
                  <button
                    onClick={() => setShowcaseVisibleCount((prev) => Math.min(prev + 5, filteredProjects.length))}
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

        {/* ========================================================================= */}
        {/* 6. PROJECT INQUIRY & ORDER FORM */}
        {/* ========================================================================= */}
        {(() => {
          const currentFormMeta = getCategoryFormMeta(selectedFormat);
          return (
            <div id="service-inquiry-section" className="mt-8 sm:mt-16 scroll-mt-24">
              <div className="p-3.5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 shadow-lg max-w-3xl mx-auto">
                <div className="text-center max-w-xl mx-auto mb-3.5 sm:mb-6">
                  <span className="text-[9px] sm:text-[11px] font-bold text-[#1430d8] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 sm:py-1 rounded-full border border-blue-100">
                    {currentFormMeta.badge}
                  </span>
                  <h2 className="font-display text-lg sm:text-2xl md:text-3xl font-extrabold text-[#0e0e0e] mt-1 sm:mt-1.5">
                    {currentFormMeta.title}
                  </h2>
                  <p className="text-[11px] sm:text-sm text-neutral-600 mt-0.5 sm:mt-1 max-w-md mx-auto leading-normal sm:leading-relaxed">
                    {currentFormMeta.description}
                  </p>
                </div>

                {submittedSuccess ? (
                  <div className="py-6 sm:py-8 text-center flex flex-col items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 text-[#1430d8] flex items-center justify-center mb-2.5 sm:mb-3 shadow-sm">
                      <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <h3 className="font-display text-base sm:text-xl font-bold text-[#0e0e0e]">
                      {selectedFormat} Inquiry Transmitted!
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-md">
                      Thank you! Usman Afzal has received your customized specifications for <strong>{selectedFormat}</strong> and will reach out to {clientEmail} within 4 hours.
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
                  <form onSubmit={handleGmailOrder} noValidate className="space-y-2.5 sm:space-y-3.5">
                    {/* 1. Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label htmlFor="motion-detail-name" className="block text-[11px] font-semibold text-neutral-700">
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
                          id="motion-detail-name"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Christian Grey"
                          className={`w-full px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border text-xs sm:text-sm focus:outline-none transition-colors ${
                            isNameInvalid
                              ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                              : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                          }`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label htmlFor="motion-detail-email" className="block text-[11px] font-semibold text-neutral-700">
                            Your Email *
                          </label>
                          {isEmailInvalid && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                              {!clientEmail.trim() ? 'Required' : 'Valid email required'}
                            </span>
                          )}
                        </div>
                        <input
                          type="email"
                          id="motion-detail-email"
                          required
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="e.g. contact@luxurybrand.com"
                          className={`w-full px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border text-xs sm:text-sm focus:outline-none transition-colors ${
                            isEmailInvalid
                              ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                              : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 2. Clean Category Selection (Logo / Product / Brand / Commercial) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-neutral-800 flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-[#1430d8]" />
                          <span>Select 3D Video Category *</span>
                        </label>
                        <span className="text-[9px] font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          {selectedFormat}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                        {MOTION_DESIGN_TYPES_DATA.map((t) => {
                          const isSelected = selectedFormat === t.name;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setSelectedFormat(t.name)}
                              className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                                isSelected
                                  ? 'bg-[#1430d8] text-white border-[#1430d8] shadow-xs ring-2 ring-[#1430d8]/20'
                                  : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                              }`}
                            >
                              <span className="font-semibold text-[11px] sm:text-xs truncate w-full">
                                {t.name}
                              </span>
                              <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-neutral-500'}`}>
                                {t.estimatedDelivery}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Short Brief & Requirements */}
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label htmlFor="motion-detail-message" className="block text-[11px] font-semibold text-neutral-700">
                          Project Brief &amp; Requirements *
                        </label>
                        {isMessageInvalid && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            Required
                          </span>
                        )}
                      </div>
                      <textarea
                        id="motion-detail-message"
                        required
                        rows={2}
                        value={clientMessage}
                        onChange={(e) => setClientMessage(e.target.value)}
                        placeholder={currentFormMeta.placeholder}
                        className={`w-full px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border text-xs sm:text-sm focus:outline-none resize-y min-h-[75px] max-h-[350px] transition-colors ${
                          isMessageInvalid
                            ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                            : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                        }`}
                      />
                      <p className="mt-0.5 text-[10px] text-neutral-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Delivered in 4K 60fps with full commercial broadcasting rights.</span>
                      </p>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200/80 flex flex-wrap items-center justify-between gap-2 text-[10.5px] sm:text-[11px] text-neutral-600 tabular-nums">
                      <span className="font-semibold text-neutral-700">Payment Schedule:</span>
                      <span>
                        <strong className="text-[#1430d8]">25%</strong> Project Start · <strong className="text-[#1430d8]">35%</strong> Mid-Project · <strong className="text-[#1430d8]">40%</strong> Final Handover
                      </span>
                    </div>

                    {/* 4. Action Buttons (Side by Side: Send Order via Gmail & Order via WhatsApp) */}
                    <div className="pt-0.5 grid grid-cols-2 gap-2 sm:gap-2.5">
                      <button
                        type="submit"
                        id="submit-motion-page-gmail-btn"
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
                        id="submit-motion-page-whatsapp-btn"
                        onClick={handleWhatsAppOrder}
                        disabled={isSubmitting}
                        className="min-h-[44px] w-full py-2.5 sm:py-3 px-2.5 sm:px-4 rounded-xl bg-[#25D366] hover:bg-[#1eb954] text-white text-[11px] sm:text-xs md:text-sm font-bold leading-tight text-center transition-all shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
                        title="Send order and chat instantly on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
                        <span>Order via WhatsApp</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* 6.5 FAQ SECTION */}
        {/* ========================================================================= */}
        <div id="motion-faq-section" className="mt-16 sm:mt-24">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-3">
              <HelpCircle className="w-3.5 h-3.5 text-[#0075f7]" />
              <span>FAQ &amp; Details</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0e0e0e] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Clear answers regarding formats, project process, and production details:
            </p>
          </div>

          <div className="space-y-3 max-w-4xl">
            {motionFaqs.map((faq, idx) => {
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
        {/* PREV / NEXT SERVICE NAVIGATION (FULL TITLE & RESPONSIVE) */}
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
                    {prevService.title}
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
                    {nextService.title}
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

      {/* Project Preview Modal */}
      <ProjectDetailModal
        project={previewProject}
        onClose={() => setPreviewProject(null)}
        serviceTitle="3D Video Animation"
        onOpenContact={(_srv, cat, proj) => {
          const target = proj || previewProject;
          if (target) {
            const matchedFormat = target.subcategory || cat || 'Logo Animation';
            setClientMessage(
              `I am interested in a 3D video animation similar to "${target.title}" (${matchedFormat}).\n\nSpecific Requirements: `
            );
            handleOrderFormat(matchedFormat);
          }
        }}
      />
    </div>
  );
};
