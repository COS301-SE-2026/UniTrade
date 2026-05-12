import { useNavigate } from 'react-router-dom'
import {
  IconClock,
  IconAlertTriangle,
  IconFlag,
  IconTrendingUp,
  IconCheck,
  IconX,
} from '@tabler/icons-react'


interface StatCardProps {
  title: string
  value: number | string
  sub: string
  subColor?: string
  subIcon?: React.ReactNode
}

function StatCard({ title, value, sub, subColor = 'text-gray-500', subIcon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="bg-navy-700 px-4 py-2">
        <p className="text-white font-semibold text-sm">{title}</p>
      </div>
      <div className="px-4 py-4">
        <p className="text-3xl font-bold text-navy-700 dark:text-white">{value}</p>
        <div className={`flex items-center gap-1 mt-1 text-xs ${subColor}`}>
          {subIcon}
          <span>{sub}</span>
        </div>
      </div>
    </div>
  )
}

function RiskPill ({ level }: { level: 'High Risk' | 'Med Risk' }) {
    return (
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
            level === 'High Risk'
            ? 'bg-red-100 text-red-700'
            : 'bg-amber-100 text-amber-700'
          }`}
          >
            {level}
          </span>
    )
}

interface ListingRowProps {
    title: string
    meta: string
    risk: 'High Risk' | 'Med Risk'
}

function ListingRow({ title, meta, risk }: ListingRowProps) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-navy-700 flex-shrink-0 overflow-hidden">
        <img
          src={`https://placehold.co/48x48/e8eef5/b0bcd4?text=📚`}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{meta}</p>
      </div>
      <RiskPill level={risk} />
      <button className="bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">
        Approve
      </button>
      <button className="bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">
        Reject
      </button>
    </div>
  )
}


interface VerificationRowProps {
    initials: string
    name: string
    meta: string
}

function VerificationRow({ initials, name, meta }: VerificationRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy-700 dark:text-white">{name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{meta}</p>
      </div>
      <button className="bg-navy-700 hover:bg-navy-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors">
        Approve
      </button>
      <button className="border border-navy-700 text-navy-700 dark:text-white dark:border-white/30 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
        Reject
      </button>
    </div>
  )
}

interface DisputeRowProps {
  title: string
  meta: string
}

function DisputeRow({ title, meta }: DisputeRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-navy-700 flex-shrink-0 overflow-hidden">
        <img
          src={`https://placehold.co/48x48/e8eef5/b0bcd4?text=📦`}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{meta}</p>
      </div>
      <button className="bg-navy-700 hover:bg-navy-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors">
        Review
      </button>
    </div>
  )
}

