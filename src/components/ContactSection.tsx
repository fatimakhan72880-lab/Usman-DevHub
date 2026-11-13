import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  DollarSign,
  MessageCircle,
  KeyRound,
  X,
  Mail,
  ChevronDown,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  addContactMessage,
  sendContactMessageToBackend,
  addReferral,
  getServices,
  getActiveReferredByToken,
  setActiveReferredByToken,
  lookupPartnerByToken,
  normalizeReferralToken
} from '../services/storageService';
import { INITIAL_SERVICES } from '../data/initialData';
import { Service } from '../types';

interface ContactSectionProps {
  initialServicePreset?: string;
  initialCategoryPreset?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  initialServicePreset,
  initialCategoryPreset,
}) => {
  // Load active services directly from the studio services catalog
  const [servicesList, setServicesList] = useState<Service[]>(() => {
    const list = getServices().filter(s => s.status === 'active');
    return (list.length > 0 ? list : INITIAL_SERVICES).sort((a, b) => a.order - b.order);
  });

  useEffect(() => {
    const handleUpdate = () => {
      const list = getServices().filter(s => s.status === 'active');
      setServicesList((list.length > 0 ? list : INITIAL_SERVICES).sort((a, b) => a.order - b.order));
    };
    window.addEventListener('usman_agency_data_updated', handleUpdate);
    return () => window.removeEventListener('usman_agency_data_updated', handleUpdate);
  }, []);

  // Strict mapping: Each service maps ONLY to its exact subcategories from the service catalog - strictly no extra categories
  const serviceCategoriesMap: Record<string, string[]> = useMemo(() => {
    const map: Record<string, string[]> = {};
    // Seed with canonical INITIAL_SERVICES first
    INITIAL_SERVICES.forEach(s => {
      const clean = s.title.replace(/^\d+[\.\s\-]+/, '').trim();
      if (clean && Array.isArray(s.subcategories)) {
        map[clean] = [...s.subcategories];
        map[s.title] = [...s.subcategories];
      }
    });
    // Layer active services from storage
    servicesList.forEach(s => {
      const clean = s.title.replace(/^\d+[\.\s\-]+/, '').trim();
      if (clean && Array.isArray(s.subcategories) && s.subcategories.length > 0) {
        map[clean] = [...s.subcategories];
        map[s.title] = [...s.subcategories];
      }
    });
    // Guarantee Website Maintenance subcategories
    if (!map['Website Maintenance'] || map['Website Maintenance'].length === 0) {
      map['Website Maintenance'] = ['Bug Fixing', 'Updates', 'Performance Optimization'];
    }
    return map;
  }, [servicesList]);

  // Only the active services from the studio service list (strictly no arbitrary extra services)
  const serviceOptions = useMemo(() => {
    return servicesList.map(s => s.title);
  }, [servicesList]);

  // Contact Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState<string>(() => {
    if (initialCategoryPreset) {
      for (const [srvTitle, cats] of Object.entries(serviceCategoriesMap)) {
        if (cats.some(c => c.toLowerCase() === initialCategoryPreset.toLowerCase())) {
          return srvTitle;
        }
      }
    }
    if (initialServicePreset) {
      const match = servicesList.find(s =>
        s.title.toLowerCase() === initialServicePreset.toLowerCase() ||
        s.title.toLowerCase().includes(initialServicePreset.toLowerCase())
      );
      if (match) return match.title;
      for (const [srvTitle, cats] of Object.entries(serviceCategoriesMap)) {
        if (cats.some(c => c.toLowerCase() === initialServicePreset.toLowerCase())) {
          return srvTitle;
        }
      }
    }
    return servicesList[0]?.title || 'Web Development';
  });

  const [category, setCategory] = useState<string>(() => {
    if (initialCategoryPreset) {
      return initialCategoryPreset;
    }
    if (initialServicePreset) {
      for (const cats of Object.values(serviceCategoriesMap)) {
        const foundCat = cats.find(c => c.toLowerCase() === initialServicePreset.toLowerCase());
        if (foundCat) return foundCat;
      }
    }
    const activeServiceTitle = servicesList[0]?.title || 'Web Development';
    const available = serviceCategoriesMap[activeServiceTitle] || [];
    return available[0] || 'Business Websites';
  });

  const [budget, setBudget] = useState('');
  const [preferredTech, setPreferredTech] = useState<string>('Custom Code');
  const [message, setMessage] = useState('');
  const [referralCode, setReferralCode] = useState<string>(() => getActiveReferredByToken());
  const [isAutoReferred, setIsAutoReferred] = useState<boolean>(() => Boolean(getActiveReferredByToken()));
  const [isEditingRefCode, setIsEditingRefCode] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState('');
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<'idle' | 'sending' | 'sent' | 'needs_activation'>('idle');
  const [lastSubmittedSummary, setLastSubmittedSummary] = useState<{
    name: string;
    email: string;
    service: string;
    gmailUrl: string;
    waUrl: string;
  } | null>(null);

  const [partnerSyncTick, setPartnerSyncTick] = useState(0);

  // Dropdown open states & refs for custom inline dropdowns (avoids mobile OS full-screen select dialogs)
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(target)) {
        setIsServiceOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Relay inquiry through unified backend endpoint with canonical origin
  const dispatchEmailViaBackend = async (payload: any): Promise<void> => {
    try {
      const res = await sendContactMessageToBackend(payload);
      if (res?.emailDeliveryStatus === 'needs_activation') {
        setEmailDeliveryStatus('needs_activation');
      } else {
        setEmailDeliveryStatus('sent');
      }
    } catch {
      setEmailDeliveryStatus('sent');
    }
  };

  // Sync referral token & partner lookup if visitor generated a token or arrived via ?ref=UDH-...
  useEffect(() => {
    const syncRef = () => {
      const storedRef = getActiveReferredByToken();
      if (storedRef) {
        setReferralCode(storedRef);
        setIsAutoReferred(true);
        const pt = lookupPartnerByToken(storedRef);
        if (pt?.targetService) {
          setService(pt.targetService);
          const available = serviceCategoriesMap[pt.targetService] || [];
          if (pt.targetCategory && (available.includes(pt.targetCategory) || available.length === 0)) {
            setCategory(pt.targetCategory);
          } else if (available.length > 0) {
            setCategory(available[0]);
          }
        }
      }
      setPartnerSyncTick((t) => t + 1);
    };

    const handlePresetEvent = (e: any) => {
      const { service: newSrv, category: newCat } = e.detail || {};
      if (newSrv) {
        setService(newSrv);
        const available = serviceCategoriesMap[newSrv] || [];
        if (newCat && (available.includes(newCat) || available.length === 0)) {
          setCategory(newCat);
        } else if (available.length > 0) {
          setCategory(available[0]);
        }
      } else if (newCat) {
        setCategory(newCat);
      }
    };

    window.addEventListener('usman_agency_data_updated', syncRef);
    window.addEventListener('usman_set_contact_preset', handlePresetEvent);
    return () => {
      window.removeEventListener('usman_agency_data_updated', syncRef);
      window.removeEventListener('usman_set_contact_preset', handlePresetEvent);
    };
  }, [serviceCategoriesMap]);

  const normalizedRefToken = useMemo(() => normalizeReferralToken(referralCode), [referralCode]);
  const matchedPartner = useMemo(
    () => (normalizedRefToken ? lookupPartnerByToken(normalizedRefToken) : undefined),
    [normalizedRefToken, partnerSyncTick]
  );

  const parseNumericBudget = (raw: string): number => {
    if (!raw || !raw.trim()) return 1000;
    const cleaned = raw.replace(/,/g, '');
    const match = cleaned.match(/\d+(\.\d+)?/);
    if (!match) return 1000;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
  };

  const enteredBudgetMilestones = useMemo(() => {
    if (!budget || !budget.trim()) return null;
    const cleaned = budget.replace(/,/g, '');
    const match = cleaned.match(/\d+(\.\d+)?/);
    if (!match) return null;
    const total = Math.round(Number(match[0]));
    if (!Number.isFinite(total) || total <= 0) return null;
    const start25 = Math.round(total * 0.25);
    const mid35 = Math.round(total * 0.35);
    const final40 = total - start25 - mid35;
    return { total, start25, mid35, final40, hasPlus: budget.includes('+') };
  }, [budget]);

  // Sync category strictly when service changes
  const handleServiceChange = (newService: string) => {
    setService(newService);
    const availableCategories = serviceCategoriesMap[newService] || [];
    if (availableCategories.length > 0) {
      setCategory(availableCategories[0]);
    } else {
      setCategory('');
    }
  };

  useEffect(() => {
    let targetService = '';
    let targetCategory = '';

    if (initialCategoryPreset) {
      targetCategory = initialCategoryPreset;
      if (initialServicePreset) {
        const match = servicesList.find(
          (s) =>
            s.title.toLowerCase() === initialServicePreset.toLowerCase() ||
            s.title.toLowerCase().includes(initialServicePreset.toLowerCase())
        );
        if (match) targetService = match.title;
      }
      if (!targetService) {
        for (const [srvTitle, cats] of Object.entries(serviceCategoriesMap)) {
          if (cats.some(c => c.toLowerCase() === initialCategoryPreset.toLowerCase())) {
            targetService = srvTitle;
            break;
          }
        }
      }
    } else if (initialServicePreset) {
      if (initialServicePreset.includes(' - ') || initialServicePreset.includes('(')) {
        const parts = initialServicePreset.split(/ - |\(/);
        const sPart = parts[0].trim();
        const cPart = parts[1]?.replace(/\)/, '').trim();
        const match = servicesList.find((s) => s.title.toLowerCase().includes(sPart.toLowerCase()));
        if (match) {
          targetService = match.title;
          const available = serviceCategoriesMap[match.title] || [];
          const matchedCat = available.find((c) => c.toLowerCase() === cPart?.toLowerCase());
          if (matchedCat) targetCategory = matchedCat;
        }
      } else {
        for (const [srvTitle, cats] of Object.entries(serviceCategoriesMap)) {
          const catMatch = cats.find((c) => c.toLowerCase() === initialServicePreset.toLowerCase());
          if (catMatch) {
            targetService = srvTitle;
            targetCategory = catMatch;
            break;
          }
        }

        if (!targetService) {
          const match = servicesList.find(
            (s) =>
              s.title.toLowerCase() === initialServicePreset.toLowerCase() ||
              s.title.toLowerCase().includes(initialServicePreset.toLowerCase())
          );
          if (match) {
            targetService = match.title;
          }
        }
      }
    }

    if (targetService) {
      setService(targetService);
      const available = serviceCategoriesMap[targetService] || [];
      if (targetCategory && available.some(c => c.toLowerCase().trim() === targetCategory.toLowerCase().trim())) {
        const exactCat = available.find(c => c.toLowerCase().trim() === targetCategory.toLowerCase().trim());
        setCategory(exactCat || targetCategory);
      } else if (targetCategory) {
        setCategory(targetCategory);
      } else if (!category || !available.includes(category)) {
        setCategory(available[0] || '');
      }
    } else if (targetCategory) {
      setCategory(targetCategory);
    }
  }, [initialServicePreset, initialCategoryPreset, servicesList, serviceCategoriesMap]);

  const quickBudgetPresets = [
    '$100',
    '$300',
    '$500',
    '$1,000',
    '$2,500',
    '$5,000',
    '$10,000+',
    'Open to Discussion'
  ];

  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!name.trim()) missing.push('Full Name');
    if (!email.trim()) {
      missing.push('Email Address');
    } else if (!email.includes('@') || !email.includes('.')) {
      missing.push('Valid Email (e.g. name@domain.com)');
    }
    if (!message.trim()) missing.push('Project Requirements & Goals');
    return missing;
  };

  const isNameInvalid = attemptedSubmit && !name.trim();
  const isEmailInvalid = attemptedSubmit && (!email.trim() || !email.includes('@') || !email.includes('.'));
  const isMessageInvalid = attemptedSubmit && !message.trim();

  const validateContactForm = (): boolean => {
    setAttemptedSubmit(true);
    if (!name.trim()) {
      document.getElementById('contact-form-name')?.focus();
      return false;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      document.getElementById('contact-form-email')?.focus();
      return false;
    }
    if (!message.trim()) {
      document.getElementById('contact-form-message')?.focus();
      return false;
    }
    return true;
  };

  const recordPartnerAttributionIfPresent = (channelLabel: string, inquiryId?: string) => {
    if (!normalizedRefToken) return;
    setActiveReferredByToken(normalizedRefToken);
    const resolvedPartner = lookupPartnerByToken(normalizedRefToken) || matchedPartner;
    const cleanBudgetLabel = budget.trim() || 'Open to Discussion';
    addReferral({
      partnerToken: normalizedRefToken,
      partnerName: resolvedPartner?.partnerName || `Partner (${normalizedRefToken})`,
      partnerEmail: resolvedPartner?.partnerEmail || `token-${normalizedRefToken.toLowerCase()}@partner.usmandevhub.com`,
      partnerWhatsApp: resolvedPartner?.partnerWhatsApp,
      payoutMethod: resolvedPartner?.payoutMethod,
      clientName: name.trim(),
      clientEmail: email.trim(),
      service: service,
      category: category,
      preferredTech: preferredTech,
      projectType: category ? `${service} — ${category}` : service,
      estimatedBudget: parseNumericBudget(budget),
      statedBudgetText: cleanBudgetLabel,
      status: 'pending',
      source: 'manual_code',
      submittedAt: new Date().toISOString(),
      inquiryId,
      clientMessage: message.trim(),
      notes: `Client submitted inquiry via ${channelLabel} using Partner Token ${normalizedRefToken} (Service: ${service}${category ? ` · Category: ${category}` : ''} · Stated budget: ${cleanBudgetLabel}).`,
      adminStatusNote: `Client submitted project details for ${service}${category ? ` (${category})` : ''} on your token. Studio is reviewing scope & requirements.`
    });
  };

  const buildGmailComposeUrl = (
    clientName: string,
    clientEmail: string,
    serviceSpec: string,
    tech: string,
    budgetText: string,
    refTok: string,
    reqMessage: string
  ) => {
    const refLine = refTok
      ? `\n• Referral Partner Token: ${refTok}${matchedPartner ? ` (${matchedPartner.partnerName})` : ''}`
      : '';
    const subject = `New Project Inquiry: ${clientName} (${clientEmail}) — ${service}`;
    const body = `Assalam-o-Alaikum Usman DevHub Tech & Creative Studio,\n\nI am contacting you from the website regarding a project proposal:\n\n• Client Name: ${clientName}\n• Client Email: ${clientEmail} (Reply directly to this email)\n• Service Required: ${serviceSpec}\n• Category / Niche: ${category || 'Standard'}\n• Preferred Tech Stack: ${tech}\n• Target Budget: ${budgetText || 'Custom / Flexible'}${refLine}\n\nProject Requirements & Scope:\n${reqMessage}\n\nLooking forward to your proposal and schedule.\n\nBest regards,\n${clientName}\n${clientEmail}`;
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent('hello@usmandevhub.com')}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleGmailDirect = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateContactForm()) return;

    setLoading(true);
    setEmailDeliveryStatus('sending');

    const fullServiceSpecification = category
      ? `${service} — ${category} (${preferredTech})`
      : `${service} (${preferredTech})`;
    const clientName = name.trim();
    const clientEmail = email.trim();
    const currentBudget = budget.trim() ? budget.trim() : 'Custom / Open to discussion';
    const reqMessage = message.trim();

    let createdMsg = null;
    try {
      createdMsg = addContactMessage({
        name: clientName,
        email: clientEmail,
        service: service,
        category: category,
        preferredTech: preferredTech,
        budget: currentBudget,
        referralToken: normalizedRefToken || undefined,
        referredByName: matchedPartner?.partnerName || undefined,
        message: `[Submitted via Direct Gmail]\n• Service: ${service}\n• Category: ${category || 'Standard'}\n• Preferred Technology: ${preferredTech}${normalizedRefToken ? `\n• Referral Token: ${normalizedRefToken}${matchedPartner ? ` (${matchedPartner.partnerName})` : ''}` : ''}\n\n${reqMessage}`
      });
      recordPartnerAttributionIfPresent('Direct Gmail');
    } catch (err) {
      console.error(err);
    }

    if (createdMsg) {
      await dispatchEmailViaBackend(createdMsg);
    }

    const gmailUrl = buildGmailComposeUrl(
      clientName,
      clientEmail,
      fullServiceSpecification,
      preferredTech,
      currentBudget,
      normalizedRefToken,
      reqMessage
    );

    const waText = `Hello Usman DevHub Tech & Creative Studio,\n\nI want to discuss a project:\n• Service: ${fullServiceSpecification}\n• Preferred Tech: ${preferredTech}\n• Name: ${clientName}\n• Email: ${clientEmail}\n• Budget: ${currentBudget}${normalizedRefToken ? `\n• Partner Token: ${normalizedRefToken}` : ''}\n• Requirements: ${reqMessage}`;
    const waUrl = `https://wa.me/923412683864?text=${encodeURIComponent(waText)}`;

    setLastSubmittedEmail(clientEmail);
    setLastSubmittedSummary({
      name: clientName,
      email: clientEmail,
      service: fullServiceSpecification,
      gmailUrl,
      waUrl
    });

    try {
      const a = document.createElement('a');
      a.href = gmailUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // ignore
    }

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }

    setLoading(false);
    setSubmitted(true);
    setAttemptedSubmit(false);
  };

  const handleWhatsAppDirect = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateContactForm()) return;

    const fullServiceSpecification = category
      ? `${service} — ${category} (${preferredTech})`
      : `${service} (${preferredTech})`;
    const clientName = name.trim();
    const clientEmail = email.trim();
    const currentBudget = budget.trim() ? budget.trim() : 'Custom / Open to discussion';
    const reqMessage = message.trim();

    let createdMsg = null;
    try {
      createdMsg = addContactMessage({
        name: clientName,
        email: clientEmail,
        service: service,
        category: category,
        preferredTech: preferredTech,
        budget: currentBudget,
        referralToken: normalizedRefToken || undefined,
        referredByName: matchedPartner?.partnerName || undefined,
        message: `[Submitted via WhatsApp]\n• Service: ${service}\n• Category: ${category || 'Standard'}\n• Client Email: ${clientEmail}\n• Preferred Technology: ${preferredTech}${normalizedRefToken ? `\n• Referral Token: ${normalizedRefToken}${matchedPartner ? ` (${matchedPartner.partnerName})` : ''}` : ''}\n${reqMessage}`
      });
      recordPartnerAttributionIfPresent('WhatsApp Direct');
    } catch (err) {
      console.error(err);
    }

    if (createdMsg) {
      dispatchEmailViaBackend(createdMsg);
    }

    const gmailUrl = buildGmailComposeUrl(
      clientName,
      clientEmail,
      fullServiceSpecification,
      preferredTech,
      currentBudget,
      normalizedRefToken,
      reqMessage
    );

    const refLine = normalizedRefToken
      ? `\n• Partner Token: ${normalizedRefToken}${matchedPartner ? ` (${matchedPartner.partnerName})` : ''}`
      : '';
    const text = `Hello Usman DevHub Tech & Creative Studio,\n\nI want to discuss a project:\n• Service: ${service}\n• Category: ${category || 'Standard'}\n• Preferred Tech: ${preferredTech}\n• Name: ${clientName}\n• Email: ${clientEmail}\n• Budget: ${currentBudget}${refLine}\n• Requirements: ${reqMessage}`;
    const url = `https://wa.me/923412683864?text=${encodeURIComponent(text)}`;

    setLastSubmittedEmail(clientEmail);
    setLastSubmittedSummary({
      name: clientName,
      email: clientEmail,
      service: fullServiceSpecification,
      gmailUrl,
      waUrl: url
    });

    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // ignore
    }
    setSubmitted(true);
    setAttemptedSubmit(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContactForm()) return;

    setLoading(true);
    setEmailDeliveryStatus('sending');

    const fullServiceSpecification = category
      ? `${service} — ${category} (${preferredTech})`
      : `${service} (${preferredTech})`;
    const clientName = name.trim();
    const clientEmail = email.trim();
    const currentBudget = budget.trim() ? budget.trim() : 'Custom / Open to discussion';
    const reqMessage = message.trim();

    let createdMsg = null;
    try {
      createdMsg = addContactMessage({
        name: clientName,
        email: clientEmail,
        service: service,
        category: category,
        preferredTech: preferredTech,
        budget: currentBudget,
        referralToken: normalizedRefToken || undefined,
        referredByName: matchedPartner?.partnerName || undefined,
        message: `• Service: ${service}\n• Category: ${category || 'Standard'}\n• Client Email: ${clientEmail}\n• Preferred Tech: ${preferredTech}${normalizedRefToken ? `\n• Referral Token: ${normalizedRefToken}${matchedPartner ? ` (${matchedPartner.partnerName})` : ''}` : ''}\n\n${reqMessage}`
      });
      recordPartnerAttributionIfPresent('Website Order Form');
    } catch (err) {
      console.error(err);
    }

    if (createdMsg) {
      await dispatchEmailViaBackend(createdMsg);
    }

    const gmailUrl = buildGmailComposeUrl(
      clientName,
      clientEmail,
      fullServiceSpecification,
      preferredTech,
      currentBudget,
      normalizedRefToken,
      reqMessage
    );

    const refLine = normalizedRefToken
      ? `\n• Partner Token: ${normalizedRefToken}${matchedPartner ? ` (${matchedPartner.partnerName})` : ''}`
      : '';
    const waText = `Hello Usman DevHub Tech & Creative Studio,\n\nI want to discuss a project:\n• Service: ${fullServiceSpecification}\n• Preferred Tech: ${preferredTech}\n• Name: ${clientName}\n• Email: ${clientEmail}\n• Budget: ${currentBudget}${refLine}\n• Requirements: ${reqMessage}`;
    const waUrl = `https://wa.me/923412683864?text=${encodeURIComponent(waText)}`;

    setLastSubmittedEmail(clientEmail);
    setLastSubmittedSummary({
      name: clientName,
      email: clientEmail,
      service: fullServiceSpecification,
      gmailUrl,
      waUrl
    });

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }

    setLoading(false);
    setSubmitted(true);
    setName('');
    setEmail('');
    setBudget('');
    setMessage('');
    setAttemptedSubmit(false);
  };

  return (
    <section id="contact" className="relative py-10 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-neutral-200/60">
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Direct Agency Information */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] sm:text-xs font-semibold text-[#1430d8] mb-2 sm:mb-2.5">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Start a Project</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#0e0e0e] tracking-tight leading-snug">
                Let's Build Something Great Together
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Have a web development project, interactive 3D vision, or custom design requirement in mind? Fill out the form or reach out directly.
              </p>

              {/* Direct Official Business Email Card */}
              <div className="mt-3.5 sm:mt-4 p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-blue-50/60 via-white to-neutral-50/90 border border-blue-200/70 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-neutral-500">
                    Official Business Email
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Direct Agency Desk
                  </span>
                </div>
                <a
                  href="mailto:hello@usmandevhub.com"
                  className="group inline-flex items-center gap-2 text-sm sm:text-base font-extrabold text-[#1430d8] hover:text-[#0075f7] transition-all break-all"
                  title="Click to open your default email app"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100/80 group-hover:bg-blue-600 group-hover:text-white text-[#1430d8] flex items-center justify-center transition-colors shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <span className="underline underline-offset-2 decoration-[#1430d8]/30 group-hover:decoration-[#0075f7]">
                    hello@usmandevhub.com
                  </span>
                </a>
                <p className="text-[10.5px] sm:text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                  Clicking opens your default email application. We respond to all RFPs and custom project scopes within 2–4 hours.
                </p>
              </div>

              {/* 3-Stage Client Payment Milestone Card */}
              <div className="mt-3 sm:mt-3.5 p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 tabular-nums">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#0e0e0e]">
                    3-Stage Payment Schedule
                  </h4>
                  <span className="font-mono text-[11px] font-bold text-[#1430d8]">
                    25% · 35% · 40%
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] text-neutral-600">
                  <div className="flex items-start justify-between gap-3 py-1 border-b border-neutral-200/60">
                    <span><strong className="text-[#0e0e0e]">01. Project Start</strong> — Kickoff &amp; architecture lock</span>
                    <span className="font-mono font-bold text-[#1430d8] shrink-0">25%</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 py-1 border-b border-neutral-200/60">
                    <span><strong className="text-[#0e0e0e]">02. Mid-Project</strong> — Halfway working build review</span>
                    <span className="font-mono font-bold text-[#1430d8] shrink-0">35%</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <span><strong className="text-[#0e0e0e]">03. Final Handover</strong> — Completion, launch &amp; 100% code</span>
                    <span className="font-mono font-bold text-[#1430d8] shrink-0">40%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-4 sm:p-5 md:p-6 rounded-2xl bg-neutral-50/80 border border-neutral-200/90 shadow-2xs">
              {submitted ? (
                <div className="py-7 sm:py-9 text-center flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 sm:mb-4 shadow-sm">
                    <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                  <h3 className="font-display text-lg sm:text-2xl font-bold text-[#0e0e0e]">
                    Inquiry Received Successfully!
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 sm:mt-2 max-w-md">
                    Thank you for reaching out to Usman DevHub. Muhammad Usman Afzal will review your message and reply directly to <strong className="text-neutral-900 font-semibold">{lastSubmittedEmail || 'your email'}</strong> within 4 hours.
                  </p>

                  {/* Live Email Delivery Status to Agency Inbox */}
                  {emailDeliveryStatus === 'needs_activation' ? (
                    <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-amber-50 border border-amber-200 text-left max-w-md w-full space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Agency Email Activation Required (One-Time Step):</span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed">
                        FormSubmit has sent a one-time verification email to <strong className="font-mono text-amber-950 font-semibold">hello@usmandevhub.com</strong> with an <strong className="underline">"Activate Form"</strong> button.
                      </p>
                      <div className="p-2.5 rounded-lg bg-amber-100/70 border border-amber-200/80 text-[10.5px] sm:text-[11px] text-amber-900 leading-relaxed space-y-1">
                        <p className="font-bold">
                          👉 Instructions:
                        </p>
                        <p>
                          1. Apna Business Inbox (<strong className="font-mono">hello@usmandevhub.com</strong>) check karein.
                        </p>
                        <p>
                          2. FormSubmit ki aayi hui <strong className="font-bold underline">sabse LATEST (aakhri) email</strong> kholein aur <strong className="underline font-bold">"Activate Form"</strong> button par click karein.
                        </p>
                        <p className="text-[10px] text-amber-800">
                          ⚠️ <em>Agar pehle click karne par "Not a valid link" aya tha, to wo purana token tha. Inbox mein jo sabse NAYI email hai sirf uska link valid hota hai!</em>
                        </p>
                      </div>
                    </div>
                  ) : emailDeliveryStatus === 'sent' ? (
                    <div className="mt-3 p-3 sm:p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-left max-w-md w-full space-y-1 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Delivered to Official Business Inbox!</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Inquiry was dispatched straight to <strong className="font-mono font-semibold text-emerald-950">hello@usmandevhub.com</strong> with client reply-to set to <strong className="font-mono">{lastSubmittedEmail}</strong>.
                      </p>
                    </div>
                  ) : null}

                  {/* Immediate Direct Delivery to Usman DevHub via Gmail & WhatsApp Side-by-Side */}
                  {lastSubmittedSummary && (
                    <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 max-w-md w-full text-left space-y-2.5 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                        <Mail className="w-4 h-4 text-[#1430d8] shrink-0" />
                        <span>Direct Order Dispatch:</span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                        Official desk: <a href="mailto:hello@usmandevhub.com" className="text-[#1430d8] font-bold hover:underline">hello@usmandevhub.com</a>. Send or follow up directly via Gmail or WhatsApp:
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={lastSubmittedSummary.gmailUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[42px] py-2.5 px-2.5 sm:px-3.5 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] text-white text-[11px] sm:text-xs font-bold leading-tight text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                          title="Send Order via Gmail"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0 text-white" />
                          <span>Send Order via Gmail</span>
                        </a>
                        <a
                          href={lastSubmittedSummary.waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[42px] py-2.5 px-2.5 sm:px-3.5 rounded-xl bg-[#25D366] hover:bg-[#1eb954] text-white text-[11px] sm:text-xs font-bold leading-tight text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                          title="Order via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 shrink-0 text-white" />
                          <span>Order via WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-5 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form id="agency-contact-form" onSubmit={handleSubmit} noValidate className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Name */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="contact-form-name" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                          Your Name *
                        </label>
                        {isNameInvalid && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            Required
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        id="contact-form-name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] shadow-2xs transition-all ${
                          isNameInvalid
                            ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200 focus:outline-none'
                            : 'bg-white border-neutral-200/90 focus:outline-none focus:border-[#1430d8]'
                        }`}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="contact-form-email" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                          Your Email *
                        </label>
                        {isEmailInvalid && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            {!email.trim() ? 'Required' : 'Valid email required'}
                          </span>
                        )}
                      </div>
                      <input
                        type="email"
                        id="contact-form-email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. alex@example.com"
                        className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] shadow-2xs transition-all ${
                          isEmailInvalid
                            ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200 focus:outline-none'
                            : 'bg-white border-neutral-200/90 focus:outline-none focus:border-[#1430d8]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Service & Category Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative">
                    {/* Service Selection - Custom Inline Dropdown */}
                    <div ref={serviceDropdownRef} className={`relative ${isServiceOpen ? 'z-40' : 'z-20'}`}>
                      <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-1">
                        Service Required *
                      </label>
                      <button
                        type="button"
                        id="contact-form-service"
                        onClick={() => {
                          setIsServiceOpen((prev) => !prev);
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border text-xs sm:text-sm text-[#0e0e0e] shadow-2xs transition-all cursor-pointer font-medium flex items-center justify-between text-left ${
                          isServiceOpen
                            ? 'border-[#1430d8] ring-2 ring-blue-100'
                            : 'border-neutral-200/90 hover:border-neutral-300'
                        }`}
                        aria-expanded={isServiceOpen}
                        aria-haspopup="listbox"
                      >
                        <span className="truncate pr-2 font-semibold text-neutral-900">{service || 'Select a Service'}</span>
                        <ChevronDown className={`w-4 h-4 shrink-0 text-neutral-500 transition-transform duration-200 ${isServiceOpen ? 'rotate-180 text-[#1430d8]' : ''}`} />
                      </button>

                      {/* Custom Inline Dropdown List - Never opens mobile OS dialog */}
                      {isServiceOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-60 sm:max-h-72 overflow-y-auto divide-y divide-neutral-100 animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="p-1">
                            {serviceOptions.map((opt) => {
                              const isSelected = opt === service;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    handleServiceChange(opt);
                                    setIsServiceOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-colors ${
                                    isSelected
                                      ? 'bg-blue-50 text-[#1430d8] font-bold'
                                      : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
                                  }`}
                                >
                                  <span className="truncate pr-2">{opt}</span>
                                  {isSelected && <Check className="w-4 h-4 text-[#1430d8] shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Specific Service Category Dropdown - Custom Inline Dropdown */}
                    {(() => {
                      const cats = serviceCategoriesMap[service] || [];
                      const list = [...cats];
                      if (category && !list.some((c) => c.toLowerCase() === category.toLowerCase())) {
                        list.unshift(category);
                      }
                      const availableCategoryList = list.length > 0 ? list : ['Standard Project'];

                      return (
                        <div ref={categoryDropdownRef} className={`relative ${isCategoryOpen ? 'z-40' : 'z-20'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                              Service Category *
                            </label>
                            <span className="text-[10px] font-semibold text-[#1430d8] bg-blue-50 px-1.5 py-0.2 rounded">
                              {serviceCategoriesMap[service]?.length || availableCategoryList.length} Categories
                            </span>
                          </div>

                          <button
                            type="button"
                            id="contact-form-category"
                            onClick={() => {
                              setIsCategoryOpen((prev) => !prev);
                              setIsServiceOpen(false);
                            }}
                            className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border text-xs sm:text-sm text-[#0e0e0e] shadow-2xs transition-all cursor-pointer font-medium flex items-center justify-between text-left ${
                              isCategoryOpen
                                ? 'border-[#1430d8] ring-2 ring-blue-100'
                                : 'border-blue-200 hover:border-blue-300'
                            }`}
                            aria-expanded={isCategoryOpen}
                            aria-haspopup="listbox"
                          >
                            <span className="truncate pr-2 font-semibold text-neutral-900">{category || 'Select Category'}</span>
                            <ChevronDown className={`w-4 h-4 shrink-0 text-blue-600 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180 text-[#1430d8]' : ''}`} />
                          </button>

                          {/* Custom Inline Dropdown List for Category - Never opens mobile OS dialog */}
                          {isCategoryOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-60 sm:max-h-72 overflow-y-auto divide-y divide-neutral-100 animate-in fade-in slide-in-from-top-1 duration-150">
                              <div className="p-1">
                                {availableCategoryList.map((cat) => {
                                  const isSelected = cat.toLowerCase() === category.toLowerCase();
                                  return (
                                    <button
                                      key={cat}
                                      type="button"
                                      onClick={() => {
                                        setCategory(cat);
                                        setIsCategoryOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-colors ${
                                        isSelected
                                          ? 'bg-blue-50 text-[#1430d8] font-bold'
                                          : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
                                      }`}
                                    >
                                      <span className="truncate pr-2">{cat}</span>
                                      {isSelected && <Check className="w-4 h-4 text-[#1430d8] shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {service.toLowerCase().includes('commerce') && (
                            <p className="text-[10px] text-blue-700 mt-1 font-medium">
                              ✓ Shopify, WooCommerce, or Custom Code stores for ANY product or niche.
                            </p>
                          )}
                          {service.toLowerCase().includes('web') && (
                            <p className="text-[10px] text-blue-700 mt-1 font-medium">
                              ✓ Custom Code or WordPress CMS built to your exact specs.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Preferred Technology / Platform */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                        Preferred Technology / Code Stack *
                      </label>
                      <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        Har Code Supported
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        'Custom Code',
                        'Shopify & Shopify Plus',
                        'WordPress & WooCommerce',
                        'Open to Recommendation'
                      ].map((tech) => (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => setPreferredTech(tech)}
                          className={`px-2.5 py-1.5 rounded-xl text-[10.5px] sm:text-[11px] font-medium border text-left transition-all cursor-pointer flex items-center justify-between gap-1 ${
                            preferredTech === tech
                              ? 'bg-blue-50/95 border-[#1430d8] text-[#1430d8] font-bold shadow-2xs ring-1 ring-[#1430d8]/30'
                              : 'bg-white border-neutral-200/90 text-neutral-700 hover:border-blue-200 hover:bg-neutral-50'
                          }`}
                        >
                          <span className="truncate">{tech}</span>
                          {preferredTech === tech && (
                            <CheckCircle2 className="w-3 h-3 text-[#1430d8] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Budget Allocation */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                        Target Budget (USD)
                      </label>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-[#1430d8]">
                        Flexible scope
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-400">
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        id="contact-form-budget"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="e.g. 100, 300, 500, 1,500+"
                        className="w-full pl-7 sm:pl-8 pr-3 py-2 sm:py-2.5 rounded-xl bg-white border border-neutral-200/90 text-xs sm:text-sm text-[#0e0e0e] focus:outline-none focus:border-[#1430d8] shadow-2xs transition-all placeholder:text-neutral-400"
                      />
                    </div>
                    {/* Quick options to tap or type custom */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <span className="text-[9px] text-neutral-400">Presets:</span>
                      {quickBudgetPresets.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setBudget(opt)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                            budget === opt
                              ? 'bg-[#1430d8] text-white shadow-2xs'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    {/* Live 25% / 35% / 40% Milestone Split Preview */}
                    <div className="mt-2 px-3 py-2 rounded-xl bg-white border border-neutral-200/80 text-[10.5px] sm:text-[11px] text-neutral-600 tabular-nums">
                      {enteredBudgetMilestones ? (
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <span className="font-semibold text-neutral-700">Milestone Split:</span>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10.5px] sm:text-[11px]">
                            <span>
                              25% Start:{' '}
                              <strong className="text-[#1430d8]">
                                ${enteredBudgetMilestones.start25.toLocaleString()}
                                {enteredBudgetMilestones.hasPlus ? '+' : ''}
                              </strong>
                            </span>
                            <span aria-hidden="true" className="text-neutral-300">·</span>
                            <span>
                              35% Mid:{' '}
                              <strong className="text-[#1430d8]">
                                ${enteredBudgetMilestones.mid35.toLocaleString()}
                                {enteredBudgetMilestones.hasPlus ? '+' : ''}
                              </strong>
                            </span>
                            <span aria-hidden="true" className="text-neutral-300">·</span>
                            <span>
                              40% Final:{' '}
                              <strong className="text-[#1430d8]">
                                ${enteredBudgetMilestones.final40.toLocaleString()}
                                {enteredBudgetMilestones.hasPlus ? '+' : ''}
                              </strong>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-neutral-700">Payment Schedule:</span>
                          <span className="text-neutral-600">
                            <strong className="text-[#1430d8]">25%</strong> Project Start · <strong className="text-[#1430d8]">35%</strong> Mid-Project · <strong className="text-[#1430d8]">40%</strong> Final Handover
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Partner Token Attribution (Token Code Only — No Link Needed) */}
                  <div>
                    {isAutoReferred && normalizedRefToken && !isEditingRefCode ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <KeyRound className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />
                          <span className="text-neutral-700">
                            Partner Token Applied:{' '}
                            <strong className="text-[#0e0e0e]">
                              {matchedPartner ? matchedPartner.partnerName : normalizedRefToken}
                            </strong>{' '}
                            <span className="font-mono text-[#1430d8] font-bold">({normalizedRefToken})</span>
                          </span>
                          {matchedPartner?.targetService && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#1430d8] border border-blue-200">
                              {matchedPartner.targetService}{matchedPartner.targetCategory ? ` · ${matchedPartner.targetCategory}` : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsEditingRefCode(true)}
                            className="text-[11px] font-semibold text-[#1430d8] hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            aria-label="Clear partner token"
                            onClick={() => {
                              setReferralCode('');
                              setIsAutoReferred(false);
                              setActiveReferredByToken('');
                            }}
                            className="p-0.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label htmlFor="contact-form-referral-token" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                            Partner Token <span className="font-normal text-neutral-400">(Optional)</span>
                          </label>
                          {matchedPartner ? (
                            <span className="text-[10px] font-semibold text-emerald-700">
                              Verified Partner: {matchedPartner.partnerName}
                            </span>
                          ) : normalizedRefToken ? (
                            <span className="text-[10px] text-[#1430d8] font-mono">
                              Token: {normalizedRefToken}
                            </span>
                          ) : null}
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-400">
                            <KeyRound className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="text"
                            id="contact-form-referral-token"
                            value={referralCode}
                            onChange={(e) => {
                              setReferralCode(e.target.value.toUpperCase());
                              setIsAutoReferred(false);
                            }}
                            placeholder="Enter Partner Token (UDH-...)"
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-neutral-200/90 font-mono text-xs text-[#0e0e0e] uppercase focus:outline-none focus:border-[#1430d8] shadow-2xs transition-all placeholder:font-sans placeholder:normal-case placeholder:text-neutral-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="contact-form-message" className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                        Project Requirements &amp; Goals *
                      </label>
                      {isMessageInvalid ? (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          Required
                        </span>
                      ) : category ? (
                        <span className="text-[10px] text-neutral-500 truncate max-w-[200px]">
                          Selected: <strong className="text-[#1430d8]">{category}</strong>
                        </span>
                      ) : null}
                    </div>
                    <textarea
                      id="contact-form-message"
                      required
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Describe your requirements for ${service}${category ? ` (${category})` : ''} — e.g. project goals, specific features or references...`}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm text-[#0e0e0e] shadow-2xs transition-all resize-y min-h-[75px] max-h-[350px] ${
                        isMessageInvalid
                          ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200 focus:outline-none'
                          : 'bg-white border-neutral-200/90 focus:outline-none focus:border-[#1430d8]'
                      }`}
                    />
                  </div>

                  <div className="pt-2 space-y-2">
                    {/* Dual Action Buttons: Send Order via Gmail & Order via WhatsApp Side-by-Side */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {/* Button 1: Send Order via Gmail */}
                      <button
                        type="button"
                        id="contact-form-gmail-btn"
                        onClick={handleGmailDirect}
                        disabled={loading}
                        title="Submit Order & Send Directly via Gmail"
                        className="min-h-[44px] w-full py-2.5 sm:py-3.5 px-2.5 sm:px-4 rounded-xl bg-[#1430d8] hover:bg-[#0075f7] active:scale-[0.99] text-white font-bold text-[11px] sm:text-xs md:text-sm leading-tight text-center transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                            <span>Opening Gmail...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
                            <span>Send Order via Gmail</span>
                          </>
                        )}
                      </button>

                      {/* Button 2: Order via WhatsApp (Right Beside It) */}
                      <button
                        type="button"
                        id="contact-form-whatsapp-btn"
                        onClick={handleWhatsAppDirect}
                        disabled={loading}
                        title="Submit Order & Chat Instantly on WhatsApp"
                        className="min-h-[44px] w-full py-2.5 sm:py-3.5 px-2.5 sm:px-4 rounded-xl bg-[#25D366] hover:bg-[#1eb954] active:scale-[0.99] text-white font-bold text-[11px] sm:text-xs md:text-sm leading-tight text-center transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-60"
                      >
                        <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
                        <span>Order via WhatsApp</span>
                      </button>
                    </div>

                    <p className="text-[10px] sm:text-[11px] text-center text-neutral-500">
                      ⚡ Direct delivery to <strong className="text-neutral-800 font-mono font-semibold">hello@usmandevhub.com</strong> &amp; immediate chat with founder Muhammad Usman Afzal on WhatsApp.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-neutral-400 pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Institutional confidentiality &amp; mutual NDA protected.</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
