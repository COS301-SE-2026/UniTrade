import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { listingsService } from "../../services/listingsService";
import { formatPrice } from "../../utils/formatters";
import type { WishlistListing, BrowseCondition, WishlistResponse } from "../../types/listing";
import { createReservation } from "../../services/reservationService";
import { SummaryCard } from "./Reservation";
import {
  IconHeart,
  IconReceipt2,
  IconBookmark,
  IconTrash,
  IconFilter,
  IconChevronDown,
} from "@tabler/icons-react";
import { useWishlist } from "../../hooks/useWishlist";
import { queryClient } from "../../lib/queryClient";
import { LoadingState } from '../../components/layout/Spinner';
import { useSearchQuery } from "../../hooks/useSearchQuery";

type SortOption = "Date added" | "Price low" | "Price high";

const conditionColours: Record<
  BrowseCondition,
  { bg: string; text: string; dot: string }
> = {
  like_new: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  Good: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  Fair: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  Poor: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
};

function ConditionBadge({ condition }: { condition: BrowseCondition }) {
  const s = conditionColours[condition] ?? conditionColours.Fair;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {condition}
    </span>
  );
}

function WishlistCard({
  listing,
  onRemoved,
}: {
  listing: WishlistListing;
  onRemoved: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const handleReserve = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setReserving(true);
    setReserveError(null);

    const result = await createReservation({ listingId: String(listing.id) });

    if (result.success) {
      setReserved(true);
      navigate("/buyer/reservations");
    } else if (result.error.code === "self_reserve") {
      setReserveError("You cant reserve your own listing.");
    } else if (result.error.code === "already_reserved") {
      setReserveError(
        "Sorry, This Item has already been reserved by someone else",
      );
    } else {
      setReserveError(result.error.message ?? "Could not reserve this item.");
    }
    setReserving(false);
  };

  const handleRemove = async () => {
    //e.stopPropagation()
    if (removing) return;
    setRemoving(true);
    try {
      await listingsService.removeFromWishlist(String(listing.id));
      onRemoved(listing.id);
    } catch {
      setRemoving(false);
    }
  };

  const unavailable = listing.status !== "live";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <img
        src={listing.image}
        alt={listing.title}
        onClick={() => navigate(`/listings/${listing.id}`)}
        className="w-20 h-20 rounded-lg object-cover shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
      />

      <div className="flex-1 min-w-0">
        <div
          onClick={() => navigate(`/listings/${listing.id}`)}
          className="min-w-0 cursor-pointer"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-800 truncate">
              {listing.title}
            </p>
            <ConditionBadge condition={listing.condition} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Listed by{" "}
            <span className="font-semibold text-gray-500">
              {listing.sellerName ?? "Unknown seller"}
            </span>{" "}
            . {listing.category}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 mt-2 flex-wrap">
          <span className="text-sm font-bold text-gray-800">
            {formatPrice(listing.price)}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReserve}
              disabled={reserving || reserved || unavailable}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-navy-800 border border-navy-800 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconBookmark size={16} />
              {reserved
                ? "Reserved "
                : reserving
                  ? "Reserving..."
                  : unavailable
                    ? "Unavailable"
                    : "Reserve"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 text-rose-600 px-4 py-2 text-sm font-semibold hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconTrash size={16} />
              {removing ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
        {reserveError && (
          <p className="text-xs text-rose-600 mt-2">{reserveError}</p>
        )}
      </div>
    </div>
  );
}

export default function Wishlist() {
  //const navigate = useNavigate()
  const [sortOption, setSortOption] = useState<SortOption>("Date added");
  const [sortOpen, setSortOpen] = useState(false);
  const { data, isLoading, error } = useWishlist();
  const listings = useMemo(() => data?.listings ?? [], [data]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [conditionFilter, setConditionFilter] = useState<
    BrowseCondition | "All"
  >("All");

  const handleRemoved = (id: string) => {
    queryClient.setQueryData<WishlistResponse>(["wishlist"], (old) =>
      old && { ...old, listings: old.listings.filter((l) => l.id !== id), total: old.total-1},
    );
  };

  const searchQuery = useSearchQuery()
  const filtered = useMemo(() => {
    let result = conditionFilter === 'All'
    ? listings
    : listings.filter((l) => l.condition === conditionFilter)

    if (searchQuery) {
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(searchQuery) ||
        (l.sellerName ?? '').toLowerCase().includes(searchQuery)
      )
    }

    return result
  }, [listings, conditionFilter, searchQuery])

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sortOption === "Price low") copy.sort((a, b) => a.price - b.price);
    else if (sortOption === "Price high")
      copy.sort((a, b) => b.price - a.price);
    else
      copy.sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
      );
    return copy;
  }, [filtered, sortOption]);

  const totalValue = useMemo(
    () => listings.reduce((sum, l) => sum + l.price, 0),
    [listings],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800">
            Your wishlist
          </h1>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
            <IconHeart size={14} />
            {listings.length} {listings.length === 1 ? "item" : "items"} saved
            for later
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:border-navy-700 transition-colors"
            >
              Sort by : {sortOption.toLowerCase()}
              <IconChevronDown size={12} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 z-20 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-2">
                {(
                  ["Date added", "Price low", "Price high"] as SortOption[]
                ).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSortOption(opt);
                      setSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortOption === opt ? "text-navy-700 font-semibold" : "text-gray-600"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:border-navy-700 transition-colors"
            >
              <IconFilter size={12} />
              Filter
              <IconChevronDown size={12} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 z-20 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-2">
                {(["All", "like_new", "Good", "Fair", "Poor"] as const).map(
                  (opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setConditionFilter(opt);
                        setFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm capitalize hover:bg-gray-50  ${conditionFilter === opt ? "text-navy-700 font-semibold" : "text-gray-600"}`}
                    >
                      {opt === "like_new" ? "Like New" : opt}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <SummaryCard
          label="Saved items"
          value={String(listings.length)}
          icon={<IconHeart size={20} />}
        />
        <SummaryCard
          label="Total wishlist value"
          value={formatPrice(totalValue)}
          icon={<IconReceipt2 size={20} />}
        />
      </div>

      {isLoading && <LoadingState message = "Loading wishlist..." />}

        {!isLoading && error && (
          <div className="bg-white rounded-xl border border-rose-200 p-6 text-center">
            <p className="text-sm font-semibold text-rose-600">
              {error instanceof Error ? error.message : "Failed to listings"}
            </p>
          </div>
        )}

        {!isLoading && !error && sorted.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-sm font-semibold text-gray-700">
              Your wishlist is empty
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {searchQuery
              ? `No items match "${searchQuery}".`
              : 'Browse listings and tap "Add to Wishlist" to save items here.' }

            </p>
          </div>
        )}

        {sorted.map((listing) => (
          <WishlistCard
            key={listing.id}
            listing={listing}
            onRemoved={handleRemoved}
          />
        ))}
      </div>
  );
}
