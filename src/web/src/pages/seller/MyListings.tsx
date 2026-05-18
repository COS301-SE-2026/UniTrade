import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    IconLayoutDashboard,
    IconSearch,
    IconPackage,
    IconNotes,
    IconBoxPadding,
} from '@tabler/icons-react'

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
    live: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    draft: 'bg-[#e0f7fa] text-[#006064]',
    rejected: 'bg-red-100 text-red-400',
}

const statusLabel: Record<ListingStatus, string> = {
    live: 'live',
    pending: 'Pending Review',
    draft: 'Draft',
    rejected: 'Rejected',
}

function statusPill({ status } : {status: ListingStatus}) {
    return (
        <span className={`text-xs font-medium px-3 py-1 rounded =-full ${statusStyles[status]}`}>
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