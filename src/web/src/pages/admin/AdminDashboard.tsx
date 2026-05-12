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

// ── Risk Pill ───────────────────────────────────────────────
function RiskPill({ level }: { level: 'High Risk' | 'Med Risk' }) {
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

