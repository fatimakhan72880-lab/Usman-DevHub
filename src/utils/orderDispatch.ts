/**
 * Utility for dispatching orders across Gmail and WhatsApp with consistent structure,
 * pre-filled subject/body formatting, backend synchronization, and error handling.
 */
import {
  addContactMessage,
  sendContactMessageToBackend,
  getActiveReferredByToken,
  lookupPartnerByToken,
  normalizeReferralToken,
  addReferral
} from '../services/storageService';

export interface OrderDispatchPayload {
  clientName: string;
  clientEmail: string;
  service: string;
  category?: string;
  preferredTech?: string;
  budget?: string;
  message: string;
  referralToken?: string;
  referredByName?: string;
}

function enrichPayloadWithReferral(payload: OrderDispatchPayload): OrderDispatchPayload {
  const activeToken = normalizeReferralToken(payload.referralToken || getActiveReferredByToken() || '');
  if (!activeToken) return payload;
  const resolvedPartner = lookupPartnerByToken(activeToken);
  return {
    ...payload,
    referralToken: activeToken,
    referredByName: payload.referredByName || resolvedPartner?.partnerName
  };
}

function recordPartnerReferralIfPresent(payload: OrderDispatchPayload, channelLabel: string, inquiryId?: string): void {
  if (!payload.referralToken) return;
  try {
    const resolvedPartner = lookupPartnerByToken(payload.referralToken);
    const cleanBudgetLabel = payload.budget || 'Custom Scope / Needs Discussion';
    addReferral({
      partnerToken: payload.referralToken,
      partnerName: payload.referredByName || resolvedPartner?.partnerName || `Partner (${payload.referralToken})`,
      partnerEmail: resolvedPartner?.partnerEmail || `token-${payload.referralToken.toLowerCase()}@partner.usmandevhub.com`,
      partnerWhatsApp: resolvedPartner?.partnerWhatsApp,
      payoutMethod: resolvedPartner?.payoutMethod,
      clientName: payload.clientName,
      clientEmail: payload.clientEmail,
      service: payload.service,
      category: payload.category,
      preferredTech: payload.preferredTech,
      projectType: payload.category ? `${payload.service} — ${payload.category}` : payload.service,
      estimatedBudget: 0,
      statedBudgetText: cleanBudgetLabel,
      status: 'pending',
      source: 'manual_code',
      submittedAt: new Date().toISOString(),
      inquiryId,
      clientMessage: payload.message,
      notes: `Client submitted order via ${channelLabel} using Partner Token ${payload.referralToken} (Service: ${payload.service}${payload.category ? ` · Category: ${payload.category}` : ''}).`,
      adminStatusNote: `Client submitted project details for ${payload.service}${payload.category ? ` (${payload.category})` : ''} on your token. Studio is reviewing scope & requirements.`
    });
  } catch (err) {
    console.error('Failed to record partner referral attribution', err);
  }
}

