import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Globe,
  Box,
  ShoppingBag,
  Palette,
  Film,
  Cloud,
  Layers,
  Calendar,
  DollarSign,
  Send,
  ExternalLink,
  Code2,
  Cpu,
  Zap,
  Check,
  Share2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  Award,
  CheckCheck,
  Server,
  Lock,
  Tag,
  Briefcase,
  Smartphone,
  MousePointerClick,
  Plug,
  Workflow,
  HelpCircle,
  FileCheck,
  LayoutGrid,
  SlidersHorizontal,
  MessageCircle,
  AlertCircle,
  Mail
} from 'lucide-react';
import { dispatchOrderToGmail, dispatchOrderToWhatsApp } from '../utils/orderDispatch';
import { Service, Project } from '../types';
import { getServices, getProjects, addContactMessage } from '../services/storageService';
import { SERVICE_DELIVERABLES_DATA, ServicePackageDetails, ServiceDeliverableItem } from '../data/serviceDeliverables';
import { WebDevelopmentDetailView } from './WebDevelopmentDetailView';
import { ThreeDDetailView } from './ThreeDDetailView';
import { ECommerceDetailView } from './ECommerceDetailView';
import { GraphicDesignDetailView } from './GraphicDesignDetailView';
import { MotionDesignDetailView } from './MotionDesignDetailView';
import { CloudDeploymentDetailView } from './CloudDeploymentDetailView';
import { WebsiteMaintenanceDetailView } from './WebsiteMaintenanceDetailView';
import { ShowcaseProjectCard } from './ShowcaseProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { scrollToSectionWithOffset, snapScrollToElement } from '../utils/scroll';

interface ServiceDetailPageProps {
  service: Service;
  onBack: () => void;
  onSelectOtherService: (service: Service) => void;
  onOpenContact?: (servicePreset?: string, categoryPreset?: string) => void;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({
  service,
  onBack,
  onSelectOtherService,
  onOpenContact,
}) => {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedSubcategoryTab, setSelectedSubcategoryTab] = useState<string>(service?.subcategories?.[0] || '');
  const [portfolioSubcategoryFilter, setPortfolioSubcategoryFilter] = useState<string>('All');
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [activeVideoCardId, setActiveVideoCardId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const fallbackFaqs = useMemo(() => [
    {
      q: `How is the delivery timeline decided for ${service?.title || 'this service'}?`,
      a: `Project delivery timelines and milestones are customized and decided directly during our consultation based on your exact requirements, scope, and technical complexity. Once we discuss your needs, we confirm an agreed delivery timeframe before development begins.`
    },
    {
      q: 'Do you provide revisions and post-delivery support?',
      a: 'Yes, absolutely. All packages include dedicated revision cycles during development and post-launch support to ensure everything operates smoothly and meets your exact standards.'
    },
    {
      q: 'How do we get started with this service?',
      a: 'You can submit the order inquiry form above or reach out directly via WhatsApp chat. We will promptly review your project details, confirm deliverables, and kick off the design and development sprint.'
    },
    {
      q: 'Will I own all assets, code, and source files?',
      a: 'Yes, 100%. Upon project completion and final approval, full intellectual property rights, source files, assets, and deployment access are completely transferred to you.'
    },
    {
      q: 'How do project payment milestones and international transactions work?',
      a: 'Projects follow a clear 3-stage payment schedule: 25% at project start (kickoff advance), 35% mid-project upon reviewing the halfway working build or preview, and 40% upon final project completion and full handover. Payments are supported globally and locally via Remitly, Wise, Payoneer, Bank Transfer, SadaPay, JazzCash, EasyPaisa, and USDT.'
    }
  ], [service?.title]);

  // Form states for in-page custom quote / order inquiry
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState(service?.subcategories?.[0] || '');
  const [clientMessage, setClientMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setSelectedSubcategoryTab(service?.subcategories?.[0] || '');
    setSelectedSubcategory(service?.subcategories?.[0] || '');
    setPortfolioSubcategoryFilter('All');
    setSubmittedSuccess(false);
    setAttemptedSubmit(false);

    // Load active services
    const servicesList = getServices().filter((s) => s.status === 'active');
    servicesList.sort((a, b) => a.order - b.order);
    setAllServices(servicesList);

    // Load all projects
    const projectsList = getProjects();
    setAllProjects(projectsList);
  }, [service.id]);

