import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { scrollToSectionWithOffset } from '../utils/scroll';
import { BrandLogo } from './BrandLogo';


interface NavbarProps {
  onOpenContact: (servicePreset?: string, categoryPreset?: string) => void;
  onOpenAdmin: () => void;
  onNavigateHome?: (sectionId?: string) => void;
  onNavigateToHero?: () => void;
  isServiceDetailPage?: boolean;
}

const NAV_LINKS = [
  { label: 'Services', href: '#services', id: 'services' },
  { label: 'Portfolio', href: '#work', id: 'work' },
  { label: 'Reviews', href: '#reviews', id: 'reviews' },
  { label: 'Team', href: '#studio', id: 'studio' },
  { label: 'Partner Program', href: '#referral', id: 'referral' },
  { label: 'FAQ', href: '#faq', id: 'faq' },
  { label: 'Contact', href: '#contact', id: 'contact' },
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenContact,
  onOpenAdmin,
  onNavigateHome,
  onNavigateToHero,
  isServiceDetailPage,
}) => {
  const [overDarkHero, setOverDarkHero] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('');
  const isClickingRef = useRef(false);

  // Close drawer on Escape key or when screen resizes to desktop breakpoint (>= 1024px)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Detect whether navbar sits over the dark Hero section or light page content
  useEffect(() => {
    if (isServiceDetailPage) {
      setOverDarkHero(false);
      return;
    }

    const updateHeroOverlap = () => {
      const heroEl = document.getElementById('hero-section');
      const threshold = heroEl ? Math.max(120, heroEl.offsetHeight - 85) : 480;
      setOverDarkHero(window.scrollY < threshold);
    };

    updateHeroOverlap();
    window.addEventListener('scroll', updateHeroOverlap, { passive: true });
    window.addEventListener('resize', updateHeroOverlap, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateHeroOverlap);
      window.removeEventListener('resize', updateHeroOverlap);
    };
  }, [isServiceDetailPage]);

  const isDarkTheme = !isServiceDetailPage && overDarkHero;

  // Dynamic Scroll Spy across all 7 website sections in exact DOM order
  useEffect(() => {
    if (isServiceDetailPage) {
      setActiveNav('services');
      return;
    }

    const handleScrollSpy = () => {
      if (isClickingRef.current) return;

      const heroEl = document.getElementById('hero-section');
      const heroBottom = heroEl ? heroEl.offsetHeight - 140 : 320;
      if (window.scrollY < heroBottom) {
        setActiveNav('');
        return;
      }

      const probeY = window.scrollY + 180;

      for (let i = NAV_LINKS.length - 1; i >= 0; i--) {
        const { id } = NAV_LINKS[i];
        const element = document.getElementById(id);
        if (element) {
          const top = element.getBoundingClientRect().top + window.scrollY;
          if (probeY >= top) {
            setActiveNav(id);
            return;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    handleScrollSpy();
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [isServiceDetailPage]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, id: string) => {
    e.preventDefault();
    setActiveNav(id);
    setMobileMenuOpen(false);

    if (isServiceDetailPage && onNavigateHome) {
      onNavigateHome(id);
      return;
    }

    isClickingRef.current = true;
    setTimeout(() => {
      isClickingRef.current = false;
    }, 850);

    const element = document.querySelector(href) as HTMLElement | null;
    if (element) {
      scrollToSectionWithOffset(element, true);
    }
  };

  return (
    <>
      <header
        id="main-navbar-header"
        className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 pointer-events-none transition-colors duration-200"
      >
        <div className="w-full max-w-7xl xl:max-w-[1400px] mx-auto flex justify-center items-center">
          <motion.nav
            id="floating-glass-navbar"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto flex items-center justify-between gap-4 xl:gap-8 w-full rounded-full border py-1.5 sm:py-2 pl-3 sm:pl-4 lg:pl-5 pr-3 sm:pr-5 lg:pr-6 transition-colors duration-200 ${
              isDarkTheme
                ? 'bg-neutral-950/60 backdrop-blur-xl border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.35)]'
                : 'bg-white/85 backdrop-blur-xl border-neutral-200/80 shadow-[0_6px_24px_rgba(14,14,14,0.06)]'
            }`}
          >
          {/* Zone 1: Brand Logo & Wordmark */}
          <BrandLogo
            variant="full"
            theme={isDarkTheme ? 'dark' : 'light'}
            size="md"
            whiteBackground={true}
            badgeClassName={
              isDarkTheme
                ? 'aspect-square w-9 h-9 sm:w-10 sm:h-10 bg-white/75 hover:bg-white/90 border-2 border-white/45 rounded-xl backdrop-blur-xs p-0.5 flex items-center justify-center'
                : 'aspect-square w-9 h-9 sm:w-10 sm:h-10 bg-white/90 hover:bg-white border-2 border-slate-300 rounded-xl shadow-xs p-0.5 flex items-center justify-center'
            }
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              if (onNavigateToHero) {
                onNavigateToHero();
              } else if (onNavigateHome) {
                onNavigateHome('hero');
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />

          {/* Zone 2: Primary Website Navigation Links */}
          <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = activeNav === link.id;
              return (
                <a
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href, link.id)}
                  className={`relative px-3 xl:px-3.5 py-1.5 rounded-full text-xs xl:text-[13px] font-semibold transition-colors duration-150 select-none whitespace-nowrap shrink-0 ${
                    isDarkTheme
                      ? isActive
                        ? 'text-white'
                        : 'text-white/80 hover:text-white'
                      : isActive
                        ? 'text-[#1430d8]'
                        : 'text-neutral-600 hover:text-[#0e0e0e]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-nav-pill"
                      className={`absolute inset-0 rounded-full -z-10 ${
                        isDarkTheme
                          ? 'bg-white/15 border border-white/20'
                          : 'bg-blue-50/90 border border-blue-200/70'
                      }`}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            id="mobile-nav-toggle-button"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-colors duration-150 shrink-0 cursor-pointer ${
              isDarkTheme
                ? 'bg-white/15 border border-white/25 text-white hover:bg-white/25'
                : 'bg-neutral-100 border border-neutral-200 text-[#0e0e0e] hover:bg-neutral-200'
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </motion.nav>
      </div>
    </header>

      {/* Mobile & Tablet Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-30 bg-black/45 backdrop-blur-xs lg:hidden"
            />
            <motion.div
              id="mobile-nav-menu-overlay"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed inset-x-3 sm:inset-x-6 top-[68px] sm:top-[76px] z-40 lg:hidden max-w-md md:max-w-2xl lg:max-w-3xl mx-auto bg-white/98 backdrop-blur-2xl border border-neutral-200/90 rounded-2xl p-3 sm:p-4 shadow-[0_16px_40px_rgba(0,0,0,0.16)] flex flex-col gap-2 max-h-[82vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-neutral-100">
                <BrandLogo
                  variant="stacked"
                  size="md"
                  whiteBackground={true}
                  badgeClassName="aspect-square w-9.5 h-9.5 bg-white/90 border-2 border-slate-300 rounded-xl shadow-xs p-0.5 flex items-center justify-center"
                  href="#hero"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    if (onNavigateToHero) {
                      onNavigateToHero();
                    } else if (onNavigateHome) {
                      onNavigateHome('hero');
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-0.5 pt-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.id}
                    id={`mobile-nav-item-${link.id}`}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href, link.id)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                      activeNav === link.id
                        ? 'bg-blue-50 text-[#1430d8]'
                        : 'text-neutral-800 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-45" />
                  </a>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

