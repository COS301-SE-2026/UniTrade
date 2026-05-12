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