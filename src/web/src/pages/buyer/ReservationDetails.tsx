import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  IconChevronRight,
  IconMessageCircle,
  IconDownload,
  IconEye,
  IconCalendarClock,
  IconFlag,
} from "@tabler/icons-react";
import type { ReservationListResponse } from "../../types/Reservations";
import type { ListingDetail } from "../../types/listing";
import { cancelReservation, getReservations } from "../../services/reservationService";
import { listingsService } from "../../services/listingsService";

//type ReservationListItem = ReservationListResponse["items"][number];

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
    return hours+ " hrs " + pad(minutes) + " mins " + pad(seconds)+" sec";
  }
  return pad(minutes) + " mins "+ pad(seconds) + " sec";
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
  return "R " + amount.toLocaleString("en-ZA")};


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



export default function ReservationDetails()
{ return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">ReservationDetails</h1>
      <p className="text-sm text-gray-500 dark:text-white/50">Coming soon.</p>
    </div>
  )}

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
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-navy-700 last:border-b-0">
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
