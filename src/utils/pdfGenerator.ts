import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { OrderAgreement, PaidMilestoneStage } from '../types';
import { normalizeHomeServiceName, getHomeServiceCategory } from '../data/initialData';
import { formatAgreementDate } from './dateUtils';
import { applyWatermarkToAllPages } from './partnerCertificate';
import { USMAN_DEVHUB_BRAND_LOGO_BASE64 } from './brandLogoBase64';

export interface PdfGenerationResult {
  success: boolean;
  fileName: string;
  blobUrl?: string;
  error?: string;
  fallbackUsed?: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  PKR: 'Rs ',
  EUR: '€',
  GBP: '£',
  AED: 'AED ',
  SAR: 'SAR ',
  CAD: 'CA$',
  AUD: 'AU$'
};

/**
 * Normalizes text for jsPDF standard WinAnsi (CP1252) fonts (Helvetica / Courier / Times)
 * so pasted Unicode symbols, Rupee glyphs, arrows, or checkmarks never garble in the PDF.
 */
function sanitizePdfText(raw?: string | null): string {
  if (!raw) return '';
  return String(raw)
    .replace(/\u20A8/g, 'Rs ')          // ₨ -> Rs
    .replace(/\u20B9/g, 'Rs ')          // ₹ -> Rs
    .replace(/[\u2192\u21D2\u2794\u279C\u27A1]/g, '->') // arrows -> ->
    .replace(/[\u2190\u21D0]/g, '<-')
    .replace(/[\u2194\u21D4]/g, '<->')
    .replace(/[\u2713\u2714\u2705\u2611]/g, '') // strip checkmark icons cleanly
    .replace(/\u2264/g, '<=')
    .replace(/\u2265/g, '>=')
    .replace(/\u2260/g, '!=')
    .replace(/\u2248/g, '~')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2026/g, '...')
    // Remove surrogate-pair emojis / astral symbols unsupported by built-in Helvetica
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    // Replace any remaining non-WinAnsi high codepoints (keep Latin-1 + • — – € ™)
    .replace(/[^\x09\x0A\x0D\x20-\xFF\u2013\u2014\u2022\u20AC\u2122]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function formatMoneyAmount(
  amount: number,
  currency: string,
  includeCodeSuffix: boolean = false
): string {
  const safeCurrency = (currency || 'USD').trim().toUpperCase();
  const sym = CURRENCY_SYMBOLS[safeCurrency] || `${safeCurrency} `;
  const formatted = Math.max(0, Number(amount) || 0).toLocaleString();
  const prefixAlreadyHasCode =
    sym.trim().toUpperCase() === safeCurrency ||
    safeCurrency === 'AED' ||
    safeCurrency === 'SAR';
  if (includeCodeSuffix && !prefixAlreadyHasCode) {
    return `${sym}${formatted} ${safeCurrency}`;
  }
  return `${sym}${formatted}`;
}

function fitFontSizeToWidth(
  doc: jsPDF,
  text: string,
  maxWidthMm: number,
  startPt: number,
  minPt: number = 5.8
): number {
  let pt = startPt;
  doc.setFontSize(pt);
  while (pt > minPt && doc.getTextWidth(text) > maxWidthMm) {
    pt = Math.max(minPt, Number((pt - 0.3).toFixed(2)));
    doc.setFontSize(pt);
  }
  return pt;
}

export interface ResolvedMilestoneSplit {
  pct1: number;
  pct2: number;
  pct3: number;
  amt1: number;
  amt2: number;
  amt3: number;
  selectedStage: PaidMilestoneStage;
  stage1Paid: boolean;
  stage2Paid: boolean;
  stage3Paid: boolean;
  paidPct: number;
  paidAmt: number;
  remainingPct: number;
  remainingAmt: number;
}

function extractMilestonePct(
  milestone: { percentage?: number; title?: string } | undefined,
  fallback: number
): number {
  if (milestone && typeof milestone.percentage === 'number' && !Number.isNaN(milestone.percentage)) {
    return Math.max(0, Math.min(100, Math.round(milestone.percentage)));
  }
  if (milestone?.title) {
    const match = milestone.title.match(/(\d+(?:\.\d+)?)\s*%/);
    if (match) {
      return Math.max(0, Math.min(100, Math.round(Number(match[1]))));
    }
  }
  return fallback;
}

/**
 * Resolves exact 3-stage milestone percentages, currency amounts, and 4-option payment stage
 * ('none' | 'stage_1' | 'stage_2' | 'stage_3') for any OrderAgreement.
 */
export function resolveOrderMilestones(
  order?: Partial<OrderAgreement> | null
): ResolvedMilestoneSplit {
  const total = Math.max(0, Number(order?.confirmedPrice) || 0);
  const ms = Array.isArray(order?.milestones) ? order!.milestones! : [];

  const defaultP1 =
    typeof order?.advancePercentage === 'number' && !Number.isNaN(order.advancePercentage)
      ? Math.max(0, Math.min(100, Math.round(order.advancePercentage)))
      : 25;

  let pct1 = extractMilestonePct(ms[0], defaultP1);
  let pct2 = extractMilestonePct(ms[1], Math.min(35, Math.max(0, 100 - pct1)));
  if (pct1 + pct2 > 100) {
    pct2 = Math.max(0, 100 - pct1);
  }
  const pct3 = Math.max(0, 100 - pct1 - pct2);

  let amt1 = Math.round((total * pct1) / 100);
  let amt2 = Math.round((total * pct2) / 100);
  let amt3 = Math.max(0, total - amt1 - amt2);

  // Ensure exact 100% total reconciliation even when Stage 3 or Stage 2 is 0%
  if (pct3 === 0) {
    amt3 = 0;
    if (pct2 > 0) {
      amt2 = Math.max(0, total - amt1);
    } else {
      amt2 = 0;
      amt1 = total;
    }
  }

  let selectedStage: PaidMilestoneStage = 'none';
  if (
    order?.selectedMilestoneStage === 'none' ||
    order?.selectedMilestoneStage === 'stage_1' ||
    order?.selectedMilestoneStage === 'stage_2' ||
    order?.selectedMilestoneStage === 'stage_3'
  ) {
    selectedStage = order.selectedMilestoneStage;
  } else if (ms[2]?.status === 'completed') {
    selectedStage = 'stage_3';
  } else if (ms[1]?.status === 'completed') {
    selectedStage = 'stage_2';
  }

  const stage1Paid =
    selectedStage === 'stage_1' || selectedStage === 'stage_2' || selectedStage === 'stage_3';
  const stage2Paid = selectedStage === 'stage_2' || selectedStage === 'stage_3';
  const stage3Paid = selectedStage === 'stage_3';

  const paidPct = stage3Paid ? 100 : stage2Paid ? pct1 + pct2 : stage1Paid ? pct1 : 0;
  const paidAmt = stage3Paid ? total : stage2Paid ? amt1 + amt2 : stage1Paid ? amt1 : 0;
  const remainingPct = Math.max(0, 100 - paidPct);
  const remainingAmt = Math.max(0, total - paidAmt);

  return {
    pct1,
    pct2,
    pct3,
    amt1,
    amt2,
    amt3,
    selectedStage,
    stage1Paid,
    stage2Paid,
    stage3Paid,
    paidPct,
    paidAmt,
    remainingPct,
    remainingAmt
  };
}

/**
 * Generates an executive, publication-grade vector PDF using pure jsPDF primitives.
 * Completely immune to cross-origin, CSS, canvas, or iframe rendering limitations.
 * Zero overlapping text, dynamic multi-line cards, and 100% light cards.
 */
export function generateNativeVectorPdf(order: OrderAgreement): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  const centerX = pageWidth / 2; // 105mm
  let y = margin;

  const cleanOrderNumber = sanitizePdfText(order.orderNumber) || 'UDH-ORD-VERIFIED';
  const cleanClientName = sanitizePdfText(order.clientName) || 'Valued Commercial Client';
  const cleanTimeline = sanitizePdfText(order.timeline) || '7-14 Business Days';
  const issueDateStr = sanitizePdfText(
    formatAgreementDate(order.agreementDate || order.createdAt || new Date().toISOString())
  );

  const hasReferralToken = Boolean(
    order.referralToken &&
      order.referralToken.trim().length >= 4 &&
      order.referralToken.trim().toUpperCase() !== 'UDH-REF-'
  );
  const cleanReferralToken = hasReferralToken
    ? sanitizePdfText(order.referralToken!.trim().toUpperCase())
    : '';
  const cleanPartnerName = hasReferralToken ? sanitizePdfText(order.partnerName) : '';

  const rawStatus = (order.status || 'confirmed').replace(/_/g, ' ').toUpperCase();
  const statusLabel = sanitizePdfText(rawStatus) || 'CONFIRMED';

  const drawHeaderRibbon = () => {
    doc.setFillColor(20, 48, 216); // Royal Blue #1430d8
    doc.rect(0, 0, pageWidth * 0.72, 3.5, 'F');
    doc.setFillColor(0, 194, 255); // Cyan #00c2ff
    doc.rect(pageWidth * 0.72, 0, pageWidth * 0.28, 3.5, 'F');
  };

  const drawContinuationHeader = () => {
    drawHeaderRibbon();
    if (USMAN_DEVHUB_BRAND_LOGO_BASE64) {
      try {
        doc.addImage(USMAN_DEVHUB_BRAND_LOGO_BASE64, 'PNG', margin, 4.8, 9, 6.0);
      } catch {
        // ignore
      }
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('USMAN DEVHUB  •  CONTINUATION OF SOW  •  hello@usmandevhub.com', margin + 11.5, 9.5);
    doc.setTextColor(20, 48, 216);
    doc.text(
      `REF: ${cleanOrderNumber}  •  CLIENT: ${cleanClientName.toUpperCase().slice(0, 32)}`,
      pageWidth - margin,
      9.5,
      { align: 'right' }
    );
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      drawContinuationHeader();
      y = 17;
    }
  };

  drawHeaderRibbon();

  // Official designated company logo for all generated PDF documents
  const activeLogo = USMAN_DEVHUB_BRAND_LOGO_BASE64;

  // ========================================================
  // 1. TOP DOCUMENT CLASSIFICATION & STUDIO BRAND HEADER (CENTERED)
  // ========================================================
  y = 6.8;
  const pillW = 152;
  const pillH = 5.4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(centerX - pillW / 2, y, pillW, pillH, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.3);
  doc.setTextColor(20, 48, 216);
  doc.text(
    'COMMERCIAL MASTER SERVICES AGREEMENT & STATEMENT OF WORK (SOW)',
    centerX,
    y + 3.7,
    { align: 'center' }
  );

  // Render official company logo on TOP LEFT of the document header
  const logoToRender = USMAN_DEVHUB_BRAND_LOGO_BASE64;
  if (logoToRender) {
    try {
      const cleanLogo = typeof logoToRender === 'string' ? logoToRender.trim() : '';
      if (cleanLogo) {
        let imgSource: any = cleanLogo;
        if (!cleanLogo.startsWith('data:image/') && typeof document !== 'undefined') {
          const domImg = Array.from(document.querySelectorAll('img')).find(
            (i) => i.src === cleanLogo || i.src.endsWith(cleanLogo)
          );
          if (domImg && domImg.complete && domImg.naturalWidth > 0) {
            imgSource = domImg;
          }
        }
        const format =
          cleanLogo.includes('image/jpeg') || cleanLogo.includes('.jpg') || cleanLogo.includes('.jpeg')
            ? 'JPEG'
            : 'PNG';
        // Render 21mm x 14mm brand logo at margin (14mm), y = 14.5mm on the top left (exact 1.5:1 ratio)
        doc.addImage(imgSource, format, margin, 14.5, 21, 14);
      }
    } catch {
      // Gracefully continue without logo if image processing fails
    }
  }

  // Centered Agency Brand Name
  y = 19.2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21.5);
  doc.setTextColor(15, 23, 42);
  doc.text('USMAN DEVHUB', centerX, y, { align: 'center' });

  // Centered Agency Subtitle
  y = 24.0;
  doc.setFontSize(8.0);
  doc.setTextColor(20, 48, 216);
  doc.text(
    'TECH & CREATIVE STUDIO  •  HIGH-PERFORMANCE DIGITAL ARCHITECTURE',
    centerX,
    y,
    { align: 'center' }
  );

  // Centered Studio Credentials & Contact
  y = 28.2;
  doc.setFontSize(6.7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Founder & Lead Technologist: Muhammad Usman Afzal   |   Direct WhatsApp: +92 341 2683864   |   Email: hello@usmandevhub.com',
    centerX,
    y,
    { align: 'center' }
  );

  // ========================================================
  // EXECUTIVE DOCUMENT REFERENCE, DATE/TIMELINE & STATUS CARD
  // ========================================================
  y = 31.6;
  const refCardH = 14.0;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, refCardH, 1.5, 1.5, 'FD');

  // Top Royal Blue stripe inside Reference Card
  doc.setFillColor(20, 48, 216);
  doc.rect(margin + 0.4, y + 0.4, contentWidth - 0.8, 1.0, 'F');

  // Column geometry: Left (58mm) | Center (66mm) | Right (58mm) = 182mm
  const div1X = margin + 58;
  const div2X = margin + 124;

  // Left Column: Agreement Reference No.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.7);
  doc.setTextColor(100, 116, 139);
  doc.text('AGREEMENT REFERENCE NO.', margin + 4.5, y + 5.2);

  doc.setFont('courier', 'bold');
  fitFontSizeToWidth(doc, cleanOrderNumber, 50.5, 9.8, 6.5);
  doc.setTextColor(20, 48, 216);
  doc.text(cleanOrderNumber, margin + 4.5, y + 10.9);

  // Vertical Divider 1
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(div1X, y + 2.8, div1X, y + refCardH - 1.8);

  // Center Column: Effective Date & Timeline
  const midColCenterX = (div1X + div2X) / 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.7);
  doc.setTextColor(100, 116, 139);
  doc.text('EFFECTIVE DATE & TIMELINE', midColCenterX, y + 5.2, { align: 'center' });

  const dateTimelineText = `${issueDateStr}  •  ${cleanTimeline}`;
  doc.setFont('helvetica', 'bold');
  fitFontSizeToWidth(doc, dateTimelineText, 61, 7.3, 5.8);
  doc.setTextColor(15, 23, 42);
  doc.text(dateTimelineText, midColCenterX, y + 10.8, { align: 'center' });

  // Vertical Divider 2
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(div2X, y + 2.8, div2X, y + refCardH - 1.8);

  // Right Column: Status & Partner Attribution
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.7);
  doc.setTextColor(100, 116, 139);
  doc.text('STATUS & ATTRIBUTION', pageWidth - margin - 4.5, y + 5.2, { align: 'right' });

  const authTag = hasReferralToken
    ? `PARTNER: ${cleanReferralToken}`
    : `${statusLabel} • DIRECT SOW`;
  doc.setFont('helvetica', 'bold');
  fitFontSizeToWidth(doc, authTag, 50.5, 7.6, 5.8);
  doc.setTextColor(20, 48, 216);
  doc.text(authTag, pageWidth - margin - 4.5, y + 10.9, { align: 'right' });

  // Advance y cleanly past the Reference Card (zero overlap!)
  y += refCardH + 3.6;

  // ========================================================
  // SECTION 1.0: CLIENT DETAILS & PROJECT SPECIFICATION (DYNAMIC MULTI-LINE)
  // ========================================================
  const halfWidth = contentWidth / 2; // 91mm
  const colPadX = 4.2;
  const colTextWidth = halfWidth - colPadX * 2 - 1; // ~81.6mm

  // Deduplicate Company & Country if identical
  const cleanCompany = sanitizePdfText(order.clientCompany);
  const cleanCountry = sanitizePdfText(order.clientCountry);
  const cleanPhone = sanitizePdfText(order.clientPhone);
  const cleanEmail = sanitizePdfText(order.clientEmail);
  const cleanAddress = sanitizePdfText(order.clientAddress);
  const cleanTaxId = sanitizePdfText(order.clientTaxId);

  const companyCountryParts: string[] = [];
  if (cleanCompany) companyCountryParts.push(cleanCompany);
  if (cleanCountry && cleanCountry.toLowerCase() !== cleanCompany.toLowerCase()) {
    companyCountryParts.push(cleanCountry);
  }
  const companyLocationLine = companyCountryParts.join('  •  ');

  type InfoRow = {
    text: string;
    fontStyle: 'bold' | 'normal';
    fontSize: number;
    color: [number, number, number];
    lineStep: number;
  };

  // Build Left Column Rows (Client Entity & Contact)
  const leftRows: InfoRow[] = [
    {
      text: cleanClientName,
      fontStyle: 'bold',
      fontSize: 9.6,
      color: [15, 23, 42],
      lineStep: 4.1
    }
  ];

  if (companyLocationLine) {
    leftRows.push({
      text: companyLocationLine,
      fontStyle: 'bold',
      fontSize: 7.2,
      color: [51, 65, 85],
      lineStep: 3.6
    });
  }
  if (cleanPhone) {
    leftRows.push({
      text: `WhatsApp / Phone: ${cleanPhone}`,
      fontStyle: 'normal',
      fontSize: 7.2,
      color: [30, 41, 59],
      lineStep: 3.6
    });
  }
  if (cleanEmail) {
    leftRows.push({
      text: `Email: ${cleanEmail}`,
      fontStyle: 'normal',
      fontSize: 7.2,
      color: [20, 48, 216],
      lineStep: 3.6
    });
  }
  if (cleanAddress) {
    leftRows.push({
      text: `Address: ${cleanAddress}`,
      fontStyle: 'normal',
      fontSize: 6.8,
      color: [71, 85, 105],
      lineStep: 3.4
    });
  }
  if (cleanTaxId) {
    leftRows.push({
      text: `Tax / NTN Ref: ${cleanTaxId}`,
      fontStyle: 'normal',
      fontSize: 6.7,
      color: [100, 116, 139],
      lineStep: 3.4
    });
  }
  if (!companyLocationLine && !cleanPhone && !cleanEmail && !cleanAddress && !cleanTaxId) {
    leftRows.push({
      text: 'Direct Commercial Client Engagement',
      fontStyle: 'normal',
      fontSize: 7.1,
      color: [71, 85, 105],
      lineStep: 3.6
    });
    leftRows.push({
      text: `Status: ${statusLabel}  •  Verified Digital SOW`,
      fontStyle: 'normal',
      fontSize: 6.8,
      color: [100, 116, 139],
      lineStep: 3.5
    });
  }

  // Build Right Column Rows (Service, Specialization, Partner Attribution, Status)
  const srvName = sanitizePdfText(normalizeHomeServiceName(order.service)) || 'Web Development';
  const catName = sanitizePdfText(getHomeServiceCategory(order.service)) || 'Engineering';
  const specName = sanitizePdfText(order.serviceCategory);
  const cleanExpectedDelivery = sanitizePdfText(order.expectedDeliveryDate);

  const rightRows: InfoRow[] = [
    {
      text: `${srvName} (${catName})`,
      fontStyle: 'bold',
      fontSize: 9.0,
      color: [20, 48, 216],
      lineStep: 4.0
    },
    {
      text: `Specialization: ${specName || catName}`,
      fontStyle: 'bold',
      fontSize: 7.2,
      color: [30, 41, 59],
      lineStep: 3.6
    },
    hasReferralToken
      ? {
          text: `Partner Token: ${cleanReferralToken}${cleanPartnerName ? ` (${cleanPartnerName})` : ''}`,
          fontStyle: 'bold',
          fontSize: 7.2,
          color: [20, 48, 216],
          lineStep: 3.6
        }
      : {
          text: 'Engagement Mode: Direct Client (Without Reference)',
          fontStyle: 'normal',
          fontSize: 7.1,
          color: [71, 85, 105],
          lineStep: 3.6
        },
    {
      text: `Status: ${statusLabel}  •  Timeline: ${cleanTimeline}${cleanExpectedDelivery ? ` (Target: ${cleanExpectedDelivery})` : ''}`,
      fontStyle: 'normal',
      fontSize: 6.8,
      color: [100, 116, 139],
      lineStep: 3.5
    }
  ];

  const measureColumnRows = (rows: InfoRow[]) => {
    let totalH = 0;
    const prepared = rows.map((r) => {
      doc.setFont('helvetica', r.fontStyle);
      doc.setFontSize(r.fontSize);
      const lines: string[] = doc.splitTextToSize(r.text, colTextWidth);
      const blockH = lines.length * r.lineStep + 0.7;
      totalH += blockH;
      return { ...r, lines, blockH };
    });
    return { prepared, totalH };
  };

  const leftMeasured = measureColumnRows(leftRows);
  const rightMeasured = measureColumnRows(rightRows);
  const metaHeaderOffset = 9.2;
  const metaBottomPad = 2.8;
  const metaBoxHeight = Math.max(
    26.5,
    metaHeaderOffset + Math.max(leftMeasured.totalH, rightMeasured.totalH) + metaBottomPad
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, metaBoxHeight, 1.8, 1.8, 'FD');

  // Center vertical divider inside Section 1.0
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin + halfWidth, y + 3, margin + halfWidth, y + metaBoxHeight - 3);

  // Column Section Labels
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.1);
  doc.setTextColor(100, 116, 139);
  doc.text('SECTION 1.0 — CLIENT DETAILS & CONTACT', margin + colPadX, y + 4.8);
  doc.text('PROJECT & ENGAGEMENT SPECIFICATION', margin + halfWidth + colPadX, y + 4.8);

  // Render Left Column Rows
  let leftCursorY = y + metaHeaderOffset;
  for (const item of leftMeasured.prepared) {
    doc.setFont('helvetica', item.fontStyle);
    doc.setFontSize(item.fontSize);
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    for (const ln of item.lines) {
      doc.text(ln, margin + colPadX, leftCursorY);
      leftCursorY += item.lineStep;
    }
    leftCursorY += 0.7;
  }

  // Render Right Column Rows
  let rightCursorY = y + metaHeaderOffset;
  for (const item of rightMeasured.prepared) {
    doc.setFont('helvetica', item.fontStyle);
    doc.setFontSize(item.fontSize);
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    for (const ln of item.lines) {
      doc.text(ln, margin + halfWidth + colPadX, rightCursorY);
      rightCursorY += item.lineStep;
    }
    rightCursorY += 0.7;
  }

  y += metaBoxHeight + 4.2;

  // ========================================================
  // SECTION 2.0: FINANCIAL INVESTMENT & COMMERCIAL TERMS
  // ========================================================
  const financialBoxHeight = 23.5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, financialBoxHeight, 1.8, 1.8, 'FD');

  const splitX = margin + 78;
  const totalInvText = formatMoneyAmount(order.confirmedPrice || 0, order.currency, true);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.1);
  doc.setTextColor(100, 116, 139);
  doc.text('SECTION 2.0 — CONFIRMED TOTAL CONTRACT INVESTMENT', margin + 4.2, y + 5.3);

  doc.setFont('helvetica', 'bold');
  fitFontSizeToWidth(doc, totalInvText, 70, 13.5, 9.0);
  doc.setTextColor(20, 48, 216);
  doc.text(totalInvText, margin + 4.2, y + 13.3);

  const msSplit = resolveOrderMilestones(order);
  const p1Text = formatMoneyAmount(msSplit.amt1, order.currency, false);
  const p2Text = formatMoneyAmount(msSplit.amt2, order.currency, false);
  const p3Text = formatMoneyAmount(msSplit.amt3, order.currency, false);
  const paidAmtText = formatMoneyAmount(msSplit.paidAmt, order.currency, false);
  const remAmtText = formatMoneyAmount(msSplit.remainingAmt, order.currency, false);

  const sec2StatusLine =
    msSplit.selectedStage === 'none'
      ? 'Status: Confirmed • 0% Paid • Full Schedule Due'
      : msSplit.selectedStage === 'stage_3'
      ? `Paid: ${paidAmtText} (100% Settled) • Balance: 0`
      : `Paid: ${paidAmtText} (${msSplit.paidPct}%) • Balance: ${remAmtText}`;

  doc.setFont('helvetica', msSplit.selectedStage === 'none' ? 'normal' : 'bold');
  fitFontSizeToWidth(doc, sec2StatusLine, 70, 5.9, 4.9);
  if (msSplit.selectedStage === 'none') {
    doc.setTextColor(71, 85, 105);
  } else {
    doc.setTextColor(20, 48, 216);
  }
  doc.text(sec2StatusLine, margin + 4.2, y + 18.4);

  // Vertical divider before milestone mini-boxes
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(splitX, y + 3, splitX, y + financialBoxHeight - 3);

  const miniBoxW = 31.5;
  const miniBoxH = 17.2;
  const miniY = y + 3.1;

  const drawMiniMilestoneCard = (
    boxX: number,
    stageTitle: string,
    amtStr: string,
    pctNum: number,
    dueFooter: string,
    isPaid: boolean
  ) => {
    if (isPaid) {
      doc.setFillColor(239, 246, 255); // soft studio blue-50
      doc.setDrawColor(20, 48, 216);
      doc.setLineWidth(0.45);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.35);
    }
    doc.roundedRect(boxX, miniY, miniBoxW, miniBoxH, 1, 1, 'FD');

    doc.setFontSize(5.4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 48, 216);
    doc.text(stageTitle, boxX + 2.1, miniY + 4.0);

    doc.setFontSize(5.1);
    doc.setFont('helvetica', 'bold');
    if (isPaid) {
      doc.setTextColor(20, 48, 216);
      doc.text('PAID', boxX + miniBoxW - 2.1, miniY + 4.0, { align: 'right' });
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text(`${pctNum}%`, boxX + miniBoxW - 2.1, miniY + 4.0, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    fitFontSizeToWidth(doc, amtStr, miniBoxW - 4.2, 8.4, 6.0);
    doc.setTextColor(15, 23, 42);
    doc.text(amtStr, boxX + 2.1, miniY + 9.6);

    doc.setFontSize(5.2);
    doc.setFont('helvetica', isPaid ? 'bold' : 'normal');
    if (isPaid) {
      doc.setTextColor(20, 48, 216);
      doc.text(`${pctNum}% Received`, boxX + 2.1, miniY + 14.1);
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text(dueFooter, boxX + 2.1, miniY + 14.1);
    }
  };

  const mb1X = splitX + 3.5;
  drawMiniMilestoneCard(mb1X, '1. KICKOFF', p1Text, msSplit.pct1, `${msSplit.pct1}% Upfront Due`, msSplit.stage1Paid);

  const mb2X = mb1X + miniBoxW + 2.5;
  drawMiniMilestoneCard(mb2X, '2. MID DEMO', p2Text, msSplit.pct2, `${msSplit.pct2}% Demo Due`, msSplit.stage2Paid);

  const mb3X = mb2X + miniBoxW + 2.5;
  drawMiniMilestoneCard(mb3X, '3. DELIVERY', p3Text, msSplit.pct3, `${msSplit.pct3}% Final Due`, msSplit.stage3Paid);

  doc.setLineWidth(0.4);
  y += financialBoxHeight + 4.8;

  // ========================================================
  // SECTION 3.0: STATEMENT OF WORK & TECHNICAL DELIVERABLES
  // ========================================================
  ensureSpace(22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text('SECTION 3.0 — STATEMENT OF WORK & DELIVERABLES (SOW)', margin, y);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 48, 216);
  doc.text(`Timeline: ${cleanTimeline}`, pageWidth - margin, y, { align: 'right' });
  y += 2.6;

  // Dedicated Project Title Banner (never collides with Section 3.0 header)
  const cleanProjTitle = sanitizePdfText(order.projectTitle) || 'Custom Digital Architecture';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  const projTitleWrapped: string[] = doc.splitTextToSize(
    `Project Title: ${cleanProjTitle}`,
    contentWidth - 8
  );
  const projBannerH = projTitleWrapped.length * 3.9 + 3.4;
  ensureSpace(projBannerH + 4);

  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, projBannerH, 1.3, 1.3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  let projTextY = y + 4.3;
  for (const ptLine of projTitleWrapped) {
    doc.text(ptLine, margin + 4, projTextY);
    projTextY += 3.9;
  }

  y += projBannerH + 3.8;

  // Scope Deliverables & Custom Terms Parsing
  const rawScopeLines = (order.scopeDescription || '')
    .split('\n')
    .map((l) => sanitizePdfText(l))
    .filter((l) => l.length > 0);

  const hasBulletInScope = rawScopeLines.some(
    (l) => /^[•\-\*]\s*/.test(l) || /^\d+[\.\)]\s*/.test(l)
  );

  type ScopeRenderEntry = { isBullet: boolean; isHeading: boolean; text: string };
  const scopeEntries: ScopeRenderEntry[] = [];

  if (rawScopeLines.length > 0) {
    for (const line of rawScopeLines) {
      const isBullet = /^[•\-\*]\s+/.test(line) || /^\d+[\.\)]\s+/.test(line) || line.startsWith('•');
      const cleaned = line.replace(/^[•\-\*]\s*/, '').replace(/^\d+[\.\)]\s*/, '').trim();
      if (!cleaned) continue;
      const isHeading = !isBullet && cleaned.endsWith(':') && cleaned.length <= 72;
      scopeEntries.push({ isBullet, isHeading, text: cleaned });
    }

    // If scopeDescription only had a single short summary/inquiry note without bullets,
    // also append distinct deliverables from order.deliverables so nothing is missing
    if (!hasBulletInScope && rawScopeLines.length <= 2 && Array.isArray(order.deliverables) && order.deliverables.length > 0) {
      const lowerScope = (order.scopeDescription || '').toLowerCase();
      for (const deliv of order.deliverables) {
        const cleanDeliv = sanitizePdfText(deliv)
          .replace(/^[•\-\*]\s*/, '')
          .replace(/^\d+[\.\)]\s*/, '')
          .trim();
        if (cleanDeliv && !lowerScope.includes(cleanDeliv.toLowerCase())) {
          scopeEntries.push({ isBullet: true, isHeading: false, text: cleanDeliv });
        }
      }
    }
  } else if (Array.isArray(order.deliverables) && order.deliverables.length > 0) {
    for (const deliv of order.deliverables) {
      const cleanDeliv = sanitizePdfText(deliv)
        .replace(/^[•\-\*]\s*/, '')
        .replace(/^\d+[\.\)]\s*/, '')
        .trim();
      if (cleanDeliv) {
        scopeEntries.push({ isBullet: true, isHeading: false, text: cleanDeliv });
      }
    }
  } else {
    scopeEntries.push({
      isBullet: true,
      isHeading: false,
      text: 'Full-stack high performance custom digital engineering architecture'
    });
  }

  for (const entry of scopeEntries) {
    if (entry.isBullet) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.4);
      const wrapped: string[] = doc.splitTextToSize(entry.text, contentWidth - 8);
      ensureSpace(wrapped.length * 3.85 + 2.2);

      // Crisp royal-blue square bullet
      doc.setFillColor(20, 48, 216);
      doc.rect(margin + 1.5, y - 2.3, 1.7, 1.7, 'F');

      doc.setTextColor(30, 41, 59);
      for (const wLine of wrapped) {
        doc.text(wLine, margin + 5.5, y);
        y += 3.85;
      }
      y += 0.9;
    } else {
      doc.setFont('helvetica', entry.isHeading ? 'bold' : 'normal');
      doc.setFontSize(entry.isHeading ? 7.6 : 7.4);
      const wrapped: string[] = doc.splitTextToSize(entry.text, contentWidth - 3);
      ensureSpace(wrapped.length * 3.85 + 2.4);

      doc.setTextColor(entry.isHeading ? 15 : 51, entry.isHeading ? 23 : 65, entry.isHeading ? 42 : 85);
      for (const wLine of wrapped) {
        doc.text(wLine, margin + 1.5, y);
        y += 3.85;
      }
      y += 1.1;
    }
  }

  // Optional Tech Stack line (matches A4 Studio Preview)
  const cleanTechStack = Array.isArray(order.techStack)
    ? order.techStack.map((t) => sanitizePdfText(t)).filter(Boolean)
    : [];
  if (cleanTechStack.length > 0) {
    const techLine = `Target Architecture & Stack: ${cleanTechStack.join('  •  ')}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.6);
    const wrappedTech: string[] = doc.splitTextToSize(techLine, contentWidth - 4);
    ensureSpace(wrappedTech.length * 3.5 + 2.0);
    doc.setTextColor(71, 85, 105);
    for (const tl of wrappedTech) {
      doc.text(tl, margin + 1.5, y + 0.5);
      y += 3.5;
    }
    y += 1.0;
  }

  y += 2.0;

  // ========================================================
  // SECTION 4.0: 3-STAGE MILESTONE PAYMENT SCHEDULE BOX
  // ========================================================
  ensureSpace(36);
  const scheduleBoxH = 32;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, scheduleBoxH, 1.8, 1.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `SECTION 4.0 — 3-STAGE MILESTONE PAYMENT SCHEDULE (${msSplit.pct1}% / ${msSplit.pct2}% / ${msSplit.pct3}%)`,
    margin + 3.5,
    y + 4.7
  );

  const sec4RightSummary =
    msSplit.selectedStage === 'none'
      ? '0% Paid  •  All 3 Milestones Due'
      : msSplit.selectedStage === 'stage_1'
      ? `Stage 1 Paid (${msSplit.pct1}%)  •  Balance: ${remAmtText}`
      : msSplit.selectedStage === 'stage_2'
      ? `Stages 1 & 2 Paid (${msSplit.paidPct}%)  •  Balance: ${remAmtText}`
      : 'All 3 Milestones Paid (100% Settled)';

  doc.setFontSize(5.7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 48, 216);
  doc.text(sec4RightSummary, pageWidth - margin - 3.5, y + 4.7, {
    align: 'right'
  });

  const innerColW = 56;
  const innerColH = 22.2;
  const colGap = 4;
  const colY = y + 7.2;

  const drawScheduleStageCard = (
    colX: number,
    stageHeading: string,
    amtStr: string,
    descRaw: string,
    isPaid: boolean
  ) => {
    if (isPaid) {
      doc.setFillColor(239, 246, 255); // soft studio blue-50
      doc.setDrawColor(20, 48, 216);
      doc.setLineWidth(0.45);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.35);
    }
    doc.roundedRect(colX, colY, innerColW, innerColH, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.3);
    doc.setTextColor(20, 48, 216);
    doc.text(stageHeading, colX + 2.8, colY + 4.4);

    // Crisp Status Tag in Top-Right (Studio Blue for PAID, Slate for DUE — Zero Green)
    const pillW = 11.6;
    const pillH = 3.7;
    const pillX = colX + innerColW - pillW - 2.4;
    const pillY = colY + 1.7;
    if (isPaid) {
      doc.setFillColor(20, 48, 216);
      doc.roundedRect(pillX, pillY, pillW, pillH, 0.8, 0.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.0);
      doc.setTextColor(255, 255, 255);
      doc.text('PAID', pillX + pillW / 2, pillY + 2.6, { align: 'center' });
    } else {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.roundedRect(pillX, pillY, pillW, pillH, 0.8, 0.8, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.0);
      doc.setTextColor(100, 116, 139);
      doc.text('DUE', pillX + pillW / 2, pillY + 2.6, { align: 'center' });
    }

    doc.setFont('helvetica', 'bold');
    fitFontSizeToWidth(doc, amtStr, innerColW - 5.6, 9.2, 6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(amtStr, colX + 2.8, colY + 9.5);

    const wrappedDesc = doc.splitTextToSize(descRaw, innerColW - 5.6);
    doc.setFontSize(5.6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(isPaid ? 30 : 100, isPaid ? 41 : 116, isPaid ? 59 : 139);
    doc.text(wrappedDesc, colX + 2.8, colY + 13.9);
  };

  const sc1X = margin + 3;
  drawScheduleStageCard(
    sc1X,
    `1. Start / Kickoff (${msSplit.pct1}%)`,
    p1Text,
    'Payable upfront to initiate sprint architecture, database schema & UI design.',
    msSplit.stage1Paid
  );

  const sc2X = sc1X + innerColW + colGap;
  drawScheduleStageCard(
    sc2X,
    `2. Mid / Demo (${msSplit.pct2}%)`,
    p2Text,
    'Payable midway upon interactive prototype demo, walkthrough & feedback.',
    msSplit.stage2Paid
  );

  const sc3X = sc2X + innerColW + colGap;
  drawScheduleStageCard(
    sc3X,
    `3. Final / Code (${msSplit.pct3}%)`,
    p3Text,
    'Payable upon live launch, final review & 100% full source code handover.',
    msSplit.stage3Paid
  );

  doc.setLineWidth(0.4);
  y += scheduleBoxH + 3.8;

  // ========================================================
  // SECTION 5.0: 100% SOURCE CODE, IP TRANSFER & 30-DAY SLA WARRANTY
  // ========================================================
  ensureSpace(16);
  const ipBoxH = 12.8;
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, ipBoxH, 1.5, 1.5, 'FD');

  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(3, 105, 161);
  doc.text(
    'SECTION 5.0 — 100% SOURCE CODE, IP TRANSFER & 30-DAY SLA WARRANTY:',
    margin + 3.5,
    y + 4.1
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.9);
  doc.setTextColor(30, 41, 59);
  const ipText =
    'Upon final Stage 3 settlement, 100% of all source code, design assets, NDA confidentiality, and production deliverables unconditionally transfer to client ownership. Includes 30 calendar days of post-launch technical warranty & rapid bug-fixing SLA.';
  const wrappedIp = doc.splitTextToSize(ipText, contentWidth - 7);
  doc.text(wrappedIp, margin + 3.5, y + 7.9);

  y += ipBoxH + 5.5;

  // ========================================================
  // SECTION 6.0: MUTUAL RATIFICATION & DUAL AUTHORIZED SIGNATURES
  // ========================================================
  ensureSpace(27);
  const sigLineWidth = 76;

  // Stylized Executive Script Signature (Left)
  const adminSigName = sanitizePdfText(order.adminSignatureName) || 'Muhammad Usman Afzal';
  const adminSigRole =
    sanitizePdfText(order.adminSignatureDesignation) ||
    'Founder & Principal Creative Technologist';

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(13);
  doc.setTextColor(20, 48, 216);
  doc.text('Muhammad Usman Afzal', margin, y + 7.5);

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 10.5, margin + sigLineWidth, y + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.3);
  doc.setTextColor(15, 23, 42);
  doc.text(adminSigName, margin, y + 14.5);

  doc.setFontSize(6.6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(adminSigRole, margin, y + 18.3);

  doc.setFontSize(6.1);
  doc.setTextColor(20, 48, 216);
  doc.text('Usman DevHub Tech & Creative Studio  •  hello@usmandevhub.com (Verified)', margin, y + 21.8);

  // Right signature (Client Authorized Signatory)
  const rightSigX = pageWidth - margin - sigLineWidth;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(20, 48, 216);
  doc.text('Digitally Confirmed & Ratified', pageWidth - margin, y + 7.8, { align: 'right' });

  doc.line(rightSigX, y + 10.5, pageWidth - margin, y + 10.5);

  doc.setFont('helvetica', 'bold');
  fitFontSizeToWidth(
    doc,
    cleanCompany ? `${cleanClientName} (${cleanCompany})` : cleanClientName,
    sigLineWidth,
    8.3,
    6.4
  );
  doc.setTextColor(15, 23, 42);
  doc.text(
    cleanCompany ? `${cleanClientName} (${cleanCompany})` : cleanClientName,
    pageWidth - margin,
    y + 14.5,
    { align: 'right' }
  );

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Commissioning Client Authorized Acceptance', pageWidth - margin, y + 18.3, {
    align: 'right'
  });

  doc.setFontSize(6.1);
  doc.setTextColor(100, 116, 139);
  doc.text(`Agreement Ref: ${cleanOrderNumber}   |   ${issueDateStr}`, pageWidth - margin, y + 21.8, {
    align: 'right'
  });

  // ========================================================
  // SECTION 7.0: BOTTOM SECURITY AUDIT FOOTER STRIP (EVERY PAGE)
  // ========================================================
  const totalPages = doc.getNumberOfPages();
  const footerY = pageHeight - margin + 4;
  const safeFooterClient = cleanClientName.toUpperCase().slice(0, 28);

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      `AGREEMENT REF: ${cleanOrderNumber}  •  CLIENT: ${safeFooterClient}${hasReferralToken ? `  •  TOKEN: ${cleanReferralToken}` : '  •  DIRECT CLIENT'}`,
      margin,
      footerY
    );
    doc.text(
      `hello@usmandevhub.com  •  PAGE ${p} OF ${totalPages}`,
      pageWidth - margin,
      footerY,
      { align: 'right' }
    );
  }

  // Official Anti-Tamper Usman DevHub Security Watermark (Permanently Flattened Vector Paths)
  applyWatermarkToAllPages(
    doc,
    pageWidth,
    pageHeight,
    'TECH & CREATIVE STUDIO  •  OFFICIAL STATEMENT OF WORK'
  );

  return doc;
}

/**
 * Downloads an ultra-crisp, publication-grade PDF for the given order agreement.
 * Uses native vector jsPDF by default for razor-sharp typography, exact A4 margins,
 * zero text collisions, and light executive cards on every device (mobile & desktop).
 */
export async function downloadAgreementPdf(
  order: OrderAgreement,
  element?: HTMLElement | null,
  preferVector: boolean = true
): Promise<PdfGenerationResult> {
  const safeClient = (order.clientName || 'Agreement').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${order.orderNumber}_${safeClient}_Agreement.pdf`;

  // First Attempt: Native Vector PDF (Guaranteed pixel-perfect vector A4 layout, zero blur, no canvas memory limits)
  if (preferVector) {
    try {
      const vectorPdf = generateNativeVectorPdf(order);
      const blob = vectorPdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 1500);

      return {
        success: true,
        fileName,
        blobUrl,
        fallbackUsed: false
      };
    } catch (vectorErr) {
      console.warn('Native vector PDF encountered an issue, falling back to html2canvas capture:', vectorErr);
    }
  }

  // Second Attempt: html2canvas DOM snapshot if element is available
  if (element && element.offsetWidth > 0 && element.offsetHeight > 0) {
    try {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollX = window.scrollX || document.documentElement.scrollLeft || 0;

      const pixelCount = element.offsetWidth * element.offsetHeight;
      const safeScale = pixelCount > 4000000 ? 1.5 : 2;

      const canvas = await html2canvas(element, {
        scale: safeScale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: -scrollX,
        scrollY: -scrollY,
        imageTimeout: 6000
      });

      if (canvas.width > 0 && canvas.height > 0) {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfPageWidth = 210;
        const pdfPageHeight = 297;
        const pxPerPage = (canvas.width * pdfPageHeight) / pdfPageWidth;
        const totalPages = Math.max(1, Math.ceil(canvas.height / pxPerPage));

        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }

          const sliceHeight = Math.min(pxPerPage, canvas.height - i * pxPerPage);
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;

          const pageCtx = pageCanvas.getContext('2d');
          if (pageCtx) {
            pageCtx.fillStyle = '#ffffff';
            pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            pageCtx.drawImage(
              canvas,
              0,
              i * pxPerPage,
              canvas.width,
              sliceHeight,
              0,
              0,
              canvas.width,
              sliceHeight
            );

            const pageData = pageCanvas.toDataURL('image/jpeg', 0.96);
            const sliceHeightMm = (sliceHeight * pdfPageWidth) / canvas.width;
            pdf.addImage(pageData, 'JPEG', 0, 0, pdfPageWidth, sliceHeightMm, undefined, 'FAST');
          }
        }

        const blob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 1500);

        return {
          success: true,
          fileName,
          blobUrl,
          fallbackUsed: false
        };
      }
    } catch (canvasErr) {
      console.warn('html2canvas capture encountered an issue, falling back to native vector jsPDF:', canvasErr);
    }
  }

  // Final Attempt: Native Vector fallback
  try {
    const vectorPdf = generateNativeVectorPdf(order);
    const blob = vectorPdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1500);

    return {
      success: true,
      fileName,
      blobUrl,
      fallbackUsed: true
    };
  } catch (err: any) {
    console.error('Vector PDF generation error:', err);
    return {
      success: false,
      fileName,
      error: err?.message || 'Failed to generate PDF'
    };
  }
}

