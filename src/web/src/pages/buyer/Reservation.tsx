import { useCallback, useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { ReservationListResponse } from '../../types/Reservations'
import { cancelReservation, getReservations } from '../../services/reservationService'
import { imageUrl } from '../../services/listingsService'
import {
    IconPresentationAnalytics,
    IconClockHour12,
    IconReceipt2
} from '@tabler/icons-react'


type ReservationListItem = ReservationListResponse["items"][number];
const RESERVATIONS_KEY = ['reservations', 'buyer'] as const;

interface CountdownResult {
    label: string;
    isUrgent: boolean;
    isExpired: boolean;
}

const URGENT_THRESHOLD_MS = 15 * 60 * 1000;

function pad(value: number): string {
    return String(value).padStart(2, "0");
}

function formatRemaining(ms: number): string {
    if (ms <= 0) return "Expired";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours} hrs ${pad(minutes)} mins ${pad(seconds)} sec`;
    }
    return `${minutes} mins ${pad(seconds)} sec`;
}
function useNow(interval: number = 1000): number {
    const [now, setNow] = useState<number>(() => Date.now());

    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), interval);
        return () => window.clearInterval(id);
    }, [interval]);

    return now;
}
function useCountdown(expiresAt: string): CountdownResult {
    const now = useNow();

    const remainingMs = new Date(expiresAt).getTime() - now;
    const isExpired = remainingMs <= 0;

    return {
        label: formatRemaining(remainingMs),
        isUrgent: !isExpired && remainingMs <= URGENT_THRESHOLD_MS,
        isExpired,
    }
}

function formatCurrency(amount: number): string {
    return `R ${amount.toLocaleString("en-ZA")}`;
}

const EXPIRING_SOON_MS = 15 * 60 * 1000;

interface ReservationStatsProps {
    reservations: ReservationListItem[];
}

function ReservationStats({ reservations }: ReservationStatsProps) {
    const now = useNow();

    const active = reservations.filter((r) => r.reservationStatus === "active");

    const expiringSoonCount = active.filter((r) => {
        const remaining = new Date(r.expiresAt).getTime() - now;
        return remaining > 0 && remaining <= EXPIRING_SOON_MS;
    }).length;

    const totalReservedValue = active.reduce(
        (sum, r) => sum + (r.listing?.price ?? 0),
        0,
    );

    const stats = [
        {
            icon: <IconPresentationAnalytics size={20} />,
            label: "Active reservations",
            value: String(active.length),
        },
        {
            icon: <IconClockHour12 size={20} />,
            label: "Expiring soon",
            value: String(expiringSoonCount),
        },
        {
            icon: <IconReceipt2 size={20} />,
            label: "Total reserved value",
            value: String(totalReservedValue),
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {stats.map(({ icon, label, value }) => (
                <div
                    key={label}
                    className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3"
                >
                    <span className="text-navy-700 dark:text-white">
                        {icon}
                    </span>
                    <div>
                        <p className="text-2xl font-bold text-navy-700 dark:text-white">
                            {value}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 dark:text-navy-100">
                            {label}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

//hardcoded seller details and Ima waiting for the endpoint to be ready
const SELLER_NAME = "Tafadzwa Musiiwa";
const SELLER_DEGREE = "Computer Science";

const baseBtn = "inline-flex items-center justify-center gap-1 rounded-lg border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

interface ReservationCardProps {
    reservation: ReservationListItem;
    onCompletePayment: (reservation: ReservationListItem) => void;
    onMessageSeller: (reservation: ReservationListItem) => void;
    onCancel: (reservation: ReservationListItem) => void;
    onView: (reservation: ReservationListItem) => void;
    isCancelling: boolean;
}

function ReservationCard({
    reservation,
    onCompletePayment,
    onMessageSeller,
    onCancel,
    onView,
    isCancelling,
}: ReservationCardProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const { label, isUrgent, isExpired } = useCountdown(reservation.expiresAt);
    const isCancelled = reservation.reservationStatus === "cancelled";
    const sellerInitials = SELLER_NAME
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    const showFallbackImage = imageFailed || !reservation.listing?.imagePath;

    const countdownClasses = isCancelled || isExpired
        ? "bg-gray-100 text-gray-500 dark:bg-navy-700 dark:text-navy-100"
        : isUrgent
            ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
            : "bg-blue-100 text-navy-800 dark:bg-blue-900/40 dark:text-blue-200";

    const statusBadge = isCancelled
        ? { className: "bg-gray-100 text-gray-500 dark:bg-navy-700 dark:text-navy-100", text: "Cancelled" }
        : isUrgent || isExpired
            ? { className: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300", text: "Expiring soon" }
            : { className: "bg-blue-100 text-navy-800 dark:bg-blue-900/40 dark:text-blue-200", text: reservation.reservationStatus };

    return (
        <article
            className={`grid grid-cols-[720px_1fr] sm:grid-cols-[96px_1fr_auto] gap-4 sm:gap-5 items-start rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-4 sm:p-5 transition-opacity ${isCancelled ? "opacity-55" : ""}`}
        >
            <div className="w-[72px] h-[72px] sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-navy-700 flex items-center justify-center shrink-0">
                {showFallbackImage ? (
                    <span className="text-[11px] text-gray-400 dark:text-navy-100 text-center px-1.5 leading-tight">
                        {reservation.listing?.title ?? "Listing"}
                    </span>
                ) : (
                    <img
                        src={imageUrl(reservation.listing!.imagePath)}
                        alt={reservation.listing?.title ?? "Listing image"}
                        className="w-full h-full object-cover"
                        onError={() => setImageFailed(true)}
                    />
                )}
            </div>

            <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white mb-1.5">
                    {reservation.listing?.title ?? "Untitled listing"}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mb-2.5 text-sm text-gray-500 dark:text-navy-100">
                    <span className="text-gray-400 dark:text-navy-300">Listed by</span>
                    <span className="w-6 h-6 rounded-full bg-navy-800 dark:bg-navy-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {sellerInitials}
                    </span>
                    <span className="font-semibold text-gray-700 dark:text-white">
                        {SELLER_NAME} · {SELLER_DEGREE}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge.className}`} >
                        {statusBadge.text}
                    </span>
                    <span className="text-lg font-extrabold text-navy-900 dark:text-white">
                        {formatCurrency(reservation.listing?.price ?? 0)}
                    </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    <button
                        type="button"
                        className={`${baseBtn} bg-navy-800 border-navy-800 text-white hover:bg-navy-700 dark:hover:bg-navy-500`}
                        onClick={() => onCompletePayment(reservation)}
                        disabled={isCancelled || isExpired}
                    >
                        Complete payment
                    </button>
                    <button
                        type="button"
                        className={`${baseBtn} bg-navy-800 border-navy-800 text-white hover:bg-navy-700 dark:hover:bg-navy-500`}
                        onClick={() => onView(reservation)}
                    > View Reservation</button>
                    <button
                        type="button"
                        className={`${baseBtn} relative border-gray-300 dark:border-navy-600 text-navy-900 dark:text-white hover:bg-gray-50 dark:hover:bg-navy-700`}
                        onClick={() => onMessageSeller(reservation)}
                    >
                        Message seller
                        {reservation.unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                                {reservation.unreadCount}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        className={`${baseBtn} border-gray-300 dark:border-navy-600 text-navy-900 dark:text-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20`}
                        onClick={() => onCancel(reservation)}
                        disabled={isCancelled || isCancelling}
                    >
                        {isCancelling ? "Cancelling…" : "Cancel"}
                    </button>


                </div>
            </div>

            <div className="col-span-2 sm:col-span-1 flex sm:flex-col items-center sm:items-end gap-2.5 sm:gap-2 sm:min-w-[150px] sm:text-right">
                <p className="text-sm text-gray-500 dark:text-navy-100 m-0">
                    {isCancelled ? "Cancelled" : isExpired ? "Reservation" : "Expires in"}
                </p>
                <span className={`inline-block rounded-lg px-3.5 py-2 text-sm font-bold whitespace-nowrap ${countdownClasses}`}>
                    {isCancelled ? "-" : label}
                </span>
            </div>
        </article>
    )
}

