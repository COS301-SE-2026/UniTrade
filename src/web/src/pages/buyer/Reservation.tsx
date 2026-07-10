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

function ReservationCard({ 
    reservation,
    onCancel,
}: {
    reservation: ReservationListItem
    onCancel: (id : string) => void
})
{
    const navigate = useNavigate()
    const [, forceTick] = useState(0)

    useEffect(()=> {
    const interval = setInterval(() => forceTick((t) => t + 1), 1000)
    return () =>clearInterval(interval)}, [])

    const msRemaining = getMsRemaining(reservation.expiresAt)
    const urgency = getUrgency(msRemaining)

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">

        <img src={reservation.listing.imagePath || '/placeholder.png'}
        alt={reservation.listing.title}
        className="w-20 h-20 rounded-lg object-cover flex shrink-0"
        />
        <div className ="flex-1 min-w-0">
            <div className="flex items-start justifiy-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                        {reservation.listing.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                    List by <span className="font-semibold text-gray-500">
                        {reservation.counterparty.name}
                    </span>
                    </p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-gray-400 uppercase track-wide">
                        Expires in
                    </p>
                    <div className ="mt-1">
                        <CountdownBadge msRemaining= {msRemaining} urgency={urgency} />
                        </div> 
                </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
                <StageTag stage={reservation.timerStage} />
                <span className="text-sm font-bold text-gray-800">
                {formatPrice(reservation.listing.price)}</span>
            </div>
            <div className="flex gap-2 mt-3">
                <button
                onClick={() => navigate(`/buyer/reservations/${reservation.reservationId}/pay`)}
                className="flex-1 py-2 bg-[#003366] text-white text-xs font-semibold rpunded-lg hover:bg-[#002244] transition colors">
                    Complete Payment
                </button>
                <button
                onClick={() => navigate(`/buyer/reservations/${reservation.reservationId}/messages`)}
                className="relative flex-1 py-2 border border-gray-300 text-gray-700 text xs font-semibold rounded-lg hover:bg-gray-50 transition colors">
                    Message seller
                
                    {reservation.unreadCount >0 && (
                        <span className="absolute -top-1.5 -right-1.5 flext items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                            {reservation.unreadCount}
                        </span>
                    )}   
                </button>
                <button
                onClick={() => onCancel(reservation.reservationId)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 text-xs
                font-semibold rounded-lg hpver:bg-gray-50 transition-colors" >
                    Cancel</button>  
                                </div>
        </div>
        </div>
    )

}
export default function Reservations()
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
                <div className="flex flex-col gap-4">
                    {loading && <p className="text-sm text-gray-400">Loading reservations...</p>}

                    {!loading && error && (
                        <div className="bg-white rounded-xl border border-rose-200 p-6 text-center">
                            <p className="text-sm font-semibold text-rose-600">{error}</p>
                            </div>
                    )}
                     {!loading && !error && reservations.length===0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                            <p className="text-sm font-semibold text-gray-700">No Acive reservations</p>
                            <p className="text-xs text-gray-400 mt-1">
                            </p>
                            </div>
                    )}
                    {reservations.map((reservation) => (
                        <ReservationCard key ={reservation.reservationId}
                        reservation={reservation} onCancel={handleCancel} />
                    ))}
                </div>

                </div>
            )
    }
