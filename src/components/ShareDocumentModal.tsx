import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MessageCircle,
  Mail,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Send,
  Phone
} from 'lucide-react';
import { OrderAgreement, PartnerToken, ReferralRecord } from '../types';
import {
  dispatchAgreementWithPdf,
  buildAgreementShortMessages,
  getAgreementPdfFileName
} from '../utils/pdfGenerator';
import {
  dispatchPartnerTokenWithPdf,
  buildPartnerTokenDefaultMessages
} from '../utils/partnerCertificate';
import { normalizeReferralToken } from '../services/storageService';

export type ShareChannel = 'whatsapp' | 'email';

export interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'agreement' | 'token';
  order?: OrderAgreement | null;
  partner?: PartnerToken | null;
  linkedDeals?: ReferralRecord[];
  linkedOrders?: OrderAgreement[];
  chronoSlot?: number;
  initialChannel?: ShareChannel;
  onDispatched?: (notice: string) => void;
}

export const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  isOpen,
  onClose,
  documentType,
  order,
  partner,
  linkedDeals = [],
  linkedOrders = [],
  chronoSlot,
  initialChannel = 'whatsapp',
  onDispatched
}) => {
  const [activeChannel, setActiveChannel] = useState<ShareChannel>(initialChannel);
  const [recipientContact, setRecipientContact] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [copiedText, setCopiedText] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Sync initial channel when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveChannel(initialChannel);
    }
  }, [isOpen, initialChannel]);

  // Determine actual file name
  const pdfFileName =
    documentType === 'agreement' && order
      ? getAgreementPdfFileName(order)
      : partner
      ? `UDH-Partner-Token-${normalizeReferralToken(partner.token) || partner.token}.pdf`
      : 'Document.pdf';

  // Get default message for document type & channel
  const getDefaultMessageForChannel = (ch: ShareChannel): string => {
    if (documentType === 'agreement' && order) {
      const msgs = buildAgreementShortMessages(order, pdfFileName);
      if (ch === 'whatsapp') return msgs.whatsAppBody;
      return msgs.plainBody;
    }
    if (documentType === 'token' && partner) {
      const msgs = buildPartnerTokenDefaultMessages(partner, pdfFileName);
      if (ch === 'whatsapp') return msgs.whatsAppBody;
      return msgs.emailBody;
    }
    return '';
  };

  // Get default contact for channel
  const getDefaultContactForChannel = (ch: ShareChannel): string => {
    if (documentType === 'agreement' && order) {
      if (ch === 'whatsapp') return order.clientPhone || '';
      if (ch === 'email') return order.clientEmail || '';
      return '';
    }
    if (documentType === 'token' && partner) {
      if (ch === 'whatsapp') return partner.partnerWhatsApp || '';
      if (ch === 'email') return partner.partnerEmail || '';
      return '';
    }
    return '';
  };

  // When active channel or document changes, update message text & contact
  useEffect(() => {
    if (!isOpen) return;
    setMessageText(getDefaultMessageForChannel(activeChannel));
    setRecipientContact(getDefaultContactForChannel(activeChannel));
  }, [isOpen, activeChannel, documentType, order?.id, partner?.token]);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(messageText);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2200);
      }
    } catch {
      // ignore
    }
  };

  const handleResetDefault = () => {
    setMessageText(getDefaultMessageForChannel(activeChannel));
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      if (documentType === 'agreement' && order) {
        const res = await dispatchAgreementWithPdf({
          order,
          channel: activeChannel,
          customText: messageText,
          recipientPhone: activeChannel === 'whatsapp' ? recipientContact : undefined,
          recipientEmail: activeChannel === 'email' ? recipientContact : undefined
        });
        if (onDispatched) {
          onDispatched(res.notice);
        }
        onClose();
      } else if (documentType === 'token' && partner) {
        const res = await dispatchPartnerTokenWithPdf({
          partner,
          channel: activeChannel,
          linkedDeals,
          linkedOrders,
          archiveSlotNumber: chronoSlot,
          customText: messageText,
          recipientPhone: activeChannel === 'whatsapp' ? recipientContact : undefined,
          recipientEmail: activeChannel === 'email' ? recipientContact : undefined
        });
        if (onDispatched) {
          onDispatched(res.notice);
        }
        onClose();
      }
    } finally {
      setIsSending(false);
    }
  };

  const documentTitle =
    documentType === 'agreement'
      ? `Agreement PDF (${order?.orderNumber || 'Official Order'})`
      : `Partner Token PDF (${partner?.token || 'Official Certificate'})`;

  const recipientLabel =
    activeChannel === 'whatsapp'
      ? 'Recipient WhatsApp / Phone Number'
      : 'Recipient Email (Gmail Compose)';

  const recipientPlaceholder =
    activeChannel === 'whatsapp'
      ? '+92 341 ... or client phone number'
      : 'client@example.com';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        >
          {/* Top Decorative Header */}
          <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-blue-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-white uppercase truncate font-display">
                    Send {documentTitle}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider shrink-0">
                    With Full PDF
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  WhatsApp &amp; Gmail • Custom Message Text • Complete High-Res PDF Attached
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
            {/* 1. WhatsApp & Gmail Channels */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Select Send Channel
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={() => setActiveChannel('whatsapp')}
                  className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                    activeChannel === 'whatsapp'
                      ? 'border-emerald-500 bg-emerald-50/80 shadow-sm text-emerald-950 ring-2 ring-emerald-400/30'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 ${
                      activeChannel === 'whatsapp'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black">WhatsApp</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Text + Full PDF</span>
                </button>

                {/* Gmail */}
                <button
                  type="button"
                  onClick={() => setActiveChannel('email')}
                  className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                    activeChannel === 'email'
                      ? 'border-blue-600 bg-blue-50/80 shadow-sm text-blue-950 ring-2 ring-blue-400/30'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 ${
                      activeChannel === 'email'
                        ? 'bg-[#1430d8] text-white shadow-xs'
                        : 'bg-blue-100 text-[#1430d8]'
                    }`}
                  >
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black">Gmail</span>
                  <span className="text-[10px] text-blue-700 font-medium">Compose + Full PDF</span>
                </button>
              </div>
            </div>

            {/* 2. Recipient Contact Info */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                2. {recipientLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {activeChannel === 'whatsapp' ? (
                    <Phone className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Mail className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <input
                  type="text"
                  value={recipientContact}
                  onChange={(e) => setRecipientContact(e.target.value)}
                  placeholder={recipientPlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>
            </div>

            {/* 3. Text Message Area ("ek text ki jagah ai aur wo bhi sath mein send ho") */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                    3. Accompanying Message Text (Editable)
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    Sath Mein Send Hoga
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedText ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Reset to official template text"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={6}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type or customize your message text here..."
                  className="w-full p-3 text-xs font-sans text-slate-900 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:border-[#1430d8] focus:ring-2 focus:ring-blue-100 focus:outline-none resize-y leading-relaxed"
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                <span>Ye message aur poori PDF sath dispatch hogi.</span>
                <span>{messageText.length} characters</span>
              </div>
            </div>

            {/* 4. Complete PDF Attachment Card ("aur uske sath pdf poori") */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 flex items-center justify-center shrink-0 shadow-xs text-rose-600">
                  <FileText className="w-5 h-5 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 truncate">
                      {pdfFileName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                      Poori PDF Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">
                    Official publication-grade A4 PDF document will download &amp; attach automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-200/70 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSending}
              onClick={handleSend}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer ${
                activeChannel === 'whatsapp'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-[#1430d8] hover:bg-[#0075f7] shadow-blue-500/20'
              }`}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparing &amp; Sending...</span>
                </>
              ) : activeChannel === 'whatsapp' ? (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span>Send WhatsApp + Full PDF</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send via Gmail + Full PDF</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
