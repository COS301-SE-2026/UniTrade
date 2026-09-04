import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  IconStar,
  IconCheck,
  IconChevronRight,
  IconBookmark,
  IconHeart,
  IconFlag,
  IconX,
} from "@tabler/icons-react";
import type React from "react";
import { listingsService } from "../../services/listingsService";
import {
  formatPrice,
  formatDate,
  formatCondition,
} from "../../utils/formatters";
import type {
  ListingDetail as ListingDetailType,
  SimilarListing,
  UserReviewsResponse,
} from "../../types/listing";
import { createReservation } from "../../services/reservationService";
import {
  ratingAsSeller,
  computeReputationScore,
} from "../../types/reviewStats";
import { ReviewList } from "../auth/Review";
import { fileDispute } from "../../services/adminService";
import ListingQnA from "../../components/ListingQnA";
import { useToast } from "../../components/layout/useToast";
import { queryClient } from "../../lib/queryClient";

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-medium text-navy-700 dark:text-white">
        {value}
      </span>
    </div>
  );
}

function ReportModal({
  isOpen,
  onClose,
  reason,
  setReason,
  onSubmit,
  submitting,
  error,
}: Readonly<{
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  setReason: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}>) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-md p-6 relative shadow-xl border border-gray-200 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
        >
          <IconX size={20} />
        </button>
        <h2 className="text-xl font-bold text-navy-700 dark:text-white text-center mb-6">
          Report Listing
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-navy-700 dark:text-white mb-2">
              Reason
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
              placeholder="Provide a reason for reporting this listing..."
              className="w-full rounded-lg border border-gray-300 dark:border-white/10 p-3 text-sm bg-transparent text-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-700"
            />
            {error && (<p className="text-xs text-red-500 mt-1">{error}</p>)}
          </div>
          <button
            type="button"
            className="w-full bg-navy-700 hover:bg-navy-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListingDetail() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingDetailType | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseCode, setCourseCode] = useState<string | null>(null);
  const [similarListings, setSimilarListings] = useState<
    SimilarListing[] | null
  >(null);
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [sellerReviews, setSellerReviews] =
    useState<UserReviewsResponse | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [wishlisting, setWishlisting] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const handleSubmitReport = async () => {
    if (!listing) return;
    if (!reportReason.trim()) {
      setReportError("Please provide a reason.");
      return;
    }
    setReportSubmitting(true);
    setReportError(null);
    try {
      await fileDispute({
        type: "report_listing",
        listingId: listing.id,
        description: reportReason,
      });
      setReportModalOpen(false);
      setReportReason("");
      setReportError(null);
      showToast("success", "Thanks — your report has been submitted and a UniTrade admin will review it shortly.");
    } catch (err) {
      const code = (err as {code?: string})?.code?? "";
      const message_row = code === "dispute_already_open" ? "You've already reported this listing." : code === "listing_not_live" ? "This listing is no longer available to report." : "Something went wrong submitting your report. Please try again.";
      setReportError(message_row);
    } finally {
      setReportSubmitting(false);
    }
  };
  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!listing || wishlisting || wishlisted) return;

    setWishlisting(true);

    try {
      await listingsService.addToWishlist(String(listing.id));
      setWishlisted(true);
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      showToast("success", "Successfully added to wishlist.");
    } catch (err) {
      if (err instanceof Error && err.message === "already_wishlisted") {
        setWishlisted(true);
        showToast("error", "Already wishlisted.");
      } else {
        showToast("error", "Could not add to wishlist.");
      }
    } finally {
      setWishlisting(false);
    }
  };
  const handleReserve = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!listing) return;

    setReserving(true);
    setReserveError(null);

    const result = await createReservation({ listingId: String(listing.id) });

    if (result.success) {
      setReserved(true);
      navigate("/buyer/reservations");
    } else if (result.error.code === "self_reserve") {
      setReserveError("You can't reserve your own listing.");
    } else if (result.error.code === "already_reserved") {
      setReserveError("Item was just reserved by someone else!");
    } else {
      setReserveError(result.error.message ?? "Could not reserve this item.");
    }

    setReserving(false);
  };

  useEffect(() => {
    if (!id) return;
    listingsService
      .getById(id)
      .then((data) => {
        setListing(data);
        if (data.courseId) {
          listingsService
            .getCourse(data.courseId)
            .then((course) => setCourseCode(course.courseCode))
            .catch(() => setCourseCode(null));
        }
        listingsService
          .getSimilarListings(data)
          .then(setSimilarListings)
          .catch(() => setSimilarListings([]));
        setActiveImage(
          data.images.find((i) => i.isPrimary)?.url ??
          data.images[0]?.url ??
          null,
        );

        if (data.sellerId) {
          listingsService
            .getReviewsForUser(data.sellerId)
            .then(setSellerReviews)
            .catch(() => setSellerReviews(null));
        }
      })
      .catch(() => setError("Failed to load listing"))
      .finally(() => setLoading(false));
  }, [id]);

  const sellerRating = sellerReviews ? ratingAsSeller(sellerReviews) : null;
  const sellerReceivedReviews =
    sellerReviews?.reviews.filter((r) => r.reviewType === "buyer_to_seller") ??
    [];
  const sellerReputationScore = computeReputationScore(sellerReceivedReviews);
  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );

  if (error || !listing)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-400">{error ?? "Listing not found"}</p>
      </div>
    );
  const getReserveLabel = () => {
    if (reserved) return "Reserved!";
    if (reserving) return "Reserving...";
    return "Reserve this item";
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <button
          type="button"
          className="text-[#00aaff] cursor-pointer hover:underline"
          onClick={() => navigate("/buyer/dashboard")}
        >
          Dashboard
        </button>
        <IconChevronRight size={12} />
        <button
          type="button"
          className="text-[#00aaff] cursor-pointer hover:underline"
          onClick={() => navigate("/buyer/listings")}
        >
          Listings
        </button>
        <IconChevronRight size={12} />
        <span>{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <button
              type="button"
              className="relative w-full aspect-square sm:aspect-[4/3] md:h-96 rounded-lg overflow-hidden mb-3 bg-gray-100 dark:bg-navy-700 cursor-pointer group"
              onClick={() => activeImage && setLightboxOpen(true)}
            >
              {activeImage ? (
                <>
                  <img
                    src={activeImage}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-full">
                      Click to view full image
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl">None</span>
                </div>
              )}
            </button>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {listing.images.map((img) => (
                <button
                  type="button"
                  key={img.id}
                  onClick={() => setActiveImage(img.url)}
                  className={`w-14 h-12 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 bg-gray-100 dark:bg-navy-700 ${activeImage === img.url
                    ? "border-navy-700 dark:border-white"
                    : "border-transparent"
                    }`}
                >
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">
                      
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-5">
            <h1 className="text-base sm:text-lg font-bold text-navy-700 dark:text-white mb-1">
              {listing.title}
            </h1>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-xl sm:text-2xl font-bold text-navy-700 dark:text-white">
                {formatPrice(listing.price)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                <IconCheck size={11} /> {formatCondition(listing.condition)}
              </span>
              {listing.category === "book" && courseCode && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-navy-700 dark:text-white/70">
                  {courseCode}
                </span>
              )}
              {listing.category === "electronics" &&
                listing.metadata?.brand && (
                  <span className="text-xs bg-blue-50 text-blue-700 dark:bg-navy-700 dark:text-white/70 px-3 py-1 rounded-full font-medium">
                    {listing.metadata.brand}
                  </span>
                )}
              {listing.category === "furniture" &&
                listing.metadata?.dimensions && (
                  <span className="text-xs bg-blue-50 text-blue-700 dark:bg-navy-700 dark:text-white/70 px-3 py-1 rounded-full font-medium">
                    {listing.metadata.dimensions}
                  </span>
                )}
            </div>

            <hr className="border-gray-100 dark:border-white/5 mb-4" />
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed mb-4">
              {listing.description}
            </p>

            <hr className="border-gray-100 dark:border-white/5 mb-4" />
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-2">
              Listing details
            </h3>
            <DetailRow label="Category" value={listing.category} />
            <DetailRow
              label="Condition"
              value={
                <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  <IconStar size={10} className="fill-green-700" />{" "}
                  {formatCondition(listing.condition)}
                </span>
              }
            />
            {listing.category === "book" && courseCode && (
              <DetailRow label="Course Code" value={courseCode} />
            )}
            {listing.category === "electronics" && listing.metadata?.brand && (
              <DetailRow label="Brand" value={listing.metadata.brand} />
            )}
            {listing.category === "furniture" &&
              listing.metadata?.dimensions && (
                <DetailRow
                  label="Dimensions"
                  value={listing.metadata.dimensions}
                />
              )}
            <DetailRow label="Listed on" value={formatDate(listing.listedAt)} />
            <DetailRow label="Views" value={listing.views} />

          </div>
          <ListingQnA
            listingId={listing.id}
            isSeller={false}
            canAsk={true}
          />

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-3">
              Seller reviews
            </h3>
            {sellerReviews === null ? (
              <p className="text-xs text-gray-400">Loading reviews...</p>
            ) : sellerReceivedReviews.length === 0 ? (
              <p className="text-xs text-gray-400">No reviews yet.</p>
            ) : (
              <ReviewList reviews={sellerReceivedReviews} />
            )}
          </div>
        </div>
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-3">
              Seller
            </h3>
            <div className="flex items-center gap-3 bg-blue-50 dark:bg-navy-700 rounded-lg p-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-navy-700 dark:bg-navy-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {`${listing.seller?.firstName?.[0] ?? ""}${listing.seller?.lastName?.[0] ?? ""}`}
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-700 dark:text-white">
                  {listing.seller?.firstName}
                </p>
                <p className="text-xs text-gray-400">
                  {listing.seller?.university}
                </p>
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1">
                  <IconCheck size={9} /> Verified Student
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              {[
                {
                  val: listing.seller?.activeListingCount ?? "—",
                  label: "Listings",
                },
                {
                  val: sellerReviews ? sellerReputationScore + "%" : "—",
                  label: "Reputation Score",
                },
                {
                  val: sellerRating != null ? sellerRating.toFixed(1) : "—",
                  label: "Rating",
                },
              ].map(({ val, label }) => (
                <div key={label}>
                  <p className="text-base font-bold text-navy-700 dark:text-white">
                    {val}
                  </p>
                  <p className="text-[10px] text-gray-400">{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-navy-700 rounded-lg p-3 mb-4 flex gap-2">
              <span className="text-blue-500 text-sm flex-shrink-0">🛡</span>
              <p className="text-xs text-blue-700 dark:text-white/70 leading-relaxed">
                Reserve now to hold this item for 24 hours. No payment until you
                meet and inspect it in person.
              </p>
            </div>

            {reserveError && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 mb-3">
                <p className="text-xs text-red-600 dark:text-red-400 text-center">
                  {reserveError}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleReserve}
              disabled={reserving || reserved}
              className="w-full bg-navy-700 hover:bg-navy-500 text-white font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-2"
            >
              <IconBookmark size={16} />

              {getReserveLabel()}
            </button>

            <button
              type="button"
              onClick={handleAddToWishlist}
              disabled={wishlisting || wishlisted}
              className="w-full border border-navy-700 dark:border-white/20 text-navy-700 dark:text-white font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 mb-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <IconHeart size={16} /> {
                wishlisted ? 'In Wishlist' :
                  wishlisting ? 'Adding...' :
                    'Add to Wishlist'
              }
            </button>

            <button
              onClick={() => setReportModalOpen(true)}
              className="w-full border border-red-300 dark:border-red-500/30 text-red-500 dark:text-red-400 font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <IconFlag size={16} /> Report this listing
            </button>
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-3">
              Similar listings
            </h3>
            {similarListings === null ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-navy-600 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-gray-200 dark:bg-navy-600 rounded animate-pulse mx-auto" />
                  <div className="h-2.5 w-20 bg-gray-200 dark:bg-navy-600 rounded animate-pulse mx-auto" />
                </div>
              </div>
            ) : similarListings.length === 0 ? (
              <p className="text-xs text-gray-400">
                No similar listings found.
              </p>
            ) : (
              <div className="space-y-3">
                {similarListings.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => navigate(`/buyer/listings/${item.id}`)}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700 rounded-lg p-2 -m-2"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-navy-700 flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">
                          No Image available
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-navy-700 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      {formatCondition(item.condition)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {lightboxOpen && activeImage && (
        <button
          type="button"
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 appearance-none border-0"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setLightboxOpen(false);
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none"
          >
            &times;
          </button>
          <img
            src={activeImage}
            alt={listing.title}
            className="max-w-full max-h-full object-contain"
          />
        </button>
      )}

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reason={reportReason}
        setReason={setReportReason}
        onSubmit={handleSubmitReport}
        submitting={reportSubmitting}
        error={reportError}
      />
    </div>
  );
}
