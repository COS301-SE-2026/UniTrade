import React, { useEffect, useMemo, useState } from 'react'
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
  IconUpload,
  IconX,
  IconFlag,
} from '@tabler/icons-react'
import { LoadingState } from '../../components/layout/Spinner'
import { useSearchQuery } from '../../hooks/useSearchQuery'
import { fileDispute } from '../../services/adminService'

type ItemStatus = 'Active' | 'Expired' | 'Cancelled' | 'Completed' | 'Reserved';
type FilterStatus = 'All' | ItemStatus;
type SortOption = 'Date added' | 'Price low' | 'Price high';

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

export function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
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

function StageTag({ stage }: { stage: TimerStage }) {
  const meta = stageMeta[stage] ?? { label: stage, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.className}`}>
      {meta.label}
    </span>
  )
}

function CountdownBadge({ msRemaining, urgency }: { msRemaining: number; urgency: UrgencyLevel }) {
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

function ReportQualityModal({ isOpen, onClose, reservationId }: { isOpen: boolean; onClose: () => void; reservationId: string }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sellerRefusedPhotos, setSellerRefusedPhotos] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const apiBase = getApiUrl();
  const { showToast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch(`${apiBase}/images/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');


      }
      const data = await res.json();
      const url = `${apiBase}${data.url.replace(/^\/api/,'')}`;//if this breaks in prod.. its because of the strip, just add a check later @Sabira
      setPhotos((prev) => [...prev, url]);
      showToast('success', 'Image Uploaded');

    }
    catch (err) {
      const message = err instanceof Error ? err.message: String(err);
      showToast('error', message || 'Failed to uploaded image');
    }
    finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (url: string) => {
    setPhotos((prev) => prev.filter((p) => p !== url));
  };

  const handleSubmit = async () => {
    if (photos.length === 0 && !sellerRefusedPhotos) {
      showToast('info', 'Please upload photos or mark that the seller refused.');
      return;
    }

    setSubmitting(true);

    try {
      await fileDispute({
        type: 'listing_quality',
        reservationId,
        sellerRefusedPhotos,
        photos,
        description: description || undefined,
      });
      showToast('success', 'Listing quality report submitted.');
      onClose();

      setPhotos([]);
      setDescription('');
      setSellerRefusedPhotos(false);
    }
    catch (err) {
      const message = err instanceof Error? err.message :String(err);
      showToast('error', message || 'Failed to submit report.')
    }
    finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-lg p-6 relative shadow-xl border border-gray-200 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type='button'
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
        >
          <IconX size={20} />
        </button>

        <h2 className="text-2xl font-bold text-navy-700 dark:text-white text-center mb-6">
          Report Listing Quality
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-navy-700 dark:text-white mb-2">
              Images <span className="text-gray-400 font-normal">(Drag & Drop or Upload)</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {
                photos.map((url, i) => (
                  <div key={i} className='relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50'>
                    <img src={url} alt={`Upload ${i + 1}`} className='w-full h-full object-cover' />
                    <button type='button'
                      onClick={() => handleRemovePhoto(url)}
                      className='absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70'
                    ><IconX size={14} />
                    </button>
                  </div>
                ))
              }
              {photos.length < 5 && (
                <label className='w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-navy-700 transition-colors'>
                  {uploading ? (
                    <div className='w-6 h-6 border-2 border-navy-700 border-t-transparent rounded-full animate-spin' />

                  ) : (
                    <>
                      <IconUpload size={22} className='text-gray-400' />
                      <span className='text-[10px] text-gray-400 mt-1'>Upload</span>
                    </>
                  )}
                  <input
                    type='file'
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className='hidden'
                  />
                </label>
              )}
            </div>

          </div>


          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="refuse-photos"
              checked={sellerRefusedPhotos}
              onChange={(e) => setSellerRefusedPhotos(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-navy-700 focus:ring-navy-700 cursor-pointer"
            />
            <label htmlFor="refuse-photos" className="text-xs font-medium text-navy-700 dark:text-white cursor-pointer select-none">
              Did the seller refuse to provide more photos?
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-700 dark:text-white mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the quality issue..."
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 p-3 text-sm bg-transparent text-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-700 resize-none"
            />
          </div>

          <button
            type="button"
            className="w-full bg-navy-700 hover:bg-navy-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-md"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReservationCard({
  reservation,
  onCancel,
}: {
  reservation: ReservationListItem
  onCancel: (id: string) => void
}) {
  const navigate = useNavigate()
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [, forceTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const msRemaining = getMsRemaining(reservation.expiresAt)
  const urgency = getUrgency(msRemaining)
  const isActive = reservation.reservationStatus === 'active'
  const apiOrigin = getApiUrl().split('/api')[0]

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
        <img
          src={reservation.listing.imagePath
            ? `${apiOrigin}${reservation.listing.imagePath}`
            : '/placeholder.png'}
          alt={reservation.listing.title}
          onClick={() => navigate(`/buyer/reservations/${reservation.reservationId}`)}
          className="w-20 h-20 rounded-lg object-cover flex shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div
              onClick={() => navigate(`/buyer/reservations/${reservation.reservationId}`)}
              className="min-w-0 cursor-pointer group"
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
            </div>
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
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
              <div className="flex flex-wrap gap-2">
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
                  disabled={reservation.timerStage == 'meetup_confirmed'}
                  className="py-1.5 px-3 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors ml-auto"
              >
                <IconFlag size={13} /> Report listing quality
              </button>
            </div>
          )}
        </div>
      </div>

      <ReportQualityModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} reservationId={reservation.reservationId} />
    </>
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
  const searchQuery = useSearchQuery()

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
    let result = statusFilter === 'All'
      ? reservations
      : reservations.filter((r) => r.reservationStatus.toLowerCase() === statusFilter.toLowerCase())

    if (searchQuery) {
      result = result.filter(
        (r) =>
          r.listing.title.toLowerCase().includes(searchQuery) ||
          r.counterParty.name.toLowerCase().includes(searchQuery)
      )
    }

    return result
  }, [reservations, statusFilter, searchQuery])

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
            {searchQuery
              ? `There are no reservation with "${searchQuery} found.`
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