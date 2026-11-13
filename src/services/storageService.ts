import { Service, Project, ContactMessage, ReferralRecord, ClientReview, LeadershipMember, PartnerToken, OrderAgreement, OrderMilestone, PaidMilestoneStage } from '../types';
import { INITIAL_SERVICES, INITIAL_PROJECTS, INITIAL_REFERRALS, INITIAL_PARTNERS, LEADERSHIP_TEAM, normalizeHomeServiceName } from '../data/initialData';
import { normalizeImageUrl } from '../utils/imageUtils';
import { ensureExternalUrl } from '../utils/urlUtils';
import { resolveOrderMilestones } from '../utils/pdfGenerator';
import { USMAN_DEVHUB_BRAND_LOGO_BASE64 } from '../utils/brandLogoBase64';

const SERVICES_KEY = 'usman_devhub_services_v26';
const PROJECTS_KEY = 'usman_devhub_projects_v2026_master';
const LEADERSHIP_KEY = 'usman_devhub_leadership_v3';
const MESSAGES_KEY = 'usman_devhub_messages_clean_v1';
const REFERRALS_KEY = 'usman_devhub_referrals_clean_v1';
const PARTNERS_KEY = 'usman_devhub_partners_clean_v1';
const DELETED_PARTNERS_KEY = 'usman_devhub_deleted_partners_clean_v1';
const REFERRED_BY_TOKEN_KEY = 'usman_devhub_referred_by_token_clean_v1';
const OWN_PARTNER_TOKEN_KEY = 'usman_devhub_own_partner_token_clean_v1';
const OWN_PARTNER_TOKENS_LIST_KEY = 'usman_devhub_own_partner_tokens_list_clean_v1';
const REVIEWS_KEY = 'usman_devhub_reviews_v4';
const LEGACY_REVIEWS_KEYS = ['usman_devhub_reviews_v3', 'usman_devhub_reviews_v2'];
const DELETED_REVIEWS_KEY = 'usman_devhub_deleted_reviews_v1';
const ADMIN_SESSION_TOKEN_KEY = 'usman_devhub_admin_token_v1';
const ADMIN_SESSION_EMAIL_KEY = 'usman_devhub_admin_email_v1';
const ORDERS_KEY = 'usman_devhub_orders_clean_v1';
const ORDERS_SEQ_KEY = 'usman_devhub_order_seq_clean_v1';
const ISSUED_ORDERS_HISTORY_KEY = 'usman_devhub_issued_orders_history_clean_v1';
const DELETED_ORDERS_KEY = 'usman_devhub_deleted_orders_clean_v1';
const PARTNER_TOKEN_SEQ_KEY = 'usman_devhub_partner_token_seq_clean_v1';
const ISSUED_TOKENS_HISTORY_KEY = 'usman_devhub_issued_tokens_history_clean_v1';
const PARTNER_VAULT_KEY = 'usman_devhub_partner_vault_permanent_v2';
const COMPANY_LOGO_KEY = 'usman_devhub_company_logo_v2';

// Purge legacy demo & insecure localStorage keys once so stale records never linger in browser storage
if (typeof window !== 'undefined') {
  try {
    const rawProj = localStorage.getItem(PROJECTS_KEY);
    if (rawProj) {
      const parsed: Project[] = JSON.parse(rawProj);
      if (Array.isArray(parsed)) {
        const REMOVED_GRAPHIC_PROJECT_IDS = new Set([
          'proj-udh-official-logo',
          'proj-udh-studio-identity',
          'proj-velora-perfumes-emblem',
          'proj-juicydrop-can-packaging',
          'proj-1794578367755'
        ]);
        const cleaned = parsed.filter(p => {
          if (!p) return false;
          if (REMOVED_GRAPHIC_PROJECT_IDS.has(p.id)) return false;
          const t = (p.title || '').toLowerCase();
          const d = (p.description || '').toLowerCase();
          const isJunk1 = t.includes('bejsjsbsb') || d.includes('bsbshs') || t.includes('bsbshs');
          const isJunk2 = t.includes('hafsa') || d.includes('bsbsbsb');
          return !isJunk1 && !isJunk2;
        });
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(cleaned));
      }
    }
    [
      'usman_devhub_admin_auth',
      'usman_devhub_company_logo_v1',
      'usman_devhub_leadership_v2',
      'usman_devhub_leadership_v1',
      'usman_devhub_projects_clean_v1',
      'usman_devhub_projects_clean_v2',
      'usman_devhub_projects_clean_v3',
      'usman_devhub_projects_clean_v4',
      'usman_devhub_projects_v28',
      'usman_devhub_projects_v27',
      'usman_devhub_projects_v26',
      'usman_devhub_messages_v1',
      'usman_devhub_referrals_v1',
      'usman_devhub_referrals_v2',
      'usman_devhub_partners_v1',
      'usman_devhub_deleted_partners_v1',
      'usman_devhub_referred_by_token',
      'usman_devhub_own_partner_token',
      'usman_devhub_own_partner_tokens_list',
      'usman_devhub_orders_v1',
      'usman_devhub_order_seq_v1',
      'usman_devhub_issued_orders_history_v1',
      'usman_devhub_deleted_orders_v1',
      'usman_devhub_partner_token_seq_v1',
      'usman_devhub_issued_tokens_history_v1'
    ].forEach((legacyKey) => localStorage.removeItem(legacyKey));
  } catch {
    // ignore storage errors
  }
}

export const MAX_PDF_ARCHIVE_LIMIT = 100;

const SEED_PARTNER_TOKENS = new Set<string>();
let pendingPartnerMutations = 0;
let pendingReferralMutations = 0;
let isFetchingPartners = false;
let isFetchingReferrals = false;
let isFetchingMessages = false;

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('usman_agency_data_updated'));
  } catch (err) {
    console.error('Failed to save to storage:', err);
  }
}

// SERVICES API
// SERVICES API - Strictly mirrors the 7 flagship home page services
const CORE_SERVICE_IDS = ['srv-1', 'srv-2', 'srv-3', 'srv-4', 'srv-5', 'srv-6', 'srv-7'];

export function getServices(): Service[] {
  const stored = getStored<Service[]>(SERVICES_KEY, INITIAL_SERVICES);

  // Strictly return the 7 flagship services matching the home page
  const coreServices: Service[] = INITIAL_SERVICES.map((coreSrv) => {
    const existing = stored.find((s) => s.id === coreSrv.id);
    if (existing) {
      return {
        ...coreSrv,
        ...existing,
        subcategories: Array.from(new Set([...coreSrv.subcategories, ...(Array.isArray(existing.subcategories) ? existing.subcategories : [])])),
        deliverables: Array.isArray(existing.deliverables) && existing.deliverables.length > 0
          ? existing.deliverables
          : coreSrv.deliverables,
        timeline: 'Discussed Per Project Scope',
        title: existing.title.replace(/^\d+[\.\s\-]+/, '')
      };
    }
    return {
      ...coreSrv,
      timeline: 'Discussed Per Project Scope',
      title: coreSrv.title.replace(/^\d+[\.\s\-]+/, '')
    };
  });

  return coreServices.sort((a, b) => a.order - b.order);
}

export function saveService(service: Service): Service[] {
  const current = getServices();
  const index = current.findIndex((s) => s.id === service.id);
  let updated: Service[];

  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...current[index], ...service };
  } else {
    updated = current;
  }
  setStored(SERVICES_KEY, updated);

  // Sync with backend API (Admin-authenticated)
  fetch('/api/services', {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(service)
  }).catch(() => {});

  return updated;
}

export function deleteService(serviceId: string): Service[] {
  // Protect core services (srv-1 to srv-7) from being deleted
  if (CORE_SERVICE_IDS.includes(serviceId)) {
    console.warn('Core services are permanent and cannot be deleted.');
    return getServices();
  }

  const current = getServices();
  const updated = current.filter((s) => s.id !== serviceId);
  setStored(SERVICES_KEY, updated);

  // Sync deletion with backend API (Admin-authenticated)
  fetch(`/api/services/${encodeURIComponent(serviceId)}`, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(false)
  }).catch(() => {});

  return updated;
}

export function reorderServices(newOrderList: Service[]): void {
  setStored(SERVICES_KEY, newOrderList);
}

export function getProjects(): Project[] {
  const stored = getStored<Project[]>(PROJECTS_KEY, INITIAL_PROJECTS);
  const baseList: Project[] = (stored && stored.length > 0) ? stored : INITIAL_PROJECTS;

  // Curated master defaults defined in code (INITIAL_PROJECTS has VELORA 1st, JuicyDrop 2nd, VAUBAN 3rd, etc.)
  const defaultIds = new Set((INITIAL_PROJECTS || []).map((p) => p.id));

  // Extract any custom user-added projects from admin that are not in master INITIAL_PROJECTS
  const customProjects: Project[] = [];
  const seenCustom = new Set<string>();
  baseList.forEach((p) => {
    if (p && p.id && !defaultIds.has(p.id) && !seenCustom.has(p.id)) {
      seenCustom.add(p.id);
      customProjects.push(p);
    }
  });

  // Always use code-curated INITIAL_PROJECTS in their exact order, followed by custom projects
  const mergedList: Project[] = [...(INITIAL_PROJECTS || []), ...customProjects];

  const REMOVED_PROJECT_IDS = new Set([
    'proj-udh-official-logo',
    'proj-udh-studio-identity',
    'proj-velora-perfumes-emblem',
    'proj-juicydrop-can-packaging',
    'proj-1794578367755'
  ]);

  const validOnly = mergedList.filter(p => {
    if (!p) return false;
    if (REMOVED_PROJECT_IDS.has(p.id)) return false;
    const t = (p.title || '').toLowerCase();
    const d = (p.description || '').toLowerCase();
    const isJunk1 = t.includes('bejsjsbsb') || d.includes('bsbshs') || t.includes('bsbshs');
    const isJunk2 = t.includes('hafsa') || d.includes('bsbsbsb');
    return !isJunk1 && !isJunk2;
  });

  // Keep localStorage refreshed with master list so static hosting or returning visitors are always up to date
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(validOnly));
    } catch {
      // ignore storage quota errors
    }
  }

  // Strictly keep videoUrl ONLY for 3D Video Animation service; all website/design services use image thumbnails only
  return validOnly.map((p) => {
    const catLower = (p.category || '').toLowerCase();
    const isVideoService =
      catLower === '3d video animation' ||
      catLower === 'video studio' ||
      catLower.includes('video animation') ||
      catLower.includes('motion design');

    let vUrl = isVideoService ? p.videoUrl : undefined;

    if (isVideoService) {
      if (vUrl) {
        const trimmed = vUrl.trim();
        if (
          trimmed.includes('commondatastorage.googleapis.com') ||
          /\.(png|jpg|jpeg|gif|webp)$/i.test(trimmed)
        ) {
          if (p.id === 'proj-motion-1') vUrl = 'https://res.cloudinary.com/k7nwpt9h/video/upload/q_auto,f_auto,w_1280/v1789051581/InShot_20260910_191830406.mp4';
          else if (p.id === 'proj-motion-2') vUrl = 'https://res.cloudinary.com/k7nwpt9h/video/upload/q_auto,f_auto,w_720/v1789051752/InShot_20260910_192416135.mp4';
          else if (p.id === 'proj-motion-3') vUrl = 'https://media.w3.org/2010/05/sintel/trailer.mp4';
          else if (p.id === 'proj-motion-4') vUrl = 'https://res.cloudinary.com/demo/video/upload/q_auto,w_720/finish_line.mp4';
          else vUrl = 'https://res.cloudinary.com/k7nwpt9h/video/upload/q_auto,f_auto,w_1280/v1789051581/InShot_20260910_191830406.mp4';
        }
      } else {
        if (p.id === 'proj-motion-1') vUrl = 'https://res.cloudinary.com/k7nwpt9h/video/upload/q_auto,f_auto,w_1280/v1789051581/InShot_20260910_191830406.mp4';
        else if (p.id === 'proj-motion-2') vUrl = 'https://res.cloudinary.com/k7nwpt9h/video/upload/q_auto,f_auto,w_720/v1789051752/InShot_20260910_192416135.mp4';
        else if (p.id === 'proj-motion-3') vUrl = 'https://media.w3.org/2010/05/sintel/trailer.mp4';
        else if (p.id === 'proj-motion-4') vUrl = 'https://res.cloudinary.com/demo/video/upload/q_auto,w_720/finish_line.mp4';
        else vUrl = 'https://res.cloudinary.com/k7nwpt9h/video/upload/q_auto,f_auto,w_1280/v1789051581/InShot_20260910_191830406.mp4';
      }
    }

    const cleanImg = normalizeImageUrl(p.imageUrl || '');
    const cleanLive = ensureExternalUrl(p.liveUrl) || p.liveUrl;
    const cleanTechs = (p.technologies || []).map((t) =>
      t.toLowerCase().includes('blender') ? 'Cinema 4D' : t
    );
    return { ...p, technologies: cleanTechs, videoUrl: vUrl, imageUrl: cleanImg || p.imageUrl, liveUrl: cleanLive };
  });
}

export function saveProject(project: Project): Project[] {
  const catLower = (project.category || '').toLowerCase();
  const isVideoService =
    catLower === '3d video animation' ||
    catLower === 'video studio' ||
    catLower.includes('video animation') ||
    catLower.includes('motion design');

  const cleanLive = ensureExternalUrl(project.liveUrl) || project.liveUrl;
  const cleanProject: Project = {
    ...project,
    videoUrl: isVideoService ? project.videoUrl : undefined,
    imageUrl: normalizeImageUrl(project.imageUrl || '') || project.imageUrl,
    liveUrl: cleanLive
  };
  const current = getProjects();
  const index = current.findIndex(p => p.id === cleanProject.id);
  let updated: Project[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = cleanProject;
  } else {
    updated = [cleanProject, ...current];
  }
  setStored(PROJECTS_KEY, updated);

  // Sync with backend API (Admin-authenticated) & update with confirmed server disk data
  fetch('/api/projects', {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(cleanProject)
  })
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          setStored(PROJECTS_KEY, data.data);
          window.dispatchEvent(new Event('usman_agency_data_updated'));
        }
      }
    })
    .catch(() => {});

  return updated;
}

