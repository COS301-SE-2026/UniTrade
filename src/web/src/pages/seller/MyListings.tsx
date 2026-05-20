import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconPackage,
  IconNotes,
  IconBoxPadding,
} from '@tabler/icons-react'
import { listingsService } from '../../services/listingsService'
import { formatPrice } from '../../utils/formatters'
import type { ListingSummary, ListingStatus } from '../../types/listing'
import StatusPill from '../../components/layout/ui/StatusPill'


function ActionButtons({ listing }: { listing: ListingSummary }) {
  const navigate = useNavigate()

  if (listing.status === 'live' || listing.status === 'pending') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/seller/listings/${listing.id}`)}
          className="bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
        >
          View
        </button>
        <button className="border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          Edit
        </button>
      </div>
    )
  }

  if (listing.status === 'draft') {
    return (
      <div className="flex gap-2">
        <button className="bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">
          Submit
        </button>
        <button className="border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          Edit
        </button>
      </div>
    )
  }

  if (listing.status === 'rejected') {
    return (
      <div className="flex gap-2">
        <button className="bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">
          Resubmit
        </button>
        <button className="border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          Edit
        </button>
      </div>
    )
  }

  return null
}

type Tab = 'all' | ListingStatus

export default function MyListings() {
  const [listings, setListings] = useState<ListingSummary[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    listingsService.getMyListings()
      .then(data => {
        setListings(data.listings)
        setTotal(data.total)
      })
      .catch(() => setError('Failed to load listings'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeTab === 'all'
    ? listings
    : listings.filter(l => l.status === activeTab)

  const count = (status: ListingStatus) =>
    listings.filter(l => l.status === status).length

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'live',     label: `Live (${count('live')})` },
    { key: 'pending',  label: `Pending (${count('pending')})` },
    { key: 'draft',    label: `Drafts (${count('draft')})` },
    { key: 'rejected', label: `Rejected (${count('rejected')})` },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-red-400">{error}</p>
    </div>
  )

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-navy-700 dark:text-white">My Listings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage all Listings in one place</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: <IconPackage size={20} />,    value: total,           label: 'Total Listings' },
          { icon: <span className="text-base">((·))</span>, value: count('live'),    label: 'Live' },
          { icon: <IconNotes size={20} />,      value: count('pending'), label: 'Pending Review' },
          { icon: <IconBoxPadding size={20} />, value: count('draft'),   label: 'Drafts' },
        ].map(({ icon, value, label }) => (
          <div
            key={label}
            className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3"
          >
            <span className="text-navy-700 dark:text-white">{icon}</span>
            <div>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setCurrentPage(1) }}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition-colors ${
              activeTab === tab.key
                ? 'bg-navy-700 text-white border-navy-700'
                : 'bg-white dark:bg-navy-800 text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">

        <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-navy-900/40">
          <div className="w-12 flex-shrink-0" />
          <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Listing</div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-16 text-right">Price</div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-32 text-center">Status</div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-10 text-right">Views</div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-44 text-right">Actions</div>
        </div>

        {filtered.map((listing, i) => (
          <div
            key={listing.id}
            className={`flex items-center gap-4 px-5 py-4 ${
              i < filtered.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''
            }`}
          >
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">
                {listing.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{listing.meta}</p>
            </div>
            <p className="text-sm font-semibold text-navy-700 dark:text-white w-16 text-right">
              {formatPrice(listing.price)}
            </p>
            <div className="w-32 flex justify-center">
              <StatusPill status={listing.status} />
            </div>
            <p className="text-sm text-gray-400 w-10 text-right">{listing.views}</p>
            <div className="w-44 flex justify-end">
              <ActionButtons listing={listing} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing {filtered.length} of {total} listings
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-sm font-semibold border transition-colors ${
                currentPage === page
                  ? 'bg-navy-700 text-white border-navy-700'
                  : 'bg-white dark:bg-navy-800 text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/10 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}