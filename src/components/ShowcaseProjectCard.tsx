import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Eye, ArrowUpRight, Play, X } from 'lucide-react';
import { Project } from '../types';
import { RobustVideoPlayer } from './RobustVideoPlayer';
import { getFallbackImage, resolveThumbnailUrl } from '../utils/imageUtils';
import { ensureExternalUrl } from '../utils/urlUtils';

export const normalizeServiceTitle = (rawCategory?: string, fallbackService?: string): string => {
  const raw = (rawCategory || fallbackService || 'Web Development').trim().replace(/^\d+[\.\s\-]+/, '');
  const lower = raw.toLowerCase();

  if (
    lower === '3d video animation' ||
    lower === '3d motion design & animation' ||
    lower === 'motion design & animation' ||
    lower.includes('video animation') ||
    lower.includes('motion design')
  ) {
    return '3D Video Animation';
  }

  if (
    lower === '3d animated websites' ||
    lower === '3d interactive web experiences' ||
    lower === '3d interactive websites' ||
    (lower.includes('3d') && (lower.includes('web') || lower.includes('interactive') || lower.includes('animated')))
  ) {
    return '3D Animated Websites';
  }

  if (lower.includes('e-commerce') || lower.includes('ecommerce') || lower === 'commerce') {
    return 'E-Commerce Development';
  }

  if (lower.includes('graphic') || lower.includes('ui/ux') || lower.includes('creative design') || lower === 'design') {
    return 'Graphic Design';
  }

  if (lower.includes('cloud') || lower.includes('deployment')) {
    return 'Website Deployment & Cloud Setup';
  }

  if (lower.includes('maintenance') || lower.includes('support')) {
    return 'Website Maintenance';
  }

  if (lower.includes('web development') || lower === 'web') {
    return 'Web Development';
  }

  return raw;
};

interface ShowcaseProjectCardProps {
  project: Project;
  onOpenModal: (project: Project, sourceElement?: HTMLElement | null) => void;
  activeVideoId?: string | null;
  onPlayVideo?: (projectId: string) => void;
  onStopVideo?: () => void;
  idPrefix?: string;
  serviceTitle?: string;
  categoryTitle?: string;
}

