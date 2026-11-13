import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Globe,
  Box,
  ShoppingBag,
  Palette,
  Film,
  Cloud,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  Wallet
} from 'lucide-react';
import { Service } from '../types';
import { getServices } from '../services/storageService';

interface ServicesSectionProps {
  onSelectServiceForContact: (serviceTitle: string) => void;
  onOpenServiceDetail: (service: Service) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onSelectServiceForContact,
  onOpenServiceDetail,
}) => {
  const [services, setServices] = useState<Service[]>([]);

  const loadData = () => {
    const list = getServices().filter(s => s.status === 'active');
    list.sort((a, b) => a.order - b.order);
    setServices(list);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('usman_agency_data_updated', handleUpdate);
    return () => window.removeEventListener('usman_agency_data_updated', handleUpdate);
  }, []);

  const getServiceIcon = (title: string, className = "w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400") => {
    if (title.includes('3D Animated') || title.includes('3D Interactive')) return <Box className={className} />;
    if (title.includes('Web Development')) return <Globe className={className} />;
    if (title.includes('E-Commerce')) return <ShoppingBag className={className} />;
    if (title.includes('Graphic Design')) return <Palette className={className} />;
    if (title.includes('Motion') || title.includes('Video Animation')) return <Film className={className} />;
    if (title.includes('Cloud') || title.includes('Deployment')) return <Cloud className={className} />;
    return <ShieldCheck className={className} />;
  };

  const getServiceTechPills = (title: string): string[] => {
    if (title.includes('Web Development')) {
      return ['Custom Code', 'WordPress & CMS', 'Tailwind & TS', 'Next.js 15'];
    }
    if (title.includes('3D Animated') || title.includes('3D Interactive')) {
      return ['Three.js & 3D WebGL', 'WebGL Shaders', '60 FPS Canvas'];
    }
    if (title.includes('E-Commerce')) {
      return ['Shopify & Plus', 'WooCommerce', 'Custom Code Store', 'Stripe Checkout'];
    }
    if (title.includes('Graphic Design')) {
      return ['Figma Systems', 'Brand Kits', 'Vector Graphics', 'Typography'];
    }
    if (title.includes('Motion') || title.includes('Video Animation')) {
      return ['Cinematic 3D', '4K 60fps', 'Transparent WebM', 'Sound FX'];
    }
    if (title.includes('Cloud') || title.includes('Deployment')) {
      return ['Cloudflare Edge', 'Linux VPS & Docker', 'Vercel & AWS', 'SSL / HSTS'];
    }
    return ['24/7 Monitoring', 'Bug Fixing', 'Speed 95+', 'Patch Updates'];
  };

  return (
    <section id="services" className="relative py-10 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#fbfbfe] overflow-x-clip">
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] sm:text-xs font-semibold text-[#1430d8] mb-2.5 sm:mb-3">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Core Capabilities &amp; Multi-Stack Engineering</span>
          </div>
          <h2 className="font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0e0e0e] tracking-tight max-w-3xl leading-[1.2] sm:leading-tight">
            Precision Digital Engineering &amp; Creative Services
          </h2>
          <p className="mt-2 sm:mt-4 text-xs sm:text-base lg:text-lg text-neutral-600 max-w-3xl">
            Explore our specialized creative and engineering capabilities tailored to elevate your business — built with precision, speed, and zero limitations.
          </p>
        </div>

        {/* Services Grid (Matches Showcase / Portfolio Grid and Card Dimensions on Mobile & Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 items-stretch">
          {services.map((service, index) => {
            const serviceNumber = String(service.order || index + 1).padStart(2, '0');
            const cleanTitle = service.title.replace(/^\d+[\.\s\-]+/, '');
            // Card 1, 3, 5 from Right (+50px), Card 2, 4, 6 from Left (-50px)
            const comesFromRight = index % 2 === 0;

            return (
              <motion.div
                key={service.id}
                id={`service-card-${service.id}`}
                onClick={() => onOpenServiceDetail(service)}
                initial={{ opacity: 0, x: comesFromRight ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="group flex flex-col justify-between rounded-xl sm:rounded-2xl bg-white border border-neutral-200/90 overflow-hidden hover:border-[#1430d8]/50 hover:shadow-[0_16px_36px_rgba(20,48,216,0.08)] transition-[border-color,box-shadow] duration-300 cursor-pointer"
              >
                {/* Clean Icon-Based Card Content (No Picture, Sleek Tech Style) */}
                <div className="p-3 sm:p-4">
                  {/* Top Row: Tech Icon + Meta */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-[#1430d8] to-[#0075f7] flex items-center justify-center text-white shadow-md shadow-blue-600/25 shrink-0 group-hover:scale-105 transition-transform"
                        title="Click to view details"
                      >
                        {getServiceIcon(service.title, "w-5 h-5 text-white")}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] sm:text-[10px] font-mono font-black text-[#1430d8] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            #{serviceNumber}
                          </span>
                          <span className="text-[8.5px] sm:text-[9.5px] font-bold text-neutral-400 tracking-wider uppercase truncate">
                            {service.category}
                          </span>
                        </div>
                        <h3
                          className="font-display text-xs sm:text-sm font-bold text-[#0e0e0e] group-hover:text-[#1430d8] transition-colors truncate"
                        >
                          {cleanTitle}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 leading-relaxed line-clamp-2">
                    {service.description}
                  </p>

                  {/* Core Tech Stack Badges */}
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    {getServiceTechPills(service.title).map((pill, pIdx) => (
                      <span
                        key={pIdx}
                        className="text-[8.5px] sm:text-[9.5px] font-semibold text-[#1430d8] bg-blue-50/90 border border-blue-100/90 px-1.5 py-0.5 rounded-md"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>

                  {/* Prominent Specializations Section on Card */}
                  {service.subcategories && service.subcategories.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-neutral-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] sm:text-[10px] font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-[#1430d8]" />
                          <span>Specializations</span>
                        </span>
                        <span className="text-[9px] font-bold text-[#1430d8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-mono">
                          {service.subcategories.length} Included
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1">
                        {service.subcategories.map((sub, sIdx) => {
                          const slug = sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                          return (
                            <span
                              key={sIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.hash = `service-${service.id}/type/${slug}`;
                                onOpenServiceDetail(service);
                              }}
                              className="flex items-center gap-1 px-1.5 py-1 text-[9px] sm:text-[10px] rounded-md sm:rounded-lg bg-neutral-50 hover:bg-blue-50 hover:text-[#1430d8] hover:border-blue-200 border border-neutral-200/80 font-medium text-neutral-700 transition-all cursor-pointer group/pill shadow-2xs min-w-0"
                              title={`Explore ${sub}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1430d8]/50 group-hover/pill:bg-[#1430d8] shrink-0" />
                              <span className="truncate">{sub}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Bar (Matches Showcase Card Footer Bar) */}
                <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] sm:text-[11px] font-semibold text-neutral-600 group-hover:text-[#1430d8] transition-colors flex items-center gap-1 py-0.5">
                    <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:text-[#1430d8]" />
                    <span>Service Details</span>
                  </div>

                  <button
                    id={`btn-request-${service.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectServiceForContact(service.title);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white font-semibold transition-all shadow-xs cursor-pointer z-10"
                  >
                    <span>Order Quote</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Standardized 3-Stage Client Payment Milestone Strip */}
        <div className="mt-6 sm:mt-10 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/90 p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#1430d8] shrink-0" />
              <span className="font-display text-xs sm:text-sm font-bold text-[#0e0e0e]">
                Transparent 3-Stage Project Payment Milestones
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500">
              Global &amp; PK payments supported via <strong className="text-[#0e0e0e] font-semibold">Remitly</strong>, Wise, Payoneer, Bank Wire, SadaPay, JazzCash, EasyPaisa &amp; USDT
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 tabular-nums">
            <div className="p-3 rounded-xl bg-neutral-50/80 border border-neutral-200/70">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold text-neutral-500">Stage 01 · Project Start</span>
                <span className="font-display text-base sm:text-lg font-extrabold text-[#1430d8]">25%</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Initial kickoff advance to lock schedule, finalize architecture, and begin UI/UX &amp; setup.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50/80 border border-neutral-200/70">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold text-neutral-500">Stage 02 · Mid-Project</span>
                <span className="font-display text-base sm:text-lg font-extrabold text-[#1430d8]">35%</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Halfway milestone upon reviewing core engineering progress and live staging preview.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50/80 border border-neutral-200/70">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold text-neutral-500">Stage 03 · Final Handover</span>
                <span className="font-display text-base sm:text-lg font-extrabold text-[#1430d8]">40%</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Paid upon final project completion, QA approval, live launch, and 100% source code transfer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
