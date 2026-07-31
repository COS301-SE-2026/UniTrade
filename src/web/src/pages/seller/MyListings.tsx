import { useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconPackage,
  IconNotes,
  IconBoxPadding,
  IconPlus,
  IconTrash,
  IconLivePhoto,
} from "@tabler/icons-react";
import { listingsService } from "../../services/listingsService";
import { formatPrice } from "../../utils/formatters";
import type { ListingSummary, ListingStatus } from "../../types/listing";
import StatusPill from "../../components/layout/ui/StatusPill";
import biologyTextbook from "../../assets/bio-textbook.jpg";
import type { ApiError } from "../../types/Reservations";
import { useToast } from "../../components/layout/useToast";
import { useMyListings } from "../../hooks/useMyListings";
import { LoadingState } from "../../components/layout/Spinner";

function ActionButtons({
  listing,
  onDelete,
  onSubmit,
  submitting,
}: {
  listing: ListingSummary;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  submitting: boolean;
}) {
  const navigate = useNavigate();

  const deleteBtn = (
    <button
      onClick={() => onDelete(listing.id)}
      aria-label="Delete listing"
      className="border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
    >
      <IconTrash size={16} />
    </button>
  );

  if (listing.status === "live" || listing.status === "pending") {
    return (
      <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
        <button
          onClick={() => navigate(`/seller/listings/${listing.id}`)}
          className="bg-navy-700 hover:bg-navy-500 text-white text-xs md:text-sm font-semibold px-4 md:px-5 py-1.5 md:py-2 rounded-full transition-colors whitespace-nowrap"
        >
          View
        </button>
        <button
          onClick={() => navigate(`/seller/editListing/${listing.id}`)}
          className="border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white text-xs md:text-sm font-semibold px-4 md:px-5 py-1.5 md:py-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
        >
          Edit
        </button>
        {deleteBtn}
      </div>
    );
  }

  if (listing.status === "draft") {
    return (
      <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
        <button
          onClick={() => onSubmit(listing.id)}
          disabled={submitting}
          className="bg-navy-700 hover:bg-navy-500 text-white text-xs md:text-sm font-semibold px-4 md:px-5 py-1.5 md:py-2 rounded-full transition-colors whitespace-nowrap"
        >
          {submitting ? "Submitting...." : "Submit"}
        </button>
        <button
          onClick={() => navigate(`/seller/editListing/${listing.id}`)}
          className="border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white text-xs md:text-sm font-semibold px-4 md:px-5 py-1.5 md:py-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
        >
          Edit
        </button>
        {deleteBtn}
      </div>
    );
  }

  if (listing.status === "rejected") {
    return (
      <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
        <button className="bg-navy-700 hover:bg-navy-500 text-white text-xs md:text-sm font-semibold px-4 md:px-5 py-1.5 md:py-2 rounded-full transition-colors whitespace-nowrap">
          Resubmit
        </button>
        <button
          onClick={() => navigate(`/seller/editListing/${listing.id}`)}
          className="border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white text-xs md:text-sm font-semibold px-4 md:px-5 py-1.5 md:py-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
        >
          Edit
        </button>
        {deleteBtn}
      </div>
    );
  }

  if (listing.status === "reserved") {
    return (
      <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
        <button
          onClick={() => navigate(`/seller/listings/${listing.id}`)}
          className="bg-navy-700 hover:bg-navy-500 text-white text-xs md:text-sm font-semibold px-4 md:px-5 py-1.5 md:py-2 rounded-full transition-colors whitespace-nowrap"
        >
          View
        </button>
        <button
          disabled
          className="border border-gray-300 dark:border-white/20 text-gray-400 dark:text-white/30 text-xs md:text-sm font-semibold px-4 md:px-5 py-1.5 md:py-2 rounded-full cursor-not-allowed whitespace-nowrap"
        >
          Edit
        </button>
        <button
          disabled
          aria-label="Delete listing"
          className="border border-red-200 dark:border-red-500/30 text-red-300 dark:text-red-400/40 p-2 rounded-full cursor-not-allowed flex-shrink-0"
        >
          <IconTrash size={16} />
        </button>
      </div>
    );
  }
  if (listing.status === "sold") {
    return (
      <div className="flex items-center gap-2 fle-wrap md:flex-nowrap">
        <button
          onClick={() => navigate(`/seller/listings/${listing.id}`)}
          className="bg-navy-700 hover:bg-navy-500 text-white text-xs md:text-sm font-semibold px-4 md:px-5 py-1.5 md:py-2 rounded-full transition-colors whitespace-nowrap"
        >
          View
        </button>
      </div>
    );
  }

  return null;
}

type Tab = "all" | ListingStatus;

const PAGE_SIZE = 6;

