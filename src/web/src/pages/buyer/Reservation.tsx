import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { useNavigate } from 'react-router'
import { getReservations, cancelReservation } from '../../services/reservationService'
import type { ReservationListItem, TimerStage } from '../../types/Reservations'
import { formatPrice } from '../../utils/formatters'
import { getApiUrl } from '../../config'
import { useToast } from '../../components/layout/useToast'
import {
  IconClock,
  IconPresentationAnalytics,
  IconClockHour12,
  IconReceipt2,
  IconFilter,
  IconChevronDown,
} from '@tabler/icons-react'
import { LoadingState } from '../../components/layout/Spinner'

type ItemStatus = 'Active' | 'Expired' | 'Cancelled' | 'Completed' | 'Reserved';
type FilterStatus = 'All' | ItemStatus;
type SortOption = 'Date added' | 'Price low' | 'Price high';

function StatusBadge({ status }: Readonly<{ status: string }>) {
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

type UrgencyLevel = 'normal' | 'expiring'

function getMsRemaining(expiresAt: string): number {
  return new Date(expiresAt).getTime() - Date.now()
}

function getUrgency(msRemaining: number): UrgencyLevel {
  return msRemaining <= 60 * 60 * 1000 ? 'expiring' : 'normal'
}

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'Expired'
  const totalSecs = Math.floor(msRemaining / 1000)
  const hours = Math.floor(totalSecs / 3600)
  const minutes = Math.floor((totalSecs % 3600) / 60)
  const seconds = totalSecs % 60

  const pad = (n: number) => n.toString().padStart(2, '0')
  if (hours > 0) {
    return `${hours} hrs ${pad(minutes)} mins ${pad(seconds)} sec`
  }

  return `${pad(minutes)} mins ${pad(seconds)} sec`
}

const baseBtn = 'inline-flex items-center justify-center gap-1 rounded-lg border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const stageMeta: Record<TimerStage, { label: string; className: string }> = {
  awaiting_seller: { label: 'Waiting on seller', className: 'bg-sky-100 text-sky-700' },
  awaiting_buyer: { label: 'Buyer turn', className: 'bg-sky-100 text-sky-700' },
  coordinating: { label: 'Coordination pickup', className: 'bg-emerald-100 text-emerald-700' },
  meetup_confirmed: { label: 'Meetup scheduled', className: 'bg-emerald-100 text-emerald-700' },
}

export function SummaryCard({ label, value, icon }: Readonly<{ label: string; value: string; icon: React.ReactNode }>) {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 py-3 px-4 flex items-center gap-3">
      <span className="text-navy-700">{icon}</span>
      <div>
        <p className="text-2xl font-extrabold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function StageTag({ stage }: Readonly<{ stage: TimerStage }>) {
  const meta = stageMeta[stage] ?? { label: stage, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.className}`}>
      {meta.label}
    </span>
  )
}

function CountdownBadge({ msRemaining, urgency }: Readonly<{ msRemaining: number; urgency: UrgencyLevel }>) {
  if (msRemaining <= 0) return null;
  const style = urgency === 'expiring' ? 'bg-rose-50 text-rose-600 border border-rose-200'
    : 'bg-sky-50 text-sky-700 border border-sky-200'
  return (
    <div className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg ${style}`}>
      <IconClock size={14} />
      {formatCountdown(msRemaining)}
    </div>
  )
}

