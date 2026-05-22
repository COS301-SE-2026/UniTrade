//export type ListingStatus = 'live' | 'pending' | 'draft' | 'rejected'
import type { ListingStatus } from '../../../types/listing'

const statusStyles: Record<ListingStatus, string> = {
  live:     'bg-green-100 text-green-700',
  pending:  'bg-amber-100 text-amber-700',
  draft:    'bg-[#e0f7fa] text-[#006064]',
  rejected: 'bg-red-100 text-red-400',
}

const statusLabel: Record<ListingStatus, string> = {
  live:     'Live',
  pending:  'Pending Review',
  draft:    'Draft',
  rejected: 'Rejected',
}

export default function StatusPill({ status }: { status: ListingStatus }) {
  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusStyles[status]}`}>
      {statusLabel[status]}
    </span>
  )
}