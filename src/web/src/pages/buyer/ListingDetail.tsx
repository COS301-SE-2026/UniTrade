import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  IconBookmark, IconHeart, IconMessage,
  IconFlag, IconStar, IconCheck, IconChevronRight,
} from '@tabler/icons-react'
import type React from 'react'
import { listingsService } from '../../services/listingsService'
import { formatPrice, formatDate, formatCondition } from '../../utils/formatters'
import type { ListingDetail as ListingDetailType } from '../../types/listing'


function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-medium text-navy-700 dark:text-white">{value}</span>
    </div>
  )
}

function ReviewRow({ initials, name, stars, text, date }: {
  initials: string; name: string; stars: number; text: string; date: string
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
        {initials}
      </div>
      <div>
        <p className="text-xs font-semibold text-navy-700 dark:text-white">{name}</p>
        <div className="flex gap-0.5 my-0.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <IconStar key={index} size={11} className={index < stars ? 'text-amber-500 fill-amber-500' : 'text-gray-300'} />
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-white/50 leading-relaxed">{text}</p>
        <p className="text-[10px] text-gray-300 mt-1">{formatDate(date)}</p>
      </div>
    </div>
  )
}

function SimilarRow({ title, meta, condition }: { title: string; meta: string; condition: string }) {
  const isGood = condition === 'good'
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg px-1 transition-colors">
      <div className="w-9 h-9 bg-gray-100 dark:bg-navy-700 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-navy-700 dark:text-white truncate">{title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{meta}</p>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
        isGood ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {formatCondition(condition)}
      </span>
    </div>
  )
}


export default function ListingDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [listing, setListing] = useState<ListingDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    listingsService.getById(id)
      .then(data => setListing(data))
      .catch(() => setError('Failed to load listing'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  )

  if (error || !listing) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-red-400">{error ?? 'Listing not found'}</p>
    </div>
  )

  return (
    <div className="space-y-4">

      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className="text-[#00aaff] cursor-pointer hover:underline" onClick={() => navigate('/buyer/dashboard')}>
          Dashboard
        </span>
        <IconChevronRight size={12} />
        <span className="text-[#00aaff] cursor-pointer hover:underline">Listings</span>
        <IconChevronRight size={12} />
        <span>{listing.title}</span>
      </div>

      <div className="grid grid-cols-3 gap-4">

        <div className="col-span-2 space-y-4">

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <div className="w-full h-56 bg-gray-100 dark:bg-navy-700 rounded-lg flex items-center justify-center mb-3">
              <span className="text-4xl">📚</span>
            </div>
            <div className="flex gap-2">
              {listing.images.map((img) => (
                <div key={img.id} className={`w-14 h-12 rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center cursor-pointer text-lg border-2 ${
                  img.isPrimary ? 'border-navy-700 dark:border-white' : 'border-transparent'
                }`}>
                  📚
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h1 className="text-lg font-bold text-navy-700 dark:text-white mb-1">{listing.title}</h1>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-navy-700 dark:text-white">
                {formatPrice(listing.price)}
              </span>
              <span className="text-sm text-gray-400">· negotiable</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                <IconCheck size={11} /> {formatCondition(listing.condition)}
              </span>
              {listing.tags.map(tag => (
                <span key={tag} className="text-xs bg-blue-50 text-blue-700 dark:bg-navy-700 dark:text-white/70 px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            <hr className="border-gray-100 dark:border-white/5 mb-4" />
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-2">Description</h3>
            <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed mb-4">
              {listing.description}
            </p>

            <hr className="border-gray-100 dark:border-white/5 mb-4" />
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-2">Listing details</h3>
            <DetailRow label="Category"    value={listing.category} />
            <DetailRow label="Condition"
              value={
                <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  <IconStar size={10} className="fill-green-700" /> {formatCondition(listing.condition)}
                </span>
              }
            />
            <DetailRow label="Course code" value={listing.courseCode} />
            <DetailRow label="Listed on"   value={formatDate(listing.listedAt)} />
            <DetailRow label="Views"       value={listing.views} />
          </div>

          
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-3">Seller reviews</h3>
            {listing.reviews.map(review => (
              <ReviewRow key={review.id} {...review} />
            ))}
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-3">Seller</h3>
            <div className="flex items-center gap-3 bg-blue-50 dark:bg-navy-700 rounded-lg p-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-navy-700 dark:bg-navy-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {listing.sellerInitials}
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-700 dark:text-white">{listing.sellerName}</p>
                <p className="text-xs text-gray-400">{listing.university}</p>
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <IconStar key={index} size={10} className="text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1">
                  <IconCheck size={9} /> Verified student
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              {[
                { val: listing.sellerTotalListings, label: 'Listings'  },
                { val: `${listing.sellerResponseRate}%`, label: 'Response' },
                { val: listing.sellerRating,         label: 'Rating'   },
              ].map(({ val, label }) => (
                <div key={label}>
                  <p className="text-base font-bold text-navy-700 dark:text-white">{val}</p>
                  <p className="text-[10px] text-gray-400">{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-navy-700 rounded-lg p-3 mb-4 flex gap-2">
              <span className="text-blue-500 text-sm flex-shrink-0">🛡</span>
              <p className="text-xs text-blue-700 dark:text-white/70 leading-relaxed">
                Reserve now to hold this item for 24 hours. No payment until you meet and inspect it in person.
              </p>
            </div>

            <button className="w-full bg-navy-700 hover:bg-navy-500 text-white font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 mb-2 transition-colors">
              <IconBookmark size={16} /> Reserve this item
            </button>
            <button className="w-full border border-navy-700 dark:border-white/20 text-navy-700 dark:text-white font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 mb-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <IconHeart size={16} /> Add to wishlist
            </button>
            <button className="w-full border border-[#00aaff] text-[#00aaff] font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 mb-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <IconMessage size={16} /> Message seller
            </button>
            <button className="w-full flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors">
              <IconFlag size={13} /> Report this listing
            </button>
          </div>

          
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-3">Similar listings</h3>
            {listing.similarListings.map(similar => (
              <SimilarRow key={similar.id} title={similar.title} meta={similar.meta} condition={similar.condition} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}