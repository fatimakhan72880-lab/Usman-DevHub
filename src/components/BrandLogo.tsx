import React from 'react';

export interface BrandLogoProps {
  /** Size variant for image and badge */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 'icon' (only 3D logo mark), 'full' (mark + wordmark inline), 'stacked' (mark + wordmark + tagline stacked) */
  variant?: 'icon' | 'full' | 'stacked';
  /** Theme styling for text */
  theme?: 'light' | 'dark' | 'auto';
  /** Custom container class name */
  className?: string;
  /** Custom image class name */
  imageClassName?: string;
  /** Custom white badge wrapper class name */
  badgeClassName?: string;
  /** Whether the logo icon should have a white background badge (default: true). Set to 'subtle' for low-opacity frosted backing, or false for none */
  whiteBackground?: boolean | 'subtle';
  /** Whether to display 'Tech & Creative Studio' subtitle */
  showTagline?: boolean;
  /** Click handler */
  onClick?: (e: React.MouseEvent) => void;
  /** Anchor link target */
  href?: string;
  /** Accessible alt text */
  alt?: string;
}

export const USMAN_DEVHUB_LOGO_URL = '/images/usman-devhub-logo.png';

const sizeMap = {
  xs: {
    badge: 'w-6 h-6 aspect-square p-0.5 rounded-md',
    img: 'w-5 h-5',
    text: 'text-xs sm:text-[13px]',
    sub: 'text-[9px]'
  },
  sm: {
    badge: 'w-7.5 h-7.5 sm:w-8 sm:h-8 aspect-square p-0.5 rounded-lg',
    img: 'w-6.5 h-6.5 sm:w-7 sm:h-7',
    text: 'text-[14px] sm:text-[15px]',
    sub: 'text-[10px]'
  },
  md: {
    badge: 'w-9 h-9 sm:w-10 sm:h-10 aspect-square p-0.5 rounded-xl',
    img: 'w-8 h-8 sm:w-9 sm:h-9',
    text: 'text-[15px] sm:text-base',
    sub: 'text-[10.5px]'
  },
  lg: {
    badge: 'w-11 h-11 aspect-square p-0.5 rounded-2xl',
    img: 'w-9.5 h-9.5 sm:w-10 sm:h-10',
    text: 'text-base sm:text-lg',
    sub: 'text-[11px]'
  },
  xl: {
    badge: 'w-13 h-13 aspect-square p-1 rounded-2xl',
    img: 'w-11.5 h-11.5',
    text: 'text-xl sm:text-2xl',
    sub: 'text-xs'
  },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme = 'auto',
  className = '',
  imageClassName = '',
  badgeClassName = '',
  whiteBackground = true as boolean | 'subtle',
  showTagline = false,
  onClick,
  href,
  alt = 'Usman DevHub Logo',
}) => {
  const currentSize = sizeMap[size] || sizeMap.md;
  const isDark = theme === 'dark';

  const isSubtle = (whiteBackground as boolean | 'subtle') === 'subtle';
  const badgeBg = isSubtle
    ? 'bg-white/75 backdrop-blur-xs border-2 border-white/45 shadow-sm'
    : 'bg-white/90 border-2 border-slate-300 shadow-xs';

  const logoImage = whiteBackground ? (
    <div
      className={`inline-flex items-center justify-center aspect-square rounded-xl shrink-0 overflow-hidden transition-all duration-200 group-hover:scale-105 ${badgeBg} ${currentSize.badge} ${badgeClassName}`}
    >
      <img
        src={USMAN_DEVHUB_LOGO_URL}
        alt={alt}
        loading="eager"
        className={`${currentSize.img} object-contain shrink-0 transform -translate-x-[4.5%] ${imageClassName}`}
      />
    </div>
  ) : (
    <img
      src={USMAN_DEVHUB_LOGO_URL}
      alt={alt}
      loading="eager"
      className={`${currentSize.img} object-contain shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(0,117,247,0.3)] ${imageClassName}`}
    />
  );

  const wordmark = (
    <div className="flex flex-col leading-tight select-none">
      <div className="flex items-center gap-1 whitespace-nowrap">
        <span
          className={`font-extrabold ${currentSize.text} tracking-tight bg-gradient-to-r from-[#0075f7] to-[#1430d8] bg-clip-text text-transparent`}
        >
          Usman
        </span>
        <span
          className={`font-bold ${currentSize.text} tracking-tight transition-colors duration-150 ${
            isDark ? 'text-white' : 'text-[#0e0e0e]'
          }`}
        >
          DevHub
        </span>
      </div>
      {(showTagline || variant === 'stacked') && (
        <span
          className={`${currentSize.sub} tracking-normal ${
            isDark ? 'text-neutral-400' : 'text-neutral-500'
          }`}
        >
          Tech &amp; Creative Studio
        </span>
      )}
    </div>
  );

  const content = (
    <div
      className={`inline-flex items-center ${
        variant === 'stacked' ? 'gap-2.5' : 'gap-2 sm:gap-2.5'
      } cursor-pointer select-none group ${className}`}
      onClick={onClick}
    >
      {logoImage}
      {variant !== 'icon' && wordmark}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className="inline-flex items-center text-inherit no-underline focus-visible:outline-none"
        aria-label="Usman DevHub"
      >
        {content}
      </a>
    );
  }

  return content;
};
