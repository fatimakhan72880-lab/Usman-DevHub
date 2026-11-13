import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { scrollToSectionWithOffset } from '../utils/scroll';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenContact: () => void;
  onNavigateHome?: (sectionId?: string) => void;
  onSelectServiceKeyword?: (keyword: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  onOpenContact,
  onNavigateHome,
}) => {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
    };
  }, []);

  const handleSecretCopyrightTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      onOpenAdmin();
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 1200);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBrandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateHome) {
      onNavigateHome('hero');
    } else {
      const el = document.getElementById('hero');
      if (el) {
        scrollToSectionWithOffset(el, true);
      } else {
        scrollToTop();
      }
    }
  };

  const handleReferralClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const homeMain = document.getElementById('home-main-content');
    const isOnServicePage =
      window.location.hash.startsWith('#service-') ||
      (homeMain ? homeMain.classList.contains('hidden') : false);

    if (isOnServicePage && onNavigateHome) {
      onNavigateHome('referral');
      return;
    }

    const el = document.getElementById('referral');
    if (el) {
      scrollToSectionWithOffset(el, true);
    } else if (onNavigateHome) {
      onNavigateHome('referral');
    }
  };

// Official Vector Brand Logos for Social Networks
const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.88 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.34 0 .67.06.98.17v-3.53a6.37 6.37 0 0 0-.98-.08A6.33 6.33 0 0 0 3.15 15.7a6.33 6.33 0 0 0 6.33 6.33 6.33 6.33 0 0 0 6.33-6.33V9.08a8.28 8.28 0 0 0 4.78 1.48V7.11a4.88 4.88 0 0 1-1-.42z" />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const LinkedInIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

  const socialChannels = [
    {
      name: 'TikTok',
      href: 'https://www.tiktok.com/@usman_devhub?_r=1&_t=ZS-9BLJsAnL97N',
      ariaLabel: 'Official TikTok of Usman DevHub',
      icon: TikTokIcon,
      hoverClass: 'hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:text-white',
      iconHoverClass: 'group-hover:text-cyan-300',
    },
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/share/1DocPurzfX/',
      ariaLabel: 'Official Facebook Page of Usman DevHub',
      icon: FacebookIcon,
      hoverClass: 'hover:border-[#1877F2]/60 hover:bg-[#1877F2]/10 hover:text-white',
      iconHoverClass: 'group-hover:text-[#1877F2]',
    },
    {
      name: 'WhatsApp',
      href: 'https://wa.me/923412683864',
      ariaLabel: 'Direct WhatsApp Chat with Usman DevHub (+92 341 2683864)',
      icon: WhatsAppIcon,
      hoverClass: 'hover:border-[#25D366]/60 hover:bg-[#25D366]/10 hover:text-white',
      iconHoverClass: 'group-hover:text-[#25D366]',
    },
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/company/usman-devhub/',
      ariaLabel: 'Official LinkedIn Company Page of Usman DevHub',
      icon: LinkedInIcon,
      hoverClass: 'hover:border-[#0A66C2]/60 hover:bg-[#0A66C2]/10 hover:text-white',
      iconHoverClass: 'group-hover:text-[#0A66C2]',
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/usman_devhub?psln=a3dwOWRqaDNzdW9n',
      ariaLabel: 'Official Instagram of Usman DevHub',
      icon: InstagramIcon,
      hoverClass: 'hover:border-[#E1306C]/60 hover:bg-[#E1306C]/10 hover:text-white',
      iconHoverClass: 'group-hover:text-[#E1306C]',
    },
  ];

  return (
    <footer
      id="agency-footer"
      className="bg-[#08080a] text-white pt-10 sm:pt-14 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8 border-t border-white/10"
    >
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto">
        {/* Tier 1: Editorial Studio Positioning & Direct Business Inquiry */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-10 pb-8 sm:pb-10">
          <div className="max-w-md">
            <div className="mb-4">
              <BrandLogo
                variant="stacked"
                theme="dark"
                size="md"
                whiteBackground={true}
                href="#hero"
                onClick={handleBrandClick}
              />
            </div>

            <h2 className="text-base sm:text-lg lg:text-[19px] font-medium tracking-tight text-neutral-200 leading-relaxed [text-wrap:balance]">
              Independent digital engineering &amp; creative studio partnering with ambitious brands worldwide.
            </h2>
            <p className="mt-2 text-xs sm:text-[13px] text-neutral-400 leading-relaxed">
              Refer a client and earn a guaranteed{' '}
              <span className="text-neutral-200 font-medium">20% commission on every project</span>{' '}
              through our{' '}
              <a
                href="#referral"
                onClick={handleReferralClick}
                className="text-white font-medium underline decoration-white/30 underline-offset-4 hover:text-[#3b82f6] hover:decoration-[#3b82f6] transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-xs"
              >
                Partner Program
              </a>
              .
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="flex flex-col items-start lg:items-end gap-0.5">
              <span className="text-[11px] font-medium text-neutral-500">
                New Business &amp; Partnerships
              </span>
              <a
                href="mailto:hello@usmandevhub.com"
                className="group inline-flex items-center gap-1.5 text-sm sm:text-base font-medium tracking-tight text-white hover:text-[#3b82f6] transition-colors duration-150 whitespace-nowrap"
              >
                <span>hello@usmandevhub.com</span>
                <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-[#3b82f6] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150 shrink-0" />
              </a>
            </div>

            <button
              type="button"
              onClick={onOpenContact}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-[#08080a] text-xs font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <span>Start a Project</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tier 2: International Presence, Direct Line & Official Social Channels */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 py-6 sm:py-8 border-y border-white/10">
          {/* Global Hubs */}
          <div className="md:col-span-3">
            <h3 className="text-[11px] font-medium text-neutral-500 mb-2">
              Global Presence
            </h3>
            <div className="space-y-1 text-xs sm:text-[13px] text-neutral-300 leading-relaxed">
              <p>Pakistan &mdash; Engineering HQ</p>
              <p>Romania &mdash; European Partnerships</p>
            </div>
          </div>

          {/* Direct Line */}
          <div className="md:col-span-3">
            <h3 className="text-[11px] font-medium text-neutral-500 mb-2">
              Direct Line
            </h3>
            <div className="space-y-1 text-xs sm:text-[13px] text-neutral-300 leading-relaxed">
              <div>
                <a
                  href="https://wa.me/923412683864"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors duration-150 tabular-nums whitespace-nowrap"
                >
                  +92 341 2683864
                </a>
              </div>
              <p className="text-neutral-500 text-xs">Mon &ndash; Sun &middot; Global Timezones</p>
            </div>
          </div>

          {/* Official Socials */}
          <div className="md:col-span-6">
            <h3 className="text-[11px] font-medium text-neutral-500 mb-2.5">
              Official Social Channels
            </h3>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {socialChannels.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.ariaLabel}
                    className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs sm:text-[13px] text-neutral-300 ${social.hoverClass} transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors duration-150 text-neutral-400 ${social.iconHoverClass}`} />
                    <span className="font-medium">{social.name}</span>
                    <ArrowUpRight className="w-3 h-3 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150 shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tier 3: Quiet Legal & Governance Bar */}
        <div className="pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-neutral-500">
          <p
            onClick={handleSecretCopyrightTap}
            className="text-center sm:text-left select-none touch-manipulation cursor-default"
          >
            &copy; {new Date().getFullYear()} Usman DevHub Tech &amp; Creative Studio. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 hover:text-white transition-colors duration-150 cursor-pointer whitespace-nowrap"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