export interface AgreementPdfBundle {
  fileName: string;
  blob: Blob;
  blobUrl: string;
  file: File;
  base64: string;
}

export interface AgreementShortMessages {
  fileName: string;
  subject: string;
  plainBody: string;
  whatsAppBody: string;
}

export interface AgreementDispatchResult {
  sharedNatively: boolean;
  cancelled?: boolean;
  fileName: string;
  blobUrl: string;
  notice: string;
}

export function getAgreementPdfFileName(order: OrderAgreement): string {
  const safeClient = (order.clientName || 'Agreement').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${order.orderNumber}_${safeClient}_Agreement.pdf`;
}

/**
 * Synchronously generates the complete vector A4 Agreement PDF as a Blob, File, Blob URL, and Base64 string.
 * Keeping this synchronous preserves transient user gesture activation for native OS file sharing.
 */
export function generateAgreementPdfBundle(order: OrderAgreement): AgreementPdfBundle {
  const fileName = getAgreementPdfFileName(order);
  const vectorPdf = generateNativeVectorPdf(order);
  const blob = vectorPdf.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const file = new File([blob], fileName, { type: 'application/pdf' });
  const dataUri = vectorPdf.output('datauristring');
  const base64 = dataUri.includes(',') ? dataUri.split(',')[1] : '';

  return {
    fileName,
    blob,
    blobUrl,
    file,
    base64
  };
}

/**
 * Builds crisp short messages for Gmail/Email, WhatsApp, and Instagram DM with ZERO PDF links.
 * References the attached full PDF file directly.
 */
export function buildAgreementShortMessages(
  order: OrderAgreement,
  explicitFileName?: string
): AgreementShortMessages {
  const fileName = explicitFileName || getAgreementPdfFileName(order);
  const srvName = normalizeHomeServiceName(order.service);
  const catName = getHomeServiceCategory(order.service);
  const specName = order.serviceCategory || '';
  const ms = resolveOrderMilestones(order);

  const rawToken = (order.referralToken || '').trim().toUpperCase();
  const hasRef = Boolean(
    rawToken.length >= 4 &&
      rawToken !== 'UDH-REF-' &&
      !['NONE', 'NULL', 'DIRECT', 'NO-TOKEN', 'WITHOUT-REFERENCE'].includes(rawToken)
  );

  const refPlain = hasRef
    ? `Partner Referral Token: ${rawToken}${order.partnerName ? ` (${order.partnerName})` : ''}\n`
    : '';
  const refWhatsApp = hasRef
    ? `*Partner Token:* ${rawToken}${order.partnerName ? ` (${order.partnerName})` : ''}\n`
    : '';

  const paymentStatusPlain =
    ms.selectedStage === 'none'
      ? `Payment Status: Confirmed (0% Paid · Full Schedule Due)`
      : ms.selectedStage === 'stage_3'
      ? `Payment Status: 100% Paid & Settled (${order.currency} ${ms.paidAmt.toLocaleString()})`
      : `Payment Status: ${order.currency} ${ms.paidAmt.toLocaleString()} (${ms.paidPct}%) Paid | Remaining Balance: ${order.currency} ${ms.remainingAmt.toLocaleString()}`;

  const paymentStatusWhatsApp =
    ms.selectedStage === 'none'
      ? `*Payment Status:* Confirmed (0% Paid · Full Schedule Due)`
      : ms.selectedStage === 'stage_3'
      ? `*Payment Status:* 100% Paid & Settled (${order.currency} ${ms.paidAmt.toLocaleString()})`
      : `*Payment Status:* ${order.currency} ${ms.paidAmt.toLocaleString()} (${ms.paidPct}%) Paid | *Balance:* ${order.currency} ${ms.remainingAmt.toLocaleString()}`;

  const subject = `Official Project Agreement (${order.orderNumber}) — ${order.projectTitle} | Usman DevHub`;

  const plainBody =
    `USMAN DEVHUB TECH & CREATIVE STUDIO\n` +
    `Official Project Order & Scope Agreement\n\n` +
    `Salam / Hello ${order.clientName || 'Valued Client'},\n` +
    `Please find your complete official PDF project agreement attached below.\n\n` +
    `Agreement Ref No: ${order.orderNumber}\n` +
    refPlain +
    `Project: ${order.projectTitle}\n` +
    `Service: ${srvName} — ${specName || catName}\n` +
    `Confirmed Total Investment: ${order.currency} ${order.confirmedPrice.toLocaleString()}\n` +
    `${paymentStatusPlain}\n` +
    `Payment Schedule (${ms.pct1}% / ${ms.pct2}% / ${ms.pct3}%):\n` +
    `  • Stage 1 Kickoff (${ms.pct1}%): ${order.currency} ${ms.amt1.toLocaleString()} [${ms.stage1Paid ? 'PAID' : 'Due'}]\n` +
    `  • Stage 2 Mid Demo (${ms.pct2}%): ${order.currency} ${ms.amt2.toLocaleString()} [${ms.stage2Paid ? 'PAID' : 'Due'}]\n` +
    `  • Stage 3 Final Code Delivery (${ms.pct3}%): ${order.currency} ${ms.amt3.toLocaleString()} [${ms.stage3Paid ? 'PAID' : 'Due'}]\n` +
    `Production Timeline: ${order.timeline}\n` +
    `Official PDF Attached: ${fileName}\n\n` +
    `Regards,\nMuhammad Usman Afzal\nFounder & Lead Creative Technologist — Usman DevHub\nWhatsApp: +92 341 2683864 | Email: hello@usmandevhub.com`;

  const whatsAppBody =
    `*USMAN DEVHUB TECH & CREATIVE STUDIO*\n` +
    `*Official Project Order & Scope Agreement*\n\n` +
    `Salam / Hello ${order.clientName || 'Valued Client'},\n` +
    `Please find your complete official PDF project agreement attached with this message.\n\n` +
    `*Agreement Ref No:* ${order.orderNumber}\n` +
    refWhatsApp +
    `*Project:* ${order.projectTitle}\n` +
    `*Service:* ${srvName} (${specName || catName})\n` +
    `*Confirmed Total:* ${order.currency} ${order.confirmedPrice.toLocaleString()}\n` +
    `${paymentStatusWhatsApp}\n` +
    `*Payment Schedule (${ms.pct1}% / ${ms.pct2}% / ${ms.pct3}%):*\n` +
    `  • Stage 1 (${ms.pct1}%): ${order.currency} ${ms.amt1.toLocaleString()} [${ms.stage1Paid ? 'PAID' : 'Due'}]\n` +
    `  • Stage 2 (${ms.pct2}%): ${order.currency} ${ms.amt2.toLocaleString()} [${ms.stage2Paid ? 'PAID' : 'Due'}]\n` +
    `  • Stage 3 (${ms.pct3}%): ${order.currency} ${ms.amt3.toLocaleString()} [${ms.stage3Paid ? 'PAID' : 'Due'}]\n` +
    `*Timeline:* ${order.timeline}\n` +
    `*Official PDF Attached:* ${fileName}\n\n` +
    `_Usman DevHub — High Performance Web & Digital Architecture_`;

  return {
    fileName,
    subject,
    plainBody,
    whatsAppBody
  };
}

function triggerDirectBlobDownload(blobUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 1500);
}

function openChannelHrefSafely(href: string, newTab: boolean = true): void {
  const link = document.createElement('a');
  link.href = href;
  if (newTab) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 400);
}

/**
 * Universal full-PDF + short-message dispatcher for Gmail/Email, WhatsApp, and Instagram.
 * - Never includes any PDF URL/link in the message.
 * - On mobile devices supporting Web Share Level 2, attaches the actual .pdf File + short message directly.
 * - On desktop or sandboxed iframes, immediately downloads the full .pdf File and opens Gmail/WhatsApp/Instagram with the link-free short message ready to attach & send.
 */
export async function dispatchAgreementWithPdf(options: {
  order: OrderAgreement;
  channel: 'email' | 'whatsapp' | 'instagram';
  emailMode?: 'auto' | 'gmail' | 'mailto';
  instagramHandle?: string;
  customText?: string;
  recipientEmail?: string;
  recipientPhone?: string;
}): Promise<AgreementDispatchResult> {
  const {
    order,
    channel,
    emailMode = 'auto',
    instagramHandle = '',
    customText,
    recipientEmail,
    recipientPhone
  } = options;

  // 1. Synchronously build the complete PDF File + link-free short message before any async boundary
  const bundle = generateAgreementPdfBundle(order);
  const { subject, plainBody, whatsAppBody } = buildAgreementShortMessages(order, bundle.fileName);
  const defaultBody = channel === 'whatsapp' ? whatsAppBody : plainBody;
  const messageText = customText && customText.trim() ? customText.trim() : defaultBody;

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(messageText).catch(() => {});
  }

  // Relay full PDF binary + link-free summary via backend email endpoint when dispatching by Email
  const toEmail = (recipientEmail || order.clientEmail || '').trim();
  if (channel === 'email' && order.id) {
    let adminToken = '';
    try {
      adminToken = localStorage.getItem('usman_devhub_admin_token_v1') || '';
    } catch {
      // ignore
    }
    fetch(`/api/orders/${encodeURIComponent(order.id)}/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
      },
      body: JSON.stringify({
        pdfBase64: bundle.base64,
        fileName: bundle.fileName,
        subject,
        plainBody: messageText
      })
    }).catch(() => {});
  }

  // 2. Native OS File Share on Mobile (attaches actual .pdf binary + short text directly to Gmail, WhatsApp, or Instagram)
  const isMobileDevice =
    typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const canSharePdfFile = Boolean(
    isMobileDevice &&
      emailMode !== 'gmail' &&
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [bundle.file] })
  );

  if (canSharePdfFile) {
    try {
      await navigator.share({
        files: [bundle.file],
        title: subject,
        text: messageText
      });
      return {
        sharedNatively: true,
        fileName: bundle.fileName,
        blobUrl: bundle.blobUrl,
        notice: `Full PDF (${bundle.fileName}) & message attached directly!`
      };
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') {
        return {
          sharedNatively: false,
          cancelled: true,
          fileName: bundle.fileName,
          blobUrl: bundle.blobUrl,
          notice: 'Share cancelled.'
        };
      }
      // Fall through to full PDF download + direct channel launch if blocked by iframe permissions
    }
  }

  // 3. Desktop / Fallback: Download the complete .pdf file immediately + open channel with link-free short message
  triggerDirectBlobDownload(bundle.blobUrl, bundle.fileName);

  if (channel === 'email') {
    const useMailto = emailMode === 'mailto' || (emailMode === 'auto' && isMobileDevice);
    if (useMailto) {
      const mailtoHref = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageText)}`;
      openChannelHrefSafely(mailtoHref, false);
    } else {
      const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageText)}`;
      openChannelHrefSafely(gmailHref, true);
    }

    return {
      sharedNatively: false,
      fileName: bundle.fileName,
      blobUrl: bundle.blobUrl,
      notice: toEmail
        ? `Full PDF (${bundle.fileName}) downloaded & Email opened for ${toEmail} — attach PDF & send!`
        : `Full PDF (${bundle.fileName}) downloaded & Email compose opened — attach PDF & send!`
    };
  }

  if (channel === 'whatsapp') {
    const rawDigits = recipientPhone || order.clientPhone || '';
    const digits = rawDigits.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(messageText);
    const waHref = digits.length >= 7 ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    openChannelHrefSafely(waHref, true);

    return {
      sharedNatively: false,
      fileName: bundle.fileName,
      blobUrl: bundle.blobUrl,
      notice: `Full PDF (${bundle.fileName}) downloaded & WhatsApp opened with your message — attach PDF & send!`
    };
  }

  const cleanHandle = instagramHandle.trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9._]/g, '');
  const igHref = cleanHandle
    ? `https://ig.me/m/${cleanHandle}`
    : 'https://www.instagram.com/direct/inbox/';
  openChannelHrefSafely(igHref, true);

  return {
    sharedNatively: false,
    fileName: bundle.fileName,
    blobUrl: bundle.blobUrl,
    notice: cleanHandle
      ? `Full PDF (${bundle.fileName}) downloaded & short message copied! Opening Instagram DM (@${cleanHandle}) — paste & attach PDF.`
      : `Full PDF (${bundle.fileName}) downloaded & short message copied! Paste message & attach PDF inside Instagram DM.`
  };
}

