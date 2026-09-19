export type RiskReason = string | { code: string; detail?: string }

const LABELS: Record<string, string> = {
    price_anomaly: 'Price anomaly',
    duplicate_image: 'Duplicate image',
    description_quality: 'Weak description',
    seller_history: 'Seller history',
    low_image_match: 'Image mismatch',
}

function labelFor(code: string) {
    if (LABELS[code]) return LABELS[code]
    const spaced = code.replace(/_/g, ' ').trim()
    return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : 'Other signal'
}

export default function RiskReasons({ reasons }: { reasons: RiskReason[] }) {
    if (!reasons || reasons.length === 0) {
        return <span className="text-[10px] text-gray-500">No reasons recorded</span>
    }

    return (
        <ul className="space-y-1">
            {reasons.map((reason, i) => {
                const code = typeof reason === 'string' ? reason : reason.code
                const detail = typeof reason === 'string' ? undefined : reason.detail

                return (
                    <li key={`${code}-${i}`} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-sky-100 text-sky-700">
                            {labelFor(code)}
                        </span>
                        {detail && <span className="text-[10px] text-gray-600">{detail}</span>}
                    </li>
                )
            })}
        </ul>
    )
}