export const ShowcaseProjectCard: React.FC<ShowcaseProjectCardProps> = ({
  project,
  onOpenModal,
  activeVideoId,
  onPlayVideo,
  onStopVideo,
  idPrefix = 'portfolio-card',
  serviceTitle,
  categoryTitle
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const resolvedService = normalizeServiceTitle(project.category, serviceTitle);
  const resolvedCategory = (project.subcategory || categoryTitle || resolvedService).trim();
  const hasDistinctCategory =
    Boolean(resolvedCategory) && resolvedCategory.toLowerCase() !== resolvedService.toLowerCase();

  const isVideoProject = resolvedService === '3D Video Animation';
  const effectiveVideoUrl = isVideoProject ? project.videoUrl : undefined;
  const resolvedThumbnail = resolveThumbnailUrl(project.imageUrl, effectiveVideoUrl, resolvedService);

  const isVideoPlaying = isVideoProject && activeVideoId === project.id && Boolean(effectiveVideoUrl);
  const isDesignProject = !isVideoProject && resolvedService === 'Graphic Design';
  const cleanLiveUrl = ensureExternalUrl(project.liveUrl);
  const hasLiveUrl = Boolean(cleanLiveUrl);

  // Auto-stop in-card showcase video when user scrolls the page (never during/right after fullscreen)
  const fullscreenCooldownUntilRef = useRef<number>(0);

  useEffect(() => {
    if (!isVideoPlaying || !onStopVideo) return;

    let initialScrollY = window.scrollY;
    const handleFsReset = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        fullscreenCooldownUntilRef.current = Date.now() + 1200;
        [100, 250, 450].forEach((delay) => {
          setTimeout(() => {
            initialScrollY = window.scrollY;
          }, delay);
        });
      }
    };

    const handleScroll = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      if (doc.fullscreenElement || doc.webkitFullscreenElement || Date.now() < fullscreenCooldownUntilRef.current) {
        initialScrollY = window.scrollY;
        return;
      }
      if (Math.abs(window.scrollY - initialScrollY) > 15) {
        onStopVideo();
      }
    };

    document.addEventListener('fullscreenchange', handleFsReset);
    document.addEventListener('webkitfullscreenchange', handleFsReset);
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => {
      document.removeEventListener('fullscreenchange', handleFsReset);
      document.removeEventListener('webkitfullscreenchange', handleFsReset);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isVideoPlaying, onStopVideo]);

  // Reset any 3D hover tilt while video is playing so transform layers never clip fullscreen or compositing
  useEffect(() => {
    if (isVideoPlaying && cardRef.current) {
      gsap.killTweensOf(cardRef.current);
      gsap.set(cardRef.current, { clearProps: 'transform,transformPerspective' });
    }
  }, [isVideoPlaying]);

  // Auto-stop if the playing video card leaves the visible viewport (never during/right after fullscreen)
  useEffect(() => {
    if (!isVideoPlaying || !onStopVideo || !cardRef.current || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const doc = document as Document & { webkitFullscreenElement?: Element | null };
        if (doc.fullscreenElement || doc.webkitFullscreenElement || Date.now() < fullscreenCooldownUntilRef.current) return;
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.35) {
            onStopVideo();
          }
        });
      },
      { threshold: [0, 0.35, 1.0] }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isVideoPlaying, onStopVideo]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isVideoPlaying) return;
    gsap.to(e.currentTarget, { scale: 0.97, duration: 0.15, ease: 'power1.out' });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isVideoPlaying) return;
    gsap.to(e.currentTarget, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isVideoPlaying) return;
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4.5;
    const rotateY = ((x - centerX) / centerX) * 4.5;

    gsap.to(card, {
      rotateX,
      rotateY,
      transformPerspective: 1000,
      duration: 0.25,
      ease: 'power1.out',
      overwrite: 'auto'
    });
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.45,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  };

  const triggerOpenModal = (sourceEl?: HTMLElement | null) => {
    const targetEl = sourceEl || cardRef.current;
    if (targetEl) {
      gsap.to(targetEl, {
        scale: 0.96,
        rotateY: 12,
        rotateX: -4,
        duration: 0.16,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }
    onOpenModal(project, targetEl);
  };

  return (
    <div
      ref={cardRef}
      id={`${idPrefix}-${project.id}`}
      onClick={(e) => triggerOpenModal(e.currentTarget)}
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`portfolio-animate-item portfolio-showcase-card group flex flex-col justify-between rounded-xl sm:rounded-2xl bg-white border border-neutral-200/90 overflow-hidden hover:border-[#1430d8]/50 hover:shadow-[0_20px_40px_rgba(20,48,216,0.12)] transition-[border-color,box-shadow] duration-300 ${
        isVideoPlaying ? '' : 'active:scale-[0.98] transform-gpu will-change-transform'
      } cursor-pointer`}
    >
      <div>
        {/* In-Card Video Player OR High-Res Thumbnail */}
        {isVideoPlaying ? (
          <div
            className="relative h-44 sm:h-48 md:h-52 w-full overflow-hidden bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <RobustVideoPlayer
              url={project.videoUrl!}
              poster={resolvedThumbnail}
              title={project.title}
              autoPlay={true}
              controls={true}
              loop={true}
              onClose={() => onStopVideo?.()}
              showStopButton={true}
              pauseOnScroll={true}
              stopOnScroll={true}
              className="w-full h-full object-contain bg-black"
            />
          </div>
        ) : (
          <div className="relative h-44 sm:h-48 md:h-52 w-full overflow-hidden bg-neutral-950">
            <img
              src={resolvedThumbnail}
              alt={project.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const fallback = getFallbackImage(resolvedThumbnail, resolvedService, effectiveVideoUrl);
                (e.target as HTMLImageElement).src = fallback;
              }}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />

            {/* Clean Icon-Only Play Button strictly for 3D Video Animation Service */}
            {isVideoProject && effectiveVideoUrl && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <button
                  type="button"
                  aria-label="Play Video"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onPlayVideo) {
                      onPlayVideo(project.id);
                    } else {
                      triggerOpenModal(cardRef.current);
                    }
                  }}
                  className="w-11 h-11 rounded-full bg-black/60 hover:bg-purple-600 text-white border border-white/35 backdrop-blur-md shadow-xl flex items-center justify-center transform transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Body Content: Service & Category Metadata, Title & Description */}
        <div className="p-3.5 sm:p-5">
          <div className="flex flex-wrap items-center gap-1.5 mb-2 min-w-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-[#1430d8] text-[10px] sm:text-[11px] font-bold border border-blue-100 truncate max-w-[175px] sm:max-w-[210px]">
              {resolvedService}
            </span>
            {hasDistinctCategory && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] sm:text-[11px] font-semibold border border-neutral-200/80 truncate max-w-[165px] sm:max-w-[200px]">
                {resolvedCategory}
              </span>
            )}
          </div>

          <h3 className="font-display text-sm sm:text-base lg:text-lg font-bold text-[#0e0e0e] group-hover:text-[#1430d8] transition-colors leading-snug line-clamp-1">
            {project.title}
          </h3>

          <p className="mt-1.5 text-xs sm:text-[13px] text-neutral-600 leading-relaxed line-clamp-2">
            {project.description}
          </p>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between gap-2">
        <span className="text-[11px] sm:text-xs font-semibold text-neutral-600 group-hover:text-[#1430d8] transition-colors flex items-center gap-1.5 py-0.5 whitespace-nowrap">
          <Eye className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#1430d8]" />
          <span>View Details</span>
        </span>

        {isVideoProject ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isVideoPlaying) {
                onStopVideo?.();
              } else if (project.videoUrl && onPlayVideo) {
                onPlayVideo(project.id);
              } else {
                triggerOpenModal(cardRef.current);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl text-white text-[11px] sm:text-xs font-semibold transition-all shadow-xs cursor-pointer whitespace-nowrap ${
              isVideoPlaying
                ? 'bg-neutral-800 hover:bg-neutral-900 border border-neutral-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isVideoPlaying ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Stop Video</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Video</span>
              </>
            )}
          </button>
        ) : isDesignProject ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal?.(project);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg sm:rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] sm:text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer z-10"
            title={`View full artwork for ${project.title}`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Artwork</span>
          </button>
        ) : hasLiveUrl ? (
          <a
            href={cleanLiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg sm:rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] sm:text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer z-10"
            title={`Open ${project.title} live website`}
          >
            <span>Live Demo</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg sm:rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] sm:text-xs font-semibold transition-all shadow-xs whitespace-nowrap">
            <Eye className="w-3.5 h-3.5" />
            <span>Overview</span>
          </span>
        )}
      </div>
    </div>
  );
};
