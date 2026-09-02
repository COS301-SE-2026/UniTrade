import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { IconCheck } from "@tabler/icons-react";
import type React from "react";
import { listingsService } from "../../services/listingsService";
import {
  formatPrice,
  formatDate,
  formatCondition,
} from "../../utils/formatters";
import type { SellerListingDetail as SellerListingDetailType } from "../../types/listing";
import { LoadingState } from "../../components/layout/Spinner";
import ListingQnA from "../../components/ListingQnA";

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

export default function SellerListingDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<SellerListingDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [courseCode, setCourseCode] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
      })
      .catch(() => setError("Failed to load listing"))
      .finally(() => setLoading(false));
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-400 overflow-x-auto whitespace-nowrap">
        <button
          type="button"
          className="text-[#00aaff] cursor-pointer hover:underline flex-shrink-0 bg-transparent border-0 p-0 text-sm"
          onClick={() => navigate("/seller/listings")}
        >
          My Listings
        </button>
        <span>›</span>
        <span className="text-navy-700 dark:text-white truncate">
          {listing.title}
        </span>
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

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-4">
              Actions
            </h3>
            <button
              type='button'
              onClick={() => navigate(`/seller/editListing/${id}`)}
              disabled={listing.isReserved || listing.status === "sold"}
              className="w-full bg-navy-700 hover:bg-navy-500 text-white font-semibold text-sm py-3 rounded-xl mb-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Edit Listing
            </button>

            <button
              type='button'
              onClick={handleDelete}
              disabled={listing.isReserved || listing.status === "sold"}
              className="w-full border border-red-200 dark:border-red-900/50 text-red-500 font-semibold text-sm py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete Listing
            </button>
          </div>
        </div>


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