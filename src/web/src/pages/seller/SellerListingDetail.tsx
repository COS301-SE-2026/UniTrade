import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { IconCheck, IconChevronRight } from "@tabler/icons-react";
import type React from "react";
import { listingsService } from "../../services/listingsService";
import { ConfirmModal } from "../admin/AdminReviewShared";
import StatusPill from "../../components/layout/ui/StatusPill";
import {
  formatPrice,
  formatDate,
  formatCondition,
} from "../../utils/formatters";
import type { SellerListingDetail as SellerListingDetailType } from "../../types/listing";
import { LoadingState } from "../../components/layout/Spinner";
import ListingQnA from "../../components/ListingQnA";
import type { ListingStatusResponse } from "../../types/riskTemp";
import { mockStatusFromListing } from "../../types/riskTemp";
import { connectionManager } from "../../services/realtime/connectionManager"


function DetailRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: React.ReactNode;
}>) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-medium text-navy-700 dark:text-white">
        {value}
      </span>
    </div>
  );
}

function visibilityInfo(score: number) {
  if (score >= 90) return { label: "Full visibilty", bar: "bg-green-500", text: "text-green-700" };
  if (score >= 45) return { label: "Reduced visibility", bar: "bg-amber-500", text: "text-amber-700" };
  return { label: "Limited visibility", bar: "bg-orange-500", text: "text-orange-700" };
}
export default function SellerListingDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<SellerListingDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [courseCode, setCourseCode] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [statusData, setStatusData] = useState<ListingStatusResponse | null>(null);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitSubmitting, setResubmitSubmitting] = useState(false)

  const maxResubmissions = statusData?.maxResubmissions ?? 0;
  const resubmissionUsed = statusData?.resubmissionCount ?? 0;
  const remaining = maxResubmissions - resubmissionUsed;
  const canResubmit = remaining > 0;

  const handleResubmitConfirm = async () => {
    if (!id) return;
    setResubmitSubmitting(true);
    try {
      const result = await listingsService.resubmitListing(id);
      setListing((prev) =>
        prev ? { ...prev, status: result.status } : prev,
      );
      const freshStatus = await listingsService.getListingStatus(id);
      setStatusData(freshStatus)
      setShowResubmitModal(false);
    } catch {
      setError("Failed to resubmit listing");
    } finally {
      setResubmitSubmitting(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    listingsService
      .getSellerListingById(id)
      .then((data) => {
        setListing(data);
        if (data.courseId) {
          listingsService
            .getCourse(data.courseId)
            .then((course) => setCourseCode(course.courseCode))
            .catch(() => setCourseCode(null));
        }
        Promise.resolve()
          .then(() => listingsService.getListingStatus(id))
          .then(setStatusData)
          .catch(() => setStatusData(mockStatusFromListing(data)));
      })
      .catch(() => setError("Failed to load listing"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const off = connectionManager.onListingStatusChanged((e) => {
      if (e.listingId !== id) return;

      listingsService
        .getListingStatus(id)
        .then(setStatusData)
        .catch(() => {
        });
    });

    return off;
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    try {
      await listingsService.deleteListing(id);
      navigate("/seller/listings");
    } catch {
      setError("Failed to delete listing");
    }
  };

  if (loading) {
    return <LoadingState message="Loading..." />;
  }


  if (error || !listing)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-400">{error ?? "Listing not found"}</p>
      </div>
    );

  const visibility =
    statusData?.status === "live" && statusData.visibilityScore != null
      ? { score: statusData.visibilityScore, ...visibilityInfo(statusData.visibilityScore) }
      : null;
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">

        <div className="flex items-center gap-2 text-sm text-gray-400 overflow-x-auto whitespace-nowrap">
          <button
            type="button"
            className="text-[#00aaff] cursor-pointer hover:underline flex-shrink-0 bg-transparent border-0 p-0 text-sm"
            onClick={() => navigate("/seller/listings")}
          >
            My Listings
          </button>
          <IconChevronRight size={12} />
          <span className="text-gray-400"></span>
          <span className="text-gray-600 dark:text-white truncate">
            {listing.title}
          </span>
        </div>


        {statusData && (statusData.status === "under_review" || statusData.status === "removed") && (

          <StatusPill status={statusData.status} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-3 sm:p-4">
            <button
              type="button"
              className="relative w-full aspect-square sm:aspect-[4/3] md:h-96 rounded-lg overflow-hidden mb-3 bg-gray-100 dark:bg-navy-700 cursor-pointer group appearance-none border-0 p-0"
              onClick={() => listing.images && setLightboxOpen(true)}>
              {listing.images?.length > 0 ? (
                <>
                  <img src={listing.images[selectedImg]}
                    alt={listing.title}
                    className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-full">
                      Click to view full image
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl sm:text-4xl text-gray-400">No image</span>
                </div>
              )}
            </button>
            {listing.images?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {listing.images.map((img, i) => (
                  <button type="button"
                    key={`thumb-${img}`}
                    onClick={() => setSelectedImg(i)}
                    className={`w-16 h-14 sm:w-20 sm:h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors flex-shrink-0 appearance-none p-0 bg-transparent ${selectedImg === i
                      ? "border-navy-700 dark:border-white"
                      : "border-transparent"}`}

                  >
                    <img

                      src={img}
                      alt={`thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-5">
            <h1 className="text-base sm:text-lg font-bold text-navy-700 dark:text-white mb-1">
              {listing.title}
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-navy-700 dark:text-white mb-3">
              {formatPrice(listing.price)}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                <IconCheck size={10} /> {formatCondition(listing.condition)}
              </span>
              {listing.category === "book" && courseCode && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-navy-700 dark:text-white/70">
                  {courseCode}
                </span>
              )}
              {listing.category === "electronics" && listing.metadata?.brand && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-navy-700 dark:text-white/70">
                  {listing.metadata.brand}
                </span>
              )}
              {listing.category === "furniture" && listing.metadata?.dimensions && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-navy-700 dark:text-white/70">
                  {listing.metadata.dimensions}
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed mb-4">
              {listing.description}
            </p>

            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-1">
              Listing Details
            </h3>
            <DetailRow label="Category" value={listing.category} />
            <DetailRow
              label="Condition"
              value={
                <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {formatCondition(listing.condition)}
                </span>
              }
            />
            {listing.category === "electronics" && listing.metadata?.brand && (
              <DetailRow label="Brand" value={listing.metadata.brand} />
            )}
            {listing.category === "furniture" && listing.metadata?.dimensions && (
              <DetailRow label="Dimensions" value={listing.metadata.dimensions} />
            )}
            {listing.category === "book" && courseCode && (
              <DetailRow label="Course Code" value={courseCode} />
            )}
            <DetailRow label="Listed On" value={formatDate(listing.listedAt)} />
          </div>
          <ListingQnA listingId={listing.id}
            isSeller={true}
            canAsk={false}
          />
        </div>

        <div className="lg:col-span-1 space-y-4">

          {visibility && (
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-3">Visibility</h3>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={`font-semibold ${visibility.text}`}>{visibility.label}</span>
                <span className="text-gray-500">{visibility.score}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full ${visibility.bar}`}
                  style={{ width: `${visibility.score}%` }}
                />
                <p className="mt-3 text-[11px] leading-relaxed text-gray-500 dark:text-white/50">
                  {visibility.score >= 90
                    ? "Your listing appears normally in browse results."
                    : "Your listing appears lower in browse results. Check that your photos clearly show the item and match the category, and that the price and description are accurate."
                  }
                </p>
              </div>
            </div>
          )}
          {statusData && (statusData.status === "under_review" || (statusData.reasons && statusData.reasons.length > 0)) && (
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-3">
                {statusData.status === "under_review" ? "Why it was flagged" : "Why it was removed"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-white/60 mb-3">
                {statusData.message}
              </p>
              {statusData.reasons && statusData.reasons.length > 0 && (
                <ul className="space-y-2">
                  {statusData.reasons.map((r, i) => (
                    <li
                      key={`${r.code}-${i}`}
                      className="text-xs text-gray-500 dark:text-white/50 leading-relaxed pl-3 border-l-2 border-gray-200 dark:border-white/10"
                    >
                      {r.detail ?? r.code}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-5">

            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-4">
              Actions
            </h3>
            <button
              type='button'
              onClick={() => navigate(`/seller/editListing/${id}`)}
              disabled={listing.isReserved || listing.status === "sold" || listing.status === "under_review"}
              className="w-full bg-navy-700 hover:bg-navy-500 text-white font-semibold text-sm py-3 rounded-xl mb-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Edit Listing
            </button>

            <button
              type='button'
              onClick={handleDelete}
              disabled={listing.isReserved || listing.status === "sold" || listing.status === "under_review"}
              className="w-full border border-red-200 dark:border-red-900/50 text-red-500 font-semibold text-sm py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete Listing
            </button>

            {listing.status === "removed" && (
              <button
                type="button"
                onClick={() => canResubmit && setShowResubmitModal(true)}
                disabled={!canResubmit}
                className="w-full mt-4 py-2.5 bg-navy-700 text-white text-sm font-semibold rounded-xl hover:bg-navy-600 transition-colors disabled:opacity-50"
              >
                {canResubmit ? `Resubmit (${remaining} left)` : "Resubmission limit reached"}
              </button>
            )}
          </div>
        </div>

        {showResubmitModal && (
          <ConfirmModal
            title="Resubmit listing"
            message={`You have ${remaining} resubmission${remaining === 1 ? "" : "s"} left. Do you want to continue?`}
            confirmLabel="Resubmit"
            tone="neutral"
            submitting={resubmitSubmitting}
            showReasonField={false}
            onCancel={() => setShowResubmitModal(false)}
            onConfirm={handleResubmitConfirm}
          />
        )}
        {lightboxOpen && listing.images?.[selectedImg] && (
          <button
            type="button"
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 border-0"
            onClick={(e) => {
              if (e.target === e.currentTarget) setLightboxOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setLightboxOpen(false);
            }}
          >
            <button
              type='button'
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none"
            >
              &times;
            </button>
            <img
              src={listing.images?.[selectedImg]}
              alt={listing.title}
              className="max-w-full max-h-full object-contain"
            />
          </button>
        )}
      </div>
    </div>
  );
}