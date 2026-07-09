import { useEffect, useMemo, useState } from 'react'
import {useNavigate } from 'react-router-dom'
import { getReservations, cancelReservation } from '../../services/reservationService'
import type { ReservationListItem, TimerStage } from '../../types/Reservations'
import {formatPrice} from '../../utils/formatters'
import { IconClock } from '@tabler/icons-react'
type UrgencyLevel = 'normal' | 'expiring'

function getMsRemaining(expiresAt: string): number{
    return new Date(expiresAt).getTime() - Date.now()
}

function getUrgency(msRemaining: number): UrgencyLevel
{
    return msRemaining <=60*60*1000 ? 'expiring':'normal'
}

function formatCountdown(msRemaining: number): string {
    if (msRemaining<=0) return 'Expired'
       const totalSecs = Math.floor(msRemaining/1000)
       const hours = Math.floor(totalSecs/3600)
       const minutes = Math.floor((totalSecs%3600)/60)
       const seconds = totalSecs% 60

       const pad=(n: number) => n.toString().padStart(2, '0')
       if(hours>0)
       {
        return `${hours} hrs ${pad(minutes)} mins ${pad(seconds)} sec`
       }

       return `${pad(minutes)} mins ${pad(seconds)} sec` 
}

const stageMeta: Record<TimerStage, { label: string; className: string}> = {
    awaiting_seller: {label: 'Waiting on seller', className: 'bg-sky-100 text-sky-700' },
    awaiting_buyer:{label: 'Buyer turn',className: 'bg-sky-100 text-sky-700' },
    coordinating: { label: 'Coordination pickup',className: 'bg-emerald-100 text-emerald-700' },
}

function SummaryCard({ label, value }: { label: string; value: string})
{
return(
    <div className="flex-1 bg-white rounded-xl border border-gray-200 py-4 px-6 text-center">
        <p className="text-2xl font-extrabold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
)
}

function StageTag({stage }: {stage: TimerStage}){
    const meta =stageMeta[stage] ?? {label: stage, className: 'bg-gray-100 text-gray-600'}
    return(
        <span className={
            `text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.className}`}>
                {meta.label}
            </span>)
        }

function CountdownBadge({ msRemaining, urgency }: {msRemaining: number; urgency: UrgencyLevel }
){
    const style = urgency === 'expiring' ? 'bg-rose-50 text-rose 600 border border-rose-200'
: 'bg-sky-50 text-sky-700 border border-sky-200'
return(
    <div className={`flex itens-center gap-1 text-xs font-semibold px-3 py-1 roundedlg ${style}`}>
        <IconClock size={14} />
        {formatCountdown(msRemaining)}
    </div>
)
}


export default function SellerReservations()
{
const [reservations, setReservations] = useState<ReservationListItem[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
    getReservations({ role: 'buyer' }).then((result) =>{
        if (result.success)
        {
            setReservations(result.data.items.filter((r) => r.reservationStatus === 'active'))
        }else {
            setError(result.error.message ?? 'Could not load your reservations.')}
        }).finally(() => setLoading(false))}
        , [])

        const handleCancel = async (reservationId: string) => {
            const previous = reservations
            setReservations((prev) => prev.filter((r)=> r.reservationId !== reservationId))
            const result = await cancelReservation(reservationId)
            if (!result.success){
                setReservations(previous)
        }
        }

        const summary = useMemo(() => {
            const activeCount = reservations.length
            const expiringCount =  reservations.filter(
                (r) => getUrgency(getMsRemaining(r.expiresAt)) == 'expiring').length
                const totalValue = reservations.reduce((sum, r) => sum + r.listing.price, 0)

                return{ activeCount, expiringCount, totalValue }} , [reservations]
            )

            return (
                <div className="flex flex-col gap-6">
                    <h1 className="text-2xl font extrabold text-gray-800 uppercase">
                        My Reservations</h1> 

                <div className="flex gap-4">
                    <SummaryCard label="Active reservations"
                    value={String(summary.activeCount)} />
                    <SummaryCard label="Expiring soon" value={String(summary.expiringCount)}/>

                <SummaryCard label="Total reserved value"
                value={formatPrice(summary.totalValue)} />
                </div>
 

                </div>
            )
    }
