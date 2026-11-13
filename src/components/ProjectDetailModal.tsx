import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { X, Eye, Globe, ExternalLink, ZoomIn, Film } from 'lucide-react';
import { Project } from '../types';
import { RobustVideoPlayer } from './RobustVideoPlayer';
import { getFallbackImage, normalizeImageUrl, resolveThumbnailUrl } from '../utils/imageUtils';
import { normalizeServiceTitle } from './ShowcaseProjectCard';
import { ensureExternalUrl } from '../utils/urlUtils';
import { ArtworkLightboxModal } from './ArtworkLightboxModal';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
  onOpenContact?: (servicePreset?: string, categoryPreset?: string, project?: Project) => void;
  serviceTitle?: string;
  categoryTitle?: string;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onOpenContact,
  serviceTitle,
  categoryTitle
}) => {
  const modalBackdropRef = useRef<HTMLDivElement>(null);
  const modalCardRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef<boolean>(false);
  const savedScrollYRef = useRef<number>(0);
  const [isArtworkLightboxOpen, setIsArtworkLightboxOpen] = useState<boolean>(false);

  const resolvedService = project ? normalizeServiceTitle(project.category, serviceTitle) : '';
  const isVideoProject = Boolean(project && resolvedService === '3D Video Animation');

  // Synchronous scroll-freeze lock: pins background page at exact scrollY so modal fullscreen or close fade never reveals lower sections
  useLayoutEffect(() => {
    if (!project || typeof window === 'undefined') return;

    const savedScrollY = window.scrollY;
    const savedWidth = window.innerWidth;
    savedScrollYRef.current = savedScrollY;

    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    const prevHtmlOverflow = htmlEl.style.overflow;
    const prevHtmlScrollBehavior = htmlEl.style.scrollBehavior;
    const prevBodyOverflow = bodyEl.style.overflow;
    const prevBodyPosition = bodyEl.style.position;
    const prevBodyTop = bodyEl.style.top;
    const prevBodyLeft = bodyEl.style.left;
    const prevBodyRight = bodyEl.style.right;
    const prevBodyWidth = bodyEl.style.width;

    htmlEl.style.scrollBehavior = 'auto';
    htmlEl.style.overflow = 'hidden';
    bodyEl.style.overflow = 'hidden';
    bodyEl.style.position = 'fixed';
    bodyEl.style.top = `-${savedScrollY}px`;
    bodyEl.style.left = '0';
    bodyEl.style.right = '0';
    bodyEl.style.width = '100%';

    return () => {
      htmlEl.style.scrollBehavior = 'auto';
      htmlEl.style.overflow = prevHtmlOverflow;
      bodyEl.style.overflow = prevBodyOverflow;
      bodyEl.style.position = prevBodyPosition;
      bodyEl.style.top = prevBodyTop;
      bodyEl.style.left = prevBodyLeft;
      bodyEl.style.right = prevBodyRight;
      bodyEl.style.width = prevBodyWidth;

      const widthChanged = Math.abs(window.innerWidth - savedWidth) > 40;
      const anchorCard = widthChanged
        ? document.getElementById(`portfolio-card-${project.id}`) ||
          document.getElementById(`service-showcase-${project.id}`) ||
          document.getElementById(`motion-showcase-${project.id}`) ||
          document.getElementById(`portfolio-row-${project.id}`)
        : null;

      if (anchorCard) {
        const rect = anchorCard.getBoundingClientRect();
        const targetY = Math.max(0, window.scrollY + rect.top - Math.max(80, (window.innerHeight - rect.height) / 2));
        window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
      } else {
        window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' as ScrollBehavior });
      }

      requestAnimationFrame(() => {
        htmlEl.style.scrollBehavior = prevHtmlScrollBehavior;
      });
    };
  }, [project]);

  // GSAP entrance animation (smooth scale for 3D Video so hardware video & fullscreen never glitch; 3D flip for other cards)
  useEffect(() => {
    if (project && modalCardRef.current && modalBackdropRef.current) {
      isClosingRef.current = false;

      gsap.killTweensOf([modalCardRef.current, modalBackdropRef.current]);

      gsap.fromTo(
        modalBackdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );

      if (isVideoProject) {
        gsap.fromTo(
          modalCardRef.current,
          { opacity: 0, scale: 0.94, y: 12 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.28,
            ease: 'power2.out',
            clearProps: 'transform,willChange'
          }
        );
      } else {
        gsap.fromTo(
          modalCardRef.current,
          {
            opacity: 0,
            scale: 0.55,
            rotateY: -95,
            rotateX: 12,
            transformPerspective: 1600,
            transformOrigin: '50% 50% -100px'
          },
          {
            opacity: 1,
            scale: 1,
            rotateY: 0,
            rotateX: 0,
            duration: 0.65,
            ease: 'back.out(1.35)',
            clearProps: 'transform,transformPerspective,transformOrigin,willChange'
          }
        );
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !document.fullscreenElement) {
          handleClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [project, isVideoProject]);

  const handleClose = (afterAction?: () => void) => {
    if (isClosingRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    if (!modalCardRef.current || !modalBackdropRef.current) {
      onClose();
      afterAction?.();
      return;
    }
    isClosingRef.current = true;
    const tl = gsap.timeline({
      onComplete: () => {
        isClosingRef.current = false;
        onClose();
        afterAction?.();
      }
    });

    if (isVideoProject) {
      tl.to(
        modalCardRef.current,
        {
          scale: 0.94,
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in'
        },
        0
      );
    } else {
      tl.to(
        modalCardRef.current,
        {
          rotateY: 90,
          rotateX: -10,
          scale: 0.65,
          opacity: 0,
          duration: 0.35,
          ease: 'power3.in'
        },
        0
      );
    }

    tl.to(
      modalBackdropRef.current,
      {
        opacity: 0,
        duration: 0.22,
        ease: 'power2.in'
      },
      0.02
    );
  };

  if (!project) return null;

  const resolvedCategory = (project.subcategory || categoryTitle || resolvedService).trim();
  const hasDistinctCategory =
    Boolean(resolvedCategory) && resolvedCategory.toLowerCase() !== resolvedService.toLowerCase();

  const isVideo = isVideoProject;
  const effectiveVideoUrl = isVideo ? project.videoUrl : undefined;
  const resolvedThumbnail = resolveThumbnailUrl(project.imageUrl, effectiveVideoUrl, resolvedService);
  const resolvedArtworkHref = normalizeImageUrl(project.imageUrl || '') || resolvedThumbnail;

  const isDesign = !isVideo && resolvedService === 'Graphic Design';
  const cleanLiveUrl = ensureExternalUrl(project.liveUrl);
  const hasLiveUrl = Boolean(cleanLiveUrl);

  const waText = encodeURIComponent(
    `Hi Usman, I am interested in getting a project like "${project.title}" (Service: ${resolvedService}${
      hasDistinctCategory ? ` | Category: ${resolvedCategory}` : ''
    }). Please share details and pricing.`
  );

  return (
    <div
      id="project-preview-modal-backdrop"
      ref={modalBackdropRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-[2px] overflow-y-auto ${
        isVideo ? '' : '[perspective:1600px]'
      }`}
      onClick={() => handleClose()}
    >
      <div
        ref={modalCardRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative rounded-2xl bg-white border border-neutral-200 overflow-hidden shadow-2xl flex flex-col text-[#0e0e0e] my-auto ${
          isVideo
            ? 'w-[96%] sm:w-[92%] max-w-3xl max-h-[92vh]'
            : 'w-[92%] sm:w-[90%] max-w-[420px] sm:max-w-md max-h-[85vh] [transform-style:preserve-3d] will-change-[transform,opacity]'
        }`}
      >
        {/* Dedicated Cinema Header Bar for Video Projects so Close Button never blocks video controls */}
        {isVideo && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-neutral-950 text-white border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 shrink-0">
                <Film className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs sm:text-sm font-bold truncate">
                {project.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleClose()}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0 z-50"
              aria-label="Close Video Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Media Frame - Full Cinema Aspect Video Player for 3D Video Animation; Thumbnail Frame for Others */}
        <div
          className={`relative w-full shrink-0 overflow-hidden ${
            isVideo
              ? 'aspect-video max-h-[62vh] bg-black'
              : 'h-44 sm:h-48 md:h-52 bg-neutral-950'
          }`}
        >
          {isVideo ? (
            <RobustVideoPlayer
              url={effectiveVideoUrl || ''}
              poster={resolvedThumbnail}
              title={project.title}
              autoPlay={true}
              loop={true}
              controls={true}
              showStopButton={false}
              pauseOnScroll={false}
              stopOnScroll={false}
              showFullscreenButton={true}
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <div
              className={`relative w-full h-full ${isDesign ? 'cursor-pointer group' : ''}`}
              onClick={() => {
                if (isDesign) setIsArtworkLightboxOpen(true);
              }}
            >
              <img
                src={resolvedThumbnail}
                alt={project.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const fallback = getFallbackImage(resolvedThumbnail, resolvedService, effectiveVideoUrl);
                  (e.target as HTMLImageElement).src = fallback;
                }}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              {isDesign && (
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 text-white text-xs font-semibold backdrop-blur-sm shadow-md">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Expand Artwork</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Close button for non-video cards */}
          {!isVideo && (
            <button
              type="button"
              onClick={() => handleClose()}
              className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer z-50"
              aria-label="Close Preview"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Details Content */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1">
          {/* Service & Category Metadata */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#1430d8] text-[10px] sm:text-[11px] font-medium border border-blue-100">
              <span className="text-[#1430d8]/70 font-normal">Service:</span>
              <span className="font-bold text-[#1430d8]">{resolvedService}</span>
            </span>

            {hasDistinctCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] sm:text-[11px] font-medium border border-neutral-200">
                <span className="text-neutral-400 font-normal">Category:</span>
                <span className="font-semibold text-neutral-900">{resolvedCategory}</span>
              </span>
            )}
          </div>

          <h3 className="font-display text-sm sm:text-base md:text-lg font-bold text-[#0e0e0e] leading-snug">
            {project.title}
          </h3>

          <p className="mt-1 sm:mt-1.5 text-neutral-600 text-xs sm:text-[13px] leading-relaxed">
            {project.description}
          </p>

          {/* Modal Footer Actions */}
          <div className="mt-3.5 sm:mt-4 pt-3 sm:pt-3.5 border-t border-neutral-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2">
              <a
                href={`https://wa.me/923412683864?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] sm:text-xs font-semibold transition-all shadow-xs text-center whitespace-nowrap"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 10.23c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43s.17-.25.25-.41c.08-.17.04-.31-.02-.44s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.77 2.71 4.3 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29" />
                </svg>
                <span>WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  const currentProject = project;
                  handleClose(() => {
                    onOpenContact?.(resolvedService, resolvedCategory, currentProject);
                  });
                }}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1430d8] text-[11px] sm:text-xs font-semibold transition-colors text-center cursor-pointer whitespace-nowrap"
              >
                Inquire Form
              </button>
            </div>

            {isVideo ? null : isDesign ? (
              <button
                type="button"
                onClick={() => setIsArtworkLightboxOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] sm:text-xs font-semibold transition-colors shadow-xs text-center cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Artwork</span>
              </button>
            ) : hasLiveUrl ? (
              <a
                href={cleanLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] sm:text-xs font-semibold transition-colors shadow-xs text-center cursor-pointer whitespace-nowrap"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Live Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Fullscreen High-Resolution Artwork Lightbox */}
      {isDesign && (
        <ArtworkLightboxModal
          isOpen={isArtworkLightboxOpen}
          onClose={() => setIsArtworkLightboxOpen(false)}
          imageUrl={resolvedArtworkHref}
          title={project.title}
          category={resolvedCategory}
          client={project.client}
          service={resolvedService}
          onInquire={() => {
            setIsArtworkLightboxOpen(false);
            handleClose(() => {
              onOpenContact?.(resolvedService, resolvedCategory, project);
            });
          }}
        />
      )}
    </div>
  );
};