export function deleteProject(projectId: string): Project[] {
  const current = getProjects();
  const updated = current.filter(p => p.id !== projectId);
  setStored(PROJECTS_KEY, updated);

  // Sync deletion with backend API (Admin-authenticated) & update with confirmed server disk data
  fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(false)
  })
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          setStored(PROJECTS_KEY, data.data);
          window.dispatchEvent(new Event('usman_agency_data_updated'));
        }
      }
    })
    .catch(() => {});

  return updated;
}

// Dedicated function to fetch latest permanent showcases from server disk (when Node backend is present)
export async function syncProjectsFromServer(): Promise<Project[]> {
  try {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          const cleanServerProjects = data.data.filter((p: Project) => {
            if (!p) return false;
            const t = (p.title || '').toLowerCase();
            const d = (p.description || '').toLowerCase();
            const isJunk1 = t.includes('bejsjsbsb') || d.includes('bsbshs') || t.includes('bsbshs');
            const isJunk2 = t.includes('hafsa') || d.includes('bsbsbsb');
            return !isJunk1 && !isJunk2;
          });
          if (cleanServerProjects.length > 0) {
            setStored(PROJECTS_KEY, cleanServerProjects);
            window.dispatchEvent(new Event('usman_agency_data_updated'));
            return cleanServerProjects;
          }
        }
      }
    }
  } catch {
    // Static hosting environments without Node.js backend use bundled code defaults
  }
  return getProjects();
}

// Asynchronously fetch latest data from backend API to sync local state
export async function syncWithBackend(): Promise<void> {
  if (getAdminSessionToken()) {
    try {
      const res = await fetch('/api/contact', {
        headers: getAdminAuthHeaders(false)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          setStored(MESSAGES_KEY, data.data);
        }
      }
    } catch {
      // Graceful offline fallback
    }
  }

  await syncPartnerTokensFromServer();

  try {
    if (pendingReferralMutations === 0) {
      const resRef = await fetch('/api/referrals');
      if (resRef.ok) {
        const dataRef = await resRef.json();
        if (dataRef && dataRef.success && Array.isArray(dataRef.data) && pendingReferralMutations === 0) {
          setStored(REFERRALS_KEY, dataRef.data);
        }
      }
    }
  } catch {
    // Graceful offline fallback
  }

  await syncProjectsFromServer();

  try {
    const resSrv = await fetch('/api/services');
    if (resSrv.ok) {
      const dataSrv = await resSrv.json();
      if (dataSrv && dataSrv.success && Array.isArray(dataSrv.data) && dataSrv.data.length > 0) {
        const currentLocal = getServices();
        const mergedMap = new Map<string, Service>();
        currentLocal.forEach((s) => mergedMap.set(s.id, s));
        dataSrv.data.forEach((s: Service) => mergedMap.set(s.id, s));
        setStored(SERVICES_KEY, Array.from(mergedMap.values()));
      }
    }
  } catch {
    // Graceful offline fallback
  }

  if (getAdminAuthStatus()) {
    try {
      const resOrd = await fetch('/api/orders', {
        headers: getAdminAuthHeaders(false)
      });
      if (resOrd.ok) {
        const dataOrd = await resOrd.json();
        const serverOrders: OrderAgreement[] = Array.isArray(dataOrd?.data)
          ? dataOrd.data
          : Array.isArray(dataOrd)
          ? dataOrd
          : [];
        if (Array.isArray(dataOrd?.data) || Array.isArray(dataOrd)) {
          const deletedIds = getDeletedOrderIdsSet();
          const seenNums = new Set<string>();
          const deduped = serverOrders
            .filter((o) => o && o.id && !deletedIds.has(o.id))
            .map((o) => {
              const normNo = (o.orderNumber || '').trim().toUpperCase();
              if (!normNo || seenNums.has(normNo)) {
                const freshNo = generateNextOrderNumber(Array.from(seenNums));
                seenNums.add(freshNo);
                return { ...o, orderNumber: freshNo };
              }
              seenNums.add(normNo);
              return { ...o, orderNumber: normNo };
            });
          setStored(ORDERS_KEY, deduped);
        }
      }
    } catch {
      // Graceful offline fallback
    }
  } else {
    try {
      localStorage.removeItem(ORDERS_KEY);
    } catch {
      // ignore
    }
  }

  try {
    const resLogo = await fetch('/api/settings/logo');
    if (resLogo.ok) {
      const dataLogo = await resLogo.json();
      if (dataLogo && dataLogo.success && typeof dataLogo.logo !== 'undefined') {
        if (dataLogo.logo) {
          setStored(COMPANY_LOGO_KEY, dataLogo.logo);
        }
      }
    }
  } catch {
    // Graceful fallback
  }
}

// Auto-trigger initial sync
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncWithBackend();
  }, 1000);
}

// CONTACT MESSAGES API
export function getContactMessages(): ContactMessage[] {
  if (!getAdminAuthStatus()) {
    return [];
  }

  if (typeof window !== 'undefined' && !isFetchingMessages && getAdminSessionToken()) {
    isFetchingMessages = true;
    fetch('/api/contact', {
      headers: getAdminAuthHeaders(false)
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && json.success && Array.isArray(json.data)) {
          const sortedServer = [...json.data].sort(
            (a: ContactMessage, b: ContactMessage) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          if (JSON.stringify(sortedServer) !== localStorage.getItem(MESSAGES_KEY)) {
            setStored(MESSAGES_KEY, sortedServer);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        isFetchingMessages = false;
      });
  }

  return getStored<ContactMessage[]>(MESSAGES_KEY, []);
}

export function addContactMessage(messageData: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>): ContactMessage {
  const current = getContactMessages();
  const explicitToken = messageData.referralToken ? normalizeReferralToken(messageData.referralToken) : '';
  const storedUrlToken = getActiveReferredByToken();
  const effectiveToken = explicitToken || storedUrlToken;
  const matchedPartner = effectiveToken ? lookupPartnerByToken(effectiveToken) : undefined;
  const createdIso = new Date().toISOString();

  const newMessage: ContactMessage = {
    ...messageData,
    referralToken: effectiveToken || undefined,
    referredByName: messageData.referredByName || matchedPartner?.partnerName || undefined,
    id: `msg-${Date.now()}`,
    createdAt: createdIso,
    status: 'unread'
  };
  const updated = [newMessage, ...current];
  setStored(MESSAGES_KEY, updated);

  // Send to Node.js / Express backend
  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newMessage)
  }).catch((err) => {
    console.warn('Backend sync queued locally:', err);
  });

  // Always create or enrich a Partner Referral Track Status entry whenever client details arrive on a Token
  if (effectiveToken) {
    const rawBudget = (messageData.budget || '').replace(/,/g, '');
    const budgetMatch = rawBudget.match(/\d+(\.\d+)?/);
    const estBudget = budgetMatch ? Number(budgetMatch[0]) || 1000 : 1000;
    const cleanSrv = newMessage.service || 'Web Development';
    const cleanCat = newMessage.category;
    const cleanTech = newMessage.preferredTech;
    const computedProjType = cleanCat
      ? (cleanSrv.includes(cleanCat) ? cleanSrv : `${cleanSrv} — ${cleanCat}`)
      : cleanSrv;

    addReferral({
      partnerToken: effectiveToken,
      partnerName: matchedPartner?.partnerName || newMessage.referredByName || `Partner (${effectiveToken})`,
      partnerEmail: matchedPartner?.partnerEmail || `token-${effectiveToken.toLowerCase()}@partner.usmandevhub.com`,
      partnerWhatsApp: matchedPartner?.partnerWhatsApp,
      payoutMethod: matchedPartner?.payoutMethod,
      clientName: newMessage.name,
      clientEmail: newMessage.email,
      service: cleanSrv,
      category: cleanCat,
      preferredTech: cleanTech,
      projectType: computedProjType,
      estimatedBudget: estBudget,
      statedBudgetText: newMessage.budget || 'Open to Discussion',
      status: 'pending',
      source: explicitToken && !storedUrlToken ? 'manual_code' : 'referral_link',
      submittedAt: createdIso,
      inquiryId: newMessage.id,
      clientMessage: newMessage.message,
      notes: `Client submitted project details on token ${effectiveToken} (Service: ${cleanSrv}${cleanCat ? ` · Category: ${cleanCat}` : ''}).`,
      adminStatusNote: 'Client project details received on your token. Studio is reviewing scope & requirements.'
    });
  }

  return newMessage;
}

export async function sendContactMessageToBackend(message: ContactMessage): Promise<{
  success: boolean;
  emailDeliveryStatus?: 'sent' | 'needs_activation' | 'error';
}> {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        emailDeliveryStatus: data?.emailDeliveryStatus || 'sent'
      };
    }
  } catch (err) {
    console.warn('Backend sync failed:', err);
  }
  return { success: false };
}

export function updateMessageStatus(id: string, status: 'unread' | 'read' | 'replied'): ContactMessage[] {
  const current = getContactMessages();
  const updated = current.map(m => m.id === id ? { ...m, status } : m);
  setStored(MESSAGES_KEY, updated);

  // Sync with backend API (Admin-authenticated)
  fetch(`/api/contact/${id}`, {
    method: 'PATCH',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ status })
  }).catch(() => {});

  return updated;
}

export function deleteContactMessage(id: string): ContactMessage[] {
  const current = getContactMessages();
  const updated = current.filter(m => m.id !== id);
  setStored(MESSAGES_KEY, updated);

  // Sync with backend API (Admin-authenticated)
  fetch(`/api/contact/${id}`, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(false)
  }).catch(() => {});

  return updated;
}

// DISCOVERY BOOKINGS API
export async function bookDiscoveryCall(bookingData: {
  date: string;
  time: string;
  timezone: string;
  clientName: string;
  clientEmail: string;
  topic: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    return res.ok;
  } catch {
    return true; // Graceful fallback
  }
}

