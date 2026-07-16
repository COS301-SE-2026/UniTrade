import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    IconSend,
    IconCheck,
    IconPaperclip,
} from '@tabler/icons-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useReservationRealtime } from '../../hooks/useReservationRealtime';
import { useSendMessage } from '../../hooks/useSendMessage';
import type { ClientChatMessage } from '../../types/chat';
import { connectionManager } from '../../services/realtime/connectionManager';
import { getReservationById } from '../../services/reservationService';
import { listingsService } from '../../services/listingsService';
import type { ConnectionState } from '../../types/hubConnection';
import MeetupCard from '../../components/layout/MeetupCard';
import MeetupProposalForm from '../../components/layout/MeetupProposalForm';
import { combineDateAndTime, type MeetupFormValues, type MeetupStatus } from '../../types/meetup';
import CheckInModal from '../../components/CheckInModal';




function connectionStatusLabel(state: ConnectionState): string {
    switch (state) {
        case 'Connected':
            return 'online';
        case 'Reconnecting':
            return 'reconnecting…';
        default:
            return 'offline';
    }
}

function initialsFromName(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function formatDateDivider(iso: string): string {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';
    return date.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

const DateDivider: React.FC<{ label: string }> = ({ label }) => (
    <div className="flex justify-center py-4">
        <span className="bg-white text-xs font-medium text-gray-500 px-4 py-1 rounded-full shadow-sm">
            {label}
        </span>
    </div>
);

const Avatar: React.FC<{ initials: string }> = ({ initials }) => (
    <div className="shrink-0 w-7 h-7 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-sm">
        {initials}
    </div>
);


const TextMessageBubble: React.FC<{
    message: Extract<ClientChatMessage, { messageType: 'text' }>;
    isOwnMessage: boolean;
    counterpartyInitials: string;
    onRetry?: () => void;
}> = ({ message, isOwnMessage, counterpartyInitials, onRetry }) => {
    const time = new Date(message.sentAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            {!isOwnMessage && <Avatar initials={counterpartyInitials} />}

            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                <div
                    className={`px-4 py-2.5 text-[15px] leading-relaxed shadow-sm rounded-3xl ${isOwnMessage
                        ? 'bg-[#003366] text-white rounded-br-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                        }`}
                >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                <div className="mt-1 px-1 flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span>{time}</span>
                    {isOwnMessage && (
                        <>
                            {message.status === 'sending' && <span className="italic">sending...</span>}
                            {message.status === 'failed' && (
                                <button onClick={onRetry} className="text-red-500 underline">
                                    failed • retry
                                </button>
                            )}
                            {(!message.status || message.status === 'sent') && (
                                message.readAt ?
                                    <IconCheck size={13} className="text-sky-400" /> :
                                    <IconCheck size={13} className="text-gray-300" />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const SystemMessageBubble: React.FC<{
    message: Extract<ClientChatMessage, { messageType: 'system' }>;
}> = ({ message }) => (
    <div className="flex justify-center py-2">
        <span className="bg-gray-100 text-gray-500 text-xs px-4 py-1 rounded-full">
            {message.content}
        </span>
    </div>
);

/*const MeetupProposalCard: React.FC<{
    message: Extract<ClientChatMessage, { messageType: 'meetup_proposal' }>;
    isOwnMessage: boolean;
}> = ({ message, isOwnMessage }) => {
    const { proposedLocation, proposedTime } = message.payload;
    const date = new Date(proposedTime);

    return (
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} gap-1.5`}>
            <span className="text-xs text-gray-400 px-1">{message.content}</span>
            <div className="w-full max-w-[280px] bg-[#003366] text-white rounded-2xl overflow-hidden shadow">
                <div className="p-4">
                    <div className="uppercase text-[10px] tracking-widest font-semibold text-white/70 mb-3">
                        Meetup Proposal
                    </div>
                    <div className="flex gap-3">
                        <IconMapPin size={18} className="mt-0.5" />
                        <p className="font-medium">{proposedLocation}</p>
                    </div>
                    <div className="flex gap-3 mt-3">
                        <IconCalendar size={18} className="mt-0.5" />
                        <p>
                            {date.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' })} •{' '}
                            {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                <div className="border-t border-white/20 flex text-sm font-medium">
                    <button type="button" disabled className="flex-1 py-3 hover:bg-white/10 transition-colors text-white/70">Decline</button>
                    <div className="w-px bg-white/20" />
                    <button type="button" disabled className="flex-1 py-3 hover:bg-white/10 transition-colors">Accept</button>
                </div>
            </div>
        </div>
    );
};
*/

const MeetupResponseBubble: React.FC<{
    message: Extract<ClientChatMessage, { messageType: 'meetup_response' }>;
}> = ({ message }) => (
    <div className="flex justify-center py-2">
        <span className={`text-xs font-semibold px-5 py-1.5 rounded-full ${message.payload.accepted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
            {message.content}
        </span>
    </div>
);

function MessageBubble({
    message,
    currentUserId,
    counterpartyInitials,
    onRetry,
    meetupOverrides,
    respondingKey,
    onRespondMeetup,
    onCheckIn,
}: {
    message: ClientChatMessage;
    currentUserId: string;
    counterpartyInitials: string;
    onRetry: (clientId: string, content: string) => void;
    meetupOverrides: Record<string, MeetupStatus>;
    respondingKey: string | null;
    onRespondMeetup : (key: string, status: MeetupStatus) => void;
    onCheckIn: (location: string) => void;
}) {
    const isOwnMessage = message.senderId === currentUserId;

    switch (message.messageType) {
        case 'text':
            return (
                <TextMessageBubble
                    message={message}
                    isOwnMessage={isOwnMessage}
                    counterpartyInitials={counterpartyInitials}
                    onRetry={() => onRetry(message.clientId!, message.content)}
                />
            );
        case 'system':
            return <SystemMessageBubble message={message} />;
        case 'meetup_proposal': {
            const key =  String(message.clientId ?? message.messageId ?? '');
            const serverStatus = (message.payload as {status?: MeetupStatus}).status ?? 'pending';
            const status = meetupOverrides[key] ?? serverStatus;
            const location = message.payload.proposedLocation;

            return (
                <MeetupCard
                location={location}
                time = {message.payload.proposedTime}
                status = {status}
                isOwnMessage={isOwnMessage}
                caption = {message.content}
                isResponding = {respondingKey === key}
                onAccept={() => onRespondMeetup(key, 'accepted')}
                onDecline={() => onRespondMeetup(key, 'declined')}
                onCheckIn={status === 'accepted' ? () => onCheckIn(location) : undefined}
                />
            );
        }
        case 'meetup_response':
            return <MeetupResponseBubble message={message} />;
        default:
            return <div className="text-center text-xs text-gray-400 py-2">Unsupported message</div>;
    }
}

interface ChatLocationState {
    counterpartyName?: string;
    counterpartyInitials?: string;
}

export default function ChatPage() {
    const navigate = useNavigate();
    const { reservationId } = useParams<{ reservationId: string }>();
    const location = useLocation();
    const { user } = useAuthStore();
    const isSeller = window.location.pathname.startsWith('/seller');
    const currentUserId = user?.id ?? 'me';

    const { data: messages = [], isLoading, isError } = useChatMessages(reservationId!);
    useReservationRealtime(reservationId!);
    const { mutate: send, retry } = useSendMessage(reservationId!);

    const sortedMessages = React.useMemo(
        () => [...messages].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()),
        [messages]
    );


    const { data: reservation } = useQuery({
        queryKey: ['reservation', reservationId],
        queryFn: async () => {
            const result = await getReservationById(reservationId!);
            if (!result.success) throw new Error(result.error.message ?? 'Failed to load reservation');
            return result.data;
        },
        enabled: !!reservationId,
    });



    const { data: listing } = useQuery({
        queryKey: ['listing', reservation?.listingId],
        queryFn: () => listingsService.getById(reservation!.listingId),
        enabled: !!reservation?.listingId,
    });

    const locationState = location.state as ChatLocationState | null;
    const counterpartyName = locationState?.counterpartyName ?? reservation?.counterParty?.name ?? 'Conversation!!!!';
    const counterpartyInitials = locationState?.counterpartyInitials ?? reservation?.counterParty?.initials ?? initialsFromName(counterpartyName);

    const [connectionState, setConnectionState] = useState<ConnectionState>(connectionManager.getState());
    useEffect(() => connectionManager.onStateChange(setConnectionState), []);

    const [draft, setDraft] = useState('');
    const [isProposingMeetup, setIsProposingMeetup] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [meetupOverrides, setMeetupOverrides] = useState<Record<string, MeetupStatus>>({});
    const [respondingKey, setRespondingKey] = useState<string | null>(null);
    const [checkInLocation, setCheckInLocation] = useState<string | null>(null);


    const handleProposeMeetup = (values: MeetupFormValues) => {
        const proposedTime = combineDateAndTime(values.date, values.time);

        console.log('Meetup proposal submitted:', {
            proposedLocation: values.location,
            proposedTime,
        });
        setIsProposingMeetup(false);
    };

    const handleRespondMeetup = (key: string, status: MeetupStatus) => {
        setRespondingKey(key)
        setTimeout(() => {
            setMeetupOverrides((prev) => ({...prev, [key]: status}));
            setRespondingKey(null);
        }, 500);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [sortedMessages]);

    useEffect(() => {
        if (!reservationId || sortedMessages.length === 0) return;
        const readable = sortedMessages.filter(m => m.status !== 'sending' && m.status !== 'failed');
        if (readable.length === 0) return;
        const last = readable[readable.length - 1];
        if (last.messageId) {
            connectionManager.markRead(reservationId, last.messageId).catch(() => { });
        }
    }, [reservationId, sortedMessages]);

    const handleSend = () => {
        if (!draft.trim()) return;
        send(draft.trim());
        setDraft('');
        inputRef.current?.focus();
    };

    if (!reservationId) return <div className="p-8 text-center">No reservation specified.</div>;

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">

            <div className="px-5 py-4 border-b flex items-center gap-3 shrink-0">
                <Avatar initials={counterpartyInitials} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{counterpartyName}</p>
                        <span className="text-xs text-emerald-600 shrink-0">
                            {connectionStatusLabel(connectionState)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#f8f9fa] space-y-4">
                {listing && (
                    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-3 flex gap-3 items-center mb-2">
                        {listing.images?.[0]?.url && (
                            <img
                                src={listing.images[0].url}
                                alt={listing.title}
                                className="w-16 h-16 rounded-xl object-cover shrink-0"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-[#003366] uppercase tracking-wider">
                                    Listing
                                </span>
                                <span className="text-[10px] text-gray-400">•</span>
                                <span className="text-xs text-gray-500 truncate">{listing.title}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">R {listing.price}</p>
                        </div>
                        <button
                            onClick={() => navigate(
                                isSeller
                                    ? `/seller/reservations/${reservationId}`
                                    : `/buyer/reservations/${reservationId}`
                            )}
                            className="bg-[#003366] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#002244] transition-colors shrink-0"
                        >
                            View
                        </button>
                    </div>
                )}

                {isLoading && <p className="text-center text-gray-400">Loading messages...</p>}
                {isError && <p className="text-center text-red-500">Failed to load messages</p>}

                {sortedMessages.map((msg, i) => {
                    const prev = sortedMessages[i - 1];
                    const showDivider = !prev || formatDateDivider(prev.sentAt) !== formatDateDivider(msg.sentAt);
                    return (
                        <React.Fragment key={msg.clientId ?? msg.messageId}>
                            {showDivider && <DateDivider label={formatDateDivider(msg.sentAt)} />}
                            <MessageBubble
                                message={msg}
                                currentUserId={currentUserId}
                                counterpartyInitials={counterpartyInitials}
                                onRetry={retry}
                                meetupOverrides={meetupOverrides}
                                respondingKey={respondingKey}
                                onRespondMeetup={handleRespondMeetup}
                                onCheckIn={setCheckInLocation}
                            />
                        </React.Fragment>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="px-4 pb-2 pt-1 border-t bg-white shrink-0">
                <button
                    type="button"
                    onClick = {() => setIsProposingMeetup(true)}
                    className="w-full py-3 bg-[#003366] text-white font-bold text-sm tracking-widest rounded-2xl hover:bg-[#002244] transition-colors disabled:opacity-60"
                >
                    SCHEDULE A MEETUP
                </button>
            </div>

            {isProposingMeetup && (
                <MeetupProposalForm
                onCancel={() => setIsProposingMeetup(false)}
                onSubmit={handleProposeMeetup}
                />
            )}

            {checkInLocation && (
                <CheckInModal
                meetupLocation={checkInLocation}
                onClose={() => setCheckInLocation(null)}
                />
            )}

            <div className="p-4 border-t bg-white flex items-center gap-3 shrink-0">
                <button type="button" className="text-gray-400 p-1">
                    <IconPaperclip size={22} />
                </button>
                <input
                    ref={inputRef}
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-100 rounded-3xl px-5 py-3 text-sm focus:outline-none focus:border-[#003366]/30 border border-transparent"
                />
                <button
                    onClick={handleSend}
                    disabled={!draft.trim()}
                    className="w-11 h-11 bg-[#003366] disabled:bg-gray-300 text-white rounded-2xl flex items-center justify-center hover:bg-[#002244] transition-colors"
                >
                    <IconSend size={18} />
                </button>
            </div>
        </div>
    );
}