import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listingsService } from "../../services/listingsService";
import { formatPrice } from "../../utils/formatters";
import type { WishlistListing, BrowseCondition } from "../../types/listing";
import { createReservation } from "../../services/reservationService";

const conditionColours: Record<BrowseCondition, string> = {
  like_new: "bg-green-100 text-green-700",
  Good: "bg-green-100 text-green-700",
  Fair: "bg-yellow-100 text-yellow-700",
  Poor: "bg-red-100 text-red-700",
};

function WishlistCard({
  listing,
  onClick,
  onRemoved,
}: {
  listing: WishlistListing;
  onClick: () => void;
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

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col cursor-pointer hover:border-navy-700 dark:hover:border-white/30 transition-colors">
      <div className="relative">
        <img
          src={listing.image}
          alt={listing.title}
          onClick={onClick}
          className="w-full h-48 object-cover"
        />
        {unavailable && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy-700 text-white capitalize">
            {listing.status}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-2">
            {listing.title}
          </p>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${conditionColours[listing.condition]}`}
          >
            {listing.condition}
          </span>
        </div>

        <p className="text-xs text-gray-400 capitalize">{listing.category}</p>
        <p className="text-sm font-bold text-gray-800 dark:text-white">
          {formatPrice(listing.price)}
        </p>

        {reserveError && (
          <p className="text-xs text-rose-600">{reserveError}</p>
        )}

        <div className="flex flex-col gap-2 mt-auto pt-2">
          <button
            onClick={handleReserve}
            disabled={reserving || reserved || unavailable}
            className="w-full py-2 bg-navy-700 text-white text-sm font-semibold rounded-lg hover:bg-navy-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reserved
              ? "Reserved"
              : reserving
                ? "Reserving..."
                : unavailable
                  ? "Unavailable "
                  : "Reserve"}
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="w-full py-2 border border-gray-3000 dark:border-white/20 text-gray-700 dark:text-white text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {removing ? "Removing..." : "Remove from Wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Wishlist() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<WishlistListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listingsService
      .getWishlist()
      .then((data) => {
        setListings(data.listings);
        setTotal(data.total);
      })
      .catch(() => setError("Failed to load your wishlist "))
      .finally(() => setLoading(false));
  }, []);

  const handleRemoved = (id: string) => {
    setListings((curr) => curr.filter((l) => l.id !== id));
    setTotal((t) => t - 1);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );

  if (error)
    return (
      <div className=" flex items-center justify-center h-64">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className=" text-2xl font-extrabold text-gray-800 dark:text-white">
          Your Wishlist
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {total} {total === 1 ? "item" : "items"} saved for later
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-cl border border-gray-200 dark:border-white/10 p-8 text-center">
          <p className="text-sm text-gray-400">
            Your wishlist is currently empty. Browse listings and tap "Add to
            Wishlist " to save items here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <WishlistCard
            key = {listing.id}
            listing={listing}
            onClick = {() => navigate(`/buyer/listings/${listing.id}`)}
            onRemoved={handleRemoved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