export function buildOrderGmailUrl({
  clientName,
  clientEmail,
  service,
  category,
  preferredTech,
  budget,
  message,
  referralToken,
  referredByName
}: OrderDispatchPayload): string {
  const fullService = category ? `${service} — ${category}` : service;
  const techLine = preferredTech ? `\n• Preferred Tech Stack: ${preferredTech}` : '';
  const refLine = referralToken
    ? `\n• Referral Partner Token: ${referralToken}${referredByName ? ` (${referredByName})` : ''}`
    : '';
  const budgetLine = budget ? `\n• Target Budget: ${budget}` : '';

  const subject = `New Project Order: ${clientName} (${clientEmail}) — ${fullService}`;
  const body = `Assalam-o-Alaikum Usman DevHub Tech & Creative Studio,\n\nI am contacting you from the website regarding a project order:\n\n• Client Name: ${clientName}\n• Client Email: ${clientEmail} (Reply directly to this email)\n• Service Required: ${fullService}${techLine}${budgetLine}${refLine}\n\nProject Requirements & Scope:\n${message}\n\nLooking forward to your proposal and schedule.\n\nBest regards,\n${clientName}\n${clientEmail}`;

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    'hello@usmandevhub.com'
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildOrderWhatsAppUrl({
  clientName,
  clientEmail,
  service,
  category,
  preferredTech,
  budget,
  message,
  referralToken,
  referredByName
}: OrderDispatchPayload): string {
  const fullService = category ? `${service} — ${category}` : service;
  const techLine = preferredTech ? `\n• Preferred Tech: ${preferredTech}` : '';
  const refLine = referralToken
    ? `\n• Partner Token: ${referralToken}${referredByName ? ` (${referredByName})` : ''}`
    : '';
  const budgetLine = budget ? `\n• Budget: ${budget}` : '';

  const text = `Hello Usman DevHub Tech & Creative Studio,\n\nI want to place a project order:\n• Service: ${fullService}${techLine}\n• Name: ${clientName}\n• Email: ${clientEmail}${budgetLine}${refLine}\n• Requirements: ${message}`;

  return `https://wa.me/923412683864?text=${encodeURIComponent(text)}`;
}

export function openExternalUrl(url: string): void {
  if (typeof document === 'undefined') return;
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Failed to open external link', err);
  }
}

export async function dispatchOrderToGmail(rawPayload: OrderDispatchPayload): Promise<{ gmailUrl: string; waUrl: string }> {
  const payload = enrichPayloadWithReferral(rawPayload);
  const gmailUrl = buildOrderGmailUrl(payload);
  const waUrl = buildOrderWhatsAppUrl(payload);

  try {
    const createdMsg = addContactMessage({
      name: payload.clientName,
      email: payload.clientEmail,
      service: payload.service,
      category: payload.category,
      preferredTech: payload.preferredTech,
      budget: payload.budget || 'Custom Scope / Needs Discussion',
      referralToken: payload.referralToken,
      referredByName: payload.referredByName,
      message: `[Submitted via Gmail Order]\n• Service: ${payload.service}\n• Category: ${payload.category || 'Standard'}\n${payload.preferredTech ? `• Tech: ${payload.preferredTech}\n` : ''}${payload.referralToken ? `• Referral Token: ${payload.referralToken}\n` : ''}\nRequirements:\n${payload.message}`
    });
    recordPartnerReferralIfPresent(payload, 'Direct Gmail Order', createdMsg?.id);
    if (createdMsg) {
      await sendContactMessageToBackend(createdMsg).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to record order message', err);
  }

  openExternalUrl(gmailUrl);
  return { gmailUrl, waUrl };
}

export async function dispatchOrderToWhatsApp(rawPayload: OrderDispatchPayload): Promise<{ waUrl: string; gmailUrl: string }> {
  const payload = enrichPayloadWithReferral(rawPayload);
  const waUrl = buildOrderWhatsAppUrl(payload);
  const gmailUrl = buildOrderGmailUrl(payload);

  try {
    const createdMsg = addContactMessage({
      name: payload.clientName,
      email: payload.clientEmail,
      service: payload.service,
      category: payload.category,
      preferredTech: payload.preferredTech,
      budget: payload.budget || 'Custom Scope / Needs Discussion',
      referralToken: payload.referralToken,
      referredByName: payload.referredByName,
      message: `[Submitted via WhatsApp Order]\n• Service: ${payload.service}\n• Category: ${payload.category || 'Standard'}\n${payload.preferredTech ? `• Tech: ${payload.preferredTech}\n` : ''}${payload.referralToken ? `• Referral Token: ${payload.referralToken}\n` : ''}\nRequirements:\n${payload.message}`
    });
    recordPartnerReferralIfPresent(payload, 'WhatsApp Order', createdMsg?.id);
    if (createdMsg) {
      sendContactMessageToBackend(createdMsg).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to record order message', err);
  }

  openExternalUrl(waUrl);
  return { waUrl, gmailUrl };
}
