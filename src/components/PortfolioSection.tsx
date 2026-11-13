import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import {
  Sparkles,
  X,
  Layers,
  Eye,
  Globe,
  Code2,
  ShoppingBag,
  Boxes,
  Film,
  Palette,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Award,
  Grid,
  List,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Cloud,
  Play
} from 'lucide-react';
import { Project } from '../types';
import { getProjects, syncProjectsFromServer } from '../services/storageService';
import { SHOWCASE_TAXONOMY } from '../data/initialData';
import { getFallbackImage, resolveThumbnailUrl } from '../utils/imageUtils';
import { ProjectDetailModal } from './ProjectDetailModal';
import { ShowcaseProjectCard, normalizeServiceTitle } from './ShowcaseProjectCard';
import { ensureExternalUrl } from '../utils/urlUtils';
import { snapScrollToElement } from '../utils/scroll';

// Animated counter that starts from 0 and counts up smoothly every time the user scrolls it into view
const AnimatedCounter: React.FC<{
  target: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}> = ({ target, duration = 1500, decimals = 0, suffix = '', prefix = '', className = '' }) => {
  const [count, setCount] = useState<number>(0);
  const [inViewport, setInViewport] = useState<boolean>(false);
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inViewportRef = useRef<boolean>(false);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    const evaluateVisibility = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;

      // Trigger count-up when clearly inside the visible viewport
      const isClearlyVisible = rect.top <= vh - 35 && rect.bottom >= 35;
      // Reset back to 0 once scrolled completely out of the viewport
      const isCompletelyOut = rect.bottom <= 0 || rect.top >= vh;

      if (!inViewportRef.current && isClearlyVisible) {
        inViewportRef.current = true;
        setInViewport(true);
      } else if (inViewportRef.current && isCompletelyOut) {
        inViewportRef.current = false;
        setInViewport(false);
        setCount(0);
      }
    };

    evaluateVisibility();

    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        () => {
          evaluateVisibility();
        },
        { threshold: [0, 0.15, 0.5, 1] }
      );
      observer.observe(el);
    }

    window.addEventListener('scroll', evaluateVisibility, { passive: true });
    window.addEventListener('resize', evaluateVisibility, { passive: true });

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', evaluateVisibility);
      window.removeEventListener('resize', evaluateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!inViewport) {
      setCount(0);
      return;
    }

    setCount(0);
    let startTime: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Smooth easeOutCubic curve starting clearly from 0
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(easedProgress * target);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [inViewport, target, duration]);

  return (
    <span ref={nodeRef} className={`inline-block tabular-nums ${className}`}>
      {prefix}
      {decimals > 0 ? count.toFixed(decimals) : Math.round(count)}
      {suffix}
    </span>
  );
};

interface PortfolioSectionProps {
  onOpenContact: (servicePreset?: string, categoryPreset?: string) => void;
}

