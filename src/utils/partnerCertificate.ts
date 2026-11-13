import jsPDF, { GState } from 'jspdf';
import { PartnerToken, ReferralRecord, OrderAgreement } from '../types';
import { MAIN_BRAND_VECTOR_OPS, SUBTITLE_VECTOR_OPS } from './watermarkVectorPaths';
import { USMAN_DEVHUB_BRAND_LOGO_BASE64 } from './brandLogoBase64';

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function triggerCanvasDownload(canvas: HTMLCanvasElement, filename: string) {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function drawOfficialHeaderAndSeal(
  ctx: CanvasRenderingContext2D,
  docTypeTitle: string,
  docSubtitle: string,
  refCode: string,
  issueDate: string
) {
  // Outer background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1400, 1020);

  // Main white sheet
  drawRoundedRect(ctx, 40, 40, 1320, 940, 20);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  // Top dark header band
  ctx.save();
  drawRoundedRect(ctx, 40, 40, 1320, 155, 20);
  ctx.clip();
  const grad = ctx.createLinearGradient(40, 40, 1360, 195);
  grad.addColorStop(0, '#0e0e0e');
  grad.addColorStop(0.65, '#111827');
  grad.addColorStop(1, '#1430d8');
  ctx.fillStyle = grad;
  ctx.fillRect(40, 40, 1320, 155);
  ctx.restore();

  // Studio Brand Title
  ctx.fillStyle = '#60a5fa';
  ctx.font = '700 16px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('USMAN DEVHUB TECH & CREATIVE STUDIO', 90, 92);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 34px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(docTypeTitle, 90, 136);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 16px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(docSubtitle, 90, 168);

  // Right side Document Reference metadata
  ctx.textAlign = 'right';
  ctx.fillStyle = '#93c5fd';
  ctx.font = '600 14px monospace';
  ctx.fillText(`REF ID: ${refCode}`, 1310, 102);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 15px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(`Issued: ${issueDate}`, 1310, 132);
  ctx.fillText('Guaranteed Rate: 20% Commission', 1310, 160);
  ctx.textAlign = 'left';
}

function drawSignatureFooter(ctx: CanvasRenderingContext2D, yStart: number) {
  // Divider line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(90, yStart);
  ctx.lineTo(1310, yStart);
  ctx.stroke();

  // Left: Authorized Official Studio Signature
  ctx.fillStyle = '#64748b';
  ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('AUTHORIZED OFFICIAL SIGNATURE & STUDIO GUARANTEE', 90, yStart + 34);

  // Stylized signature stroke + script text
  ctx.fillStyle = '#1430d8';
  ctx.font = 'italic 700 26px Georgia, serif';
  ctx.fillText('Usman DevHub Tech & Creative Studio', 90, yStart + 78);

  // Underline flourish
  ctx.strokeStyle = '#1430d8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, yStart + 90);
  ctx.quadraticCurveTo(320, yStart + 82, 560, yStart + 92);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 16px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Usman DevHub Tech & Creative Studio', 90, yStart + 118);

  ctx.fillStyle = '#475569';
  ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(
    'Official Partner Desk · hello@usmandevhub.com · WhatsApp: +92 341 2683864',
    90,
    yStart + 142
  );

  // Right: Official Verification Seal Box
  drawRoundedRect(ctx, 980, yStart + 24, 330, 118, 14);
  ctx.fillStyle = '#eff6ff';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#bfdbfe';
  ctx.stroke();

  ctx.fillStyle = '#1430d8';
  ctx.font = '800 15px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('VERIFIED 20% PAYOUT PLEDGE', 1004, yStart + 56);

  ctx.fillStyle = '#334155';
  ctx.font = '500 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('• 20% Paid on 25% Start (48h) + 35%/40%', 1004, yStart + 82);
  ctx.fillText('• 3-Way WhatsApp & Invoice Proof', 1004, yStart + 104);
  ctx.fillText('• Lifetime Partner Token Lock', 1004, yStart + 126);
}

export function downloadPartnerAgreementSlip(partner: PartnerToken): void {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 1020;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const issueDate = new Date(partner.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  drawOfficialHeaderAndSeal(
    ctx,
    'Official 20% Partner Commission Agreement',
    'Written Payout & Client Attribution Guarantee Certificate',
    `AGR-${partner.token}`,
    issueDate
  );

  // Partner Credentials Box
  drawRoundedRect(ctx, 90, 225, 1220, 145, 14);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('REGISTERED PARTNER NAME', 120, 260);
  ctx.fillText('UNIQUE PARTNER TOKEN', 530, 260);
  ctx.fillText('PREFERRED PAYOUT CHANNEL', 930, 260);

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(partner.partnerName, 120, 294);

  ctx.fillStyle = '#1430d8';
  ctx.font = '800 24px monospace';
  ctx.fillText(partner.token, 530, 294);

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 18px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(partner.payoutMethod || 'Remitly / Wise / Bank Transfer', 930, 294);

  ctx.fillStyle = '#475569';
  ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(
    `Partner Email: ${partner.partnerEmail}${partner.partnerWhatsApp ? `  ·  WhatsApp: ${partner.partnerWhatsApp}` : ''}  ·  Designated Service: ${partner.targetService || 'Web Development'}${partner.targetCategory ? ` (${partner.targetCategory})` : ''}`,
    120,
    342
  );

  // Binding Terms Section
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Binding Commission & Transparency Terms', 90, 418);

  const clauses = [
    {
      title: '1. Guaranteed 20% Commission on Final Deal Value:',
      body: 'Usman DevHub Tech & Creative Studio guarantees a flat 20% cash commission to the registered Partner on the total agreed and paid project amount for every client attributed under Partner Token ' + partner.token + '.'
    },
    {
      title: '2. Milestone Payout Schedule (5% + 5% + 10% = 20% Total):',
      body: 'Project payments follow a 25% Start, 35% Mid, and 40% Final delivery schedule. Partner receives 5% upon 25% kickoff deposit, 5% upon 35% mid milestone, and 10% upon 40% final delivery—completing your full 20% commission via Remitly, SadaPay, JazzCash, Wise, Payoneer, Bank, or USDT.'
    },
    {
      title: '3. Full 3-Way Group & Client Invoice Verification:',
      body: 'The Partner has the full right to introduce clients via a 3-way WhatsApp group (Partner + Client + Usman DevHub Tech & Creative Studio) or CC email thread, and inspect the official client invoice to verify the exact closed deal value.'
    },
    {
      title: '4. Token-Based Attribution Lock:',
      body: 'Whether the client enters Partner Token ' + partner.token + ' on the website project form, shares it on WhatsApp, or has it attached to their official Studio Agreement, the client is locked to your account.'
    }
  ];

  let cursorY = 456;
  clauses.forEach((clause) => {
    ctx.fillStyle = '#1430d8';
    ctx.font = '700 16px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(clause.title, 90, cursorY);
    cursorY += 25;

    ctx.fillStyle = '#334155';
    ctx.font = '400 15px "Plus Jakarta Sans", system-ui, sans-serif';
    cursorY = wrapCanvasText(ctx, clause.body, 90, cursorY, 1220, 23) + 14;
  });

  drawSignatureFooter(ctx, 795);

  // Usman DevHub official watermark across canvas
  drawCanvasWatermark(ctx, canvas.width, canvas.height, 'TECH & CREATIVE STUDIO • 20% COMMISSION AGREEMENT');

  triggerCanvasDownload(canvas, `Usman-DevHub-Tech-Creative-Studio-Agreement-${partner.token}.png`);
}

export function downloadLeadLockReceipt(referral: ReferralRecord): void {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 1020;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const receiptCode = `LCK-${referral.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;

  drawOfficialHeaderAndSeal(
    ctx,
    'Official Client Lead Lock & 20% Commission Receipt',
    'Timestamped Proof of Client Introduction & Partner Commission Protection',
    receiptCode,
    referral.date
  );

  // Two-column Grid Summary
  drawRoundedRect(ctx, 90, 225, 1220, 240, 14);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  // Row 1
  ctx.fillStyle = '#64748b';
  ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('REFERRED CLIENT / BRAND', 120, 262);
  ctx.fillText('PARTNER & TOKEN ID', 720, 262);

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(
    `${referral.clientName}${referral.clientCompany ? ` (${referral.clientCompany})` : ''}`,
    120,
    296
  );

  ctx.fillStyle = '#1430d8';
  ctx.font = '800 20px monospace';
  ctx.fillText(
    `${referral.partnerName} · ${referral.partnerToken || 'REGISTERED'}`,
    720,
    296
  );

  // Row 2
  const srvName = referral.service || (referral.projectType.includes(' — ') ? referral.projectType.split(' — ')[0].trim() : referral.projectType);
  const catName = referral.category || (referral.projectType.includes(' — ') ? referral.projectType.split(' — ')[1].replace(/\(.*\)/, '').trim() : 'Standard Scope');

  ctx.fillStyle = '#64748b';
  ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('REQUESTED SERVICE & CATEGORY', 120, 360);
  ctx.fillText('ESTIMATED DEAL VALUE', 720, 360);
  ctx.fillText(`PARTNER COMMISSION (${referral.commissionPercentage ?? 20}%)`, 1020, 360);

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 18px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(srvName, 120, 390);

  ctx.fillStyle = '#1430d8';
  ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(`Category / Niche: ${catName}${referral.preferredTech ? `  ·  Tech: ${referral.preferredTech}` : ''}`, 120, 414);

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 24px monospace';
  ctx.fillText(`$${referral.estimatedBudget.toLocaleString()}`, 720, 396);

  ctx.fillStyle = '#1430d8';
  ctx.font = '800 26px monospace';
  ctx.fillText(`$${referral.commissionAmount.toLocaleString()}`, 1020, 396);

  ctx.fillStyle = '#475569';
  ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(
    `Current Deal Stage: ${referral.status.replace('_', ' ').toUpperCase()}  ·  Payout Method: ${referral.payoutMethod || 'Direct Partner Transfer'}`,
    120,
    444
  );

  // Official Guarantee Statement
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Official Lead Protection & Payout Undertaking', 90, 520);

  const notes = [
    `1. Lead Ownership Confirmed: This receipt certifies that client "${referral.clientName}" was introduced for "${srvName}" (Category: "${catName}") by Partner "${referral.partnerName}" (${referral.partnerToken || 'Verified Partner'}) on ${referral.date}.`,
    '2. Milestone Payout Breakdown (5% + 5% + 10% = 20% Total): Client payments follow 25% at project start, 35% mid-project, and 40% on final completion. Partner receives 5% upon the client 25% kickoff deposit (within 48 hours), 5% upon the 35% mid-project demo, and 10% upon the 40% final delivery—completing your full 20% commission on the entire project deal.',
    '3. Final Scope Recalculation & Invoice Proof: If the final closed invoice with the client is higher or adjusted from the initial estimate, your 20% payout is calculated on the actual closed invoice amount, verifiable via client invoice copy or 3-way WhatsApp group.'
  ];

  let yPos = 560;
  notes.forEach((item) => {
    ctx.fillStyle = '#334155';
    ctx.font = '500 16px "Plus Jakarta Sans", system-ui, sans-serif';
    yPos = wrapCanvasText(ctx, item, 90, yPos, 1220, 26) + 18;
  });

  drawSignatureFooter(ctx, 795);

  // Usman DevHub official watermark across canvas
  drawCanvasWatermark(ctx, canvas.width, canvas.height, 'TECH & CREATIVE STUDIO • OFFICIAL CLIENT LEAD LOCK');

  const safeClient = referral.clientName.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 24) || 'Client';
  triggerCanvasDownload(canvas, `Usman-DevHub-Tech-Creative-Studio-Lead-Receipt-${safeClient}.png`);
}

export function downloadPartnerBatchSlip(
  partner: PartnerToken,
  tokensList: string[]
): void {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 1180;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Outer background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1400, 1180);

  // Main white sheet
  drawRoundedRect(ctx, 40, 40, 1320, 1100, 20);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  // Top dark header band
  ctx.save();
  drawRoundedRect(ctx, 40, 40, 1320, 155, 20);
  ctx.clip();
  const grad = ctx.createLinearGradient(40, 40, 1360, 195);
  grad.addColorStop(0, '#0e0e0e');
  grad.addColorStop(0.65, '#111827');
  grad.addColorStop(1, '#1430d8');
  ctx.fillStyle = grad;
  ctx.fillRect(40, 40, 1320, 155);
  ctx.restore();

  // Header Titles
  ctx.fillStyle = '#60a5fa';
  ctx.font = '700 16px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('USMAN DEVHUB TECH & CREATIVE STUDIO', 90, 92);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 32px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('10-Client Tokens Master Manifest & Commission Slip', 90, 136);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 15px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Consolidated Official Multi-Client 20% Payout Agreement', 90, 168);

  // Right Side Meta
  ctx.textAlign = 'right';
  ctx.fillStyle = '#93c5fd';
  ctx.font = '600 14px monospace';
  ctx.fillText(`BATCH: 10-CLIENT PORTFOLIO`, 1310, 102);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 15px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(`Issued: ${issueDate}`, 1310, 132);
  ctx.fillText('Guaranteed Rate: 20% per Milestone', 1310, 160);
  ctx.textAlign = 'left';

  // Partner Summary Header Card
  drawRoundedRect(ctx, 90, 220, 1220, 115, 14);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('REGISTERED PARTNER NAME', 120, 252);
  ctx.fillText('REGISTERED EMAIL', 500, 252);
  ctx.fillText('PAYOUT CHANNEL', 880, 252);

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(partner.partnerName, 120, 284);

  ctx.fillStyle = '#1430d8';
  ctx.font = '700 18px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(partner.partnerEmail, 500, 284);

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 17px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(partner.payoutMethod || 'Remitly / Wise / Bank Transfer', 880, 284);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(`Active Batch: ${tokensList.length} of 10 Client Slots Filled  ·  Each token carries an independent 20% milestone commission lock`, 120, 318);

  // Section Title: 10 Client Token Slots Grid
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('10 Individual Client Tokens (1 Token = 1 Client Deal Lock)', 90, 365);

  // Render 10 slots (2 columns of 5)
  const col1X = 90;
  const col2X = 710;
  const cardW = 600;
  const cardH = 76;
  const startY = 385;
  const gapY = 86;

  for (let i = 0; i < 10; i++) {
    const col = i < 5 ? 0 : 1;
    const row = i % 5;
    const x = col === 0 ? col1X : col2X;
    const y = startY + row * gapY;
    const tokenCode = tokensList[i];

    drawRoundedRect(ctx, x, y, cardW, cardH, 12);
    if (tokenCode) {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#bfdbfe';
      ctx.stroke();

      // Slot Badge
      drawRoundedRect(ctx, x + 14, y + 14, 58, 22, 6);
      ctx.fillStyle = '#eff6ff';
      ctx.fill();
      ctx.fillStyle = '#1430d8';
      ctx.font = '800 11px monospace';
      ctx.fillText(`SLOT #${String(i + 1).padStart(2, '0')}`, x + 20, y + 29);

      // Token Code
      ctx.fillStyle = '#1430d8';
      ctx.font = '800 20px monospace';
      ctx.fillText(tokenCode, x + 84, y + 33);

      // 20% Guarantee Tag
      ctx.fillStyle = '#059669';
      ctx.font = '700 12px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('20% Guaranteed', x + cardW - 130, y + 32);

      // Token Attribution Note
      ctx.fillStyle = '#64748b';
      ctx.font = '500 12px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('Official Partner Token Code — Share code directly (no link required)', x + 16, y + 60);
    } else {
      // Empty / Reserved slot
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(`Slot #${String(i + 1).padStart(2, '0')} — Reserved for Next Client`, x + 20, y + 44);
    }
  }

  // Legal Guarantee statement
  const termsY = startY + 5 * gapY + 12;
  ctx.fillStyle = '#334155';
  ctx.font = '500 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(
    '• Each token above locks a separate client exclusively to your account. 20% commission is paid across milestones (25% start, 35% mid, 40% final).',
    90,
    termsY
  );
  ctx.fillText(
    '• Once this 10-token batch is utilized or printed, you can start a new 10-token batch while this master manifest remains permanent legal proof.',
    90,
    termsY + 22
  );

  drawSignatureFooter(ctx, 925);

  // Usman DevHub official watermark across canvas
  drawCanvasWatermark(ctx, canvas.width, canvas.height, 'TECH & CREATIVE STUDIO • 10-TOKENS MANIFEST');

  const safePartner = partner.partnerName.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 24) || 'Partner';
  triggerCanvasDownload(canvas, `Usman-DevHub-Tech-Creative-Studio-10-Tokens-Batch-${safePartner}.png`);
}

