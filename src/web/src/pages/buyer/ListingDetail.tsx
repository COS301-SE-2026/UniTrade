import { useNavigate } from 'react-router-dom'
import {
  IconBookmark,
  IconHeart,
  IconMessage,
  IconFlag,
  IconStar,
  IconCheck,
  IconChevronRight,
} from '@tabler/icons-react'
import type React from 'react';

function DetailRow ({ label, value}: { label: string; value: React.ReactNode}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-medium text-navy-700 dark:text-white">{value}</span>
    </div>
  )
}

function ReviewRow({
  initials,
  name,
  stars,
  text,
  date,
}: {
  initials: string
  name: string
  stars: number
  text: string
  date: string
}) {
   return (
    <div className="flex gap-3 py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
        {initials}
      </div>
      <div>
        <p className="text-xs font-semibold text-navy-700 dark:text-white">{name}</p>
        <div className="flex gap-0.5 my-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <IconStar
              key={i}
              size={11}
              className={i < stars ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-white/50 leading-relaxed">{text}</p>
        <p className="text-[10px] text-gray-300 mt-1">{date}</p>
      </div>
    </div>
  )
}

function SimilarRow({
  title,
  meta,
  condition,
}: {
  title: string,
  meta: string,
  condition: string
}) {
  const isGood = condition === 'Good'
  return(
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0 cursor-pointer hover
    :bg-gray-50 dark:hover:bg-white/5 rounded-lg px-1 transition-colors">
      <div className="w-9 h-9 bg-gray-100 dark:bg-navy-700 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-navy-700 dark:text-white truncate">{title}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">{meta}</p>
      </div>
      <span 
       className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
        isGood
        ? 'bg-green-100 text-green-700'
        : 'bg-amber-100 text-amber-700'
       }`}
       >
        {condition}
       </span>
    </div>
  )
}

export default function ListingDetail() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">

      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <span 
          className="text-[#00aaff] cursor-pointer hover:underline"
          onClick={() => navigate('/buyer/dashboard')}>
            Dashboard
          </span>
          <IconChevronRight size={12} />
          <span className="text-[#00aaff] cursor-pointer hover:underline">Listings</span>
          <IconChevronRight size={12} />
          <span>Calculus - Early Transcendentals</span>
      </div>

      <div className="grid grid-cols-3 gap-4">

        <div className="col-span-2 space-y-4">
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-4">
          <div className="w-full h-56 bg-gray-100 dark:bg-navy-700 rounded-lg flex items-center justify-center mb-3">
            <span className="text-4xl">📚</span>
          </div>
          <div className="flex gap-2">
            {[1,2,3].map((i) => (
              <div 
               key={i}
               className={`w-14 h-12 rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center cursor-pointer text-lg border-2 ${
                i === 1
                ? 'border-navy-700 dark:border-white'
                : 'border-transparent'
               }`}
               >📚
               </div>
            ))}
            <div className="w-14 h-12 rounded-lg bg-gray-50 dark:bg-navy-700 border-2 border-dashed border-gray-200
            dark:border-white/10 flex items-center justify-center text-xs text-gray-400 cursor-pointer">
              +1
            </div>
          </div>
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
          <h1 className="text-lg font-bold text-navy-700 dark:text-white mb-1">
            Calculus - Early Transcendentals
            </h1>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-navy-700 dark:text-white">R280</span>
              <span className="text-sm text-gray-400">. negotiable</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3
              py-1 rounded-full font-medium">
                <IconCheck size={11} /> Like New
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                WTW114
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                First Year
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                University Of Pretoria
              </span>
            </div>
            
            <hr className="border-gray-100 dark:border-white/5 mb-4" />
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-2">Description</h3>
            <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed mb-4">
            Good condition with minor highlighting on pages 3-5. All pages intact, spine undamaged. Ideal for first year Calculus students at UP. Includes the original bookmark and a handwritten summary sheet for chapter 5.</p>
            <hr className="border-gray-100 dark:border-white/5 mb-4" />
            <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-2">Listing details</h3>
            <DetailRow label="Category" value="Textbook" />
            <DetailRow label="Condition"
            value={
              <span className="flex items-center gap-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                <IconStar size={10} className="fill-green-700" /> Good
              </span>
            }
            />
            <DetailRow label="Course code" value="WTW114"/>
            <DetailRow label="Listed on" value="7 May 2026" />
            <DetailRow label="Views" value="42" />
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
          <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-3">Seller reviews</h3>
          <ReviewRow
          initials="ZS"
          name="Zelamene S."
          stars={5}
          text="Item was exaclty as described. Seller was on time and very friendly at the meetup."
          date="3 May 2026" />
          <ReviewRow
          initials="SK"
          name="Sabira K."
          stars={4.5}
          text="Book was in good condition. Would buy from this seller again." 
          date="28 Apr 2026"/>
          </div>
        </div>
      </div>
    </div>
  )
}