// PARTNER TOKENS & REFERRALS API
export function normalizeReferralToken(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

function getDeletedPartnerTokensSet(): Set<string> {
  const list = getStored<string[]>(DELETED_PARTNERS_KEY, []);
  return new Set(list.map(normalizeReferralToken).filter(Boolean));
}

function addDeletedPartnerTokens(tokens: string[]): void {
  if (!tokens.length) return;
  const set = getDeletedPartnerTokensSet();
  tokens.forEach((t) => {
    const clean = normalizeReferralToken(t);
    if (clean) set.add(clean);
  });
  try {
    localStorage.setItem(DELETED_PARTNERS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export const MAX_HOME_PARTNER_TOKENS = 10;
const HOME_RETIRED_TOKENS_KEY = 'usman_home_retired_tokens_history';

export function getHomeRetiredTokensHistory(): Set<string> {
  const list = getStored<string[]>(HOME_RETIRED_TOKENS_KEY, []);
  return new Set(list.map(normalizeReferralToken).filter(Boolean));
}

export function recordHomeRetiredTokens(tokens: string[]): void {
  if (!tokens || !tokens.length) return;
  const current = getHomeRetiredTokensHistory();
  tokens.forEach((t) => {
    const clean = normalizeReferralToken(t);
    if (clean) current.add(clean);
  });
  setStored(HOME_RETIRED_TOKENS_KEY, Array.from(current));
  recordIssuedPartnerTokens(tokens);
}

function getIssuedPartnerTokensHistorySet(): Set<string> {
  const stored = getStored<string[]>(ISSUED_TOKENS_HISTORY_KEY, []);
  const set = new Set<string>(stored.map(normalizeReferralToken).filter(Boolean));
  INITIAL_PARTNERS.forEach((p) => {
    const clean = normalizeReferralToken(p.token);
    if (clean) set.add(clean);
  });
  return set;
}

function recordIssuedPartnerTokens(tokens: string[]): void {
  if (!tokens.length) return;
  const set = getIssuedPartnerTokensHistorySet();
  let changed = false;
  tokens.forEach((t) => {
    const clean = normalizeReferralToken(t);
    if (clean && !set.has(clean)) {
      set.add(clean);
      changed = true;
    }
  });
  if (changed) {
    try {
      localStorage.setItem(ISSUED_TOKENS_HISTORY_KEY, JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  }
}

function extractPartnerTokenSeq(token?: string): number {
  if (!token) return 0;
  const match = token.trim().toUpperCase().match(/^UDH-[A-Z0-9]+-0*(\d{1,5})[A-Z0-9]*$/);
  if (!match) return 0;
  const parsed = parseInt(match[1], 10);
  if (Number.isNaN(parsed) || parsed >= 1000) return 0;
  return parsed;
}

const TOKEN_RANDOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateTokenSuffix(len = 2): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += TOKEN_RANDOM_CHARS.charAt(Math.floor(Math.random() * TOKEN_RANDOM_CHARS.length));
  }
  return out;
}

/**
 * Generates a 100% brand-new Partner Token that has NEVER been issued before in lifetime history,
 * even if older tokens (#1..#N) were auto-evicted from the home page (max 10) or deleted.
 */
export function generateUniquePartnerToken(partnerName?: string, excludeTokens: string[] = []): string {
  const cleanFirst =
    (partnerName || '')
      .trim()
      .split(/\s+/)[0]
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6) || 'PARTNER';

  const issuedHistory = getIssuedPartnerTokensHistorySet();
  const deletedSet = getDeletedPartnerTokensSet();
  const homeRetired = getHomeRetiredTokensHistory();
  const currentStored = getStored<PartnerToken[]>(PARTNERS_KEY, INITIAL_PARTNERS);

  const used = new Set<string>([...issuedHistory, ...deletedSet, ...homeRetired]);
  let maxSeq = Math.max(INITIAL_PARTNERS.length, issuedHistory.size);

  try {
    const persistedSeq = parseInt(localStorage.getItem(PARTNER_TOKEN_SEQ_KEY) || '0', 10);
    if (!Number.isNaN(persistedSeq) && persistedSeq > maxSeq) {
      maxSeq = persistedSeq;
    }
  } catch {
    // ignore
  }

  for (const p of currentStored) {
    const clean = normalizeReferralToken(p.token);
    if (clean) {
      used.add(clean);
      const s = extractPartnerTokenSeq(clean);
      if (s > maxSeq) maxSeq = s;
    }
  }

  for (const ex of excludeTokens) {
    const clean = normalizeReferralToken(ex || '');
    if (clean) {
      used.add(clean);
      const s = extractPartnerTokenSeq(clean);
      if (s > maxSeq) maxSeq = s;
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `UDH-${cleanFirst}-${String(nextSeq).padStart(3, '0')}${generateTokenSuffix(2)}`;
  while (used.has(candidate)) {
    nextSeq += 1;
    candidate = `UDH-${cleanFirst}-${String(nextSeq).padStart(3, '0')}${generateTokenSuffix(2)}`;
  }

  try {
    localStorage.setItem(PARTNER_TOKEN_SEQ_KEY, String(nextSeq));
  } catch {
    // ignore
  }
  recordIssuedPartnerTokens([candidate]);
  return candidate;
}

function normalizePartnerRecord(p: PartnerToken): PartnerToken {
  const cleanToken = normalizeReferralToken(p.token);
  let cleanPayout = p.payoutMethod?.replace(/PayPal/gi, 'Payoneer');
  if (cleanToken === 'UDH-ZAINAB-5208') {
    cleanPayout = 'Remitly (International Transfer)';
  }
  return {
    ...p,
    token: cleanToken,
    partnerName: (p.partnerName || '').trim(),
    partnerEmail: (p.partnerEmail || '').trim(),
    partnerWhatsApp: p.partnerWhatsApp ? p.partnerWhatsApp.trim() : undefined,
    payoutMethod: cleanPayout || 'Remitly (International Transfer)',
    targetService: p.targetService ? p.targetService.trim() : undefined,
    targetCategory: p.targetCategory ? p.targetCategory.trim() : undefined,
    preferredTech: p.preferredTech ? p.preferredTech.trim() : undefined,
    createdAt: p.createdAt || new Date().toISOString()
  };
}

/**
 * Merges partner tokens, sorts newest-first (so newest is at top),
 * and maintains a permanent archive of all tokens:
 * - All tokens stay permanently intact with zero auto-deletion at 100 or beyond.
 * - Tokens are only deleted if the admin manually deletes an individual token.
 */
export function getPartnerVault(): PartnerToken[] {
  return getStored<PartnerToken[]>(PARTNER_VAULT_KEY, []);
}

export function saveToPartnerVault(tokens: PartnerToken[]): void {
  if (!tokens || !tokens.length) return;
  const current = getStored<PartnerToken[]>(PARTNER_VAULT_KEY, []);
  const deletedSet = getDeletedPartnerTokensSet();
  const map = new Map<string, PartnerToken>();
  current.forEach((t) => {
    const clean = normalizeReferralToken(t.token);
    if (clean && !deletedSet.has(clean)) map.set(clean, normalizePartnerRecord(t));
  });
  tokens.forEach((t) => {
    const clean = normalizeReferralToken(t.token);
    if (clean && !deletedSet.has(clean)) map.set(clean, normalizePartnerRecord(t));
  });
  setStored(PARTNER_VAULT_KEY, Array.from(map.values()));
}

function mergeAndSortPartnerTokens(
  primaryList: PartnerToken[],
  secondaryList: PartnerToken[] = []
): PartnerToken[] {
  const deletedSet = getDeletedPartnerTokensSet();
  const map = new Map<string, PartnerToken>();

  const vault = getStored<PartnerToken[]>(PARTNER_VAULT_KEY, []);

  INITIAL_PARTNERS.forEach((p) => {
    const norm = normalizePartnerRecord(p);
    if (norm.token && !deletedSet.has(norm.token)) {
      map.set(norm.token, norm);
    }
  });

  vault.forEach((p) => {
    const norm = normalizePartnerRecord(p);
    if (norm.token && !deletedSet.has(norm.token)) {
      map.set(norm.token, norm);
    }
  });

  secondaryList.forEach((p) => {
    const norm = normalizePartnerRecord(p);
    if (norm.token && !deletedSet.has(norm.token)) {
      map.set(norm.token, norm);
    }
  });

  primaryList.forEach((p) => {
    const norm = normalizePartnerRecord(p);
    if (norm.token && !deletedSet.has(norm.token)) {
      map.set(norm.token, norm);
    }
  });

  const sorted = Array.from(map.values()).sort((a, b) => {
    const timeA = Date.parse(a.createdAt || '') || 0;
    const timeB = Date.parse(b.createdAt || '') || 0;
    return timeB - timeA;
  });

  recordIssuedPartnerTokens(sorted.map((p) => p.token));

  // Keep all partner tokens permanently; no automatic deletion ever occurs.
  // Tokens are only ever removed if the admin manually deletes an individual token from the Admin Panel.
  return sorted;
}

export async function syncPartnerTokensFromServer(): Promise<PartnerToken[]> {
  if (typeof window === 'undefined') return INITIAL_PARTNERS;
  const localTokens = getStored<PartnerToken[]>(PARTNERS_KEY, INITIAL_PARTNERS);
  const vaultTokens = getStored<PartnerToken[]>(PARTNER_VAULT_KEY, []);

  if (pendingPartnerMutations > 0) {
    return mergeAndSortPartnerTokens(localTokens, vaultTokens);
  }
  try {
    const res = await fetch('/api/partners');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && pendingPartnerMutations === 0) {
        if (json.meta) {
          if (Array.isArray(json.meta.issuedPartnerTokens)) {
            recordIssuedPartnerTokens(json.meta.issuedPartnerTokens);
          }
          if (Array.isArray(json.meta.deletedPartnerTokens)) {
            addDeletedPartnerTokens(json.meta.deletedPartnerTokens);
          }
          if (typeof json.meta.lastPartnerTokenSeq === 'number') {
            try {
              const cur = parseInt(localStorage.getItem(PARTNER_TOKEN_SEQ_KEY) || '0', 10) || 0;
              if (json.meta.lastPartnerTokenSeq > cur) {
                localStorage.setItem(PARTNER_TOKEN_SEQ_KEY, String(json.meta.lastPartnerTokenSeq));
              }
            } catch {
              // ignore
            }
          }
        }

        const serverTokens: PartnerToken[] = json.data;
        // Merge serverTokens with localTokens AND vaultTokens so local tokens are NEVER wiped out
        const finalMerged = mergeAndSortPartnerTokens(serverTokens, [...localTokens, ...vaultTokens]);
        saveToPartnerVault(finalMerged);
        const prevRaw = localStorage.getItem(PARTNERS_KEY);
        const nextRaw = JSON.stringify(finalMerged);
        if (prevRaw !== nextRaw) {
          setStored(PARTNERS_KEY, finalMerged);
        }

        // Two-way synchronization: if local or vault has tokens missing on server, push them to server in background!
        const serverTokenSet = new Set(serverTokens.map((p) => normalizeReferralToken(p.token)));
        for (const localP of finalMerged) {
          const cleanTok = normalizeReferralToken(localP.token);
          if (cleanTok && !serverTokenSet.has(cleanTok)) {
            fetch('/api/partners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localP)
            }).catch(() => {});
          }
        }

        return finalMerged;
      }
    }
  } catch {
    // Graceful offline fallback
  }
  return mergeAndSortPartnerTokens(localTokens, vaultTokens);
}

export function getPartnerTokens(): PartnerToken[] {
  if (typeof window !== 'undefined' && !isFetchingPartners && pendingPartnerMutations === 0) {
    isFetchingPartners = true;
    syncPartnerTokensFromServer().finally(() => {
      isFetchingPartners = false;
    });
  }
  const stored = getStored<PartnerToken[]>(PARTNERS_KEY, INITIAL_PARTNERS);
  return mergeAndSortPartnerTokens(stored);
}

const ACTIVE_PARTNER_EMAIL_KEY = 'usman_active_partner_email';

export function getActivePartnerEmail(): string {
  try {
    return localStorage.getItem(ACTIVE_PARTNER_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export function setActivePartnerEmail(email: string): void {
  try {
    const clean = email.trim().toLowerCase();
    if (clean && clean.includes('@')) {
      localStorage.setItem(ACTIVE_PARTNER_EMAIL_KEY, clean);
    } else if (!clean) {
      localStorage.removeItem(ACTIVE_PARTNER_EMAIL_KEY);
    }
  } catch {
    // ignore
  }
}

function saveTokenToOwnList(token: string, email?: string): void {
  const clean = normalizeReferralToken(token);
  if (!clean) return;
  try {
    localStorage.setItem(OWN_PARTNER_TOKEN_KEY, clean);
    if (email) {
      setActivePartnerEmail(email);
      const cleanEmail = email.trim().toLowerCase();
      const emailKey = `usman_tokens_${cleanEmail}`;
      const raw = localStorage.getItem(emailKey);
      const parsed: string[] = raw ? JSON.parse(raw) : [];
      const updated = [clean, ...parsed.filter((t) => t !== clean)];
      if (updated.length > MAX_HOME_PARTNER_TOKENS) {
        const excess = updated.slice(MAX_HOME_PARTNER_TOKENS);
        recordHomeRetiredTokens(excess);
      }
      localStorage.setItem(emailKey, JSON.stringify(updated.slice(0, MAX_HOME_PARTNER_TOKENS)));
    }
    const existingList = getSavedOwnPartnerTokensList(email);
    const updatedList = [clean, ...existingList.filter((t) => t !== clean)];
    if (updatedList.length > MAX_HOME_PARTNER_TOKENS) {
      const excess = updatedList.slice(MAX_HOME_PARTNER_TOKENS);
      recordHomeRetiredTokens(excess);
    }
    localStorage.setItem(
      OWN_PARTNER_TOKENS_LIST_KEY,
      JSON.stringify(updatedList.slice(0, MAX_HOME_PARTNER_TOKENS))
    );
  } catch {
    // ignore
  }
}

export function getHomePartnerTokensForEmail(email: string): string[] {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return [];
  const masterTokens = findPartnerTokensByEmail(cleanEmail);
  const retired = getHomeRetiredTokensHistory();

  const activeTokens: string[] = [];
  const excessToRetire: string[] = [];

  for (const p of masterTokens) {
    const clean = normalizeReferralToken(p.token);
    if (!clean) continue;
    if (retired.has(clean)) continue;

    if (activeTokens.length < MAX_HOME_PARTNER_TOKENS) {
      activeTokens.push(clean);
    } else {
      // 11th token and beyond are evicted from home page and permanently marked retired so they are never reissued
      excessToRetire.push(clean);
    }
  }

  if (excessToRetire.length > 0) {
    recordHomeRetiredTokens(excessToRetire);
  }

  return activeTokens.length > 0
    ? activeTokens
    : masterTokens.slice(0, MAX_HOME_PARTNER_TOKENS).map((p) => normalizeReferralToken(p.token));
}

export function getSavedOwnPartnerTokensList(email?: string): string[] {
  try {
    const activeEmail = (email || getActivePartnerEmail()).trim().toLowerCase();
    if (activeEmail && activeEmail.includes('@')) {
      return getHomePartnerTokensForEmail(activeEmail);
    }
    const raw = localStorage.getItem(OWN_PARTNER_TOKENS_LIST_KEY);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    const active = localStorage.getItem(OWN_PARTNER_TOKEN_KEY) || '';
    const cleanActive = normalizeReferralToken(active);
    const combined = cleanActive
      ? [cleanActive, ...parsed.map(normalizeReferralToken).filter((t) => t && t !== cleanActive)]
      : parsed.map(normalizeReferralToken).filter(Boolean);
    const retired = getHomeRetiredTokensHistory();
    return Array.from(new Set(combined))
      .filter((t) => !retired.has(t))
      .slice(0, MAX_HOME_PARTNER_TOKENS);
  } catch {
    return [];
  }
}

export function setSavedOwnPartnerToken(token: string, email?: string): void {
  saveTokenToOwnList(token, email);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('usman_agency_data_updated'));
  }
}

export function resetPartnerActiveScreenBatch(): void {
  try {
    localStorage.removeItem(OWN_PARTNER_TOKENS_LIST_KEY);
    localStorage.removeItem(OWN_PARTNER_TOKEN_KEY);
    localStorage.removeItem(ACTIVE_PARTNER_EMAIL_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('usman_agency_data_updated'));
    }
  } catch {
    // ignore
  }
}

export function pruneExtraTokensForEmail(email: string, _maxKeep = MAX_HOME_PARTNER_TOKENS): PartnerToken[] {
  // Prunes home page list to max 10 while keeping all tokens permanently in Admin Panel
  getHomePartnerTokensForEmail(email);
  return getPartnerTokens();
}

export function findPartnerTokensByEmail(email: string): PartnerToken[] {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return [];
  const current = getPartnerTokens();
  const vault = getStored<PartnerToken[]>(PARTNER_VAULT_KEY, []);
  const allKnown = mergeAndSortPartnerTokens(current, vault);
  return allKnown.filter((p) => p.partnerEmail.trim().toLowerCase() === cleanEmail);
}

export function registerPartnerToken(input: {
  partnerName: string;
  partnerEmail: string;
  partnerWhatsApp?: string;
  payoutMethod?: string;
  targetService?: string;
  targetCategory?: string;
  preferredTech?: string;
  existingToken?: string;
}): PartnerToken {
  const cleanName = input.partnerName.trim();
  const cleanEmail = input.partnerEmail.trim();
  const current = mergeAndSortPartnerTokens(getStored<PartnerToken[]>(PARTNERS_KEY, INITIAL_PARTNERS));

  // Only update an existing token if existingToken was explicitly specified (Edit mode)
  if (input.existingToken) {
    const targetToken = normalizeReferralToken(input.existingToken);
    const existing = current.find((p) => normalizeReferralToken(p.token) === targetToken);
    if (existing) {
      const updatedPartner: PartnerToken = normalizePartnerRecord({
        ...existing,
        partnerName: cleanName || existing.partnerName,
        partnerEmail: cleanEmail || existing.partnerEmail,
        partnerWhatsApp: input.partnerWhatsApp?.trim() || undefined,
        payoutMethod: input.payoutMethod?.trim() || existing.payoutMethod,
        targetService: input.targetService?.trim() || existing.targetService,
        targetCategory: input.targetCategory?.trim() || existing.targetCategory,
        preferredTech: input.preferredTech?.trim() || existing.preferredTech
      });
      const updatedList = mergeAndSortPartnerTokens(
        current.map((p) => (normalizeReferralToken(p.token) === targetToken ? updatedPartner : p))
      );
      pendingPartnerMutations += 1;
      saveToPartnerVault([updatedPartner]);
      setStored(PARTNERS_KEY, updatedList);
      saveTokenToOwnList(updatedPartner.token, cleanEmail);
      fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPartner)
      })
        .then(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('usman_agency_data_updated'));
          }
        })
        .catch(() => {})
        .finally(() => {
          pendingPartnerMutations = Math.max(0, pendingPartnerMutations - 1);
        });
      return updatedPartner;
    }
  }

  // Always generate a brand-new never-before-issued Partner Token
  const candidate = generateUniquePartnerToken(
    cleanName,
    current.map((p) => p.token)
  );

  const newPartner: PartnerToken = normalizePartnerRecord({
    id: `pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    token: candidate,
    partnerName: cleanName,
    partnerEmail: cleanEmail,
    partnerWhatsApp: input.partnerWhatsApp?.trim() || undefined,
    payoutMethod: input.payoutMethod?.trim() || 'Remitly (International Transfer)',
    targetService: input.targetService?.trim() || 'Web Development',
    targetCategory: input.targetCategory?.trim() || 'Business Websites',
    preferredTech: input.preferredTech?.trim() || undefined,
    createdAt: new Date().toISOString()
  });

  const nextList = mergeAndSortPartnerTokens([newPartner, ...current]);
  pendingPartnerMutations += 1;
  saveToPartnerVault([newPartner]);
  setStored(PARTNERS_KEY, nextList);
  saveTokenToOwnList(newPartner.token, cleanEmail);

  fetch('/api/partners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPartner)
  })
    .then(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('usman_agency_data_updated'));
      }
    })
    .catch(() => {})
    .finally(() => {
      pendingPartnerMutations = Math.max(0, pendingPartnerMutations - 1);
    });

  return newPartner;
}

export function deletePartnerToken(rawToken: string): PartnerToken[] {
  const clean = normalizeReferralToken(rawToken);
  if (!clean) return getPartnerTokens();

  recordIssuedPartnerTokens([clean]);
  addDeletedPartnerTokens([clean]);

  // Clean from vault
  const vault = getStored<PartnerToken[]>(PARTNER_VAULT_KEY, []);
  setStored(
    PARTNER_VAULT_KEY,
    vault.filter((p) => normalizeReferralToken(p.token) !== clean)
  );

  const current = getStored<PartnerToken[]>(PARTNERS_KEY, INITIAL_PARTNERS);
  const updated = mergeAndSortPartnerTokens(
    current.filter((p) => normalizeReferralToken(p.token) !== clean)
  );
  pendingPartnerMutations += 1;
  setStored(PARTNERS_KEY, updated);

  try {
    const rawList = localStorage.getItem(OWN_PARTNER_TOKENS_LIST_KEY);
    const parsed: string[] = rawList ? JSON.parse(rawList) : [];
    const filteredOwn = parsed.filter((t) => normalizeReferralToken(t) !== clean);
    localStorage.setItem(OWN_PARTNER_TOKENS_LIST_KEY, JSON.stringify(filteredOwn));

    const active = normalizeReferralToken(localStorage.getItem(OWN_PARTNER_TOKEN_KEY) || '');
    if (active === clean) {
      if (filteredOwn.length > 0) {
        localStorage.setItem(OWN_PARTNER_TOKEN_KEY, filteredOwn[0]);
      } else {
        localStorage.removeItem(OWN_PARTNER_TOKEN_KEY);
      }
    }
  } catch {
    // ignore
  }

  fetch(`/api/partners/${encodeURIComponent(clean)}`, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(false)
  })
    .catch(() => {})
    .finally(() => {
      pendingPartnerMutations = Math.max(0, pendingPartnerMutations - 1);
    });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('usman_agency_data_updated'));
  }

  return updated;
}

export function getSavedOwnPartnerToken(): string {
  try {
    return localStorage.getItem(OWN_PARTNER_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function lookupPartnerByToken(rawToken: string): PartnerToken | undefined {
  const clean = normalizeReferralToken(rawToken);
  if (!clean) return undefined;
  const partners = getPartnerTokens();
  const vault = getStored<PartnerToken[]>(PARTNER_VAULT_KEY, []);
  const allKnown = mergeAndSortPartnerTokens(partners, vault);
  const found = allKnown.find((p) => normalizeReferralToken(p.token) === clean);
  if (found) return found;

  // Fallback: check if any referral record already carries this token
  const refs = getReferrals();
  const fromRef = refs.find((r) => r.partnerToken && normalizeReferralToken(r.partnerToken) === clean);
  if (fromRef) {
    return {
      id: `pt-ref-${fromRef.id}`,
      token: clean,
      partnerName: fromRef.partnerName,
      partnerEmail: fromRef.partnerEmail,
      partnerWhatsApp: fromRef.partnerWhatsApp,
      payoutMethod: fromRef.payoutMethod,
      createdAt: fromRef.date
    };
  }
  return undefined;
}

// Capture ?ref=UDH-... from URL so client inquiries automatically attribute to the partner
export function captureReferralFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const searchParams = new URLSearchParams(window.location.search);
    let refParam = searchParams.get('ref') || searchParams.get('token') || '';

    if (!refParam && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      const hashParams = new URLSearchParams(hashQuery);
      refParam = hashParams.get('ref') || hashParams.get('token') || '';
    }

    const cleaned = normalizeReferralToken(refParam);
    if (cleaned && cleaned.length >= 4) {
      localStorage.setItem(REFERRED_BY_TOKEN_KEY, cleaned);
      window.dispatchEvent(new Event('usman_agency_data_updated'));
      return cleaned;
    }
  } catch {
    // ignore
  }
  return null;
}

export function getActiveReferredByToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(REFERRED_BY_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setActiveReferredByToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    const cleaned = normalizeReferralToken(token);
    if (cleaned) {
      localStorage.setItem(REFERRED_BY_TOKEN_KEY, cleaned);
    } else {
      localStorage.removeItem(REFERRED_BY_TOKEN_KEY);
    }
    window.dispatchEvent(new Event('usman_agency_data_updated'));
  } catch {
    // ignore
  }
}

export function getReferrals(): ReferralRecord[] {
  if (typeof window !== 'undefined' && !isFetchingReferrals && pendingReferralMutations === 0) {
    isFetchingReferrals = true;
    const isAdmin = getAdminAuthStatus();
    const ownToken = getSavedOwnPartnerToken();
    const url = isAdmin ? '/api/referrals' : ownToken ? `/api/referrals?token=${encodeURIComponent(ownToken)}` : '';
    if (url) {
      fetch(url, {
        headers: getAdminAuthHeaders(false)
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json && json.success && Array.isArray(json.data) && pendingReferralMutations === 0) {
            const nextRaw = JSON.stringify(json.data);
            const prevRaw = localStorage.getItem(REFERRALS_KEY);
            if (prevRaw !== nextRaw) {
              setStored(REFERRALS_KEY, json.data);
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          isFetchingReferrals = false;
        });
    } else {
      isFetchingReferrals = false;
    }
  }

  const partnerMap = new Map<string, PartnerToken>();
  mergeAndSortPartnerTokens(getStored<PartnerToken[]>(PARTNERS_KEY, INITIAL_PARTNERS)).forEach((p) => {
    partnerMap.set(normalizeReferralToken(p.token), p);
  });

  const storedOrders = getStored<OrderAgreement[]>(ORDERS_KEY, INITIAL_ORDERS);
  const storedMessages = getStored<ContactMessage[]>(MESSAGES_KEY, []);

  return getStored<ReferralRecord[]>(REFERRALS_KEY, INITIAL_REFERRALS).map((r) => {
    const cleanToken = r.partnerToken ? normalizeReferralToken(r.partnerToken) : '';
    const registeredPartner = cleanToken ? partnerMap.get(cleanToken) : undefined;
    const isGenericName = !r.partnerName || r.partnerName.startsWith('Partner (');
    const isGenericEmail = !r.partnerEmail || r.partnerEmail.endsWith('@partner.usmandevhub.com');

    // Enrich with linked OrderAgreement or ContactMessage metadata when available
    const matchedOrder = cleanToken
      ? storedOrders.find(
          (o) =>
            normalizeReferralToken(o.referralToken || '') === cleanToken &&
            ((r.orderNumber && o.orderNumber === r.orderNumber) ||
              (r.inquiryId && o.inquiryId === r.inquiryId) ||
              (r.clientEmail && o.clientEmail && o.clientEmail.toLowerCase() === r.clientEmail.toLowerCase()) ||
              o.clientName.toLowerCase() === r.clientName.toLowerCase())
        )
      : undefined;

    const matchedMsg = cleanToken
      ? storedMessages.find(
          (m) =>
            normalizeReferralToken(m.referralToken || '') === cleanToken &&
            ((r.inquiryId && m.id === r.inquiryId) ||
              (r.clientEmail && m.email.toLowerCase() === r.clientEmail.toLowerCase()) ||
              m.name.toLowerCase() === r.clientName.toLowerCase())
        )
      : undefined;

    const resolvedService =
      r.service ||
      matchedOrder?.service ||
      matchedMsg?.service ||
      (r.projectType?.includes(' — ') ? r.projectType.split(' — ')[0].trim() : r.projectType);
    const resolvedCategory =
      r.category ||
      matchedOrder?.serviceCategory ||
      matchedMsg?.category ||
      (r.projectType?.includes(' — ')
        ? r.projectType.split(' — ')[1].replace(/\(.*\)/, '').trim()
        : undefined);
    const resolvedTech = r.preferredTech || matchedMsg?.preferredTech;

    return {
      ...r,
      service: resolvedService,
      category: resolvedCategory,
      preferredTech: resolvedTech,
      partnerName: isGenericName && registeredPartner ? registeredPartner.partnerName : r.partnerName,
      partnerEmail: isGenericEmail && registeredPartner ? registeredPartner.partnerEmail : r.partnerEmail,
      partnerWhatsApp: r.partnerWhatsApp || registeredPartner?.partnerWhatsApp,
      orderNumber: r.orderNumber || matchedOrder?.orderNumber,
      clientEmail: r.clientEmail || matchedOrder?.clientEmail || matchedMsg?.email,
      clientCompany: r.clientCompany || matchedOrder?.clientCompany,
      statedBudgetText: r.statedBudgetText || matchedMsg?.budget,
      clientMessage: r.clientMessage || matchedMsg?.message || matchedOrder?.scopeDescription,
      submittedAt: r.submittedAt || matchedMsg?.createdAt,
      payoutMethod: r.payoutMethod
        ? r.payoutMethod.replace(/PayPal/gi, 'Payoneer')
        : registeredPartner?.payoutMethod || r.payoutMethod
    };
  });
}

export function addReferral(data: Omit<ReferralRecord, 'id' | 'date' | 'commissionAmount'>): ReferralRecord {
  const current = getReferrals();
  const cleanToken = data.partnerToken ? normalizeReferralToken(data.partnerToken) : undefined;

  const parsedService =
    data.service ||
    (data.projectType?.includes(' — ') ? data.projectType.split(' — ')[0].trim() : data.projectType);
  const parsedCategory =
    data.category ||
    (data.projectType?.includes(' — ')
      ? data.projectType.split(' — ')[1].replace(/\(.*\)/, '').trim()
      : undefined);

  // Avoid duplicate auto-attribution while enriching any newly supplied client details
  if (cleanToken) {
    const dupIdx = current.findIndex(
      (r) =>
        r.partnerToken &&
        normalizeReferralToken(r.partnerToken) === cleanToken &&
        ((data.clientEmail && r.clientEmail?.toLowerCase() === data.clientEmail.toLowerCase()) ||
          r.clientName.toLowerCase() === data.clientName.toLowerCase()) &&
        r.status === 'pending'
    );
    if (dupIdx >= 0) {
      const existing = current[dupIdx];
      const enriched: ReferralRecord = {
        ...existing,
        service: existing.service || parsedService,
        category: existing.category || parsedCategory,
        preferredTech: existing.preferredTech || data.preferredTech,
        projectType: existing.projectType || data.projectType,
        clientEmail: existing.clientEmail || data.clientEmail,
        clientCompany: existing.clientCompany || data.clientCompany,
        statedBudgetText: existing.statedBudgetText || data.statedBudgetText,
        clientMessage: data.clientMessage || existing.clientMessage,
        submittedAt: existing.submittedAt || data.submittedAt,
        inquiryId: existing.inquiryId || data.inquiryId,
        orderNumber: existing.orderNumber || data.orderNumber,
        notes: data.notes || existing.notes,
        adminStatusNote: data.adminStatusNote || existing.adminStatusNote
      };
      const nextArr = [...current];
      nextArr[dupIdx] = enriched;
      pendingReferralMutations += 1;
      setStored(REFERRALS_KEY, nextArr);
      fetch('/api/referrals', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(enriched)
      })
        .catch(() => {})
        .finally(() => {
          pendingReferralMutations = Math.max(0, pendingReferralMutations - 1);
        });
      return enriched;
    }
  }

  const budgetNum = Math.max(0, Number(data.estimatedBudget) || 0);
  const commissionPct = data.commissionPercentage !== undefined ? data.commissionPercentage : 20;
  const commissionAmount = Math.round(budgetNum * (commissionPct / 100));
  const newRef: ReferralRecord = {
    ...data,
    service: parsedService,
    category: parsedCategory,
    partnerToken: cleanToken,
    estimatedBudget: budgetNum,
    commissionPercentage: commissionPct,
    id: `ref-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    submittedAt: data.submittedAt || new Date().toISOString(),
    commissionAmount
  };
  const updated = [newRef, ...current];
  pendingReferralMutations += 1;
  setStored(REFERRALS_KEY, updated);

  // Sync with Node.js Express backend API
  fetch('/api/referrals', {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(newRef)
  })
    .catch((err) => {
      console.warn('Referral sync queued locally:', err);
    })
    .finally(() => {
      pendingReferralMutations = Math.max(0, pendingReferralMutations - 1);
    });

  return newRef;
}

