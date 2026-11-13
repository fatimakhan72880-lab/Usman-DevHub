/**
 * Clean, balanced scrolling utility for navbar and section anchor navigation.
 * Ensures badges ("Core Capabilities", "High-Yield Partnership", etc.)
 * sit with a comfortable, natural gap right below the floating navbar pill
 * without touching it or leaving excessive empty voids.
 */
export const scrollToSectionWithOffset = (target: HTMLElement | string, smooth = true): void => {
  const el = typeof target === 'string' ? (document.querySelector(target) as HTMLElement | null) : target;
  if (!el) return;

  const navPill = document.querySelector('#main-navbar-header nav') as HTMLElement | null;
  const navBottom = navPill ? navPill.getBoundingClientRect().bottom : 58;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  // Refined natural gap: 14px on mobile, 20px on tablet/desktop
  const desiredGap = isMobile ? 14 : 20;

  // Look for the badge element (.inline-flex) or the first heading (h2, h3) inside the section
  const contentTarget = (el.querySelector('.inline-flex, h2, h3') || el) as HTMLElement;
  const contentTop = contentTarget.getBoundingClientRect().top + window.scrollY;
  const targetY = Math.max(0, contentTop - (navBottom + desiredGap));

  window.scrollTo({
    top: targetY,
    behavior: smooth ? 'smooth' : ('instant' as ScrollBehavior),
  });
};

/**
 * Instantly locks the viewport onto the last remaining visible card BEFORE collapsing
 * extra items below it, preventing any smooth-scroll sweep from lower sections.
 */
export const snapScrollToElement = (el: HTMLElement | null, onCollapse: () => void): void => {
  if (typeof window === 'undefined') {
    onCollapse();
    return;
  }

  let targetY: number | null = null;
  if (el) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 800;
    const isAlreadyComfortable = rect.top >= 84 && rect.bottom <= vh - 110;
    if (isAlreadyComfortable) {
      targetY = window.scrollY;
    } else {
      const desiredTop = Math.max(88, Math.min(vh * 0.28, vh - rect.height - 150));
      targetY = Math.max(0, window.scrollY + rect.top - desiredTop);
    }
  }

  const prevBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';

  if (targetY !== null) {
    window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
  }

  onCollapse();

  requestAnimationFrame(() => {
    if (targetY !== null) {
      window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
    }
    setTimeout(() => {
      document.documentElement.style.scrollBehavior = prevBehavior;
    }, 50);
  });
};

