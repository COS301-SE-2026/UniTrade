export type RiskLevel = 'low' | 'medium' | 'high'

const STYLES: Record<RiskLevel, { label: string; classes: string }> = {
    high: { label: 'High risk', classes: 'bg-rose-200 text-rose-800' },
    medium: { label: 'Medium risk', classes: 'bg-amber-100 text-amber-700' },
    low: { label: 'Low risk', classes: 'bg-emerald-100 text-emerald-700' },
}

const FALLBACK = { label: 'Unknown risk', classes: 'bg-gray-100 text-gray-600' }

export default function RiskBadge({ level }: { level: RiskLevel }) {
    const style = STYLES[level] ?? FALLBACK

    return (
        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-medium ${style.classes}`}>
            {style.label}
        </span>
    )
}