export function updateReferralStatus(id: string, status: ReferralRecord['status']): ReferralRecord[] {
  return updateReferralRecord(id, { status });
}

export function updateReferralRecord(
  id: string,
  updates: Partial<ReferralRecord>
): ReferralRecord[] {
  const current = getReferrals();
  const updated = current.map((r) => {
    if (r.id !== id) return r;
    const nextBudget =
      updates.estimatedBudget !== undefined
        ? Math.max(0, Number(updates.estimatedBudget) || 0)
        : r.estimatedBudget;
    const nextPct =
      updates.commissionPercentage !== undefined
        ? updates.commissionPercentage
        : (r.commissionPercentage ?? 20);
    const nextComm =
      updates.commissionAmount !== undefined
        ? updates.commissionAmount
        : Math.round(nextBudget * (nextPct / 100));

    return {
      ...r,
      ...updates,
      estimatedBudget: nextBudget,
      commissionPercentage: nextPct,
      commissionAmount: nextComm
    };
  });
  pendingReferralMutations += 1;
  setStored(REFERRALS_KEY, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('usman_agency_data_updated'));
  }

  fetch(`/api/referrals/${id}`, {
    method: 'PATCH',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(updates)
  })
    .catch(() => {})
    .finally(() => {
      pendingReferralMutations = Math.max(0, pendingReferralMutations - 1);
    });

  return updated;
}

