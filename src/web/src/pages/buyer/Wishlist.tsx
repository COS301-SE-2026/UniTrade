import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listingsService } from '../../services/listingsService'
import { formatPrice } from '../../utils/formatters'
import type { WishlistListing, BrowseCondition } from '../../types/listing'
import { createReservation } from '../../services/reservationService'
import { SummaryCard } from './Reservation'
import {
  IconHeart,
  IconReceipt2,
  IconBookmark,
  IconTrash,
  IconFilter,
  IconChevronDown,
} from '@tabler/icons-react'

type SortOption = 'Date added ' | 'Price low' | 'Price high'


const conditionColours: Record<BrowseCondition, {bg: string ; text: string; dot: string}> = {
    like_new: {bg : 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500'},
    Good: {bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500'},
    Fair: {bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500'},
    Poor: {bg : 'bg-rose-50', text: 'text-rose-700', dot:'bg-rose-500'},
  }

  function ConditionBadge({condition} : {condition: BrowseCondition}) {
    const s = conditionColours[condition] ?? conditionColours.Fair
    return (

      <span className= {`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.text}`}>
        <span className= {`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      </span>
    )
  }


  function WishlistCard ({
    listing,
    //onClick,
    onRemoved,
  } : {
    listing: WishlistListing
    onClick: () => void
    onRemoved: (id: string) => void 
  }) {
    const navigate = useNavigate()
    const [reserving , setReserving ] = useState(false)
    const [reserved, setReserved ] = useState(false)
    const [reserveError , setReserveError] = useState<string | null>(null)
    const [removing, setRemoving] = useState(false)

    const handleReserve = async (e: React.MouseEvent) => {
      e.stopPropagation()
      setReserving(true)
      setReserveError(null)

      const result = await createReservation({listingId: String(listing.id)})

      if(result.success) {
        setReserved(true)
        navigate('/buyer/reservations')
      } else if (result.error.code === 'self_reserve') {
        setReserveError("You cant reserve your own listing.")
      } else if (result.error.code === 'already_reserved'){
        setReserveError('Sorry, This Item has already been reserved by someone else')
      } else {
        setReserveError(result.error.message ?? 'Could not reserve this item.')
      }
      setReserving(false)
    }

    const handleRemove = async () =>{
      //e.stopPropagation()
      if (removing) return 
      setRemoving(true)
      try {
        await listingsService.removeFromWishlist(String(listing.id))
        onRemoved(listing.id)
      } catch {
        setRemoving(false)
      }
    }

    const unavailable = listing.status !== 'live'

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <img 
          src = {listing.image}
          alt = {listing.title}
          onClick = {() => navigate(`/listings/${listing.id}`)}
          className="w-20 h-20 rounded-lg object-cover shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
          />

          <div className = "flex-1 min-w-0">
            <div 
            onClick = {() => navigate(`/listings/${listing.id}`)}
            className = "min-w-0 cursor-pointer"
          >
            <div className = "flex items-center gap-2 flex-wrap">
              <p className = "text-sm font-bold text-gray-800 truncate">
                {listing.title}
              </p>
              <ConditionBadge condition={listing.condition} />
            </div>
            <p className = "text-xs text-gray-400 mt-0.5">
              Listed by{' '}
              <span className = "font-semibold text-gray-500">
                {listing.sellerName ?? 'Unknown seller'}
              </span>{' '}
              . {listing.category}
            </p>
          </div>

          <div className = "flex items-center justify-between gap-4 mt-2 flex-wrap">
            <span className = "text-sm font-bold text-gray-800">
              {formatPrice(listing.price)}
            </span>

            <div className = "flex items-center gap-2">
              <button 
              type = "button"
              onClick = {handleReserve}
              disabled = {reserving || reserved || unavailable}
              className = "inline-flex items-center justify-center gap-1.5 rounded-lg ng-navy-800 border border-navy-800 text-white px-4 py-2 text-sm font-semibold hover: bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconBookmark size = {16} />
                {reserved ? 'Reserved ' : reserving ? 'Reserving...' : unavailable ? 'Unavailable' : 'Reserve'}

              </button>
              <button 
              type = "button"
              onClick={handleRemove}
              disabled = {removing}
              className = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 text-rose-600 px-4 py-2 text-sm font-semibold hover: bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconTrash size = {16} />
                {removing ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
          {reserveError && <p className = "text-xs text-rose-600 mt-2">
            {reserveError}
          </p> }

          </div>
          </div>
    )
  }

export default function Wishlist() {
  const navigate = useNavigate()
  const [listings, setListings ] = useState<WishlistListing[]>([])
  const [total, setTotal ] = useState(0)
  const [loading, setLoading ] = useState(true)
  const [error, setError ] = useState<string | null>(null)

  useEffect(() => {
    listingsService.getWishlist()
    .then(data => {
      setListings(data.listings)
      setTotal(data.total)
    })
    .catch(() => setError('Failed to load your wishlist '))
    .finally(() => setLoading(false))
  }, [])

  const handleRemoved = (id: string) => {
    setListings(curr => curr.filter(l => l.id ==id))
    setTotal(t => t -1 )
  }

  if(loading ) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-gray-400">
        Loading...
      </p>
    </div>
  )

  if(error) return (
    <div className = " flex items-center justify-center h-64">
      <p className="text-sm text-red-400">
        {error}
      </p>
    </div>
  )

  return (
    <div className = "flex flex-col gap-6">
      <div>
        <h1 className = " text-2xl font-extrabold text-gray-800 dark:text-white">
          Your Wishlist
        </h1>
        <p className = "text-sm text-gray-400 mt-1">
          {total} {total === 1 ? 'item' : 'items'} saved for later
        </p>
      </div>

      {listings.length === 0 ? (
        <div className = "rounded-cl border border-gray-200 dark:border-white/10 p-8 text-center">
          <p className = "text-sm text-gray-400">
            Your wishlist is currently empty. Browse listings and tap "Add to Wishlist " to save items here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map(listing => (
            <WishlistCard
            key = {listing.id}
            listing={listing}
            onClick = {() => navigate(`/listings/${listing.id}`)}
            onRemoved={handleRemoved}
            />
          ))}
          </div>
      )}
    </div>
  )
  
}