function triggerPdfBlobDownload(doc: jsPDF, fileName: string): void {
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
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
    URL.revokeObjectURL(blobUrl);
  }, 5000);
}

/**
 * Draws an official, subtle watermark across canvas slips before saving.
 */
function drawCanvasWatermark(
  ctx: CanvasRenderingContext2D,
  width: number = 1400,
  height: number = 1020,
  subtext: string = 'TECH & CREATIVE STUDIO  •  OFFICIAL PARTNER VERIFICATION'
): void {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 7);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(20, 48, 216, 0.045)';
  ctx.font = '900 86px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('USMAN DEVHUB', 0, -8);
  ctx.font = '700 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(subtext, 0, 36);
  ctx.restore();
}

/**
 * Draws the official three-group double-line watermark diagonally across the full PDF page.
 *
 * Structure on every page:
 *   Line 1 (Main Brand Name): "Usman DevHub" (Larger, bold, visually dominant)
 *   Line 2 (Subtitle):        "Tech & Creative Studio" (Smaller, normal weight, directly underneath)
 *
 * Full-Page Diagonal Placement & Size Hierarchy:
 *   - TOP GROUP:    Positioned towards UPPER-LEFT; smaller font size.
 *   - CENTER GROUP: Positioned at the exact middle of the page diagonal; noticeably larger & most prominent.
 *   - BOTTOM GROUP: Positioned towards LOWER-RIGHT; smaller font size, identical to TOP GROUP.
 *   - All three reference centers lie along the upper-left to lower-right page diagonal with
 *     mathematically equal spacing: distance(TOP, CENTER) === distance(CENTER, BOTTOM).
 *   - Dynamically detects each page's actual dimensions and scales proportionally when needed
 *     so all watermark text stays cleanly within page boundaries.
 */