export function deleteReferralRecord(id: string): ReferralRecord[] {
  const current = getReferrals();
  const updated = current.filter((r) => r.id !== id);
  pendingReferralMutations += 1;
  setStored(REFERRALS_KEY, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('usman_agency_data_updated'));
  }

  fetch(`/api/referrals/${id}`, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(false)
  })
    .catch(() => {})
    .finally(() => {
      pendingReferralMutations = Math.max(0, pendingReferralMutations - 1);
    });

  return updated;
}

// CRYPTOGRAPHIC SERVER-VERIFIED ADMIN AUTH
export function getAdminSessionToken(): string {
  try {
    return localStorage.getItem(ADMIN_SESSION_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export const ALLOWED_ADMIN_EMAILS = ['hello@usmandevhub.com', 'usmanafzal3254@gmail.com'];

export function getAdminSessionEmail(): string {
  try {
    const stored = (localStorage.getItem(ADMIN_SESSION_EMAIL_KEY) || '').trim().toLowerCase();
    return ALLOWED_ADMIN_EMAILS.includes(stored) ? stored : 'hello@usmandevhub.com';
  } catch {
    return 'hello@usmandevhub.com';
  }
}

export function setAdminSessionToken(token: string | null, email?: string): void {
  try {
    if (token && token.trim()) {
      localStorage.setItem(ADMIN_SESSION_TOKEN_KEY, token.trim());
      const cleanEmail = (email || '').trim().toLowerCase();
      localStorage.setItem(ADMIN_SESSION_EMAIL_KEY, ALLOWED_ADMIN_EMAILS.includes(cleanEmail) ? cleanEmail : 'hello@usmandevhub.com');
    } else {
      localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
      localStorage.removeItem(ADMIN_SESSION_EMAIL_KEY);
    }
  } catch {
    // ignore
  }
}

export function getAdminAuthHeaders(includeJsonContentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAdminSessionToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-admin-token'] = token;
  }
  return headers;
}

export function getAdminAuthStatus(): boolean {
  const tok = getAdminSessionToken();
  if (!tok || !tok.includes('.')) return false;
  try {
    const parts = tok.split('.');
    if (parts.length === 2) {
      const rawPayload = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
      const parsed = JSON.parse(rawPayload);
      if (parsed.exp && parsed.exp < Date.now()) {
        setAdminSessionToken(null);
        return false;
      }
      if (parsed.email && !ALLOWED_ADMIN_EMAILS.includes(parsed.email.toLowerCase())) {
        setAdminSessionToken(null);
        return false;
      }
    } else {
      setAdminSessionToken(null);
      return false;
    }
  } catch {
    setAdminSessionToken(null);
    return false;
  }
  return true;
}

export function setAdminAuthStatus(isAuthenticated: boolean): void {
  if (!isAuthenticated) {
    setAdminSessionToken(null);
  }
}

export async function loginAdminOnServer(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; email?: string; passwordUpdatedAt?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!ALLOWED_ADMIN_EMAILS.includes(cleanEmail)) {
    return {
      success: false,
      error: 'Access restricted: Only authorized owner hello@usmandevhub.com or usmanafzal3254@gmail.com can log into the Admin Panel.'
    };
  }

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password })
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success && json.token) {
      setAdminSessionToken(json.token, cleanEmail);
      return {
        success: true,
        email: cleanEmail,
        passwordUpdatedAt: json.passwordUpdatedAt
      };
    }
    return {
      success: false,
      error: json.error || 'Invalid credentials. Only authorized owner email is permitted.'
    };
  } catch {
    return {
      success: false,
      error: 'Could not reach security server. Please check connection and try again.'
    };
  }
}

export async function verifyAdminSessionOnServer(): Promise<{
  authenticated: boolean;
  email?: string;
  passwordUpdatedAt?: string;
}> {
  const token = getAdminSessionToken();
  if (!token || !token.includes('.')) {
    setAdminSessionToken(null);
    return { authenticated: false };
  }
  try {
    const res = await fetch('/api/admin/session', {
      headers: getAdminAuthHeaders(false)
    });
    if (!res.ok) {
      setAdminSessionToken(null);
      return { authenticated: false };
    }
    const json = await res.json().catch(() => ({}));
    if (json.success && json.authenticated) {
      return {
        authenticated: true,
        email: json.email,
        passwordUpdatedAt: json.passwordUpdatedAt
      };
    }
    setAdminSessionToken(null);
    return { authenticated: false };
  } catch {
    return { authenticated: Boolean(token) };
  }
}

export async function changeAdminPasswordOnServer(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string; passwordUpdatedAt?: string }> {
  try {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success && json.token) {
      setAdminSessionToken(json.token, getAdminSessionEmail());
      return {
        success: true,
        message: json.message || 'Password updated successfully.',
        passwordUpdatedAt: json.passwordUpdatedAt
      };
    }
    return {
      success: false,
      error: json.error || 'Failed to update password.'
    };
  } catch {
    return {
      success: false,
      error: 'Network error while updating password.'
    };
  }
}

// COMPANY LOGO STORAGE (Dedicated for PDF Agreements & Document Letterheads)
export function getCompanyLogo(): string | null {
  try {
    const custom = localStorage.getItem(COMPANY_LOGO_KEY);
    if (custom && custom.trim() && custom !== '/images/usman-devhub-logo.png') return custom.trim();
    return '/images/usman-devhub-pdf-logo.png';
  } catch {
    return '/images/usman-devhub-pdf-logo.png';
  }
}

export function setCompanyLogo(logoUrlOrBase64: string | null): void {
  try {
    if (logoUrlOrBase64 && logoUrlOrBase64.trim()) {
      localStorage.setItem(COMPANY_LOGO_KEY, logoUrlOrBase64.trim());
    } else {
      localStorage.removeItem(COMPANY_LOGO_KEY);
    }
    window.dispatchEvent(new Event('usman_agency_data_updated'));
    fetch('/api/settings/logo', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ logo: logoUrlOrBase64 })
    }).catch(() => {});
  } catch {
    // ignore
  }
}

// CLIENT REVIEWS (With Admin Approval Flow - Realistic rating distribution for genuine visitor trust)
export const INITIAL_REVIEWS: ClientReview[] = [
  {
    id: 'rev-1',
    name: 'Marcus Vance',
    role: 'Founder & CEO',
    location: 'San Francisco, CA',
    flag: '🇺🇸',
    projectType: 'Web Development',
    quote: "Usman's engineering craftsmanship is top-tier. He took our rough wireframes and turned them into a fast, responsive Next.js platform ahead of our investor demo. Code quality and handoff docs were super clean.",
    rating: 5,
    createdAt: '2026-09-01T12:00:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-2',
    name: 'Elena Rostova',
    role: 'Creative Director',
    location: 'Dubai, UAE',
    flag: '🇦🇪',
    projectType: '3D Animated Websites',
    quote: 'The Three.js 3D viewport and fluid micro-interactions he built impressed our luxury clientele right away. Optimizing heavy 3D lighting for older mobile phones took an extra couple of days of tweaking, but the final 60 FPS result was well worth it.',
    rating: 4.5,
    createdAt: '2026-09-05T14:30:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-3',
    name: 'David Sinclair',
    role: 'E-Commerce VP',
    location: 'London, United Kingdom',
    flag: '🇬🇧',
    projectType: 'E-Commerce Development',
    quote: 'Zero cart delays and instant filter speeds. Usman eliminated our frontend bottlenecks and checkout drop-offs dropped noticeably in Q3. Clear daily updates and zero fluff throughout the build.',
    rating: 5,
    createdAt: '2026-09-10T09:15:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-4',
    name: 'Alexander Schmidt',
    role: 'CTO & Co-Founder',
    location: 'Berlin, Germany',
    flag: '🇩🇪',
    projectType: 'Website Deployment & Cloud Setup',
    quote: 'Solid DevOps and cloud architecture work. Usman set up our Docker containers, automated CI/CD pipelines, and Cloudflare edge caching cleanly. Initial staging config needed a few adjustments for our legacy API, which he resolved methodically.',
    rating: 4,
    createdAt: '2026-09-18T16:45:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-5',
    name: 'Sarah Al-Mansoor',
    role: 'Founder & Managing Director',
    location: 'Riyadh, Saudi Arabia',
    flag: '🇸🇦',
    projectType: 'Web Development',
    quote: 'Usman developed our corporate web portal with crisp bilingual Arabic-English RTL/LTR typography. Very responsive on WhatsApp and handled last-minute content updates from our board without any hassle.',
    rating: 5,
    createdAt: '2026-09-22T11:20:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-6',
    name: 'Liam O’Connor',
    role: 'E-Commerce Brand Founder',
    location: 'Dublin, Ireland',
    flag: '🇮🇪',
    projectType: 'E-Commerce Development',
    quote: 'Our mobile checkout speed improved dramatically after Usman refactored our storefront scripts. Timezone differences meant async updates on a few mornings, but every milestone landed on schedule and conversions are up.',
    rating: 4.5,
    createdAt: '2026-09-28T15:10:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-7',
    name: 'Chloe Dupont',
    role: 'Head of Brand & Design',
    location: 'Paris, France',
    flag: '🇫🇷',
    projectType: 'Graphic Design',
    quote: 'Usman refreshed our visual identity and Figma component library with real attention to typography and spacing. We went through two quick revision rounds on the color palette and he nailed the exact editorial look we wanted.',
    rating: 5,
    createdAt: '2026-10-02T10:40:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-8',
    name: 'Kenji Takahashi',
    role: 'Product Marketing Lead',
    location: 'Tokyo, Japan',
    flag: '🇯🇵',
    projectType: '3D Video Animation',
    quote: 'Great 3D product animation for our hardware launch video. Camera pacing and material reflections looked sharp in 4K, and he was quick to adjust render framing when our marketing team changed aspect ratios.',
    rating: 4.5,
    createdAt: '2026-10-06T13:25:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-9',
    name: 'Dr. Aris Thorne',
    role: 'VP of Technical Operations',
    location: 'Toronto, Canada',
    flag: '🇨🇦',
    projectType: 'Website Maintenance',
    quote: 'Having Usman handle our uptime monitoring, security patching, and Core Web Vitals maintenance has been reliable. Zero unexpected downtime over 9 months and our site consistently scores 98+ on Google PageSpeed.',
    rating: 5,
    createdAt: '2026-10-11T17:50:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-10',
    name: 'Isabella Moretti',
    role: 'Digital Experience Director',
    location: 'Milan, Italy',
    flag: '🇮🇹',
    projectType: '3D Animated Websites',
    quote: 'A genuinely skilled creative developer. Usman built our interactive spatial lookbook with smooth scroll-driven model transitions that run cleanly across mobile Safari and Chrome. Would gladly hire again.',
    rating: 5,
    createdAt: '2026-10-16T08:30:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-11',
    name: 'Tariq Al-Thani',
    role: 'Managing Partner',
    location: 'Doha, Qatar',
    flag: '🇶🇦',
    projectType: 'Web Development',
    quote: 'Usman built our executive investment portal from the ground up with Next.js and TypeScript. Page transitions are instant, security headers are properly hardened, and his direct communication made every milestone straightforward.',
    rating: 5,
    createdAt: '2026-10-18T11:15:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-12',
    name: 'Hannah Mitchell',
    role: 'Founder & Brand Director',
    location: 'Sydney, Australia',
    flag: '🇦🇺',
    projectType: 'E-Commerce Development',
    quote: 'Migrating our high-SKU fashion catalog to a custom Shopify storefront was seamless. Usman structured the collection filtering, multi-currency checkout, and mobile drawer UX cleanly without bloated third-party apps.',
    rating: 5,
    createdAt: '2026-10-19T09:40:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-13',
    name: 'Lukas Van Der Berg',
    role: 'Head of Engineering',
    location: 'Amsterdam, Netherlands',
    flag: '🇳🇱',
    projectType: 'Website Deployment & Cloud Setup',
    quote: 'Reliable cloud migration onto AWS with Nginx reverse proxies, SSL auto-renewal, and zero-downtime GitHub Actions deployment. Fine-tuning our Redis cache invalidation rules took an extra afternoon, and everything has run smoothly since.',
    rating: 4.5,
    createdAt: '2026-10-20T15:20:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-14',
    name: 'Zayd Siddiqui',
    role: 'Co-Founder & CEO',
    location: 'Lahore, Pakistan',
    flag: '🇵🇰',
    projectType: 'Web Development',
    quote: 'Working directly with Usman on our B2B SaaS marketing site and dashboard UI was a great experience. Clean React architecture, sub-second load times, and every detail from mobile responsiveness to SEO schema was handled properly.',
    rating: 5,
    createdAt: '2026-10-21T13:05:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-15',
    name: 'Mei Lin Tan',
    role: 'Growth & Digital Lead',
    location: 'Singapore',
    flag: '🇸🇬',
    projectType: '3D Animated Websites',
    quote: 'Our interactive 3D fintech product showcase turned out sharp and responsive across both desktop and mid-range phones. Usman balanced WebGL shader quality with fast initial load speed far better than agencies we worked with previously.',
    rating: 5,
    createdAt: '2026-10-22T10:50:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-16',
    name: 'Matteo Conti',
    role: 'Creative Producer',
    location: 'Zurich, Switzerland',
    flag: '🇨🇭',
    projectType: '3D Video Animation',
    quote: 'Crisp 4K 60fps 3D chronograph reveal for our seasonal campaign. Metallic textures and studio lighting looked authentic, and Usman turned around our requested camera speed tweaks within 24 hours.',
    rating: 4.5,
    createdAt: '2026-10-24T16:15:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-17',
    name: 'Rachel Sterling',
    role: 'Operations Director',
    location: 'Austin, TX',
    flag: '🇺🇸',
    projectType: 'Website Maintenance',
    quote: 'We brought Usman in after a plugin update broke our lead forms and tanked mobile Core Web Vitals. He diagnosed the root conflict within hours, set up staging backups, and keeps our platform running fast every month.',
    rating: 5,
    createdAt: '2026-10-25T18:30:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-18',
    name: 'Omar Al-Sabah',
    role: 'Director of Hospitality',
    location: 'Kuwait City, Kuwait',
    flag: '🇰🇼',
    projectType: 'Graphic Design',
    quote: 'Complete brand identity, packaging guidelines, and social media visual kit delivered with refined taste. Vector files, print-ready CMYK exports, and typography specs were organized cleanly for our internal team.',
    rating: 5,
    createdAt: '2026-10-26T12:10:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-19',
    name: 'Henrik Lindqvist',
    role: 'Product Architect',
    location: 'Stockholm, Sweden',
    flag: '🇸🇪',
    projectType: '3D Animated Websites',
    quote: 'Impressive spatial storytelling and GSAP scroll choreography for our clean-tech launch page. Compressing our CAD assets into lightweight GLTF models took a bit of back-and-forth, and the final live experience runs effortlessly.',
    rating: 4.5,
    createdAt: '2026-10-27T14:45:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-20',
    name: 'Sofia Navarro',
    role: 'Founder',
    location: 'Madrid, Spain',
    flag: '🇪🇸',
    projectType: 'E-Commerce Development',
    quote: 'Usman rebuilt our WooCommerce cosmetics store with a custom checkout flow and Stripe + regional payment integration. Bounce rates fell within the first two weeks and managing inventory is much simpler now.',
    rating: 5,
    createdAt: '2026-10-28T11:00:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-21',
    name: 'Callum Fraser',
    role: 'Technical Director',
    location: 'Auckland, New Zealand',
    flag: '🇳🇿',
    projectType: 'Website Deployment & Cloud Setup',
    quote: 'Clean production deployment with Cloudflare DNS, WAF protection, automated database snapshots, and SSL configuration. Documentation handed over at the end made it easy for our in-house devs to follow.',
    rating: 5,
    createdAt: '2026-10-29T08:20:00.000Z',
    status: 'approved'
  },
  {
    id: 'rev-22',
    name: 'Nadia Rehman',
    role: 'Brand Marketing Lead',
    location: 'Manchester, United Kingdom',
    flag: '🇬🇧',
    projectType: 'Graphic Design',
    quote: 'From our new geometric logo mark to pitch deck layouts and ad creatives, everything felt cohesive and intentional. Quick communication on WhatsApp and thoughtful design feedback throughout.',
    rating: 4.5,
    createdAt: '2026-10-30T15:35:00.000Z',
    status: 'approved'
  }
];

