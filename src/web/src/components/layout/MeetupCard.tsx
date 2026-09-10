import {
    IconMapPin,
    IconCalendar,
    IconCheck,
    IconX
} from '@tabler/icons-react';
import type { MeetupStatus } from '../../types/meetup';

interface MeetupCardProps {
    location: string;
    time: string;
    status: MeetupStatus;
    isOwnMessage: boolean;
    caption?: string;
    onAccept?: () => void;
    onDecline?: () => void;
    onCheckIn?: () => void;
    isResponding?: boolean;
    checkInDisabled?: boolean;
    checkInMessage?: string;

}


const STATUS_STYLES: Record<MeetupStatus, { bg: string; label: string }> = {
    pending: { bg: 'bg-[#003366]', label: 'Meetup Proposal' },
    accepted: { bg: 'bg-[#003366]', label: 'Meetup Confirmed' },
    declined: { bg: 'bg-gray-400', label: 'Meetup Declined' },
};

export default function MeetupCard({
    location,
    time,
    status,
    isOwnMessage,
    caption,
    onAccept,
    onDecline,
    onCheckIn,
    isResponding,
    checkInDisabled,
    checkInMessage
}: Readonly<MeetupCardProps>) {
    const date = new Date(time);
    const { bg, label } = STATUS_STYLES[status];

    return (
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} gap-1.5`}>
            {caption &&
                <span className="text-xs text-gray-400 px-1">
                    {caption}
                </span>}
            <div className={`w-full max-w-[280px] ${bg} text-white rounded-2xl overflow-hidden shadow`}>
                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="uppercase text-[10px] tracking-widest font-semibold text-white/70">
                            {label}
                        </span>
                        {status === 'accepted' && <IconCheck size={16} />}
                        {status === 'declined' && <IconX size={16} />}
                    </div>
                    <div className="flex gap-3">
                        <IconMapPin size={18} className="mt-0.5 shrink-0" />
                        <p className="font-medium">
                            {location}
                        </p>
                    </div>
                    <div className="flex gap-3 mt-3">
                        <IconCalendar size={18} className="mt-0.5 shrink-0" />
                        <p>
                            {date.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' })} . {' '}
                            {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                {status === 'pending' && (
                    <div className="border-t border-white/20 flex text-sm font-medium">
                        {isOwnMessage ? (
                            <div className="flex-1 py-3 px-4 text-left text-white/70">
                                Waiting for response...
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={onDecline}
                                    disabled={isResponding}
                                    className="flex-1 py-3 hover:bg-white/10 transition-colors text-white/70"
                                >
                                    {isResponding ? '...' : 'Decline'}
                                </button>
                                <div className="w-px bg-white/20" />
                                <button
                                    type="button"
                                    onClick={onAccept}
                                    disabled={isResponding}
                                    className="flex-1 py-3 hover:bg-white/10 transition-colors font-semibold"
                                >
                                    {isResponding ? '...' : 'Accept'}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {status === 'accepted' && (onCheckIn || checkInDisabled) && (
                    <div className="border-t border-white/20 flex text-sm font-medium">
                        {
                            onCheckIn && !checkInDisabled ? (
                                <button
                                    type="button"
                                    onClick={onCheckIn}
                                    className="flex-1 py-3 hover:bg-white/10 transition-colors font-semibold flex items-center justify-center gap-2"
                                >
                                    <IconMapPin size={16} />
                                    I'M HERE
                                </button>
                            ) : (
                                <div className='flex-1 py-3 text-center text-white/70 text-xs'>
                                    {checkInMessage || 'Check-in unavailable'}

                                </div>
                            )
                        }

                    </div>
                )}
            </div>
        </div>
    );
}