export function drawUsmanDevHubPdfWatermark(
  doc: jsPDF,
  fallbackPageWidth: number = 210,
  fallbackPageHeight: number = 297,
  _customSubtext?: string
): void {
  const MAIN_BRAND_LINE = 'Usman DevHub';
  const SUBTITLE_LINE = 'Tech & Creative Studio';
  const ANGLE_DEG = 35;

  const prevFont = typeof doc.getFont === 'function' ? doc.getFont() : null;
  const prevFontSize = typeof doc.getFontSize === 'function' ? doc.getFontSize() : null;
  const prevTextColor = typeof doc.getTextColor === 'function' ? doc.getTextColor() : null;

  doc.saveGraphicsState?.();

  // Dynamically detect actual dimensions and unit scale of the active PDF page
  const actualWidth =
    doc.internal?.pageSize?.getWidth?.() || fallbackPageWidth || 210;
  const actualHeight =
    doc.internal?.pageSize?.getHeight?.() || fallbackPageHeight || 297;
  const scaleFactor: number =
    (doc.internal as any)?.scaleFactor || 72 / 25.4; // page units -> PDF points (1/72 in)
  const ptToUnit = 1 / scaleFactor; // PDF points -> page units

  // Reference A4 portrait dimensions in PDF points (210mm x 297mm)
  const A4_WIDTH_PT = 210 * (72 / 25.4);
  const A4_HEIGHT_PT = 297 * (72 / 25.4);
  const pageWidthPt = actualWidth * scaleFactor;
  const pageHeightPt = actualHeight * scaleFactor;

  const rawPageScale = Math.min(
    pageWidthPt / A4_WIDTH_PT,
    pageHeightPt / A4_HEIGHT_PT
  );
  const pageScale = rawPageScale < 0.96 || rawPageScale > 1.08 ? rawPageScale : 1;

  // Size Hierarchy:
  // - CENTER GROUP: significantly larger & most prominent (66pt bold / 21pt normal on A4)
  // - TOP & BOTTOM GROUPS: kept at exact smaller size (26pt bold / 10.5pt normal on A4)
  let centerMainPt = 66 * pageScale;
  let centerSubPt = 21 * pageScale;
  let outerMainPt = 26 * pageScale;
  let outerSubPt = 10.5 * pageScale;

  // Full-Page Diagonal Placement from UPPER-LEFT -> CENTER -> LOWER-RIGHT:
  // Symmetric vector offset (+/- dx, +/- dy) from exact page center guarantees
  // collinear diagonal alignment and mathematically equal spacing:
  // hypot(dx, dy) === distance(TOP, CENTER) === distance(CENTER, BOTTOM)
  const cxCenter = actualWidth * 0.5;
  const cyCenter = actualHeight * 0.5;
  const dx = actualWidth * 0.27;
  const dy = actualHeight * 0.27;

  const cxTop = cxCenter - dx;
  const cyTop = cyCenter - dy;
  const cxBottom = cxCenter + dx;
  const cyBottom = cyCenter + dy;

  const rad = (ANGLE_DEG * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);
  const CAP_HEIGHT_RATIO = 0.718; // Exact Helvetica cap-height ratio

  const measureGroupMetrics = (mPt: number, sPt: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(mPt);
    const w1 = doc.getTextWidth(MAIN_BRAND_LINE);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(sPt);
    const w2 = doc.getTextWidth(SUBTITLE_LINE);

    const h1 = mPt * CAP_HEIGHT_RATIO * ptToUnit;
    const h2 = sPt * CAP_HEIGHT_RATIO * ptToUnit;
    const perpGap = h1 * 0.28; // Tight gap keeping subtitle paired directly underneath main brand
    const totalH = h1 + perpGap + h2;
    const maxW = Math.max(w1, w2);

    const halfRotW = maxW * 0.5 * cosA + totalH * 0.5 * sinA;
    const halfRotH = maxW * 0.5 * sinA + totalH * 0.5 * cosA;

    return { mPt, sPt, w1, w2, h1, h2, perpGap, totalH, halfRotW, halfRotH };
  };

  let centerMetrics = measureGroupMetrics(centerMainPt, centerSubPt);
  let outerMetrics = measureGroupMetrics(outerMainPt, outerSubPt);

  // Independent boundary clamps so outer groups stay untouched while center group never clips page edges
  const maxOuterHalfW = cxTop - actualWidth * 0.05;
  const maxOuterHalfH = cyTop - actualHeight * 0.05;
  const outerClamp = Math.min(
    1,
    maxOuterHalfW / outerMetrics.halfRotW,
    maxOuterHalfH / outerMetrics.halfRotH
  );
  if (outerClamp > 0 && outerClamp < 1) {
    outerMainPt *= outerClamp;
    outerSubPt *= outerClamp;
    outerMetrics = measureGroupMetrics(outerMainPt, outerSubPt);
  }

  const maxCenterHalfW = actualWidth * 0.44;
  const maxCenterHalfH = actualHeight * 0.44;
  const perpStepDist = Math.abs(dx * sinA + dy * cosA);
  const maxCenterHalfThickness = Math.max(
    centerMetrics.totalH * 0.5,
    perpStepDist * 0.8 - outerMetrics.totalH * 0.5
  );
  const centerClamp = Math.min(
    1,
    maxCenterHalfW / centerMetrics.halfRotW,
    maxCenterHalfH / centerMetrics.halfRotH,
    maxCenterHalfThickness / (centerMetrics.totalH * 0.5)
  );
  if (centerClamp > 0 && centerClamp < 1) {
    centerMainPt *= centerClamp;
    centerSubPt *= centerClamp;
    centerMetrics = measureGroupMetrics(centerMainPt, centerSubPt);
  }

  let hasGState = false;
  try {
    const GStateCtor = GState || (doc as any).GState;
    if (GStateCtor && typeof (doc as any).setGState === 'function') {
      (doc as any).setGState(new GStateCtor({ opacity: 0.075 }));
      hasGState = true;
    }
  } catch {
    hasGState = false;
  }

  // Subtle semi-transparent royal-slate tint (exact 20/255, 48/255, 216/255 or fallback 228, 234, 247)
  const fillRgbCmd = hasGState
    ? '0.07843 0.18824 0.84706 rg'
    : '0.89412 0.91765 0.96863 rg';

  const emitFlattenedVectorLine = (
    vectorOps: string,
    xUnit: number,
    yUnit: number,
    fontPt: number
  ) => {
    const s = fontPt / 1000;
    const a = (s * cosA).toFixed(6);
    const b = (s * sinA).toFixed(6);
    const c = (-s * sinA).toFixed(6);
    const d = (s * cosA).toFixed(6);
    const tx = (xUnit * scaleFactor).toFixed(4);
    const ty = ((actualHeight - yUnit) * scaleFactor).toFixed(4);
    (doc.internal as any).write(
      `q ${fillRgbCmd} ${a} ${b} ${c} ${d} ${tx} ${ty} cm ${vectorOps} Q`
    );
  };

  const drawGroupAtCenter = (
    groupCx: number,
    groupCy: number,
    m: ReturnType<typeof measureGroupMetrics>
  ) => {
    // Perpendicular baseline offsets from group geometric center along downward normal (+sinA, +cosA)
    const p1 = -m.totalH * 0.5 + m.h1; // Line 1 ("Usman DevHub") baseline
    const p2 = m.totalH * 0.5;         // Line 2 ("Tech & Creative Studio") baseline

    // Line 1: Main Brand Name ("Usman DevHub") — Permanently flattened non-selectable vector paths
    const x1 = groupCx + p1 * sinA - m.w1 * 0.5 * cosA;
    const y1 = groupCy + p1 * cosA + m.w1 * 0.5 * sinA;
    emitFlattenedVectorLine(MAIN_BRAND_VECTOR_OPS, x1, y1, m.mPt);

    // Line 2: Subtitle ("Tech & Creative Studio") — Permanently flattened non-selectable vector paths
    const x2 = groupCx + p2 * sinA - m.w2 * 0.5 * cosA;
    const y2 = groupCy + p2 * cosA + m.w2 * 0.5 * sinA;
    emitFlattenedVectorLine(SUBTITLE_VECTOR_OPS, x2, y2, m.sPt);
  };

  // 1. TOP GROUP (Upper-Left area — smaller size)
  drawGroupAtCenter(cxTop, cyTop, outerMetrics);

  // 2. CENTER GROUP (Middle of diagonal — noticeably larger & most prominent)
  drawGroupAtCenter(cxCenter, cyCenter, centerMetrics);

  // 3. BOTTOM GROUP (Lower-Right area — smaller size, identical to TOP GROUP)
  drawGroupAtCenter(cxBottom, cyBottom, outerMetrics);

  doc.restoreGraphicsState?.();

  if (prevFont?.fontName) {
    doc.setFont(prevFont.fontName, prevFont.fontStyle || 'normal');
  }
  if (typeof prevFontSize === 'number') {
    doc.setFontSize(prevFontSize);
  }
  if (typeof prevTextColor === 'string' && prevTextColor) {
    doc.setTextColor(prevTextColor);
  }
}

