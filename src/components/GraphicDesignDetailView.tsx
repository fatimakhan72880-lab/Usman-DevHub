import React, { useState, useMemo, useLayoutEffect, useEffect, useRef } from 'react';
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
  PenTool,
  Compass,
  Rocket,
  FileCheck,
  Smartphone,
  SlidersHorizontal,
  MessageCircle,
  AlertCircle,
  HelpCircle,
  Mail
} from 'lucide-react';
import { dispatchOrderToGmail, dispatchOrderToWhatsApp } from '../utils/orderDispatch';
import { Service, Project } from '../types';
import { addContactMessage, getProjects } from '../services/storageService';
import { GRAPHIC_DESIGN_TYPES_DATA, GraphicDesignTypeInfo } from '../data/graphicDesignTypes';
import { GraphicDesignTypeDetailPage } from './GraphicDesignTypeDetailPage';
import { ShowcaseProjectCard } from './ShowcaseProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { scrollToSectionWithOffset, snapScrollToElement } from '../utils/scroll';

interface GraphicDesignDetailViewProps {
  service: Service;
  allServices: Service[];
  onBack: () => void;
  onSelectOtherService: (service: Service) => void;
  serviceProjects: Project[];
}

export const GraphicDesignDetailView: React.FC<GraphicDesignDetailViewProps> = ({
  service,
  allServices,
  onBack,
  onSelectOtherService,
  serviceProjects
}) => {
  const [activeDetailDesignType, setActiveDetailDesignType] = useState<GraphicDesignTypeInfo | null>(null);
  const [portfolioFilter, setPortfolioFilter] = useState<string>('All');
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [activeVideoCardId, setActiveVideoCardId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const graphicDesignFaqs = [
    {
      q: 'What source file formats will I receive upon completion?',
      a: 'You receive industry-standard vector files (AI, EPS, SVG, PDF) for unlimited resolution scaling, along with high-res web-optimized assets (PNG, JPEG, WebP) and print-ready CMYK files with bleed margins.'
    },
    {
      q: 'What is included in a complete Brand Identity package?',
      a: 'A full brand package includes primary and secondary logos, brandmarks and favicons, a comprehensive typography system, brand color palettes (HEX, RGB, CMYK, Pantone), social media kits, and brand guidelines.'
    },
    {
      q: 'How many initial design concepts and revision rounds are provided?',
      a: 'We present multiple distinct conceptual directions during the initial review. Once you choose your preferred direction, we refine it through collaborative revision rounds until every detail is pixel-perfect.'
    },
    {
      q: 'Do I get full commercial copyright and ownership?',
      a: 'Yes, upon final handover, 100% intellectual property and commercial copyright ownership are transferred directly to you. You are free to trademark, publish, and print worldwide.'
    },
    {
      q: 'Can you adapt existing brand assets or modernize an outdated logo?',
      a: 'Certainly! We specialize in brand refreshes, logo vectorization from low-res images, font modernizations, and expanding existing visual guidelines into full design systems.'
    },
    {
      q: 'How do project payment milestones work?',
      a: 'Every design project follows a clear 3-stage payment schedule: 25% at project start to kick off concept exploration, 35% mid-project upon reviewing initial creative directions, and 40% upon final approval and full vector source handover (via Remitly, Wise, Payoneer, Bank Wire, SadaPay, JazzCash, or USDT).'
    }
  ];

  const graphicScrollPosRef = useRef<number>(0);
  const isNavigatingToTypeRef = useRef<boolean>(false);
  const isRestoringTypeScrollRef = useRef<boolean>(false);

  // Track scroll position on Graphic Design overview
  useEffect(() => {
    if (!activeDetailDesignType) {
      const handleScroll = () => {
        if (!isNavigatingToTypeRef.current && !isRestoringTypeScrollRef.current) {
          graphicScrollPosRef.current = window.scrollY;
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [activeDetailDesignType]);

  // Synchronously restore scroll position before browser paint when returning from detail page
  useLayoutEffect(() => {
    if (!activeDetailDesignType && isRestoringTypeScrollRef.current) {
      const prevY = graphicScrollPosRef.current;
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
  }, [activeDetailDesignType]);

  // Hash-based routing for direct link and back/forward browser navigation
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash.includes('/type/')) {
        const rawTypeId = hash.split('/type/')[1]?.toLowerCase() || '';
        const typeId = rawTypeId.replace(/\/.*$/, '').replace(/\?.*$/, '').replace(/#.*$/, '');
        const found = GRAPHIC_DESIGN_TYPES_DATA.find(
          (t) => t.id === typeId || t.name.toLowerCase().replace(/\s+/g, '-') === typeId
        );
        if (found) {
          setActiveDetailDesignType((current) => {
            if (current && current.id === found.id) return current;
            if (!current) {
              if (window.scrollY > 0) {
                graphicScrollPosRef.current = window.scrollY;
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
        setActiveDetailDesignType((current) => {
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

  const handleOpenTypeDetailPage = (type: GraphicDesignTypeInfo) => {
    if (activeDetailDesignType?.id === type.id) return;
    graphicScrollPosRef.current = window.scrollY;
    isNavigatingToTypeRef.current = true;
    setActiveDetailDesignType(type);
    window.location.hash = `service-${service.id}/type/${type.id}`;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    setTimeout(() => {
      isNavigatingToTypeRef.current = false;
    }, 100);
  };

  const handleBackToOverview = () => {
    isRestoringTypeScrollRef.current = true;
    setActiveDetailDesignType(null);
    window.location.hash = `service-${service.id}`;
  };

  // Quick inquiry form state for overview
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [chosenType, setChosenType] = useState<string>('Logo Design');
  const [clientMessage, setClientMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);

  // Navigation between services
  const currentIndex = allServices.findIndex((s) => s.id === service.id);
  const prevService = currentIndex > 0 ? allServices[currentIndex - 1] : allServices[allServices.length - 1];
  const nextService = currentIndex >= 0 && currentIndex < allServices.length - 1 ? allServices[currentIndex + 1] : allServices[0];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isNameInvalid = attemptedSubmit && !clientName.trim();
  const isEmailInvalid = attemptedSubmit && (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.'));
  const isMessageInvalid = attemptedSubmit && !clientMessage.trim();

  const validateForm = (): boolean => {
    setAttemptedSubmit(true);
    if (!clientName.trim()) {
      document.getElementById('graphic-detail-name')?.focus();
      return false;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.')) {
      document.getElementById('graphic-detail-email')?.focus();
      return false;
    }
    if (!clientMessage.trim()) {
      document.getElementById('graphic-detail-message')?.focus();
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
        service: 'Graphic Design',
        category: chosenType,
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
        category: chosenType,
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

  // Filter Graphic Design portfolio projects
  const graphicProjects = useMemo(() => {
    const all = getProjects();
    return all.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const sub = (p.subcategory || '').toLowerCase();
      return (
        cat.includes('graphic') ||
        cat.includes('design') ||
        sub.includes('logo design') ||
        sub.includes('product design') ||
        sub.includes('thumbnail') ||
        sub.includes('social media')
      );
    });
  }, [serviceProjects]);

  const availableCategories = ['All', 'Logo Design', 'Product Design', 'Thumbnail Design', 'Social Media Design'];

  const filteredProjects = useMemo(() => {
    if (portfolioFilter === 'All') return graphicProjects;
    return graphicProjects.filter((p) => (p.subcategory || '').toLowerCase().includes(portfolioFilter.toLowerCase()));
  }, [graphicProjects, portfolioFilter]);

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
      ? document.getElementById(`graphic-showcase-${targetProject.id}`)
      : null;
    snapScrollToElement(targetEl || document.getElementById('graphic-design-showcase-controls'), () => {
      setShowcaseVisibleCount(5);
    });
  };

  // If a specific design type is active, render its clean detail page!
  if (activeDetailDesignType) {
    return (
      <GraphicDesignTypeDetailPage
        designType={activeDetailDesignType}
        service={service}
        onBackToGraphicDesign={handleBackToOverview}
        serviceProjects={serviceProjects}
      />
    );
  }

  return (
    <div id="service-detail-page-container" className="min-h-screen bg-[#fbfbfe] text-[#0e0e0e] pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ========================================================================= */}
        {/* TOP NAVIGATION & BREADCRUMBS BAR (Exact Web Development Match) */}
        {/* ========================================================================= */}
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
            <span className="text-[#1430d8] font-semibold truncate max-w-[180px] sm:max-w-none">
              Graphic Design
            </span>
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
        {/* 1. HERO SECTION (Exact Web Development Left-Aligned Match) */}
        {/* ========================================================================= */}
        <div id="service-hero-section" className="mt-8 max-w-4xl">
          <div className="inline-flex items-center flex-nowrap gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] sm:text-xs font-semibold text-[#1430d8] mb-4 whitespace-nowrap max-w-full overflow-x-auto no-scrollbar">
            <Sparkles className="w-3.5 h-3.5 text-[#0075f7] shrink-0" />
            <span className="uppercase tracking-wider text-[10px] sm:text-[11px] font-bold shrink-0">Graphic Design</span>
            <span className="w-1 h-1 rounded-full bg-[#1430d8] shrink-0" />
            <span className="text-neutral-500 font-medium shrink-0">Creative & Visual Identity</span>
          </div>

          <h1 className="font-display text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0e0e0e] tracking-tight leading-[1.12]">
            Graphic Design
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed font-normal max-w-3xl">
            Strategic visual identities, logos, product mockups, and high-impact digital graphics built to distinguish your brand.
          </p>

          {/* Direct CTAs: Start Your Project & View Showcase */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#service-inquiry-section"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1430d8] hover:bg-[#0075f7] text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <span>Start Your Project</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#service-portfolio-showcase-section"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-blue-50 border border-blue-200 text-[#1430d8] hover:bg-blue-100/70 font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>View Showcase</span>
            </a>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. WHAT WE DESIGN (Design Categories - Exact Web Dev Card Grid) */}
        {/* ========================================================================= */}
        <div id="graphic-types-section" className="mt-16 sm:mt-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-3">
              <Palette className="w-3.5 h-3.5 text-[#0075f7]" />
              <span>What We Design</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0e0e0e] tracking-tight">
              Design Categories
            </h2>
            <p className="mt-3 text-sm sm:text-base text-neutral-600 leading-relaxed">
              We design and deliver four primary graphic categories. Click on any category to explore its full details, included files, and complete specifications.
            </p>
          </div>

          <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {GRAPHIC_DESIGN_TYPES_DATA.map((type, idx) => (
              <button
                key={type.id}
                id={`btn-graphic-type-card-${idx}`}
                onClick={() => handleOpenTypeDetailPage(type)}
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
                  <h3 className="font-display text-xs sm:text-[13px] font-bold text-[#0e0e0e] group-hover:text-[#1430d8] transition-colors leading-tight">
                    {type.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                    {type.tagline}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-semibold text-[#1430d8]">
                  <span>Explore Details</span>
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-[#1430d8] group-hover:text-white transition-colors">
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. WHAT'S INCLUDED (Exact Web Dev Container & Grid Style) */}
        {/* ========================================================================= */}
        <div id="whats-included-section" className="mt-10 sm:mt-14">
          <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/90 shadow-2xs">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] sm:text-[11px] font-bold text-[#1430d8] uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3 h-3 text-[#0075f7]" />
                <span>What&apos;s Included</span>
              </div>
              <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-[#0e0e0e] tracking-tight">
                What Our Graphic Design Service Includes
              </h2>
              <p className="mt-1 text-xs sm:text-[13px] text-neutral-500 leading-relaxed">
                Core deliverables and capabilities provided across our graphic design projects:
              </p>
            </div>

            {/* Compact Overview Grid */}
            <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {[
                { title: 'Vector Lossless Files (.AI, .SVG)', icon: Sparkles },
                { title: 'Transparent PNG Exports', icon: FileImage },
                { title: 'Full Commercial Usage Rights', icon: ShieldCheck },
                { title: 'Print-Ready 300 DPI Formats', icon: FileCheck },
                { title: 'Color Palette & Typography', icon: Palette },
                { title: 'Multiple Concept Explorations', icon: PenTool },
                { title: 'Revisions Until Satisfied', icon: CheckCircle2 },
                { title: 'Direct Founder Collaboration', icon: Clock }
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
              <Compass className="w-3 h-3 text-[#0075f7]" />
              <span>Step-by-Step Flow</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-[#0e0e0e] tracking-tight">
              Our Process
            </h2>
            <p className="mt-1 text-xs sm:text-[13px] text-neutral-500 leading-relaxed">
              A straightforward, transparent 4-stage process from concept to delivered design:
            </p>
          </div>

          <div className="mt-4 sm:mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[
              {
                step: '01',
                title: 'Brief & Idea',
                desc: 'Understand your brand, audience, visual references, and goals.',
                icon: Compass
              },
              {
                step: '02',
                title: 'Concepts',
                desc: 'Create initial design drafts and visual direction concepts.',
                icon: PenTool
              },
              {
                step: '03',
                title: 'Refinement',
                desc: 'Fine-tune colors, typography, sizing, and details based on feedback.',
                icon: Palette
              },
              {
                step: '04',
                title: 'Final Handover',
                desc: 'Deliver print-ready, web-ready, and master editable source files.',
                icon: Rocket
              }
            ].map((step, idx) => {
              const IconComp = step.icon;
              return (
                <div
                  key={idx}
                  className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                      <span className="font-display text-base sm:text-lg font-extrabold text-[#1430d8]">
                        {step.step}
                      </span>
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-blue-50 text-[#1430d8] flex items-center justify-center">
                        <IconComp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1430d8]" />
                      </div>
                    </div>
                    <h3 className="font-display text-xs sm:text-sm font-bold text-[#0e0e0e] mb-1 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. GRAPHIC DESIGN SHOWCASE (Exact Match to Web Dev Showcase) */}
        {/* ========================================================================= */}
        <div id="service-portfolio-showcase-section" className="mt-16 sm:mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Graphic Design • Showcase</span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0e0e0e] tracking-tight">
                Graphic Design Showcase
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-2xl">
                Explore real projects created across our Graphic Design categories:
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-bold text-[#1430d8] shadow-2xs">
                {filteredProjects.length} of {graphicProjects.length} Projects
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
                  Show All ({graphicProjects.length})
                </button>
              )}
            </div>

            {/* All category types in a sleek horizontal row */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5 w-full touch-pan-x">
              {availableCategories.map((cat, idx) => {
                const count = cat === 'All'
                  ? graphicProjects.length
                  : graphicProjects.filter((p) => (p.subcategory || '').toLowerCase().includes(cat.toLowerCase())).length;
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
          {filteredProjects.length > 0 ? (
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
                    idPrefix="graphic-showcase"
                    serviceTitle="Graphic Design"
                  />
                ))}
              </div>

              {/* Show More / Show Less Pagination when items > 5 */}
              {filteredProjects.length > 5 && (
                <div id="graphic-design-showcase-controls" className="mt-8 flex flex-col items-center gap-3 scroll-mb-6 sm:scroll-mb-8">
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
            </>
          ) : (
            <div className="mt-8 p-12 text-center rounded-3xl bg-white border border-neutral-200">
              <Layers className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <h4 className="font-display text-base font-bold text-neutral-700">
                No projects found for category &quot;{portfolioFilter}&quot;
              </h4>
              <button
                onClick={() => setPortfolioFilter('All')}
                className="mt-4 px-4 py-2 rounded-xl bg-[#1430d8] text-white text-xs font-semibold"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 6. PROJECT INQUIRY & ORDER FORM (SAME UNIFIED STRUCTURE) */}
        {/* ========================================================================= */}
        <div id="service-inquiry-section" className="mt-8 sm:mt-16 scroll-mt-24">
          <div className="p-3.5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 shadow-lg max-w-3xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-3.5 sm:mb-6">
              <span className="text-[9px] sm:text-[11px] font-bold text-[#1430d8] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 sm:py-1 rounded-full border border-blue-100">
                Graphic Design Order
              </span>
              <h2 className="font-display text-lg sm:text-2xl md:text-3xl font-extrabold text-[#0e0e0e] mt-1 sm:mt-1.5">
                Order Graphic Design &amp; Brand Identity
              </h2>
              <p className="text-[11px] sm:text-sm text-neutral-600 mt-0.5 sm:mt-1 max-w-md mx-auto leading-normal sm:leading-relaxed">
                Direct engagement with Lead Engineer &amp; Designer Usman Afzal. Custom vector logos, social assets, and brand design kits.
              </p>
            </div>

            {submittedSuccess ? (
              <div className="py-6 sm:py-8 text-center flex flex-col items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 text-[#1430d8] flex items-center justify-center mb-2.5 sm:mb-3 shadow-sm">
                  <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="font-display text-base sm:text-xl font-bold text-[#0e0e0e]">
                  {chosenType} Inquiry Transmitted!
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-md">
                  Thank you! Usman Afzal has received your customized specifications for <strong>{chosenType}</strong> and will reach out to {clientEmail} within 4 hours.
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
                      <label htmlFor="graphic-detail-name" className="block text-[11px] font-semibold text-neutral-700">
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
                      id="graphic-detail-name"
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
                      <label htmlFor="graphic-detail-email" className="block text-[11px] font-semibold text-neutral-700">
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
                      id="graphic-detail-email"
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

                {/* 2. Clean Category Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-neutral-800 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[#1430d8]" />
                      <span>Select Design Category *</span>
                    </label>
                    <span className="text-[9px] font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {chosenType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                    {GRAPHIC_DESIGN_TYPES_DATA.map((t) => {
                      const isSelected = chosenType === t.name;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setChosenType(t.name)}
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
                    <label htmlFor="graphic-detail-message" className="block text-[11px] font-semibold text-neutral-700">
                      Design Brief &amp; Requirements *
                    </label>
                    {isMessageInvalid && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Required
                      </span>
                    )}
                  </div>
                  <textarea
                    id="graphic-detail-message"
                    required
                    rows={3}
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    placeholder="Tell us about the design you need, brand name, preferred colors, or reference styles..."
                    className={`w-full px-3 py-2 rounded-lg sm:rounded-xl border text-xs sm:text-sm focus:outline-none resize-y min-h-[75px] max-h-[350px] transition-colors ${
                      isMessageInvalid
                        ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                        : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                    }`}
                  />
                  <p className="mt-0.5 text-[10px] text-neutral-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Includes 100% vector source files (AI, SVG, PNG), brand color codes, and commercial usage rights.</span>
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
                    id="submit-graphic-page-gmail-btn"
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
                    id="submit-graphic-page-whatsapp-btn"
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

        {/* ========================================================================= */}
        {/* FAQ & DETAILS SECTION */}
        {/* ========================================================================= */}
        <div id="graphic-faq-section" className="mt-16 sm:mt-24">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-3">
              <HelpCircle className="w-3.5 h-3.5 text-[#0075f7]" />
              <span>FAQ &amp; Details</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0e0e0e] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Clear answers regarding vector source formats, identity systems, and revision guidelines:
            </p>
          </div>

          <div className="space-y-3 max-w-4xl">
            {graphicDesignFaqs.map((faq, idx) => {
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
        serviceTitle="Graphic Design"
        onOpenContact={(_srv, cat, proj) => {
          const target = proj || previewProject;
          if (target) {
            const matchedType = target.subcategory || cat || 'Logo Design';
            setChosenType(matchedType);
            setClientMessage(
              `I would like to commission a design project similar to "${target.title}" (${matchedType}).\n\nSpecific Requirements: `
            );
            const el = document.getElementById('service-inquiry-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />
    </div>
  );
};
