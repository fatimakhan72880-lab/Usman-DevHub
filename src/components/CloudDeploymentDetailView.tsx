import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Server,
  Cloud,
  Terminal,
  Cpu,
  Layers,
  Lock,
  Globe,
  Share2,
  Compass,
  MessageCircle,
  Check,
  Eye,
  SlidersHorizontal,
  HelpCircle,
  AlertCircle,
  Mail
} from 'lucide-react';
import { dispatchOrderToGmail, dispatchOrderToWhatsApp } from '../utils/orderDispatch';
import { Service, Project } from '../types';
import { CLOUD_DEPLOYMENT_TYPES_DATA, CloudDeploymentTypeInfo } from '../data/cloudDeploymentTypes';
import { CloudDeploymentTypeDetailPage } from './CloudDeploymentTypeDetailPage';
import { ShowcaseProjectCard } from './ShowcaseProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { addContactMessage } from '../services/storageService';
import { scrollToSectionWithOffset } from '../utils/scroll';

interface CloudDeploymentDetailViewProps {
  service: Service;
  allServices: Service[];
  onBack: () => void;
  onSelectOtherService: (service: Service) => void;
  serviceProjects: Project[];
}

export const CloudDeploymentDetailView: React.FC<CloudDeploymentDetailViewProps> = ({
  service,
  allServices,
  onBack,
  onSelectOtherService,
  serviceProjects
}) => {
  const [activeDetailCloudType, setActiveDetailCloudType] = useState<CloudDeploymentTypeInfo | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Short Direct Order State
  const [selectedFormat, setSelectedFormat] = useState<string>(CLOUD_DEPLOYMENT_TYPES_DATA[0].name);
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientMessage, setClientMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [activeVideoCardId, setActiveVideoCardId] = useState<string | null>(null);
  const [portfolioFilter, setPortfolioFilter] = useState<string>('All');
  const [showcaseVisibleCount, setShowcaseVisibleCount] = useState<number>(5);

  const availableCloudCategories = useMemo(() => {
    return ['All', ...CLOUD_DEPLOYMENT_TYPES_DATA.map((t) => t.name)];
  }, []);

  const filteredCloudProjects = useMemo(() => {
    if (portfolioFilter === 'All') return serviceProjects;
    return serviceProjects.filter(
      (p) => (p.subcategory || '').toLowerCase().trim() === portfolioFilter.toLowerCase().trim()
    );
  }, [serviceProjects, portfolioFilter]);

  useEffect(() => {
    setShowcaseVisibleCount(5);
    setActiveVideoCardId(null);
  }, [portfolioFilter]);

  const displayedCloudProjects = useMemo(
    () => filteredCloudProjects.slice(0, showcaseVisibleCount),
    [filteredCloudProjects, showcaseVisibleCount]
  );

  const cloudDeploymentFaqs = [
    {
      q: 'Which cloud infrastructure providers do you support?',
      a: 'We design, configure, and manage infrastructure across AWS (Amazon Web Services), Google Cloud Platform (GCP), Microsoft Azure, DigitalOcean, Vercel, Netlify, and Cloudflare.'
    },
    {
      q: 'How do you ensure zero-downtime deployments?',
      a: 'We configure blue-green deployments, rolling updates, and container orchestration (Docker / Kubernetes) backed by health checks and automated rollback triggers so your users experience zero interruption.'
    },
    {
      q: 'What security, SSL, and compliance measures are configured?',
      a: 'Every deployment includes automated Let\'s Encrypt or Cloudflare SSL/TLS certificates, DDoS mitigation, web application firewalls (WAF), secure VPC networking, and strict secrets management (environment variables/KMS).'
    },
    {
      q: 'Do you set up automated CI/CD pipelines?',
      a: 'Yes, we build continuous integration and deployment pipelines using GitHub Actions, GitLab CI, or Docker registries that test, build, and deploy your code automatically on every push.'
    },
    {
      q: 'How are cloud hosting costs managed and optimized?',
      a: 'We architect right-sized instances, auto-scaling clusters, CDN asset caching, and serverless compute models to ensure maximum throughput with minimum monthly cloud expenditures.'
    },
    {
      q: 'How do studio payment milestones work for cloud & deployment setups?',
      a: 'Every deployment engagement follows our transparent 3-stage payment schedule: 25% at project start, 35% mid-project upon staging verification, and 40% upon zero-downtime live cutover and encrypted credentials handover (via Remitly, Wise, Payoneer, Bank Wire, SadaPay, JazzCash, or USDT).'
    }
  ];

  // Category-specific dynamic title, description, badge, and placeholder matching 3D Video Animation
  const getCloudCategoryFormMeta = (formatName: string) => {
    if (formatName.includes('Frontend') || formatName.includes('Web App') || formatName.includes('Jamstack')) {
      return {
        badge: 'Frontend & Web App Deployment',
        title: 'Order Your Frontend & Web App Deployment',
        description: 'Instant global edge deployment on top cloud platforms. Usman Afzal will review your codebase and reply within 4 hours.',
        whatsappText: 'Hello Usman DevHub, I want to order Frontend & Web App Deployment.',
        placeholder: 'Describe your web app or website (React, Next.js, WordPress, Shopify, HTML/CSS, etc.), Git repository link, and custom domain...'
      };
    } else if (formatName.includes('VPS') || formatName.includes('Docker')) {
      return {
        badge: 'Linux VPS & Docker Setup',
        title: 'Order Linux VPS & Docker Server Setup',
        description: 'Hardened Ubuntu VPS setup with Docker containerization, Nginx reverse proxy, database, and daily backups.',
        whatsappText: 'Hello Usman DevHub, I want to order Linux VPS & Docker Server Setup.',
        placeholder: 'Detail your application (Node.js, TypeScript, Next.js, Python, PHP/WordPress, Docker, etc.), VPS host, and database requirements...'
      };
    } else if (formatName.includes('Domain') || formatName.includes('DNS') || formatName.includes('Cloudflare')) {
      return {
        badge: 'Domain & Cloudflare Security',
        title: 'Order Domain, DNS & Cloudflare Security',
        description: 'Zero-downtime DNS setup, SSL error fixes, Cloudflare WAF, and 100% compliant business email deliverability.',
        whatsappText: 'Hello Usman DevHub, I want to order Domain, DNS & Cloudflare Security.',
        placeholder: 'List your domain name, registrar (Namecheap, GoDaddy, Hostinger, etc.), hosting provider (Shopify, WordPress, VPS), and any email or SSL issues...'
      };
    } else {
      return {
        badge: 'Automated CI/CD DevOps',
        title: 'Order Automated CI/CD & GitHub Actions Pipeline',
        description: 'Automated build, test, and zero-downtime deployment pipelines for any codebase or technology stack.',
        whatsappText: 'Hello Usman DevHub, I want to order Automated CI/CD & GitHub Actions Pipeline.',
        placeholder: 'Describe your Git repo workflow, deployment target (VPS, Docker, cloud server), and notification webhook preferences...'
      };
    }
  };

  const cloudScrollPosRef = useRef<number>(0);
  const isNavigatingToTypeRef = useRef<boolean>(false);
  const isRestoringTypeScrollRef = useRef<boolean>(false);

  // Scroll restoration logic
  useEffect(() => {
    if (activeDetailCloudType) {
      if (isNavigatingToTypeRef.current) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      }
    } else {
      const prevY = cloudScrollPosRef.current;
      if (prevY > 0 && isRestoringTypeScrollRef.current) {
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
  }, [activeDetailCloudType]);

  // Safe parsing helper
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
        const found = CLOUD_DEPLOYMENT_TYPES_DATA.find(
          (t) =>
            t.id === typeId ||
            t.name.toLowerCase().replace(/\s+/g, '-') === typeId ||
            t.id.includes(typeId) ||
            typeId.includes(t.id) ||
            t.name.toLowerCase().includes(typeId.replace(/-/g, ' '))
        ) || CLOUD_DEPLOYMENT_TYPES_DATA[0];

        if (found) {
          setActiveDetailCloudType((current) => {
            if (current && current.id === found.id) return current;
            if (!current) {
              if (window.scrollY > 0) {
                cloudScrollPosRef.current = window.scrollY;
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
        setActiveDetailCloudType((current) => {
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

  const handleOpenDetail = (cType: CloudDeploymentTypeInfo) => {
    if (activeDetailCloudType?.id === cType.id) return;
    cloudScrollPosRef.current = window.scrollY;
    isNavigatingToTypeRef.current = true;
    setActiveDetailCloudType(cType);
    window.location.hash = `service-${service.id}/type/${cType.id}`;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    setTimeout(() => {
      isNavigatingToTypeRef.current = false;
    }, 100);
  };

  const handleBackToOverview = () => {
    isRestoringTypeScrollRef.current = true;
    setActiveDetailCloudType(null);
    window.location.hash = `service-${service.id}`;
  };

  const handleOrderFormat = (formatName: string) => {
    setSelectedFormat(formatName);
    const formEl = document.getElementById('cloud-inquiry-section');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopyShare = () => {
    const url = window.location.origin + window.location.pathname + `#service-${service.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNameInvalid = attemptedSubmit && !clientName.trim();
  const isEmailInvalid = attemptedSubmit && (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.'));
  const isMessageInvalid = attemptedSubmit && !clientMessage.trim();

  const validateForm = (): boolean => {
    setAttemptedSubmit(true);
    if (!clientName.trim()) {
      document.getElementById('cloud-detail-name')?.focus();
      return false;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.')) {
      document.getElementById('cloud-detail-email')?.focus();
      return false;
    }
    if (!clientMessage.trim()) {
      document.getElementById('cloud-detail-message')?.focus();
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
        category: selectedFormat,
        budget: 'Discussed Per Project Scope',
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
        category: selectedFormat,
        budget: 'Discussed Per Project Scope',
        message: clientMessage.trim()
      });
      setLastOrderLinks(links);
      setSubmittedSuccess(true);
      setAttemptedSubmit(false);
    } catch (err) {
      console.error('Failed to dispatch WhatsApp order', err);
    }
  };

  // If a specific subcategory is selected, show its deep detail page
  if (activeDetailCloudType) {
    return (
      <CloudDeploymentTypeDetailPage
        cloudType={activeDetailCloudType}
        service={service}
        allCloudTypes={CLOUD_DEPLOYMENT_TYPES_DATA}
        onBackToCloud={handleBackToOverview}
        onSelectCloudType={handleOpenDetail}
        serviceProjects={serviceProjects}
      />
    );
  }

  const currentIndex = allServices.findIndex((s) => s.id === service.id);
  const prevService = currentIndex > 0 ? allServices[currentIndex - 1] : allServices[allServices.length - 1];
  const nextService = currentIndex >= 0 && currentIndex < allServices.length - 1 ? allServices[currentIndex + 1] : allServices[0];

  return (
    <div id="cloud-deployment-detail-view" className="min-h-screen bg-[#fbfbfe] text-[#0e0e0e] pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Breadcrumbs Bar */}
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
              Website Deployment &amp; Cloud Setup
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 text-xs font-medium transition-colors cursor-pointer"
              title="Copy Page Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
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

        {/* Hero Section */}
        <div className="mt-8 max-w-4xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center flex-nowrap gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1430d8]/10 text-[#1430d8] border border-[#1430d8]/20 whitespace-nowrap">
              <Cloud className="w-3.5 h-3.5 shrink-0" />
              Website Deployment &amp; Cloud Setup
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              99.99% Uptime SLA
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#1430d8] border border-blue-200">
              Supports Any Language &amp; Tech Stack
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#0e0e0e] tracking-tight leading-[1.1]">
            Website Deployment &amp; Cloud Setup
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
            High-availability Linux VPS servers, automated CI/CD pipelines, global edge hosting, and enterprise-grade DNS & SSL security — engineered for ANY programming language, framework, database, or custom codebase.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => handleOrderFormat(CLOUD_DEPLOYMENT_TYPES_DATA[0].name)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1430d8] text-white font-semibold text-xs sm:text-sm hover:bg-[#1025a8] shadow-md transition-all cursor-pointer"
            >
              <span>Request Cloud Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white border border-neutral-200 text-neutral-600 text-xs hover:border-neutral-400 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-2xs">
              <span className="block text-[11px] text-neutral-400 font-medium">Timeline</span>
              <span className="text-xs sm:text-sm font-bold text-[#0e0e0e] flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#1430d8]" />
                Discussed On Call
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-2xs">
              <span className="block text-[11px] text-neutral-400 font-medium">Security</span>
              <span className="text-xs sm:text-sm font-bold text-[#0e0e0e] flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                TLS 1.3 / HSTS
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-2xs">
              <span className="block text-[11px] text-neutral-400 font-medium">Engineer</span>
              <span className="text-xs sm:text-sm font-bold text-[#0e0e0e] flex items-center gap-1 mt-0.5">
                <Server className="w-3.5 h-3.5 text-[#1430d8]" />
                Usman Afzal
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-2xs">
              <span className="block text-[11px] text-neutral-400 font-medium">Credentials</span>
              <span className="text-xs sm:text-sm font-bold text-[#0e0e0e] flex items-center gap-1 mt-0.5">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                Encrypted Vault
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* THE 4 CLOUD SETUP CATEGORIES (Interactive Cards) */}
        {/* ========================================================================= */}
        <div className="mt-12 sm:mt-20">
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#1430d8] bg-[#1430d8]/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full">
              4 Specialized Cloud Packages
            </span>
            <h2 className="font-display text-xl sm:text-3xl lg:text-4xl font-black text-[#0e0e0e] tracking-tight mt-2">
              Choose Your Cloud & DevOps Setup
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 sm:mt-2 font-normal">
              Click any category below to view technical specifications, step-by-step pipeline, and order directly.
            </p>
          </div>

          <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {CLOUD_DEPLOYMENT_TYPES_DATA.map((cType, idx) => (
              <div
                key={cType.id}
                onClick={() => handleOpenDetail(cType)}
                className="group relative rounded-xl sm:rounded-2xl bg-white border border-neutral-200/90 hover:border-[#1430d8] p-3 sm:p-3.5 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Top Meta Bar without heavy images */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <span className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-md sm:rounded-lg bg-blue-50 text-[#1430d8] font-bold text-[10px] sm:text-[11px] flex items-center justify-center border border-blue-100 shrink-0">
                        0{idx + 1}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded-md truncate max-w-[80px] sm:max-w-none">
                        {cType.categoryPill || 'DevOps'}
                      </span>
                    </div>

                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      {cType.estimatedDelivery}
                    </span>
                  </div>

                  <h3 className="font-display text-xs sm:text-[13px] font-bold text-[#0e0e0e] group-hover:text-[#1430d8] transition-colors leading-tight">
                    {cType.name}
                  </h3>

                  <p className="text-[11px] text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
                    {cType.tagline}
                  </p>

                  {/* Point-to-point deliverables checklist on card */}
                  <div className="space-y-0.5 my-2 pt-2 border-t border-neutral-100 hidden xs:block">
                    {cType.whatClientGets.slice(0, 3).map((item, dIdx) => (
                      <div key={dIdx} className="flex items-start gap-1 text-[10px] sm:text-[11px] text-neutral-700">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug break-words">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-[#1430d8] group-hover:underline">
                    <span>Details</span>
                    <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrderFormat(cType.name);
                    }}
                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-[#1430d8] text-white text-[10px] sm:text-[11px] font-semibold hover:bg-[#1025a8] transition-colors cursor-pointer"
                  >
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* POINT-TO-POINT GUARANTEES & PROCESS */}
        {/* ========================================================================= */}
        <div className="mt-10 sm:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-neutral-200 shadow-2xs">
              <h3 className="font-display text-sm sm:text-base font-bold text-[#0e0e0e] mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Included in Every Setup
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-neutral-50 border border-neutral-100">
                  <h4 className="text-xs font-bold text-[#0e0e0e] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Zero-Downtime Deployment
                  </h4>
                  <p className="text-[11px] text-neutral-600 mt-0.5">Website stays 100% active during releases and server reboots.</p>
                </div>
                <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-neutral-50 border border-neutral-100">
                  <h4 className="text-xs font-bold text-[#0e0e0e] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Free Auto-Renewing SSL
                  </h4>
                  <p className="text-[11px] text-neutral-600 mt-0.5">Permanent HTTPS padlock with Let’s Encrypt / Cloudflare.</p>
                </div>
                <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-neutral-50 border border-neutral-100">
                  <h4 className="text-xs font-bold text-[#0e0e0e] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Domain & DNS Linking
                  </h4>
                  <p className="text-[11px] text-neutral-600 mt-0.5">Seamless connection for Namecheap, GoDaddy, Hostinger, etc.</p>
                </div>
                <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-neutral-50 border border-neutral-100">
                  <h4 className="text-xs font-bold text-[#0e0e0e] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Encrypted Credentials
                  </h4>
                  <p className="text-[11px] text-neutral-600 mt-0.5">SSH keys and root passwords delivered in a secure vault.</p>
                </div>
              </div>
            </div>

            {/* Tech Stack Badges */}
            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-neutral-200 shadow-2xs">
              <h3 className="font-display text-xs sm:text-sm font-bold text-[#0e0e0e] mb-2.5 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#1430d8]" />
                Any Language, Framework & Cloud Platform Supported
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Any Language',
                  'Docker Containerization',
                  'Node.js / Python / TypeScript',
                  'React / Vue / Next.js',
                  'Linux Nginx / Reverse Proxy',
                  'PostgreSQL / MongoDB / Redis',
                  'Vercel & Cloudflare',
                  'AWS / DigitalOcean / Hetzner',
                  'GitHub Actions CI/CD'
                ].map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md sm:rounded-lg bg-neutral-100 border border-neutral-200 text-[11px] font-semibold text-neutral-800"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Execution Process */}
          <div className="lg:col-span-5">
            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-neutral-200 shadow-2xs">
              <h3 className="font-display text-sm sm:text-base font-bold text-[#0e0e0e] mb-3 flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-[#1430d8]" />
                Step-by-Step Flow
              </h3>
              <div className="space-y-3">
                <div className="relative pl-5 pb-1 border-l-2 border-[#1430d8]/20">
                  <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-[#1430d8] border-2 border-white" />
                  <span className="text-xs font-bold text-[#0e0e0e]">Step 1: Access & Repo Audit</span>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    Share your GitHub repository, server access, or domain registrar credentials securely.
                  </p>
                </div>
                <div className="relative pl-5 pb-1 border-l-2 border-[#1430d8]/20">
                  <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-[#1430d8] border-2 border-white" />
                  <span className="text-xs font-bold text-[#0e0e0e]">Step 2: Server Setup & Deployment</span>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    Configuring server, Docker runtime, Nginx reverse proxy, and SSL certificate installation.
                  </p>
                </div>
                <div className="relative pl-5">
                  <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" />
                  <span className="text-xs font-bold text-[#0e0e0e]">Step 3: DNS Cutover & Vault Handover</span>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    Live testing, domain cutover, and full handover with rollback documentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {serviceProjects && serviceProjects.length > 0 && (
          <div id="cloud-showcase-section" className="mt-12 sm:mt-16 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-200">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Website Deployment &amp; Cloud Setup • Showcase</span>
                </div>
                <h2 className="font-display text-xl sm:text-3xl font-extrabold text-[#0e0e0e] tracking-tight">
                  Cloud &amp; Deployment Showcase
                </h2>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-bold text-[#1430d8] shadow-2xs self-start sm:self-auto">
                {filteredCloudProjects.length} of {serviceProjects.length} Projects
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
                    {filteredCloudProjects.length} {filteredCloudProjects.length === 1 ? 'project' : 'projects'}
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
                {availableCloudCategories.map((cat, idx) => {
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

            {filteredCloudProjects.length > 0 ? (
              <>
                <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {displayedCloudProjects.map((proj) => (
                    <ShowcaseProjectCard
                      key={proj.id}
                      project={proj}
                      serviceTitle="Website Deployment & Cloud Setup"
                      activeVideoId={activeVideoCardId}
                      onPlayVideo={(id) => setActiveVideoCardId(id)}
                      onStopVideo={() => setActiveVideoCardId(null)}
                      onOpenModal={(selected) => setPreviewProject(selected)}
                      idPrefix="cloud-showcase-card"
                    />
                  ))}
                </div>

                {filteredCloudProjects.length > 5 && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    {showcaseVisibleCount < filteredCloudProjects.length && (
                      <button
                        onClick={() => setShowcaseVisibleCount((prev) => Math.min(prev + 5, filteredCloudProjects.length))}
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
        {/* 6. PROJECT INQUIRY & ORDER FORM (MATCHING 3D ANIMATION VIDEO FORMAT) */}
        {/* ========================================================================= */}
        {(() => {
          const currentFormMeta = getCloudCategoryFormMeta(selectedFormat);
          return (
            <div id="cloud-inquiry-section" className="mt-8 sm:mt-16 scroll-mt-24">
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
                          <label htmlFor="cloud-detail-name" className="block text-[11px] font-semibold text-neutral-700">
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
                          id="cloud-detail-name"
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
                          <label htmlFor="cloud-detail-email" className="block text-[11px] font-semibold text-neutral-700">
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
                          id="cloud-detail-email"
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

                    {/* 2. Clean Category Selection (Logo / Product / Brand style 4 buttons) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-neutral-800 flex items-center gap-1.5">
                          <Cloud className="w-3.5 h-3.5 text-[#1430d8]" />
                          <span>Select Cloud Setup Category *</span>
                        </label>
                        <span className="text-[9px] font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          {selectedFormat}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                        {CLOUD_DEPLOYMENT_TYPES_DATA.map((t) => {
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
                        <label htmlFor="cloud-detail-message" className="block text-[11px] font-semibold text-neutral-700">
                          Project Brief &amp; Requirements *
                        </label>
                        {isMessageInvalid && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            Required
                          </span>
                        )}
                      </div>
                      <textarea
                        id="cloud-detail-message"
                        required
                        rows={3}
                        value={clientMessage}
                        onChange={(e) => setClientMessage(e.target.value)}
                        placeholder={currentFormMeta.placeholder}
                        className={`w-full px-3 py-2 rounded-lg sm:rounded-xl border text-xs sm:text-sm focus:outline-none resize-y min-h-[75px] max-h-[350px] transition-colors ${
                          isMessageInvalid
                            ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                            : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                        }`}
                      />
                      <p className="mt-0.5 text-[10px] text-neutral-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Includes zero-downtime guarantee, free SSL, and encrypted credentials vault handover.</span>
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
                        id="submit-cloud-page-gmail-btn"
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
                        id="submit-cloud-page-whatsapp-btn"
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
        {/* FAQ & DETAILS SECTION */}
        {/* ========================================================================= */}
        <div id="cloud-faq-section" className="mt-16 sm:mt-24">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-3">
              <HelpCircle className="w-3.5 h-3.5 text-[#0075f7]" />
              <span>FAQ &amp; Details</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0e0e0e] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Clear answers regarding cloud architecture, server hardening, and deployment pipelines:
            </p>
          </div>

          <div className="space-y-3 max-w-4xl">
            {cloudDeploymentFaqs.map((faq, idx) => {
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

      <ProjectDetailModal
        project={previewProject}
        serviceTitle="Website Deployment & Cloud Setup"
        onClose={() => setPreviewProject(null)}
        onOpenContact={(_srv, cat, proj) => {
          setPreviewProject(null);
          if (cat) setSelectedFormat(cat);
          if (proj) {
            setClientMessage(
              `I would like a cloud & deployment setup similar to "${proj.title}" (${cat || proj.subcategory || selectedFormat}). Here are my requirements: `
            );
          }
          document.getElementById('cloud-inquiry-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
};