export default function MyListings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error } = useMyListings();
  const listings = data?.listings ?? [];
  const total = data?.total ?? 0;

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleSubmitListing = async (id: string) => {
    setSubmittingId(id);
    try {
      await listingsService.updateListingStatus(id, "live");
      queryClient.setQueryData<{ listings: ListingSummary[]; total: number }>(
        ["listings", "my"],
        (old) =>
          old
            ? {
              ...old,
              listings: old.listings.map((l) =>
                l.id === id ? { ...l, status: "live" as const } : l,
              ),
            }
            : old,
      );
      showToast("success", "Listing Uploaded successfully.");
    } catch (err: unknown) {
      const error = err as ApiError;
      const theError =
        error.message === "images_required" ||
          error.message === "description_required"
          ? "Please add at least one photo and Description before uploading this listing"
          : "Failed to submit listing";

      showToast("error", theError);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    try {
      await listingsService.deleteListing(id);
      queryClient.setQueryData<{ listings: ListingSummary[]; total: number }>(
        ["listings", "my"],
        (old) =>
          old
            ? {
              listings: old.listings.filter((l) => l.id !== id),
              total: old.total - 1,
            }
            : old,
      );
      showToast("success", "Listing successfully deleted.");
    } catch {
      showToast("error", "Failed to delete Listing");
    }
  };

  const filtered =
    activeTab === "all"
      ? listings
      : listings.filter((l) => l.status === activeTab);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const count = (status: ListingStatus) =>
    listings.filter((l) => l.status === status).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: `Live (${count("live")})` },
    { key: "pending", label: `Pending (${count("pending")})` },
    { key: "draft", label: `Drafts (${count("draft")})` },
    { key: "rejected", label: `Rejected (${count("rejected")})` },
    { key: "sold", label: `Sold (${count("sold")})` },
  ];

   if (isLoading) {
    return <LoadingState message="Loading..." />;
  }
  

  if (error)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : "Failed to load listings"}
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800">
            My Listings
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage all Listings in one place
          </p>
        </div>
        <button
          onClick={() => navigate("/seller/upload")}
          className="flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors w-full sm:w-auto"
        >
          <IconPlus size={16} /> New Listing
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <IconPackage size={20} />,
            value: total,
            label: "Total Listings",
          },
          {
            icon: <IconLivePhoto size={20} />,
            value: count("live"),
            label: "Live",
          },
          {
            icon: <IconNotes size={20} />,
            value: count("pending"),
            label: "Pending Review",
          },
          {
            icon: <IconBoxPadding size={20} />,
            value: count("draft"),
            label: "Drafts",
          },
        ].map(({ icon, value, label }) => (
          <div
            key={label}
            className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3"
          >
            <span className="text-navy-700 dark:text-white">{icon}</span>
            <div>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">
                {value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setCurrentPage(1);
            }}
            className={`px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-semibold border transition-colors ${activeTab === tab.key
              ? "bg-navy-700 text-white border-navy-700"
              : "bg-white dark:bg-navy-800 text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl overflow-x-auto">
        <div className="min-w-[700px] md:min-w-0">
          <div className="hidden md:flex items-center gap-4 px-5 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-navy-900/40">
            <div className="w-12 flex-shrink-0" />
            <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Listing
            </div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-20 text-right">
              Price
            </div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-32 text-center">
              Status
            </div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-16 text-center">
              Views
            </div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide min-w-[200px] text-right">
              Actions
            </div>
          </div>

          {paginated.map((listing, i) => (
            <div
              key={listing.id}
              className={`flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 px-4 md:px-5 py-4 ${i < paginated.length - 1
                ? "border-b border-gray-100 dark:border-white/5"
                : ""
                } md:border-b md:border-gray-100 md:dark:border-white/5 border border-gray-200 dark:border-white/10 rounded-xl md:rounded-none mb-3 md:mb-0 bg-white dark:bg-navy-800 md:bg-transparent`}
            >
              <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:min-w-0">
                <img
                  src={listing.imageUrl || biologyTextbook}
                  alt={listing.title}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">
                    {listing.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{listing.meta}</p>
                </div>
                <p className="text-sm font-semibold text-navy-700 dark:text-white md:hidden ml-auto">
                  {formatPrice(listing.price)}
                </p>
              </div>

              <p className="hidden md:block text-sm font-semibold text-navy-700 dark:text-white w-20 text-right flex-shrink-0">
                {formatPrice(listing.price)}
              </p>


              <div className="w-full md:w-32 flex justify-start md:justify-center mt-1 md:mt-0 flex-shrink-0">
                <StatusPill status={listing.status} />
              </div>

              <p className="hidden md:block text-sm text-gray-400 w-16 text-center flex-shrink-0">
                {listing.views}
              </p>

              <div className="w-full md:w-auto min-w-[200px] flex items-center justify-start md:justify-end gap-2 mt-2 md:mt-0 flex-shrink-0">
                <ActionButtons
                  listing={listing}
                  onDelete={handleDelete}
                  onSubmit={handleSubmitListing}
                  submitting={submittingId === listing.id}
                />
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-gray-400">No listings found.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-400">
          Showing{" "}
          {paginated.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
          {filtered.length} listings
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold border transition-colors ${currentPage === page
                  ? "bg-navy-700 text-white border-navy-700"
                  : "bg-white dark:bg-navy-800 text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/10 hover:bg-gray-50"
                  }`}
              >
                {page}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}