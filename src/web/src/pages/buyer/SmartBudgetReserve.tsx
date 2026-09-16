import {useMemo, useState, useEffect} from "react";
import {formatPrice} from "../../utils/formatters";
import type { WishlistListing, BrowseCondition } from "../../types/listing";
import { useWishlist } from "../../hooks/useWishlist";
import { useDebounce } from "../../hooks/useDebounce";
import { LoadingState } from "../../components/layout/Spinner";
import { getSmartBudgetPreview } from "../../services/reservationService";
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

type FitState = "fits" | "over_budget" | "unknown"; 


function SelectableItemRow({
    listing,
    selected,
    fitState,
    onToggle,
}: Readonly<{
    listing: WishlistListing;
    fitState: FitState;
    selected: boolean;
    onToggle: (id: string) => void;
}>) {
    const unavailable = listing.status !== "live";
    const overBudget = selected && fitState === "over_budget";

    return (
        <button 
        type = "button"
        onClick = {() => !unavailable && onToggle(listing.id)}
        disabled = {unavailable}
        className = {`w-full text-left bg-white rounded-xl border p-4 flex items-center gap-4 transition-colors ${
            unavailable
            ? "border-gray-200 opacity-50 cursor-not-allowed"
            :overBudget
            ? "border-amber-300 ring-1 ring-amber-300"
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
                        {overBudget && (
                            <span className = "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
                                Over budget
                            </ span>
                        )}
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

    const budgetValue = Number(maxBudget);
    const budgetIsValid = maxBudget.trim() !== "" && !Number.isNaN(budgetValue) && budgetValue > 0;

    const debouncedSelectedIds = useDebounce(selectedIds, 400);
  const debouncedBudget = useDebounce(maxBudget, 400);

  const [wouldReserve, setWouldReserve] = useState<Set<string>>(new Set());
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [previewTotal, setPreviewTotal] = useState<number>(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const ids = Array.from(debouncedSelectedIds);
    const debouncedBudgetValue = Number(debouncedBudget);
    const debouncedBudgetIsValid =
      debouncedBudget.trim() !== "" && !Number.isNaN(debouncedBudgetValue) && debouncedBudgetValue > 0;

    if (ids.length === 0 || !debouncedBudgetIsValid) {
      setWouldReserve(new Set());
      setExcluded(new Set());
      setPreviewTotal(0);
      setPreviewError(null);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);

    getSmartBudgetPreview({ listingIds: ids, maxBudget: debouncedBudgetValue }).then((result) => {
      if (cancelled) return;
      if (result.success) 
      {
        setWouldReserve(new Set(result.data.wouldReserve));
        setExcluded(new Set(result.data.excluded));
        setPreviewTotal(result.data.totalCount);
      } else 
      {
        setPreviewError(result.error.message ?? "Couldn't check what fits your budget.");
      }
      setPreviewLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedSelectedIds, debouncedBudget]);

  const getFitState = (id: string): FitState => {
    if (wouldReserve.has(id)) return "fits";
    if (excluded.has(id)) return "over_budget";
    return "unknown";
  };

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

            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 flex-wrap">
               <label htmlFor="max-budget" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <IconWallet size={18} className="text-navy-700" />
                Maximum budget
               </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R</span>
                    <input
                    id="max-budget"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="0.00"
                    className="w-40 rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-navy-700 focus:border-navy-700"
                 />
                </div>

                <div className="ml-auto text-sm text-gray-500 text-right">
                    {previewLoading ? (
                      <span className="text-gray-400">
                        Checking what fits ... 
                      </span>
                ) : (
                  <>
                    <span className="font-semibold text-gray-800">
                        {wouldReserve.size}
                    </span> of{" "}
                    <span className="font-semibold text-gray-800">
                        {selectedIds.size}
                    </span>{" "}
                    {selectedIds.size === 1 ? "item" : "items"} would fit ·{" "}
                    <span className="font-semibold text-gray-800">
                        {formatPrice(previewTotal)}
                    </span> 
                    total
                  </>
                )}
            </div>
        </div>

      {previewError && (
        <p className="text-xs text-rose-600 -mt-2">
            {previewError}
        </p>
      )}

                {isLoading && <LoadingState message = "Loading wishlist ..." />}

                {!isLoading && error && (
                    <div className = "bg-white rounded-xl border border-rose-200 p-6 text-center">
                        <p className = "text-sm font-semibold text-rose-600">
                            {error instanceof Error ? error.message : " Failed to load wishlist"}
                        </p>
                    </div>
                )}

                {!isLoading &&  !error && listings.length === 0 && (
                    <div className = "bg-white rounded-xl border border-gray-200 p-8 text-center">
                        <p className = "text-sm font-semibold text-gray-700 flex items-center justify-center gap-1.5">
                            <IconHeart size = {14} />
                            Your wishlist is empty
                        </p>
                        <p className = "text-xs text-gray-400 mt-1">
                            Add items to your wishlist first , then come back to reserve within your budget
                        </p>
                    </div>
                )}

                <div className = "flex flex-col gap-3">
                    {listings.map((listing) => (
                        <SelectableItemRow
                        key = {listing.id}
                        listing = {listing}
                        selected = {selectedIds.has(listing.id)}
                        fitState={getFitState(listing.id)}
                        onToggle= {toggleSelected}
                        />
                    ))}
                </div>

                <div className = "sticky bottom-4 flex justify-end">
                    <button
                    type = "button"
                    disabled = {!budgetIsValid || selectedIds.size === 0}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-navy-800 border border-navy-800 text-white px-5 py-2.5 text-sm font-semibold hover:bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        Continue
                    </button>
                </div>
            </div>
            );
        }