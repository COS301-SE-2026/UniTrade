import { useMemo} from 'react'

import {formatPrice} from '../../utils/formatters'
import { useReservationsList } from '../../hooks/useReservationsList'


function SummaryCard({ label, value }: { label: string; value: string})
{
return(
    <div className="flex-1 bg-white rounded-xl border border-gray-200 py-4 px-6 text-center">
        <p className="text-2xl font-extrabold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
);
}


export default function Reservations()
{
   
    const {data: reservations = [], isLoading: loading, isError, error: queryError} = useReservationsList('seller');
   

        const summary = useMemo(() => {
            const activeItems = reservations.filter((r) => r.reservationStatus === 'active')
            const activeCount =activeItems.length
            const actionRequiredCount =activeItems.filter((r) => r.timerStage === 'awaiting_seller').length
            const totalValue = activeItems.reduce((sum,r) => sum + r.listing.price,0)   
                return{ activeCount, actionRequiredCount, totalValue }} , [reservations]
            )
                

            return (
                <div className="flex flex-col gap-6">
                    <h1 className="text-2xl font-extrabold text-gray-800 uppercase">
                        My Reserved Items</h1> 

                <div className="flex gap-4">
                    <SummaryCard label="Active reservations"
                    value={String(summary.activeCount)} />
                    <SummaryCard label="Action required" value={String(summary.actionRequiredCount)}/>

                <SummaryCard label="Pending reserved value"
                value={formatPrice(summary.totalValue)} />
                </div>
                <div className="flex flex-col gap-4">
                    {loading && <p className="text-sm text-gray-400">Loading reservations...</p>}

                     {!loading && reservations.length===0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                            <p className="text-sm font-semibold text-gray-700">No reservations found</p>
                            <p className="text-xs text-gray-400 mt-1">
                            </p>
                            </div>
                    )}
                    
                </div>

                </div>
            )
    }