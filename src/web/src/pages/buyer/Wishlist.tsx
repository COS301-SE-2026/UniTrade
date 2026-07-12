import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listingsService } from '../../services/listingsService'
import { formatPrice } from '../../utils/formatters'
import type { WishlistListing, BrowseCondition } from '../../types/listing'
import { createReservation } from '../../services/reservationService'


const conditionColours: Record<BrowseCondition, string> = {
    like_new: 'bg-green-100 text-green-700',
    Good: 'bg-green-100 text-green-700',
    Fair: 'bg-yellow-100 text-yellow-700',
    Poor: 'bg-red-100 text-red-700',
  }


  function WishlistCard ({
    listing,
    onClick,
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

    const handleRemove = async ( e: React.MouseEvent ) => {
      e.stopPropagation()
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
  }


export default function Wishlist() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">Wishlist</h1>
      <p className="text-sm text-gray-500 dark:text-white/50">Coming soon.</p>
    </div>
  )
}