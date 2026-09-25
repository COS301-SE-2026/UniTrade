import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getFlaggedListings, decideListing } from "../../services/adminService";
import { queryKeys } from "../../lib/queryKeys";
import { LoadingState } from "../../components/layout/Spinner";
import type { FlaggedListing } from "../../types/admin_disputes";
import { formatDate } from "../../utils/formatters";
import {
  IconAnalyze,
  IconTrendingUp,
  IconCopyCheck,
  IconVersionsOff,
} from "@tabler/icons-react";
import RiskBadge from "../../components/risk/RiskBadge";
import RiskReasons from "../../components/risk/RiskReasons";
import ImageMatchScore from "../../components/risk/ImageMatchScore";
import { isLowImageMatch } from "../../utils/riskUtils";
import { connectionManager } from "../../services/realtime/connectionManager";

type Filter = "All" | "Price anomaly" | "Duplicate image" | "Low image match";
type SortBy = "Oldest First" | "Newest First";

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

function timeInQueue(iso: string) {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 36e5);
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function AdminListingQueue() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const [filter, setFilter] = useState<Filter>("All");
  const [sortBy, setSortBy] = useState<SortBy>("Oldest First");

  const [removeTarget, setRemoveTarget] = useState<FlaggedListing | null>(null);
  const [removeReason, setRemoveReason] = useState("");

  const queryClient = useQueryClient();
  useEffect(() => {
    const off = connectionManager.onListingFlagged(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flaggedListings() });
    });
    return off;
  }, [queryClient]);

  const {
    data: listings = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: queryKeys.flaggedListings(),
    queryFn: (): Promise<FlaggedListing[]> => getFlaggedListings(),
  });

  const decision = useMutation({
    mutationFn: (vars: {
      id: string;
      action: "approve" | "remove";
      reason?: string;
    }) => decideListing(vars.id, { action: vars.action, reason: vars.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flaggedListings() });
      setRemoveTarget(null);
      setRemoveReason("");
    },
  });

  const filteredRows = listings.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      l.title.toLowerCase().includes(q) ||
      l.sellerInitials.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filter === "Price anomaly") return l.reasons.includes("price_anomaly");
    if (filter === "Duplicate image")
      return l.reasons.includes("duplicate_image");
    if (filter === "Low image match") return isLowImageMatch(l.imageMatchScore);
    return true;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortBy === "Oldest First" ? dateA - dateB : dateB - dateA;
  });

  const numTotal = listings.length;
  const numPriceAnomaly = listings.filter((l) =>
    l.reasons.includes("price_anomaly"),
  ).length;
  const numDuplicate = listings.filter((l) =>
    l.reasons.includes("duplicate_image"),
  ).length;
  const numLowMatch = listings.filter((l) =>
    isLowImageMatch(l.imageMatchScore),
  ).length;
  const navigate = useNavigate();

  if (loading) {
    return <LoadingState message="Loading flagged listings..." />;
  }
  if (error) {
    return (
      <p className="text-sm text-red-600">Failed to load flagged listings</p>
    );
  }

  const filters: { label: Filter; count: number }[] = [
    { label: "All", count: numTotal },
    { label: "Price anomaly", count: numPriceAnomaly },
    { label: "Duplicate image", count: numDuplicate },
    { label: "Low image match", count: numLowMatch },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800">
          Flagged Listings
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Review listings held by the automated risk check and approve or remove
          them
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Awaiting Review",
            value: numTotal,
            icon: <IconAnalyze size={20} />,
          },
          {
            label: "Price Anomalies",
            value: numPriceAnomaly,
            icon: <IconTrendingUp size={20} />,
          },
          {
            label: "Duplicate Images",
            value: numDuplicate,
            icon: <IconCopyCheck size={20} />,
          },
          {
            label: "Low Image Match",
            value: numLowMatch,
            icon: <IconVersionsOff size={20} />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3"
          >
            <span className="text-navy-700 dark:text-white">{stat.icon}</span>
            <div>
              <div className="text-2xl font-bold text-navy-700 dark:text-white">
                {stat.value}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3">
          {filters.map(({ label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(label)}
              className={`px-4 md:px-5 py-1.5 rounded-full text-xs md:text-sm font-semibold cursor-pointer transition-colors 
                ${filter === label
                  ? "bg-navy-700 text-white border-navy-700"
                  : "bg-white dark:bg-navy-800 text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          <select
            aria-label="Sort flagged listings"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-4 py-1.5 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-600 focus:outline-none cursor-pointer"
          >
            <option value="Oldest First">Sort: Oldest First</option>
            <option value="Newest First">Sort: Newest First</option>
          </select>
        </div>
      </div>

      {decision.isError && (
        <p className="text-xs text-red-600" role="alert">
          Couldn't save that decision. Please try again.
        </p>
      )}

      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,2.4fr)_8.5rem_minmax(0,1.8fr)_9rem_7rem] lg:gap-x-8 px-4 py-3 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-400 uppercase">
          <div>Listing</div>
          <div>Risk</div>
          <div>Why it was flagged</div>
          <div>Image match</div>
          <div className="text-center">Actions</div>
        </div>

        <div className="space-y-3">
          {sortedRows.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-sm text-gray-500">
              {numTotal === 0
                ? "Nothing is waiting for review"
                : "No flagged listings match your filters"}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedRows.map((l) => (
                <div
                  key={l.listingId}
                  className="p-4 grid gap-4 lg:gap-x-8 lg:items-center lg:grid-cols-[minmax(0,2.4fr)_8.5rem_minmax(0,1.8fr)_9rem_7rem] hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full bg-navy-700 text-white flex items-center justify-center text-xs font-bold shrink-0"
                      title="Seller"
                    >
                      {l.sellerInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-navy-700">
                          {l.title}
                        </p>
                        {l.copyCount > 1 && (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                            ×{l.copyCount} copies
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-normal text-gray-400 mt-0.5">
                        {zar.format(l.price)} · Flagged {formatDate(l.createdAt)}{" "}
                        ({timeInQueue(l.createdAt)} ago)
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 lg:flex-col lg:items-start lg:gap-1">
                      <RiskBadge level={l.riskLevel} />
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                        Score {l.riskScore}/100
                      </span>
                    </div>
                    <div className="w-full max-w-[120px] mx-auto lg:mx-0 lg:max-w-none mt-1.5 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-full rounded-full ${l.riskLevel === "high"
                            ? "bg-red-600"
                            : l.riskLevel === "medium"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, l.riskScore))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 lg:hidden">
                      Why flagged
                    </p>
                    <div className="lg:[&>div]:grid lg:[&>div]:grid-cols-2 lg:[&>div]:gap-x-2 lg:[&>div]:gap-y-1.5 lg:[&>div]:justify-items-start">
                      <RiskReasons reasons={l.reasons} />
                    </div>
                  </div>

                  <div className="min-w-0 lg:[&_*]:whitespace-nowrap">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 lg:hidden">
                      Image match
                    </p>
                    <ImageMatchScore score={l.imageMatchScore} />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/listings/flagged/${l.listingId}`)
                      }
                      className="bg-navy-700 text-white rounded-full font-semibold hover:bg-navy-500 transition-colors text-xs px-5 py-2 w-full"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {removeTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-listing-title"
          >
            <div className="w-full max-w-md bg-white dark:bg-navy-800 rounded-xl p-6 space-y-4">
              <div>
                <h2
                  id="remove-listing-title"
                  className="text-base font-bold text-gray-900 dark:text-white"
                >
                  Remove "{removeTarget.title}"?
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  The seller is notified and sees this reason on their listing.
                </p>
              </div>
              <div>
                <label
                  htmlFor="remove-reason"
                  className="text-xs font-medium text-gray-700"
                >
                  Reason
                </label>
                <textarea
                  id="remove-reason"
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0a1931]"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setRemoveTarget(null);
                    setRemoveReason("");
                  }}
                  className="bg-white text-gray-600 border border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition-colors cursor-pointer text-xs px-4 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!removeReason.trim() || decision.isPending}
                  onClick={() =>
                    decision.mutate({
                      id: removeTarget.listingId,
                      action: "remove",
                      reason: removeReason.trim(),
                    })
                  }
                  className="bg-rose-700 text-white rounded-full font-semibold hover:bg-rose-800 transition-colors cursor-pointer text-xs px-4 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove listing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}