import { useNavigate, useLocation } from "react-router";
import { formatPrice } from "../../utils/formatters";
import type {
    SmartBudgetResponse,
    SmartBudgetReservationGroup,
    SmartBudgetNotReservedItem,
    TimerStage
} from "../../types/Reservations"
import {
    IconWallet,
    IconCircleCheck,
    IconCircleX,
    IconMessageCircle,
    IconArrowLeft,
    IconTag,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { connectionManager } from "../../services/realtime/connectionManager";

interface SmartBudgetResultLocationState {
    result: SmartBudgetResponse;
    sellerNamesById?: Record<string, string>;
}

function notReservedReasonLabel(reason: SmartBudgetNotReservedItem["reason"]): string {
    return reason === "over_budget"
        ? "Didn't fit your budget"
        : "Reserved by someone else";
}

function SellerAvatar({ initials }: Readonly<{ initials: string }>) {
    return (
        <div className="w-8 h-8 rounded-full bg-navy-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {initials}
        </div>
    );
}

function ReservedGroupCard({
    group,
    sellerName,
    status, stage,
}: Readonly<{ group: SmartBudgetReservationGroup; sellerName?: string, status: string; stage: TimerStage }>) {
    const navigate = useNavigate();
    const s = status.toLowerCase();
    const isAwaitingSeller = s === "active" && stage === "awaiting_seller";
    const isDeclined = s === "cancelled";
    const isExpired = s === "expired";
    const chatOpen = s === "active" && stage !== "awaiting_seller";
    const line = stageLine(status, stage);


    return (

        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2">
                    <SellerAvatar initials={group.sellerInitials} />
                    <span className="text-sm font-semibold text-gray-800">
                        {sellerName ?? "Seller"}
                    </span>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {group.items.map((item) => (
                    <div key={item.listingId} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-gray-600 truncate pr-2">{item.title}</span>
                        <span className="font-semibold text-gray-800 shrink-0">
                            {formatPrice(item.price)}
                        </span>
                    </div>
                ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-sm space-y-1.5">
                {group.discountPercent != null && group.discount > 0 ? (
                    <>
                        <div className="flex items-center justify-between text-gray-500">
                            <span>Subtotal</span>
                            <span>{formatPrice(group.subTotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-600 font-semibold">
                            <span className="inline-flex items-center gap-1">
                                <IconTag size={13} />
                                Bundle discount ({group.discountPercent}% off)
                            </span>
                            <span>−{formatPrice(group.discount)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                            <span className="text-gray-500">Total</span>
                            <span className="font-bold text-gray-800">{formatPrice(group.total)}</span>
                        </div>
                    </>) : (
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-bold text-gray-800">{formatPrice(group.subTotal)}</span>
                    </div>
                )}

            </div>

            <div className="mt-3 rounded-lg px-3 py-2 bg-navy-50">
                <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${line.cls}`}>
                        {line.icon}
                        {line.text}
                    </div>
                    {!isDeclined && !isExpired && (
                        <button
                            type="button"
                            disabled={!chatOpen}
                            onClick={() => chatOpen && navigate(`/buyer/messages/${group.reservationId}`)}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-navy-800 text-white hover:bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

                        >
                            <IconMessageCircle size={14} />
                            Chat
                        </button>
                    )}
                </div>
                {isAwaitingSeller && (
                    <p className="text-[11px] text-navy-600/70 mt-1">
                        You'll be able to message the seller once they accept this reservation.
                    </p>
                )}
            </div>
        </div>
    );
}

function NotReservedRow({ item }: Readonly<{ item: SmartBudgetNotReservedItem }>) {
    return (
        <div className="flex items-center justify-between py-2.5 text-sm border-t border-gray-100 first:border-t-0">
            <div className="flex items-center gap-2 min-w-0">
                <IconCircleX size={16} className="text-error-600 shrink-0" />
                <span className="text-gray-600 truncate">{item.title}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-400">{notReservedReasonLabel(item.reason)}</span>
                <span className="font-semibold text-sm text-gray-500">{formatPrice(item.price)}</span>
            </div>
        </div>
    );
}
function stageLine(status: string, stage: TimerStage) {
    const s = status.toLowerCase();
    if (s === "cancelled") return { icon: <IconCircleX size={14} />, text: "Seller declined this reservation", cls: "text-rose-600" };
    if (s === "expired") return { icon: <IconCircleX size={14} />, text: "Reservation expired", cls: "text-gray-500" };
    if (stage === "awaiting_seller") return { icon: <IconCircleX size={14} />, text: "Waiting for seller to accept or reject", cls: "text-navy-700" };
    return { icon: <IconCircleCheck size={14} />, text: "Seller accepted — you can chat now", cls: "text-emerald-600" }
}
export default function SmartBudgetResult() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as SmartBudgetResultLocationState | null;
    const result = state?.result;
    const sellerNamesById = state?.sellerNamesById ?? {};
    const reservations = result?.reservations ?? [];

    const [statusMap, setStatusMap] = useState<Record<string, { status: string, stage: TimerStage }>>(
        () => Object.fromEntries(
            reservations.map((g) => [g.reservationId, { status: "active", stage: "awaiting_seller" as TimerStage }])
        )
    );

    useEffect(() => {
        const off = connectionManager.onReservationUpdated((r) => {
            setStatusMap((prev) =>
                prev[r.reservationId] ? { ...prev, [r.reservationId]: { status: r.reservationStatus, stage: r.timerStage } } : prev);

        });
        return off;
    }, []);
    if (!result) {
        return (
            <div className="flex flex-col gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-sm font-semibold text-gray-700">
                        No reservation result to show
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Start a smart budget reservation from your wishlist.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/buyer/wishlist")}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-navy-800 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-700 transition-colors"
                    >
                        <IconArrowLeft size={16} />
                        Back to wishlist
                    </button>
                </div>
            </div>
        );
    }

    const { totalSpent, notReserved } = result;
    const reservedItemCount = reservations.reduce((sum, g) => sum + g.items.length, 0);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800">
                    Your reservation summary
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    {reservations.length} {reservations.length === 1 ? "seller" : "sellers"},{" "}
                    {reservedItemCount} {reservedItemCount === 1 ? "item" : "items"} reserved
                    {notReserved.length > 0 &&
                        ` · ${notReserved.length} ${notReserved.length === 1 ? "item" : "items"} not reserved`}
                </p>
            </div>

            <div className="flex gap-4">
                <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
                        <IconWallet size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Total spent</p>
                        <p className="text-lg font-bold text-gray-800">{formatPrice(totalSpent)}</p>
                    </div>
                </div>
                <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
                        <IconCircleCheck size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Reservations created</p>
                        <p className="text-lg font-bold text-gray-800">{reservations.length}</p>
                    </div>
                </div>
            </div>

            {reservations.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-gray-700 mb-3">Reserved, by seller</h2>
                    <div className="flex flex-col gap-3">
                        {reservations.map((group) => {
                            const st = statusMap[group.reservationId] ?? { status: "active", stage: "awaiting_seller" as TimerStage };
                            return (
                                <ReservedGroupCard
                                    key={group.reservationId}
                                    group={group}
                                    sellerName={sellerNamesById[group.sellerId]}
                                    status={st.status}
                                    stage={st.stage}
                                />
                            );

                        })}
                    </div>
                </div>
            )}

            {notReserved.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h2 className="text-sm font-bold text-gray-700 mb-0.5">Not reserved</h2>
                    <p className="text-xs text-gray-400 mb-1">These stay in your wishlist.</p>
                    <div>
                        {notReserved.map((item) => (
                            <NotReservedRow key={item.listingId} item={item} />
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => navigate("/buyer/wishlist")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-navy-800 text-white px-5 py-2.5 text-sm font-semibold hover:bg-navy-700 transition-colors"
                >
                    <IconArrowLeft size={16} />
                    Back to wishlist
                </button>
            </div>
        </div>
    );
}