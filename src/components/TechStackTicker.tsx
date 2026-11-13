import React from 'react';
import { motion } from 'motion/react';
import {
  Code2,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Gauge,
  Flame
} from 'lucide-react';

interface TechItem {
  name: string;
  category: string;
  icon?: string;
}

const TECH_STACK: TechItem[] = [
  { name: 'Custom Code & React 19', category: 'Web Dev' },
  { name: 'Next.js 15 & TypeScript', category: 'Full-Stack' },
  { name: 'Three.js & 3D WebGL', category: '3D Web' },
  { name: 'WebGL Shaders & Canvas', category: 'Creative Tech' },
  { name: 'Shopify & Shopify Plus', category: 'E-Commerce' },
  { name: 'WordPress & WooCommerce', category: 'Store CMS' },
  { name: 'Figma Design Systems', category: 'Graphic Design' },
  { name: 'Brand Identity & Vector Kits', category: 'Branding' },
  { name: 'Cinema 4D & After Effects', category: 'Video Animation' },
  { name: 'GSAP & Kinetic Motion', category: 'Motion Design' },
  { name: 'Cloudflare & AWS Cloud', category: 'Cloud Setup' },
  { name: 'Docker & Linux VPS', category: 'DevOps' },
  { name: 'Stripe Global Checkout', category: 'Payments' },
  { name: '24/7 Security & Monitoring', category: 'Website Care' },
];

const TRUST_METRICS = [
  {
    icon: <Gauge className="w-4 h-4 text-[#0075f7]" />,
    label: '95+ Lighthouse Score',
    detail: 'Ultra-fast Core Web Vitals',
  },
  {
    icon: <Zap className="w-4 h-4 text-amber-500" />,
    label: '60 FPS Smooth Rendering',
    detail: 'GPU-accelerated WebGL',
  },
  {
    icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
    label: 'Enterprise Security',
    detail: 'Full data protection & SSL',
  },
  {
    icon: <CheckCircle2 className="w-4 h-4 text-[#1430d8]" />,
    label: '100% On-Time Delivery',
    detail: 'Strict milestone sprints',
  },
];

export const TechStackTicker: React.FC = () => {
  return (
    <section className="relative w-full py-10 bg-white border-b border-neutral-200/80 overflow-hidden select-none">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/40 via-transparent to-indigo-50/40 pointer-events-none" />

      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        {/* Top agency credentials strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-3 border-b border-neutral-100">
          {TRUST_METRICS.map((metric, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200/80 flex items-center justify-center shrink-0">
                {metric.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                  {metric.label}
                </p>
                <p className="text-[11px] text-neutral-500 truncate hidden sm:block">
                  {metric.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee ticker label - Professional & Balanced Across All 7 Disciplines */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4 px-4 text-center">
        <div className="flex items-center gap-1.5 text-[#1430d8]">
          <Sparkles className="w-3.5 h-3.5 text-[#0075f7]" />
          <span className="font-extrabold tracking-wide">Studio Technology Ecosystem</span>
        </div>
        <span className="hidden sm:inline text-neutral-300">•</span>
        <span className="text-neutral-500 font-semibold normal-case text-xs sm:text-sm">
          Powering all 7 disciplines with modern engineering and creative tools
        </span>
      </div>

      {/* Infinite Scrolling Marquee Track */}
      <div className="relative w-full overflow-hidden flex items-center">
        {/* Left and right fade gradient edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

        <div className="flex gap-3 sm:gap-4 whitespace-nowrap animate-marquee py-1">
          {/* First iteration */}
          {TECH_STACK.map((tech, idx) => (
            <div
              key={`tech-1-${idx}`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-50/90 hover:bg-white border border-neutral-200/80 hover:border-[#1430d8]/40 shadow-xs transition-all duration-200 cursor-default group"
            >
              <span className="w-2 h-2 rounded-full bg-[#1430d8] group-hover:scale-125 transition-transform" />
              <span className="text-xs sm:text-sm font-semibold text-neutral-800 group-hover:text-[#1430d8] transition-colors">
                {tech.name}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 bg-neutral-200/60 px-1.5 py-0.5 rounded-sm">
                {tech.category}
              </span>
            </div>
          ))}

          {/* Duplicate iteration for seamless loop */}
          {TECH_STACK.map((tech, idx) => (
            <div
              key={`tech-2-${idx}`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-50/90 hover:bg-white border border-neutral-200/80 hover:border-[#1430d8]/40 shadow-xs transition-all duration-200 cursor-default group"
            >
              <span className="w-2 h-2 rounded-full bg-[#0075f7] group-hover:scale-125 transition-transform" />
              <span className="text-xs sm:text-sm font-semibold text-neutral-800 group-hover:text-[#0075f7] transition-colors">
                {tech.name}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 bg-neutral-200/60 px-1.5 py-0.5 rounded-sm">
                {tech.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
