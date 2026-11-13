import React, { useState, useEffect } from 'react';
import { getActiveReferredByToken, lookupPartnerByToken } from '../services/storageService';

export const FloatingWhatsAppButton: React.FC = () => {
  const [activeToken, setActiveToken] = useState<string>(() => getActiveReferredByToken());
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const syncToken = () => {
      setActiveToken(getActiveReferredByToken());
    };
    window.addEventListener('usman_agency_data_updated', syncToken);
    return () => window.removeEventListener('usman_agency_data_updated', syncToken);
  }, []);

  const partner = activeToken ? lookupPartnerByToken(activeToken) : undefined;
  const baseMessage = activeToken
    ? `Hi Usman DevHub Tech & Creative Studio, I am looking to build a project.${partner ? ` (Referred by ${partner.partnerName} — Token: ${activeToken})` : ` (Referral Token: ${activeToken})`}`
    : 'Hi Usman DevHub Tech & Creative Studio, I am looking to build a website.';

  const whatsappHref = `https://wa.me/923412683864?text=${encodeURIComponent(baseMessage)}`;

  return (
    <div
      id="floating-whatsapp-root"
      className="whatsapp-floating-wrapper"
    >
      {/* Desktop / Tablet Tooltip */}
      <div
        className={`hidden lg:flex items-center gap-2 absolute right-full mr-3.5 px-3 py-1.5 rounded-xl bg-[#0e0e0e]/95 text-white text-xs font-semibold shadow-xl border border-white/10 pointer-events-none transition-all duration-200 whitespace-nowrap ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
        <span>Chat on WhatsApp</span>
      </div>

      {/* Main WhatsApp Round Button */}
      <a
        id="floating-whatsapp-button"
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Direct WhatsApp Chat with Usman DevHub"
        title="Chat on WhatsApp (+92 341 2683864)"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="whatsapp-floating-btn"
      >
        {/* Radar ping wave effect */}
        <span className="whatsapp-ping-ring" />

        {/* Online green indicator dot */}
        <span className="whatsapp-online-dot" />

        {/* 100% Valid W3C Closed-Path WhatsApp SVG Icon */}
        <svg
          viewBox="0 0 24 24"
          width="32"
          height="32"
          className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white drop-shadow-sm pointer-events-none shrink-0"
          aria-hidden="true"
        >
          <path
            fill="#ffffff"
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
          />
        </svg>
      </a>
    </div>
  );
};
