import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listingsService } from '../../services/listingsService'
import { formatPrice } from '../../utils/formatters'
import type { BrowseListing, BrowseCondition, Category } from '../../types/listing'
import { createReservation } from '../../services/reservationService'

import { useAuthStore } from '../../store/useAuthStore'



function CategoryCard({
  title,
  active,
  onClick,
  className = '',
}: {
  title: string
  active: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-full border text-sm font-medium capitalize transition-colors whitespace-nowrap ${active
        ? 'bg-navy-700 text-white border-navy-700'
        : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-white/70 border-gray-300 dark:border-white/10 hover:border-navy-700'
        } ${className}`}
    >
      {title}
    </button>
  )
}


function ListingCard({
  listing,
  onClick,
}: {
  listing: BrowseListing
  onClick: () => void
}) {

  const navigate = useNavigate()
  //const { user } = useAuthStore()
  const [reserving, setReserving] = useState(false)
  const [reserved, setReserved] = useState(false)
  const[reserveError, setReserveError] = useState<string |null>(null)

  const [wishlisting, setWishlisting] = useState(false);
  const [wishlisted, setWishlisted] = useState(false)
  const [wishlistError, setWishlistError] = useState<string | null>(null)

  const conditionColours: Record<BrowseCondition, string> = {
    like_new: 'bg-green-100 text-green-700',
    Good: 'bg-green-100 text-green-700',
    Fair: 'bg-yellow-100 text-yellow-700',
    Poor: 'bg-red-100 text-red-700',
  }

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (wishlisting || wishlisted) return
    
    setWishlisting(true)
    setWishlistError(null)

    try {
      await listingsService.addToWishlist(String(listing.id))
      setWishlisted(true)
    } catch (err) {
      if (err instanceof Error && err.message === 'already_wishlisted') {
        setWishlisted(true)
      } else {
        setWishlistError('Could not add to wishlist.')
      }
    }finally {
      setWishlisting(false)
    }
  }

  const handleReserve = async (e: React.MouseEvent) => {
    e.stopPropagation() 

    setReserving(true)
    setReserveError(null)

    const result = await createReservation({ listingId: String(listing.id) })
   
    if(result.success) 
    {
      setReserved(true)
      navigate('/buyer/reservations')
    }
    else if (result.error.code === 'self_reserve'){
        setReserveError("You can't reserve your own listing.")
      }
    else if(result.error.code === 'already_reserved')
      {
        setReserveError('Item was just reserved by someone else!')
      }
      
      else{
        setReserveError(result.error.message ?? 'Could not reserve this item.')
      }
      setReserving(false)
  }

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col cursor-pointer hover:border-navy-700 dark:hover:border-white/30 transition-colors">
      <img
        src={listing.image}
        alt={listing.title}
        onClick={onClick}
        className="w-full h-48 object-cover"
      />
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-2">{listing.title}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${conditionColours[listing.condition]}`}>
            {listing.condition}
          </span>
        </div>


        <p className="text-xs text-gray-400 capitalize">{listing.category}</p>
        <p className="text-sm font-bold text-gray-800 dark:text-white">
          {formatPrice(listing.price)}
        </p>

        {reserveError && (
          <p className="text-xs text-rose-600">{reserveError}</p>
        )}
        {wishlistError && (
          <p className= "text-xs text-rose-600">{wishlistError}
          </p>
        )}

        <div className="flex flex-col gap-2 mt-auto pt-2">
          <button 
          onClick={handleReserve}
          disabled={reserving || reserved}
          className="w-full py-2 bg-navy-700 text-white text-sm font-semibold rounded-lg hover:bg-navy-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
           {reserved ? 'Reserved' : reserving? 'Reserving...' : 'Reserve'}
          </button>
          <button 
          onClick = { handleAddToWishlist}
          disabled = {wishlisting || wishlisted}
          className="w-full py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            {wishlisted ? 'In Wishlist' : wishlisting? 'Adding...' : 'Add to Wishlist'}
          </button>
        </div>
      </div>
    </div>
  )
}


type CategoryFilter = 'All' | string
type ConditionFilter = 'All conditions' | BrowseCondition
type SortOption = 'Newest' | 'Oldest' | 'Price Low' | 'Price High'
const PAGE_SIZE = 8;



