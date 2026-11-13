import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Sparkles,
  Layers,
  Star,
  Globe,
  Box,
  ShoppingBag,
  Palette,
  Film,
  Cloud,
  ShieldCheck,
  Users
} from 'lucide-react';
import { getReviews } from '../services/storageService';
import { scrollToSectionWithOffset } from '../utils/scroll';

interface HeroProps {
  onOpenContact: () => void;
  onViewPortfolio: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenContact, onViewPortfolio }) => {
  const handleScrollToReferral = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const referralEl = document.getElementById('referral');
    if (referralEl) {
      scrollToSectionWithOffset(referralEl, true);
    }
  };
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const computeLiveRating = () => {
    const approved = getReviews().filter((r) => r.status === 'approved');
    if (approved.length === 0) return '4.8';
    const avg = approved.reduce((sum, r) => sum + r.rating, 0) / approved.length;
    return (Math.round(avg * 10) / 10).toFixed(1);
  };

  const [liveRating, setLiveRating] = useState<string>(() => computeLiveRating());

  useEffect(() => {
    let lastWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        setIsMobile(window.innerWidth < 768);
      }
    };
    const handleReviewsUpdate = () => {
      setLiveRating(computeLiveRating());
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('usman_agency_data_updated', handleReviewsUpdate);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('usman_agency_data_updated', handleReviewsUpdate);
    };
  }, []);

  // Ensure video reliably starts playing and remains 100% visible
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', 'true');

      const tryPlay = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            const handleFirstInteract = () => {
              video.play().catch(() => {});
              window.removeEventListener('touchstart', handleFirstInteract);
              window.removeEventListener('click', handleFirstInteract);
              window.removeEventListener('scroll', handleFirstInteract);
            };
            window.addEventListener('touchstart', handleFirstInteract, { once: true, passive: true });
            window.addEventListener('click', handleFirstInteract, { once: true, passive: true });
            window.addEventListener('scroll', handleFirstInteract, { once: true, passive: true });
          });
        }
      };

      tryPlay();
      video.addEventListener('loadeddata', tryPlay);
      video.addEventListener('canplay', tryPlay);

      return () => {
        video.removeEventListener('loadeddata', tryPlay);
        video.removeEventListener('canplay', tryPlay);
      };
    }
  }, [isMobile]);

  // Stop/pause background video as soon as user scrolls down to lower sections,
  // and resume playing when user scrolls back up into the Hero section
  useEffect(() => {
    const heroEl = heroSectionRef.current;
    const video = videoRef.current;
    if (!heroEl || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio <= 0.05) {
            // Scrolled away to lower sections -> pause/stop video
            if (!video.paused) {
              video.pause();
            }
          } else {
            // Returned to Hero section -> resume playing
            if (video.paused) {
              video.play().catch(() => {});
            }
          }
        });
      },
      {
        threshold: [0, 0.05, 0.2]
      }
    );

    observer.observe(heroEl);

    return () => {
      observer.disconnect();
    };
  }, [isMobile]);

  return (
    <section
      ref={heroSectionRef}
      id="hero-section"
      className="relative w-full min-h-[100svh] min-h-screen lg:h-screen lg:min-h-[100vh] flex flex-col justify-start sm:justify-between pt-23 xs:pt-25 sm:pt-24 lg:pt-20 pb-2 xs:pb-3 sm:pb-5 lg:pb-3 px-3 sm:px-6 lg:px-8 overflow-hidden bg-neutral-950 text-white select-none"
    >
      {/* Anchor identifier for Hero section navigation */}
      <div id="hero" className="absolute top-0 left-0 w-0 h-0 pointer-events-none" />

      {/* Hardware-Accelerated Responsive Background Video Showcase - Lightly Softened & Vibrant */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          key={isMobile ? 'mobile-stream' : 'desktop-stream'}
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full object-cover will-change-transform transform-gpu opacity-[0.65]"
        >
          {/* Fast, hardware-accelerated H.264 MP4 stream optimized by Cloudinary CDN */}
          <source
            src={
              isMobile
                ? 'https://res.cloudinary.com/k7nwpt9h/video/upload/q_auto,f_auto,w_720/v1789051752/InShot_20260910_192416135.mp4'
                : 'https://res.cloudinary.com/k7nwpt9h/video/upload/q_auto,f_auto,w_1280/v1789051581/InShot_20260910_191830406.mp4'
            }
            type="video/mp4"
          />
          {/* Fallback WebM stream */}
          <source
            src={
              isMobile
                ? 'https://res.cloudinary.com/k7nwpt9h/video/upload/v1789051752/InShot_20260910_192416135.webm'
                : 'https://res.cloudinary.com/k7nwpt9h/video/upload/v1789051581/InShot_20260910_191830406.webm'
            }
            type="video/webm"
          />
        </video>

        {/* Sophisticated Dark Tint (40%) to soften video and let foreground shine */}
        <div className="absolute inset-0 bg-neutral-950/40 pointer-events-none" />
      </div>

      {/* Main Content Area: Responsive container matching wide grid alignment */}
      <div className="relative z-10 max-w-7xl xl:max-w-[1400px] mx-auto flex flex-col justify-start sm:justify-between flex-1 w-full py-1.5 xs:py-2 sm:py-4 md:py-6">
        {/* Upper Content Section: Status, Headings, CTAs & Disciplines */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl mt-1.5 xs:mt-2 sm:my-auto lg:my-auto sm:pt-1 md:pt-3">
          {/* Top Status & Availability Capsule */}
          <motion.div
            id="hero-top-status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-5 xs:mb-6 sm:mb-3.5 md:mb-5 lg:mb-3.5 lg:self-start"
          >
            <div
              id="hero-status-pill"
              className="inline-flex items-center gap-2 xs:gap-2.5 px-3.5 xs:px-4 sm:px-4 py-1.5 sm:py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-[11px] xs:text-xs lg:text-[12.5px] text-neutral-200 font-medium transition-all"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0075f7]" />
              </span>
              <span className="font-semibold text-white tracking-wide">Usman DevHub</span>
              <span className="text-white/40">•</span>
              <span className="text-blue-300 font-medium">Tech &amp; Creative Studio</span>
            </div>
          </motion.div>

          {/* Masterclass Heading - Refined, Professional Scale */}
          <motion.h1
            id="hero-main-heading"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-2xl xs:text-3xl sm:text-4xl lg:text-[36px] xl:text-[42px] font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] leading-[1.22] xs:leading-[1.2] sm:leading-[1.16] text-center lg:text-left max-w-xl lg:max-w-2xl xl:max-w-3xl"
          >
            Architecting Next-Gen <span className="text-[#0075f7]">Web</span> Platforms &amp; Immersive 3D Experiences
          </motion.h1>

          {/* High-Contrast Crisp Supporting Description */}
          <motion.p
            id="hero-subheading-text"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 xs:mt-6 sm:mt-3.5 md:mt-4.5 lg:mt-3 text-xs xs:text-sm sm:text-base lg:text-[15px] xl:text-[16px] font-normal text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] max-w-lg sm:max-w-xl lg:max-w-2xl xl:max-w-3xl leading-relaxed text-center lg:text-left px-1 xs:px-0"
          >
            Engineering high-performance digital products, bespoke commerce, and modern brand experiences crafted for ambitious businesses worldwide.
          </motion.p>

          {/* High-Fashion CTA Action Group */}
          <motion.div
            id="hero-cta-button-group"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="w-full flex flex-row items-center justify-center lg:justify-start gap-2.5 xs:gap-3.5 sm:gap-4 mt-6 xs:mt-7 sm:mt-4.5 md:mt-6 lg:mt-5"
          >
            {/* Primary Action: Start Project */}
            <button
              id="hero-btn-start-project"
              onClick={onOpenContact}
              className="group relative flex items-center justify-center gap-1.5 xs:gap-2 px-5 sm:px-6 py-3 sm:py-3 rounded-full bg-gradient-to-r from-[#1430d8] via-[#0065ea] to-[#0075f7] text-white font-semibold text-xs xs:text-sm sm:text-sm shadow-[0_8px_24px_rgba(0,101,234,0.5)] hover:shadow-[0_12px_32px_rgba(0,117,247,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer flex-1 sm:flex-initial"
            >
              <Sparkles className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-blue-200 shrink-0" />
              <span className="tracking-wide whitespace-nowrap">Start a Project</span>
              <ArrowRight className="w-3.5 h-3.5 xs:w-4 xs:h-4 transition-transform group-hover:translate-x-1 shrink-0 hidden xs:inline" />
            </button>

            {/* Secondary Action: View Portfolio */}
            <button
              id="hero-btn-view-portfolio"
              onClick={onViewPortfolio}
              className="flex items-center justify-center gap-1.5 xs:gap-2 px-5 sm:px-6 py-3 sm:py-3 rounded-full bg-black/60 hover:bg-black/80 active:scale-[0.98] backdrop-blur-md border border-white/30 hover:border-white/60 text-white font-semibold text-xs xs:text-sm sm:text-sm transition-all duration-300 cursor-pointer shadow-lg flex-1 sm:flex-initial"
            >
              <Layers className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-blue-300 shrink-0" />
              <span className="whitespace-nowrap">View Portfolio</span>
            </button>
          </motion.div>

          {/* Clean Inline Partner Commission Note for Mobile & Tablet - Positioned directly below Start a Project CTA */}
          <motion.p
            id="hero-partner-commission-line"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="lg:hidden mt-5 xs:mt-6 sm:mt-4 md:mt-5 text-xs sm:text-[13px] md:text-sm font-medium text-neutral-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] leading-relaxed max-w-xl px-2 text-center"
          >
            Refer a client &amp; earn a guaranteed{' '}
            <span className="font-bold text-blue-300">20% commission on every project</span>
            <span aria-hidden="true" className="mx-1.5 text-white/40">&middot;</span>
            <a
              href="#referral"
              onClick={handleScrollToReferral}
              className="inline-flex items-center gap-1 font-semibold text-white underline decoration-blue-400/70 underline-offset-4 hover:text-blue-300 hover:decoration-blue-300 transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-xs"
            >
              <span>Join Partner Program</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </a>
          </motion.p>

          {/* 7-Discipline Showcase: Single-Row Capsule on Desktop, 2-Row on Mobile/Tablet */}
          <motion.div
            id="hero-disciplines-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="w-full mt-6 xs:mt-7 sm:mt-4 md:mt-6 lg:mt-4 flex justify-center lg:justify-start"
          >
            {/* Desktop: Sleek Single-Row Horizontal Capsule */}
            <div className="hidden lg:flex relative items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 rounded-full bg-black/75 border border-white/20 backdrop-blur-xl shadow-xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#0075f7]/70 to-transparent pointer-events-none" />
              {[
                { shortName: 'Web Dev', fullName: 'Web Development', id: 'srv-1', icon: <Globe className="w-3.5 h-3.5 text-sky-400" />, bg: 'bg-sky-500/15 border-sky-400/30' },
                { shortName: '3D Web', fullName: '3D Animated Websites', id: 'srv-2', icon: <Box className="w-3.5 h-3.5 text-violet-400" />, bg: 'bg-violet-500/15 border-violet-400/30' },
                { shortName: 'E-Com', fullName: 'E-Commerce Development', id: 'srv-3', icon: <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />, bg: 'bg-emerald-500/15 border-emerald-400/30' },
                { shortName: 'Graphics', fullName: 'Graphic Design', id: 'srv-4', icon: <Palette className="w-3.5 h-3.5 text-pink-400" />, bg: 'bg-pink-500/15 border-pink-400/30' },
                { shortName: '3D Video', fullName: '3D Video Animation', id: 'srv-5', icon: <Film className="w-3.5 h-3.5 text-amber-400" />, bg: 'bg-amber-500/15 border-amber-400/30' },
                { shortName: 'Cloud', fullName: 'Website Deployment & Cloud Setup', id: 'srv-6', icon: <Cloud className="w-3.5 h-3.5 text-cyan-400" />, bg: 'bg-cyan-500/15 border-cyan-400/30' },
                { shortName: 'Maintenance', fullName: 'Website Maintenance', id: 'srv-7', icon: <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />, bg: 'bg-teal-500/15 border-teal-400/30' }
              ].map((s) => (
                <a
                  key={s.id}
                  href={`#service-card-${s.id}`}
                  title={s.fullName}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(`service-card-${s.id}`) || document.getElementById('services');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="group flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.12] border border-white/10 hover:border-blue-400/50 transition-all duration-150 cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${s.bg}`}>
                    {s.icon}
                  </div>
                  <span className="font-bold text-xs text-white group-hover:text-blue-300 transition-colors whitespace-nowrap">
                    {s.shortName}
                  </span>
                </a>
              ))}
            </div>

            {/* Mobile / Tablet: 2-Row Capsule */}
            <div className="lg:hidden w-full max-w-2xl relative rounded-xl bg-black/70 border border-white/20 backdrop-blur-xl shadow-lg p-2.5 xs:p-3 sm:p-2.5 md:p-3 overflow-hidden mb-4 xs:mb-5 sm:mb-0">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#0075f7]/60 to-transparent pointer-events-none" />
              <div className="flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2 md:gap-2.5 mb-2.5 xs:mb-3 sm:mb-2">
                {[
                  { shortName: 'Web Dev', fullName: 'Web Development', id: 'srv-1', icon: <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" />, bg: 'bg-sky-500/15 border-sky-400/30' },
                  { shortName: '3D Web', fullName: '3D Animated Websites', id: 'srv-2', icon: <Box className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-400" />, bg: 'bg-violet-500/15 border-violet-400/30' },
                  { shortName: 'E-Com', fullName: 'E-Commerce Development', id: 'srv-3', icon: <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />, bg: 'bg-emerald-500/15 border-emerald-400/30' },
                  { shortName: 'Graphics', fullName: 'Graphic Design', id: 'srv-4', icon: <Palette className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-400" />, bg: 'bg-pink-500/15 border-pink-400/30' }
                ].map((s) => (
                  <a
                    key={s.id}
                    href={`#service-card-${s.id}`}
                    title={s.fullName}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(`service-card-${s.id}`) || document.getElementById('services');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="group flex-1 basis-auto flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.12] border border-white/10 hover:border-blue-400/50 transition-all duration-150 cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center shrink-0 border ${s.bg}`}>
                      {s.icon}
                    </div>
                    <span className="font-bold text-[10px] xs:text-[11px] sm:text-xs text-white group-hover:text-blue-300 transition-colors whitespace-nowrap">
                      {s.shortName}
                    </span>
                  </a>
                ))}
              </div>
              <div className="flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2 max-w-md sm:max-w-lg mx-auto">
                {[
                  { shortName: '3D Video', fullName: '3D Video Animation', id: 'srv-5', icon: <Film className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />, bg: 'bg-amber-500/15 border-amber-400/30' },
                  { shortName: 'Cloud', fullName: 'Website Deployment & Cloud Setup', id: 'srv-6', icon: <Cloud className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />, bg: 'bg-cyan-500/15 border-cyan-400/30' },
                  { shortName: 'Maintenance', fullName: 'Website Maintenance', id: 'srv-7', icon: <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-400" />, bg: 'bg-teal-500/15 border-teal-400/30' }
                ].map((s) => (
                  <a
                    key={s.id}
                    href={`#service-card-${s.id}`}
                    title={s.fullName}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(`service-card-${s.id}`) || document.getElementById('services');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="group flex-1 basis-auto flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.12] border border-white/10 hover:border-blue-400/50 transition-all duration-150 cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center shrink-0 border ${s.bg}`}>
                      {s.icon}
                    </div>
                    <span className="font-bold text-[10px] xs:text-[11px] sm:text-xs text-white group-hover:text-blue-300 transition-colors whitespace-nowrap">
                      {s.shortName}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Desktop: 4-Column Full-Width Metrics & 20% Commission Bar */}
        <motion.div
          id="hero-metrics-bar-desktop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="hidden lg:grid grid-cols-12 gap-4 xl:gap-6 items-center w-full mt-auto pt-3 pb-1 border-t border-white/20"
        >
            <div className="col-span-3 flex flex-col items-center">
              <span className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-white font-display drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">75+</span>
              <span className="text-xs lg:text-[13px] text-neutral-300 font-medium mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">Projects Delivered</span>
            </div>
            
            <div className="col-span-3 flex flex-col items-center border-l border-white/20">
              <span className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-[#0075f7] font-display drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">100%</span>
              <span className="text-xs lg:text-[13px] text-neutral-300 font-medium mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">On-Time SLA</span>
            </div>
            
            <div className="col-span-3 flex flex-col items-center border-l border-white/20">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-emerald-400 font-display tabular-nums drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">{liveRating}</span>
                <Star className="w-4.5 h-4.5 fill-amber-400 text-amber-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
              </div>
              <span className="text-xs lg:text-[13px] text-neutral-300 font-medium mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">Client Rating</span>
            </div>

            <div className="col-span-3 flex items-center justify-center">
              <a
                href="#referral"
                onClick={handleScrollToReferral}
                className="group flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-black/60 hover:bg-black/80 border border-white/20 hover:border-blue-400/50 backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg w-full max-w-[240px]"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[12.5px] font-bold text-white group-hover:text-blue-300 transition-colors whitespace-nowrap">
                    20% Commission
                  </span>
                  <span className="text-[10.5px] text-neutral-400 group-hover:text-neutral-300 transition-colors whitespace-nowrap">
                    On Every Project
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto shrink-0" />
              </a>
            </div>
          </motion.div>

          {/* Mobile / Tablet: 3-Column Metrics + Inline Partner Commission Note */}
          <div className="lg:hidden w-full flex flex-col items-center mt-16 xs:mt-20 sm:mt-12 md:mt-16 pt-4 xs:pt-6 sm:pt-4 pb-2 xs:pb-3 sm:pb-6">
            <motion.div
              id="hero-metrics-bar-mobile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-0 pt-5 xs:pt-6 sm:pt-5 md:pt-6 border-t border-white/20 w-full max-w-sm xs:max-w-lg sm:max-w-xl md:max-w-2xl grid grid-cols-3 gap-2 sm:gap-6 md:gap-8 text-center"
            >
              <div className="flex flex-col items-center">
                <span className="text-2xl xs:text-3xl sm:text-3xl md:text-4xl font-black text-white font-display drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">75+</span>
                <span className="text-xs xs:text-sm text-neutral-200 font-semibold mt-1.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">Projects Delivered</span>
              </div>
              <div className="flex flex-col items-center border-x border-white/25">
                <span className="text-2xl xs:text-3xl sm:text-3xl md:text-4xl font-black text-[#0075f7] font-display drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">100%</span>
                <span className="text-xs xs:text-sm text-neutral-200 font-semibold mt-1.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">On-Time SLA</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl xs:text-3xl sm:text-3xl md:text-4xl font-black text-emerald-400 font-display tabular-nums drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">{liveRating}</span>
                  <Star className="w-5 h-5 xs:w-5.5 xs:h-5.5 sm:w-6 sm:h-6 fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
                </div>
                <span className="text-xs xs:text-sm text-neutral-200 font-semibold mt-1.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">Client Rating</span>
              </div>
            </motion.div>
          </div>
        </div>
    </section>
  );
};
