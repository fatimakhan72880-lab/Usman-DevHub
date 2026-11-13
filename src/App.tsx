import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { ServiceDetailPage } from './components/ServiceDetailPage';
import { PortfolioSection } from './components/PortfolioSection';
import { FounderSection } from './components/FounderSection';
import { ReferralSection } from './components/ReferralSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AdminDashboard, AdminTabType } from './components/AdminDashboard';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { SEOHead } from './components/SEOHead';
import { TechStackTicker } from './components/TechStackTicker';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FAQSection } from './components/FAQSection';
import { Service, OrderAgreement } from './types';
import { getServices, captureReferralFromUrl, getOrderAgreementById, getOrderAgreements, getAdminAuthStatus, getAdminAuthHeaders, verifyAdminSessionOnServer } from './services/storageService';
import { OrderAgreementModal } from './components/OrderAgreementModal';
import { OrderAgreementStudio } from './components/OrderAgreementStudio';
import { scrollToSectionWithOffset } from './utils/scroll';
import { WEBSITE_MAINTENANCE_TYPES_DATA } from './data/websiteMaintenanceTypes';
import { WEBSITE_TYPES_DATA } from './data/websiteTypes';
import { THREE_D_EXPERIENCE_TYPES_DATA } from './data/threeDExperienceTypes';
import { ECOMMERCE_TYPES_DATA } from './data/ecommerceTypes';
import { GRAPHIC_DESIGN_TYPES_DATA } from './data/graphicDesignTypes';
import { MOTION_DESIGN_TYPES_DATA } from './data/motionDesignTypes';
import { CLOUD_DEPLOYMENT_TYPES_DATA } from './data/cloudDeploymentTypes';

interface AdminRouteIntent {
  isAdminRoute: boolean;
  targetTab: AdminTabType;
  targetOrderId?: string;
  targetStudio: boolean;
}

