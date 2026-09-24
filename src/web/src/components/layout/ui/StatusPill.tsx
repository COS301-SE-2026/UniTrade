//export type ListingStatus = 'live' | 'pending' | 'draft' | 'rejected'
import type { ListingStatus } from '../../../types/listing'

const statusStyles: Record<ListingStatus, string> = {
  live:     'bg-green-100 text-green-700',
  pending:  'bg-amber-100 text-amber-700',
  draft:    'bg-[#e0f7fa] text-[#006064]',
  rejected: 'bg-red-100 text-red-400',
  reserved: 'bg-indigo-100 text-indigo-700',
  sold: 'bg-navy-100 text-navy-700',
  screening: 'bg-red-100 text-red-400',
  low_visibility: 'bg-red-100 text-red-400',
  under_review: 'bg-orange-100 text-700',
  removed: 'bg-red-100 text-red-700',
  
}

const statusLabel: Record<ListingStatus, string> = {
  live:     'Live',
  pending:  'Pending Review',
  draft:    'Draft',
  rejected: 'Rejected',
  reserved: 'Reserved',
  sold: 'Sold',
  screening: 'Screening',
  low_visibility: 'Low Visibility',
  under_review: 'Under Review',
  removed: 'Removed',
 
}

export default function StatusPill({ status }: Readonly<{ status: ListingStatus }>) {
  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusStyles[status]}`}>
      {statusLabel[status]}
    </span>
  )
}