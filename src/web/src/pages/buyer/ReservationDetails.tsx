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