function ReservationEmptyState() {
    return (
        <div className="rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 px-6 py-12 text-center">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-1.5">
                No reservations yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-navy-100">
                All your reserved Items will show up here.
            </p>
        </div>
    )
}

function ReservationSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            <div className="h-[138px] rounded-xl bg-gray-100 dark:bg-navy-800" />
            <div className="h-[138px] rounded-xl bg-gray-100 dark:bg-navy-800" />
        </div>
    )
}

interface ReservationErrorStateProps {
    message: string;
    onRetry: () => void;
}

function ReservationErrorState({ message, onRetry }: ReservationErrorStateProps) {
    return (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-6 py-10 text-center">
            <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-1.5">
                Your reservations could not load.
            </h3>
            <p className="text-sm text-red-600/80 dark:text-red-300/70 mb-4">{message}</p>
            <button
                type="button"
                onClick={onRetry}
                className="rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-800 px-4 py-2 text-sm font-semibold text-navy-900 dark:text-white hover:bg-navy-700"
            > Try again
            </button>
        </div>
    )
}

interface ReservationListProps {
    reservations: ReservationListItem[];
    isLoading: boolean;
    cancellingId: string | null;
    onCompletePayment: (reservation: ReservationListItem) => void;
    onMessageSeller: (reserevation: ReservationListItem) => void;
    onCancel: (reservation: ReservationListItem) => void;
    onView: (reservation: ReservationListItem) => void;
}

