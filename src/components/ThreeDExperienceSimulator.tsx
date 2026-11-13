import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  Zap,
  MousePointer,
  Smartphone,
  Eye,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';

interface ThreeDExperienceSimulatorProps {
  typeId: string;
  typeName: string;
}

export const ThreeDExperienceSimulator: React.FC<ThreeDExperienceSimulatorProps> = ({
  typeId,
  typeName
}) => {
  // Normalize type
  const isScrollDriven =
    typeId === 'scroll-driven-video-hero' ||
    typeId.includes('scroll') ||
    typeId.includes('cinema-zoom') ||
    typeName.toLowerCase().includes('scroll-driven');
  const isVariantStudio =
    typeId === 'interactive-variant-studio' ||
    typeId.includes('variant') ||
    typeName.toLowerCase().includes('product experiences');
  const isCinematicAtmosphere =
    typeId === 'cinematic-video-atmosphere' ||
    typeId.includes('cinematic') ||
    typeId.includes('video') ||
    typeName.toLowerCase().includes('cinematic 3d');

  // =========================================================================
  // SCROLL-DRIVEN VIDEO HERO STATE
  // =========================================================================
  const [scrollProgress, setScrollProgress] = useState<number>(20);
  const [isSimulatingScroll, setIsSimulatingScroll] = useState<boolean>(false);
  const [scrollDirection, setScrollDirection] = useState<'forward' | 'reverse'>('forward');
  const scrollAnimRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prevProgressRef = useRef<number>(20);

  // Sync video currentTime with scrollProgress
  useEffect(() => {
    if (isScrollDriven && videoRef.current) {
      const vid = videoRef.current;
      if (vid.duration && !isNaN(vid.duration)) {
        vid.currentTime = (scrollProgress / 100) * vid.duration;
      }
    }
    // Track direction
    if (scrollProgress > prevProgressRef.current) {
      setScrollDirection('forward');
    } else if (scrollProgress < prevProgressRef.current) {
      setScrollDirection('reverse');
    }
    prevProgressRef.current = scrollProgress;
  }, [scrollProgress, isScrollDriven]);

  // Auto simulate user scrolling forward & back
  useEffect(() => {
    if (!isSimulatingScroll) {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
      return;
    }

    let forward = true;
    let current = scrollProgress;

    const step = () => {
      if (forward) {
        current += 0.35;
        if (current >= 100) {
          current = 100;
          forward = false;
        }
      } else {
        current -= 0.35;
        if (current <= 5) {
          current = 5;
          forward = true;
        }
      }
      setScrollProgress(Math.round(current * 10) / 10);
      scrollAnimRef.current = requestAnimationFrame(step);
    };

    scrollAnimRef.current = requestAnimationFrame(step);
    return () => {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, [isSimulatingScroll]);

  // Handle wheel on preview box to scrub
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsSimulatingScroll(false);
    setScrollProgress((prev) => {
      const delta = e.deltaY > 0 ? 3 : -3;
      return Math.min(100, Math.max(0, prev + delta));
    });
  };

  // Milestone data for scroll-driven frame-by-frame reveal
  const currentMilestone = useCallback(() => {
    if (scrollProgress < 25) {
      return {
        stage: '01',
        title: 'Sequence Lock & Frame Scrub Initiation',
        caption: 'Hero viewport pins seamlessly. Animation responds dynamically to forward and reverse scroll.',
        badge: '0% – 25% Scroll Range'
      };
    } else if (scrollProgress < 55) {
      return {
        stage: '02',
        title: 'Gradual Product Opening & Transformation',
        caption: 'Scrolling down advances frames to reveal product opening and rotation with fluid motion.',
        badge: '25% – 55% Scroll Range'
      };
    } else if (scrollProgress < 85) {
      return {
        stage: '03',
        title: 'Exploded View & Internal Engineering Details',
        caption: 'Internal engineering reveals frame-by-frame. Scrolling upward reverses the sequence smoothly.',
        badge: '55% – 85% Scroll Range'
      };
    } else {
      return {
        stage: '04',
        title: 'Reveal Completion & Graceful Unpin',
        caption: 'Sequence completes and viewport unpins smoothly into subsequent content.',
        badge: '85% – 100% Scroll Range'
      };
    }
  }, [scrollProgress])();

  // =========================================================================
  // INTERACTIVE VARIANT STUDIO STATE
  // =========================================================================
  interface VariantOption {
    id: string;
    name: string;
    colorHex: string;
    bgGlow: string;
    accentColor: string;
    finish: string;
    specs: string;
    image: string;
  }

  const variants: VariantOption[] = [
    {
      id: 'phantom',
      name: 'Obsidian Matte',
      colorHex: '#18181b',
      bgGlow: 'from-neutral-900 to-black',
      accentColor: '#3b82f6',
      finish: 'Micro-textured aerospace carbon fiber',
      specs: '100% Recycled Titanium Housing',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'glacier',
      name: 'Glacier Snow',
      colorHex: '#e2e8f0',
      bgGlow: 'from-slate-100 to-slate-200',
      accentColor: '#0284c7',
      finish: 'Satin pearl ceramic with oleophobic coating',
      specs: 'Ceramic Sapphire Anti-Reflective Lens',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'cyan',
      name: 'Cyber Cyan',
      colorHex: '#06b6d4',
      bgGlow: 'from-cyan-950/60 to-blue-950/60',
      accentColor: '#06b6d4',
      finish: 'Anodized brushed electro-luminescent tint',
      specs: 'Ion-Infused Metallic Alloy Bezel',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'gold',
      name: 'Solar Amber',
      colorHex: '#d97706',
      bgGlow: 'from-amber-950/50 to-neutral-950',
      accentColor: '#f59e0b',
      finish: '18K Electro-plated satin warm gold',
      specs: 'Gold-Plated Precision Micro-Movement',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80'
    }
  ];

  const [activeVariant, setActiveVariant] = useState<VariantOption>(variants[0]);
  const [isRotating, setIsRotating] = useState<boolean>(true);

  const handlePrevVariant = () => {
    const curIdx = variants.findIndex((v) => v.id === activeVariant.id);
    const prevIdx = curIdx > 0 ? curIdx - 1 : variants.length - 1;
    setActiveVariant(variants[prevIdx]);
  };

  const handleNextVariant = () => {
    const curIdx = variants.findIndex((v) => v.id === activeVariant.id);
    const nextIdx = curIdx < variants.length - 1 ? curIdx + 1 : 0;
    setActiveVariant(variants[nextIdx]);
  };

  // =========================================================================
  // CINEMATIC VIDEO ATMOSPHERE STATE
  // =========================================================================
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [glassStyle, setGlassStyle] = useState<'ultra-clear' | 'frosted'>('frosted');

  return (
    <div className="mt-10 sm:mt-14 p-5 sm:p-8 rounded-3xl bg-neutral-950 text-white border border-neutral-800 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      {/* Top Header & Simulation Badge */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Interactive Live Prototype</span>
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            <span className="text-neutral-400 font-normal">Real-Time Simulation</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {isScrollDriven && 'Live Demo: Scroll-Driven Animation (Frame-by-Frame Scrubbing)'}
            {isVariantStudio && 'Live Demo: Interactive 3D Product Experiences (Hero Variant Switcher)'}
            {isCinematicAtmosphere && 'Live Demo: Cinematic 3D Websites (Full-Screen Video Atmospheres)'}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
            {isScrollDriven &&
              'Drag the slider or scroll over the canvas to scrub frames forward and in reverse, creating tactile product reveals.'}
            {isVariantStudio &&
              'Click arrows or swatches to switch product colors and finishes smoothly on a steady backdrop, paired with GSAP scroll reveals.'}
            {isCinematicAtmosphere &&
              'Full-screen video atmospheres paired with frosted glass typography overlays and ambient sound controls.'}
          </p>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-neutral-300">60 FPS Hardware</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SCROLL-DRIVEN VIDEO HERO SIMULATOR */}
      {/* ========================================================================= */}
      {isScrollDriven && (
        <div className="mt-6 space-y-6">
          {/* Main Visual Display Box */}
          <div
            onWheel={handleWheel}
            className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-inner group select-none flex items-center justify-center cursor-ns-resize"
            title="Scroll mouse wheel here to scrub video frames!"
          >
            {/* Real HTML5 Video element synced with scrollProgress */}
            <video
              ref={videoRef}
              src="https://res.cloudinary.com/k7nwpt9h/video/upload/q_auto,f_auto,w_1280/v1789051581/InShot_20260910_191830406.mp4"
              playsInline
              muted
              preload="auto"
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              className="absolute inset-0 w-full h-full object-cover opacity-85 transition-opacity"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-neutral-950/40 pointer-events-none" />

            {/* Top HUD Bar */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 font-mono text-neutral-300">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Scroll Track: {scrollProgress.toFixed(0)}%</span>
                <span className="text-neutral-500">|</span>
                <span className={scrollDirection === 'forward' ? 'text-blue-400' : 'text-amber-400'}>
                  {scrollDirection === 'forward' ? '▶ Forward' : '◀ Reverse'}
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-neutral-300 font-mono text-[11px]">
                <MousePointer className="w-3.5 h-3.5 text-blue-400" />
                <span>Scroll mouse wheel to scrub</span>
              </div>
            </div>

            {/* Dynamic Kinetic Milestone Caption Overlay */}
            <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMilestone.stage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 max-w-xl"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                    <span>Milestone {currentMilestone.stage}</span>
                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                    <span className="text-neutral-400 text-[11px]">{currentMilestone.badge}</span>
                  </div>
                  <h4 className="font-display text-sm sm:text-base font-bold text-white">
                    {currentMilestone.title}
                  </h4>
                  <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                    {currentMilestone.caption}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Interactive Scrub Track Controls */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSimulatingScroll(!isSimulatingScroll)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    isSimulatingScroll
                      ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                  }`}
                >
                  {isSimulatingScroll ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause Auto-Scrub</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Simulate User Scroll</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsSimulatingScroll(false);
                    setScrollProgress(0);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
                  title="Reset to frame 0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset (0%)</span>
                </button>
              </div>

              {/* Milestone Shortcut Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { label: 'Start (0%)', val: 0 },
                  { label: 'Chassis (35%)', val: 35 },
                  { label: 'Core Specs (70%)', val: 70 },
                  { label: 'Finished (100%)', val: 100 }
                ].map((m) => (
                  <button
                    key={m.val}
                    onClick={() => {
                      setIsSimulatingScroll(false);
                      setScrollProgress(m.val);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer shrink-0 ${
                      Math.abs(scrollProgress - m.val) < 15
                        ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Range Slider Track */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>0% Top of Hero (Pin Starts)</span>
                <span className="text-white font-bold">{scrollProgress.toFixed(0)}% Scrolled</span>
                <span>100% End of Hero (Unpins)</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={scrollProgress}
                onChange={(e) => {
                  setIsSimulatingScroll(false);
                  setScrollProgress(parseFloat(e.target.value));
                }}
                className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 focus:outline-hidden"
              />
            </div>

            {/* Technical Verification Note */}
            <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero Stutter: Frame playback bound directly to browser requestAnimationFrame.</span>
              </div>
              <span className="font-mono text-neutral-500">Tech: GSAP ScrollTrigger + HTML5 Canvas</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE VARIANT STUDIO SIMULATOR */}
      {/* ========================================================================= */}
      {isVariantStudio && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Visual Preview Canvas */}
            <div className="lg:col-span-8 relative h-72 sm:h-88 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center p-6">
              {/* Dynamic ambient studio glow synced with active variant */}
              <div
                className={`absolute inset-0 bg-radial transition-all duration-700 pointer-events-none opacity-40`}
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${activeVariant.accentColor}33 0%, transparent 70%)`
                }}
              />

              {/* Product Image with smooth entrance transition */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeVariant.id}
                  initial={{ opacity: 0, scale: 0.94, rotate: isRotating ? -4 : 0 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.04, rotate: isRotating ? 4 : 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="relative z-10 w-full max-w-sm h-56 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                >
                  <img
                    src={activeVariant.image}
                    alt={activeVariant.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Hotspot indicator pin */}
                  <div className="absolute top-1/3 right-1/4 pointer-events-auto">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white" />
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-xs text-white">
                    <div className="font-bold">{activeVariant.name}</div>
                    <div className="text-[11px] text-neutral-300">{activeVariant.specs}</div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Interactive Directional Arrow Controls for Hero Product */}
              <button
                type="button"
                onClick={handlePrevVariant}
                aria-label="Previous product variant"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-[#1430d8] text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105"
                title="Previous Variant (Arrow Control)"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={handleNextVariant}
                aria-label="Next product variant"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-[#1430d8] text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105"
                title="Next Variant (Arrow Control)"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Top Bar with Variant Details */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs pointer-events-none">
                <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono">
                  Variant: <span className="font-bold text-blue-400">{activeVariant.name}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-neutral-300 font-mono text-[11px]">
                  Fixed Ambient Canvas: Locked
                </div>
              </div>
            </div>

            {/* Right Controls Sidebar */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  <span>Product Variant Controls</span>
                  <span className="text-[10px] text-blue-400 font-normal">Arrows or Swatches</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setActiveVariant(v)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        activeVariant.id === v.id
                          ? 'bg-blue-500/15 border-blue-500 text-white shadow-xs'
                          : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                          style={{ backgroundColor: v.colorHex }}
                        />
                        <span className="font-bold text-xs truncate">{v.name}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 truncate">{v.finish}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Variant Specs Card */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-neutral-800 text-xs space-y-1.5">
                <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Material Details
                </div>
                <div className="font-semibold text-white">{activeVariant.finish}</div>
                <div className="text-neutral-400 text-[11px]">{activeVariant.specs}</div>
              </div>

              {/* Interactive Rotation Toggle */}
              <button
                onClick={() => setIsRotating(!isRotating)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
                <span>{isRotating ? '3D Orbit Physics Active' : 'Enable 3D Orbit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CINEMATIC VIDEO ATMOSPHERE SIMULATOR */}
      {/* ========================================================================= */}
      {isCinematicAtmosphere && (
        <div className="mt-6 space-y-6">
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-inner flex items-center justify-center">
            {/* Live Video Element */}
            <video
              src="https://res.cloudinary.com/k7nwpt9h/video/upload/q_auto,f_auto,w_1280/v1789051581/InShot_20260910_191830406.mp4"
              playsInline
              autoPlay
              loop
              muted={isMuted}
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Ambient Backdrop Overlay */}
            <div
              className={`absolute inset-0 transition-all duration-500 pointer-events-none ${
                glassStyle === 'frosted'
                  ? 'bg-black/40 backdrop-blur-xs'
                  : 'bg-black/20'
              }`}
            />

            {/* Glassmorphic UI Card in Foreground */}
            <div className="relative z-10 p-5 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 max-w-md mx-4 text-center shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>Full-Bleed Atmosphere</span>
              </div>
              <h4 className="font-display text-lg sm:text-xl font-extrabold text-white">
                Cinematic Fluid Storytelling
              </h4>
              <p className="mt-1.5 text-xs text-neutral-200 leading-relaxed font-normal">
                High-bitrate video streaming optimized for zero-stutter playback across all screen resolutions and network conditions.
              </p>

              {/* Controls inside video */}
              <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer"
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Unmute Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-blue-300" />
                      <span>Mute Audio</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setGlassStyle(glassStyle === 'frosted' ? 'ultra-clear' : 'frosted')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Toggle Glass Blur</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
