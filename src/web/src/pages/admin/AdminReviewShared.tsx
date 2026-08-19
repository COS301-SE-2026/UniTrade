import {
    IconStar,
    IconStarFilled,
} from '@tabler/icons-react'
import type {PersonSummary} from '../../types/mockAdmin'


export function Breadcrumb({trail}: Readonly<{ trail: string[]}>) {
    return (
        <p className = "text-sm text-gray-400">
            {trail.map((step, i) => (
                <span key = {step}>
                    {i === trail.length - 1 ? (
                        <span className = "text-navy-700 dark:text-white font-medium">
                            {step}
                        </span>
                    ) : (
                        <span className = "text-[#00aaff]">
                            {step}
                        </span>
                    )}
                    {i < trail.length - 1 && < span className = "mx-1.5 text-gray-300">
                      </span>
                    }
                </span>
            ))}
        </p>
    )
}


export function Panel({ title, children, className = '' }: Readonly<{ title: string; children: React.ReactNode; className?: string }>) {
  return (
    <div className={`bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-navy-700 dark:text-white mb-3">
        {title}
      </h2>
      {children}
    </div>
  )
}

export function InfoRow({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-gray-400">
        {label}
      </span>
      <span className="text-navy-700 dark:text-white font-medium text-right">{value}</span>
    </div>
  )
}

type StatusTone = 'blue' | 'red' | 'green' | 'amber' | 'gray'

const toneClasses: Record<StatusTone, string> = {
  blue: 'bg-[#00aaff]/10 text-[#00aaff]',
  red: 'bg-red-100 text-red-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  gray: 'bg-gray-100 text-gray-600',
}


export function StatusBadge({ label, tone = 'gray' }: Readonly<{ label: string; tone?: StatusTone }>) {
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${toneClasses[tone]}`}>
      {label}
    </span>
  )
}


export function StarRating({ value, size = 16 }: Readonly<{ value: number; size?: number }>) {
  const rounded = Math.round(value)
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) =>
        i < rounded ? (
          <IconStarFilled key={i} size={size} className="text-amber-400" />
        ) : (
          <IconStar key={i} size={size} className="text-gray-300" />
        )
      )}
    </div>
  )
}

export function PersonCard({
  title,
  person,
}: Readonly<{ title: string; person: PersonSummary }>) {
  return (
    <Panel title={title}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {person.initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">
            {person.name}
          </p>
          <p className="text-xs text-gray-400">
            {person.faculty}
          </p>
          <div className="mt-1">
            <StarRating value={person.reviewAverage} size={13} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
        <span className="text-xs text-gray-400">Reputation Score</span>
        <span className="text-xs font-semibold text-navy-700 dark:text-white">
            {person.reputationScore}%
        </span>
      </div>
    </Panel>
  )
}

export function OutlineButton({
  children,
  onClick,
  className = '',
}: Readonly<{ children: React.ReactNode; onClick?: () => void; className?: string }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border border-gray-200 dark:border-white/10 text-navy-700 dark:text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left ${className}`}
    >
      {children}
    </button>
  )
}

export function PrimaryButton({
  children,
  onClick,
  className = '',
}: Readonly<{ children: React.ReactNode; onClick?: () => void; className?: string }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors ${className}`}
    >
      {children}
    </button>
  )
}

type DecisionTone = 'success' | 'danger' | 'neutral'

const decisionToneClasses: Record<DecisionTone, string> = {
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  neutral: 'border border-navy-700 text-navy-700 dark:text-white dark:border-white/30 hover:bg-gray-50 dark:hover:bg-white/5',
}

export function DecisionButton({
  children,
  tone = 'neutral',
  onClick,
  disabled,
}: Readonly<{ children: React.ReactNode; tone?: DecisionTone; onClick?: () => void; disabled?: boolean }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${decisionToneClasses[tone]}`}
    >
      {children}
    </button>
  )
}

export function NotesPanel({caseId }: Readonly<caseId: string}>) {
  const [notes, setNotes] = useState<CaseNote[]>([])
  
}