const CATEGORY_META: Record<string, { icon: React.ReactNode; tag: string }> = {
  'All': { icon: <Layers className="w-4 h-4" />, tag: 'Full Portfolio' },
  'Web Development': { icon: <Code2 className="w-4 h-4" />, tag: 'Full-Stack Web' },
  '3D Animated Websites': { icon: <Boxes className="w-4 h-4" />, tag: 'WebGL & 3D' },
  '3D Interactive Websites': { icon: <Boxes className="w-4 h-4" />, tag: 'WebGL & 3D' },
  'E-Commerce Development': { icon: <ShoppingBag className="w-4 h-4" />, tag: 'Flagship Commerce' },
  'E-Commerce': { icon: <ShoppingBag className="w-4 h-4" />, tag: 'Flagship Commerce' },
  'Graphic Design': { icon: <Palette className="w-4 h-4" />, tag: 'Brand & Visual Systems' },
  'UI/UX & Creative Design': { icon: <Palette className="w-4 h-4" />, tag: 'Brand & Visual Systems' },
  '3D Video Animation': { icon: <Film className="w-4 h-4" />, tag: 'Cinematic 3D Video' },
  '3D Motion Design & Animation': { icon: <Film className="w-4 h-4" />, tag: 'Cinematic 3D Video' },
  'Motion Design & Animation': { icon: <Film className="w-4 h-4" />, tag: 'Cinematic 3D Video' },
  'Website Deployment & Cloud Setup': { icon: <Cloud className="w-4 h-4" />, tag: 'Cloud & Infrastructure' },
  'Website Maintenance': { icon: <ShieldCheck className="w-4 h-4" />, tag: 'Support & SRE' }
};

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({ onOpenContact }) => {
  const [projects, setProjects] = useState<Project[]>(() => getProjects());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [previewProject, setPreviewProject] = useState<Project | null>(null);

  // Responsive default: 5 on mobile (< 768px), 9 on desktop (>= 768px)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  const baseVisibleCount = isMobile ? 5 : 9;
  const [visibleCount, setVisibleCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 9;
    const defaultCount = window.innerWidth < 768 ? 5 : 9;
    try {
      const saved = Number(sessionStorage.getItem('usman_devhub_portfolio_visible_count'));
      if (Number.isFinite(saved) && saved >= defaultCount) {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return defaultCount;
  });

  const [activeVideoCardId, setActiveVideoCardId] = useState<string | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const paginationControlsRef = useRef<HTMLDivElement>(null);

  // Sync mobile breakpoint flag on resize WITHOUT ever collapsing user's expanded Show More count or flipping mid-fullscreen
  useEffect(() => {
    const handleResize = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        return;
      }
      const mobile = window.innerWidth < 768;
      setIsMobile((prev) => (prev !== mobile ? mobile : prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset any active in-card video when switching filters or search
  useEffect(() => {
    setActiveVideoCardId(null);
  }, [selectedCategory, selectedSubcategory, searchQuery, viewMode]);

  // GSAP 3D flip trigger when clicking any archive row
  const openProjectModal = (project: Project, sourceElement?: HTMLElement | null) => {
    if (sourceElement) {
      gsap.to(sourceElement, {
        scale: 0.96,
        rotateY: 12,
        rotateX: -4,
        duration: 0.16,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      });
    }
    setPreviewProject(project);
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 260;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const loadData = () => {
    const fresh = getProjects();
    setProjects((prev) => {
      if (prev.length === fresh.length && prev.length > 0 && prev[0]?.id === fresh[0]?.id) {
        const isIdentical = prev.every(
          (p, idx) =>
            p.id === fresh[idx]?.id &&
            p.title === fresh[idx]?.title &&
            p.imageUrl === fresh[idx]?.imageUrl &&
            p.category === fresh[idx]?.category &&
            p.subcategory === fresh[idx]?.subcategory
        );
        if (isIdentical) return prev;
      }
      return fresh;
    });
  };

  useEffect(() => {
    loadData();
    syncProjectsFromServer().then(() => loadData());
    const handleUpdate = () => loadData();
    window.addEventListener('usman_agency_data_updated', handleUpdate);
    return () => window.removeEventListener('usman_agency_data_updated', handleUpdate);
  }, []);

  // Main Showcase Categories (5 core + any additional service categories with projects)
  const mainCategories = useMemo(() => {
    const core = [
      'Web Development',
      '3D Animated Websites',
      'E-Commerce Development',
      'Graphic Design',
      '3D Video Animation'
    ];
    const activeTabs = SHOWCASE_TAXONOMY.filter(
      (t) =>
        core.includes(t.category) ||
        projects.some((p) => normalizeServiceTitle(p.category) === t.category)
    ).map((t) => t.category);
    return ['All', ...activeTabs];
  }, [projects]);

  // Active taxonomy for current selection
  const activeTaxonomy = useMemo(() => {
    if (selectedCategory === 'All') return null;
    return SHOWCASE_TAXONOMY.find(t => t.category === selectedCategory) || null;
  }, [selectedCategory]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('All');
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const activeTab = document.getElementById(`portfolio-cat-tab-${slug}`);
    if (activeTab) {
      gsap.fromTo(activeTab, { scale: 0.92 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' });
    }
  };

  // Filtered dataset
  const filteredProjects = useMemo(() => {
    const filtered = projects.filter(project => {
      const sel = selectedCategory.toLowerCase();
      const pCat = (project.category || '').toLowerCase();
      const matchCategory =
        selectedCategory === 'All' ||
        pCat === sel ||
        pCat.includes(sel) ||
        sel.includes(pCat) ||
        (sel.includes('3d interactive') && pCat.includes('3d')) ||
        (sel.includes('motion') && pCat.includes('motion')) ||
        (sel.includes('graphic design') && (pCat.includes('design') || pCat.includes('ui/ux'))) ||
        (sel.includes('e-commerce') && pCat.includes('commerce'));
      
      const matchSubcategory =
        selectedSubcategory === 'All' ||
        (project.subcategory &&
          project.subcategory.toLowerCase() === selectedSubcategory.toLowerCase());

      const matchSearch =
        !searchQuery.trim() ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.subcategory && project.subcategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.technologies.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCategory && matchSubcategory && matchSearch;
    });

    // When "All" category is selected:
    // 1st-3rd: ALL "3D Animated Websites" showcases (VELORA, JuicyDrop, then all other 3D Animated Websites)
    // 4th: ALL "Web Development" showcases
    // 5th: All other service showcases
    if (selectedCategory === 'All') {
      return [...filtered].sort((a, b) => {
        const getPriority = (p: Project) => {
          const id = (p.id || '').toLowerCase();
          const title = (p.title || '').toLowerCase();
          const normalizedService = normalizeServiceTitle(p.category);
          const is3DAnimatedWebsite = normalizedService === '3D Animated Websites';
          const isWebDev = normalizedService === 'Web Development';

          if (is3DAnimatedWebsite && (id === 'proj-velora-perfumes' || title.includes('velora'))) return 1;
          if (is3DAnimatedWebsite && (id === 'proj-juicydrop' || title.includes('juicydrop'))) return 2;
          if (is3DAnimatedWebsite) return 3;
          if (isWebDev) return 4;
          return 5;
        };

        const pA = getPriority(a);
        const pB = getPriority(b);
        if (pA !== pB) return pA - pB;
        return 0;
      });
    }

    return filtered;
  }, [projects, selectedCategory, selectedSubcategory, searchQuery]);

  const prevFilterRef = useRef({ selectedCategory, selectedSubcategory, searchQuery });

  // Reset pagination ONLY when user explicitly changes category, subcategory, or search query (never on resize/fullscreen!)
  useEffect(() => {
    const prev = prevFilterRef.current;
    if (
      prev.selectedCategory !== selectedCategory ||
      prev.selectedSubcategory !== selectedSubcategory ||
      prev.searchQuery !== searchQuery
    ) {
      prevFilterRef.current = { selectedCategory, selectedSubcategory, searchQuery };
      const resetCount = isMobile ? 5 : 9;
      setVisibleCount(resetCount);
    }
  }, [selectedCategory, selectedSubcategory, searchQuery, isMobile]);

  // Keep expanded Show More count synced in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('usman_devhub_portfolio_visible_count', String(visibleCount));
    } catch {
      // ignore storage errors
    }
  }, [visibleCount]);

  // Sliced projects for display (5 on mobile, 9 on desktop before Show More)
  const displayedProjects = useMemo(() => {
    return filteredProjects.slice(0, visibleCount);
  }, [filteredProjects, visibleCount]);

  const handleShowMore = () => {
    const step = isMobile ? 5 : 9;
    setVisibleCount(prev => Math.min(prev + step, filteredProjects.length));
  };

  const handleShowLess = () => {
    const minThreshold = isMobile ? 5 : 9;
    if (visibleCount <= minThreshold) return;
    const step = isMobile ? 5 : 9;
    const newCount = Math.max(visibleCount - step, minThreshold);
    const targetProject = filteredProjects[newCount - 1];

    const targetEl = targetProject
      ? document.getElementById(`portfolio-card-${targetProject.id}`) ||
        document.getElementById(`portfolio-mobile-row-${targetProject.id}`) ||
        document.getElementById(`portfolio-row-${targetProject.id}`)
      : null;

    snapScrollToElement(targetEl || paginationControlsRef.current, () => {
      setVisibleCount(newCount);
    });
  };

  const gridRef = useRef<HTMLDivElement>(null);
  const animatedItemsRef = useRef<WeakSet<HTMLElement>>(new WeakSet());

  // GSAP: Smooth one-time scroll entrance for newly rendered cards (no flickering or refreshing)
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('.portfolio-animate-item');
    if (!items || items.length === 0) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              if (!animatedItemsRef.current.has(el)) {
                animatedItemsRef.current.add(el);
                gsap.fromTo(
                  el,
                  { opacity: 0.8, y: 12 },
                  {
                    opacity: 1,
                    y: 0,
                    duration: 0.35,
                    ease: 'power2.out',
                    clearProps: 'transform,opacity'
                  }
                );
              }
              observer.unobserve(el);
            }
          });
        },
        { threshold: 0.05 }
      );

      items.forEach((item) => {
        if (!animatedItemsRef.current.has(item)) {
          observer.observe(item);
        }
      });

      return () => observer.disconnect();
    }
  }, [displayedProjects.length, viewMode, selectedCategory, selectedSubcategory]);

  // GSAP: Mobile tactile touch spring feedback
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { scale: 0.97, duration: 0.15, ease: 'power1.out' });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
  };

  return (
    <section id="work" className="relative py-10 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#fbfbfe] text-[#0e0e0e] border-t border-neutral-200/80">
      {/* Soft Ambient Light Glows */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[340px] sm:w-[600px] md:w-[900px] h-[300px] sm:h-[400px] bg-gradient-to-b from-blue-100/50 via-indigo-50/30 to-transparent blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl xl:max-w-[1400px] mx-auto">
        {/* Section Header: Pristine Modern Studio Editorial */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-6 pb-6 sm:pb-8 border-b border-neutral-200">
          {/* Left Column: Category Badge, Heading, Clear Description */}
          <div className="max-w-2xl">
            {/* Clean Mobile-Friendly Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-[10px] sm:text-xs font-semibold text-[#1430d8] mb-2.5 sm:mb-3 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#0075f7] shrink-0" />
              <span className="font-bold tracking-wide uppercase text-[10px] sm:text-[11px]">Selected Works</span>
              <span className="w-1 h-1 rounded-full bg-blue-300" />
              <span className="inline-flex items-center gap-1.5 text-neutral-600 font-medium">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span>{projects.length} Featured Projects</span>
              </span>
            </div>

            <h2 className="font-display text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0e0e0e] leading-[1.18] sm:leading-[1.12]">
              Built with Precision.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1430d8] via-[#0075f7] to-indigo-600">
                Delivered Globally.
              </span>
            </h2>

            <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-neutral-600 leading-relaxed font-normal">
              Explore a curated showcase of production-ready web platforms, interactive 3D experiences, flagship commerce stores, and visual creative systems delivered for ambitious clients worldwide.
            </p>
          </div>

          {/* Right Column: Unified Studio Verified Metrics Strip (Compact & Sleek) */}
          <div className="w-full lg:w-auto pt-2 lg:pt-0 shrink-0">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200/90 p-2 sm:p-2.5 shadow-2xs hover:border-[#1430d8]/30 transition-all duration-300 w-full sm:w-auto">
              <div className="grid grid-cols-3 divide-x divide-neutral-100 gap-0.5 sm:gap-1">
                {/* Metric 1: 100% Live & Tested */}
                <div className="flex flex-col items-center justify-center text-center px-2.5 sm:px-3.5 py-0.5">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-0.5">
                    <div className="w-5 h-5 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-[#1430d8]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#1430d8]" />
                    </div>
                    <span className="font-display text-base sm:text-lg lg:text-xl font-extrabold text-[#0e0e0e] leading-none tabular-nums">
                      <AnimatedCounter target={100} suffix="%" duration={1500} className="min-w-[3.6ch] text-left" />
                    </span>
                  </div>
                  <div className="text-[10.5px] sm:text-xs font-bold text-neutral-800 whitespace-nowrap leading-tight">
                    Live &amp; Tested
                  </div>
                  <div className="text-[8.5px] sm:text-[9.5px] font-medium text-neutral-400 mt-0.5 whitespace-nowrap">
                    Production Ready
                  </div>
                </div>

                {/* Metric 2: Dynamic Featured Projects (Updates with projects count) */}
                <div className="flex flex-col items-center justify-center text-center px-2.5 sm:px-3.5 py-0.5">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-0.5">
                    <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-[#1430d8]">
                      <Layers className="w-3.5 h-3.5 text-[#1430d8]" />
                    </div>
                    <span className="font-display text-base sm:text-lg lg:text-xl font-extrabold text-[#1430d8] leading-none tabular-nums">
                      <AnimatedCounter target={projects.length} suffix={projects.length >= 10 ? '+' : ''} duration={1500} className="min-w-[2.8ch] text-left" />
                    </span>
                  </div>
                  <div className="text-[10.5px] sm:text-xs font-bold text-neutral-800 whitespace-nowrap leading-tight">
                    Featured Projects
                  </div>
                  <div className="text-[8.5px] sm:text-[9.5px] font-medium text-neutral-400 mt-0.5 whitespace-nowrap">
                    Global Builds
                  </div>
                </div>

                {/* Metric 3: 95+ Speed & Quality */}
                <div className="flex flex-col items-center justify-center text-center px-2.5 sm:px-3.5 py-0.5">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-0.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="font-display text-base sm:text-lg lg:text-xl font-extrabold text-emerald-600 leading-none tabular-nums">
                      <AnimatedCounter target={95} suffix="+" duration={1500} className="min-w-[2.8ch] text-left" />
                    </span>
                  </div>
                  <div className="text-[10.5px] sm:text-xs font-bold text-neutral-800 whitespace-nowrap leading-tight">
                    Speed &amp; Quality
                  </div>
                  <div className="text-[8.5px] sm:text-[9.5px] font-medium text-neutral-400 mt-0.5 whitespace-nowrap">
                    Core Web Vitals
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Controls & Right-Scrollable Category Strip */}
        <div className="mt-6 sm:mt-8 mb-6 flex flex-col gap-3">
          {/* Top Utility Row: Search Bar & Grid/Table Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Categories ({mainCategories.length - 1})
              </span>
              {/* Mobile swipe right hint */}
              <span className="sm:hidden text-[11px] font-medium text-[#1430d8] flex items-center gap-0.5">
                <span>Scroll right</span>
                <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
              </span>
            </div>

            {/* Search and View Mode */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  id="portfolio-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search websites by name or type..."
                  className="w-full pl-8 pr-8 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs text-[#0e0e0e] placeholder-neutral-400 focus:outline-none focus:border-[#1430d8] focus:ring-1 focus:ring-[#1430d8] shadow-2xs transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center p-1 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid View"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#1430d8] text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Card Grid Showcase"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  aria-label="Index List View"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'table'
                      ? 'bg-[#1430d8] text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Studio Archive List"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Standalone Right-Scrollable Category Pill Strip (No outer box!) */}
          <div className="relative flex items-center gap-1.5 w-full">
            {/* Desktop Left Scroll Arrow */}
            <button
              type="button"
              onClick={() => scrollCategories('left')}
              aria-label="Scroll left"
              className="hidden sm:flex shrink-0 w-8 h-8 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 hover:text-[#1430d8] hover:border-[#1430d8] shadow-xs hover:shadow-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Main Horizontal Scroll Track */}
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1.5 px-0.5 snap-x w-full touch-pan-x"
            >
              {mainCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const count = cat === 'All'
                  ? projects.length
                  : projects.filter(p => p.category.toLowerCase().includes(cat.toLowerCase())).length;

                return (
                  <button
                    key={cat}
                    id={`portfolio-cat-tab-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    onClick={() => handleCategoryChange(cat)}
                    className={`shrink-0 snap-start px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#1430d8] text-white shadow-sm shadow-blue-600/20'
                        : 'bg-white text-neutral-700 hover:text-[#0e0e0e] hover:bg-neutral-50 border border-neutral-200/90 shadow-2xs hover:border-neutral-300'
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : 'text-[#1430d8]'}>
                      {CATEGORY_META[cat]?.icon || <Layers className="w-4 h-4" />}
                    </span>
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Right Scroll Arrow */}
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              aria-label="Scroll right"
              className="hidden sm:flex shrink-0 w-8 h-8 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 hover:text-[#1430d8] hover:border-[#1430d8] shadow-xs hover:shadow-sm transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Subcategory Filter Pills Row (Horizontally Scrollable when category selected) */}
          {activeTaxonomy && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 snap-x w-full"
            >
              <span className="shrink-0 text-xs font-bold text-neutral-400 uppercase tracking-wider mr-1">
                Filter:
              </span>
              <button
                onClick={() => setSelectedSubcategory('All')}
                className={`shrink-0 snap-start px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedSubcategory === 'All'
                    ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                All {selectedCategory} ({projects.filter(p => p.category.toLowerCase().includes(selectedCategory.toLowerCase())).length})
              </button>
              {activeTaxonomy.subcategories.map((sub) => {
                const isSubSelected = selectedSubcategory === sub;
                const subCount = projects.filter(
                  p => p.category.toLowerCase().includes(selectedCategory.toLowerCase()) &&
                  p.subcategory?.toLowerCase() === sub.toLowerCase()
                ).length;

                return (
                  <button
                    key={sub}
                    id={`sub-filter-${sub.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`shrink-0 snap-start px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isSubSelected
                        ? 'bg-[#0075f7] text-white font-semibold shadow-xs'
                        : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                    }`}
                  >
                    <span>{sub}</span>
                    {subCount > 0 && (
                      <span className={`text-[10px] ${isSubSelected ? 'opacity-90' : 'text-neutral-400'}`}>({subCount})</span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Results Metadata Bar */}
        {(selectedCategory !== 'All' || selectedSubcategory !== 'All' || searchQuery || visibleCount > baseVisibleCount) && (
          <div className="mb-6 flex items-center justify-between text-xs text-neutral-500 px-1">
            <span>
              Showing <strong className="text-neutral-900">{displayedProjects.length}</strong> of{' '}
              <strong className="text-neutral-900">{filteredProjects.length}</strong> {filteredProjects.length === 1 ? 'project' : 'projects'}
              {searchQuery && <> matching "<span className="text-[#1430d8] font-semibold">{searchQuery}</span>"</>}
            </span>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedSubcategory('All');
                setSearchQuery('');
                setVisibleCount(baseVisibleCount);
              }}
              className="text-[#1430d8] hover:underline font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Empty State / Showcase Curation Notice */}
        {filteredProjects.length === 0 && (
          <div className="py-16 sm:py-20 text-center rounded-3xl bg-white border border-neutral-200/90 p-8 sm:p-12 shadow-xs max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1430d8] border border-blue-100 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="font-display text-xl font-bold text-neutral-900">
              {projects.length === 0 ? 'Showcase Under Active Curation' : 'No matching projects found'}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 mt-2 leading-relaxed">
              {projects.length === 0
                ? 'We are curating our latest high-performance client case studies, 3D WebGL experiences, and brand platforms. Connect with us directly to review confidential agency work.'
                : 'No results found for this category or search query. Reset to explore the entire portfolio.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {projects.length === 0 ? (
                <>
                  <a
                    href="#services"
                    className="px-5 py-2.5 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                  >
                    Explore Core Services
                  </a>
                  <a
                    href="#contact"
                    className="px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-all"
                  >
                    Request Portfolio Deck
                  </a>
                </>
              ) : (
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedSubcategory('All');
                    setSearchQuery('');
                    setVisibleCount(5);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#1430d8] text-white text-xs font-semibold hover:bg-[#0075f7] transition-colors"
                >
                  View Full Portfolio
                </button>
              )}
            </div>
          </div>
        )}

        {/* VIEW 1: Grid Mode (Pristine Light Agency Cards with GSAP Physics & Stagger) */}
        {viewMode === 'grid' && displayedProjects.length > 0 && (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {displayedProjects.map((project) => (
              <ShowcaseProjectCard
                key={project.id}
                project={project}
                activeVideoId={activeVideoCardId}
                onPlayVideo={(id) => setActiveVideoCardId(id)}
                onStopVideo={() => setActiveVideoCardId(null)}
                onOpenModal={(proj) => setPreviewProject(proj)}
                idPrefix="portfolio-card"
              />
            ))}
          </div>
        )}

        {/* VIEW 2: Studio Archive View (Responsive: Mobile Executive Cards + Desktop Data Table) */}
        {viewMode === 'table' && filteredProjects.length > 0 && (
          <div className="rounded-2xl bg-white border border-neutral-200/90 overflow-hidden shadow-xs">
            {/* Mobile View: High-End Studio Archive List (< 768px) */}
            <div className="md:hidden divide-y divide-neutral-100">
              {displayedProjects.map((project) => (
                <div
                  key={project.id}
                  id={`portfolio-mobile-row-${project.id}`}
                  onClick={(e) => openProjectModal(project, e.currentTarget)}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  className="portfolio-animate-item p-3.5 flex items-start gap-3 hover:bg-neutral-50/80 transition-colors active:bg-neutral-100/80 active:scale-[0.98] cursor-pointer transform-gpu will-change-transform"
                >
                  {/* Thumbnail */}
                  <img
                    src={resolveThumbnailUrl(project.imageUrl, project.videoUrl, project.category)}
                    alt={project.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const fallback = getFallbackImage(project.imageUrl, project.category, project.videoUrl);
                      (e.target as HTMLImageElement).src = fallback;
                    }}
                    className="w-16 h-16 rounded-xl object-cover bg-neutral-100 shrink-0 border border-neutral-200/90 shadow-2xs mt-0.5"
                    loading="lazy"
                  />

                  {/* Content Body */}
                  <div className="flex-1 min-w-0">
                    {/* Service & Category */}
                    <div className="flex flex-wrap items-center gap-1 mb-1 min-w-0">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1430d8] font-bold text-[10px] border border-blue-100 truncate max-w-[140px]">
                        {normalizeServiceTitle(project.category)}
                      </span>
                      {project.subcategory && project.subcategory.toLowerCase() !== normalizeServiceTitle(project.category).toLowerCase() && (
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-semibold text-[10px] border border-neutral-200/80 truncate max-w-[140px]">
                          {project.subcategory}
                        </span>
                      )}
                    </div>

                    {/* Website Name */}
                    <h4 className="text-xs font-bold text-[#0e0e0e] leading-snug line-clamp-1">
                      {project.title}
                    </h4>

                    {/* Short Description */}
                    <p className="mt-1 text-[11px] text-neutral-600 line-clamp-1 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-neutral-100" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => openProjectModal(project, (e.currentTarget.closest('.portfolio-animate-item') as HTMLElement) || e.currentTarget)}
                        className="text-[11px] font-semibold text-neutral-600 hover:text-[#1430d8] flex items-center gap-1 py-0.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Details</span>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {normalizeServiceTitle(project.category) === '3D Video Animation' ? (
                          <button
                            onClick={(e) => openProjectModal(project, (e.currentTarget.closest('.portfolio-animate-item') as HTMLElement) || e.currentTarget)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold shadow-xs cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Play Video</span>
                          </button>
                        ) : project.category.toLowerCase().includes('design') ? (
                          <button
                            onClick={(e) => openProjectModal(project, (e.currentTarget.closest('.portfolio-animate-item') as HTMLElement) || e.currentTarget)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#1430d8] text-white text-[11px] font-semibold shadow-xs cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        ) : ensureExternalUrl(project.liveUrl) ? (
                          <a
                            href={ensureExternalUrl(project.liveUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <span>Live Demo</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openProjectModal(project, (e.currentTarget.closest('.portfolio-animate-item') as HTMLElement) || e.currentTarget);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[11px] font-semibold shadow-xs cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Overview</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop & Tablet View: Studio Data Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-600">
                <thead className="bg-neutral-50 text-[11px] font-bold uppercase text-neutral-500 border-b border-neutral-200 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-3 sm:px-4 min-w-[220px] sm:min-w-[260px]">Website Name</th>
                    <th className="py-3.5 px-3 sm:px-4">Website Type</th>
                    <th className="py-3.5 px-3 sm:px-4 hidden lg:table-cell">Overview</th>
                    <th className="py-3.5 px-3 sm:px-4 text-right">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-sans">
                  {displayedProjects.map((project) => {
                    const isVideoProject = normalizeServiceTitle(project.category) === '3D Video Animation';
                    const cleanLive = ensureExternalUrl(project.liveUrl);
                    const isDesignProject = project.category.toLowerCase().includes('design') || !cleanLive;
                    return (
                      <tr
                        key={project.id}
                        id={`portfolio-row-${project.id}`}
                        className="hover:bg-neutral-50/80 transition-colors group cursor-pointer"
                        onClick={(e) => openProjectModal(project, e.currentTarget)}
                      >
                        <td className="py-3.5 sm:py-4 px-3 sm:px-4 min-w-[220px] sm:min-w-[260px]">
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <img
                              src={resolveThumbnailUrl(project.imageUrl, project.videoUrl, project.category)}
                              alt=""
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const fallback = getFallbackImage(project.imageUrl, project.category, project.videoUrl);
                                (e.target as HTMLImageElement).src = fallback;
                              }}
                              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover bg-neutral-100 shrink-0 border border-neutral-200 shadow-2xs"
                              loading="lazy"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-xs sm:text-sm text-[#0e0e0e] group-hover:text-[#1430d8] transition-colors leading-snug line-clamp-1">
                                 {project.title}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 sm:py-4 px-3 sm:px-4 whitespace-nowrap">
                          <div className="inline-flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1430d8] font-bold text-[11px] border border-blue-100">
                              {normalizeServiceTitle(project.category)}
                            </span>
                            {project.subcategory && project.subcategory.toLowerCase() !== normalizeServiceTitle(project.category).toLowerCase() && (
                              <span className="px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 font-semibold text-[11px] border border-neutral-200/80">
                                {project.subcategory}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 sm:py-4 px-3 sm:px-4 hidden lg:table-cell text-neutral-600 font-medium max-w-sm">
                          <p className="line-clamp-1">{project.description}</p>
                        </td>

                        <td className="py-3.5 sm:py-4 px-3 sm:px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5 sm:gap-2">
                            <button
                              onClick={(e) => openProjectModal(project, (e.currentTarget.closest('tr') as HTMLElement) || e.currentTarget)}
                              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                              title="Case Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {isVideoProject ? (
                              <button
                                onClick={(e) => openProjectModal(project, (e.currentTarget.closest('tr') as HTMLElement) || e.currentTarget)}
                                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] sm:text-xs transition-colors shadow-2xs cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Play Video</span>
                              </button>
                            ) : isDesignProject ? (
                              <button
                                onClick={(e) => openProjectModal(project, (e.currentTarget.closest('tr') as HTMLElement) || e.currentTarget)}
                                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white font-semibold text-[11px] sm:text-xs transition-colors shadow-2xs cursor-pointer"
                              >
                                <span>Overview</span>
                              </button>
                            ) : (
                              <a
                                href={cleanLive}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white font-semibold text-[11px] sm:text-xs transition-colors shadow-2xs cursor-pointer"
                              >
                                <span>Live Demo</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Progressive Expansion & Step-by-Step Collapse Controls */}
        {filteredProjects.length > baseVisibleCount && (
          <div
            ref={paginationControlsRef}
            id="portfolio-pagination-controls"
            className="mt-12 pt-4 flex flex-col items-center justify-center gap-4"
          >
            {/* Status indicator */}
            <div className="flex flex-col items-center gap-1.5 w-full max-w-xs">
              <div className="flex items-center justify-between w-full text-xs text-neutral-500 font-medium">
                <span>
                  Showing <strong className="text-[#0e0e0e]">{displayedProjects.length}</strong> of{' '}
                  <strong className="text-[#0e0e0e]">{filteredProjects.length}</strong> items
                </span>
                <span className="text-[#1430d8] font-bold text-[11px]">
                  {Math.round((displayedProjects.length / filteredProjects.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1430d8] to-[#0075f7] transition-all duration-300 rounded-full"
                  style={{ width: `${(displayedProjects.length / filteredProjects.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Action Buttons (Only Show More and Show Less) */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Show More Button */}
              {visibleCount < filteredProjects.length && (
                <button
                  id="portfolio-show-more-btn"
                  onClick={handleShowMore}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>Show More</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}

              {/* Show Less Button */}
              {visibleCount > baseVisibleCount && (
                <button
                  id="portfolio-show-less-btn"
                  onClick={handleShowLess}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 border border-neutral-200 text-xs sm:text-sm font-semibold shadow-2xs hover:border-neutral-300 transition-all cursor-pointer"
                >
                  <ChevronUp className="w-4 h-4 text-neutral-500" />
                  <span>Show Less</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Agency Engineering Standards Ribbon (Light Mode) */}
        <div className="mt-12 sm:mt-20 pt-8 sm:pt-10 border-t border-neutral-200 grid grid-cols-4 gap-1.5 xs:gap-2 sm:gap-6 text-center">
          <div className="flex flex-col items-center p-2 sm:p-0 rounded-xl bg-white sm:bg-transparent border border-neutral-200/80 sm:border-0 shadow-2xs sm:shadow-none hover:border-[#1430d8]/30 transition-all">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-[#1430d8] flex items-center justify-center mb-1.5 sm:mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <h4 className="text-[8.5px] xs:text-[9.5px] sm:text-xs font-bold text-neutral-900 uppercase tracking-tight sm:tracking-wider leading-tight">
              Enterprise Reliability
            </h4>
            <p className="sm:hidden text-[7.5px] xs:text-[8px] text-neutral-500 font-medium leading-tight mt-0.5">
              Docker &amp; Edge
            </p>
            <p className="hidden sm:block text-[11px] text-neutral-500 mt-1">
              Docker, CI/CD, SSL &amp; Cloudflare Edge
            </p>
          </div>

          <div className="flex flex-col items-center p-2 sm:p-0 rounded-xl bg-white sm:bg-transparent border border-neutral-200/80 sm:border-0 shadow-2xs sm:shadow-none hover:border-[#1430d8]/30 transition-all">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-[#1430d8] flex items-center justify-center mb-1.5 sm:mb-2.5">
              <Zap className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <h4 className="text-[8.5px] xs:text-[9.5px] sm:text-xs font-bold text-neutral-900 uppercase tracking-tight sm:tracking-wider leading-tight">
              Sub-Second Speed
            </h4>
            <p className="sm:hidden text-[7.5px] xs:text-[8px] text-neutral-500 font-medium leading-tight mt-0.5">
              95+ &amp; 60 FPS
            </p>
            <p className="hidden sm:block text-[11px] text-neutral-500 mt-1">
              Lighthouse 95+ and 60fps WebGL shaders
            </p>
          </div>

          <div className="flex flex-col items-center p-2 sm:p-0 rounded-xl bg-white sm:bg-transparent border border-neutral-200/80 sm:border-0 shadow-2xs sm:shadow-none hover:border-[#1430d8]/30 transition-all">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-[#1430d8] flex items-center justify-center mb-1.5 sm:mb-2.5">
              <Award className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <h4 className="text-[8.5px] xs:text-[9.5px] sm:text-xs font-bold text-neutral-900 uppercase tracking-tight sm:tracking-wider leading-tight">
              Bespoke Craft
            </h4>
            <p className="sm:hidden text-[7.5px] xs:text-[8px] text-neutral-500 font-medium leading-tight mt-0.5">
              100% Custom
            </p>
            <p className="hidden sm:block text-[11px] text-neutral-500 mt-1">
              Zero generic templates; 100% custom code
            </p>
          </div>

          <div className="flex flex-col items-center p-2 sm:p-0 rounded-xl bg-white sm:bg-transparent border border-neutral-200/80 sm:border-0 shadow-2xs sm:shadow-none hover:border-[#1430d8]/30 transition-all">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-[#1430d8] flex items-center justify-center mb-1.5 sm:mb-2.5">
              <Globe className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <h4 className="text-[8.5px] xs:text-[9.5px] sm:text-xs font-bold text-neutral-900 uppercase tracking-tight sm:tracking-wider leading-tight">
              Global Deploy
            </h4>
            <p className="sm:hidden text-[7.5px] xs:text-[8px] text-neutral-500 font-medium leading-tight mt-0.5">
              Global CDNs
            </p>
            <p className="hidden sm:block text-[11px] text-neutral-500 mt-1">
              Multi-currency, localization, global CDNs
            </p>
          </div>
        </div>
      </div>

      {/* Luxury Case Study Modal with GSAP 3D Flip ("Palat-ta hua popup") */}
      <ProjectDetailModal
        project={previewProject}
        onClose={() => setPreviewProject(null)}
        onOpenContact={(srv, cat) => onOpenContact(srv, cat)}
      />
    </section>
  );
};