function ReservationCard({
  reservation,
  onCancel,
}: Readonly<{
  reservation: ReservationListItem
  onCancel: (id: string) => void
}>) {
  const navigate = useNavigate()
  const [, forceTick] = useReducer((x: number) => x + 1, 0)
  useEffect(() => {
    const interval = setInterval(() => forceTick(), 1000)
    return () => clearInterval(interval)
  }, [])

  const msRemaining = getMsRemaining(reservation.expiresAt)
  const urgency = getUrgency(msRemaining)
  const isActive = reservation.reservationStatus === 'active'
  const apiOrigin = getApiUrl().split('/api')[0];

  const openReservation = () => navigate(`/buyer/reservations/${reservation.reservationId}`)
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <button
        type='button'
        onClick={openReservation}
        className='w-20 h-20 rounded-lg overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition-opacity border-0 p-0 bg-transparent'
      >
        <img
          src={reservation.listing.imagePath
            ? `${apiOrigin}${reservation.listing.imagePath}`
            : '/placeholder.png'}
          alt={reservation.listing.title}
        />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <button
            type='button'
            onClick={openReservation}
            className="min-w-0 cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-gray-800 truncate">
                {reservation.listing.title}
              </p>
              <StatusBadge status={reservation.reservationStatus} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Listed by <span className="font-semibold text-gray-500">
                {reservation.counterParty.name}
              </span>
            </p>
          </button>
          {isActive && msRemaining > 0 && reservation.timerStage !== 'meetup_confirmed' && (
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                Expires in
              </p>
              <div className="mt-1">
                <CountdownBadge msRemaining={msRemaining} urgency={urgency} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          {isActive && <StageTag stage={reservation.timerStage} />}
          <span className="text-sm font-bold text-gray-800">
            {formatPrice(reservation.listing.price)}
          </span>
        </div>

        {isActive && (
          <div className="flex flex-wrap gap-2 mt-3">

            <button
              type="button"
              className={`${baseBtn} bg-navy-800 border-navy-800 text-white hover:bg-navy-700 dark:hover:bg-navy-500`}
              onClick={() => navigate(`/buyer/reservations/${reservation.reservationId}`)}
            >
              View Reservation
            </button>
            <button
              type="button"
              className={`${baseBtn} relative border-gray-300 dark:border-navy-600 text-navy-900 dark:text-white hover:bg-gray-50 dark:hover:bg-navy-700`}
              onClick={() => navigate(`/buyer/messages/${reservation.reservationId}`, {
                state: {
                  counterparty: reservation.counterParty.name,
                  counterpartyInitials: reservation.counterParty.initials,
                },
              })}
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
              onClick={() => onCancel(reservation.reservationId)}
              disabled={reservation.timerStage === 'meetup_confirmed'}
              className="py-1.5 px-3 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Reservations() {
  const [reservations, setReservations] = useState<ReservationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()
  const [sortOption, setSortOption] = useState<SortOption>("Date added")
  const [sortOpen, setSortOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("All")

  useEffect(() => {
    getReservations({ role: 'buyer' }).then((result) => {
      if (result.success) {
        setReservations(result.data.items)
        showToast('success', 'Successfully fetched your reservations!!')
      } else {
        setError(result.error.message ?? 'Could not load your reservations.')
        showToast('error', 'Could not load your reservations!!')
      }
    }).finally(() => setLoading(false))
  }, [showToast])

  const handleCancel = async (reservationId: string) => {
    const previous = reservations
    setReservations((prev) => prev.map((r) => r.reservationId === reservationId ? { ...r, reservationStatus: 'cancelled' } : r))
    const result = await cancelReservation(reservationId)
    if (!result.success) {
      setReservations(previous)
      showToast('error', 'Failed to cancel reservation.');
    } else {
      showToast('success', 'Successfully cancelled the reservation!!');
    }
  }
  const filtered = useMemo(() => {
    if (statusFilter === "All") return reservations;
    return reservations.filter(
      (r) => r.reservationStatus.toLowerCase() === statusFilter.toLowerCase()
    );
  }, [reservations, statusFilter]);


  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sortOption === "Price low") {
      copy.sort((a, b) => a.listing.price - b.listing.price);
    } else if (sortOption === "Price high") {
      copy.sort((a, b) => b.listing.price - a.listing.price);
    } else {
      copy.sort(
        (a, b) =>
          new Date(b.createdAt ?? b.expiresAt).getTime() -
          new Date(a.createdAt ?? a.expiresAt).getTime()
      );
    }
    return copy;
  }, [filtered, sortOption]);

  const summary = useMemo(() => {
    const activeCount = reservations.filter((r) => r.reservationStatus === 'active').length
    const expiringCount = reservations.filter(
      (r) => r.reservationStatus === 'active' && getUrgency(getMsRemaining(r.expiresAt)) === 'expiring').length
    const totalValue = reservations.filter((r) => r.reservationStatus === 'active').reduce((sum, r) => sum + r.listing.price, 0)

    return { activeCount, expiringCount, totalValue }
  }, [reservations])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800">
            My Reservations
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:border-navy-700 transition-colors"
            >
              Sort by : {sortOption.toLowerCase()}
              <IconChevronDown size={12} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 z-20 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-2">
                {(["Date added", "Price low", "Price high"] as SortOption[]).map((opt) => (
                  <button
                    type='button'
                    key={opt}
                    onClick={() => {
                      setSortOption(opt);
                      setSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortOption === opt ? "text-navy-700 font-semibold" : "text-gray-600"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:border-navy-700 transition-colors"
            >
              <IconFilter size={12} />
              Filter
              <IconChevronDown size={12} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 z-20 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-2">
                {(["All", "Active", "Reserved", "Completed", "Expired", "Cancelled"] as FilterStatus[]).map((opt) => (
                  <button
                    type='button'
                    key={opt}
                    onClick={() => {
                      setStatusFilter(opt);
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${statusFilter === opt ? "text-navy-700 font-semibold" : "text-gray-600"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <SummaryCard
          label="Active reservations"
          value={String(summary.activeCount)}
          icon={<IconPresentationAnalytics size={20} />}
        />
        <SummaryCard
          label="Expiring soon"
          value={String(summary.expiringCount)}
          icon={<IconClockHour12 size={20} />}
        />
        <SummaryCard
          label="Total reserved value"
          value={formatPrice(summary.totalValue)}
          icon={<IconReceipt2 size={20} />}
        />
      </div>


      {loading && <LoadingState message="Fetching listings..." />}

      {!loading && error && (
        <div className="bg-white rounded-xl border border-rose-200 p-6 text-center">
          <p className="text-sm font-semibold text-rose-600">{error}</p>
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm font-semibold text-gray-700">No reservations found</p>
          <p className="text-xs text-gray-400 mt-1">
            {statusFilter !== "All"
              ? `There are no reservations with "${statusFilter}" status.`
              : "Reserve items from listings to see them here."}
          </p>
        </div>
      )}

      {sorted.map((reservation: ReservationListItem) => (
        <ReservationCard
          key={reservation.reservationId}
          reservation={reservation}
          onCancel={handleCancel}
        />
      ))}
    </div>
  )
}