export default function BrowseAllListing() {
  const navigate = useNavigate()
  const [listings, setListings] = useState<BrowseListing[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All')
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('All conditions')
  const [sortOption, setSortOption] = useState<SortOption>('Newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [showMoreCategories, setShowMoreCategories] = useState(false)
  const { user } = useAuthStore()
  useEffect(() => {
    listingsService.getBrowseListings()
      .then(data => {
        const filtered = user
        ? data.listings.filter(l => l.sellerId !== user.id)
        : data.listings
        setListings(filtered)
        setTotal(filtered.length)
      })
      .catch(() => setError('Failed to load listings'))
      .finally(() => setLoading(false))

    listingsService.getListingsCategories()
      .then(setCategories)
      .catch(() => {
        // category chips are non-critical; leave the list empty (just "All") on failure
      })
  }, [user])
  
  const visibleCategories = categories.slice(0,3)
  const hiddenCategories = categories.slice(3)

  const afterCategory = activeCategory === 'All'
    ? listings
    : listings.filter(l => l.category === activeCategory)


  const afterCondition = conditionFilter === 'All conditions'
    ? afterCategory
    : afterCategory.filter(l => l.condition === conditionFilter)


  const filtered = [...afterCondition].sort((a, b) => {
    if (sortOption === 'Price Low') return a.price - b.price
    if (sortOption === 'Price High') return b.price - a.price
    return 0
  })



  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const handleCategpryClick = (category: string) => {
    setActiveCategory(category)
    setCurrentPage(1)
    setShowMoreCategories(false)
  }
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
    <div className="flex flex-col gap-6">


      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white">
          Browse All Listings
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {total} listings available at the University of Pretoria
        </p>
      </div>


    
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flew-wrap items-center gap-2">
          <CategoryCard
            key="All"
            title="All"
            active={activeCategory === 'All'}
            onClick={() => handleCategpryClick('All')}
          />
          {visibleCategories.map(cat => (
            <CategoryCard
              key={cat.id}
              title={cat.name}
              active={activeCategory === cat.name}
              onClick={() => handleCategpryClick(cat.name)}
            />
          ))}

          {hiddenCategories.length > 0 && (
            <div className="relative md:hidden">
              <button
                onClick={() => setShowMoreCategories(!showMoreCategories)}
                className="px-5 py-2 rounded-full border text-sm font-medium capitalize transition-colors whitespace-nowrap bg-white dark:bg-navy-800 text-gray-700 dark:text-white/70 border-gray-300 dark:border-white/10 hover:border-navy-700"
              >
                More +
              </button>

              {showMoreCategories && (
                <div className="absolute z-50 mt-2 w-48 bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg py-2">
                  {hiddenCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategpryClick(cat.name)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-navy-700 text-sm capitalize ${
                        activeCategory === cat.name ? 'text-navy-700 font-medium' : ''
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {hiddenCategories.map((cat) => (
            <CategoryCard
              key={cat.id}
              title={cat.name}
              active={activeCategory === cat.name}
              onClick={() => handleCategpryClick(cat.name)}
              className="hidden md:inline-flex"
            />
          ))}
        </div>
        
        <div className="flex gap-2">
          <select
            value={conditionFilter}
            onChange={e => setConditionFilter(e.target.value as ConditionFilter)}
            className="border border-gray-300 dark:border-white/20 dark:bg-navy-800 dark:text-white rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-navy-700"
          >
            <option value="All conditions">All conditions</option>
            <option value="like_new">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value as SortOption)}
            className="border border-gray-300 dark:border-white/20 dark:bg-navy-800 dark:text-white rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-navy-700"
          >
            <option>Newest</option>
            <option>Oldest</option>
            <option>Price Low</option>
            <option>Price High</option>
          </select>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginated.map(listing => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onClick={() => navigate(`/buyer/listings/${listing.id}`)}
          />
        ))}
      </div>


      <div className="flex items-center justify-between flex-wrap gap-4">
        <p className="text-sm text-gray-400">
          Showing {filtered.length} of {total} listings
        </p>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-400 whitespace-nowrap">
            Showing {paginated.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            –{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} listings
          </p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${currentPage === page
                  ? 'bg-navy-700 text-white'
                  : 'bg-white dark:bg-navy-800 border border-gray-300 dark:border-white/20 text-gray-600 dark:text-white hover:border-navy-700'
                  }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
