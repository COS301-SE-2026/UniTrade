import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    IconSend,
    IconCheck,
    //IconMapPin,
    //IconCalendar,
    IconPaperclip,
    IconArrowLeft,
    IconEye,
} from '@tabler/icons-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useReservationRealtime } from '../../hooks/useReservationRealtime';
import { useSendMessage } from '../../hooks/useSendMessage';
import type { ClientChatMessage } from '../../types/chat';
import { connectionManager } from '../../services/realtime/connectionManager';
import { getReservationById } from '../../services/reservationService';
import { listingsService } from '../../services/listingsService';
import type { MeetupStatus } from '../../types/meetup';
import { combineDateAndTime, type MeetupFormValues } from '../../types/meetup';
import { queryKeys } from '../../lib/queryKeys';
import MeetupProposalForm from '../../components/layout/MeetupProposalForm';
import CheckInModal from '../../components/CheckInModal';
import MeetupCard from '../../components/layout/MeetupCard';
import type { MeetupProposalPayload } from '../../types/Reservations';
import { LoadingState } from '../../components/layout/Spinner';


function initialsFromName(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
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

    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";
    return date.toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
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
    message: Extract<ClientChatMessage, { messageType: "text" }>;
    isOwnMessage: boolean;
    counterpartyInitials: string;
    onRetry?: () => void;
}> = ({ message, isOwnMessage, counterpartyInitials, onRetry }) => {
    const time = new Date(message.sentAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div
            className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
        >
            {!isOwnMessage && <Avatar initials={counterpartyInitials} />}

            <div
                className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[70%]`}
            >
                <div
                    className={`px-4 py-2.5 text-[15px] leading-relaxed shadow-sm rounded-3xl ${isOwnMessage
                        ? "bg-[#003366] text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                        }`}
                >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                <div className="mt-1 px-1 flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span>{time}</span>
                    {isOwnMessage && (
                        <>
                            {message.status === "sending" && (
                                <span className="italic">sending...</span>
                            )}
                            {message.status === "failed" && (
                                <button onClick={onRetry} className="text-red-500 underline">
                                    failed. Please retry.
                                </button>
                            )}
                            {(!message.status || message.status === "sent") &&
                                (message.readAt ? (
                                    <IconCheck size={13} className="text-sky-400" />
                                ) : (
                                    <IconCheck size={13} className="text-gray-300" />
                                ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const SystemMessageBubble: React.FC<{
    message: Extract<ClientChatMessage, { messageType: "system" }>;
}> = ({ message }) => (
    <div className="flex justify-center py-2">
        <span className="bg-gray-100 text-gray-500 text-xs px-4 py-1 rounded-full">
            {message.content}
        </span>
    </div>
);

const MeetupResponseBubble: React.FC<{
    message: Extract<ClientChatMessage, { messageType: "meetup_response" }>;
}> = ({ message }) => (
    <div className="flex justify-center py-2">
        <span
            className={`text-xs font-semibold px-5 py-1.5 rounded-full ${message.payload.Accepted
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
                }`}
        >
            {message.content}
        </span>
    </div>
);

function MessageBubble({
    message,
    currentUserId,
    counterpartyInitials,
    onRetry,
    proposalStatusMap,
    respondingKey,
    onRespondMeetup,
    onCheckIn,
}: {
    message: ClientChatMessage;
    currentUserId: string;
    counterpartyInitials: string;
    onRetry: (clientId: string, content: string) => void;
    proposalStatusMap: Record<string, MeetupStatus>;
    respondingKey: string | null;
    onRespondMeetup: (proposalMessageId: number, status: MeetupStatus) => void;
    onCheckIn: (location: string) => void;
}) {
    const isOwnMessage = message.senderId === currentUserId;

    switch (message.messageType) {
        case "text":
            return (
                <TextMessageBubble
                    message={message}
                    isOwnMessage={isOwnMessage}
                    counterpartyInitials={counterpartyInitials}
                    onRetry={() => onRetry(message.clientId!, message.content)}
                />
            );
        case "system":
            return <SystemMessageBubble message={message} />;
        case "meetup_proposal": {
            const key = message.messageId?.toString() ?? message.clientId ?? "";
            const status = proposalStatusMap[key] ?? "pending";
            const payload = message.payload as MeetupProposalPayload;
            const location = payload.LocationName || payload.proposedLocation || "";
            const proposedTime = payload.ProposedTime || payload.proposedTime || "";
            const proposalMessageId = message.messageId;

            return (
                <MeetupCard
                    location={location}
                    time={proposedTime}
                    status={status}
                    isOwnMessage={isOwnMessage}
                    caption={message.content}
                    isResponding={respondingKey === key}
                    onAccept={() => {
                        if (proposalMessageId) {
                            onRespondMeetup(proposalMessageId, "accepted");
                        }
                    }}
                    onDecline={() => {
                        if (proposalMessageId) {
                            onRespondMeetup(proposalMessageId, "declined");
                        }
                    }}
                    onCheckIn={
                        status === "accepted" ? () => onCheckIn(location) : undefined
                    }
                />
            );
        }
        case "meetup_response":
            return <MeetupResponseBubble message={message} />;
        default:
            return null;
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
    const queryClient = useQueryClient();

    const currentUserId = user?.id ?? "me";

    const {
        data: messages = [],
        isLoading,
        isError, refetch,
    } = useChatMessages(reservationId!);
    useReservationRealtime(reservationId!);
    const { send, retry } = useSendMessage(reservationId!);

    const sortedMessages = React.useMemo(
        () =>
            [...messages].sort(
                (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
            ),
        [messages],
    );

    const proposalStatusMap = React.useMemo(() => {
        const map: Record<string, MeetupStatus> = {};

        for (const msg of sortedMessages) {

            if (msg.messageType === 'meetup_proposal') {
                const key = msg.messageId?.toString() ?? msg.clientId ?? '';
                map[key] = 'pending';

            }
        } for (const msg of sortedMessages) {
            if (msg.messageType === 'meetup_response' && msg.payload?.ProposalMessageId) {
        
                const id = msg.payload.ProposalMessageId.toString();
                if (id in map) {
                    map[id] = msg.payload.Accepted ? 'accepted' : 'declined';

                }

            }
        }

        return map;
    }, [sortedMessages]);


    const meetupConfirmed = sortedMessages.some(
        (message) =>
            message.messageType === "meetup_response" &&
            message.payload?.Accepted === true,
    );

    const { data: reservation } = useQuery({
        queryKey: ["reservation", reservationId],
        queryFn: async () => {
            const result = await getReservationById(reservationId!);
            if (!result.success)
                throw new Error(result.error.message ?? "Failed to load reservation");
            return result.data;
        },
        enabled: !!reservationId,
    });

     const isSeller = reservation ? reservation.sellerId === user?.id : window.location.pathname.startsWith("/seller");
    const role = isSeller ? "seller" : "buyer";
    const { data: listing } = useQuery({
        queryKey: ["listing", reservation?.listingId],
        queryFn: () => listingsService.getById(reservation!.listingId),
        enabled: !!reservation?.listingId,
    });

    const locationState = location.state as ChatLocationState | null;
    const counterpartyName =
        reservation?.counterParty?.name ??
        locationState?.counterpartyName ??
        "Conversation partner";
    const counterpartyInitials =
        reservation?.counterParty?.initials ??
        locationState?.counterpartyInitials ??
        initialsFromName(counterpartyName);
    const isAwaitingAck = reservation?.timerStage === "awaiting_seller";
    const isCancelled = reservation?.reservationStatus === "cancelled";

    const inputDisabled = isCancelled || isAwaitingAck;

    const [draft, setDraft] = useState("");
    const [isProposingMeetup, setIsProposingMeetup] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [respondingKey, setRespondingKey] = useState<string | null>(null);
    const [checkInLocation, setCheckInLocation] = useState<string | null>(null);
    const [isSendingProposal, setIsSendingProposal] = useState(false);


    void isProposingMeetup;
    void checkInLocation; // change when FE2 fixes

    const handleProposeMeetup = async (values: MeetupFormValues) => {
        const proposedTime = combineDateAndTime(values.date, values.time);
        if (new Date(proposedTime) <= new Date()) {
            alert('Please select a time in the future');
            return;
        }
        setIsSendingProposal(true);
        try {
            await listingsService.proposeMeetup(reservationId!, {
                locationName: values.location.name,
                lat: values.location.lat,
                lng: values.location.lng,
                proposedTime,
            });
            setIsProposingMeetup(false);
            refetch();
        } catch (err) {
            console.error('Failed to propose meetup:', err);
        } finally {
            setIsSendingProposal(false);
        }
    };


    const handleRespondMeetup = async (proposalMessageId: number, status: MeetupStatus) => {
        const key = proposalMessageId.toString();
        setRespondingKey(key);
        try {
            if (status === "accepted") {
                await listingsService.acceptMeetup(reservationId!, proposalMessageId);

                const proposalMessage = sortedMessages.find(
                    (m) => m.messageId === proposalMessageId,
                );
                const payload = proposalMessage?.payload as MeetupProposalPayload | undefined;;

                const meetupLocation =
                    payload?.LocationName || payload?.proposedLocation || '';
                const meetupTime =
                    payload?.ProposedTime || payload?.proposedTime || '';
                const meetupLat = payload?.Lat;
                const meetupLng = payload?.Lng;

                navigate(`/payment/meetup`, {
                    state: {
                        reservationId,
                        role,
                        counterpartyName,
                        counterpartyInitials,
                        meetupLocation,
                        meetupTime,
                        meetupLat,
                        meetupLng,
                        listingTitle: listing?.title,
                        listingPrice: listing?.price,
                    },
                });
            } else if (status === "declined") {
                await listingsService.declineMeetup(reservationId!, proposalMessageId);
            }
        } catch (err) {
            console.error("Failed to respond to meetup:", err);
        } finally {
            setRespondingKey(null);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [sortedMessages]);

    useEffect(() => {
        if (!reservationId || sortedMessages.length === 0) return;
        const readable = sortedMessages.filter(
            (m) => m.status !== "sending" && m.status !== "failed",
        );
        if (readable.length === 0) return;
        const last = readable[readable.length - 1];
        if (last.messageId) {
            connectionManager
                .markRead(reservationId, last.messageId)
                .then(() =>
                    queryClient.invalidateQueries({
                        queryKey: queryKeys.reservations(role),
                    }),
                )
                .catch(() => { });
        }
    }, [reservationId, sortedMessages, role, queryClient]);

    const handleSend = () => {
        if (!draft.trim() || inputDisabled) return;
        send(draft.trim());
        setDraft("");
        inputRef.current?.focus();
    };

    if (!reservationId)
        return <div className="p-8 text-center">No reservation specified.</div>;

    return (
        <div className="h-full w-full flex flex-col bg-white overflow-hidden">

            <div className="px-5 py-4 border-b flex items-center gap-3 shrink-0">
                <button
                    onClick={() => navigate(`/${isSeller ? 'seller' : 'buyer'}/messages`)}
                    className="md:hidden text-gray-400 hover:text-gray-600 shrink-0">
                    <IconArrowLeft size={20} />
                </button>
                <Avatar initials={counterpartyInitials} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">
                            {counterpartyName}
                        </p>
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
                                <span className="text-xs text-gray-500 truncate">
                                    {listing.title}
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                                R {listing.price.toFixed(2)}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(
                                isSeller
                                    ? `/seller/reservations/${reservationId}`
                                    : `/buyer/reservations/${reservationId}`
                            )}
                            className="bg-[#003366] text-white text-xs font-bold px-2 py-2 sm:px-4 rounded-xl hover:bg-[#002244] transition-colors shrink-0"
                        >
                            <span className="hidden sm:inline">View Reservation</span>
                            <IconEye size={16} className="sm:hidden" />
                        </button>
                    </div>
                )}

                {isLoading && <LoadingState message = "Loading messages..." />}

                {isError && (
                    <p className="text-center text-red-500">Failed to load messages</p>
                )}

                {sortedMessages.map((msg, i) => {
                    const prev = sortedMessages[i - 1];
                    const showDivider =
                        !prev ||
                        formatDateDivider(prev.sentAt) !== formatDateDivider(msg.sentAt);
                    return (
                        <React.Fragment key={msg.clientId ?? msg.messageId}>
                            {showDivider && (
                                <DateDivider label={formatDateDivider(msg.sentAt)} />
                            )}
                            <MessageBubble
                                message={msg}
                                currentUserId={currentUserId}
                                counterpartyInitials={counterpartyInitials}
                                onRetry={retry}
                                proposalStatusMap={proposalStatusMap}
                                respondingKey={respondingKey}
                                onRespondMeetup={handleRespondMeetup}
                                onCheckIn={setCheckInLocation}
                            />
                        </React.Fragment>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {reservation?.reservationStatus === "active" && !isAwaitingAck && (
                <div className="px-4 pb-2 pt-1 border-t bg-white shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsProposingMeetup(true)}
                        disabled={meetupConfirmed}
                        className={`w-full py-3 font-bold text-sm tracking-widest rounded-2xl transition-colors
                    ${meetupConfirmed
                                ? "bg-green-100 text-green-700 cursor-not-allowed"
                                : "bg-[#003366] text-white hover:bg-[#002244]"
                            }`}
                    >
                        {meetupConfirmed ? "Meetup confirmed" : "SCHEDULE A MEETUP"}
                    </button>
                </div>
            )}
            {isCancelled || isAwaitingAck ? (
                <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-500 shrink-0">
                    {isCancelled
                        ? "Reservation was cancelled."
                        : isSeller
                            ? "Accept this reservation to start chatting."
                            : "Waiting for seller to accept reservation"}
                </div>
            ) : (
                <div className="p-4 border-t bg-white flex items-center gap-3 shrink-0">
                    <button type="button" className="text-gray-400 p-1">
                        <IconPaperclip size={22} />
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 rounded-3xl px-5 py-3 text-sm focus:outline-none focus:border-[#003366]/30 border border-transparent"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!draft.trim()}
                        aria-label="Send message"
                        className="w-11 h-11 bg-[#003366] disabled:bg-gray-300 text-white rounded-2xl flex items-center justify-center hover:bg-[#002244] transition-colors"
                    >
                        <IconSend size={18} />
                    </button>
                </div>
            )}


            {isProposingMeetup && (
                <MeetupProposalForm
                    onCancel={() => setIsProposingMeetup(false)}
                    onSubmit={handleProposeMeetup}
                    isSubmitting={isSendingProposal}
                />
            )}

            {checkInLocation && (
                <CheckInModal
                    reservationId={reservationId!}
                    meetupLocation={checkInLocation}
                    onClose={() => setCheckInLocation(null)}
                />
            )}
        </div>
    );
}