/**
 * Iterates through every page in the PDF document, detects each page's actual dimensions
 * and orientation dynamically, and applies the three double-line watermarks.
 */
export function applyWatermarkToAllPages(
  doc: jsPDF,
  fallbackPageWidth: number = 210,
  fallbackPageHeight: number = 297,
  customSubtext?: string
): void {
  const totalPages = doc.getNumberOfPages();
  const originalPage = (doc.internal as any).getCurrentPageInfo?.()?.pageNumber || 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const pageWidth = doc.internal?.pageSize?.getWidth?.() || fallbackPageWidth;
    const pageHeight = doc.internal?.pageSize?.getHeight?.() || fallbackPageHeight;
    drawUsmanDevHubPdfWatermark(doc, pageWidth, pageHeight, customSubtext);
  }
  doc.setPage(originalPage);
}

function buildPartnerTokenPdfDoc(
  partner: PartnerToken,
  linkedDeals: ReferralRecord[] = [],
  linkedOrders: OrderAgreement[] = [],
  archiveSlotNumber?: number
): { doc: jsPDF; fileName: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const issueDate = partner.createdAt
    ? new Date(partner.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

  // Top Royal Blue & Cyan Ribbon
  doc.setFillColor(20, 48, 216);
  doc.rect(0, 0, pageWidth * 0.72, 3.5, 'F');
  doc.setFillColor(0, 194, 255);
  doc.rect(pageWidth * 0.72, 0, pageWidth * 0.28, 3.5, 'F');

  // Render official company logo on TOP LEFT of Partner Certificate
  if (USMAN_DEVHUB_BRAND_LOGO_BASE64) {
    try {
      doc.addImage(USMAN_DEVHUB_BRAND_LOGO_BASE64, 'PNG', margin, 14.5, 21, 14);
    } catch {
      // ignore
    }
  }

  const centerX = pageWidth / 2; // 105mm (A4 center)

  // 1. Centered Official Classification Pill Badge
  let y = 7.5;
  const pillW = 148;
  const pillH = 5.6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(centerX - pillW / 2, y, pillW, pillH, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.4);
  doc.setTextColor(20, 48, 216);
  doc.text(
    'OFFICIAL 20% REFERRAL PARTNER TOKEN & COMMISSION CERTIFICATE',
    centerX,
    y + 3.8,
    { align: 'center' }
  );

  // 2. Centered Grand Studio Brand Title
  y = 20.2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('USMAN DEVHUB', centerX, y, { align: 'center' });

  // 3. Centered Studio Tagline & Discipline
  y = 25.2;
  doc.setFontSize(8.2);
  doc.setTextColor(20, 48, 216); // Royal Blue
  doc.text('TECH & CREATIVE STUDIO  •  HIGH-PERFORMANCE DIGITAL ARCHITECTURE', centerX, y, { align: 'center' });

  // 4. Centered Executive Credentials & Contact Line
  y = 29.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    'Founder & Lead Technologist: Muhammad Usman Afzal   |   WhatsApp: +92 341 2683864   |   Email: hello@usmandevhub.com',
    centerX,
    y,
    { align: 'center' }
  );

  // 5. Centered Executive Token & Guarantee Highlight Card (Balanced 3-column banner)
  y = 33.2;
  const cardH = 13.5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, cardH, 1.5, 1.5, 'FD');

  // Top accent line in highlight card
  doc.setFillColor(20, 48, 216);
  doc.rect(margin + 0.4, y + 0.4, contentWidth - 0.8, 1, 'F');

  // Left Column: Official Token Code
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text('UNIQUE PARTNER TOKEN CODE', margin + 5, y + 5.2);

  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 48, 216);
  doc.text(partner.token, margin + 5, y + 10.8);

  // Vertical divider 1
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin + 57, y + 2.8, margin + 57, y + 12.2);

  // Center Column: Registry & Issuance
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'OFFICIAL PARTNER REGISTRY',
    centerX,
    y + 5.2,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text(`Issued: ${issueDate}  •  Permanent Unique Identity`, centerX, y + 10.5, { align: 'center' });

  // Vertical divider 2
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 57, y + 2.8, pageWidth - margin - 57, y + 12.2);

  // Right Column: Commission Lock
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(5, 150, 105);
  doc.text('COMMISSION GUARANTEE', pageWidth - margin - 5, y + 5.2, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105);
  doc.text('20% ON ALL MILESTONES', pageWidth - margin - 5, y + 10.8, { align: 'right' });

  // Section Separator Line
  y = 49.5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(margin, y, pageWidth - margin, y);

  // Section 1: Registered Partner Identity & Payout Card
  y = 53.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1. REGISTERED PARTNER & PAYOUT CREDENTIALS', margin, y);

  y += 3.5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, y, contentWidth, 33, 1.8, 1.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.3);
  doc.setTextColor(100, 116, 139);
  doc.text('PARTNER FULL NAME', margin + 4, y + 6);
  doc.text('REGISTERED GMAIL / EMAIL', margin + 68, y + 6);
  doc.text('DESIGNATED PAYOUT METHOD', margin + 132, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text((partner.partnerName || 'Verified Partner').slice(0, 32), margin + 4, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(20, 48, 216);
  doc.text((partner.partnerEmail || 'hello@usmandevhub.com').slice(0, 36), margin + 68, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.3);
  doc.setTextColor(15, 23, 42);
  const payoutLines = doc.splitTextToSize(partner.payoutMethod || 'Remitly / Wise / Bank Transfer', 46);
  doc.text(payoutLines[0] || 'Remitly / Wise / Bank Transfer', margin + 132, y + 12);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, y + 16.5, margin + contentWidth - 4, y + 16.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.3);
  doc.setTextColor(100, 116, 139);
  doc.text('OFFICIAL PARTNER TOKEN CODE', margin + 4, y + 21.5);
  doc.text('DESIGNATED SERVICE & SCOPE', margin + 68, y + 21.5);
  doc.text('WHATSAPP / CONTACT', margin + 132, y + 21.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(20, 48, 216);
  doc.text(`${partner.token}`, margin + 4, y + 27.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(20, 48, 216);
  const srvFullLabel = `${partner.targetService || 'Web Development'}${partner.targetCategory ? ` · ${partner.targetCategory}` : ''}`;
  doc.text(srvFullLabel.slice(0, 36), margin + 68, y + 27.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);
  doc.text(partner.partnerWhatsApp || 'Verified via Direct Email', margin + 132, y + 27.5);

  // Section 2: Linked Client Agreements / Deals (if any)
  y += 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('2. TOKEN ATTRIBUTION & LINKED CLIENT STATUS', margin, y);

  y += 3.5;
  const combinedRows: Array<{
    client: string;
    refNo: string;
    service: string;
    category: string;
    budget: string;
    commission: string;
    stage: string;
  }> = [];

  linkedOrders.forEach((ord) => {
    combinedRows.push({
      client: ord.clientName || 'Client Agreement',
      refNo: ord.orderNumber,
      service: ord.service || ord.projectTitle,
      category: ord.serviceCategory || 'Standard',
      budget: `${ord.currency} ${(ord.confirmedPrice || 0).toLocaleString()}`,
      commission: `${ord.currency} ${(ord.commissionAmount || Math.round((ord.confirmedPrice || 0) * 0.2)).toLocaleString()}`,
      stage: (ord.status || 'confirmed').replace(/_/g, ' ').toUpperCase()
    });
  });

  linkedDeals.forEach((dl) => {
    const alreadyCovered = combinedRows.some(
      (r) => r.client.toLowerCase() === (dl.clientName || '').toLowerCase()
    );
    if (!alreadyCovered) {
      const s = dl.service || (dl.projectType?.includes(' — ') ? dl.projectType.split(' — ')[0].trim() : dl.projectType);
      const c = dl.category || (dl.projectType?.includes(' — ') ? dl.projectType.split(' — ')[1].replace(/\(.*\)/, '').trim() : 'Standard');
      combinedRows.push({
        client: dl.clientName,
        refNo: dl.orderNumber || 'Lead Logged',
        service: s || 'Project Inquiry',
        category: c || 'Standard',
        budget: `$${(dl.estimatedBudget || 0).toLocaleString()}`,
        commission: `$${(dl.commissionAmount || 0).toLocaleString()}`,
        stage: dl.status.replace(/_/g, ' ').toUpperCase()
      });
    }
  });

  if (combinedRows.length === 0) {
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(margin, y, contentWidth, 16, 1.6, 1.6, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(20, 48, 216);
    doc.text(`Active Token ${partner.token} — Ready for Client Attribution`, margin + 4, y + 6.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text(
      'Share your Partner Token code above with your client (or mention it in Agreement / WhatsApp) to lock your 20% commission across all milestones.',
      margin + 4,
      y + 12
    );
    y += 22;
  } else {
    const rowH = 8.5;
    const tableH = 8 + Math.min(combinedRows.length, 5) * rowH;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, tableH, 1.5, 1.5, 'FD');

    doc.setFillColor(241, 245, 249);
    doc.rect(margin + 0.3, y + 0.3, contentWidth - 0.6, 7.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.0);
    doc.setTextColor(71, 85, 105);
    doc.text('CLIENT NAME', margin + 3, y + 5);
    doc.text('AGREEMENT REF', margin + 37, y + 5);
    doc.text('SERVICE', margin + 73, y + 5);
    doc.text('CATEGORY / SCOPE', margin + 111, y + 5);
    doc.text('DEAL VALUE', margin + 147, y + 5);
    doc.text('20% PAYOUT', margin + 165, y + 5);

    combinedRows.slice(0, 5).forEach((r, idx) => {
      const ry = y + 8 + idx * rowH;
      if (idx > 0) {
        doc.setDrawColor(241, 245, 249);
        doc.line(margin + 2, ry, margin + contentWidth - 2, ry);
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      doc.text(r.client.slice(0, 18), margin + 3, ry + 5.5);

      doc.setFont('courier', 'bold');
      doc.setFontSize(6.4);
      doc.setTextColor(20, 48, 216);
      doc.text(r.refNo.slice(0, 18), margin + 37, ry + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text(r.service.slice(0, 20), margin + 73, ry + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(r.category.slice(0, 19), margin + 111, ry + 5.5);

      doc.setFont('courier', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(r.budget, margin + 147, ry + 5.5);

      doc.setTextColor(5, 150, 105);
      doc.text(r.commission, margin + 165, ry + 5.5);
    });

    y += tableH + 6;
  }

  // Section 3: 3-Stage Milestone Commission Structure
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('3. GUARANTEED 20% MILESTONE COMMISSION PAYOUT SCHEDULE', margin, y);

  y += 3.5;
  const colW = (contentWidth - 6) / 3;
  const stages = [
    {
      badge: 'STAGE 1  •  25% KICKOFF',
      title: '5% Partner Payout',
      desc: 'Transferred within 48 hours once client clears the 25% project kickoff deposit.'
    },
    {
      badge: 'STAGE 2  •  35% MID DEMO',
      title: '5% Partner Payout',
      desc: 'Transferred upon interactive prototype walkthrough and 35% milestone clearance.'
    },
    {
      badge: 'STAGE 3  •  40% DELIVERY',
      title: '10% Partner Payout',
      desc: 'Transferred upon final launch & 40% settlement, completing your 20% full commission.'
    }
  ];

  stages.forEach((st, idx) => {
    const sx = margin + idx * (colW + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.roundedRect(sx, y, colW, 24, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(20, 48, 216);
    doc.text(st.badge, sx + 3, y + 5.5);

    doc.setFontSize(8.2);
    doc.setTextColor(15, 23, 42);
    doc.text(st.title, sx + 3, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(71, 85, 105);
    const wrapped = doc.splitTextToSize(st.desc, colW - 6);
    doc.text(wrapped, sx + 3, y + 15.5);
  });

  y += 31;

  // Section 4: Binding Terms & Protection Clauses
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('4. OFFICIAL PARTNER PROTECTION & VERIFICATION TERMS', margin, y);

  y += 4;
  const clauses = [
    `1. Permanent Unique Token Identity: Token "${partner.token}" is permanently unique to this issuance and will never be reissued or duplicated for any other partner.`,
    '2. Fixed 20% Commission Guarantee: Applies across Web Development, 3D Animated Websites, E-Commerce, Graphic Design, 3D Video Animation, Cloud Setup, and Maintenance.',
    '3. Full Invoice Transparency: Partners may verify closed contract value via the official Client Order Agreement Reference No. or 3-way WhatsApp group.',
    '4. Direct Global Payouts: Disbursed via Remitly, SadaPay, JazzCash, EasyPaisa, Wise, Payoneer, Direct Bank Wire, or USDT (TRC20) with zero hidden studio fees.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(51, 65, 85);
  clauses.forEach((cl) => {
    const lines = doc.splitTextToSize(cl, contentWidth - 2);
    doc.text(lines, margin + 1, y);
    y += lines.length * 3.8 + 1.8;
  });

  // Section 5: Authorized Executive Signature Block
  const sigY = Math.max(y + 6, 236);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, sigY, contentWidth, 34, 1.8, 1.8, 'FD');

  // Studio Signatory
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHORIZED STUDIO EXECUTIVE SIGNATURE', margin + 5, sigY + 6);

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(14);
  doc.setTextColor(20, 48, 216);
  doc.text('Muhammad Usman Afzal', margin + 5, sigY + 15);

  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 5, sigY + 17.5, margin + 82, sigY + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Muhammad Usman Afzal — Founder & Lead Technologist', margin + 5, sigY + 22.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.6);
  doc.setTextColor(71, 85, 105);
  doc.text('Usman DevHub Tech & Creative Studio  •  hello@usmandevhub.com  •  +92 341 2683864', margin + 5, sigY + 27);

  // Partner Counter-Party Block
  const rightX = margin + 98;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text('REGISTERED REFERRAL PARTNER', rightX, sigY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text((partner.partnerName || 'Verified Partner').slice(0, 32), rightX, sigY + 15);

  doc.setDrawColor(148, 163, 184);
  doc.line(rightX, sigY + 17.5, margin + contentWidth - 5, sigY + 17.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 48, 216);
  doc.text(`Token: ${partner.token}`, rightX, sigY + 22.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.6);
  doc.setTextColor(71, 85, 105);
  doc.text((partner.partnerEmail || '').slice(0, 42), rightX, sigY + 27);

  // Footer Stamp
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.3);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `USMAN DEVHUB OFFICIAL PARTNER CERTIFICATE  •  UNIQUE TOKEN: ${partner.token}`,
    margin,
    pageHeight - 8.5
  );
  doc.setTextColor(20, 48, 216);
  doc.text('Page 1 of 1  •  Verified 20% Commission Lock', pageWidth - margin, pageHeight - 8.5, {
    align: 'right'
  });

  const safePartner = (partner.partnerName || 'Partner').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 28);
  // Official Anti-Tamper Usman DevHub Security Watermark
  applyWatermarkToAllPages(
    doc,
    pageWidth,
    pageHeight,
    'TECH & CREATIVE STUDIO  •  OFFICIAL PARTNER CERTIFICATE'
  );

  return {
    doc,
    fileName: `${partner.token}_${safePartner}_Token_Agreement.pdf`
  };
}

/**
 * Generates and downloads an official, publication-grade A4 Vector PDF Certificate
 * for an individual Partner Token (UDH-...).
 */
export function downloadPartnerTokenPdf(
  partner: PartnerToken,
  linkedDeals: ReferralRecord[] = [],
  linkedOrders: OrderAgreement[] = [],
  archiveSlotNumber?: number
): void {
  const { doc, fileName } = buildPartnerTokenPdfDoc(
    partner,
    linkedDeals,
    linkedOrders,
    archiveSlotNumber
  );
  triggerPdfBlobDownload(doc, fileName);
}

/**
 * Shares the full Partner Token Official 20% Slip PDF alongside a link-free short WhatsApp message.
 * Uses native OS file sharing on mobile (attaching the actual .pdf file + short message)
 * and falls back to downloading the full .pdf + launching WhatsApp with the link-free short message on desktop.
 */
export async function sharePartnerTokenPdfOnWhatsApp(
  partner: PartnerToken,
  linkedDeals: ReferralRecord[] = [],
  linkedOrders: OrderAgreement[] = [],
  archiveSlotNumber?: number,
  options?: { customText?: string; recipientPhone?: string }
): Promise<{ sharedNatively: boolean; cancelled?: boolean; fileName: string }> {
  const { doc, fileName } = buildPartnerTokenPdfDoc(
    partner,
    linkedDeals,
    linkedOrders,
    archiveSlotNumber
  );
  const pdfBlob = doc.output('blob');
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

  const shortMessage =
    options?.customText ||
    `*USMAN DEVHUB TECH & CREATIVE STUDIO*\n` +
      `*Official 20% Partner Token Certificate*\n\n` +
      `Need a website, e-commerce store, or 3D web experience from Usman DevHub Tech & Creative Studio?\n` +
      `Enter my official Partner Token on the project form: *${partner.token}*\n` +
      `*Service Scope:* ${partner.targetService || 'Web & Digital Architecture'}${partner.targetCategory ? ` (${partner.targetCategory})` : ''}\n` +
      `*Official PDF Attached:* ${fileName}`;

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(shortMessage).catch(() => {});
  }

  const isMobileDevice =
    typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const canSharePdfFile = Boolean(
    isMobileDevice &&
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [pdfFile] })
  );

  if (canSharePdfFile) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Usman DevHub Partner Token (${partner.token})`,
        text: shortMessage
      });
      return { sharedNatively: true, fileName };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { sharedNatively: false, cancelled: true, fileName };
      }
    }
  }

  triggerPdfBlobDownload(doc, fileName);

  const digits = options?.recipientPhone ? options.recipientPhone.replace(/[^0-9]/g, '') : '';
  const encoded = encodeURIComponent(shortMessage);
  const waHref = digits.length >= 7 ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;

  const link = document.createElement('a');
  link.href = waHref;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 400);

  return { sharedNatively: false, fileName };
}

export interface PartnerTokenDispatchResult {
  sharedNatively: boolean;
  cancelled?: boolean;
  fileName: string;
  blobUrl?: string;
  notice: string;
}

function normalizeReferralToken(raw?: string): string {
  if (!raw) return '';
  return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

export function buildPartnerTokenDefaultMessages(
  partner: PartnerToken,
  fileName?: string
): { whatsAppBody: string; emailSubject: string; emailBody: string; instagramBody: string } {
  const cleanTok = normalizeReferralToken(partner.token) || partner.token;
  const actualFileName = fileName || `UDH-Partner-Token-${cleanTok}.pdf`;

  const whatsAppBody =
    `*USMAN DEVHUB TECH & CREATIVE STUDIO*\n` +
    `*Official 20% Partner Token Certificate*\n\n` +
    `Salam / Hello ${partner.partnerName || 'Partner'},\n` +
    `Please find your official 20% Partner Token Certificate attached.\n\n` +
    `*Partner Token:* ${cleanTok}\n` +
    `*Authorized Partner:* ${partner.partnerName || 'Registered Partner'}\n` +
    `*Royalty Guarantee:* 20% On Every Client Project\n` +
    `*Service Focus:* ${partner.targetService || 'Web, 3D & Digital Architecture'}${partner.targetCategory ? ` (${partner.targetCategory})` : ''}\n` +
    `*Official PDF Attached:* ${actualFileName}\n\n` +
    `_Usman DevHub — High Performance Digital Engineering_`;

  const emailSubject = `Official 20% Partner Token Certificate (${cleanTok}) — Usman DevHub`;

  const emailBody =
    `USMAN DEVHUB TECH & CREATIVE STUDIO\n` +
    `Official 20% Partner Token Certificate\n\n` +
    `Hello ${partner.partnerName || 'Partner'},\n\n` +
    `Please find your official 20% Partner Token Certificate attached for token: ${cleanTok}.\n\n` +
    `• Partner Token: ${cleanTok}\n` +
    `• Partner Name: ${partner.partnerName || 'Registered Partner'}\n` +
    `• Royalty Rate: 20% milestone commission on every closed deal\n` +
    `• Authorized Service: ${partner.targetService || 'All Digital Services'}${partner.targetCategory ? ` (${partner.targetCategory})` : ''}\n` +
    `• Official PDF Document Attached: ${actualFileName}\n\n` +
    `Regards,\nMuhammad Usman Afzal\nFounder & Lead Creative Technologist — Usman DevHub\nWhatsApp: +92 341 2683864 | Email: hello@usmandevhub.com`;

  const instagramBody =
    `Salam / Hello ${partner.partnerName || 'Partner'}! Here is your official 20% Partner Token Certificate (${cleanTok}) from Usman DevHub Tech & Creative Studio. Attached complete PDF: ${actualFileName}`;

  return { whatsAppBody, emailSubject, emailBody, instagramBody };
}

/**
 * Universal dispatcher for Partner Token PDF + custom text message across WhatsApp, Gmail/Email, and Instagram.
 */
export async function dispatchPartnerTokenWithPdf(options: {
  partner: PartnerToken;
  channel: 'whatsapp' | 'email' | 'instagram';
  linkedDeals?: ReferralRecord[];
  linkedOrders?: OrderAgreement[];
  archiveSlotNumber?: number;
  customText?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  instagramHandle?: string;
  emailMode?: 'auto' | 'gmail' | 'mailto';
}): Promise<PartnerTokenDispatchResult> {
  const {
    partner,
    channel,
    linkedDeals = [],
    linkedOrders = [],
    archiveSlotNumber,
    customText,
    recipientPhone,
    recipientEmail,
    instagramHandle = '',
    emailMode = 'auto'
  } = options;

  const { doc, fileName } = buildPartnerTokenPdfDoc(
    partner,
    linkedDeals,
    linkedOrders,
    archiveSlotNumber
  );
  const pdfBlob = doc.output('blob');
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdfBlob);

  const defaults = buildPartnerTokenDefaultMessages(partner, fileName);
  const defaultBody =
    channel === 'whatsapp'
      ? defaults.whatsAppBody
      : channel === 'instagram'
      ? defaults.instagramBody
      : defaults.emailBody;
  const messageText = customText && customText.trim() ? customText.trim() : defaultBody;

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(messageText).catch(() => {});
  }

  // 1. Mobile Web Share with PDF File
  const isMobileDevice =
    typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const canSharePdfFile = Boolean(
    isMobileDevice &&
      emailMode !== 'gmail' &&
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [pdfFile] })
  );

  if (canSharePdfFile) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: defaults.emailSubject,
        text: messageText
      });
      return {
        sharedNatively: true,
        fileName,
        blobUrl,
        notice: `Full Token PDF (${fileName}) & message attached directly!`
      };
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') {
        return {
          sharedNatively: false,
          cancelled: true,
          fileName,
          blobUrl,
          notice: 'Share cancelled.'
        };
      }
    }
  }

  // 2. Desktop Fallback: Trigger full PDF download
  triggerPdfBlobDownload(doc, fileName);

  const openLinkSafely = (href: string) => {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
    }, 400);
  };

  if (channel === 'whatsapp') {
    const rawDigits = recipientPhone || partner.partnerWhatsApp || '';
    const digits = rawDigits.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(messageText);
    const waHref = digits.length >= 7 ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    openLinkSafely(waHref);
    return {
      sharedNatively: false,
      fileName,
      blobUrl,
      notice: `Full Token PDF (${fileName}) downloaded & WhatsApp opened with your message — attach PDF & send!`
    };
  }

  if (channel === 'email') {
    const toEmail = (recipientEmail || partner.partnerEmail || '').trim();
    const subject = defaults.emailSubject;
    const useMailto = emailMode === 'mailto' || (emailMode === 'auto' && isMobileDevice);
    if (useMailto) {
      const mailtoHref = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageText)}`;
      openLinkSafely(mailtoHref);
    } else {
      const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageText)}`;
      openLinkSafely(gmailHref);
    }
    return {
      sharedNatively: false,
      fileName,
      blobUrl,
      notice: toEmail
        ? `Full Token PDF (${fileName}) downloaded & Email opened for ${toEmail} — attach PDF & send!`
        : `Full Token PDF (${fileName}) downloaded & Email compose opened — attach PDF & send!`
    };
  }

  // Instagram
  const cleanHandle = (instagramHandle || '').trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9._]/g, '');
  const igHref = cleanHandle ? `https://ig.me/m/${cleanHandle}` : 'https://www.instagram.com/direct/inbox/';
  openLinkSafely(igHref);
  return {
    sharedNatively: false,
    fileName,
    blobUrl,
    notice: cleanHandle
      ? `Full Token PDF (${fileName}) downloaded & message copied! Opening Instagram DM (@${cleanHandle}) — paste & attach PDF.`
      : `Full Token PDF (${fileName}) downloaded & message copied! Paste message & attach PDF in Instagram DM.`
  };
}

/**
 * Generates and downloads an official A4 Vector PDF for a partner's active Partner Tokens slip.
 */
export function downloadPartnerBatchTokensPdf(
  partner: PartnerToken,
  tokensList: string[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const activeTokens = tokensList;
  const totalCount = activeTokens.length;

  const drawManifestHeader = (pageNum: number) => {
    doc.setFillColor(20, 48, 216);
    doc.rect(0, 0, pageWidth * 0.72, 3.5, 'F');
    doc.setFillColor(0, 194, 255);
    doc.rect(pageWidth * 0.72, 0, pageWidth * 0.28, 3.5, 'F');

    // Render official company logo on TOP LEFT of Partner Tokens Certificate
    if (USMAN_DEVHUB_BRAND_LOGO_BASE64) {
      try {
        doc.addImage(USMAN_DEVHUB_BRAND_LOGO_BASE64, 'PNG', margin, 7.5, 18, 12);
      } catch {
        // ignore
      }
    }

    const centerX = pageWidth / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text('USMAN DEVHUB — OFFICIAL PARTNER TOKENS CERTIFICATE', centerX, 13.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(20, 48, 216);
    doc.text(
      `Partner: ${partner.partnerName} (${partner.partnerEmail})  •  Active Tokens: ${totalCount}  •  Issued: ${issueDate}  •  Page ${pageNum}`,
      centerX,
      19,
      { align: 'center' }
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Official 20% Commission Guarantee: Every Partner Token below is permanently unique and locks 20% commission across all client milestones.',
      centerX,
      24,
      { align: 'center' }
    );

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.line(margin, 28, pageWidth - margin, 28);
  };

  let pageNum = 1;
  drawManifestHeader(pageNum);
  let y = 33;

  activeTokens.forEach((tok, idx) => {
    if (y + 16 > pageHeight - 44) {
      doc.addPage();
      pageNum += 1;
      drawManifestHeader(pageNum);
      y = 33;
    }

    const tokenNumber = totalCount - idx; // #1 oldest to #totalCount newest
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.32);
    doc.roundedRect(margin, y, contentWidth, 14.5, 1.4, 1.4, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(20, 48, 216);
    doc.text(`#${String(tokenNumber).padStart(2, '0')}`, margin + 3.5, y + 6);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(tok, margin + 26, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(5, 150, 105);
    doc.text('20% Commission Guaranteed', pageWidth - margin - 4, y + 6, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.9);
    doc.setTextColor(71, 85, 105);
    const srvScope = `${partner.targetService || 'Web Development'}${partner.targetCategory ? ` · ${partner.targetCategory}` : ''}`;
    doc.text(`Partner: ${partner.partnerName}  •  Scope: ${srvScope}  •  Use Token Code Directly (No Link Needed)`, margin + 3.5, y + 11.6);

    y += 16.5;
  });

  // Signature Footer on final page
  if (y + 34 > pageHeight - 12) {
    doc.addPage();
    pageNum += 1;
    drawManifestHeader(pageNum);
    y = 36;
  }
  const sigY = Math.max(y + 4, 244);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, sigY, contentWidth, 30, 1.8, 1.8, 'FD');
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(13);
  doc.setTextColor(20, 48, 216);
  doc.text('Muhammad Usman Afzal', margin + 5, sigY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Founder & Lead Creative Technologist — Usman DevHub Tech & Creative Studio', margin + 5, sigY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('hello@usmandevhub.com  •  WhatsApp: +92 341 2683864  •  Every token above is permanently unique.', margin + 5, sigY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.3);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Usman DevHub Official Partner Tokens Certificate  •  ${totalCount} Active Token${totalCount === 1 ? '' : 's'}`,
    margin,
    pageHeight - 8
  );

  const safePartner = (partner.partnerName || 'Partner').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24);
  // Official Anti-Tamper Usman DevHub Security Watermark
  applyWatermarkToAllPages(
    doc,
    pageWidth,
    pageHeight,
    'OFFICIAL PARTNER TOKENS CERTIFICATE  •  20% GUARANTEED'
  );

  triggerPdfBlobDownload(doc, `Usman_DevHub_Partner_Tokens_${safePartner}.pdf`);
}

/**
 * Downloads a consolidated Admin Master Register PDF of all active Partner Tokens (up to 100).
 */
export function downloadAdminTokensRegisterPdf(
  tokens: PartnerToken[],
  referrals: ReferralRecord[] = [],
  orders: OrderAgreement[] = []
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const total = tokens.length;

  const drawHeader = (pageNum: number) => {
    doc.setFillColor(20, 48, 216);
    doc.rect(0, 0, pageWidth * 0.72, 3, 'F');
    doc.setFillColor(0, 194, 255);
    doc.rect(pageWidth * 0.72, 0, pageWidth * 0.28, 3, 'F');

    // Render official company logo on TOP LEFT of Register
    if (USMAN_DEVHUB_BRAND_LOGO_BASE64) {
      try {
        doc.addImage(USMAN_DEVHUB_BRAND_LOGO_BASE64, 'PNG', margin, 5.5, 15, 10);
      } catch {
        // ignore
      }
    }

    const centerX = pageWidth / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('USMAN DEVHUB — OFFICIAL PARTNER TOKENS REGISTER (PERMANENT ARCHIVE)', centerX, 12, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Active Stored Tokens: ${total} Total (Permanent Archive • No Auto-Deletion)  •  hello@usmandevhub.com  •  WhatsApp: +92 341 2683864  •  Page ${pageNum}`,
      centerX,
      17,
      { align: 'center' }
    );

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, 20, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(51, 65, 85);
    doc.text('#', margin + 2, 24.7);
    doc.text('PARTNER TOKEN', margin + 11, 24.7);
    doc.text('PARTNER NAME & EMAIL', margin + 48, 24.7);
    doc.text('SERVICE & CATEGORY', margin + 98, 24.7);
    doc.text('LINKED CLIENT / STATUS', margin + 144, 24.7);
    doc.text('DATE', margin + 184, 24.7);
  };

  let pageNum = 1;
  drawHeader(pageNum);
  let y = 29;

  tokens.forEach((pt, idx) => {
    if (y + 9 > pageHeight - 14) {
      doc.addPage();
      pageNum += 1;
      drawHeader(pageNum);
      y = 29;
    }

    const chronoNum = total - idx; // #1 oldest .. #total newest
    const cleanTok = pt.token.trim().toUpperCase();
    const linkedOrder = orders.find(
      (o) => (o.referralToken || '').trim().toUpperCase() === cleanTok
    );
    const linkedDeal = referrals.find(
      (r) => (r.partnerToken || '').trim().toUpperCase() === cleanTok
    );

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 1, contentWidth, 8.2, 'F');
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`#${chronoNum}`, margin + 2, y + 4.3);

    doc.setTextColor(20, 48, 216);
    doc.text(cleanTok.slice(0, 18), margin + 11, y + 4.3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `${(pt.partnerName || 'Partner').slice(0, 14)} (${(pt.partnerEmail || '').slice(0, 16)})`,
      margin + 48,
      y + 4.3
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.3);
    doc.setTextColor(20, 48, 216);
    const srvCat = `${pt.targetService || 'Web Dev'}${pt.targetCategory ? ` · ${pt.targetCategory}` : ''}`;
    doc.text(srvCat.slice(0, 24), margin + 98, y + 4.3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.3);
    doc.setTextColor(51, 65, 85);
    const linkedLabel = linkedOrder
      ? `${(linkedOrder.clientName || 'Client').slice(0, 10)} · ${linkedOrder.orderNumber}`
      : linkedDeal
      ? `${linkedDeal.clientName.slice(0, 12)} (${linkedDeal.status})`
      : 'Ready / Unassigned';
    doc.text(linkedLabel.slice(0, 22), margin + 144, y + 4.3);

    const dateStr = pt.createdAt ? pt.createdAt.slice(0, 10) : '';
    doc.text(dateStr, margin + 184, y + 4.3);

    y += 8.2;
  });

  // Official Anti-Tamper Usman DevHub Security Watermark
  applyWatermarkToAllPages(
    doc,
    pageWidth,
    pageHeight,
    'ADMIN MASTER REGISTER  •  OFFICIAL VERIFIED'
  );

  triggerPdfBlobDownload(
    doc,
    `Usman_DevHub_Partner_Tokens_Register_${total}_Saved.pdf`
  );
}

/**
 * Downloads a consolidated Admin Master Register PDF of all active Order Agreements / Reference Nos.
 */
export function downloadAdminAgreementsRegisterPdf(orders: OrderAgreement[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const total = orders.length;

  const drawHeader = (pageNum: number) => {
    doc.setFillColor(20, 48, 216);
    doc.rect(0, 0, pageWidth * 0.72, 3, 'F');
    doc.setFillColor(0, 194, 255);
    doc.rect(pageWidth * 0.72, 0, pageWidth * 0.28, 3, 'F');

    // Render official company logo on TOP LEFT of Register
    if (USMAN_DEVHUB_BRAND_LOGO_BASE64) {
      try {
        doc.addImage(USMAN_DEVHUB_BRAND_LOGO_BASE64, 'PNG', margin, 5.5, 15, 10);
      } catch {
        // ignore
      }
    }

    const centerX = pageWidth / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('USMAN DEVHUB — AGREEMENT REFERENCE NO. REGISTER (PERMANENT ARCHIVE)', centerX, 12, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Active Stored Agreements: ${total} Total (Permanent Archive • No Auto-Deletion)  •  hello@usmandevhub.com  •  WhatsApp: +92 341 2683864  •  Page ${pageNum}`,
      centerX,
      17,
      { align: 'center' }
    );

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, 20, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(51, 65, 85);
    doc.text('#', margin + 2, 24.7);
    doc.text('AGREEMENT REF NO.', margin + 12, 24.7);
    doc.text('CLIENT NAME', margin + 58, 24.7);
    doc.text('PARTNER TOKEN / TYPE', margin + 102, 24.7);
    doc.text('AMOUNT', margin + 148, 24.7);
    doc.text('DATE', margin + 170, 24.7);
  };

  let pageNum = 1;
  drawHeader(pageNum);
  let y = 29;

  orders.forEach((ord, idx) => {
    if (y + 9 > pageHeight - 14) {
      doc.addPage();
      pageNum += 1;
      drawHeader(pageNum);
      y = 29;
    }

    const chronoNum = total - idx; // #1 oldest .. #total newest
    const hasTok = Boolean(ord.referralToken && ord.referralToken.trim().length >= 4);

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 1, contentWidth, 8.2, 'F');
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`#${chronoNum}`, margin + 2, y + 4.3);

    doc.setTextColor(20, 48, 216);
    doc.text((ord.orderNumber || '').slice(0, 24), margin + 12, y + 4.3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text((ord.clientName || 'Unnamed Client').slice(0, 22), margin + 58, y + 4.3);

    doc.setFont(hasTok ? 'courier' : 'helvetica', hasTok ? 'bold' : 'normal');
    doc.setTextColor(hasTok ? 20 : 100, hasTok ? 48 : 116, hasTok ? 216 : 139);
    doc.text(hasTok ? ord.referralToken!.trim().toUpperCase().slice(0, 22) : 'Direct (No Token)', margin + 102, y + 4.3);

    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${ord.currency} ${(ord.confirmedPrice || 0).toLocaleString()}`, margin + 148, y + 4.3);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text((ord.agreementDate || ord.createdAt || '').slice(0, 10), margin + 170, y + 4.3);

    y += 8.2;
  });

  // Official Anti-Tamper Usman DevHub Security Watermark
  applyWatermarkToAllPages(
    doc,
    pageWidth,
    pageHeight,
    'MASTER AGREEMENT REGISTER  •  OFFICIAL SOW'
  );

  triggerPdfBlobDownload(
    doc,
    `Usman_DevHub_Agreements_Ref_Register_${total}_Saved.pdf`
  );
}
