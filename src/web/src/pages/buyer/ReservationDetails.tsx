import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { useToast } from "../../components/layout/useToast";
import {
  IconChevronRight,
  IconMessageCircle,
  IconDownload,
  IconEye,
  IconCalendarClock,
  IconFlag,
} from "@tabler/icons-react";
import type { Reservation } from "../../types/Reservations";
import type { ListingDetail } from "../../types/listing";
import { cancelReservation, getReservationById } from "../../services/reservationService";
import { listingsService } from "../../services/listingsService";
import { useQuery } from "@tanstack/react-query";

//type ReservationListItem = ReservationListResponse["items"][number];

interface CountdownResult {
  label: string;
  isUrgent: boolean;
  isExpired: boolean;
}
type ItemStatus = 'Active' | 'Expired' | 'Cancelled' | 'Completed' | 'Reserved';
function StatusBadge({ status }: { status: string }) {
  if (!status) return null;
  const normalizedStatus = (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()) as ItemStatus;

  const config: Record<ItemStatus, { bg: string; text: string; dot: string; label: string }> = {
    Active: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
    Completed: { bg: 'bg-blue-50', text: 'text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Completed' },
    Expired: { bg: 'bg-gray-50', text: 'text-gray-700 border-gray-200', dot: 'bg-gray-500', label: 'Expired' },
    Cancelled: { bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Cancelled' },
    Reserved: { bg: 'bg-amber-50', text: 'text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Reserved' },
  };
  const currentConfig = config[normalizedStatus] || config['Expired'];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${currentConfig.bg} ${currentConfig.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${currentConfig.dot} ${normalizedStatus === 'Active' ? 'animate-pulse' : ''}`} />
      {currentConfig.label}
    </span>
  );
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
    return hours + " hrs " + pad(minutes) + " mins " + pad(seconds) + " sec";
  }
  return pad(minutes) + " mins " + pad(seconds) + " sec";
}

function useCountdown(expiresAt: string): CountdownResult {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const remainingMs = new Date(expiresAt).getTime() - now;
  const isExpired = remainingMs <= 0;

  return {
    label: formatRemaining(remainingMs),
    isUrgent: !isExpired && remainingMs <= URGENT_THRESHOLD_MS,
    isExpired,
  };
}

function formatCurrency(amount: number): string {
  return "R " + amount.toLocaleString("en-ZA");

}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}


function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 overflow-hidden">
      <h2 className="px-6 py-4 text-base font-bold text-navy-900 dark:text-white border-b border-gray-200 dark:border-navy-700">
        {title}
      </h2>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-400 dark:border-navy-700 last:border-b-0">
      <span className="text-sm text-gray-500 dark:text-navy-100">{label}</span>
      <span className="text-sm font-semibold text-navy-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}
function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "danger" | "default";
}) {
  const variantClasses =
    variant === "primary"
      ? "bg-navy-800 border-navy-800 text-white hover:bg-navy-700 dark:hover:bg-navy-500"
      : variant === "danger"
        ? "border-gray-300 dark:border-navy-600 text-red-600 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20"
        : "border-gray-300 dark:border-navy-600 text-navy-900 dark:text-white hover:bg-gray-50 dark:hover:bg-navy-700";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses}`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function ReservationDetails() {

  const { showToast} = useToast();
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const isSeller = window.location.pathname.startsWith('/seller');

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [listingDetail, setListingDetail] = useState<ListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const { data: meetup} = useQuery({
    queryKey: ['meetup', reservationId],
    queryFn: () => listingsService.getMeetupStatus(reservationId!),
    enabled: !!reservationId,
  });
  const loadReservation = useCallback(async () => {
    if (!reservationId) {
      setError("No reservation ID provided");
      setIsLoading(false);
      return;
    }

    setError(null);


    //I should change once the endpoint to get each reservation by id is available 
    const result = await getReservationById(reservationId);

    if (!result.success) {
      setError(result.error.message ?? "Something went wrong. Please try again.");
      setIsLoading(false);
      return;
    }

    setReservation(result.data);

    try {
      const detail = await listingsService.getById(result.data.listingId);
      setListingDetail(detail);
    } catch {
      //nothing
    }


    setIsLoading(false);
  }, [reservationId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await Promise.resolve();
      if (cancelled) return;
      await loadReservation();
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [loadReservation]);

  const { label: countdownLabel, isUrgent, isExpired } = useCountdown(
    reservation?.expiresAt ?? new Date().toISOString(),
  );
  const handleMessageCounterparty = () => {
    if (!reservation) return;
    navigate(`/${isSeller ? 'seller' : 'buyer'}/messages/${reservation.reservationId}`, {
      state: {
        counterpartyName: reservation.counterParty?.name,
        counterpartyInitials: reservation.counterParty?.initials,
      },
    });
  };

  const handleCompletePayment = () => {
    if (!reservation) return;
    navigate('/payment/meetup', {
      state: {
        reservationId: reservation.reservationId,
        role: isSeller ? 'seller' : 'buyer',
        counterPartyName: otherPartyName,
        counterpartyInitials: otherPartyInitials,
        listingTitle: listingDetail?.title,
        listingPrice: listingDetail?.price,
      }
    })
  };

  const handleViewListing = () => {
    if (reservation) navigate(`/buyer/listings/${reservation.listingId}`);
  };


  const handleCancel = async () => {
    if (!reservation) return;
    setIsCancelling(true);
    const result = await cancelReservation(reservation.reservationId);
    if (result.success) {
      setReservation((prev) =>
        prev ? { ...prev, reservationStatus: result.data.reservationStatus } : prev,
      );
      showToast('success', isSeller ? 'Reservation cancelled' : 'Reservation cancelled successfully.');
      
    } else {
      showToast (
        'error',
        result.error.code === 'release_too_early'
        ? 'You can only cancel after 12 hours of buyer silence.'
        : result.error.message ?? 'Failed to cancel reservation.'
      );
    }
    setIsCancelling(false);
  };

  const handleViewMeetupDetails = () => {
     if (!reservation) return;
     navigate('/payment/meetup', {
      state: {
        reservationId: reservation.reservationId,
        role: isSeller ? 'seller' : 'buyer',
        counterpartyName: otherPartyName,
        listingTitle: listingDetail?.title,
        listingPrice: listingDetail?.price,
      },
     });
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-7 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-xl bg-gray-100 dark:bg-navy-800 animate-pulse" />
          <div className="h-72 rounded-xl bg-gray-100 dark:bg-navy-800 animate-pulse" />
        </div>
      </div>
    );
  }


  if (error || !reservation) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-7 pb-12">
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-6 py-10 text-center">
          <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-1.5">
            Couldn't load this reservation
          </h3>
          <p className="text-sm text-red-600/80 dark:text-red-300/70 mb-4">
            {error ?? "Something went wrong. Please try again."}
          </p>
          <button
            type="button"
            onClick={loadReservation}
            className="rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-800 px-4 py-2 text-sm font-semibold text-navy-900 dark:text-white hover:bg-gray-50 dark:hover:bg-navy-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
  const isCancelled = reservation.reservationStatus === "cancelled";
  const isCoordinating = reservation.timerStage === "coordinating";
  const isMeetupConfirmed = reservation.timerStage === "meetup_confirmed";
  const expiresDate = new Date(reservation.expiresAt);
  const createdDate = new Date(reservation.createdAt);

  const countdownClasses = isCancelled || isExpired
    ? "bg-gray-100 text-gray-500 dark:bg-navy-700 dark:text-navy-100"
    : isUrgent
      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
      : "bg-blue-100 text-navy-800 dark:bg-blue-900/40 dark:text-blue-200";

  /*const statusBadge = isCancelled
    ? { className: "bg-gray-100 text-gray-500 dark:bg-navy-700 dark:text-navy-100", text: "Cancelled" }
    : isUrgent || isExpired
      ? { className: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300", text: "Expiring soon" }
      : { className: "bg-blue-100 text-navy-800 dark:bg-blue-900/40 dark:text-blue-200", text: "Reserved" };*/



  const messageLabel = isSeller ? "Message Buyer" : "Message Seller";
  const cancelLabel = isCancelling ? "Cancelling..." : isSeller ? (reservation.timerStage === "awaiting_seller" ? "Reject" : "Cancel Reservation") : "Cancel";
  const canCancel = !isCancelled && !isCancelling && (isSeller || !isCoordinating);

  const otherPartyLabel = isSeller ? "Buyer" : "Seller";
  const otherPartyName = reservation.counterParty?.name ?? otherPartyLabel;
  const otherPartyInitials = reservation.counterParty?.initials ?? otherPartyLabel[0];


  return (
    <div className="px-4 sm:px-8 py-6 sm:py-7 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <nav className="flex items-center gap-1.5 text-sm">
          <Link to={isSeller ? "/seller/reservations" : "/buyer/reservations"}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            My Reservations
          </Link>
          <IconChevronRight size={16} className="text-gray-400" />
          <span className="font-semibold text-navy-900-dark:text-white">
            {listingDetail?.title}
          </span>
        </nav>

        {!isCancelled && !isMeetupConfirmed && (

          <div className="text-right">
            <p
              className="test-sm text-gray-500 dark:text-navy-100 mb-1.5">
              Expires in
            </p>
            <span className={`inline-block rounded-lg px-4 py-2 text-sm font-bold whitespace-nowrap  ${countdownClasses}`}>
              {countdownLabel}
            </span>
          </div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <SectionCard title="Item">
            <div className="flex gap-4 mb-5">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-navy-700 flex items-center justify-center shrink-0">
                {listingDetail?.images?.[0]?.url || listingDetail?.images?.[0]?.url ? (
                  <img
                    src={listingDetail?.images?.[0]?.url ?? listingDetail?.images?.[0]?.url}
                    alt={listingDetail?.title ?? "Listing image"}
                    className="w-full h-full object-cover"
                  />) : (
                  <span className="text-[11px] text-gray-400 dark:text-navy-100 text-center px-1.5">
                    {listingDetail?.title ?? "Listing"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-1">
                  {listingDetail?.title ?? "Untitled listing"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-navy-100">
                  Condition: {listingDetail?.condition ?? "Good"}
                </p>
                <p className="text-sm text-gray-500 dark:text-navy-100">
                  Category: {listingDetail?.category ?? "Textbooks"}
                </p>

              </div>
            </div>

            <InfoRow
              label="Item price"
              value={
                <span className="text-lg font-extrabold">
                  {formatCurrency(listingDetail?.price ?? 0)}
                </span>
              }
            />
            <InfoRow
              label="Status"
              value={
                <span className={"inline-block rounded-full px-2.5 py-1 text-xs font-semibold "}>
                  <StatusBadge status={reservation.reservationStatus} />
                </span>
              } />
          </SectionCard>

          <SectionCard title="Actions">
            <div className="flex flex-col gap-3">
              <ActionButton
                icon={<IconMessageCircle size={16} />}
                label={messageLabel}
                onClick={handleMessageCounterparty}
                variant="primary" />
              
              {!isSeller &&(
              <ActionButton
                icon={<IconDownload size={16} />}
                label="Complete Payment"
                onClick={handleCompletePayment}
                disabled={isSeller || isCancelled || isExpired || !meetup?.buyerCheckedIn} />
              )}

              <ActionButton
                icon={<IconEye size={16} />}
                label="View Listing"
                onClick={handleViewListing}
              />
              <ActionButton
                icon={<IconCalendarClock size={16} />}
                label="View Meetup Details"
                onClick={handleViewMeetupDetails}
                disabled={isCancelled || isExpired}
              />
              <ActionButton
                icon={<IconFlag size={16} />}
                label={cancelLabel}
                onClick={handleCancel}
                disabled={!canCancel}
                variant="danger"
              />
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard title={otherPartyLabel}>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-11 h-11 rounded-full bg-navy-800 dark:bg-navy-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {otherPartyInitials}
              </span>
              <div>
                <p className="text-base font-bold text-navy-900 dark:text-white">
                  {otherPartyName}
                </p>
                <p className="text-sm text-gray-500 dark:text-navy-100">

                  {!isSeller && listingDetail?.seller?.university
                    ? `${listingDetail.seller.university} student`
                    : "Student"}
                </p>
              </div></div>
            <InfoRow label={`${otherPartyLabel} rating`} value="-" />
            {!isSeller &&(
            <InfoRow label="Total Sales" value={listingDetail?.seller?.activeListingCount} />
            )}
          </SectionCard>
          <SectionCard title="Reservation Info">
            <InfoRow label="Reservation ID" value={"#" + reservation.reservationId} />
            <InfoRow label="Date Reserved" value={formatDate(createdDate.toISOString())} />
            <InfoRow label="Expiry Date" value={formatDate(expiresDate.toISOString())} />
            <InfoRow label="Expiry Time" value={formatTime(expiresDate.toISOString())} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}