  // Live synchronizer: Auto-update showcase projects whenever added/edited in Admin Dashboard
  useEffect(() => {
    const handleSync = () => {
      setAllProjects(getProjects());
      const servicesList = getServices().filter((s) => s.status === 'active');
      servicesList.sort((a, b) => a.order - b.order);
      setAllServices(servicesList);
    };

    window.addEventListener('usman_agency_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('usman_agency_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Current service index and next/prev navigation
  const currentIndex = allServices.findIndex((s) => s.id === service.id);
  const prevService = currentIndex > 0 ? allServices[currentIndex - 1] : allServices[allServices.length - 1];
  const nextService = currentIndex >= 0 && currentIndex < allServices.length - 1 ? allServices[currentIndex + 1] : allServices[0];

  // Specific deliverables package for this service
  const packageData: ServicePackageDetails = useMemo(() => {
    if (SERVICE_DELIVERABLES_DATA[service.id]) {
      return SERVICE_DELIVERABLES_DATA[service.id];
    }
    // If service has its own custom deliverables (e.g. 8th service)
    if (service.deliverables && service.deliverables.length > 0) {
      return {
        serviceId: service.id,
        headline: `Complete Deliverables for ${service.title}`,
        subheadline: service.description || `Specialized solutions engineered with precision, full documentation, and source code handover.`,
        guarantees: [
          { title: 'Full IP & Code Handover', badge: '100% Client Owned', description: 'Complete source code, assets, and documentation transferred to your ownership.' },
          { title: 'Quality Assurance', badge: 'Verified', description: 'Comprehensive functional, performance, and security testing before deployment.' },
          { title: 'Milestone Tracking', badge: 'Transparent', description: 'Structured visual milestone updates and organized project reviews.' },
          { title: 'Dedicated Support', badge: 'Guaranteed', description: 'Post-launch warranty and priority developer response SLA.' }
        ],
        deliverables: service.deliverables.map((deliv, idx) => ({
          id: `deliv-${idx}`,
          title: deliv,
          tag: 'Included',
          description: `Full execution, delivery, and verification of ${deliv}.`,
          format: 'Complete Deliverable',
          iconType: 'shield'
        }))
      };
    }
    // Fallback if matching by title keywords
    const serviceTitle = service.title.toLowerCase();
    if (serviceTitle.includes('web development')) return SERVICE_DELIVERABLES_DATA['srv-1'];
    if (serviceTitle.includes('3d animated') || serviceTitle.includes('3d interactive') || (serviceTitle.includes('3d') && serviceTitle.includes('web'))) return SERVICE_DELIVERABLES_DATA['srv-2'];
    if (serviceTitle.includes('e-commerce') || serviceTitle.includes('commerce')) return SERVICE_DELIVERABLES_DATA['srv-3'];
    if (serviceTitle.includes('graphic design') || serviceTitle.includes('design')) return SERVICE_DELIVERABLES_DATA['srv-4'];
    if (serviceTitle.includes('video animation') || serviceTitle.includes('motion') || (serviceTitle.includes('animation') && !serviceTitle.includes('web'))) return SERVICE_DELIVERABLES_DATA['srv-5'];
    if (serviceTitle.includes('cloud') || serviceTitle.includes('deployment')) return SERVICE_DELIVERABLES_DATA['srv-6'];
    if (serviceTitle.includes('maintenance') || serviceTitle.includes('support')) return SERVICE_DELIVERABLES_DATA['srv-7'];

    return SERVICE_DELIVERABLES_DATA['srv-1'];
  }, [service]);

  // Robust project matching strictly tailored for this service
  const serviceProjects: Project[] = useMemo(() => {
    const serviceTitle = service.title.toLowerCase().trim();
    const serviceSubs = (service.subcategories || []).map((s) => s.toLowerCase().trim());

    const matched = allProjects.filter((p) => {
      const pCat = (p.category || '').toLowerCase().trim();
      const pSub = (p.subcategory || '').toLowerCase().trim();

      // 1. Web Development
      if (serviceTitle.includes('web development')) {
        return (
          pCat === 'web development' ||
          pCat === 'website redesign & revamp' ||
          pCat.includes('redesign') ||
          pCat.includes('revamp') ||
          pSub.includes('redesign') ||
          pSub.includes('revamp') ||
          (serviceSubs.some((s) => s === pSub || pSub.includes(s) || s.includes(pSub)) &&
            !pCat.includes('motion') &&
            !pCat.includes('animation') &&
            !pCat.includes('graphic design'))
        );
      }

      // 2. 3D Animated Websites
      if (serviceTitle.includes('3d animated') || serviceTitle.includes('3d interactive')) {
        return (
          pCat === '3d animated websites' ||
          pCat === '3d interactive web experiences' ||
          pCat === '3d interactive websites' ||
          pSub === 'interactive variant studio' ||
          pSub === 'cinematic video atmosphere' ||
          pSub === 'scroll-driven video hero'
        );
      }

      // 3. E-Commerce Development
      if (serviceTitle.includes('e-commerce') || serviceTitle.includes('commerce')) {
        return (
          pCat === 'e-commerce development' ||
          pCat === 'e-commerce' ||
          serviceSubs.includes(pSub)
        );
      }

      // 4. Graphic Design
      if (serviceTitle.includes('graphic design') || serviceTitle.includes('creative design')) {
        return (
          pCat === 'graphic design' ||
          pCat === 'ui/ux & creative design' ||
          serviceSubs.includes(pSub)
        );
      }

      // 5. 3D Video Animation
      if (serviceTitle.includes('video animation') || serviceTitle.includes('motion') || serviceTitle.includes('animation')) {
        return (
          pCat === '3d video animation' ||
          pCat === '3d motion design & animation' ||
          pCat === 'motion design & animation' ||
          serviceSubs.includes(pSub)
        );
      }

      // 6. Website Deployment & Cloud Setup
      if (serviceTitle.includes('cloud') || serviceTitle.includes('deployment')) {
        return (
          pCat === 'website deployment & cloud setup' ||
          serviceSubs.includes(pSub)
        );
      }

      // 7. Website Maintenance
      if (serviceTitle.includes('maintenance') || serviceTitle.includes('support')) {
        return (
          pCat === 'website maintenance' ||
          serviceSubs.includes(pSub)
        );
      }

      return pCat === serviceTitle || pCat.includes(serviceTitle) || serviceTitle.includes(pCat);
    });

    return matched;
  }, [allProjects, service]);

  // Unique subcategories available in this service's project list for quick filter tabs
  const availablePortfolioSubcategories = useMemo(() => {
    const list = new Set<string>();
    serviceProjects.forEach((p) => {
      if (p.subcategory) list.add(p.subcategory);
    });
    return Array.from(list);
  }, [serviceProjects]);

  // Filtered showcase projects based on the subcategory filter tab
  const filteredShowcaseProjects = useMemo(() => {
    if (portfolioSubcategoryFilter === 'All') return serviceProjects;
    return serviceProjects.filter((p) => p.subcategory === portfolioSubcategoryFilter);
  }, [serviceProjects, portfolioSubcategoryFilter]);

  const [showcaseVisibleCount, setShowcaseVisibleCount] = useState<number>(5);

  useEffect(() => {
    setShowcaseVisibleCount(5);
  }, [service.id, portfolioSubcategoryFilter]);

  const displayedShowcaseProjects = useMemo(() => {
    return filteredShowcaseProjects.slice(0, showcaseVisibleCount);
  }, [filteredShowcaseProjects, showcaseVisibleCount]);

  const handleShowLess = () => {
    const targetProject = filteredShowcaseProjects[4];
    const targetEl = targetProject
      ? document.getElementById(`service-showcase-${targetProject.id}`)
      : null;
    snapScrollToElement(targetEl || document.getElementById('service-detail-showcase-controls'), () => {
      setShowcaseVisibleCount(5);
    });
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOrderProjectStyle = (proj: Project) => {
    setPreviewProject(null);
    setSelectedSubcategory(proj.subcategory || service.subcategories[0] || '');
    setClientMessage(`I am interested in a project similar to "${proj.title}" (${proj.category}${proj.subcategory ? ' - ' + proj.subcategory : ''}). Here are my custom requirements: `);
    const formElement = document.getElementById('service-inquiry-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!clientName.trim()) missing.push('Full Name / Company');
    if (!clientEmail.trim()) {
      missing.push('Work Email');
    } else if (!clientEmail.includes('@') || !clientEmail.includes('.')) {
      missing.push('Valid Email (e.g. name@domain.com)');
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
      document.getElementById('service-inquiry-name')?.focus();
      return false;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.')) {
      document.getElementById('service-inquiry-email')?.focus();
      return false;
    }
    if (!clientMessage.trim()) {
      document.getElementById('service-inquiry-message')?.focus();
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
        service: service.title,
        category: selectedSubcategory,
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
        service: service.title,
        category: selectedSubcategory,
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

  const getServiceIcon = (title: string) => {
    if (title.includes('3D Animated') || title.includes('3D Interactive')) return <Box className="w-6 h-6 text-[#0075f7]" />;
    if (title.includes('Web Development')) return <Globe className="w-6 h-6 text-[#1430d8]" />;
    if (title.includes('E-Commerce')) return <ShoppingBag className="w-6 h-6 text-[#1430d8]" />;
    if (title.includes('Graphic Design')) return <Palette className="w-6 h-6 text-[#0075f7]" />;
    if (title.includes('Motion') || title.includes('Video Animation')) return <Film className="w-6 h-6 text-[#1430d8]" />;
    if (title.includes('Cloud') || title.includes('Deployment')) return <Cloud className="w-6 h-6 text-[#0075f7]" />;
    return <ShieldCheck className="w-6 h-6 text-[#1430d8]" />;
  };

  const renderDeliverableIcon = (iconType: string) => {
    switch (iconType) {
      case 'code':
        return <Code2 className="w-4 h-4 text-[#1430d8]" />;
      case 'layout':
        return <Layers className="w-4 h-4 text-[#0075f7]" />;
      case 'zap':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'shield':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'box':
        return <Box className="w-4 h-4 text-[#0075f7]" />;
      case 'film':
        return <Film className="w-4 h-4 text-[#1430d8]" />;
      case 'database':
        return <Server className="w-4 h-4 text-purple-600" />;
      case 'globe':
        return <Globe className="w-4 h-4 text-[#1430d8]" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-[#1430d8]" />;
    }
  };

  // Tech stack tailored for each service domain
  const getTechStack = (title: string) => {
    if (title.includes('3D Animated') || title.includes('3D Interactive')) {
      return [
        { name: 'Three.js', role: '3D Scene Graph Engine' },
        { name: 'WebGL 2.0', role: 'Hardware-Accelerated Shaders' },
        { name: 'Cinema 4D', role: '3D Scene & Asset Pipeline' },
        { name: 'GLTF / GLB', role: 'Optimized Compressed Assets' },
        { name: 'React Three Fiber', role: 'Declarative Canvas State' },
        { name: 'GSAP & Motion', role: 'Fluid Physics Interpolation' }
      ];
    }
    if (title.includes('Web Development')) {
      return [
        { name: 'Custom Code', role: 'Bespoke Handcrafted Web Architecture' },
        { name: 'WordPress & CMS', role: 'Content Management System' },
        { name: 'TypeScript', role: 'Strict Type-Safe Codebase' },
        { name: 'Tailwind CSS', role: 'Responsive Utility Styling' },
        { name: 'Node.js & Edge API', role: 'Serverless Functions' },
        { name: 'PostgreSQL & Cloud', role: 'Reliable Persistent Data' }
      ];
    }
    if (title.includes('E-Commerce')) {
      return [
        { name: 'Shopify & WooCommerce', role: 'E-Commerce Storefront Platforms' },
        { name: 'Custom Code Storefronts', role: 'Headless E-Commerce Architecture' },
        { name: 'Stripe Payments', role: 'Multi-Currency Gateway' },
        { name: 'Sub-Second Cart API', role: 'Instant Cart & Dynamic Checkout' },
        { name: 'Product Catalog CMS', role: 'Dynamic Product Catalog' },
        { name: 'Google Analytics 4', role: 'E-commerce Conversion Tracking' }
      ];
    }
    if (title.includes('Graphic Design')) {
      return [
        { name: 'Figma', role: 'Master Design Systems' },
        { name: 'Adobe Illustrator', role: 'Precision Mathematical Vectors' },
        { name: 'Adobe Photoshop', role: 'High-Res Asset Compositing' },
        { name: 'Custom SVG Sets', role: 'Lossless Web Export' },
        { name: 'Typography Specs', role: 'Harmonic Editorial Scale' },
        { name: 'Brand Guide Kit', role: 'Comprehensive Asset Guidelines' }
      ];
    }
    if (title.includes('Motion')) {
      return [
        { name: 'Cinema 4D', role: 'Procedural 3D Motion Studio' },
        { name: 'Octane & Redshift', role: 'Photorealistic GPU Raytracing' },
        { name: 'Adobe After Effects', role: 'Kinetic Motion Compositing' },
        { name: 'Lottie / WebM', role: 'Transparent Web Video Codecs' },
        { name: 'DaVinci Resolve', role: 'Color Grading & Mastering' },
        { name: 'Sound Design & Foley', role: 'Spatial Audio Sync' }
      ];
    }
    if (title.includes('Cloud') || title.includes('Deployment')) {
      return [
        { name: 'Cloudflare', role: 'Edge DNS & Global WAF' },
        { name: 'AWS & Google Cloud', role: 'Elastic Cloud Compute' },
        { name: 'Docker', role: 'Isolated Containerization' },
        { name: 'Vercel / Cloud Run', role: 'Zero-Downtime Deployments' },
        { name: 'Let’s Encrypt', role: 'Automated Wildcard SSL' },
        { name: 'GitHub Actions', role: 'Automated CI/CD Workflows' }
      ];
    }
    return [
      { name: 'Datadog & Sentry', role: 'Real-time Error Tracking' },
      { name: 'UpTime Kuma', role: '60-second Ping Alarms' },
      { name: 'Security Audits', role: 'Vulnerability Patching' },
      { name: 'Lighthouse CI', role: 'Core Web Vitals Enforcement' }
    ];
  };

  const processPhases = [
    {
      step: '01',
      phase: 'Discovery & Strategic Architecture',
      desc: 'We analyze your target market, establish clear milestone deliverables, define requirements, and map user journeys before writing a single line of code.',
    },
    {
      step: '02',
      phase: 'Interactive Prototyping & UX/UI',
      desc: 'Creation of high-fidelity spatial wireframes, responsive design layouts, interactive motion passes, and aesthetic client approval milestones.',
    },
    {
      step: '03',
      phase: 'Precision Engineering & Build',
      desc: 'Modern production implementation with clean modular code, responsive layout math, asset compression, and end-to-end API integration.',
    },
    {
      step: '04',
      phase: 'QA, 60fps Performance & Audit',
      desc: 'Rigorous cross-browser, cross-device, security vulnerability scans, and Core Web Vitals optimization to guarantee sub-second loads.',
    },
    {
      step: '05',
      phase: 'Worldwide Launch & Handover',
      desc: 'Zero-downtime production deployment, DNS cutover, automated SSL activation, full source code handover, and ongoing client documentation.',
    },
  ];

  const isWebDev = service.id === 'srv-1' || service.title.toLowerCase().includes('web development');

  if (isWebDev) {
    return (
      <WebDevelopmentDetailView
        service={service}
        allServices={allServices}
        onBack={onBack}
        onSelectOtherService={onSelectOtherService}
        serviceProjects={serviceProjects}
      />
    );
  }

  const is3DInteractive =
    service.id === 'srv-2' ||
    service.title.toLowerCase().includes('3d animated') ||
    service.title.toLowerCase().includes('3d interactive');

  if (is3DInteractive) {
    return (
      <ThreeDDetailView
        service={service}
        allServices={allServices}
        onBack={onBack}
        onSelectOtherService={onSelectOtherService}
        serviceProjects={serviceProjects}
      />
    );
  }

  const isECommerce = service.id === 'srv-3' || service.title.toLowerCase().includes('e-commerce') || service.title.toLowerCase().includes('commerce');

  if (isECommerce) {
    return (
      <ECommerceDetailView
        service={service}
        allServices={allServices}
        onBack={onBack}
        onSelectOtherService={onSelectOtherService}
        serviceProjects={serviceProjects}
      />
    );
  }

  const isGraphicDesign = service.id === 'srv-4' || service.title.toLowerCase().includes('graphic design') || service.title.toLowerCase().includes('graphic');

  if (isGraphicDesign) {
    return (
      <GraphicDesignDetailView
        service={service}
        allServices={allServices}
        onBack={onBack}
        onSelectOtherService={onSelectOtherService}
        serviceProjects={serviceProjects}
      />
    );
  }

  const isMotionDesign =
    service.id === 'srv-5' ||
    service.title.toLowerCase().includes('video animation') ||
    service.title.toLowerCase().includes('motion') ||
    (service.title.toLowerCase().includes('animation') && !service.title.toLowerCase().includes('web'));

  if (isMotionDesign) {
    return (
      <MotionDesignDetailView
        service={service}
        allServices={allServices}
        onBack={onBack}
        onSelectOtherService={onSelectOtherService}
        serviceProjects={serviceProjects}
      />
    );
  }

  const isCloudDeployment =
    service.id === 'srv-6' ||
    service.title.toLowerCase().includes('cloud') ||
    service.title.toLowerCase().includes('deployment');

  if (isCloudDeployment) {
    return (
      <CloudDeploymentDetailView
        service={service}
        allServices={allServices}
        onBack={onBack}
        onSelectOtherService={onSelectOtherService}
        serviceProjects={serviceProjects}
      />
    );
  }

  const isMaintenance =
    service.id === 'srv-7' ||
    service.title.toLowerCase().includes('maintenance') ||
    service.title.toLowerCase().includes('support');

  if (isMaintenance) {
    return (
      <WebsiteMaintenanceDetailView
        service={service}
        allServices={allServices}
        onBack={onBack}
        onSelectOtherService={onSelectOtherService}
        serviceProjects={serviceProjects}
        onOpenContact={onOpenContact}
      />
    );
  }

  return (
    <div id="service-detail-page-container" className="min-h-screen bg-[#fbfbfe] text-[#0e0e0e] pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navigation & Breadcrumbs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-neutral-200">
          <button
            id="service-detail-back-button"
            onClick={onBack}
            className="group inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:text-[#1430d8] hover:border-[#1430d8]/40 shadow-2xs font-semibold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to All Services</span>
          </button>

          {/* Breadcrumb path */}
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
              {service.title}
            </span>
          </div>

          {/* Share / Copy link button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
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
        <div className="mt-8 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-[#1430d8] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#0075f7]" />
            <span className="uppercase tracking-wider text-[11px] font-bold">
              {service.order ? `Service ${String(service.order).padStart(2, '0')} • ` : ''}{service.category}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#1430d8]" />
            <span className="text-neutral-500 font-medium">Flagship Service Specification</span>
          </div>

          <h1 className="font-display text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0e0e0e] tracking-tight leading-[1.12]">
            {service.title}
          </h1>

          <p className="mt-4 text-sm sm:text-base lg:text-lg text-neutral-600 leading-relaxed font-normal max-w-3xl">
            {service.description}
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
            <div className="p-2">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Timeline</div>
              <div className="font-display text-base sm:text-lg font-bold text-[#0e0e0e] mt-0.5 flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#1430d8]" />
                <span>{service.timeline || 'Discussed Per Project Scope'}</span>
              </div>
            </div>

            <div className="p-2">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Project Scope</div>
              <div className="font-display text-base sm:text-lg font-bold text-[#0e0e0e] mt-0.5">
                Custom Architecture
              </div>
            </div>

            <div className="p-2">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">IP Ownership</div>
              <div className="font-display text-base sm:text-lg font-bold text-[#1430d8] mt-0.5">
                100% Yours
              </div>
            </div>

            <div className="p-2">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Support SLA</div>
              <div className="font-display text-base sm:text-lg font-bold text-[#0075f7] mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Direct CTA Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#service-inquiry-section"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1430d8] hover:bg-[#0075f7] text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Get Instant Quote &amp; Order</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#service-portfolio-showcase-section"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-blue-50 border border-blue-200 text-[#1430d8] hover:bg-blue-100/70 font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>View {serviceProjects.length} Showcase Projects</span>
            </a>
          </div>

          {/* Service Picture Showcase Banner */}
          {service.imageUrl && (
            <div className="mt-8 rounded-2xl sm:rounded-3xl overflow-hidden border border-neutral-200/90 shadow-sm relative aspect-[16/9] sm:aspect-[21/9] max-h-[420px] bg-neutral-900">
              <img
                src={service.imageUrl}
                alt={service.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION: WHAT YOU RECEIVE IN THIS SERVICE (COMPLETE DELIVERABLES / KIA MILE GA) */}
        {/* ========================================================================= */}
        <div id="service-deliverables-breakdown" className="mt-16 sm:mt-24">
          <div className="p-6 sm:p-10 rounded-3xl bg-white border border-neutral-200/90 shadow-md">
            {/* Header */}
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-3">
                <CheckCheck className="w-4 h-4 text-[#0075f7]" />
                <span>Complete Inclusions • Is Service Mein Kia Kia Mile Ga</span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0e0e0e] tracking-tight">
                {packageData.headline}
              </h2>
              <p className="mt-3 text-xs sm:text-base text-neutral-600 leading-relaxed">
                {packageData.subheadline}
              </p>
            </div>

            {/* 4 Core Client Assurances & Guarantees */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {packageData.guarantees.map((g, gIdx) => (
                <div
                  key={gIdx}
                  className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex flex-col justify-between hover:border-[#1430d8]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-white text-[#1430d8] shadow-2xs flex items-center justify-center font-bold text-xs">
                        <Check className="w-4 h-4 text-[#1430d8]" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100/80 text-[10px] font-bold text-[#1430d8] tracking-wide">
                        {g.badge}
                      </span>
                    </div>
                    <h3 className="font-display text-sm font-bold text-[#0e0e0e] mb-1.5">
                      {g.title}
                    </h3>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {g.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Itemized Deliverables Matrix */}
            <div className="mt-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-200">
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#0e0e0e]">
                    Itemized Deliverables Checklist ({packageData.deliverables.length} Standard Handover Items)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    All items are verified, documented, and delivered upon milestone completion.
                  </p>
                </div>
                <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full w-fit">
                  Standard Contract Terms
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {packageData.deliverables.map((item, dIdx) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#fafaff] border border-blue-50/80 hover:border-blue-200 hover:shadow-sm transition-all flex items-start gap-3.5"
                  >
                    <div className="p-2.5 rounded-xl bg-white text-[#1430d8] shadow-2xs border border-blue-100/60 shrink-0 mt-0.5">
                      {renderDeliverableIcon(item.iconType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-display text-sm font-bold text-[#0e0e0e]">
                          {item.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[10px] font-semibold text-[#1430d8]">
                          {item.tag}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                        <span className="text-neutral-400 font-medium">Delivery Format:</span>
                        <span className="font-semibold text-neutral-700 bg-white px-2 py-0.5 rounded border border-neutral-200/80">
                          {item.format}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subcategory Inclusions Explorer (Interactive Tabs) */}
            <div id="website-types-categories-section" className="mt-12 pt-8 border-t border-neutral-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#0e0e0e]">
                    {service.id === 'srv-1' ? 'Website Types & Specialized Categories' : 'Subcategory Scope Breakdown & Specializations'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Click any {service.id === 'srv-1' ? 'website type' : 'subcategory'} below to explore complete inclusions, pages, features, and technical specifications.
                  </p>
                </div>
              </div>

              {/* Subcategory Pill Selectors */}
              <div className="flex flex-wrap gap-2 pb-2">
                {service.subcategories.map((sub, sIdx) => {
                  const isActive = selectedSubcategoryTab === sub;
                  return (
                    <button
                      key={sIdx}
                      id={`btn-subcategory-tab-${sIdx}`}
                      onClick={() => setSelectedSubcategoryTab(sub)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                        isActive
                          ? 'bg-[#1430d8] text-white shadow-xs'
                          : 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700'
                      }`}
                    >
                      <span>{sub}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>

              {/* Active Subcategory Details Card */}
              {packageData.subcategoryDetails[selectedSubcategoryTab] && (() => {
                const subDetail = packageData.subcategoryDetails[selectedSubcategoryTab];
                return (
                  <div className="mt-6 rounded-3xl bg-neutral-900 text-white overflow-hidden shadow-xl border border-neutral-800 relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#1430d8]/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 p-6 sm:p-8 lg:p-10 space-y-8">
                      {/* Subcategory Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
                        <div>
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Architecture &amp; Scope Deep-Dive</span>
                          </div>
                          <h4 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            {selectedSubcategoryTab}
                          </h4>
                          <p className="mt-1 text-sm text-neutral-300 max-w-2xl leading-relaxed">
                            {subDetail.summary}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedSubcategory(selectedSubcategoryTab);
                            const formEl = document.getElementById('service-inquiry-section');
                            if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1430d8] hover:bg-[#0075f7] text-white font-semibold text-xs sm:text-sm shadow-md transition-all shrink-0 cursor-pointer"
                        >
                          <span>Order {selectedSubcategoryTab}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 1. What this type of website is */}
                      {subDetail.whatIsIt && (
                        <div className="p-5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60">
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                            <HelpCircle className="w-4 h-4" />
                            <span>What This Type of Website Is</span>
                          </div>
                          <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                            {subDetail.whatIsIt}
                          </p>
                        </div>
                      )}

                      {/* 2 & 3: What the client gets & Pages / sections included */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* What the client gets */}
                        <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>What the Client Gets</span>
                            </div>
                            <div className="space-y-2">
                              {(subDetail.whatClientGets || subDetail.keyDeliverables).map((item, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs text-neutral-200">
                                  <div className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                                    <Check className="w-2.5 h-2.5" />
                                  </div>
                                  <span className="leading-snug font-medium">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Pages / sections included */}
                        <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2.5">
                              <Layers className="w-4 h-4" />
                              <span>Pages / Sections Included</span>
                            </div>
                            <div className="space-y-2">
                              {(subDetail.pagesIncluded || subDetail.keyDeliverables).map((page, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs text-neutral-200">
                                  <div className="w-4 h-4 rounded bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                                    <FileCheck className="w-2.5 h-2.5" />
                                  </div>
                                  <span className="leading-snug font-medium">{page}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4. Key features */}
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span>Key Features</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(subDetail.keyFeatures || subDetail.keyDeliverables).map((feat, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center gap-2.5"
                            >
                              <Check className="w-4 h-4 text-blue-400 shrink-0" />
                              <span className="text-xs font-medium text-neutral-200 leading-snug">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 5, 6, 7: Design/Responsive, Animations, Forms/Integrations */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        {/* Design & Responsive */}
                        <div className="p-4 rounded-xl bg-neutral-800/40 border border-neutral-700/40">
                          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 mb-1.5">
                            <Smartphone className="w-4 h-4 text-blue-400" />
                            <span>Design &amp; Responsive</span>
                          </div>
                          <p className="text-xs text-neutral-400 leading-relaxed">
                            {subDetail.designAndResponsive || 'Fully responsive mobile-first architecture adapted for smartphones, tablets, and 4K displays.'}
                          </p>
                        </div>

                        {/* Animations & Interactions */}
                        <div className="p-4 rounded-xl bg-neutral-800/40 border border-neutral-700/40">
                          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 mb-1.5">
                            <MousePointerClick className="w-4 h-4 text-indigo-400" />
                            <span>Animations &amp; Interactions</span>
                          </div>
                          <p className="text-xs text-neutral-400 leading-relaxed">
                            {subDetail.animationsInteractions || 'Smooth entrance fades, hover transitions, and refined micro-interactions.'}
                          </p>
                        </div>

                        {/* Forms & Integrations */}
                        <div className="p-4 rounded-xl bg-neutral-800/40 border border-neutral-700/40">
                          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 mb-1.5">
                            <Plug className="w-4 h-4 text-emerald-400" />
                            <span>Forms &amp; Integrations</span>
                          </div>
                          <div className="space-y-1">
                            {(subDetail.formsAndIntegrations || ['Contact Form with anti-spam', 'Direct WhatsApp integration']).map((formItem, fIdx) => (
                              <div key={fIdx} className="text-xs text-neutral-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>{formItem}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Best For / Ideal Target */}
                      <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="text-neutral-400">
                          <strong className="text-white">Best For: </strong>
                          <span>{subDetail.idealFor}</span>
                        </div>
                        <div className="text-xs text-neutral-400 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-400" />
                          <span>Custom Architecture Handover</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Tech Stack & 5-Phase Process Grid */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Production Toolchain */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-neutral-900 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0075f7]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                <Cpu className="w-4 h-4" />
                <span>Production Toolchain</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight mb-4">
                Core Technologies &amp; Frameworks
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 mb-6">
                We reject bloated legacy templates in favor of modern edge frameworks scoring 99+ on Core Web Vitals.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getTechStack(service.title).map((tech, tIdx) => (
                  <div
                    key={tIdx}
                    className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-white">{tech.name}</span>
                      <Code2 className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span className="text-[11px] text-neutral-400 mt-1">{tech.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5-Phase Sprint Flow */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4" />
              <span>Milestone Execution</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#0e0e0e] tracking-tight mb-4">
              Our 5-Stage Delivery Process
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 mb-6">
              Complete visibility from discovery to final production handover.
            </p>

            <div className="space-y-3.5">
              {processPhases.map((phase, pIdx) => (
                <div key={pIdx} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50/90 border border-neutral-100">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1430d8] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {phase.step}
                  </div>
                  <div>
                    <h4 className="font-display text-xs sm:text-sm font-bold text-[#0e0e0e]">
                      {phase.phase}
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                      {phase.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION: ALL PORTFOLIO & SHOWCASE PROJECTS FOR THIS SERVICE */}
        {/* ========================================================================= */}
        <div id="service-portfolio-showcase-section" className="mt-16 sm:mt-24 scroll-mt-24 sm:scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>{service.title} • Showcase</span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0e0e0e] tracking-tight">
                {service.title} Showcase
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-2xl">
                Every project below was built within the scope of <strong>{service.title}</strong>. Browse live previews, outcomes, and project details by category.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-bold text-[#1430d8] shadow-2xs">
                {filteredShowcaseProjects.length} of {serviceProjects.length} Projects
              </span>
            </div>
          </div>

          {/* Compact Category Filter Bar - Single Row Layout */}
          {availablePortfolioSubcategories.length > 1 && (
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
                    {filteredShowcaseProjects.length} {filteredShowcaseProjects.length === 1 ? 'project' : 'projects'}
                  </span>
                </div>

                {portfolioSubcategoryFilter !== 'All' && (
                  <button
                    onClick={() => setPortfolioSubcategoryFilter('All')}
                    className="text-[11px] sm:text-xs font-semibold text-[#1430d8] hover:text-[#0075f7] bg-blue-50/80 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Show All ({serviceProjects.length})
                  </button>
                )}
              </div>

              {/* All category types in a sleek horizontal row */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5 w-full touch-pan-x">
                <button
                  onClick={() => setPortfolioSubcategoryFilter('All')}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    portfolioSubcategoryFilter === 'All'
                      ? 'bg-[#1430d8] text-white shadow-xs font-bold'
                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950 border border-neutral-200/80 hover:border-neutral-300'
                  }`}
                >
                  <span>All</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                      portfolioSubcategoryFilter === 'All'
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-neutral-500 border border-neutral-200/70'
                    }`}
                  >
                    {serviceProjects.length}
                  </span>
                </button>
                {availablePortfolioSubcategories.map((sub, sIdx) => {
                  const count = serviceProjects.filter((p) => p.subcategory === sub).length;
                  const isActive = portfolioSubcategoryFilter === sub;
                  return (
                    <button
                      key={sIdx}
                      onClick={() => setPortfolioSubcategoryFilter(sub)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-[#1430d8] text-white shadow-xs font-bold'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950 border border-neutral-200/80 hover:border-neutral-300'
                      }`}
                    >
                      <span>{sub}</span>
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
          )}

          {/* Projects Grid - Showing projects for this service with 5-item pagination */}
          {filteredShowcaseProjects.length > 0 ? (
            <>
              <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {displayedShowcaseProjects.map((project) => (
                  <ShowcaseProjectCard
                    key={project.id}
                    project={project}
                    activeVideoId={activeVideoCardId}
                    onPlayVideo={(id) => setActiveVideoCardId(id)}
                    onStopVideo={() => setActiveVideoCardId(null)}
                    onOpenModal={(proj) => setPreviewProject(proj)}
                    idPrefix="service-showcase"
                    serviceTitle={service.title}
                  />
                ))}
              </div>

              {/* Show More / Show Less Pagination when items > 5 */}
              {filteredShowcaseProjects.length > 5 && (
                <div id="service-detail-showcase-controls" className="mt-8 flex flex-col items-center gap-3 scroll-mb-6 sm:scroll-mb-8">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {showcaseVisibleCount < filteredShowcaseProjects.length && (
                      <button
                        onClick={() => setShowcaseVisibleCount((prev) => Math.min(prev + 5, filteredShowcaseProjects.length))}
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
                No projects found for filter &quot;{portfolioSubcategoryFilter}&quot;
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Select &quot;All&quot; to view the complete catalog for {service.title}.
              </p>
              <button
                onClick={() => setPortfolioSubcategoryFilter('All')}
                className="mt-4 px-4 py-2 rounded-xl bg-[#1430d8] text-white text-xs font-semibold"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* EMBEDDED CUSTOM QUOTE & ORDER FORM */}
        {/* ========================================================================= */}
        <div id="service-inquiry-section" className="mt-12 sm:mt-20 max-w-3xl mx-auto">
          <div className="p-4 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-lg relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] sm:text-xs font-semibold text-[#1430d8] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct Order &amp; Custom Proposal</span>
            </div>

            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0e0e0e] tracking-tight leading-snug">
              Order {service.title} Or Request Custom Quote
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
                  We received your inquiry for <strong>{service.title}</strong>. Founder Muhammad Usman Afzal will reach out via email shortly.
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="service-inquiry-name" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
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
                      id="service-inquiry-name"
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
                      <label htmlFor="service-inquiry-email" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
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
                      id="service-inquiry-email"
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

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] sm:text-xs font-semibold text-neutral-700">
                      Specific Subcategory / Focus *
                    </label>
                    <span className="text-[9px] font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {selectedSubcategory}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                    {service.subcategories.map((sub, idx) => {
                      const isSelected = selectedSubcategory === sub;
                      const isFullOdd = service.subcategories.length === 3 && idx === 2;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSubcategory(sub)}
                          className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer font-semibold text-xs ${
                            isFullOdd ? 'col-span-2 sm:col-span-1' : 'col-span-1'
                          } ${
                            isSelected
                              ? 'bg-[#1430d8] text-white border-[#1430d8] shadow-xs ring-2 ring-[#1430d8]/20'
                              : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          <span className="truncate w-full block">{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="service-inquiry-message" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                      Project Brief &amp; Required Deliverables *
                    </label>
                    {isMessageInvalid && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Required
                      </span>
                    )}
                  </div>
                  <textarea
                    id="service-inquiry-message"
                    rows={3}
                    required
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    placeholder="Describe your desired deliverables, deadline, inspiration links, or technical preferences..."
                    className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] focus:outline-none transition-all resize-y min-h-[75px] max-h-[350px] ${
                      isMessageInvalid
                        ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200'
                        : 'bg-neutral-50 border-neutral-200 focus:border-[#1430d8]'
                    }`}
                  />
                </div>

                <div className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200/80 flex flex-wrap items-center justify-between gap-2 text-[10.5px] sm:text-[11px] text-neutral-600 tabular-nums">
                  <span className="font-semibold text-neutral-700">Payment Schedule:</span>
                  <span>
                    <strong className="text-[#1430d8]">25%</strong> Project Start · <strong className="text-[#1430d8]">35%</strong> Mid-Project · <strong className="text-[#1430d8]">40%</strong> Final Handover
                  </span>
                </div>

                {/* 4. Action Buttons (Side by Side: Send Order via Gmail & Order via WhatsApp) */}
                <div className="pt-0.5">
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    <button
                      type="submit"
                      id="submit-service-page-gmail-btn"
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
                      id="submit-service-page-whatsapp-btn"
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
        {/* FAQ & DETAILS SECTION */}
        {/* ========================================================================= */}
        <div id="service-faq-section" className="mt-16 sm:mt-24">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1430d8] uppercase tracking-wider mb-3">
              <HelpCircle className="w-3.5 h-3.5 text-[#0075f7]" />
              <span>FAQ &amp; Details</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0e0e0e] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Clear answers regarding deliverables, project workflow, and specifications:
            </p>
          </div>

          <div className="space-y-3 max-w-4xl">
            {fallbackFaqs.map((faq, idx) => {
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

      {/* Quick Project Preview Modal */}
      <ProjectDetailModal
        project={previewProject}
        onClose={() => setPreviewProject(null)}
        serviceTitle={service.title}
        onOpenContact={(_srv, _cat, proj) => {
          const target = proj || previewProject;
          if (target) {
            handleOrderProjectStyle(target);
          }
        }}
      />
    </div>
  );
};