function ReservationList({
    reservations,
    isLoading,
    cancellingId,
    onCompletePayment,
    onMessageSeller,
    onCancel,
    onView,
}: ReservationListProps) {
    if (isLoading) {
        return <ReservationSkeleton />;
    }

    if (reservations.length === 0) {
        return <ReservationEmptyState />
    }

    return (
        <div className="flex flex-col gap-4">
            {reservations.map((reservation) => (
                <ReservationCard
                    key={reservation.reservationId}
                    reservation={reservation}
                    onCompletePayment={onCompletePayment}
                    onMessageSeller={onMessageSeller}
                    onCancel={onCancel}
                    onView={onView}
                    isCancelling={cancellingId === reservation.reservationId}
                />
            ))}
        </div>
    )
}
function useReservations() {
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: RESERVATIONS_KEY,
        queryFn: async () => {
            const result = await getReservations({ role: "buyer" });
            if (!result.success) {
                throw new Error(result.error.message ?? "Something went wrong, please try again later.");
            }
            return result.data.items;
        },
    });

    const cancelMutation = useMutation({
        mutationFn: (reservationId: string) => cancelReservation(reservationId),
        onSuccess: (result, reservationId) => {
            if (!result.success) return;
            queryClient.setQueryData<ReservationListItem[]>(RESERVATIONS_KEY, (prev) =>
                prev?.map((item) =>
                    item.reservationId === reservationId
                        ? { ...item, reservationStatus: result.data.reservationStatus }
                        : item
                )
            );
        },
    });

    return {
        reservations: data ?? [],
        isLoading,
        error: error instanceof Error ? error.message : null,
        reload: refetch,
        cancel: cancelMutation.mutateAsync,
        cancellingId: cancelMutation.isPending ? (cancelMutation.variables ?? null) : null,
    };
}
export default function MyReservationsPage() {
    const navigate = useNavigate();




    const {
        reservations,
        isLoading,
        error,
        reload,
        cancel,
        cancellingId,
    } = useReservations();
    const handleCompletePayment = useCallback(
        (reservation: ReservationListItem) => {
            navigate(`/checkout/${reservation.reservationId}`);
        },
        [navigate],
    );
    const handleView = useCallback(
        (reservation: ReservationListItem) => {
            navigate(`/buyer/reservations/${reservation.reservationId}`)
        },
        [navigate],
    )

    const handleMessageSeller = useCallback(
        (reservation: ReservationListItem) => {
            navigate(`/messages/${reservation.reservationId}`);
        },
        [navigate],
    )

    const handleCancel = useCallback(
        (reservation: ReservationListItem) => {
            cancel(reservation.reservationId);
        },
        [cancel],
    );

    return (
        <div className="px-4 sm:px-8 py-6 sm:py-7 pb-12">
            <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white">
                My Reservations
            </h1>
            <p className="text-sm text-gray-400 mt-1">
                Manage all your reservations in one place.
            </p>
            {error ? (
                <ReservationErrorState message={error} onRetry={reload} />
            ) : (
                <>
                    <ReservationStats reservations={reservations} />
                    <ReservationList
                        reservations={reservations}
                        isLoading={isLoading}
                        cancellingId={cancellingId}
                        onCompletePayment={handleCompletePayment}
                        onMessageSeller={handleMessageSeller}
                        onCancel={handleCancel}
                        onView={handleView}
                    />
                </>
            )}
        </div>
    );

}