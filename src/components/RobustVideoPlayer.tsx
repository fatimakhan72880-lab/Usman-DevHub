import React, { useRef, useState, useEffect, useCallback } from 'react';
import { VolumeX, AlertCircle, RefreshCw, X, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { getYouTubeThumbnail, DEFAULT_VIDEO_POSTER } from '../utils/imageUtils';

interface RobustVideoPlayerProps {
  url: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
  onClose?: () => void;
  showStopButton?: boolean;
  fallbackUrl?: string;
  pauseOnScroll?: boolean;
  stopOnScroll?: boolean;
  showFullscreenButton?: boolean;
}

// Fallback high-speed, hardware-accelerated 3D motion tech showcase video
export const DEFAULT_FALLBACK_VIDEO =
  'https://res.cloudinary.com/k7nwpt9h/video/upload/q_auto,f_auto,w_1280/v1789051581/InShot_20260910_191830406.mp4';

export const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  return /youtu\.be|youtube\.com/i.test(url);
};

export const getYouTubeEmbedUrl = (url: string, autoPlay = true): string => {
  if (!url) return '';
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
  );
  return match
    ? `https://www.youtube.com/embed/${match[1]}?autoplay=${autoPlay ? 1 : 0}&rel=0&playsinline=1&enablejsapi=1`
    : url;
};

export const isVimeoUrl = (url: string): boolean => {
  if (!url) return false;
  return /vimeo\.com/i.test(url);
};

export const getVimeoEmbedUrl = (url: string, autoPlay = true): string => {
  if (!url) return '';
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match
    ? `https://player.vimeo.com/video/${match[1]}?autoplay=${autoPlay ? 1 : 0}&muted=0`
    : url;
};

export const isGoogleDriveUrl = (url: string): boolean => {
  if (!url) return false;
  return /(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|uc\?)/i.test(url);
};

export const getGoogleDriveEmbedUrl = (url: string): string => {
  if (!url) return '';
  const match = url.match(
    /(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=[^&]+&)?id=)([a-zA-Z0-9_-]+)/i
  );
  return match && match[1] ? `https://drive.google.com/file/d/${match[1]}/preview` : url;
};

