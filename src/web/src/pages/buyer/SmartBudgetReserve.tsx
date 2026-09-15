import React, {useMemo, useState} from "react";
import {formatPrice} from "../../utils/formatters";
import type { WishlistListing, BrowseCondition } from "../../types/listing";
import { useWishlist } from "../../hooks/useWishlist";
import { LoadingState } from "../../components/layout/Spinner";
import {IconWallet, IconCheck, IconHeart} from "@tabler/icons-react";


const conditionColours: Record<
  BrowseCondition,
  { bg: string; text: string; dot: string }
> = {
  like_new: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Good: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Fair: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  Poor: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
};

function ConditionBadge({condition}: Readonly<{condition: BrowseCondition}>) {
    const status = conditionColours[condition] ?? conditionColours.Fair;
    return (
        <span className = {`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${status.text}`}>
            <span className = {`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {condition}
        </span>
    );
}


function SelectableItemRow({
    listing,
    selected,
    onToggle,
}: Readonly<{
    listing: WishlistListing;
    selected: boolean;
    onToggle: (id: string) => void;
}>) {
    const unavailable = listing.status !== "live";

    return (
        <button 
        type = "button"
        onClick = {() => !unavailable && onToggle(listing.id)}
        disabled = {unavailable}
        className = {`w-full text-left bg-white rounded-xl border p-4 flex items-center gap-4 transition-colors ${
            unavailable
            ? "border-gray-200 opacity-50 cursor-not-allowed"
            : selected
            ? "border-navy-700 ring-1 ring-navy-700"
            : "border-gray-200 hover:border-navy-300"
        }`}
        >
            <span 
            className = {`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center ${
                selected ? "bg-navy-800 border-navy-800 " : "border-gray-300 bg-white"
            }`}
            >
                {selected && <IconCheck size={14} className = "text-white" />}
                </span>

                <span className = "w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                    <img src={listing.image} alt={listing.title} className = "w-full h-full object-cover" />

            </span>

            <span className = "flex-1 min-w-0">
                <span className = "flex items-center gap-2 flex-wrap">
                    <span className = "text-sm font-bold text-gray-800 truncate">
                        {listing.title}
                        <ConditionBadge condition = {listing.condition} />
                    </span>
                    <span className = "block text-xs text-gray-400 mt-0.5">
                        Listed by{" "}
                        <span className = "font-semibold text-gray-500">
                            {listing.sellerName ?? "Unknown seller"}
                        </span>
                        {unavailable && 
                            <span className = "text-rose-500 font-semibold"> No longer available 
                            </span>
                        }
                    </span>
                </span>

                <span className = "text-sm font-bold text-gray-800 shrink-0">
                    {formatPrice(listing.price)}
                </span>
                </span>
        </button>
  );
}

export default function SmartBudgetReserve() {
    const {data, isLoading, error} = useWishlist();
    const listings = useMemo(() => data?.listings ?? [], [data]);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [maxBudget, setMaxBudget] = useState<string>("");

    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if(next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };


    const selectedListings = useMemo(
        () => listings.filter((l) => selectedIds.has(l.id)),
        [listings, selectedIds],
    );


    const selectedTotal = useMemo(
        () => selectedListings.reduce((sum, l) => sum + l.price, 0),
        [selectedListings],
    );

    const budgetValue = Number(maxBudget);
    const budgetIsValid = maxBudget.trim() !== "" && !Number.isNaN(budgetValue) && budgetValue > 0;

    return (
        <div className = "flex flex-col gap-6">
            <div>
                <h1 className = "font-['Fraunces'] font-normal text-[32px] text-gray-800">
                    Reserve within your desired budget
                </h1>
                <p className = "text-sm text-gray-400 mt-1">
                    Pick the items you are interested in and set a budget. We will work out the best combination that fits.
                </p>
            </div>

            
        </div>
    )

}