import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
  keywords?: string;
  schema?: Record<string, unknown> | null;
}

const DEFAULT_TITLE = 'Usman DevHub | Web Development, 3D Websites & Digital Studio';
const DEFAULT_DESC =
  'Usman DevHub (usmandevhub.com) – Founded by Muhammad Usman Afzal. Custom Web Development, 3D Interactive WebGL, E-Commerce, Graphic Design & Cloud Setup.';
const DEFAULT_IMAGE = 'https://usmandevhub.com/apple-touch-icon.png';
const DEFAULT_KEYWORDS =
  'Usman DevHub, usmandevhub, USMAN DEVHUB, UsmanDevHub, Usman Dev Hub, usman dev hub, usmandevhub.com, Muhammad Usman Afzal, Web Development, 3D Websites, Three.js, WebGL, E-Commerce, Shopify, Graphic Design, 3D Video Animation, Cloud Setup, Website Maintenance';

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  url,
  image = DEFAULT_IMAGE,
  type = 'website',
  keywords,
  schema,
}) => {
  useEffect(() => {
    const finalTitle = title
      ? `${title} | Usman DevHub`
      : DEFAULT_TITLE;
    const finalDesc = description || DEFAULT_DESC;
    const finalKeywords = keywords || DEFAULT_KEYWORDS;

    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://usmandevhub.com';

    const finalUrl =
      url ||
      (typeof window !== 'undefined'
        ? window.location.origin + window.location.pathname + window.location.hash
        : 'https://usmandevhub.com/');

    // Ensure image is fully-qualified
    let finalImage = image || DEFAULT_IMAGE;
    if (finalImage.startsWith('/')) {
      finalImage = `${origin}${finalImage}`;
    }

    // Update document title
    document.title = finalTitle;

    // Helper to update or create meta tag
    const updateMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const parts = selector.replace(/[\[\]"]/g, '').split('=');
        if (parts.length === 2) {
          el.setAttribute(parts[0], parts[1]);
          document.head.appendChild(el);
        }
      }
      el.setAttribute(attr, value);
    };

    // Standard meta tags
    updateMeta('meta[name="description"]', 'content', finalDesc);
    updateMeta('meta[name="keywords"]', 'content', finalKeywords);

    // OpenGraph
    updateMeta('meta[property="og:title"]', 'content', finalTitle);
    updateMeta('meta[property="og:description"]', 'content', finalDesc);
    updateMeta('meta[property="og:url"]', 'content', finalUrl);
    updateMeta('meta[property="og:type"]', 'content', type);
    if (finalImage) {
      updateMeta('meta[property="og:image"]', 'content', finalImage);
      updateMeta('meta[property="og:image:alt"]', 'content', finalTitle);
    }

    // Twitter Card
    updateMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMeta('meta[name="twitter:title"]', 'content', finalTitle);
    updateMeta('meta[name="twitter:description"]', 'content', finalDesc);
    if (finalImage) {
      updateMeta('meta[name="twitter:image"]', 'content', finalImage);
    }

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', finalUrl);

    // Dynamic Schema.org JSON-LD tag for current active view
    const schemaTagId = 'dynamic-page-schema';
    let dynamicScript = document.getElementById(schemaTagId) as HTMLScriptElement | null;
    if (schema) {
      if (!dynamicScript) {
        dynamicScript = document.createElement('script');
        dynamicScript.id = schemaTagId;
        dynamicScript.type = 'application/ld+json';
        document.head.appendChild(dynamicScript);
      }
      try {
        dynamicScript.textContent = JSON.stringify(schema, null, 2);
      } catch {
        // Safe json stringify
      }
    } else if (dynamicScript) {
      dynamicScript.remove();
    }

    return () => {
      // Cleanup dynamic script on unmount
      const existing = document.getElementById(schemaTagId);
      if (existing) {
        existing.remove();
      }
    };
  }, [title, description, url, image, type, keywords, schema]);

  return null;
};
