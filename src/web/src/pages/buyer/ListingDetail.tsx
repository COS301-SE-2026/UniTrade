import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  IconStar, IconCheck, IconChevronRight,
} from '@tabler/icons-react'
import type React from 'react'
import { listingsService } from '../../services/listingsService'
import { formatPrice, formatDate, formatCondition } from '../../utils/formatters'
import type { ListingDetail as ListingDetailType, SimilarListing } from '../../types/listing'




function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-medium text-navy-700 dark:text-white">{value}</span>
    </div>
  )
}

/*function ReviewRow({ initials, name, stars, text, date }: {
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
}*/


export default function ListingDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [listing, setListing] = useState<ListingDetailType | null>(null)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courseCode, setCourseCode] = useState<string | null>(null);
  const [similarListings, setSimilarListings] = useState<SimilarListing[] | null>(null)

  useEffect(() => {
    if (!id) return
    listingsService.getById(id)
      .then(data => {
        setListing(data);
        if (data.courseId) {
          listingsService
            .getCourse(data.courseId)
            .then((course) => setCourseCode(course.courseCode))
            .catch(() => setCourseCode(null))
        }
        listingsService.getSimilarListings(data)
          .then(setSimilarListings)
          .catch(() => setSimilarListings([]))
        setActiveImage(data.images.find(i => i.isPrimary)?.url ?? data.images[0]?.url ?? null)
      })

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
        <span className="text-[#00aaff] cursor-pointer hover:underline" onClick={() => navigate('/buyer/listings')}>
          Listings
        </span>
        <IconChevronRight size={12} />
        <span>{listing.title}</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <div className="w-full h-56 rounded-lg overflow-hidden mb-3 bg-gray-100 dark:bg-navy-700">
              {activeImage ? (
                <img src={activeImage} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl">📚</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {listing.images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setActiveImage(img.url)}
                  className={`w-14 h-12 rounded-lg overflow-hidden cursor-pointer border-2 bg-gray-100 dark:bg-navy-700 ${activeImage === img.url
                    ? 'border-navy-700 dark:border-white'
                    : 'border-transparent'
                    }`}
                >
                  {img.url ? (
                    <img src={img.url} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">📚</div>
                  )}
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

            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                <IconCheck size={11} /> {formatCondition(listing.condition)}
              </span>
              {listing.category === 'book' && courseCode && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-navy-700 dark:text-white/70">
                  {courseCode}
                </span>
              )}
              {listing.category === 'electronics' && listing.metadata?.brand && (
                <span className="text-xs bg-blue-50 text-blue-700 dark:bg-navy-700 dark:text-white/70 px-3 py-1 rounded-full font-medium">
                  {listing.metadata.brand}
                </span>
              )}
              {listing.category === 'furniture' && listing.metadata?.dimensions && (
                <span className="text-xs bg-blue-50 text-blue-700 dark:bg-navy-700 dark:text-white/70 px-3 py-1 rounded-full font-medium">
                  {listing.metadata.dimensions}
                </span>
              )}

            </div>

            <hr className="border-gray-100 dark:border-white/5 mb-4" />
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-2">Description</h3>
            <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed mb-4">
              {listing.description}
            </p>

            <hr className="border-gray-100 dark:border-white/5 mb-4" />
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-2">Listing details</h3>
            <DetailRow label="Category" value={listing.category} />
            <DetailRow label="Condition"
              value={
                <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  <IconStar size={10} className="fill-green-700" /> {formatCondition(listing.condition)}
                </span>
              }
            />
            {listing.category === 'book' && courseCode && (
              <DetailRow label="Course Code" value={courseCode} />
            )}
            {listing.category === 'electronics' && listing.metadata?.brand && (
              <DetailRow label="Brand" value={listing.metadata.brand} />
            )}
            {listing.category === 'furniture' && listing.metadata?.dimensions && (
              <DetailRow label="Dimensions" value={listing.metadata.dimensions} />
            )}
            <DetailRow label="Listed on" value={formatDate(listing.listedAt)} />
            <DetailRow label="Views" value={listing.views} />
          </div>

          {/*<div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-3">Seller reviews</h3>
            {listing.reviews.length > 0 ? (
              listing.reviews.map(review => (
                <ReviewRow key={review.id} {...review} />
              ))
            ) : (
              <p className="text-xs text-gray-400">No reviews yet.</p>
            )}
          </div>*/}
        </div>


        <div className="col-span-1 space-y-4">


          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-4">Seller</h3>
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-navy-600 animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-28 bg-gray-200 dark:bg-navy-600 rounded animate-pulse mx-auto" />
                <div className="h-2.5 w-20 bg-gray-200 dark:bg-navy-600 rounded animate-pulse mx-auto" />
                <div className="h-2.5 w-16 bg-gray-200 dark:bg-navy-600 rounded animate-pulse mx-auto" />
              </div>
              <span className="text-xs text-white bg-navy-700 dark:bg-navy-500 px-4 py-1.5 rounded-full font-semibold">
                Coming soon
              </span>
            </div>
          </div>


          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-3">Similar listings</h3>
            {similarListings === null ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-navy-600 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-gray-200 dark:bg-navy-600 rounded animate-pulse mx-auto" />
                  <div className="h-2.5 w-20 bg-gray-200 dark:bg-navy-600 rounded animate-pulse mx-auto" />
                </div>
              </div>
            ) : similarListings.length === 0 ? (
              <p className="text-xs text-gray-400">No similar listings found.</p>
            ) : (
              <div className="space-y-3">
                {similarListings.map(item => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/listings/${item.id}`)}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700 rounded-lg p-2 -m-2"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-navy-700 flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">📚</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-navy-700 dark:text-white truncate">{item.title}</p>
                      <p className="text-[11px] text-gray-400">{formatPrice(item.price)}</p>
                    </div>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      {formatCondition(item.condition)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>

  )
}