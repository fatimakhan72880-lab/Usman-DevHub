import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Clock,
  Code2,
  DollarSign
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'timeline' | 'pricing' | 'tech' | 'security';
  icon: React.ReactNode;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How is the project delivery timeline and schedule decided?',
    answer:
      'Project delivery timelines and milestones are tailored specifically to your scope, requirements, and feature complexity. During our direct consultation, we discuss and finalize an exact delivery schedule before work begins.',
    category: 'timeline',
    icon: <Clock className="w-4 h-4 text-[#1430d8]" />,
  },
  {
    id: 'faq-2',
    question: 'Do we own 100% of the source code, 3D assets, and repository?',
    answer:
      'Yes, absolutely. Once final milestone payment is completed, 100% intellectual property, full GitHub repository ownership, Figma design files, 3D assets, and deployment keys are transferred unconditionally to you. We retain zero proprietary locks.',
    category: 'security',
    icon: <FileCheck className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'faq-3',
    question: 'Do you build WordPress and Shopify stores as well as Custom Code?',
    answer:
      'Yes, absolutely! We build all types of websites tailored to your exact business needs. Whether you want a bespoke Custom Code website, a high-converting Shopify / Shopify Plus store, an easy-to-manage WordPress & WooCommerce website, or an interactive Three.js & 3D WebGL experience—we build in any code or platform with high speed, clean architecture, and full support.',
    category: 'tech',
    icon: <Code2 className="w-4 h-4 text-[#0075f7]" />,
  },
  {
    id: 'faq-4',
    question: 'Will 3D WebGL and interactive animations slow down my website or mobile battery?',
    answer:
      'Not with our architecture. We employ GPU-accelerated rendering, procedural texture compression, viewport culling, and low-power fallbacks on mobile. Our 3D experiences consistently achieve 60 FPS while keeping Lighthouse performance scores above 95+ and load times under 1 second.',
    category: 'tech',
    icon: <Sparkles className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'faq-5',
    question: 'How do milestone payments and international transactions work?',
    answer:
      'Every project follows a transparent, client-safe 3-stage payment schedule: 25% at project start to lock your schedule and kick off architecture & design, 35% mid-project upon reviewing the halfway working build or live staging preview, and the remaining 40% upon final project completion, QA approval, and 100% source code handover. International and local transactions are fast and hassle-free via Remitly, Wise, Payoneer, Direct Bank Wire, SadaPay, JazzCash, EasyPaisa, or USDT.',
    category: 'pricing',
    icon: <DollarSign className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'faq-6',
    question: 'Can you sign a mutual Non-Disclosure Agreement (NDA) before we discuss details?',
    answer:
      'Certainly. We routinely sign mutual NDAs before reviewing proprietary pitch decks, product PRDs, or confidential business logic. Your idea, brand strategy, and codebase remain strictly confidential.',
    category: 'security',
    icon: <ShieldCheck className="w-4 h-4 text-[#1430d8]" />,
  },
  {
    id: 'faq-7',
    question: 'What happens after launch? Do you provide post-launch support and bug fixes?',
    answer:
      'Every project includes a complimentary dedicated post-launch warranty covering any bugs or unexpected edge cases. We also offer monthly retainer plans for continuous feature development, security patches, and cloud infrastructure monitoring.',
    category: 'timeline',
    icon: <Sparkles className="w-4 h-4 text-emerald-600" />,
  },
];

interface FAQSectionProps {
  onOpenContact?: (preset?: string) => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onOpenContact }) => {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      className="relative py-10 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden border-t border-neutral-200/80"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl lg:max-w-5xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[10px] sm:text-xs font-semibold text-[#1430d8] mb-2 sm:mb-2.5">
            <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Clear Transparency</span>
          </div>

          <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#0e0e0e] tracking-tight leading-snug">
            Frequently Asked <span className="text-gradient-blue">Questions</span>
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-lg">
            Everything you need to know about our collaboration model, delivery speed, security, and warranties.
          </p>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div
                key={faq.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-blue-50/30 border-[#1430d8]/30 shadow-sm'
                    : 'bg-white hover:bg-neutral-50/80 border-neutral-200/80 hover:border-neutral-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left cursor-pointer focus:outline-hidden"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isOpen ? 'bg-blue-100 text-[#1430d8]' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {faq.icon}
                    </div>
                    <span className="text-xs sm:text-sm md:text-base font-bold text-neutral-900 leading-snug">
                      {faq.question}
                    </span>
                  </div>

                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isOpen ? 'bg-[#1430d8] text-white rotate-180' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-4 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100/80">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