const SEED_REVIEW_IDS = new Set(INITIAL_REVIEWS.map((r) => r.id));

function getDeletedReviewIds(): Set<string> {
  return new Set(getStored<string[]>(DELETED_REVIEWS_KEY, []));
}

export function getReviews(): ClientReview[] {
  // Sync from server silently without triggering infinite event loops
  if (typeof window !== 'undefined') {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const nextRaw = JSON.stringify(json.data);
          const prevRaw = localStorage.getItem(REVIEWS_KEY);
          if (prevRaw !== nextRaw) {
            setStored(REVIEWS_KEY, json.data);
          }
        }
      })
      .catch(() => {});
  }

  const deletedSet = getDeletedReviewIds();
  let stored = getStored<ClientReview[]>(REVIEWS_KEY, []);
  if (stored.length === 0) {
    // Carry over any custom non-seed reviews created in previous storage versions
    const customLegacy: ClientReview[] = [];
    const seenLegacy = new Set<string>();
    for (const legacyKey of LEGACY_REVIEWS_KEYS) {
      const legacy = getStored<ClientReview[]>(legacyKey, []);
      if (Array.isArray(legacy)) {
        for (const r of legacy) {
          if (r && r.id && !SEED_REVIEW_IDS.has(r.id) && !seenLegacy.has(r.id) && !deletedSet.has(r.id)) {
            seenLegacy.add(r.id);
            customLegacy.push(r);
          }
        }
      }
    }
    stored = [...customLegacy, ...INITIAL_REVIEWS];
  }

  const storedById = new Map<string, ClientReview>();
  const customReviews: ClientReview[] = [];
  for (const r of stored) {
    if (!r || !r.id || deletedSet.has(r.id)) continue;
    storedById.set(r.id, r);
    if (!SEED_REVIEW_IDS.has(r.id)) {
      customReviews.push(r);
    }
  }

  const mergedSeeds = INITIAL_REVIEWS
    .filter((r) => !deletedSet.has(r.id))
    .map((seed) => storedById.get(seed.id) || seed);

  return [...customReviews, ...mergedSeeds];
}

export function saveClientReview(review: Omit<ClientReview, 'id' | 'createdAt' | 'status'>): ClientReview {
  const current = getReviews();
  const newReview: ClientReview = {
    ...review,
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    status: 'pending' // Defaults to pending until approved by admin
  };

  const updated = [newReview, ...current];
  setStored(REVIEWS_KEY, updated);

  fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newReview)
  }).catch((err) => {
    console.warn('Review sync queued locally:', err);
  });

  return newReview;
}

export function updateReviewStatus(id: string, status: 'approved' | 'rejected' | 'pending'): ClientReview[] {
  const current = getReviews();
  const updated = current.map(r => r.id === id ? { ...r, status } : r);
  setStored(REVIEWS_KEY, updated);

  fetch(`/api/reviews/${id}`, {
    method: 'PATCH',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ status })
  }).catch(() => {});

  return updated;
}

export function deleteReview(id: string): ClientReview[] {
  const deletedSet = getDeletedReviewIds();
  deletedSet.add(id);
  setStored(DELETED_REVIEWS_KEY, Array.from(deletedSet));

  const current = getReviews();
  const updated = current.filter(r => r.id !== id);
  setStored(REVIEWS_KEY, updated);

  fetch(`/api/reviews/${id}`, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(false)
  }).catch((err) => {
    console.warn('Review delete sync queued:', err);
  });

  return updated;
}

export function addAdminReview(review: Omit<ClientReview, 'id' | 'createdAt'>): ClientReview {
  const current = getReviews();
  const newReview: ClientReview = {
    ...review,
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  const updated = [newReview, ...current];
  setStored(REVIEWS_KEY, updated);

  fetch('/api/reviews', {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(newReview)
  }).catch(() => {});

  return newReview;
}

// LEADERSHIP TEAM API
export function getLeadershipTeam(): LeadershipMember[] {
  const stored = getStored<LeadershipMember[]>(LEADERSHIP_KEY, LEADERSHIP_TEAM);
  const baseList = (!Array.isArray(stored) || stored.length === 0) ? LEADERSHIP_TEAM : stored;

  return LEADERSHIP_TEAM.map((defaultMember) => {
    const existing = baseList.find((s) => s.id === defaultMember.id);
    if (!existing) return defaultMember;
    const isOldRole =
      existing.role === 'Founder & Lead Architect' ||
      existing.role === 'Founder & Lead Developer' ||
      existing.role === 'VP Client Partnerships' ||
      existing.role === 'VP Partnerships';

    let finalAvatar = defaultMember.avatarUrl;
    if (defaultMember.id === 'leader-1') {
      finalAvatar = '/images/muhammad-usman-afzal.jpg';
      if (existing.avatarUrl && existing.avatarUrl !== '' && !existing.avatarUrl.includes('unsplash') && !existing.avatarUrl.includes('dicebear')) {
        finalAvatar = existing.avatarUrl;
      }
    } else if (defaultMember.id === 'leader-2') {
      finalAvatar = '/images/mudasir.jpg';
      if (existing.avatarUrl && existing.avatarUrl !== '' && !existing.avatarUrl.includes('unsplash') && !existing.avatarUrl.includes('dicebear')) {
        finalAvatar = existing.avatarUrl;
      }
    } else if (defaultMember.id === 'leader-3') {
      finalAvatar = '/images/umar-afzal.jpg';
      if (existing.avatarUrl && existing.avatarUrl !== '' && !existing.avatarUrl.includes('unsplash') && !existing.avatarUrl.includes('dicebear')) {
        finalAvatar = existing.avatarUrl;
      }
    } else {
      finalAvatar = (existing.avatarUrl !== undefined && existing.avatarUrl !== '') ? existing.avatarUrl : defaultMember.avatarUrl;
    }

    return {
      ...defaultMember,
      avatarUrl: finalAvatar,
      name: existing.name || defaultMember.name,
      role: (existing.role && !isOldRole) ? existing.role : defaultMember.role,
      tagline: defaultMember.tagline,
      location: defaultMember.location,
      flag: defaultMember.flag,
      badge: defaultMember.badge,
      instagramUrl: existing.instagramUrl || defaultMember.instagramUrl,
      instagramHandle: existing.instagramHandle || defaultMember.instagramHandle,
      linkedinUrl: existing.linkedinUrl || defaultMember.linkedinUrl
    };
  });
}

export function saveLeadershipMember(member: LeadershipMember): LeadershipMember[] {
  const current = getLeadershipTeam();
  const index = current.findIndex((m) => m.id === member.id);
  let updated: LeadershipMember[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...current[index], ...member };
  } else {
    updated = [...current, member];
  }
  setStored(LEADERSHIP_KEY, updated);
  return updated;
}

export function updateLeadershipImage(id: string, imageUrl: string): LeadershipMember[] {
  const current = getLeadershipTeam();
  const updated = current.map((m) => (m.id === id ? { ...m, avatarUrl: imageUrl } : m));
  setStored(LEADERSHIP_KEY, updated);
  return updated;
}

export function deleteLeadershipImage(id: string): LeadershipMember[] {
  const current = getLeadershipTeam();
  const updated = current.map((m) => (m.id === id ? { ...m, avatarUrl: '' } : m));
  setStored(LEADERSHIP_KEY, updated);
  return updated;
}

// ==========================================
// ORDER AGREEMENTS & PROFORMA INVOICES API
// ==========================================
export const INITIAL_ORDERS: OrderAgreement[] = [
  {
    id: 'ord-2026-009-k4z1',
    orderNumber: 'UDH-ORD-2026-009-K4Z1',
    agreementTitle: 'Commercial Master Services Agreement & Statement of Work (SOW)',
    clientName: 'Tariq Mahmood',
    clientEmail: 'tariq@example.com',
    clientPhone: '+92 300 1234567',
    clientCompany: 'Apex Global Ventures',
    service: 'Web Development',
    serviceCategory: 'Business Websites',
    projectTitle: 'Custom High-Performance Enterprise Platform',
    scopeDescription: 'Custom interactive UI/UX architecture, full-stack API integration & cloud deployment, and 30-day technical SLA warranty.',
    deliverables: [
      'Custom interactive UI/UX architecture',
      'Full-stack API integration & cloud deployment',
      '30-day technical SLA warranty'
    ],
    techStack: [
      'React',
      'TypeScript',
      'Tailwind CSS',
      'Node.js'
    ],
    timeline: '14 Business Days',
    confirmedPrice: 2500,
    currency: 'USD',
    advancePercentage: 25,
    advanceAmount: 625,
    paidAmount: 625,
    balanceAmount: 1875,
    selectedMilestoneStage: 'stage_1',
    referralToken: 'UDH-PART-882X',
    partnerName: 'Bilal Ahmed',
    commissionPercentage: 20,
    commissionAmount: 500,
    status: 'confirmed',
    paymentTerms: '3-Stage Milestone Payment Schedule (25% / 35% / 40%)',
    milestones: [
      {
        id: 'ms-1',
        title: '1. Start / Kickoff (25%)',
        description: 'Payable upfront to initiate sprint architecture, database schema & UI design.',
        amount: 625,
        percentage: 25,
        status: 'completed',
        stage: 1,
        paid: true,
        paidAt: '2026-10-30T19:33:00.000Z'
      },
      {
        id: 'ms-2',
        title: '2. Mid / Demo (35%)',
        description: 'Payable midway upon interactive prototype demo, walkthrough & feedback.',
        amount: 875,
        percentage: 35,
        status: 'pending',
        stage: 2,
        paid: false
      },
      {
        id: 'ms-3',
        title: '3. Final / Code (40%)',
        description: 'Payable upon live launch, final review & 100% full source code handover.',
        amount: 1000,
        percentage: 40,
        status: 'pending',
        stage: 3,
        paid: false
      }
    ],
    legalTerms: 'Upon final Stage 3 settlement, 100% of all source code, design assets, NDA confidentiality, and production deliverables unconditionally transfer to client ownership. Includes 30 calendar days of post-launch technical warranty & rapid bug-fixing SLA.',
    adminSignatureName: 'Muhammad Usman Afzal',
    adminSignatureDesignation: 'Founder & Principal Creative Technologist',
    themeMode: 'light',
    agreementDate: '2026-10-30',
    createdAt: '2026-10-30T19:33:00.000Z',
    updatedAt: '2026-10-30T19:33:00.000Z',
    confirmedAt: '2026-10-30T19:33:00.000Z'
  }
];

