import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import {
  ChevronLeft,
  ChevronRight,
  Instagram,
  Linkedin
} from 'lucide-react';
import { getLeadershipTeam } from '../services/storageService';
import { LeadershipMember } from '../types';

interface FounderSectionProps {
  onOpenContact?: () => void;
}

export const FounderSection: React.FC<FounderSectionProps> = () => {
  const [teamMembers, setTeamMembers] = useState<LeadershipMember[]>(() => getLeadershipTeam());
  const [activeIdx, setActiveIdx] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const prevBtnRef = useRef<HTMLButtonElement | null>(null);
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const lastAnimTimeRef = useRef<number>(0);
  const animLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdxRef = useRef(0);

  const total = teamMembers.length; // 3 members

  useEffect(() => {
    const handleUpdate = () => {
      setTeamMembers(getLeadershipTeam());
    };
    window.addEventListener('usman_agency_data_updated', handleUpdate);
    return () => window.removeEventListener('usman_agency_data_updated', handleUpdate);
  }, []);

  // Responsive 3D layout coordinates for visible 3-card stage
  const getMetrics = useCallback(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const isSmallMobile = width < 400;
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;

    return {
      sideOffsetPercent: isSmallMobile ? 54 : isMobile ? 60 : isTablet ? 74 : 76,
      scaleCenter: 1.0,
      scaleSide: isSmallMobile ? 0.72 : isMobile ? 0.78 : 0.86,
      zCenter: 35,
      zSide: isMobile ? -55 : -40,
      rotateYSide: isMobile ? 18 : 16,
      opacitySide: isMobile ? 0.35 : 0.82
    };
  }, []);

  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafTiltRef = useRef<number | null>(null);

  // Detect active scrolling to completely disable expensive mouse-tilt computations during scroll
  useEffect(() => {
    const onScroll = () => {
      isScrollingRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 120);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (rafTiltRef.current) cancelAnimationFrame(rafTiltRef.current);
    };
  }, []);

  // Sets static positions without animated transitions (used on mount & window resize)
  const applyLayoutPositions = useCallback(
    (centerIdx: number) => {
      const { sideOffsetPercent, scaleCenter, scaleSide, zCenter, zSide, rotateYSide, opacitySide } = getMetrics();

      teamMembers.forEach((_, idx) => {
        const cardEl = cardRefs.current[idx];
        if (!cardEl) return;

        const isCenter = idx === centerIdx;
        const isLeft = idx === (centerIdx - 1 + total) % total;
        const isRight = idx === (centerIdx + 1) % total;

        if (isCenter) {
          gsap.set(cardEl, {
            xPercent: 0,
            scale: scaleCenter,
            rotateY: 0,
            z: zCenter,
            opacity: 1,
            zIndex: 30,
            boxShadow: '0 20px 35px -5px rgba(0, 117, 247, 0.32)'
          });
        } else if (isLeft) {
          gsap.set(cardEl, {
            xPercent: -sideOffsetPercent,
            scale: scaleSide,
            rotateY: rotateYSide,
            z: zSide,
            opacity: opacitySide,
            zIndex: 10,
            boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.35)'
          });
        } else if (isRight) {
          gsap.set(cardEl, {
            xPercent: sideOffsetPercent,
            scale: scaleSide,
            rotateY: -rotateYSide,
            z: zSide,
            opacity: opacitySide,
            zIndex: 10,
            boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.35)'
          });
        }
      });
    },
    [getMetrics, total]
  );

  // Directional 3D Transition: "Ek Peeche Jaye, New Aage Aaye"
  const transitionTo = useCallback(
    (targetIdxRaw: number, dir: 'next' | 'prev') => {
      const now = Date.now();
      if (isAnimatingRef.current && now - lastAnimTimeRef.current < 550) return;
      isAnimatingRef.current = true;
      lastAnimTimeRef.current = now;

      const { sideOffsetPercent, scaleCenter, scaleSide, zCenter, zSide, rotateYSide, opacitySide } = getMetrics();
      const currentIdx = activeIdxRef.current;
      const targetIdx = (targetIdxRaw + total) % total;

      // Tactile physical bounce on Arrow buttons
      if (dir === 'next' && nextBtnRef.current) {
        gsap.timeline()
          .to(nextBtnRef.current, { scale: 0.85, rotate: 12, duration: 0.12, ease: 'power2.in' })
          .to(nextBtnRef.current, { scale: 1, rotate: 0, duration: 0.35, ease: 'back.out(2)' });
      } else if (dir === 'prev' && prevBtnRef.current) {
        gsap.timeline()
          .to(prevBtnRef.current, { scale: 0.85, rotate: -12, duration: 0.12, ease: 'power2.in' })
          .to(prevBtnRef.current, { scale: 1, rotate: 0, duration: 0.35, ease: 'back.out(2)' });
      }

      // Update refs and React state
      activeIdxRef.current = targetIdx;
      setActiveIdx(targetIdx);

      const prevCenter = currentIdx;
      const prevLeft = (currentIdx - 1 + total) % total;
      const prevRight = (currentIdx + 1) % total;

      const duration = 0.55;
      const ease = 'power2.out';

      if (dir === 'next') {
        // NEXT DIRECTION:
        // 1. Current Center Card -> Moves to LEFT and RECEDES BACK in depth ("ek peeche jaye")
        const cardMovingBack = cardRefs.current[prevCenter];
        if (cardMovingBack) {
          gsap.to(cardMovingBack, {
            xPercent: -sideOffsetPercent,
            scale: scaleSide,
            rotateY: rotateYSide,
            z: zSide,
            opacity: opacitySide,
            zIndex: 10,
            boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.35)',
            duration,
            ease
          });
        }

        // 2. Incoming Right Card -> Moves to CENTER and SURGES FORWARD ("new aage aaye")
        const cardSurgingForward = cardRefs.current[prevRight];
        if (cardSurgingForward) {
          gsap.to(cardSurgingForward, {
            xPercent: 0,
            scale: scaleCenter,
            rotateY: 0,
            z: zCenter,
            opacity: 1,
            zIndex: 30,
            boxShadow: '0 20px 35px -5px rgba(0, 117, 247, 0.32)',
            duration,
            ease
          });
        }

        // 3. Old Left Card -> Glides behind across to the RIGHT side
        const cardWrappingAround = cardRefs.current[prevLeft];
        if (cardWrappingAround) {
          const wrapTl = gsap.timeline();
          wrapTl
            .to(cardWrappingAround, {
              z: -140,
              opacity: 0.4,
              scale: scaleSide * 0.9,
              duration: duration * 0.45,
              ease: 'power1.in'
            })
            .set(cardWrappingAround, {
              xPercent: sideOffsetPercent,
              rotateY: -rotateYSide,
              zIndex: 5
            })
            .to(cardWrappingAround, {
              z: zSide,
              opacity: opacitySide,
              scale: scaleSide,
              rotateY: -rotateYSide,
              zIndex: 10,
              boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.35)',
              duration: duration * 0.55,
              ease: 'power2.out'
            });
        }
      } else {
        // PREV DIRECTION:
        // 1. Current Center Card -> Moves to RIGHT and RECEDES BACK in depth ("ek peeche jaye")
        const cardMovingBack = cardRefs.current[prevCenter];
        if (cardMovingBack) {
          gsap.to(cardMovingBack, {
            xPercent: sideOffsetPercent,
            scale: scaleSide,
            rotateY: -rotateYSide,
            z: zSide,
            opacity: opacitySide,
            zIndex: 10,
            boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.35)',
            duration,
            ease
          });
        }

        // 2. Incoming Left Card -> Moves to CENTER and SURGES FORWARD ("new aage aaye")
        const cardSurgingForward = cardRefs.current[prevLeft];
        if (cardSurgingForward) {
          gsap.to(cardSurgingForward, {
            xPercent: 0,
            scale: scaleCenter,
            rotateY: 0,
            z: zCenter,
            opacity: 1,
            zIndex: 30,
            boxShadow: '0 20px 35px -5px rgba(0, 117, 247, 0.32)',
            duration,
            ease
          });
        }

        // 3. Old Right Card -> Glides behind across to the LEFT side
        const cardWrappingAround = cardRefs.current[prevRight];
        if (cardWrappingAround) {
          const wrapTl = gsap.timeline();
          wrapTl
            .to(cardWrappingAround, {
              z: -140,
              opacity: 0.4,
              scale: scaleSide * 0.9,
              duration: duration * 0.45,
              ease: 'power1.in'
            })
            .set(cardWrappingAround, {
              xPercent: -sideOffsetPercent,
              rotateY: rotateYSide,
              zIndex: 5
            })
            .to(cardWrappingAround, {
              z: zSide,
              opacity: opacitySide,
              scale: scaleSide,
              rotateY: rotateYSide,
              zIndex: 10,
              boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.35)',
              duration: duration * 0.55,
              ease: 'power2.out'
            });
        }
      }

      if (animLockTimeoutRef.current) clearTimeout(animLockTimeoutRef.current);
      animLockTimeoutRef.current = setTimeout(() => {
        isAnimatingRef.current = false;
      }, 350);
    },
    [getMetrics, total]
  );

  // Mount & Window resize listener to set 3D coordinates
  useEffect(() => {
    applyLayoutPositions(activeIdxRef.current);

    let lastWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        applyLayoutPositions(activeIdxRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [applyLayoutPositions]);

  // Reset function to bring Muhammad Usman Afzal ("Mera Wala" Founder card) back to center
  const resetToFounder = useCallback(() => {
    const fIdx = teamMembers.findIndex(
      (m) => m.id === 'leader-1' || m.name.toLowerCase().includes('usman')
    );
    const targetIdx = fIdx >= 0 ? fIdx : 0;

    if (activeIdxRef.current !== targetIdx) {
      if (animLockTimeoutRef.current) clearTimeout(animLockTimeoutRef.current);
      cardRefs.current.forEach((card) => {
        if (card) gsap.killTweensOf(card);
      });
      isAnimatingRef.current = false;
      activeIdxRef.current = targetIdx;
      setActiveIdx(targetIdx);
      applyLayoutPositions(targetIdx);
    }
  }, [applyLayoutPositions, teamMembers]);

  // When user scrolls away from this section (up or down) and returns,
  // ensure the Founder card (Muhammad Usman Afzal) is always the first card shown in center.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let wasInView = true;

    // IntersectionObserver triggers when the section leaves or re-enters the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            // User scrolled away from section (either above or below)
            wasInView = false;
            resetToFounder();
          } else {
            // User scrolled back into section
            if (!wasInView) {
              resetToFounder();
              wasInView = true;
            }
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '10px 0px 10px 0px'
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, [resetToFounder]);

  // Clean manual navigation - user triggered
  const handlePrev = useCallback(() => {
    transitionTo(activeIdxRef.current - 1, 'prev');
  }, [transitionTo]);

  const handleNext = useCallback(() => {
    transitionTo(activeIdxRef.current + 1, 'next');
  }, [transitionTo]);

  // Keyboard navigation support (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Resilient Mobile Touch Swipe Handling (Swipe Left -> Next, Swipe Right -> Prev)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const touchEndY = e.changedTouches[0]?.clientY ?? (touchStartYRef.current || 0);
    const diffX = touchStartXRef.current - touchEndX;
    const diffY = (touchStartYRef.current || 0) - touchEndY;

    // Responsive swipe (25px threshold horizontal)
    if (Math.abs(diffX) > 25 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const handleTouchCancel = () => {
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Center card 3D subtle mouse-tilt (disabled during scroll & RAF throttled)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, isCenter: boolean) => {
    if (!isCenter || isScrollingRef.current || typeof window === 'undefined' || window.innerWidth < 768) return;
    const card = e.currentTarget;
    if (rafTiltRef.current) cancelAnimationFrame(rafTiltRef.current);

    const clientX = e.clientX;
    const clientY = e.clientY;

    rafTiltRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;

      gsap.to(card, {
        rotateY: (x / (rect.width / 2)) * 4,
        rotateX: -(y / (rect.height / 2)) * 4,
        duration: 0.2,
        ease: 'power1.out',
        overwrite: 'auto'
      });
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>, isCenter: boolean) => {
    if (!isCenter) return;
    if (rafTiltRef.current) cancelAnimationFrame(rafTiltRef.current);
    gsap.to(e.currentTarget, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  };

  return (
    <section
      ref={sectionRef}
      id="studio"
      data-section="studio"
      className="relative flex flex-col justify-center py-10 xs:py-12 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-b border-neutral-200/70 overflow-hidden select-none"
    >
      <div id="founder" className="sr-only" />

      {/* Ambient background soft light - zero GPU blur cost */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(0,117,247,0.06),transparent_75%)] pointer-events-none -z-10" />

      <div className="w-full max-w-7xl xl:max-w-[1400px] mx-auto my-auto">
        {/* Section Header - Compact on Laptop */}
        <div className="flex flex-col items-center text-center mb-3 sm:mb-3 lg:mb-4 max-w-2xl mx-auto px-2">
          {/* Global Studio Presence Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] sm:text-xs font-semibold mb-1.5 shadow-2xs">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Romania (EU) 🇷🇴 & Pakistan (HQ) 🇵🇰</span>
          </div>

          <h2 className="font-display text-2xl xs:text-3xl sm:text-2xl lg:text-3xl font-extrabold text-[#0e0e0e] tracking-tight leading-tight">
            The Core Team
          </h2>
          <p className="mt-1 text-xs sm:text-xs lg:text-sm text-neutral-600 font-medium max-w-lg leading-relaxed">
            European client partnerships (Romania 🇷🇴) backed by direct founder-led full-stack engineering (Pakistan 🇵🇰).
          </p>
        </div>

        {/* 3D Coverflow Viewport with 1000px Perspective - Tall on Mobile, Compact on Laptop */}
        <div
          ref={containerRef}
          className="relative w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto h-[435px] xs:h-[460px] sm:h-[355px] lg:h-[370px] flex items-center justify-center [perspective:1000px] touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          {/* Prominent Left Arrow Button */}
          <button
            ref={prevBtnRef}
            type="button"
            onClick={handlePrev}
            aria-label="Previous Team Member"
            title="Previous (or press Left Arrow)"
            className="absolute left-1 xs:left-2 sm:left-4 z-40 w-9 h-9 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full bg-white/95 backdrop-blur-xs text-neutral-800 hover:text-[#1430d8] border-2 border-neutral-200 shadow-md flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95 hover:border-blue-500 focus:outline-hidden"
          >
            <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
          </button>

          {/* Prominent Right Arrow Button */}
          <button
            ref={nextBtnRef}
            type="button"
            onClick={handleNext}
            aria-label="Next Team Member"
            title="Next (or press Right Arrow)"
            className="absolute right-1 xs:right-2 sm:right-4 z-40 w-9 h-9 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full bg-white/95 backdrop-blur-xs text-neutral-800 hover:text-[#1430d8] border-2 border-neutral-200 shadow-md flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95 hover:border-blue-500 focus:outline-hidden"
          >
            <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
          </button>

          {/* The 3 Stage Cards Container */}
          <div className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d]">
            {teamMembers.map((member, idx) => {
              const isCenter = idx === activeIdx;
              const isLeft = idx === (activeIdx - 1 + total) % total;
              const isRight = idx === (activeIdx + 1) % total;

              return (
                <div
                  key={member.id}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  id={`carousel-card-${member.id}`}
                  onClick={() => {
                    if (isLeft) handlePrev();
                    if (isRight) handleNext();
                  }}
                  onMouseMove={(e) => handleMouseMove(e, isCenter)}
                  onMouseLeave={(e) => handleMouseLeave(e, isCenter)}
                  className={`absolute w-[280px] xs:w-[305px] sm:w-[250px] lg:w-[265px] rounded-2xl bg-[#0f1117] text-white overflow-hidden transition-colors duration-200 ${
                    isCenter
                      ? 'border-2 border-[#0075f7] ring-4 ring-[#0075f7]/25 cursor-default'
                      : 'border border-neutral-800 hover:border-neutral-600 cursor-pointer group'
                  }`}
                >
                  {/* Portrait Frame - Tall on Mobile, Compact on Laptop */}
                  <div className="relative h-[255px] xs:h-[275px] sm:h-[195px] lg:h-[205px] w-full bg-neutral-900 overflow-hidden flex items-center justify-center">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className={`w-full h-full object-cover object-[center_15%] transition-transform duration-300 ${
                          isCenter ? 'scale-100' : 'group-hover:scale-105'
                        }`}
                        loading="eager"
                        decoding="async"
                      />
                    ) : (
                      /* Fallback Monogram Avatar */
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-neutral-800 to-neutral-950">
                        <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#1430d8] to-[#0075f7] p-0.5 shadow-lg mb-1.5 flex items-center justify-center">
                          <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center font-display text-lg sm:text-base font-black text-white">
                            {member.initials}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Gradient scrim for clean bottom contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-transparent to-black/20 pointer-events-none" />
                  </div>

                  {/* Clean Minimal Card Content: Name + Role & Country + Social Links */}
                  <div className="py-2.5 sm:py-2 px-3.5 sm:px-3 bg-[#0f1117] border-t border-neutral-800 text-center flex flex-col items-center justify-center">
                    <h3 className="font-display text-base xs:text-[17px] sm:text-sm lg:text-[15px] font-bold text-white tracking-tight leading-snug">
                      {member.name}
                    </h3>

                    <div className="mt-0.5 sm:mt-1 flex items-center justify-center gap-1.5 flex-wrap text-xs sm:text-[11px] lg:text-xs">
                      <span className="font-semibold text-[#0075f7]">
                        {member.role}
                      </span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-neutral-300 font-medium inline-flex items-center gap-1 text-xs sm:text-[11px] lg:text-xs">
                        <span>{member.flag}</span>
                        <span>{member.location}</span>
                      </span>
                    </div>

                    {(member.linkedinUrl || member.instagramUrl) && (
                      <div className="mt-1.5 sm:mt-1.5 pt-1.5 border-t border-neutral-800/80 w-full flex items-center justify-center gap-1.5 flex-wrap">
                        {member.linkedinUrl && (
                          <a
                            href={member.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0a66c2]/15 hover:bg-[#0a66c2]/30 border border-[#0a66c2]/40 hover:border-[#0a66c2]/70 text-[#70b5f9] hover:text-white text-[11px] sm:text-[10.5px] lg:text-[11px] font-semibold transition-all shadow-xs cursor-pointer group/li"
                            title="Connect on LinkedIn"
                          >
                            <Linkedin className="w-3 h-3 text-[#0a66c2] group-hover/li:text-[#70b5f9] group-hover/li:scale-110 transition-transform" />
                            <span className="tracking-tight">LinkedIn</span>
                          </a>
                        )}

                        {member.instagramUrl && (
                          <a
                            href={member.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/15 to-orange-500/10 hover:from-purple-500/25 hover:via-pink-500/25 hover:to-orange-500/25 border border-pink-500/30 hover:border-pink-500/60 text-neutral-200 hover:text-white text-[11px] sm:text-[10.5px] lg:text-[11px] font-semibold transition-all shadow-xs cursor-pointer group/ig"
                            title="Follow on Instagram"
                          >
                            <Instagram className="w-3 h-3 text-[#e1306c] group-hover/ig:scale-110 transition-transform" />
                            <span className="tracking-tight">{member.instagramHandle || '@mr_maan089'}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Indicator Dots & Mobile Swipe Hint */}
        <div className="mt-2.5 sm:mt-3 flex flex-col items-center justify-center gap-1.5">
          <div className="flex items-center justify-center gap-2">
            {teamMembers.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (i !== activeIdx) {
                    transitionTo(i, i > activeIdx ? 'next' : 'prev');
                  }
                }}
                aria-label={`Go to leader ${i + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  i === activeIdx
                    ? 'w-6 h-1.5 sm:w-7 sm:h-2 bg-[#1430d8]'
                    : 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-neutral-300 hover:bg-neutral-400'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] font-medium text-neutral-400 tracking-wide sm:hidden">
            Swipe left or right to explore team
          </p>
        </div>
      </div>
    </section>
  );
};
