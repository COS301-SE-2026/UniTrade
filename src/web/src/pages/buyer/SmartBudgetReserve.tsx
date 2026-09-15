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
