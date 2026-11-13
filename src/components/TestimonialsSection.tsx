import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  Quote,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Globe2,
  PenLine,
  X,
  Send,
  ShieldCheck,
  HeartHandshake,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { ClientReview } from '../types';
import { getReviews, saveClientReview } from '../services/storageService';
import { detectFlagFromLocation } from '../utils/countryFlags';

interface TestimonialsSectionProps {
  onOpenContact: (
    preset?: string,
    categoryPreset?: string,
    options?: { instant?: boolean; targetForm?: boolean }
  ) => void;
}

const SERVICE_OPTIONS = [
  'Web Development',
  '3D Animated Websites',
  'E-Commerce Development',
  'Graphic Design',
  '3D Video Animation',
  'Website Deployment & Cloud Setup',
  'Website Maintenance'
];

const StarRatingTrack: React.FC<{ rating: number; sizeClass?: string }> = ({
  rating,
  sizeClass = 'w-3.5 h-3.5'
}) => (
  <div
    className="inline-flex items-center gap-0.5"
    aria-label={`${Number(rating).toFixed(1)} out of 5 stars`}
  >
    {[1, 2, 3, 4, 5].map((star) => {
      const isFull = rating >= star;
      const isHalf = !isFull && rating >= star - 0.5;
      return (
        <span key={star} className={`relative inline-flex ${sizeClass} shrink-0`}>
          <Star className={`${sizeClass} text-neutral-200 fill-neutral-200`} />
          {isFull && (
            <Star className={`absolute inset-0 ${sizeClass} text-amber-400 fill-amber-400`} />
          )}
          {isHalf && (
            <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
              <Star className={`${sizeClass} text-amber-400 fill-amber-400 shrink-0`} />
            </span>
          )}
        </span>
      );
    })}
  </div>
);

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ onOpenContact }) => {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_COUNT = 6;

  // Review Form state
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRole, setReviewerRole] = useState('');
  const [reviewerLocation, setReviewerLocation] = useState('');
  const [reviewerProjectType, setReviewerProjectType] = useState(SERVICE_OPTIONS[0]);
  const [reviewerRating, setReviewerRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewerQuote, setReviewerQuote] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const loadApprovedReviews = () => {
    const all = getReviews();
    setReviews(all.filter((r) => r.status === 'approved'));
  };

  useEffect(() => {
    loadApprovedReviews();
    const handleUpdate = () => loadApprovedReviews();
    window.addEventListener('usman_agency_data_updated', handleUpdate);
    return () => window.removeEventListener('usman_agency_data_updated', handleUpdate);
  }, []);

  // Compute live averages
  const totalApproved = reviews.length;
  const averageRating =
    totalApproved > 0
      ? (
          Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalApproved) * 10) / 10
        ).toFixed(1)
      : '4.8';

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!reviewerName.trim()) {
      setFormError('Please enter your name.');
      return;
    }
    if (!reviewerQuote.trim() || reviewerQuote.trim().length < 15) {
      setFormError('Please provide a short review (at least 15 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      saveClientReview({
        name: reviewerName.trim(),
        role: reviewerRole.trim() || undefined,
        location: reviewerLocation.trim() || 'Worldwide',
        flag: detectFlagFromLocation(reviewerLocation.trim()),
        projectType: reviewerProjectType,
        quote: reviewerQuote.trim(),
        rating: reviewerRating
      });

      setIsSubmitting(false);
      setIsSubmittedSuccess(true);
    } catch {
      setIsSubmitting(false);
      setFormError('Failed to submit review. Please try again.');
    }
  };

  const resetForm = () => {
    setReviewerName('');
    setReviewerRole('');
    setReviewerLocation('');
    setReviewerProjectType(SERVICE_OPTIONS[0]);
    setReviewerRating(5);
    setReviewerQuote('');
    setFormError('');
    setIsSubmittedSuccess(false);
    setIsDropdownOpen(false);
    setIsReviewModalOpen(false);
  };

  return (
    <section
      id="reviews"
      className="relative py-10 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8 bg-[#fbfbfe] overflow-hidden border-t border-neutral-200/70"
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/3 -left-40 w-96 h-96 bg-[#1430d8]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-[#0075f7]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl xl:max-w-[1400px] mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[10px] sm:text-xs font-semibold text-[#1430d8] mb-2 sm:mb-2.5">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Proven Track Record &amp; Client Success</span>
          </div>

          <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#0e0e0e] tracking-tight leading-snug">
            Trusted by Founders, <span className="text-gradient-blue">Driven by Results</span>
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-xl">
            Here is what international brand leaders and startup founders say about our engineering standards, execution quality, and communication.
          </p>

          {/* Social Proof Badges & Rate Experience Button */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs text-neutral-600 font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-200/80 shadow-xs">
              <StarRatingTrack rating={Number(averageRating)} />
              <span className="font-bold text-neutral-900 tabular-nums">{averageRating} / 5.0</span>
              <span className="text-neutral-500">• {totalApproved} Verified Reviews</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-200/80 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-neutral-900">100% Job Success</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-200/80 shadow-xs">
              <Globe2 className="w-4 h-4 text-[#0075f7]" />
              <span className="font-bold text-neutral-900">Clients Worldwide</span>
            </div>

            {/* Client "Leave a Review" Button */}
            <button
              type="button"
              onClick={() => {
                setIsSubmittedSuccess(false);
                setIsReviewModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#1430d8] border border-blue-200/80 font-bold text-xs shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Leave a Review</span>
            </button>
          </div>
        </div>

        {/* Testimonials Grid */}
        {(() => {
          const visibleReviews = isExpanded ? reviews : reviews.slice(0, INITIAL_COUNT);
          const hasMoreReviews = reviews.length > INITIAL_COUNT;

          const handleToggleExpand = () => {
            if (isExpanded) {
              // User clicked "Show Less Reviews":
              // 1. Calculate the exact position of the last visible card (#6, index INITIAL_COUNT - 1)
              const lastCardIndex = INITIAL_COUNT - 1;
              const lastCardEl = document.getElementById(`review-card-${lastCardIndex}`);

              let targetY = 0;
              if (lastCardEl) {
                const rect = lastCardEl.getBoundingClientRect();
                const navbarOffset = 90;
                targetY = Math.max(0, window.scrollY + rect.top - navbarOffset);
              }

              // 2. Temporarily disable any CSS scroll animation so it snaps FORAN (instantly) without scrolling from bottom to top
              const prevBehavior = document.documentElement.style.scrollBehavior;
              document.documentElement.style.scrollBehavior = 'auto';

              if (targetY > 0) {
                window.scrollTo({
                  top: targetY,
                  left: 0,
                  behavior: 'instant' as ScrollBehavior
                });
              }

              // 3. Immediately collapse the extra reviews
              setIsExpanded(false);

              // 4. Pin the exact position instantly upon DOM update
              requestAnimationFrame(() => {
                if (targetY > 0) {
                  window.scrollTo({
                    top: targetY,
                    left: 0,
                    behavior: 'instant' as ScrollBehavior
                  });
                }
                setTimeout(() => {
                  document.documentElement.style.scrollBehavior = prevBehavior;
                }, 50);
              });
            } else {
              // User clicked "Show More Reviews": expand immediately
              setIsExpanded(true);
            }
          };

          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {visibleReviews.map((item, index) => (
                  <div
                    key={item.id}
                    id={`review-card-${index}`}
                    className="group p-4 sm:p-5 md:p-6 rounded-2xl bg-white border border-neutral-200/80 hover:border-[#1430d8]/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top Quote Icon & Rating */}
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-1.5">
                          <StarRatingTrack rating={item.rating} />
                          <span className="text-xs font-bold text-neutral-800 tabular-nums">
                            {Number(item.rating).toFixed(1)}
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-[10px] sm:text-[11px] font-semibold text-[#1430d8]">
                          <span>{item.projectType}</span>
                        </div>
                      </div>

                      {/* Verified Client Badge */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/60 text-[10.5px] font-bold text-emerald-800 mb-3">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Verified Client Project</span>
                      </div>

                      {/* Quote Body */}
                      <p className="text-neutral-700 text-xs sm:text-sm leading-relaxed italic relative mb-4">
                        &ldquo;{item.quote}&rdquo;
                      </p>
                    </div>

                    {/* Client Profile Footer */}
                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#1430d8] to-[#0075f7] flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-xs shrink-0">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-1">
                            {item.name}
                            <span title={item.location} className="text-xs">
                              {item.flag && item.flag !== '⭐' ? item.flag : detectFlagFromLocation(item.location)}
                            </span>
                          </h4>
                          <p className="text-[10px] sm:text-xs text-neutral-500">
                            {item.role || 'Verified Client'}
                          </p>
                        </div>
                      </div>

                      {item.location && (
                        <div className="text-[10px] sm:text-[11px] text-neutral-400 hidden sm:block text-right">
                          {item.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Show More / Show Less Toggle Button */}
              {hasMoreReviews && (
                <div className="flex justify-center mb-8 sm:mb-10">
                  <button
                    id="reviews-toggle-btn"
                    type="button"
                    onClick={handleToggleExpand}
                    className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-blue-50/70 border border-neutral-200/90 hover:border-[#1430d8]/50 text-xs sm:text-sm font-bold text-neutral-800 hover:text-[#1430d8] shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <span>
                      {isExpanded
                        ? 'Show Less Reviews'
                        : `Show More Reviews (${reviews.length - INITIAL_COUNT} More)`}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#1430d8] group-hover:-translate-y-0.5 transition-transform" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#1430d8] group-hover:translate-y-0.5 transition-transform" />
                    )}
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* ========================================================================= */}
      {/* LEAVE A REVIEW CLIENT MODAL (WITH ADMIN APPROVAL NOTICE) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl bg-white border border-neutral-200 shadow-2xl p-4 sm:p-5 my-auto text-[#0e0e0e] max-h-[92dvh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={resetForm}
                className="absolute top-3 right-3 p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {!isSubmittedSuccess ? (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-blue-50 text-[#1430d8] flex items-center justify-center shrink-0">
                      <Star className="w-3.5 h-3.5 fill-[#1430d8]" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm sm:text-base font-bold text-neutral-900 leading-tight">
                        Rate Your Experience
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-neutral-500">
                        Share your feedback for Muhammad Usman Afzal
                      </p>
                    </div>
                  </div>

                  {formError && (
                    <div className="mb-2 p-2 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-600">
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleSubmitReview} className="space-y-2.5 sm:space-y-3 mt-2.5">
                    {/* Interactive Star Rating Selector (Supports Full & Half Stars) */}
                    <div>
                      <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-1">
                        Your Rating
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const activeVal = hoverRating !== null ? hoverRating : reviewerRating;
                            const isFull = activeVal >= star;
                            const isHalf = !isFull && activeVal >= star - 0.5;
                            return (
                              <button
                                key={star}
                                type="button"
                                onMouseMove={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const isLeftHalf = e.clientX - rect.left < rect.width / 2;
                                  setHoverRating(star > 1 && isLeftHalf ? star - 0.5 : star);
                                }}
                                onMouseLeave={() => setHoverRating(null)}
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const isLeftHalf = e.clientX - rect.left < rect.width / 2;
                                  setReviewerRating(star > 1 && isLeftHalf ? star - 0.5 : star);
                                }}
                                className="relative p-0.5 cursor-pointer transition-transform hover:scale-115 focus:outline-none"
                              >
                                <span className="relative inline-flex w-5 h-5">
                                  <Star className="w-5 h-5 text-neutral-200 fill-neutral-200" />
                                  {isFull && (
                                    <Star className="absolute inset-0 w-5 h-5 text-amber-400 fill-amber-400" />
                                  )}
                                  {isHalf && (
                                    <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                                      <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
                                    </span>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-neutral-800 tabular-nums">
                          {(hoverRating !== null ? hoverRating : reviewerRating).toFixed(1)} / 5.0
                        </span>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-0.5">
                        Your Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alexander Croft"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:border-[#1430d8]"
                      />
                    </div>

                    {/* Role & Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-0.5">
                          Role / Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Founder, CEO, Store Owner"
                          value={reviewerRole}
                          onChange={(e) => setReviewerRole(e.target.value)}
                          className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:border-[#1430d8]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700">
                            City &amp; Country
                          </label>
                          {reviewerLocation.trim() && (
                            <span className="text-[11px] inline-flex items-center gap-1 font-semibold text-neutral-700 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                              <span>{detectFlagFromLocation(reviewerLocation)}</span>
                              <span className="text-[9.5px] text-neutral-500">Detected</span>
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Lahore, Pakistan or London, UK"
                          value={reviewerLocation}
                          onChange={(e) => setReviewerLocation(e.target.value)}
                          className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:border-[#1430d8]"
                        />
                      </div>
                    </div>

                    {/* Project Type - Custom Styled Dropdown to prevent OS system takeover */}
                    <div className="relative">
                      <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-0.5">
                        Service Delivered
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-neutral-50 border text-xs text-neutral-900 font-medium flex items-center justify-between transition-all cursor-pointer text-left focus:outline-none ${
                          isDropdownOpen
                            ? 'border-[#1430d8] ring-2 ring-blue-500/10 bg-white shadow-xs'
                            : 'border-neutral-200 hover:bg-neutral-100/70'
                        }`}
                      >
                        <span className="truncate font-medium">{reviewerProjectType}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-200 shrink-0 ml-2 ${
                            isDropdownOpen ? 'rotate-180 text-[#1430d8]' : ''
                          }`}
                        />
                      </button>

                      {isDropdownOpen && (
                        <>
                          {/* Transparent backdrop for outside tap dismissal */}
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setIsDropdownOpen(false)}
                          />
                          <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden py-1 max-h-48 overflow-y-auto">
                            {SERVICE_OPTIONS.map((srv) => {
                              const isSelected = reviewerProjectType === srv;
                              return (
                                <button
                                  key={srv}
                                  type="button"
                                  onClick={() => {
                                    setReviewerProjectType(srv);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-blue-50 text-[#1430d8] font-bold'
                                      : 'text-neutral-700 hover:bg-neutral-50'
                                  }`}
                                >
                                  <span>{srv}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-[#1430d8] shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Review Quote */}
                    <div>
                      <label className="block text-[11px] sm:text-xs font-semibold text-neutral-700 mb-0.5">
                        Your Feedback &amp; Review <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Share your experience working with Usman, engineering quality, speed, and communication..."
                        value={reviewerQuote}
                        onChange={(e) => setReviewerQuote(e.target.value)}
                        className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:border-[#1430d8] resize-none"
                      />
                    </div>

                    {/* Admin Verification Notice */}
                    <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 flex items-start gap-1.5 text-[10px] sm:text-[10.5px] text-blue-900 leading-tight">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#1430d8] shrink-0 mt-0.5" />
                      <span>
                        <strong>Quality Verification:</strong> Submitted reviews are reviewed and verified by admin before appearing live on the website.
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-neutral-200 text-neutral-600 text-xs font-bold hover:bg-neutral-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg bg-[#1430d8] text-white text-xs font-bold hover:bg-[#0075f7] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isSubmitting ? 'Submitting...' : 'Submit Review'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Success Confirmation */
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-extrabold text-neutral-900 mb-1">
                    Thank You, {reviewerName}!
                  </h3>
                  <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed mb-5">
                    Your {reviewerRating.toFixed(1)}-star review has been received. Muhammad Usman Afzal will review and approve it shortly to appear live on the studio showcase.
                  </p>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 rounded-xl bg-[#1430d8] text-white text-xs font-bold hover:bg-[#0075f7] transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
