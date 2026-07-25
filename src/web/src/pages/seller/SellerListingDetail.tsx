import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
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

  {loading && <LoadingState message = "Loading..." /> } 
  

  if (error || !listing)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-400">{error ?? "Listing not found"}</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span
          className="text-[#00aaff] cursor-pointer hover:underline"
          onClick={() => navigate("/seller/listings")}
        >
          My Listings
        </span>
        <span>›</span>
        <span className="text-navy-700 dark:text-white">{listing.title}</span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <div className=" relative w-full h-96 rounded-lg overflow-hidden mb-3 bg-gray-100 dark:bg-navy-700 cursor-pointer group"
              onClick={() => listing.images && setLightboxOpen(true)}>
              {listing.images && listing.images.length > 0 ? (
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
                  <span className="text-4xl">No image</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {listing.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`thumbnail ${i + 1}`}
                  onClick={() => setSelectedImg(i)}
                  className={`w-20 h-16 object-cover rounded-lg cursor-pointer border-2 transition-colors ${selectedImg === i
                    ? "border-navy-700 dark:border-white"
                    : "border-transparent"
                    }`}
                />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h1 className="text-lg font-bold text-navy-700 dark:text-white mb-1">
              {listing.title}
            </h1>
            <p className="text-2xl font-bold text-navy-700 dark:text-white mb-3">
              {formatPrice(listing.price)}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                <IconCheck size={10} /> {formatCondition(listing.condition)}
              </span>
              {listing.category === 'book' && courseCode && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-navy-700 dark:text-white/70">
                  {courseCode}
                </span>
              )}
              {listing.category === 'electronics' && listing.metadata?.brand && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-navy-700 dark:text-white/70">
                  {listing.metadata.brand}
                </span>
              )}
              {listing.category === 'furniture' && listing.metadata?.dimensions && (
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
            {listing.category === 'electronics' && listing.metadata?.brand && (
              <DetailRow label="Brand" value={listing.metadata.brand} />
            )}
            {listing.category === 'furniture' && listing.metadata?.dimensions && (
              <DetailRow label="Dimensions" value={listing.metadata.dimensions} />
            )}
            {listing.category === 'book' && courseCode && (
              <DetailRow label="Course Code" value={courseCode} />
            )}
            <DetailRow label="Listed On" value={formatDate(listing.listedAt)} />
            <DetailRow label="Views" value={listing.views} />
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-4">
              Listing Verifications Detail
            </h3>
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-navy-600 animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-28 bg-gray-200 dark:bg-navy-600 rounded animate-pulse mx-auto" />
                <div className="h-2.5 w-20 bg-gray-200 dark:bg-navy-600 rounded animate-pulse mx-auto" />
                <div className="h-2.5 w-16 bg-gray-200 dark:bg-navy-600 rounded animate-pulse mx-auto" />
              </div>
              <span className="text-xs text-white bg-navy-700 dark:bg-navy-500 px-4 py-1.5 rounded-full font-semibold">
                Coming soon
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-4">
              Actions
            </h3>
            <button
              onClick={() => navigate(`/seller/editListing/${id}`)}
              disabled={listing.isReserved || listing.status === "sold"}
              className="w-full bg-navy-700 hover:bg-navy-500 text-white font-semibold text-sm py-3 rounded-xl mb-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover-navy-700"
            >
              Edit Listing
            </button>

            <button
              onClick={handleDelete}
              disabled={listing.isReserved || listing.status === "sold"}
              className="w-full border border-red-200 dark:border-red-900/50 text-red-500 font-semibold text-sm py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowd disabled:hover:bg-red-50"
            >
              Delete Listing
            </button>
          </div>
        </div>
      </div>

      {lightboxOpen && listing.images[selectedImg] && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none">
            &times;
          </button>
          <img
            src={listing.images[selectedImg]}
            alt={listing.title}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}