function detectAdminRouteFromUrl(): AdminRouteIntent {
  if (typeof window === 'undefined') {
    return { isAdminRoute: false, targetTab: 'overview', targetStudio: false };
  }

  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);

  let isAdminRoute = false;
  let targetTab: AdminTabType = 'overview';
  let targetOrderId: string | undefined = undefined;
  let targetStudio = false;

  // 1. Direct pathname detection (e.g. /admin, /dashboard, /orders, /order/..., /messages, /security, etc.)
  if (path.startsWith('/admin') || path.startsWith('/dashboard')) {
    isAdminRoute = true;
    const prefix = path.startsWith('/admin') ? '/admin' : '/dashboard';
    const cleanSub = path.replace(prefix, '').replace(/^\/+/, '').split('/')[0];
    if (cleanSub === 'orders' || cleanSub === 'agreements') {
      targetTab = 'orders';
    } else if (cleanSub === 'messages' || cleanSub === 'inquiries') {
      targetTab = 'messages';
    } else if (cleanSub === 'services') {
      targetTab = 'services';
    } else if (cleanSub === 'portfolio' || cleanSub === 'work' || cleanSub === 'showcase') {
      targetTab = 'portfolio';
    } else if (cleanSub === 'leadership' || cleanSub === 'team') {
      targetTab = 'leadership';
    } else if (cleanSub === 'reviews' || cleanSub === 'testimonials') {
      targetTab = 'reviews';
    } else if (cleanSub === 'referrals' || cleanSub === 'partners' || cleanSub === 'tokens') {
      targetTab = 'referrals';
    } else if (cleanSub === 'seo' || cleanSub === 'growth') {
      targetTab = 'seo';
    } else if (cleanSub === 'security' || cleanSub === 'password' || cleanSub === 'vault') {
      targetTab = 'security';
    } else if (cleanSub === 'order-studio' || cleanSub === 'agreement-studio' || cleanSub === 'studio') {
      targetTab = 'orders';
      targetStudio = true;
    }
  } else if (
    path === '/orders' ||
    path === '/agreements' ||
    path.startsWith('/orders/') ||
    path.startsWith('/order/') ||
    path.startsWith('/agreements/') ||
    path.startsWith('/agreement/')
  ) {
    isAdminRoute = true;
    targetTab = 'orders';
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[1]) {
      targetOrderId = parts[1].trim().toUpperCase();
    }
  } else if (path === '/order-studio' || path === '/agreement-studio' || path === '/studio') {
    isAdminRoute = true;
    targetTab = 'orders';
    targetStudio = true;
  } else if (path === '/messages' || path === '/inquiries' || path === '/admin-messages') {
    isAdminRoute = true;
    targetTab = 'messages';
  } else if (path === '/security' || path === '/password-vault' || path === '/vault') {
    isAdminRoute = true;
    targetTab = 'security';
  } else if (path === '/login' || path === '/admin-login' || path === '/owner' || path === '/executive') {
    isAdminRoute = true;
    targetTab = 'overview';
  } else if (path === '/referrals-admin' || path === '/tokens-admin') {
    isAdminRoute = true;
    targetTab = 'referrals';
  } else if (path === '/reviews-admin') {
    isAdminRoute = true;
    targetTab = 'reviews';
  } else if (path === '/services-admin') {
    isAdminRoute = true;
    targetTab = 'services';
  } else if (path === '/portfolio-admin') {
    isAdminRoute = true;
    targetTab = 'portfolio';
  } else if (path === '/leadership-admin') {
    isAdminRoute = true;
    targetTab = 'leadership';
  }

  // 2. Query param detection (?admin=1, ?tab=orders, ?page=..., ?view=..., ?order=UDH-ORD-..., ?studio=1)
  if (
    searchParams.get('admin') === '1' ||
    searchParams.get('admin') === 'true' ||
    searchParams.get('login') === '1' ||
    searchParams.get('login') === 'true' ||
    searchParams.get('auth') === 'admin'
  ) {
    isAdminRoute = true;
  }
  const qTab = (searchParams.get('tab') || searchParams.get('page') || searchParams.get('view'))?.toLowerCase();
  if (qTab) {
    if (qTab === 'admin' || qTab === 'dashboard' || qTab === 'overview') {
      isAdminRoute = true;
      targetTab = 'overview';
    } else if (qTab === 'orders' || qTab === 'agreements') {
      isAdminRoute = true;
      targetTab = 'orders';
    } else if (qTab === 'messages' || qTab === 'inquiries') {
      isAdminRoute = true;
      targetTab = 'messages';
    } else if (qTab === 'services-admin') {
      isAdminRoute = true;
      targetTab = 'services';
    } else if (qTab === 'portfolio-admin') {
      isAdminRoute = true;
      targetTab = 'portfolio';
    } else if (qTab === 'leadership-admin') {
      isAdminRoute = true;
      targetTab = 'leadership';
    } else if (qTab === 'reviews-admin') {
      isAdminRoute = true;
      targetTab = 'reviews';
    } else if (qTab === 'referrals-admin' || qTab === 'tokens' || qTab === 'partner-tokens') {
      isAdminRoute = true;
      targetTab = 'referrals';
    } else if (qTab === 'seo' || qTab === 'growth') {
      isAdminRoute = true;
      targetTab = 'seo';
    } else if (qTab === 'security' || qTab === 'password' || qTab === 'vault') {
      isAdminRoute = true;
      targetTab = 'security';
    }
  }
  const qOrder = searchParams.get('order');
  if (qOrder && qOrder.trim()) {
    isAdminRoute = true;
    targetTab = 'orders';
    targetOrderId = qOrder.trim().toUpperCase();
  }
  if (searchParams.get('studio') === '1' || searchParams.get('studio') === 'true') {
    isAdminRoute = true;
    targetTab = 'orders';
    targetStudio = true;
  }

  // 3. Hash-based detection (#admin, #dashboard, #admin/orders, #order-..., #order-studio, etc.)
  if (
    hash === '#admin' ||
    hash === '#dashboard' ||
    hash === '#login' ||
    hash === '#admin-login' ||
    hash === '#owner' ||
    hash === '#executive' ||
    hash.startsWith('#admin/') ||
    hash.startsWith('#admin-') ||
    hash.startsWith('#dashboard/') ||
    hash.startsWith('#dashboard-')
  ) {
    isAdminRoute = true;
    const sub = hash.replace(/^#(admin|dashboard)[\/\-]*/, '').trim();
    if (sub === 'orders' || sub === 'agreements') targetTab = 'orders';
    else if (sub === 'messages' || sub === 'inquiries') targetTab = 'messages';
    else if (sub === 'services') targetTab = 'services';
    else if (sub === 'portfolio' || sub === 'work' || sub === 'showcase') targetTab = 'portfolio';
    else if (sub === 'leadership' || sub === 'team') targetTab = 'leadership';
    else if (sub === 'reviews' || sub === 'testimonials') targetTab = 'reviews';
    else if (sub === 'referrals' || sub === 'partners' || sub === 'tokens') targetTab = 'referrals';
    else if (sub === 'media' || sub === 'cdn') targetTab = 'portfolio';
    else if (sub === 'seo' || sub === 'growth') targetTab = 'seo';
    else if (sub === 'security' || sub === 'password' || sub === 'vault') targetTab = 'security';
    else if (sub === 'overview') targetTab = 'overview';
    else if (sub === 'studio' || sub === 'order-studio' || sub === 'agreement-studio') {
      targetTab = 'orders';
      targetStudio = true;
    }
  } else if (hash === '#order-studio' || hash === '#agreement-studio') {
    isAdminRoute = true;
    targetTab = 'orders';
    targetStudio = true;
  } else if (
    hash.startsWith('#order-') ||
    hash === '#order' ||
    hash === '#orders' ||
    hash === '#agreement' ||
    hash === '#agreements' ||
    hash === '#order-review' ||
    hash === '#track-order'
  ) {
    isAdminRoute = true;
    targetTab = 'orders';
    if (hash.startsWith('#order-')) {
      targetOrderId = hash.replace('#order-', '').trim().toUpperCase();
    }
  } else if (hash === '#messages' || hash === '#inquiries') {
    isAdminRoute = true;
    targetTab = 'messages';
  } else if (hash === '#security' || hash === '#password-vault' || hash === '#vault') {
    isAdminRoute = true;
    targetTab = 'security';
  } else if (
    hash === '#referrals-admin' ||
    hash === '#tokens-admin' ||
    hash === '#reviews-admin' ||
    hash === '#services-admin' ||
    hash === '#portfolio-admin' ||
    hash === '#leadership-admin'
  ) {
    isAdminRoute = true;
    const cleanHash = hash.replace('#', '').replace('-admin', '');
    if (cleanHash === 'referrals' || cleanHash === 'tokens') targetTab = 'referrals';
    else if (cleanHash === 'reviews') targetTab = 'reviews';
    else if (cleanHash === 'services') targetTab = 'services';
    else if (cleanHash === 'portfolio') targetTab = 'portfolio';
    else if (cleanHash === 'leadership') targetTab = 'leadership';
  }

  return { isAdminRoute, targetTab, targetOrderId, targetStudio };
}

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminRequestedTab, setAdminRequestedTab] = useState<AdminTabType>('overview');
  const [adminRequestedOrderId, setAdminRequestedOrderId] = useState<string | undefined>(undefined);
  const [adminRequestedStudio, setAdminRequestedStudio] = useState<boolean>(false);
  const [contactServicePreset, setContactServicePreset] = useState<string>('Web Development');
  const [contactCategoryPreset, setContactCategoryPreset] = useState<string>('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [clientViewOrder, setClientViewOrder] = useState<OrderAgreement | null>(null);
  const [editingOrderInStudio, setEditingOrderInStudio] = useState<OrderAgreement | null>(null);

  // Keep track of user's exact scroll position on the home page and last active service
  const homeScrollPosRef = useRef<number>(0);
  const lastActiveServiceIdRef = useRef<string | null>(null);
  const isNavigatingToServiceRef = useRef<boolean>(false);
  const isRestoringScrollRef = useRef<boolean>(false);
  const pendingTargetSectionRef = useRef<string | null>(null);

  // Disable browser automatic scroll restoration and capture any ?ref=UDH-... partner token from URL
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    captureReferralFromUrl();
  }, []);

  // Continuously track home scroll position while on the home page
  useEffect(() => {
    if (!selectedService) {
      const handleWindowScroll = () => {
        // Only record scroll while user is actively browsing home, not during programmatic transitions
        if (!isNavigatingToServiceRef.current && !isRestoringScrollRef.current) {
          homeScrollPosRef.current = window.scrollY;
          if (window.scrollY > 0) {
            sessionStorage.setItem('usman_devhub_home_scroll', String(window.scrollY));
          }
        }
      };
      window.addEventListener('scroll', handleWindowScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleWindowScroll);
    }
  }, [selectedService]);

  // Synchronously restore exact previous scroll position BEFORE browser paint
  useLayoutEffect(() => {
    if (!selectedService && isRestoringScrollRef.current) {
      const targetSec = pendingTargetSectionRef.current;
      pendingTargetSectionRef.current = null;

      // If navigating specifically to Hero or top
      if (targetSec === 'hero' || targetSec === 'top') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        isRestoringScrollRef.current = false;
        return;
      }

      // Check if target is a specific service card (e.g. service-card-srv-4 for Graphic Design)
      if (targetSec && targetSec.startsWith('service-card-')) {
        const cardEl = document.getElementById(targetSec);
        if (cardEl) {
          const rect = cardEl.getBoundingClientRect();
          const targetY = window.scrollY + rect.top - 110; // offset for floating navbar
          window.scrollTo({ top: Math.max(0, targetY), left: 0, behavior: 'instant' as ScrollBehavior });

          let attempts = 0;
          let rafId: number;
          const pinCard = () => {
            attempts++;
            const el = document.getElementById(targetSec);
            if (el) {
              const curRect = el.getBoundingClientRect();
              const newY = window.scrollY + curRect.top - 110;
              if (Math.abs(curRect.top - 110) > 4 && attempts < 15) {
                window.scrollTo({ top: Math.max(0, newY), left: 0, behavior: 'instant' as ScrollBehavior });
                rafId = requestAnimationFrame(pinCard);
              } else {
                isRestoringScrollRef.current = false;
              }
            } else {
              isRestoringScrollRef.current = false;
            }
          };
          rafId = requestAnimationFrame(pinCard);
          return () => {
            cancelAnimationFrame(rafId);
            isRestoringScrollRef.current = false;
          };
        }
      }

      // If user clicked another specific anchor like 'contact', 'work', 'referral'
      if (targetSec && targetSec !== 'services') {
        const el = document.getElementById(targetSec);
        if (el) {
          scrollToSectionWithOffset(el, false);
          isRestoringScrollRef.current = false;
          return;
        }
      }

      // Otherwise restore exact scroll position from where the user clicked into the service
      const rawStored = sessionStorage.getItem('usman_devhub_home_scroll');
      const savedY =
        homeScrollPosRef.current > 0
          ? homeScrollPosRef.current
          : rawStored
          ? Number(rawStored)
          : 0;

      if (savedY > 0) {
        window.scrollTo({ top: savedY, left: 0, behavior: 'instant' as ScrollBehavior });

        // Keep position pinned over animation frames to prevent any post-render layout shifts
        let attempts = 0;
        let rafId: number;
        const enforcePosition = () => {
          attempts++;
          if (Math.abs(window.scrollY - savedY) > 2 && attempts < 15) {
            window.scrollTo({ top: savedY, left: 0, behavior: 'instant' as ScrollBehavior });
            rafId = requestAnimationFrame(enforcePosition);
          } else {
            isRestoringScrollRef.current = false;
          }
        };
        rafId = requestAnimationFrame(enforcePosition);

        return () => {
          cancelAnimationFrame(rafId);
          isRestoringScrollRef.current = false;
        };
      } else {
        isRestoringScrollRef.current = false;
      }
    }
  }, [selectedService]);

  // Sync state with URL hash & path for true page routing & browser back/forward buttons
  useEffect(() => {
    const handleHash = () => {
      captureReferralFromUrl();
      const hash = window.location.hash;

      // 1. Strict Authentication Guard for ANY Admin panel page, tab, order, or studio
      const adminIntent = detectAdminRouteFromUrl();

      if (adminIntent.isAdminRoute) {
        const isUserAdmin = getAdminAuthStatus();
        setAdminRequestedTab(adminIntent.targetTab);
        setAdminRequestedOrderId(adminIntent.targetOrderId);
        setAdminRequestedStudio(adminIntent.targetStudio);

        if (!isUserAdmin) {
          // STRICT SECURITY REQUIREMENT:
          // Visitor requested an admin page, tab, order agreement, or studio via URL
          // WITHOUT LOGIN, ZERO SENSITIVE DATA IS REVEALED!
          // Demand owner login first by popping up the Admin Login portal!
          setClientViewOrder(null);
          setEditingOrderInStudio(null);
          setIsAdminOpen(true);
        } else {
          // User has an active, cryptographically verified owner session
          setIsAdminOpen(true);

          if (adminIntent.targetOrderId) {
            let orderIdOrNum = adminIntent.targetOrderId;
            const foundOrder = getOrderAgreementById(orderIdOrNum);
            if (foundOrder) {
              if (adminIntent.targetStudio) {
                setEditingOrderInStudio(foundOrder);
              } else {
                setClientViewOrder(foundOrder);
              }
            } else {
              fetch(`/api/orders/${encodeURIComponent(orderIdOrNum)}`, {
                headers: getAdminAuthHeaders(false)
              })
                .then((res) => (res.ok ? res.json() : null))
                .then((json) => {
                  if (json?.data) {
                    if (adminIntent.targetStudio) {
                      setEditingOrderInStudio(json.data);
                    } else {
                      setClientViewOrder(json.data);
                    }
                  }
                })
                .catch(() => {});
            }
          }
        }
      }

      if (hash.startsWith('#service-')) {
        const fullServicePath = hash.replace('#service-', '');
        const serviceIdOrSlug = fullServicePath.split('/')[0];
        const services = getServices();
        const found = services.find(
          (s) =>
            s.id === serviceIdOrSlug ||
            s.title.toLowerCase().replace(/\s+/g, '-') === serviceIdOrSlug.toLowerCase() ||
            s.title.toLowerCase().includes(serviceIdOrSlug.toLowerCase())
        );
        if (found) {
          lastActiveServiceIdRef.current = found.id;
          sessionStorage.setItem('usman_devhub_last_service_id', found.id);
          setSelectedService((current) => {
            if (current && current.id === found.id) {
              return current;
            }
            if (!current) {
              if (window.scrollY > 0) {
                homeScrollPosRef.current = window.scrollY;
                sessionStorage.setItem('usman_devhub_home_scroll', String(window.scrollY));
              }
              isNavigatingToServiceRef.current = true;
            }
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
            setTimeout(() => {
              isNavigatingToServiceRef.current = false;
            }, 100);
            return found;
          });
        }
      } else if (!hash.includes('service')) {
        setSelectedService(null);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  const handleOpenServiceDetail = (service: Service) => {
    if (selectedService?.id === service.id) return;
    const currentY = window.scrollY;
    homeScrollPosRef.current = currentY;
    lastActiveServiceIdRef.current = service.id;
    sessionStorage.setItem('usman_devhub_home_scroll', String(currentY));
    sessionStorage.setItem('usman_devhub_last_service_id', service.id);
    isNavigatingToServiceRef.current = true;

    setSelectedService(service);
    if (!window.location.hash.startsWith(`#service-${service.id}`)) {
      window.location.hash = `service-${service.id}`;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

    setTimeout(() => {
      isNavigatingToServiceRef.current = false;
    }, 100);
  };

  const handleNavigateToHero = () => {
    if (selectedService) {
      isRestoringScrollRef.current = false;
      homeScrollPosRef.current = 0;
      sessionStorage.setItem('usman_devhub_home_scroll', '0');
      pendingTargetSectionRef.current = 'hero';
      setSelectedService(null);
      if (window.location.hash.startsWith('#service')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      });
    } else {
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      const heroSection = document.getElementById('hero') || document.getElementById('studio');
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleBackToHome = (sectionId?: string) => {
    if (sectionId === 'hero') {
      handleNavigateToHero();
      return;
    }
    isRestoringScrollRef.current = true;

    // Target the specific service card so user lands exactly on that service, not on Web Development
    const currentServiceId =
      selectedService?.id ||
      lastActiveServiceIdRef.current ||
      sessionStorage.getItem('usman_devhub_last_service_id');

    if (sectionId && sectionId !== 'services') {
      pendingTargetSectionRef.current = sectionId;
      window.location.hash = sectionId;
    } else {
      if (currentServiceId) {
        pendingTargetSectionRef.current = `service-card-${currentServiceId}`;
      } else {
        pendingTargetSectionRef.current = 'services';
      }
      if (window.location.hash.startsWith('#service')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
    setSelectedService(null);
  };

  const handleSelectServiceByKeyword = (keyword: string) => {
    const services = getServices();
    const found = services.find((s) => s.title.toLowerCase().includes(keyword.toLowerCase()));
    if (found) {
      handleOpenServiceDetail(found);
    } else {
      handleBackToHome('services');
    }
  };

  const handleOpenContact = (
    servicePreset?: string,
    categoryPreset?: string,
    options?: { instant?: boolean; targetForm?: boolean }
  ) => {
    let resolvedService = servicePreset;
    let resolvedCategory = categoryPreset;

    // If servicePreset includes both service and category like "Web Development - Portfolio Websites" or "Website Maintenance (Bug Fixing)"
    if (resolvedService && !resolvedCategory && (resolvedService.includes(' - ') || resolvedService.includes('('))) {
      const parts = resolvedService.split(/ - |\(/);
      resolvedService = parts[0].trim();
      resolvedCategory = parts[1]?.replace(/\)/, '').trim();
    }

    // If category is not directly passed, check if user is currently on a specific subcategory type in URL hash
    if (!resolvedCategory && window.location.hash.includes('/type/')) {
      const hash = window.location.hash;
      const typeSlug = hash.split('/type/')[1]?.split('/')[0]?.split('?')[0]?.split('#')[0]?.toLowerCase();
      if (typeSlug) {
        // 1. Website Maintenance
        const maintenanceMatch = WEBSITE_MAINTENANCE_TYPES_DATA.find(
          (t) => t.id.toLowerCase() === typeSlug || t.name.toLowerCase().replace(/\s+/g, '-') === typeSlug
        );
        if (maintenanceMatch) {
          resolvedService = 'Website Maintenance';
          resolvedCategory = maintenanceMatch.name;
        }

        // 2. Web Development
        if (!resolvedCategory) {
          const webMatch = WEBSITE_TYPES_DATA.find(
            (t) => t.id.toLowerCase() === typeSlug || t.name.toLowerCase().replace(/\s+/g, '-') === typeSlug
          );
          if (webMatch) {
            resolvedService = 'Web Development';
            resolvedCategory = webMatch.name;
          }
        }

        // 3. 3D Animated Websites
        if (!resolvedCategory) {
          const threeDMatch = THREE_D_EXPERIENCE_TYPES_DATA.find(
            (t) =>
              t.id.toLowerCase() === typeSlug ||
              t.name.toLowerCase().replace(/\s+/g, '-') === typeSlug ||
              (typeSlug === 'scroll-bound-cinema-zoom' && t.id === 'scroll-driven-video-hero') ||
              (typeSlug === 'scroll-driven-video-hero' && t.id === 'scroll-driven-video-hero') ||
              (typeSlug === 'interactive-variant-studio' && t.id === 'interactive-variant-studio') ||
              (typeSlug === 'cinematic-video-atmosphere' && t.id === 'cinematic-video-atmosphere')
          );
          if (threeDMatch) {
            resolvedService = '3D Animated Websites';
            resolvedCategory = threeDMatch.name;
          }
        }

        // 4. E-Commerce Development
        if (!resolvedCategory) {
          const ecomMatch = ECOMMERCE_TYPES_DATA.find(
            (t) =>
              t.id.toLowerCase() === typeSlug ||
              t.name.toLowerCase().replace(/\s+/g, '-') === typeSlug ||
              t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === typeSlug
          );
          if (ecomMatch) {
            resolvedService = 'E-Commerce Development';
            resolvedCategory = ecomMatch.name;
          }
        }

        // 5. Graphic Design
        if (!resolvedCategory) {
          const graphicMatch = GRAPHIC_DESIGN_TYPES_DATA.find(
            (t) => t.id.toLowerCase() === typeSlug || t.name.toLowerCase().replace(/\s+/g, '-') === typeSlug
          );
          if (graphicMatch) {
            resolvedService = 'Graphic Design';
            resolvedCategory = graphicMatch.name;
          }
        }

        // 6. 3D Video Animation
        if (!resolvedCategory) {
          const motionMatch = MOTION_DESIGN_TYPES_DATA.find(
            (t) => t.id.toLowerCase() === typeSlug || t.name.toLowerCase().replace(/\s+/g, '-') === typeSlug
          );
          if (motionMatch) {
            resolvedService = '3D Video Animation';
            resolvedCategory = motionMatch.name;
          }
        }

        // 7. Website Deployment & Cloud Setup
        if (!resolvedCategory) {
          const cloudMatch = CLOUD_DEPLOYMENT_TYPES_DATA.find(
            (t) => t.id.toLowerCase() === typeSlug || t.name.toLowerCase().replace(/\s+/g, '-') === typeSlug
          );
          if (cloudMatch) {
            resolvedService = 'Website Deployment & Cloud Setup';
            resolvedCategory = cloudMatch.name;
          }
        }
      }
    }

    if (resolvedService) {
      setContactServicePreset(resolvedService);
    } else if (selectedService) {
      setContactServicePreset(selectedService.title);
    }

    if (resolvedCategory) {
      setContactCategoryPreset(resolvedCategory);
    }

    if (selectedService) {
      handleBackToHome('contact');
    } else {
      const targetEl =
        (options?.targetForm ? document.getElementById('agency-contact-form') : null) ||
        document.getElementById('contact');

      if (targetEl) {
        if (options?.instant) {
          const navPill = document.querySelector('#main-navbar-header nav') as HTMLElement | null;
          const navBottom = navPill ? navPill.getBoundingClientRect().bottom : 58;
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
          const desiredGap = isMobile ? 12 : 20;

          const rect = targetEl.getBoundingClientRect();
          const targetY = Math.max(0, rect.top + window.scrollY - (navBottom + desiredGap));

          const prevBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';

          window.scrollTo({
            top: targetY,
            left: 0,
            behavior: 'instant' as ScrollBehavior
          });

          requestAnimationFrame(() => {
            window.scrollTo({
              top: targetY,
              left: 0,
              behavior: 'instant' as ScrollBehavior
            });
            setTimeout(() => {
              document.documentElement.style.scrollBehavior = prevBehavior;
            }, 60);
          });

          setTimeout(() => {
            const nameInput = document.getElementById('contact-form-name') as HTMLInputElement | null;
            if (nameInput) {
              nameInput.focus({ preventScroll: true });
            }
          }, 40);
        } else {
          scrollToSectionWithOffset(targetEl, true);
        }
      }
    }
  };

  const handleViewPortfolio = () => {
    if (selectedService) {
      handleBackToHome('work');
    } else {
      const workSection = document.getElementById('work');
      if (workSection) {
        scrollToSectionWithOffset(workSection, true);
      }
    }
  };

  return (
    <div id="agency-app-root" className="min-h-screen bg-[#fbfbfe] text-[#0e0e0e] selection:bg-[#1430d8] selection:text-white flex flex-col">
      {/* Dynamic SEO Meta Tags & Head Controller */}
      <SEOHead
        title={selectedService ? `${selectedService.title} – Precision Digital Engineering` : undefined}
        description={
          selectedService
            ? `${selectedService.description} Handcrafted by Muhammad Usman Afzal at Usman DevHub.`
            : undefined
        }
        image={selectedService?.imageUrl}
        keywords={
          selectedService
            ? `${selectedService.title}, ${selectedService.category}, ${(selectedService.subcategories || []).join(', ')}, Usman DevHub, Muhammad Usman Afzal, ${(selectedService.deliverables || []).slice(0, 4).join(', ')}`
            : undefined
        }
        schema={
          selectedService
            ? {
                '@context': 'https://schema.org',
                '@type': 'Service',
                '@id': `https://usmandevhub.com/#service-${selectedService.id}`,
                name: selectedService.title,
                serviceType: selectedService.category,
                description: selectedService.description,
                image: selectedService.imageUrl,
                provider: {
                  '@type': 'Organization',
                  '@id': 'https://usmandevhub.com/#organization',
                  name: 'Usman DevHub',
                  url: 'https://usmandevhub.com/'
                },
                areaServed: {
                  '@type': 'GeoShape',
                  name: 'Worldwide'
                },
                hasOfferCatalog: {
                  '@type': 'OfferCatalog',
                  name: `${selectedService.title} Disciplines`,
                  itemListElement: (selectedService.subcategories || []).map((sub, i) => ({
                    '@type': 'Offer',
                    position: i + 1,
                    name: sub,
                    description: `${sub} - Professional ${selectedService.title} solutions by Usman DevHub`
                  }))
                }
              }
            : null
        }
      />

      {/* Floating Glassmorphism Navbar */}
      <Navbar
        onOpenContact={(srv, cat) => handleOpenContact(srv, cat)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onNavigateHome={handleBackToHome}
        onNavigateToHero={handleNavigateToHero}
        isServiceDetailPage={!!selectedService}
      />

      {/* Main Content Sections: Dedicated Service Page OR Home View */}
      <main
        id="home-main-content"
        className={`flex-1 ${selectedService ? 'hidden' : 'block'}`}
      >
        {/* Cinematic 3D Hero Section */}
        <Hero
          onOpenContact={() => handleOpenContact()}
          onViewPortfolio={handleViewPortfolio}
        />

        {/* Enterprise Tech Stack Marquee & Performance Metrics */}
        <TechStackTicker />

        {/* Full Digital Agency Services Catalog */}
        <ServicesSection
          onSelectServiceForContact={(serviceTitle) => handleOpenContact(serviceTitle)}
          onOpenServiceDetail={handleOpenServiceDetail}
        />

        {/* Selected Works Portfolio Showcase */}
        <PortfolioSection
          onOpenContact={(servicePreset, categoryPreset) =>
            handleOpenContact(servicePreset, categoryPreset, { targetForm: true })
          }
        />

        {/* Client Success Stories & Verified Reviews */}
        <TestimonialsSection
          onOpenContact={(preset, category, options) => handleOpenContact(preset, category, options)}
        />

        {/* Studio Leadership & Lead Technologist */}
        <FounderSection
          onOpenContact={() => handleOpenContact()}
        />

        {/* 20% Referral Commission Program */}
        <ReferralSection />

        {/* Frequently Asked Questions */}
        <FAQSection
          onOpenContact={(preset) => handleOpenContact(preset)}
        />

        {/* Contact System */}
        <ContactSection
          initialServicePreset={contactServicePreset}
          initialCategoryPreset={contactCategoryPreset}
        />
      </main>

      {selectedService && (
        <main id="service-detail-main-content" className="flex-1">
          <ServiceDetailPage
            service={selectedService}
            onBack={() => handleBackToHome()}
            onSelectOtherService={handleOpenServiceDetail}
            onOpenContact={(srv, cat) => handleOpenContact(srv, cat)}
          />
        </main>
      )}

      {/* Agency Footer */}
      <Footer
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenContact={() => handleOpenContact()}
        onNavigateHome={handleBackToHome}
        onSelectServiceKeyword={handleSelectServiceByKeyword}
      />

      {/* Secure Owner Admin Dashboard */}
      <AdminDashboard
        isOpen={isAdminOpen}
        requestedTab={adminRequestedTab}
        requestedOrderId={adminRequestedOrderId}
        requestedStudio={adminRequestedStudio}
        onTabChange={(tab) => {
          setAdminRequestedTab(tab);
          if (window.location.hash !== `#admin/${tab}`) {
            history.replaceState(null, '', `#admin/${tab}`);
          }
        }}
        onClose={() => {
          setIsAdminOpen(false);
          setAdminRequestedOrderId(undefined);
          setAdminRequestedStudio(false);
          setClientViewOrder(null);
          setEditingOrderInStudio(null);
          const currentHash = window.location.hash;
          const currentPath = window.location.pathname;
          if (
            currentPath.startsWith('/admin') ||
            currentPath.startsWith('/dashboard') ||
            currentPath.startsWith('/order') ||
            currentPath.startsWith('/agreement') ||
            currentPath === '/order-studio' ||
            currentPath === '/agreement-studio' ||
            currentPath === '/messages' ||
            currentPath === '/inquiries' ||
            currentPath === '/security' ||
            currentPath === '/vault' ||
            currentHash.startsWith('#admin') ||
            currentHash.startsWith('#dashboard') ||
            currentHash.startsWith('#order') ||
            currentHash === '#agreement' ||
            currentHash === '#agreements' ||
            currentHash === '#track-order' ||
            currentHash === '#order-review' ||
            currentHash === '#messages' ||
            currentHash === '#inquiries' ||
            currentHash === '#security' ||
            currentHash === '#vault' ||
            currentHash === '#login' ||
            currentHash === '#admin-login' ||
            currentHash === '#owner' ||
            currentHash === '#executive'
          ) {
            history.replaceState(null, '', window.location.pathname === '/' ? window.location.search : '/');
          }
        }}
      />

      {/* Floating WhatsApp Contact Button - permanently mounted on bottom right across mobile, tablet, and desktop */}
      <FloatingWhatsAppButton />

      {/* Client Order Verification & Download Modal - Accessible ONLY when Admin is Authenticated */}
      {clientViewOrder && getAdminAuthStatus() && (
        <OrderAgreementModal
          order={clientViewOrder}
          isOpen={!!clientViewOrder && getAdminAuthStatus()}
          onClose={() => {
            setClientViewOrder(null);
            if (
              window.location.hash.startsWith('#order') ||
              window.location.hash === '#agreement' ||
              window.location.hash === '#track-order' ||
              window.location.hash === '#order-review'
            ) {
              history.replaceState(null, '', window.location.pathname + window.location.search);
            }
          }}
          isAdmin={getAdminAuthStatus()}
          onOpenStudio={(ord) => setEditingOrderInStudio(ord)}
          onOrderUpdated={(updated) => setClientViewOrder(updated)}
        />
      )}

      {/* Full Dedicated Order Agreement Studio - Accessible ONLY when Admin is Authenticated */}
      {editingOrderInStudio && getAdminAuthStatus() && (
        <OrderAgreementStudio
          order={editingOrderInStudio}
          isOpen={!!editingOrderInStudio && getAdminAuthStatus()}
          onClose={() => setEditingOrderInStudio(null)}
          onOrderSaved={(updated) => {
            setClientViewOrder(updated);
            setEditingOrderInStudio(null);
          }}
        />
      )}
    </div>
  );
}
