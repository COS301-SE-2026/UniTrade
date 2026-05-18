import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    IconLayoutDashboard,
    IconSearch,
    IconPackage,
    IconNotes,
    IconBoxPadding,
} from '@tabler/icons-react'
import ListingDetail from '../buyer/ListingDetail'

//Types needed 
type ListingStatus = 'live' | 'pending' | 'draft' | 'rejected'

interface Listing {
    id:string
    title: string
    meta: string
    price: string
    status: ListingStatus
    views: number
    image: string
}

//Mock Data
const mockListings: Listing[] = [
  { id: '1', title: 'Chemistry Textbook - 3rd Ed', meta: 'CMY127 · Listed 7 May 2026',     price: 'R250',  status: 'live',     views: 42, image: 'https://placehold.co/48x48/1a3a7a/ffffff?text=CH' },
  { id: '2', title: 'HP Laptop 15" - Good Condition', meta: 'Electronics · Listed 5 May 2026', price: 'R4500', status: 'live',     views: 25, image: 'https://placehold.co/48x48/1a3a7a/ffffff?text=LP' },
  { id: '3', title: 'Geometry Set - Unopened',     meta: 'Stationery · Listed 4 May 2026',  price: 'R250',  status: 'pending',  views: 68, image: 'https://placehold.co/48x48/1a3a7a/ffffff?text=GS' },
  { id: '4', title: 'Calculus - Early Transcendentals', meta: 'WTW114 · Listed 3 May 2026', price: 'R350',  status: 'draft',    views: 89, image: 'https://placehold.co/48x48/1a3a7a/ffffff?text=CA' },
  { id: '5', title: 'Molecular Biology - 6th Ed',  meta: 'BIO226 · Listed 3 May 2026',     price: 'R350',  status: 'rejected', views: 89, image: 'https://placehold.co/48x48/1a3a7a/ffffff?text=MB' },
]

const statusStyles: Record<ListingStatus, string> = {
  live:     'bg-green-100 text-green-700',
  pending:  'bg-amber-100 text-amber-700',
  draft:    'bg-[#e0f7fa] text-[#006064]',
  rejected: 'bg-red-100 text-red-400',
}

const statusLabel: Record<ListingStatus, string> = {
    live: 'live',
    pending: 'Pending Review',
    draft: 'Draft',
    rejected: 'Rejected',
}

function StatusPill({ status }: { status: ListingStatus }) {
  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusStyles[status]}`}>
      {statusLabel[status]}
    </span>
  )
}

function ActionButtons({ listing }: { listing: Listing }) {
    const navigate = useNavigate()

    if (listing.status === 'live' || listing.status === 'pending') {
        return (
            <div className="flex gap-2">
                <button 
                  onClick={ () => navigate(`/seller/listings/${listing.id}`)}
                  className="bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">
                    View
                  </button>
                  <button className="border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-gray-50
                  dark:hover:bg-white/5 transition-colors">
                    Edit
                  </button>
            </div>
        )
    }

    if (listing.status === 'draft') {
        return (
            <div className="flex gap-2">
                <button className="bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold
                px-5 py-2 rounded-full transition-colors">
                    Submit
                </button>
                <button className="border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white text-sm 
                font-semibold px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
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
                <button className="border border-gray-300 dark:border-white/20 text-navy-700 dark:text-white text-sm
                font-semibold px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition colors">
                    Edit
                </button>
            </div>
        )
    }

    return null
}

type Tab = 'all' | ListingStatus 

export default function MyListings() {
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = activeTab === 'all'
    ? mockListings
    : mockListings.filter(l => l.status === activeTab)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all',      label: `All` },
    { key: 'live',     label: `Live (${mockListings.filter(l => l.status === 'live').length})` },
    { key: 'pending',  label: `Pending (${mockListings.filter(l => l.status === 'pending').length})` },
    { key: 'draft',    label: `Drafts (${mockListings.filter(l => l.status === 'draft').length})` },
    { key: 'rejected', label: `Rejected (${mockListings.filter(l => l.status === 'rejected').length})` },
  ]

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-navy-700 dark:text-white">My Listings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage all Listings in one place</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: <IconPackage size={20} />, value: 12, label: 'Total Listings' },
          { icon: <span className="text-base">((·))</span>, value: 7,  label: 'Live' },
          { icon: <IconNotes size={20} />, value: 3,  label: 'Pending Review' },
          { icon: <IconBoxPadding size={20} />, value: 2,  label: 'Drafts' },
        ].map(({ icon, value, label }) => (
          <div
            key={label}
            className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3"
          >
            {icon && <span className="text-navy-700 dark:text-white">{icon}</span>}
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
        <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Listing
        </div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-16 text-right">
            Price
        </div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-32 text-center">
            Status
        </div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-10 text-right">
            Views
        </div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-44 text-right">
            Actions
        </div>
        </div>
    {filtered.map((listing, i) => (
    <div
            key={listing.id}
            className={`flex items-center gap-4 px-5 py-4 ${
              i < filtered.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''
            }`}
          >
        <img
              src={listing.image}
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
              {listing.price}
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
          Showing {filtered.length} of {mockListings.length} listings
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