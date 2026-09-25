import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmModal } from "../admin/AdminReviewShared";
import {
  IconPackage,
  IconNotes,
  IconBoxPadding,
  IconPlus,
  IconTrash,
  IconLivePhoto,
  IconChevronDown,
} from "@tabler/icons-react";
import { listingsService } from "../../services/listingsService";
import { formatPrice } from "../../utils/formatters";
import type { ListingSummary, ListingStatus } from "../../types/listing";
import StatusPill from "../../components/layout/ui/StatusPill";
import { BundleDiscountCard } from "../../components/layout/BundleDiscount";
import biologyTextbook from "../../assets/bio-textbook.jpg";
import type { ApiError } from "../../types/Reservations";
import { useToast } from "../../components/layout/useToast";
import { useMyListings } from "../../hooks/useMyListings";
import { LoadingState } from "../../components/layout/Spinner";
import { useSearchQuery } from "../../hooks/useSearchQuery";

function ActionButtons({
  listing,
  onDelete,
  onSubmit,
  onResubmit,
  submitting,
}: Readonly<{
  listing: ListingSummary;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  onResubmit: (id: string, remaining: number) => void;
  submitting: boolean;
}>) {
  const navigate = useNavigate();

  const deleteBtn = (
    <button
      type="button"
      onClick={() => onDelete(listing.id)}
      aria-label="Delete listing"
      className="border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
    >
      <IconTrash size={16} />
    </button>
  );

  const btnClass =
    "px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full transition-colors whitespace-nowrap flex-shrink-0";

  const wrapper = "flex items-center justify-start md:justify-end gap-2 flex-nowrap";

  if (listing.status === "live" || listing.status === "pending") {
    return (
      <div className={wrapper}>
        <button
          type="button"
          onClick={() => navigate(`/seller/listings/${listing.id}`)}
          className={`bg-navy-700 hover:bg-navy-500 text-white ${btnClass}`}
        >
          View
        </button>
        <button
          type="button"
          onClick={() => navigate(`/seller/editListing/${listing.id}`)}
          className={`border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 ${btnClass}`}
        >
          Edit
        </button>
        {deleteBtn}
      </div>
    );
  }

  if (listing.status === "banned") {
    return (
      <div className={wrapper}>
        <button
          type="button"
          onClick={() => navigate(`/seller/listings/${listing.id}`)}
          className={`bg-navy-700 hover:bg-navy-500 text-white ${btnClass}`}
          >
            View
          </button>
      </div>
    );
  }
  if (listing.status === "draft") {
    return (
      <div className={wrapper}>
        <button
          type="button"
          onClick={() => onSubmit(listing.id)}
          disabled={submitting}
          className={`bg-navy-700 hover:bg-navy-500 text-white ${btnClass}`}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => navigate(`/seller/editListing/${listing.id}`)}
          className={`border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 ${btnClass}`}
        >
          Edit
        </button>
        {deleteBtn}
      </div>
    );
  }

  if (listing.status === "rejected") {
    return (
      <div className={wrapper}>
        <button
          type="button"
          className={`bg-navy-700 hover:bg-navy-500 text-white ${btnClass}`}
        >
          Resubmit
        </button>
        <button
          type="button"
          onClick={() => navigate(`/seller/editListing/${listing.id}`)}
          className={`border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 ${btnClass}`}
        >
          Edit
        </button>
        {deleteBtn}
      </div>
    );
  }

  if (listing.status === "reserved") {
    return (
      <div className={wrapper}>
        <button
          type="button"
          onClick={() => navigate(`/seller/listings/${listing.id}`)}
          className={`bg-navy-700 hover:bg-navy-500 text-white ${btnClass}`}
        >
          View
        </button>
        <button
          type="button"
          disabled
          className={`border border-gray-300 dark:border-white/20 text-gray-400 dark:text-white/30 cursor-not-allowed ${btnClass}`}
        >
          Edit
        </button>
        <button
          type="button"
          disabled
          aria-label="Delete listing"
          className="border border-red-200 dark:border-red-500/30 text-red-300 dark:text-red-400/40 p-1.5 rounded-full cursor-not-allowed flex-shrink-0"
        >
          <IconTrash size={16} />
        </button>
      </div>
    );
  }

  if (listing.status === "removed") {
    const max = listing.maxResubmissions ?? 5;
    const used = listing.resubmissionCount ?? 0;
    const remaining = max - used;
    const canResubmit = remaining > 0;

    return (
      <div className={wrapper}>
        <button
          type="button"
          onClick={() => navigate(`/seller/editListing/${listing.id}`)}
          className={`border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 ${btnClass}`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onResubmit(listing.id, remaining)}
          disabled={!canResubmit || submitting}
          title={!canResubmit ? "Resubmission limit reached" : undefined}
          className={`bg-navy-700 hover:bg-navy-500 disabled:opacity-40 disabled:cursor-not-allowed text-white ${btnClass}`}
        >
          {submitting
            ? "Resubmitting..."
            : canResubmit
              ? "Resubmit"
              : "Limit reached"}
        </button>
        {deleteBtn}
      </div>
    );
  }

  if (listing.status === "under_review") {
    return (
      <div className={wrapper}>
        <button
          type="button"
          onClick={() => navigate(`/seller/listings/${listing.id}`)}
          className={`bg-navy-700 hover:bg-navy-500 text-white ${btnClass}`}
        >
          View
        </button>
        <button
          type="button"
          disabled
          className={`border border-gray-300 dark:border-white/20 text-gray-400 dark:text-white/30 cursor-not-allowed ${btnClass}`}
        >
          Edit
        </button>
        <button
          type="button"
          disabled
          aria-label="Delete listing"
          className="border border-red-200 dark:border-red-500/30 text-red-300 dark:text-red-400/40 p-1.5 rounded-full cursor-not-allowed flex-shrink-0"
        >
          <IconTrash size={16} />
        </button>
      </div>
    );
  }

  if (listing.status === "sold") {
    return (
      <div className={wrapper}>
        <button
          type="button"
          onClick={() => navigate(`/seller/listings/${listing.id}`)}
          className={`bg-navy-700 hover:bg-navy-500 text-white ${btnClass}`}
        >
          View
        </button>
      </div>
    );
  }

  return null;
}