export const normalizeVideoSourceUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  let trimmed = rawUrl.trim().replace(/^["'`]|["'`]$/g, '').trim();
  if (!trimmed) return '';

  // Preserve data/blob/local server paths
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//'))
  ) {
    return trimmed;
  }

  // Convert Dropbox sharing links into direct raw video stream
  if (trimmed.includes('dropbox.com')) {
    let next = trimmed.replace(/[?&]dl=0/g, (m) => (m.startsWith('?') ? '?raw=1' : '&raw=1'));
    if (!next.includes('raw=1')) {
      next += next.includes('?') ? '&raw=1' : '?raw=1';
    }
    return next.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  // Upgrade http:// to https:// (except localhost)
  if (trimmed.startsWith('http://') && !trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) {
    trimmed = trimmed.replace('http://', 'https://');
  }

  return trimmed;
};

const getFullscreenElement = (): Element | null => {
  if (typeof document === 'undefined') return null;
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return (
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
};

interface SavedFullscreenAnchor {
  scrollY: number;
  width: number;
  anchorTop: number;
  anchorEl: HTMLElement | null;
  insideLockedModal: boolean;
}

export const RobustVideoPlayer: React.FC<RobustVideoPlayerProps> = ({
  url,
  poster,
  title = 'Video Showcase',
  autoPlay = true,
  loop = true,
  controls = true,
  className = 'w-full h-full object-contain bg-black',
  onClose,
  showStopButton = true,
  fallbackUrl = DEFAULT_FALLBACK_VIDEO,
  pauseOnScroll = true,
  stopOnScroll = false,
  showFullscreenButton = true
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const resolvedPoster = poster || getYouTubeThumbnail(url || '') || DEFAULT_VIDEO_POSTER;

  const resolveInitialSrc = useCallback(
    (inputUrl: string) => {
      const normalized = normalizeVideoSourceUrl(inputUrl);
      if (
        !normalized ||
        normalized.includes('commondatastorage.googleapis.com') ||
        /\.(png|jpg|jpeg|webp)$/i.test(normalized)
      ) {
        return fallbackUrl;
      }
      return normalized;
    },
    [fallbackUrl]
  );

  const [currentSrc, setCurrentSrc] = useState<string>(() => resolveInitialSrc(url));
  const [isLoading, setIsLoading] = useState<boolean>(autoPlay);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [wasAutoplayMuted, setWasAutoplayMuted] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [attemptedFallback, setAttemptedFallback] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const preFullscreenAnchorRef = useRef<SavedFullscreenAnchor | null>(null);
  const lastStableAnchorRef = useRef<SavedFullscreenAnchor>({
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    anchorTop: 120,
    anchorEl: null,
    insideLockedModal: false
  });
  const fullscreenCooldownUntilRef = useRef<number>(0);

  const captureStableAnchor = useCallback((): SavedFullscreenAnchor => {
    const container = containerRef.current;
    const anchorEl = container
      ? (container.closest(
          '[id^="portfolio-card-"], [id^="motion-showcase-"], [id^="service-showcase-"], [id^="portfolio-row-"]'
        ) as HTMLElement | null) || container
      : null;
    const insideLockedModal = Boolean(container?.closest('#project-preview-modal-backdrop'));
    const rectTop = anchorEl ? anchorEl.getBoundingClientRect().top : 120;
    return {
      scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      anchorTop: rectTop,
      anchorEl,
      insideLockedModal
    };
  }, []);

  // Sync currentSrc if url prop changes
  useEffect(() => {
    const nextSrc = resolveInitialSrc(url);
    setCurrentSrc(nextSrc);
    setAttemptedFallback(false);
    setHasError(false);
    setWasAutoplayMuted(false);
    setIsLoading(autoPlay && !isYouTubeUrl(nextSrc) && !isVimeoUrl(nextSrc) && !isGoogleDriveUrl(nextSrc));
  }, [url, autoPlay, resolveInitialSrc]);

  // Continuously capture stable scroll position + card anchor while NOT in fullscreen or exit-cooldown
  useEffect(() => {
    const updateStable = () => {
      if (!getFullscreenElement() && Date.now() > fullscreenCooldownUntilRef.current) {
        lastStableAnchorRef.current = captureStableAnchor();
      }
    };
    updateStable();
    window.addEventListener('scroll', updateStable, { passive: true });
    return () => window.removeEventListener('scroll', updateStable);
  }, [captureStableAnchor]);

  // Track browser fullscreen state & pin card/scroll location across orientation & grid reflows
  useEffect(() => {
    let cleanupTimers: number[] = [];
    let isRestoring = false;
    let prevHtmlScrollBehavior: string | null = null;

    const clearRestoreHooks = () => {
      cleanupTimers.forEach((id) => window.clearTimeout(id));
      cleanupTimers = [];
      if (isRestoring) {
        window.removeEventListener('resize', alignToSavedAnchor);
        window.removeEventListener('orientationchange', alignToSavedAnchor);
        if (prevHtmlScrollBehavior !== null) {
          document.documentElement.style.scrollBehavior = prevHtmlScrollBehavior;
          prevHtmlScrollBehavior = null;
        }
        isRestoring = false;
      }
    };

    const alignToSavedAnchor = () => {
      const saved = preFullscreenAnchorRef.current;
      if (!saved || typeof window === 'undefined') return;
      // If inside ProjectDetailModal, the modal's fixed body scroll lock holds the page position untouched
      if (saved.insideLockedModal || document.body.style.position === 'fixed') {
        return;
      }

      const widthDiff = Math.abs(window.innerWidth - saved.width);
      // If the layout is currently in a different responsive column breakpoint (e.g., landscape before rotating back to portrait),
      // anchor directly to the card DOM element so we NEVER scroll past #work into the lower section!
      if (widthDiff > 40 && saved.anchorEl && saved.anchorEl.isConnected) {
        const rect = saved.anchorEl.getBoundingClientRect();
        const desiredTop = Math.min(Math.max(saved.anchorTop, 72), window.innerHeight * 0.45);
        const targetY = Math.max(0, window.scrollY + rect.top - desiredTop);
        window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
      } else {
        window.scrollTo({ top: saved.scrollY, left: 0, behavior: 'instant' as ScrollBehavior });
      }
    };

    const restoreScrollAfterFullscreen = () => {
      fullscreenCooldownUntilRef.current = Date.now() + 1200;
      const saved = preFullscreenAnchorRef.current;
      if (!saved) return;

      clearRestoreHooks();
      isRestoring = true;
      prevHtmlScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';

      alignToSavedAnchor();
      requestAnimationFrame(alignToSavedAnchor);

      window.addEventListener('resize', alignToSavedAnchor, { passive: true });
      window.addEventListener('orientationchange', alignToSavedAnchor, { passive: true });

      [35, 90, 180, 300, 480].forEach((ms) => {
        cleanupTimers.push(window.setTimeout(alignToSavedAnchor, ms));
      });

      cleanupTimers.push(
        window.setTimeout(() => {
          preFullscreenAnchorRef.current = null;
          clearRestoreHooks();
        }, 560)
      );
    };

    const lockPreFullscreenAnchor = () => {
      if (preFullscreenAnchorRef.current === null) {
        preFullscreenAnchorRef.current = lastStableAnchorRef.current;
      }
    };

    const handleFsChange = () => {
      const activeFs = Boolean(getFullscreenElement());
      setIsFullscreen(activeFs);
      if (activeFs) {
        lockPreFullscreenAnchor();
      } else {
        restoreScrollAfterFullscreen();
      }
    };

    const videoEl = videoRef.current;
    const handleWebkitBeginFs = () => {
      setIsFullscreen(true);
      lockPreFullscreenAnchor();
    };
    const handleWebkitEndFs = () => {
      setIsFullscreen(false);
      restoreScrollAfterFullscreen();
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    videoEl?.addEventListener('webkitbeginfullscreen', handleWebkitBeginFs);
    videoEl?.addEventListener('webkitendfullscreen', handleWebkitEndFs);

    return () => {
      clearRestoreHooks();
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      videoEl?.removeEventListener('webkitbeginfullscreen', handleWebkitBeginFs);
      videoEl?.removeEventListener('webkitendfullscreen', handleWebkitEndFs);
    };
  }, []);

  const isYT = isYouTubeUrl(currentSrc);
  const isVim = isVimeoUrl(currentSrc);
  const isGDrive = isGoogleDriveUrl(currentSrc);
  const isIframeEmbed = isYT || isVim || isGDrive;

  // Attempt reliable autoplay with muted fallback ONLY if browser blocks unmuted autoplay
  useEffect(() => {
    if (isIframeEmbed) {
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let isMounted = true;
    setIsLoading(autoPlay);

    const attemptPlay = () => {
      if (!video || !isMounted) return;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (isMounted) {
              setIsPlaying(true);
              setIsLoading(false);
              setHasError(false);
            }
          })
          .catch((err) => {
            if (!isMounted) return;
            // Ignore AbortError caused by source change or rapid UI transition
            if (err?.name === 'AbortError') {
              return;
            }
            // Autoplay policy prevented unmuted playback -> retry muted
            video.muted = true;
            setWasAutoplayMuted(true);
            video
              .play()
              .then(() => {
                if (isMounted) {
                  setIsPlaying(true);
                  setIsLoading(false);
                  setHasError(false);
                }
              })
              .catch(() => {
                if (isMounted) {
                  setIsLoading(false);
                  setIsPlaying(false);
                }
              });
          });
      }
    };

    if (autoPlay) {
      attemptPlay();
    }

    const handlePlaying = () => {
      if (isMounted) {
        setIsPlaying(true);
        setIsLoading(false);
        setHasError(false);
      }
    };

    const handlePause = () => {
      if (isMounted) {
        setIsPlaying(false);
      }
    };

    const handleWaiting = () => {
      if (isMounted && !video.paused) {
        setIsLoading(true);
      }
    };

    const handleLoadedReady = () => {
      if (isMounted) {
        setIsLoading(false);
        if (autoPlay && video.paused) {
          attemptPlay();
        }
      }
    };

    const handleError = () => {
      console.warn('Video failed to load source:', currentSrc);
      if (!attemptedFallback && currentSrc !== fallbackUrl) {
        setAttemptedFallback(true);
        setCurrentSrc(fallbackUrl);
        setIsLoading(true);
      } else if (isMounted) {
        setHasError(true);
        setIsLoading(false);
      }
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('loadedmetadata', handleLoadedReady);
    video.addEventListener('loadeddata', handleLoadedReady);
    video.addEventListener('canplay', handleLoadedReady);
    video.addEventListener('error', handleError);

    return () => {
      isMounted = false;
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('loadedmetadata', handleLoadedReady);
      video.removeEventListener('loadeddata', handleLoadedReady);
      video.removeEventListener('canplay', handleLoadedReady);
      video.removeEventListener('error', handleError);
    };
  }, [currentSrc, autoPlay, isIframeEmbed, attemptedFallback, fallbackUrl]);

  // Stop or pause video playback as soon as user scrolls the page (NEVER while fullscreen or restoring from fullscreen!)
  useEffect(() => {
    if (!pauseOnScroll) return;

    let initialScrollY = window.scrollY;

    const handleScroll = () => {
      if (getFullscreenElement() || Date.now() < fullscreenCooldownUntilRef.current) {
        initialScrollY = window.scrollY;
        return;
      }

      const delta = Math.abs(window.scrollY - initialScrollY);
      if (delta > 15) {
        const video = videoRef.current;
        if (video && !video.paused) {
          video.pause();
          setIsPlaying(false);
        }
        if (stopOnScroll && onClose) {
          onClose();
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [pauseOnScroll, stopOnScroll, onClose]);

  // IntersectionObserver: ONLY active when pauseOnScroll or stopOnScroll is enabled, and NEVER during fullscreen or initial mount grace period
  useEffect(() => {
    if (!pauseOnScroll && !stopOnScroll) return;
    const container = containerRef.current;
    if (!container || !('IntersectionObserver' in window)) return;

    const mountedAt = Date.now();

    const observer = new IntersectionObserver(
      (entries) => {
        if (getFullscreenElement() || Date.now() < fullscreenCooldownUntilRef.current) return;
        if (Date.now() - mountedAt < 450) return;

        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.35) {
            const video = videoRef.current;
            if (video && !video.paused) {
              video.pause();
              setIsPlaying(false);
            }
            if (stopOnScroll && onClose) {
              onClose();
            }
          }
        });
      },
      { threshold: [0, 0.35, 0.7, 1] }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [pauseOnScroll, stopOnScroll, onClose]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted) {
      setWasAutoplayMuted(false);
    }
  };

  const retryPlayback = () => {
    setHasError(false);
    setIsLoading(true);
    setCurrentSrc(fallbackUrl);
    setAttemptedFallback(true);
    const video = videoRef.current;
    if (video) {
      video.load();
      video.play().catch(() => {
        video.muted = true;
        setWasAutoplayMuted(true);
        video.play().catch(() => {});
      });
    }
  };

  const toggleFullScreen = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const fsEl = getFullscreenElement();
    if (fsEl) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else {
          const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
          await doc.webkitExitFullscreen?.();
        }
      } catch {
        // ignore exit errors
      }
      return;
    }

    // Capture exact scroll position + card anchor right before entering fullscreen
    const snapshot = captureStableAnchor();
    preFullscreenAnchorRef.current = snapshot;
    lastStableAnchorRef.current = snapshot;

    const container = containerRef.current as
      | (HTMLDivElement & {
          webkitRequestFullscreen?: () => Promise<void> | void;
          mozRequestFullScreen?: () => Promise<void> | void;
          msRequestFullscreen?: () => Promise<void> | void;
        })
      | null;
    const video = videoRef.current as
      | (HTMLVideoElement & {
          webkitEnterFullscreen?: () => void;
          webkitRequestFullscreen?: () => Promise<void> | void;
        })
      | null;

    // On iOS Safari / mobile WebKit where container fullscreen may be unsupported for <video>, fall back to native video fullscreen
    try {
      if (container?.requestFullscreen) {
        await container.requestFullscreen();
        return;
      }
      if (container?.webkitRequestFullscreen) {
        await container.webkitRequestFullscreen();
        return;
      }
      if (video?.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
        return;
      }
      if (video?.requestFullscreen) {
        await video.requestFullscreen();
      }
    } catch {
      if (video?.webkitEnterFullscreen) {
        try {
          video.webkitEnterFullscreen();
        } catch {
          // ignore
        }
      }
    }
  };

  // Force crisp aspect-preserving object-contain in fullscreen regardless of caller className
  const resolvedVideoClassName = isFullscreen
    ? 'w-full h-full object-contain bg-black'
    : className;

  const refreshPreInteractionAnchor = () => {
    if (!getFullscreenElement() && Date.now() > fullscreenCooldownUntilRef.current) {
      lastStableAnchorRef.current = captureStableAnchor();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black select-none flex items-center justify-center overflow-hidden group"
      onPointerDownCapture={refreshPreInteractionAnchor}
      onTouchStartCapture={refreshPreInteractionAnchor}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. YouTube Iframe Embed */}
      {isYT && (
        <iframe
          src={getYouTubeEmbedUrl(currentSrc, autoPlay)}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      )}

      {/* 2. Vimeo Iframe Embed */}
      {isVim && (
        <iframe
          src={getVimeoEmbedUrl(currentSrc, autoPlay)}
          title={title}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      )}

      {/* 3. Google Drive Iframe Embed */}
      {isGDrive && (
        <iframe
          src={getGoogleDriveEmbedUrl(currentSrc)}
          title={title}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      )}

      {/* 4. HTML5 Direct Video Stream */}
      {!isIframeEmbed && (
        <>
          <video
            ref={videoRef}
            src={currentSrc}
            poster={resolvedPoster}
            playsInline
            loop={loop}
            controls={controls}
            controlsList="nodownload"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            autoPlay={autoPlay}
            preload="metadata"
            className={resolvedVideoClassName}
          />

          {/* Loading / Buffering Overlay */}
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-xs z-10 pointer-events-none">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
              <span className="text-white text-xs font-semibold tracking-wide">
                Loading 3D Animation Video...
              </span>
            </div>
          )}

          {/* Tap for Sound Toast if browser forced muted autoplay */}
          {wasAutoplayMuted && isPlaying && (
            <button
              type="button"
              onClick={toggleMute}
              className="absolute bottom-14 left-3 sm:left-4 z-30 px-3 py-1.5 rounded-full bg-black/85 hover:bg-neutral-900 border border-white/20 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95 animate-pulse"
              title="Click to enable video audio"
            >
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
              <span>Muted by Browser — Tap for Audio</span>
            </button>
          )}

          {/* Fallback Error Overlay */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 p-4 z-20 text-center">
              <AlertCircle className="w-9 h-9 text-amber-400 mb-2" />
              <h4 className="text-white font-bold text-sm sm:text-base">Video Loading Issue</h4>
              <p className="text-neutral-400 text-xs mt-1 max-w-xs">
                The original video link was inaccessible. Click below to load our studio showcase reel.
              </p>
              <button
                type="button"
                onClick={retryPlayback}
                className="mt-3 px-4 py-2 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer transition-all hover:scale-105"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Play Studio Showcase Reel</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Top Controls Overlay: Fullscreen Toggle & Optional Stop Button */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5">
        {showFullscreenButton && (
          <button
            type="button"
            onClick={toggleFullScreen}
            className="px-2.5 py-1 rounded-full bg-black/75 hover:bg-black text-white text-[10px] sm:text-[11px] font-semibold cursor-pointer shadow-lg backdrop-blur-sm flex items-center gap-1 border border-white/20 transition-all hover:scale-105"
            title={isFullscreen ? 'Exit Full Screen' : 'Open Full Screen'}
            aria-label={isFullscreen ? 'Exit Full Screen' : 'Open Full Screen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Full Screen'}</span>
          </button>
        )}

        {showStopButton && onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-2.5 py-1 rounded-full bg-black/80 hover:bg-black text-white text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-lg backdrop-blur-sm flex items-center gap-1 border border-white/20 transition-all hover:scale-105"
            title="Stop Video"
          >
            <X className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>
        )}
      </div>
    </div>
  );
};
