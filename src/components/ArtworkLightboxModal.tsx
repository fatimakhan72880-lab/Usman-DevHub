import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Share2,
  Eye,
  Check,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface ArtworkLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  category?: string;
  client?: string;
  service?: string;
  onInquire?: () => void;
}

export const ArtworkLightboxModal: React.FC<ArtworkLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  category = 'Logo Design',
  client,
  service = 'Graphic Design',
  onInquire
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // Reset controls when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setRotation(0);
      setCopiedLink(false);
      setImageLoaded(false);
      setImageError(false);
      const prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === '+' || e.key === '=') {
          setZoomLevel((prev) => Math.min(prev + 0.25, 3));
        } else if (e.key === '-' || e.key === '_') {
          setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
        } else if (e.key === '0') {
          setZoomLevel(1);
          setRotation(0);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = prevBodyOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, imageUrl, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
    setRotation(0);
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (imageUrl.startsWith('data:')) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const fullUrl = imageUrl.startsWith('http')
          ? imageUrl
          : `${window.location.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        await navigator.clipboard.writeText(fullUrl);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const waText = encodeURIComponent(
    `Hi Usman, I am interested in getting a custom design like "${title}" (Service: ${service} · ${category}). Please share details and workflow.`
  );
  const waUrl = `https://wa.me/923412683864?text=${waText}`;

  return (
    <div
      id="artwork-lightbox-backdrop"
      className="fixed inset-0 z-99999 flex flex-col items-center justify-between bg-slate-900/40 backdrop-blur-xl transition-all duration-300 p-2 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Bar - White Mode */}
      <div
        className="w-full max-w-6xl flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-white/95 border border-neutral-200/90 text-neutral-900 shrink-0 z-10 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#1430d8] flex items-center justify-center text-white shrink-0 shadow-xs">
            <Eye className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-[#1430d8] border border-blue-200">
                {category}
              </span>
              {client && (
                <span className="text-[10px] text-neutral-500 truncate font-medium">
                  Client: {client}
                </span>
              )}
            </div>
            <h3 className="font-display text-xs sm:text-sm font-bold text-neutral-900 truncate max-w-xs sm:max-w-md md:max-w-xl">
              {title}
            </h3>
          </div>
        </div>

        {/* Top Actions: Zoom Controls & Close - White Mode */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-xl p-1 text-xs text-neutral-700">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-white hover:text-[#1430d8] hover:shadow-2xs transition-colors cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-2 py-1 rounded-lg hover:bg-white hover:text-[#1430d8] hover:shadow-2xs transition-colors cursor-pointer font-mono text-[11px] font-semibold"
              title="Reset Zoom (0)"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-white hover:text-[#1430d8] hover:shadow-2xs transition-colors cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg hover:bg-white hover:text-[#1430d8] hover:shadow-2xs transition-colors cursor-pointer ml-0.5 border-l border-neutral-200"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 border border-neutral-200 transition-colors cursor-pointer"
            title="Close Artwork Viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area - Crisp White Backdrop with subtle texture */}
      <div
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-2 sm:my-3"
        onClick={onClose}
      >
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-600">
            <div className="w-8 h-8 border-2 border-[#1430d8] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading Full-Res Artwork...</span>
          </div>
        )}

        {imageError ? (
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-neutral-200 text-center max-w-sm shadow-xl">
            <Sparkles className="w-8 h-8 text-amber-500 mb-2" />
            <h4 className="text-neutral-900 font-bold text-sm">Artwork Preview Unavailable</h4>
            <p className="text-neutral-500 text-xs mt-1">
              The high-resolution source artwork could not be loaded directly.
            </p>
          </div>
        ) : (
          <div
            className="relative transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full p-2"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={title}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageLoaded(true);
                setImageError(true);
              }}
              className="max-w-[92vw] max-h-[74vh] object-contain rounded-2xl shadow-2xl border border-neutral-200/90 bg-white"
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar - White Mode (No Download Option) */}
      <div
        className="w-full max-w-3xl flex flex-wrap items-center justify-between gap-2.5 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-white/95 border border-neutral-200/90 text-neutral-900 shrink-0 z-10 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Zoom buttons */}
          <div className="flex sm:hidden items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 rounded text-neutral-700"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1 text-[10px] font-mono text-neutral-600 font-semibold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 rounded text-neutral-700"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1 rounded text-neutral-700"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>

          {/* Share / Copy Link button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 hover:text-neutral-900 text-xs font-semibold transition-all cursor-pointer border border-neutral-200 shadow-2xs"
            title="Copy link to clipboard"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* Right Action: Inquire on WhatsApp or Form */}
        <div className="flex items-center gap-2">
          {onInquire ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onInquire();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1430d8] border border-blue-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Inquire Form</span>
            </button>
          ) : null}

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs whitespace-nowrap"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span>Inquire on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
