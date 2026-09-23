import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IconTag } from "@tabler/icons-react";
import { bundleDiscountKey, useBundleDiscount } from "../../hooks/useBundleDiscount";
import { saveBundleDiscount } from "../../services/bundleDiscountService";

import { useToast } from "./useToast";


const FALLBACK_LIMITS = { minItemsFloor: 3, minItemsCeiling: 10, minPercent: 1, maxPercent: 30 }

export function BundleDiscountCard({
    compact = false,
    liveCount,
}: Readonly<{ compact?: boolean; liveCount?: number }>) {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { data, isLoading, error } = useBundleDiscount();
    const limits = data?.limits ?? FALLBACK_LIMITS;

    const [open, setOpen] = useState(!compact);
    const [enabled, setEnabled] = useState(false);
    const [minItems, setMinItems] = useState(3);
    const [percent, setPercent] = useState("10");
    const [saving, setSaving] = useState(false);
    const [prevData, setPrevData] = useState(data);

    if (data !== prevData) {
        setPrevData(data);
        if (data) {
            setEnabled(data.minItems !== null && data.percent !== null);
            setMinItems(data.minItems ?? limits.minItemsFloor);
            setPercent(String(data.percent ?? 10));
        }
    }
    const pct = Number(percent);
    const percentValid = Number.isInteger(pct) && pct >= limits.minPercent && pct <= limits.maxPercent;
    const active = data?.minItems != null && data?.percent != null;
    const summary = active ?
        `${data!.percent}% off when a buyer reserves ${data!.minItems}+ of your listings. Buyers get this automatically when they reserve several of your items together within a budget.`
        : liveCount
            ? `You have ${liveCount} live listing${liveCount === 1 ? "" : "s"}. Offer a bundle discount to encourage multi-item buys.` : "Offer a discount when buyers reserve several of your listings together.";

    const handleSave = async () => {
        if (enabled && !percentValid) return;
        setSaving(true);
        try {
            const saved = await saveBundleDiscount(
                enabled ? { minItems, percent: pct }
                    : { minItems: null, percent: null },
            );

            queryClient.setQueryData(bundleDiscountKey, saved);
            showToast("success", enabled ? "Bundle discount saved." : "Bundle discount turned off.");
            if (compact) setOpen(false);
        }
        catch (e) {
            showToast("error", e instanceof Error ? e.message : "Could not save your bundle discount.");
        }

        finally {
            setSaving(false);
        }


    }

    if (isLoading) return <div className="h-16 rounded-xl bg-gray-100 animate-pulse" />;
    if (error || !data) return compact ? null : (
        <p className="text-sm text-red-500">Could not load your bundle discount.</p>
    );

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-full bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
                    <IconTag size={18} />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">Bundle discount</p>
                    <p className="text-xs text-gray-500 mt-0.5">{summary}</p>
                </div>
                {compact && (
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-300 text-navy-700 hover:bg-gray-50">
                        {open ? "Close" : active ? "Edit" : "Set up"}

                    </button>
                )}
            </div>

            {open && (
                <div className="mt-4 flex-col gap-3 border-t border-gray-100 pt-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                        Offer a bundle discount
                    </label>

                    {enabled && (
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                            <span>
                                Give</span>
                            <input
                                type="number"
                                min={limits.minPercent}
                                max={limits.maxPercent}
                                step={1}
                                value={percent}
                                onChange={(e) => setPercent(e.target.value)}
                                aria-label="Discount percent"
                                className="w-20 rounded-lg border border-gray-300 px-2 py-1.5" />
                            <span>% off all items when a buyer reserves at least </span>
                            <select
                                value={minItems}
                                onChange={(e) => setMinItems(Number(e.target.value))}
                                aria-label="Minimun items"
                                className="rounded-lg border border-gray-300 px-2 py-1.5">
                                {Array.from(
                                    { length: limits.minItemsCeiling - limits.minItemsFloor + 1 },
                                    (_, i) => limits.minItemsFloor + i,).map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                            </select>
                            <span> of my listings.</span>
                        </div>)}

                    {enabled && !percentValid && (
                        <p className="text-xs text-rose-600">
                            Enter a whole number from {limits.minPercent} to {limits.maxPercent}.
                        </p>
                    )}

                    <div>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || (enabled && !percentValid)}
                            className="rounded-full bg-navy-700 text-white text-sm font-semibold px-5 py-2 hover:bg-navy-500 disabled:opacity-50">
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            )}

        </div>
    );

}