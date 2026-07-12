import {NavLink, useParams} from 'react-router-dom';
import { useReservationsList } from '../../hooks/useReservationsList';
import type { ReservationListItem } from '../../types/Reservations';

const stageLabel: Record<string, string> = {
    awaiting_seller: 'Waiting on seller',
    awaiting_buyer: 'Your turn',
    coordinating: 'Coordinating pickup',
};

export default function ConversationsSidebar ({role}: {role: 'buyer' | 'seller'}) {
    const {data: reservations = [], isLoading} = useReservationsList(role);
    const {reservationId: activeId} = useParams<{reservationId: string}>();

    const active = reservations.filter((r: ReservationListItem) => r.reservationStatus === 'active');

    return (
        <div className = "w-72 shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
            <div className = "px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">
                    Messages
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoading && (
                    <p className="text-xs text-gray-400 px-4 py-3">
                        Loading conversations...
                    </p>
                )}

                {!isLoading && active.length === 0 && (
                    <p className="text-xs text-gray-400 px-4 py-3">
                        No active conversations
                    </p>
                )}

                {active.map((r: ReservationListItem) => {
                    const isActive = r.reservationId === activeId;
                    return (
                        <NavLink
                        key = {r.reservationId}
                        to={`/${role}/messages/${r.reservationId}`}
                        className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover: bg-gray-50 transition-colors ${
                            isActive ? 'bg-gray-50' : ''
                        }`}
                    >
                        <div className="w-9 h-9 rounded-full bg-[#003366]/10 flex items-center justify-center text-[#003366] text-xs font-bold shrink-0">
                        {r.counterParty.initials}
                        </div>
                        <div className = "flex-1 min-w-0">
                            <div className = "flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-8-- truncate">
                                    {r.counterParty.name}
                                </p>
                                {r.unreadCount > 0 && (
                                    <span className= "shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                                        {r.unreadCount > 99 ? '99+' : r.unreadCount}
                                    </span>
                                )}
                            </div>
                            <p className = "text-xs text-gray-400 truncate">
                                {r.listing.title}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                {stageLabel[r.timerStage] ?? r.timerStage}
                            </p>
                        </div>
                    </NavLink>
                    )
                })}
            </div>
        </div>
    )

}