export function generateAgreementPartnerToken(partnerName?: string, excludeTokens: string[] = []): string {
  return generateUniquePartnerToken(partnerName, excludeTokens);
}

function isCleanReferralToken(raw?: string): boolean {
  if (!raw) return false;
  const cleaned = normalizeReferralToken(raw);
  if (!cleaned || cleaned === 'UDH-REF-' || cleaned === 'UDH-' || cleaned === 'NONE' || cleaned === 'DIRECT') {
    return false;
  }
  return cleaned.length >= 4;
}

const ORDER_REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateOrderRefSuffix(length = 4): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ORDER_REF_CHARS.charAt(Math.floor(Math.random() * ORDER_REF_CHARS.length));
  }
  return code;
}

function extractOrderSequenceNumber(orderNumber?: string): number {
  if (!orderNumber) return 0;
  const match = orderNumber.trim().toUpperCase().match(/^UDH-ORD-\d{4}-(\d+)/);
  if (!match) return 0;
  const parsed = parseInt(match[1], 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getIssuedOrdersHistorySet(): Set<string> {
  const stored = getStored<string[]>(ISSUED_ORDERS_HISTORY_KEY, []);
  const set = new Set<string>(stored.map((n) => n.trim().toUpperCase()).filter(Boolean));
  INITIAL_ORDERS.forEach((o) => {
    if (o.orderNumber) set.add(o.orderNumber.trim().toUpperCase());
  });
  return set;
}

function recordIssuedOrderNumbers(numbers: string[]): void {
  if (!numbers.length) return;
  const set = getIssuedOrdersHistorySet();
  let changed = false;
  numbers.forEach((n) => {
    const clean = (n || '').trim().toUpperCase();
    if (clean && !set.has(clean)) {
      set.add(clean);
      changed = true;
    }
  });
  if (changed) {
    try {
      localStorage.setItem(ISSUED_ORDERS_HISTORY_KEY, JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  }
}

function getDeletedOrderIdsSet(): Set<string> {
  const list = getStored<string[]>(DELETED_ORDERS_KEY, []);
  return new Set(list.filter(Boolean));
}

function addDeletedOrderIds(ids: string[]): void {
  if (!ids.length) return;
  const set = getDeletedOrderIdsSet();
  ids.forEach((id) => {
    if (id) set.add(id);
  });
  try {
    localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export function generateNextOrderNumber(excludeOrderNumbers: string[] = []): string {
  const storedOrders = getStored<OrderAgreement[]>(ORDERS_KEY, INITIAL_ORDERS);
  const year = new Date().getFullYear();
  const issuedHistory = getIssuedOrdersHistorySet();
  const usedSet = new Set<string>(issuedHistory);
  let maxSeq = 0;

  try {
    const persistedSeq = parseInt(localStorage.getItem(ORDERS_SEQ_KEY) || '0', 10);
    if (!Number.isNaN(persistedSeq) && persistedSeq > maxSeq) {
      maxSeq = persistedSeq;
    }
  } catch {
    // ignore storage read error
  }

  for (const histNo of issuedHistory) {
    const seq = extractOrderSequenceNumber(histNo);
    if (seq > maxSeq) maxSeq = seq;
  }

  for (const o of storedOrders) {
    if (o.orderNumber) {
      const upper = o.orderNumber.trim().toUpperCase();
      usedSet.add(upper);
      const seq = extractOrderSequenceNumber(upper);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  for (const ex of excludeOrderNumbers) {
    if (ex) {
      const upper = ex.trim().toUpperCase();
      usedSet.add(upper);
      const seq = extractOrderSequenceNumber(upper);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  let nextSeqNum = maxSeq + 1;
  let candidate = `UDH-ORD-${year}-${String(nextSeqNum).padStart(3, '0')}-${generateOrderRefSuffix(4)}`;
  while (usedSet.has(candidate)) {
    nextSeqNum += 1;
    candidate = `UDH-ORD-${year}-${String(nextSeqNum).padStart(3, '0')}-${generateOrderRefSuffix(4)}`;
  }

  try {
    localStorage.setItem(ORDERS_SEQ_KEY, String(nextSeqNum));
  } catch {
    // ignore storage write error
  }
  recordIssuedOrderNumbers([candidate]);

  return candidate;
}

export function findOrderByReferenceNumber(orderNumber?: string, excludeOrderId?: string): OrderAgreement | undefined {
  if (!orderNumber || !orderNumber.trim()) return undefined;
  const target = orderNumber.trim().toUpperCase();
  const storedOrders = getStored<OrderAgreement[]>(ORDERS_KEY, INITIAL_ORDERS);
  return storedOrders.find(
    (o) => o.id !== excludeOrderId && (o.orderNumber || '').trim().toUpperCase() === target
  );
}

export function ensureUniqueOrderNumber(
  candidate: string | undefined,
  orderId: string,
  existingOrders?: OrderAgreement[]
): string {
  const list = existingOrders || getStored<OrderAgreement[]>(ORDERS_KEY, INITIAL_ORDERS);
  const cleanCandidate = (candidate || '').trim().toUpperCase();
  const allExistingNumbers = list.map((o) => o.orderNumber).filter(Boolean);

  if (!cleanCandidate) {
    return generateNextOrderNumber(allExistingNumbers);
  }

  const collidesWithAnotherOrder = list.some(
    (o) => o.id !== orderId && (o.orderNumber || '').trim().toUpperCase() === cleanCandidate
  );

  if (collidesWithAnotherOrder) {
    return generateNextOrderNumber([...allExistingNumbers, cleanCandidate]);
  }

  recordIssuedOrderNumbers([cleanCandidate]);
  return cleanCandidate;
}

function sortAndCapOrdersRolling100(ordersList: OrderAgreement[]): {
  capped: OrderAgreement[];
  evicted: OrderAgreement[];
} {
  const sorted = [...ordersList].sort((a, b) => {
    const tA = Date.parse(a.createdAt || '') || 0;
    const tB = Date.parse(b.createdAt || '') || 0;
    return tB - tA;
  });

  recordIssuedOrderNumbers(sorted.map((o) => o.orderNumber));

  // Permanent Storage: All orders and agreement reference numbers are preserved indefinitely.
  // No automatic deletion ever occurs at 100 or beyond; only manual admin deletion.
  return { capped: sorted, evicted: [] };
}

export function getOrderAgreements(): OrderAgreement[] {
  if (!getAdminAuthStatus()) {
    return [];
  }

  const deletedOrderIds = getDeletedOrderIdsSet();
  const rawList = getStored<OrderAgreement[]>(ORDERS_KEY, INITIAL_ORDERS).filter(
    (o) => o && o.id && !deletedOrderIds.has(o.id)
  );
  const seenOrderNos = new Set<string>();
  let needsDedupPersist = false;

  const normalizedList = rawList.map((o) => {
    const normSrv = normalizeHomeServiceName(o.service);
    const confPrice = o.confirmedPrice || 0;
    const resolved = resolveOrderMilestones(o);
    const ms: OrderMilestone[] = [
      {
        id: o.milestones?.[0]?.id || 'ms-1',
        title: `Stage 1: Kickoff Deposit (${resolved.pct1}%)`,
        description: `${resolved.pct1}% advance kickoff deposit to initiate architecture setup, design systems, and sprint engineering.`,
        deliverableDate: 'Phase 1 (Kickoff)',
        amount: resolved.amt1,
        percentage: resolved.pct1,
        status: resolved.stage1Paid ? 'completed' : 'pending'
      },
      {
        id: o.milestones?.[1]?.id || 'ms-2',
        title: `Stage 2: Mid Demo & Review (${resolved.pct2}%)`,
        description: `${resolved.pct2}% midway milestone upon interactive prototype demonstration, core features walkthrough, and client refinements review.`,
        deliverableDate: 'Phase 2 (Mid Demo)',
        amount: resolved.amt2,
        percentage: resolved.pct2,
        status: resolved.stage2Paid ? 'completed' : 'pending'
      },
      {
        id: o.milestones?.[2]?.id || 'ms-3',
        title: `Stage 3: Code Delivery & Production Launch (${resolved.pct3}%)`,
        description: `${resolved.pct3}% final clearance payment upon live deployment signoff and 100% full source code delivery & IP handoff.`,
        deliverableDate: 'Phase 3 (Code Delivery)',
        amount: resolved.amt3,
        percentage: resolved.pct3,
        status: resolved.stage3Paid ? 'completed' : 'pending'
      }
    ];

    // Guarantee 100% unique Agreement Reference No. per agreement
    const rawOrderNo = (o.orderNumber || '').trim().toUpperCase();
    let ensuredOrderNo = rawOrderNo;
    if (!ensuredOrderNo || seenOrderNos.has(ensuredOrderNo)) {
      ensuredOrderNo = generateNextOrderNumber(Array.from(seenOrderNos));
      needsDedupPersist = true;
    }
    seenOrderNos.add(ensuredOrderNo);

    // Strict Token Rule: Only agreements WITH a valid reference have a token; agreements without reference have NO token
    const hasRef = isCleanReferralToken(o.referralToken);
    const cleanRefToken = hasRef ? normalizeReferralToken(o.referralToken!) : '';

    const rest = { ...(o as OrderAgreement & { securityCode?: string }) };
    delete rest.securityCode;

    const cleanDeliverables = (o.deliverables || []).map((d) =>
      d.replace(/blender/gi, 'Cinema 4D').replace(/\.blend/gi, '.c4d')
    );
    const cleanScope = (o.scopeDescription || '')
      .replace(/blender/gi, 'Cinema 4D')
      .replace(/\.blend/gi, '.c4d');

    return {
      ...rest,
      orderNumber: ensuredOrderNo,
      referralToken: cleanRefToken,
      partnerName: hasRef ? (o.partnerName || '') : '',
      commissionPercentage: hasRef ? (o.commissionPercentage || 20) : 0,
      commissionAmount: hasRef ? (o.commissionAmount ?? Math.round((confPrice * (o.commissionPercentage || 20)) / 100)) : 0,
      agreementDate: o.agreementDate || (o.createdAt ? o.createdAt.slice(0, 10) : '2026-10-26'),
      service: normSrv,
      serviceCategory: o.serviceCategory || (normSrv === '3D Animated Websites' ? 'Interactive 3D Product Experiences' : (normSrv === 'Web Development' ? 'Business Websites' : 'Standard Custom Architecture')),
      scopeDescription: cleanScope,
      deliverables: cleanDeliverables,
      advancePercentage: resolved.pct1,
      advanceAmount: resolved.amt1,
      paidAmount: resolved.paidAmt,
      balanceAmount: resolved.remainingAmt,
      selectedMilestoneStage: resolved.selectedStage,
      paymentTerms:
        o.paymentTerms && o.paymentTerms.includes(`${resolved.pct1}% / ${resolved.pct2}% / ${resolved.pct3}%`)
          ? o.paymentTerms
          : `3-Stage Milestone Plan (${resolved.pct1}% / ${resolved.pct2}% / ${resolved.pct3}%): ${resolved.pct1}% advance kickoff deposit to initiate engineering; ${resolved.pct2}% midway upon core prototype demo & review; remaining ${resolved.pct3}% final balance payable upon live deployment and 100% full source code delivery & IP handoff.`,
      milestones: ms
    };
  });

  const { capped: local, evicted } = sortAndCapOrdersRolling100(normalizedList);
  if (needsDedupPersist || evicted.length > 0) {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(local));
    } catch {
      // ignore storage write error
    }
  }

  // Asynchronously fetch latest from backend (Admin-Protected)
  if (typeof window !== 'undefined' && getAdminAuthStatus()) {
    fetch('/api/orders', {
      headers: getAdminAuthHeaders(false)
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((resJson) => {
        if (resJson?.meta) {
          if (Array.isArray(resJson.meta.issuedOrderNumbers)) {
            recordIssuedOrderNumbers(resJson.meta.issuedOrderNumbers);
          }
          if (Array.isArray(resJson.meta.deletedOrderIds)) {
            addDeletedOrderIds(resJson.meta.deletedOrderIds);
          }
          if (typeof resJson.meta.lastOrderSeq === 'number') {
            try {
              const cur = parseInt(localStorage.getItem(ORDERS_SEQ_KEY) || '0', 10) || 0;
              if (resJson.meta.lastOrderSeq > cur) {
                localStorage.setItem(ORDERS_SEQ_KEY, String(resJson.meta.lastOrderSeq));
              }
            } catch {
              // ignore
            }
          }
        }

        const serverOrders: OrderAgreement[] = Array.isArray(resJson?.data)
          ? resJson.data
          : Array.isArray(resJson)
          ? resJson
          : [];
        if (serverOrders.length > 0) {
          const latestDeleted = getDeletedOrderIdsSet();
          const mergedMap = new Map<string, OrderAgreement>();
          local.forEach((o) => {
            if (!latestDeleted.has(o.id)) mergedMap.set(o.id, o);
          });
          serverOrders.forEach((rawOrder: OrderAgreement & { securityCode?: string }) => {
            if (!rawOrder.id || latestDeleted.has(rawOrder.id)) return;
            const existingLocal = mergedMap.get(rawOrder.id);
            const normSrv = normalizeHomeServiceName(rawOrder.service);
            const hasRef = isCleanReferralToken(rawOrder.referralToken);
            const cleanRest = { ...existingLocal, ...rawOrder } as OrderAgreement & { securityCode?: string };
            delete cleanRest.securityCode;
            const o: OrderAgreement = {
              ...cleanRest,
              orderNumber: (rawOrder.orderNumber || existingLocal?.orderNumber || '').trim().toUpperCase(),
              referralToken: hasRef ? normalizeReferralToken(rawOrder.referralToken!) : '',
              partnerName: hasRef ? (rawOrder.partnerName || '') : '',
              commissionPercentage: hasRef ? (rawOrder.commissionPercentage || 20) : 0,
              commissionAmount: hasRef ? (rawOrder.commissionAmount || 0) : 0,
              service: normSrv,
              serviceCategory: rawOrder.serviceCategory || existingLocal?.serviceCategory || (normSrv === '3D Animated Websites' ? 'Interactive 3D Product Experiences' : (normSrv === 'Web Development' ? 'Business Websites' : 'Standard Custom Architecture'))
            };
            mergedMap.set(o.id, o);
          });
          const mergedSeen = new Set<string>();
          const mergedUnsorted = Array.from(mergedMap.values()).map((ord) => {
            let num = (ord.orderNumber || '').trim().toUpperCase();
            if (!num || mergedSeen.has(num)) {
              num = generateNextOrderNumber(Array.from(mergedSeen));
            }
            mergedSeen.add(num);
            return { ...ord, orderNumber: num };
          });
          const { capped: merged } = sortAndCapOrdersRolling100(mergedUnsorted);
          const prevRaw = localStorage.getItem(ORDERS_KEY);
          const nextRaw = JSON.stringify(merged);
          if (prevRaw !== nextRaw) {
            localStorage.setItem(ORDERS_KEY, nextRaw);
          }
        }
      })
      .catch(() => {});
  }

  return local;
}

export function getOrderAgreementById(idOrNumber: string): OrderAgreement | undefined {
  const orders = getOrderAgreements();
  const rawSearch = idOrNumber.trim().toLowerCase();
  if (!rawSearch) return undefined;
  const cleanCode = rawSearch.replace(/^#/, '');

  const exact = orders.find(
    (o) =>
      o.id.toLowerCase() === rawSearch ||
      o.orderNumber.toLowerCase() === rawSearch ||
      o.orderNumber.toLowerCase() === cleanCode
  );
  if (exact) return exact;

  // Fallback for legacy prefix links (e.g. UDH-ORD-2026-001 matching UDH-ORD-2026-001-7K4X)
  return orders.find((o) => o.orderNumber.toLowerCase().startsWith(`${cleanCode}-`));
}

/**
 * Ensures any Partner Token used on a Referred Agreement is also registered in Admin's Partner Tokens list
 * (subject to the 100-item FIFO rolling cap) so the Admin Token PDF list is always 100% complete.
 */
function ensurePartnerTokenListedForAgreement(
  cleanToken: string,
  partnerName?: string,
  createdAt?: string
): void {
  if (!cleanToken) return;
  recordIssuedPartnerTokens([cleanToken]);
  const currentPartners = mergeAndSortPartnerTokens(getStored<PartnerToken[]>(PARTNERS_KEY, INITIAL_PARTNERS));
  const exists = currentPartners.some((p) => normalizeReferralToken(p.token) === cleanToken);
  if (exists) return;

  const autoPartner: PartnerToken = normalizePartnerRecord({
    id: `pt-agr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    token: cleanToken,
    partnerName: (partnerName || '').trim() || 'Referral Partner',
    partnerEmail: 'hello@usmandevhub.com',
    payoutMethod: 'Remitly / Wise / Bank Transfer',
    createdAt: createdAt || new Date().toISOString()
  });

  const nextPartners = mergeAndSortPartnerTokens([autoPartner, ...currentPartners]);
  pendingPartnerMutations += 1;
  setStored(PARTNERS_KEY, nextPartners);
  fetch('/api/partners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(autoPartner)
  })
    .catch(() => {})
    .finally(() => {
      pendingPartnerMutations = Math.max(0, pendingPartnerMutations - 1);
    });
}

export function saveAndReturnOrderAgreement(order: OrderAgreement): {
  savedOrder: OrderAgreement;
  updatedOrders: OrderAgreement[];
} {
  const current = getOrderAgreements();
  const ensuredId = (order.id && order.id.trim()) ? order.id.trim() : `ord-${Date.now()}`;

  // Guarantee 100% unique Agreement Reference No. across all other clients/agreements and lifetime history
  const ensuredOrderNo = ensureUniqueOrderNumber(order.orderNumber, ensuredId, current);

  // Strict Token Rule: Reference agreements keep their Partner Token; non-reference agreements have NO token
  const hasRef = isCleanReferralToken(order.referralToken);
  const cleanToken = hasRef ? normalizeReferralToken(order.referralToken!) : '';
  const pct = hasRef ? (order.commissionPercentage || 20) : 0;
  const commAmt = hasRef
    ? (order.commissionAmount !== undefined ? order.commissionAmount : Math.round(((order.confirmedPrice || 0) * pct) / 100))
    : 0;

  const rest = { ...(order as OrderAgreement & { securityCode?: string }) };
  delete rest.securityCode;

  const resolvedSplit = resolveOrderMilestones(order);
  const nowIso = new Date().toISOString();
  const sanitizedOrder: OrderAgreement = {
    ...rest,
    id: ensuredId,
    orderNumber: ensuredOrderNo,
    advancePercentage: resolvedSplit.pct1,
    advanceAmount: resolvedSplit.amt1,
    paidAmount: resolvedSplit.paidAmt,
    balanceAmount: resolvedSplit.remainingAmt,
    selectedMilestoneStage: resolvedSplit.selectedStage,
    referralToken: cleanToken,
    partnerName: hasRef ? (order.partnerName || '').trim() : '',
    commissionPercentage: pct,
    commissionAmount: commAmt,
    createdAt: order.createdAt || nowIso,
    updatedAt: nowIso
  };

  if (hasRef && cleanToken) {
    ensurePartnerTokenListedForAgreement(cleanToken, sanitizedOrder.partnerName, sanitizedOrder.createdAt);

    // Sync Agreement directly into Partner Referral Track Status so both Admin Panel and Partner "2. Track Status" update immediately
    const partnerMeta = lookupPartnerByToken(cleanToken);
    const currentRefs = getStored<ReferralRecord[]>(REFERRALS_KEY, INITIAL_REFERRALS);
    const stageKey: PaidMilestoneStage = resolvedSplit.selectedStage;
    const mappedRefStatus: ReferralRecord['status'] =
      sanitizedOrder.status === 'draft' || sanitizedOrder.status === 'pending_confirmation'
        ? 'in_negotiation'
        : stageKey === 'stage_3'
        ? 'milestone_40'
        : stageKey === 'stage_2'
        ? 'milestone_35'
        : stageKey === 'stage_1'
        ? 'milestone_25'
        : 'deal_complete';
    const calcCommission = sanitizedOrder.commissionAmount || Math.round((sanitizedOrder.confirmedPrice || 0) * 0.2);

    let refIdx = currentRefs.findIndex(
      (r) =>
        normalizeReferralToken(r.partnerToken || '') === cleanToken &&
        (r.orderNumber === sanitizedOrder.orderNumber ||
          (sanitizedOrder.inquiryId && r.inquiryId === sanitizedOrder.inquiryId) ||
          (sanitizedOrder.clientEmail &&
            r.clientEmail &&
            r.clientEmail.toLowerCase() === sanitizedOrder.clientEmail.toLowerCase()) ||
          (sanitizedOrder.clientName &&
            r.clientName.toLowerCase() === sanitizedOrder.clientName.toLowerCase()))
    );
    if (refIdx < 0) {
      const singleTokenMatch = currentRefs
        .map((r, idx) => ({ r, idx }))
        .filter((item) => normalizeReferralToken(item.r.partnerToken || '') === cleanToken);
      if (singleTokenMatch.length === 1) {
        refIdx = singleTokenMatch[0].idx;
      }
    }

    const defaultAgreementStatusNote = `Official Agreement ${sanitizedOrder.orderNumber} issued (${sanitizedOrder.currency} ${(sanitizedOrder.confirmedPrice || 0).toLocaleString()}).`;

    if (refIdx >= 0) {
      const prev = currentRefs[refIdx];
      const updatedRefRecord: ReferralRecord = {
        ...prev,
        partnerName: sanitizedOrder.partnerName || partnerMeta?.partnerName || prev.partnerName,
        partnerEmail: partnerMeta?.partnerEmail || prev.partnerEmail,
        partnerWhatsApp: partnerMeta?.partnerWhatsApp || prev.partnerWhatsApp,
        payoutMethod: partnerMeta?.payoutMethod || prev.payoutMethod,
        clientName: sanitizedOrder.clientName || prev.clientName || 'Client',
        clientEmail: sanitizedOrder.clientEmail || prev.clientEmail,
        clientCompany: sanitizedOrder.clientCompany || prev.clientCompany,
        projectType: sanitizedOrder.service || prev.projectType,
        estimatedBudget: sanitizedOrder.confirmedPrice || prev.estimatedBudget,
        commissionAmount: calcCommission,
        orderNumber: sanitizedOrder.orderNumber,
        milestone25Paid: resolvedSplit.stage1Paid,
        milestone35Paid: resolvedSplit.stage2Paid,
        milestone40Paid: resolvedSplit.stage3Paid,
        status: prev.status === 'commission_paid' ? 'commission_paid' : mappedRefStatus,
        adminStatusNote:
          prev.adminStatusNote && !prev.adminStatusNote.startsWith('Official Agreement ')
            ? prev.adminStatusNote
            : defaultAgreementStatusNote
      };
      const nextRefs = [...currentRefs];
      nextRefs[refIdx] = updatedRefRecord;
      pendingReferralMutations += 1;
      setStored(REFERRALS_KEY, nextRefs);
      fetch('/api/referrals', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(updatedRefRecord)
      })
        .catch(() => {})
        .finally(() => {
          pendingReferralMutations = Math.max(0, pendingReferralMutations - 1);
        });
    } else {
      const createdRef: ReferralRecord = {
        id: `ref-ord-${sanitizedOrder.id}`,
        partnerToken: cleanToken,
        partnerName: sanitizedOrder.partnerName || partnerMeta?.partnerName || `Partner (${cleanToken})`,
        partnerEmail: partnerMeta?.partnerEmail || `token-${cleanToken.toLowerCase()}@partner.usmandevhub.com`,
        partnerWhatsApp: partnerMeta?.partnerWhatsApp,
        payoutMethod: partnerMeta?.payoutMethod || 'Remitly / Wise / Bank Transfer',
        clientName: sanitizedOrder.clientName || 'Client',
        clientEmail: sanitizedOrder.clientEmail || undefined,
        clientCompany: sanitizedOrder.clientCompany || undefined,
        projectType: sanitizedOrder.service || 'Custom Engineering',
        estimatedBudget: sanitizedOrder.confirmedPrice || 0,
        commissionAmount: calcCommission,
        milestone25Paid: resolvedSplit.stage1Paid,
        milestone35Paid: resolvedSplit.stage2Paid,
        milestone40Paid: resolvedSplit.stage3Paid,
        status: mappedRefStatus,
        source: 'order_agreement',
        date: (sanitizedOrder.agreementDate || sanitizedOrder.createdAt || nowIso).slice(0, 10),
        submittedAt: sanitizedOrder.createdAt || nowIso,
        inquiryId: sanitizedOrder.inquiryId,
        orderNumber: sanitizedOrder.orderNumber,
        clientMessage: sanitizedOrder.scopeDescription || undefined,
        notes: `Synced from Official Agreement ${sanitizedOrder.orderNumber}.`,
        adminStatusNote: defaultAgreementStatusNote
      };
      pendingReferralMutations += 1;
      setStored(REFERRALS_KEY, [createdRef, ...currentRefs]);
      fetch('/api/referrals', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(createdRef)
      })
        .catch(() => {})
        .finally(() => {
          pendingReferralMutations = Math.max(0, pendingReferralMutations - 1);
        });
    }
  }

  // Match STRICTLY by id so one client's agreement never overwrites another client's agreement
  const index = current.findIndex((o) => o.id === sanitizedOrder.id);
  let mergedList: OrderAgreement[];

  if (index >= 0) {
    mergedList = [...current];
    mergedList[index] = { ...current[index], ...sanitizedOrder };
  } else {
    mergedList = [{ ...sanitizedOrder }, ...current];
  }

  // Save to permanent archive (no auto-deletion at 100 or beyond; manual delete only)
  const { capped: updated } = sortAndCapOrdersRolling100(mergedList);
  setStored(ORDERS_KEY, updated);

  // Sync to server (Admin-authenticated)
  fetch('/api/orders', {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(sanitizedOrder)
  }).catch(() => {});

  return { savedOrder: sanitizedOrder, updatedOrders: updated };
}

export function saveOrderAgreement(order: OrderAgreement): OrderAgreement[] {
  return saveAndReturnOrderAgreement(order).updatedOrders;
}

export function deleteOrderAgreement(id: string): OrderAgreement[] {
  const cleanId = (id || '').trim();
  const current = getOrderAgreements();
  const target = current.find((o) => o.id === cleanId || o.orderNumber === cleanId);
  const realId = target ? target.id : cleanId;
  if (target) {
    recordIssuedOrderNumbers([target.orderNumber]);
    const autoRefId = `ref-ord-${target.id}`;
    const existingRefs = getStored<ReferralRecord[]>(REFERRALS_KEY, []);
    if (existingRefs.some((r) => r.id === autoRefId)) {
      deleteReferralRecord(autoRefId);
    }
  }
  addDeletedOrderIds([realId]);
  if (target && target.orderNumber) {
    addDeletedOrderIds([target.orderNumber]);
  }

  const updated = current.filter((o) => o.id !== realId && o.orderNumber !== cleanId);
  setStored(ORDERS_KEY, updated);

  fetch(`/api/orders/${encodeURIComponent(realId)}`, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(false)
  }).catch(() => {});

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('usman_agency_data_updated'));
  }

  return updated;
}

