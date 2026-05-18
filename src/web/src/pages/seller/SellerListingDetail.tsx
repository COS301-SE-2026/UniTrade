import { useNavigate } from 'react-router-dom'
import { IconCheck } from '@tabler/icons-react'
import React, { useState } from 'react'
//import MyListings from './MyListings';

//Mock listing data
const mockListing = {
    id: '4',
    title: 'Calculus - Early Transcendentals',
    price: 'R4500',
    condition: 'Good',
    category: 'Textbook',
    courseCode: 'WTW114',
    listedOn: '7 May 2026',
    views: 42,
    description: 'Good condition with minor highlighting on pages 3-5. All pages intact, spine undamaged. Ideal for first year Calculus students at UP. Includes the original bookmark and a handwritten summary sheet for chapter 5.',
    tags: ['Good', 'WTW114', 'First Year', 'UP'],
    images: [
        'https://placehold.co/540x300/1a3a7a/ffffff?text=Calculus',
        'https://placehold.co/80x70/1a3a7a/ffffff?text=img2',
        'https://placehold.co/80x70/1a3a7a/ffffff?text=img3',
        'https://placehold.co/80x70/1a3a7a/ffffff?text=img4',
    ],
    status: 'live' as const,
    aiScore: 78,
    aiLabel: 'Low Risk',
    reserved: true,
    timeline: [
        { label: 'Draft created',         time: '7 May 2026 · 09:15', done: true  },
        { label: 'Submitted for review',  time: '7 May 2026 · 09:22', done: true  },
        { label: 'AI Scoring Complete',   time: '7 May 2026 · 09:23', done: true  },
        { label: 'Live',                  time: '7 May 2026 · 09:23', done: true  },
    ],
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode}) {
    return (
        <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-xs font-medium text-navy-700 dark:text-white">{value}</span>
        </div>
    )
}

//Main Page
export default function SellerListingDetail() {
  const navigate = useNavigate()
  const listing = mockListing
  const [selectedImg, setSelectedImg] = useState(0)

  return (
    <div className="space-y-4">

      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span
          className="text-[#00aaff] cursor-pointer hover:underline"
          onClick={() => navigate('/seller/listings')}
        >
          My Listings
        </span>
        <span>›</span>
        <span className="text-navy-700 dark:text-white">{listing.title}</span>
      </div>
      <div className="grid grid-cols-3 gap-5">

        <div className="col-span-2 space-y-4">

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <img
              src={listing.images[selectedImg]}
              alt={listing.title}
              className="w-full h-64 object-cover rounded-lg mb-3"
            />
            <div className="flex gap-2">
              {listing.images.slice(1).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`thumbnail ${i + 2}`}
                  onClick={() => setSelectedImg(i + 1)}
                  className={`w-20 h-16 object-cover rounded-lg cursor-pointer border-2 transition-colors ${
                    selectedImg === i + 1
                      ? 'border-navy-700 dark:border-white'
                      : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h1 className="text-lg font-bold text-navy-700 dark:text-white mb-1">
              {listing.title}
            </h1>
            <p className="text-2xl font-bold text-navy-700 dark:text-white mb-3">
              {listing.price}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {listing.tags.map(tag => (
                <span
                  key={tag}
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    tag === 'Good'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-50 text-blue-700 dark:bg-navy-700 dark:text-white/70'
                  }`}
                >
                  {tag === 'Good' && <IconCheck size={10} className="inline mr-1" />}
                  {tag}
                </span>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed mb-4">
              {listing.description}
            </p>

            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-1">
              Listing Details
            </h3>
            <DetailRow label="Category" value={listing.category} />
            <DetailRow
              label="Condition"
              value={
                <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {listing.condition}
                </span>
              }
            />
            <DetailRow label="Course Code" value={listing.courseCode} />
            <DetailRow label="Listed On"   value={listing.listedOn} />
            <DetailRow label="Views"       value={listing.views} />
          </div>
        </div>

        <div className="col-span-1 space-y-4">

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">

            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-sm font-semibold text-navy-700 dark:text-white">
                Listing Details
              </h3>
              <div className="flex gap-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
                  Live
                </span>
                {listing.reserved && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-500 border border-blue-200">
                    Reserved
                  </span>
                )}
              </div>
            </div>

            <h4 className="text-xs font-semibold text-[#00aaff] uppercase tracking-wide mb-3">
              AI Risk Score
            </h4>
            <div className="bg-gray-50 dark:bg-navy-700 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-navy-700 dark:bg-navy-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">AI</span>
                </div>
                <p className="text-sm font-semibold text-navy-700 dark:text-white">
                  AI Confidence Score - {listing.aiLabel}
                </p>
              </div>
            
              <div className="h-2 bg-gray-200 dark:bg-navy-600 rounded-full mb-1.5">
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${listing.aiScore}%` }}
                />
              </div>
              <p className="text-xs text-green-600 font-semibold">
                {listing.aiScore}/100 — went live automatically
              </p>
            </div>

            <h4 className="text-xs font-semibold text-[#00aaff] uppercase tracking-wide mb-3">
              Submission timeline
            </h4>
            <div className="space-y-0">
              {listing.timeline.map((step, i) => (
                <div key={i} className="flex gap-3 pb-3 relative">
                  {/* Dot */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full mt-0.5 ${
                      i === listing.timeline.length - 1
                        ? 'bg-navy-700 dark:bg-white'
                        : 'bg-green-500'
                    }`} />
                    {i < listing.timeline.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 dark:bg-white/10 mt-1" />
                    )}
                  </div>

                  <div className="pb-1">
                    <p className="text-xs font-semibold text-navy-700 dark:text-white">
                      {step.label}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-4">
              Actions
            </h3>
            <button className="w-full bg-navy-700 hover:bg-navy-500 text-white font-semibold text-sm py-3 rounded-xl mb-2.5 transition-colors">
              Edit Listing
            </button>
            <button className="w-full border border-gray-200 dark:border-white/20 text-navy-700 dark:text-white font-semibold text-sm py-2.5 rounded-xl mb-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              Mark As Sold
            </button>
            <button className="w-full border border-gray-200 dark:border-white/20 text-[#00aaff] font-semibold text-sm py-2.5 rounded-xl mb-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              Save as Draft
            </button>
            <button className="w-full border border-red-200 dark:border-red-900/50 text-red-500 font-semibold text-sm py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              Delete Listing
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}