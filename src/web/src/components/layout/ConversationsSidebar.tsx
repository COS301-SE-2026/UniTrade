import {NavLink, useParams} from 'react-router-dom';
import { useReservationsList } from '../../hooks/useReservationsList';
import type { ReservationListItem } from '../../types/Reservations';



function relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.round(hours / 24);
    return `${days} d ago`;
}

export default function ConversationsSidebar ({role}: {role: 'buyer' | 'seller'}) {
    const {data: reservations = [], isLoading} = useReservationsList(role);
    const {reservationId: activeId} = useParams<{reservationId: string}>();

const active = reservations
    .filter((r: ReservationListItem) => r.reservationStatus === 'active')
    .filter((reservation, index, self) => 
        self.findIndex(r => r.reservationId === reservation.reservationId) === index
    )
    .sort((a,b) => {
        const aTime = new Date(a.lastMessageAt ?? a.createdAt).getTime();
        const bTime = new Date(b.lastMessageAt ?? b.createdAt).getTime();
        return bTime - aTime;
    })

    return (
        <div className = "w-72 shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
            <div className = "px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800 text-xl">
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
                    const hasUnread = r.unreadCount > 0;
                    const preview = r.lastMessagePreview ?? r.listing.title;
                    const timestamp = r.lastMessageAt ?? r.createdAt;

                    return (
                        <NavLink
                        key = {r.reservationId}
                        to={`/${role}/messages/${r.reservationId}`}
                        state={{
                            counterpartyName: r.counterParty.name,
                            counterpartyInitials: r.counterParty.initials,
                        }}
                        className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                            isActive ? 'bg-gray-200' : ''
                        }`}
                    >
                        <div className="w-9 h-9 rounded-full bg-[#003366]/10 flex items-center justify-center text-[#003366] text-xs font-bold shrink-0">
                        {r.counterParty.initials}
                        </div>
                        <div className = "flex-1 min-w-0">
                            <div className = "flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                    {r.counterParty.name}
                                </p>
                                <span className="shrink-0 text-[10px] text-gray-400">
                                    {relativeTime(timestamp)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                                <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                                    {preview}
                                </p>
                                {hasUnread && (
                                    <span className= "shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                                        {r.unreadCount > 99 ? '99+' : r.unreadCount}
                                    </span>
                                )}
                            </div>
                            
                        </div>
                    </NavLink>
                    )
                })}
            </div>
        </div>
    )

}
