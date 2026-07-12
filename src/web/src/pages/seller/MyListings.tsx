import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconPackage,
  IconNotes,
  IconBoxPadding,
  IconPlus,
  IconTrash,
  IconLivePhoto
} from "@tabler/icons-react";
import { listingsService } from "../../services/listingsService";
import { formatPrice } from "../../utils/formatters";
import type { ListingSummary, ListingStatus } from "../../types/listing";
import StatusPill from "../../components/layout/ui/StatusPill";
import biologyTextbook from "../../assets/bio-textbook.jpg";
import type { ApiError } from "../../types/Reservations";
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
      className="border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
    >
      <IconTrash size={16} />
    </button>
  );

  if (listing.status === "live" || listing.status === "pending") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/seller/listings/${listing.id}`)}
          className="bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
        >
          View
        </button>
        <button
          onClick={() => navigate(`/seller/editListing/${listing.id}`)}
          className="border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Edit
        </button>
        {deleteBtn}
      </div>
    );
  }

  if (listing.status === "draft") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit(listing.id)}
          disabled={submitting}
          className="bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
        >
          {submitting ? "Submitting...." : "Submit"}
        </button>
        <button
          onClick={() => navigate(`/seller/editListing/${listing.id}`)}
          className="border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Edit
        </button>
        {deleteBtn}
      </div>
    );
  }

  if (listing.status === "rejected") {
    return (
      <div className="flex gap-2">
        <button className="bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">
          Resubmit
        </button>
        <button
          onClick={() => navigate(`/seller/editListing/${listing.id}`)}
          className="border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Edit
        </button>
        {deleteBtn}
      </div>
    );
  }

  return null;
}

type Tab = "all" | ListingStatus;

const PAGE_SIZE = 6;

export default function MyListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleSubmitListing = async (id: string) => {
    setSubmittingId(id);
    try {
      await listingsService.updateListingStatus(id, "live");
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "live" } : l)),
      );
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(
        error.message === "images_required" || error.message === "description_required"
          ? "Please add at least one photo and Description before uploading this listing"

          : "Failed to submit listing",);



    }

    finally {
      setSubmittingId(null);
    }
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    try {
      await listingsService.deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      setTotal((t) => t - 1);
    } catch {
      setError("Failed to delete listing");
    }
  };

  useEffect(() => {
    listingsService
      .getMyListings()
      .then((data) => {
        setListings(data.listings);
        setTotal(data.total);
      })
      .catch(() => setError("Failed to load listings"))
      .finally(() => setLoading(false));
  }, []);

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
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
            My Listings
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage all Listings in one place
          </p>
        </div>
        <button
          onClick={() => navigate("/seller/upload")}
          className="flex items-center gap-2 bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
        >
          <IconPlus size={16} /> New Listing
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
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
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition-colors ${activeTab === tab.key
              ? "bg-navy-700 text-white border-navy-700"
              : "bg-white dark:bg-navy-800 text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-navy-900/40">
          <div className="w-12 flex-shrink-0" />
          <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Listing
          </div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-16 text-right">
            Price
          </div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-32 text-center">
            Status
          </div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-16 text-center">
            Views
          </div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-44 text-center">
            Actions
          </div>
        </div>

        {paginated.map((listing, i) => (
          <div
            key={listing.id}
            className={`flex items-center gap-4 px-5 py-4 ${i < paginated.length - 1
              ? "border-b border-gray-100 dark:border-white/5"
              : ""
              }`}
          >
            <img
              src={listing.imageUrl || biologyTextbook}
              alt={listing.title}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">
                {listing.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{listing.meta}</p>
            </div>
            <p className="text-sm font-semibold text-navy-700 dark:text-white w-16 text-right">
              {formatPrice(listing.price)}
            </p>
            <div className="w-32 flex justify-center">
              <StatusPill status={listing.status} />
            </div>
            <p className="text-sm text-gray-400 w-16 text-center">
              {listing.views}
            </p>
            <div className="w-44 flex justify-end">
              <ActionButtons listing={listing} onDelete={handleDelete}
                onSubmit={handleSubmitListing}
                submitting={submittingId === listing.id} />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">No listings found.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing{" "}
          {paginated.length === 0
            ? 0
            : (currentPage - 1) * PAGE_SIZE + 1}
          –{Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
          {filtered.length} listings
        </p>
        <div className="flex gap-2">
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