function GroupCard({
  group,
  expanded,
  onToggle,
  onDelete,
  onSubmit,
  onResubmit,
  submittingId,
}: Readonly<{
  group: { key: string; items: ListingSummary[] };
  expanded: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  onResubmit: (id: string, remaining: number) => void;
  submittingId: string | null;
}>) {
  const first = group.items[0];
  const liveCount = group.items.filter((l) => l.status === "live").length;
  const prices = group.items.map((l) => l.price);
  const priceLabel =
    Math.min(...prices) === Math.max(...prices)
      ? formatPrice(prices[0])
      : `${formatPrice(Math.min(...prices))}-${formatPrice(Math.max(...prices))}`;

  const allSameStatus = group.items.every((l) => l.status === first.status);
  const isGroupFlagged =
    allSameStatus &&
    (first.status === "removed" || first.status === "under_review" || first.status === "banned");

  const countLabel = isGroupFlagged
    ? `${group.items.length} ${group.items.length === 1 ? "copy" : "copies"}`
    : `${liveCount} of ${group.items.length} available`;
  const hasMediumRisk = group.items.some(
    (l) => l.status === "live" && l.riskLevel === "medium",
  );

  return (
    <div className="border-b border-gray-100 dark:border-white/5">
      <div className="px-4 md:px-5 py-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div
            onClick={onToggle}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onToggle();
            }}
            className="flex items-center gap-3 md:gap-4 md:flex-1 md:min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src={first.imageUrl || biologyTextbook}
              alt={first.title}
              className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">
                {first.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">
                {countLabel}
              </p>

              {hasMediumRisk && !isGroupFlagged && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 block">
                  Reduced visibility on some copies · open to review
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 md:hidden">
            <p className="text-sm font-semibold text-navy-700 dark:text-white whitespace-nowrap">
              {priceLabel}
            </p>
            {isGroupFlagged && <StatusPill status={first.status} />}
          </div>

          <p className="hidden md:block text-sm font-semibold text-navy-700 dark:text-white w-24 text-right flex-shrink-0 whitespace-nowrap">
            {priceLabel}
          </p>

          <div className="hidden md:flex w-28 justify-center flex-shrink-0">
            {isGroupFlagged ? <StatusPill status={first.status} /> : null}
          </div>

          <div className="flex justify-start md:justify-end md:w-64 flex-shrink-0">
            {isGroupFlagged ? (
              <ActionButtons
                listing={first}
                onDelete={() => group.items.forEach((l) => onDelete(l.id))}
                onSubmit={onSubmit}
                onResubmit={onResubmit}
                submitting={group.items.some((l) => submittingId === l.id)}
              />
            ) : (
              <button
                type="button"
                onClick={onToggle}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Toggle group details"
              >
                <IconChevronDown
                  size={18}
                  className={`transition-transform ${expanded ? "rotate-180" : ""
                    }`}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && !isGroupFlagged && (
        <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-navy-900/20">
          {group.items.map((listing, idx) => (
            <div
              key={listing.id}
              className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-4 md:px-5 py-3 border-b border-gray-50 dark:border-white/5 last:border-0"
            >
              <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:min-w-0">
                <div
                  className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center"
                  aria-hidden
                >
                  <span className="text-xs font-semibold text-gray-400">
                    {idx + 1}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                  Copy {idx + 1}
                </p>
              </div>

              <p className="hidden md:block text-sm font-semibold text-navy-700 dark:text-white w-24 text-right flex-shrink-0 whitespace-nowrap">
                {formatPrice(listing.price)}
              </p>

              <div className="flex items-center justify-between gap-3 md:hidden">
                <p className="text-sm font-semibold text-navy-700 dark:text-white whitespace-nowrap">
                  {formatPrice(listing.price)}
                </p>
                <StatusPill status={listing.status} />
              </div>

              <div className="hidden md:flex w-28 justify-center flex-shrink-0">
                <StatusPill status={listing.status} />
              </div>

              <div className="flex justify-start md:justify-end md:w-64 flex-shrink-0">
                <ActionButtons
                  listing={listing}
                  onDelete={onDelete}
                  onSubmit={onSubmit}
                  onResubmit={onResubmit}
                  submitting={submittingId === listing.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Tab = "all" | ListingStatus;

const PAGE_SIZE = 6;

function VisibilityHint({
  listing,
  onOpen,
}: {
  listing: ListingSummary;
  onOpen: () => void;
}) {
  if (listing.status !== "live" || listing.riskLevel !== "medium") return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline mt-0.5 block whitespace-nowrap text-left"
    >
      Reduced visibility
      {listing.visibilityScore != null ? ` (${listing.visibilityScore})` : ""}
      {" · click to review"}
    </button>
  );
}
export default function MyListings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error } = useMyListings();
  const listings = useMemo(() => data?.listings ?? [], [data?.listings]);
  const total = data?.total ?? 0;

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const searchQuery = useSearchQuery();
  const [resubmitTarget, setResubmitTarget] = useState<{
    id: string;
    remaining: number;
  } | null>(null);
  const [resubmitSubmitting, setResubmitSubmitting] = useState(false);

  const handleResubmitConfirm = async () => {
    if (!resubmitTarget) return;
    setResubmitSubmitting(true);
    try {
      const result = await listingsService.resubmitListing(resubmitTarget.id);
      queryClient.setQueryData<{ listings: ListingSummary[]; total: number }>(
        ["listings", "my"],
        (old) =>
          old
            ? {
              ...old,
              listings: old.listings.map((l) =>
                l.id === resubmitTarget.id
                  ? {
                    ...l,
                    status: result.status,
                    resubmissionCount: result.resubmissionCount,
                  }
                  : l,
              ),
            }
            : old,
      );
      showToast("success", "Listing resubmitted for review.");
      setResubmitTarget(null);
    } catch {
      showToast("error", "Failed to resubmit listing");
    } finally {
      setResubmitSubmitting(false);
    }
  };

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
          error.message === "description_required" ||
          error.message === "seller_not_verified"
          ? "Please add at least one photo and Description before uploading this listing, and make sure you are fully verified. If you are not verified, your listing will only go live once you are verified."
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

  const filtered = useMemo(() => {
    let result =
      activeTab === "all"
        ? listings
        : listings.filter((l) => l.status === activeTab);

    if (searchQuery) {
      result = result.filter((l) => l.title.toLowerCase().includes(searchQuery));
    }

    return result;
  }, [listings, activeTab, searchQuery]);

  type Group = { key: string; items: ListingSummary[] };

  const grouped: Group[] = useMemo(() => {
    const map = new Map<string, ListingSummary[]>();
    const singles: Group[] = [];
    for (const l of filtered) {
      if (!l.listingGroupId) {
        singles.push({ key: l.id, items: [l] });
        continue;
      }
      const arr = map.get(l.listingGroupId) ?? [];
      arr.push(l);
      map.set(l.listingGroupId, arr);
    }

    const groups = [...map.entries()].map(([key, items]) => ({ key, items }));
    return [...groups, ...singles];
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(grouped.length / PAGE_SIZE));
  const paginated = grouped.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const count = (status: ListingStatus) =>
    listings.filter((l) => l.status === status).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: `Live` },
    { key: "pending", label: `Pending` },
    { key: "draft", label: `Drafts` },
    { key: "rejected", label: `Rejected` },
    { key: "sold", label: `Sold` },
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
          type="button"
          onClick={() => navigate("/seller/upload")}
          className="flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors w-full sm:w-auto"
        >
          <IconPlus size={16} /> New Listing
        </button>
      </div>

      {count("live") >= 1 && (
        <BundleDiscountCard compact liveCount={count("live")} />
      )}

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
            type="button"
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setCurrentPage(1);
            }}
            className={`px-4 md:px-5 py-1.5 rounded-full text-xs md:text-sm font-semibold cursor-pointer transition-colors ${activeTab === tab.key
              ? "bg-navy-700 text-white border-navy-700"
              : "bg-white dark:bg-navy-800 text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <div className="hidden md:flex items-center gap-4 px-5 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-navy-900/40">
          <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Listing
          </div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-24 text-right">
            Price
          </div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-28 text-center">
            Status
          </div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-64 text-right">
            Actions
          </div>
        </div>

        {paginated.map((group, i) => {
          if (group.items.length === 1) {
            const listing = group.items[0];
            return (
              <div
                key={listing.id}
                className={`px-4 md:px-5 py-4 ${i < paginated.length - 1
                  ? "border-b border-gray-100 dark:border-white/5"
                  : ""
                  }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                  <div className="flex items-center gap-3 md:flex-1 md:min-w-0">
                    <img
                      src={listing.imageUrl || biologyTextbook}
                      alt={listing.title}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">
                        {listing.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">
                        {listing.meta}
                      </p>
                      {(listing.status === "under_review" ||
                        (listing.status === "removed" ||
                          (listing.maxResubmissions ?? 0) > 0)) && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/seller/listings/${listing.id}`)
                            }
                            className="text-[11px] text-[#00aaff] hover:underline mt-0.5 block whitespace-nowrap"
                          >
                            View details for reasons
                          </button>
                        )}
                      <VisibilityHint
                        listing={listing}
                        onOpen={() => navigate(`/seller/listings/${listing.id}`)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 md:hidden">
                    <p className="text-sm font-semibold text-navy-700 dark:text-white whitespace-nowrap">
                      {formatPrice(listing.price)}
                    </p>
                    <StatusPill status={listing.status} />
                  </div>

                  <p className="hidden md:block text-sm font-semibold text-navy-700 dark:text-white w-24 text-right flex-shrink-0 whitespace-nowrap">
                    {formatPrice(listing.price)}
                  </p>

                  <div className="hidden md:flex w-28 justify-center flex-shrink-0">
                    <StatusPill status={listing.status} />
                  </div>

                  <div className="flex justify-start md:justify-end md:w-64 flex-shrink-0">
                    <ActionButtons
                      listing={listing}
                      onDelete={handleDelete}
                      onSubmit={handleSubmitListing}
                      submitting={submittingId === listing.id}
                      onResubmit={(id, remaining) =>
                        setResubmitTarget({ id, remaining })
                      }
                    />
                  </div>
                </div>
              </div>
            );
          }
          return (
            <GroupCard
              key={group.key}
              group={group}
              expanded={expandedGroups.has(group.key)}
              onToggle={() =>
                setExpandedGroups((prev) => {
                  const next = new Set(prev);
                  if (next.has(group.key)) next.delete(group.key);
                  else next.add(group.key);
                  return next;
                })
              }
              onDelete={handleDelete}
              onSubmit={handleSubmitListing}
              submittingId={submittingId}
              onResubmit={(id, remaining) =>
                setResubmitTarget({ id, remaining })
              }
            />
          );
        })}

        {paginated.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">No listings found.</p>
          </div>
        )}
      </div>

      {resubmitTarget && (
        <ConfirmModal
          title="Resubmit listing"
          message={`You have ${resubmitTarget.remaining} resubmission${resubmitTarget.remaining === 1 ? "" : "s"
            } left. Do you want to continue?`}
          confirmLabel="Resubmit"
          tone="neutral"
          submitting={resubmitSubmitting}
          showReasonField={false}
          onCancel={() => setResubmitTarget(null)}
          onConfirm={handleResubmitConfirm}
        />
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-400 whitespace-nowrap">
          Showing {grouped.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, grouped.length)} of{" "}
          {grouped.length} listings
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
            (page) => (
              <button
                type="button"
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