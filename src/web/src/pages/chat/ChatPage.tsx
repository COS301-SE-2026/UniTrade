import React, { useRef, useEffect} from 'react';
import { useNavigate, useParams} from 'react-router-dom';
import {
    IconArrowLeft,
    IconCalendarPlus,
    IconSend,
    IconCheck,
    IconX,
    IconMapPin,
    IconCalendar,
} from '@tabler/icons-react';
import { useAuthStore } from '../../store/useAuthStore'
import type {
    TextMessage,
    SystemMessage,
    MeetupProposalMessage,
    MeetupResponseMessage,
}from '../../types/Reservations'
import { useChatMessages } from '../../hooks/useChatMessages';
import { useReservationRealtime } from '../../hooks/useReservationRealtime';
import { useSendMessage } from '../../hooks/useSendMessage';
import type { ClientChatMessage } from '../../types/chat';
import { connectionManager } from '../../services/realtime/connectionManager';


const TextMessageBubble: React.FC<{
    message: TextMessage & {status?: 'sending'| 'sent' | 'failed'};
    isOwnMessage: boolean;
    onRetry? : () => void;
}> = ({message, isOwnMessage, onRetry}) => {

    const time = new Date(message.sentAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div 
        className={`flex  ${
            isOwnMessage
            ? 'justify-end' 
            : 'justify-start'
        }`}
            >
            <div
            className={`max-w-[75%] px-3 py-2 text-sm shadow-sm ${
                isOwnMessage
                ? 'bg-[#003366] text-white rounded-2xl rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm'

            }`}
            >
                <p className= "whitespace-pre-wrap break-words">{message.content}</p>
                <div
                className = {`mt-1 flex items-center gap-1 text-[10px] ${
                    isOwnMessage 
                    ? 'text-white/60 justify-end' 
                    : 'text-gray-400 justify-end'

                }`}
                >
                    <span>{time}</span>
                    {isOwnMessage && message.status === 'sending' && (
                        <span className="italic">sending...</span>
                    )}
                    {isOwnMessage && message.status === 'failed' && (
                        <button
                        onClick = {onRetry}
                        className="text-red-300 hover:text-red-100 underline"
                        >
                            failed . retry
                        </button>
                    )}
                    {isOwnMessage && (!message.status || message.status === 'sent') &&
                      (message.readAt ? (
                        <IconCheck 
                        size = {13} 
                        className= "text-sky-300" />
                    ) : (
                        <IconCheck size={13} />

                    ))}
                </div>
            </div>
        </div>
    );
};

const SystemMessageBubble: React.FC<{message: SystemMessage}> = ({message}) => {
    return (
        <div className = "flex justify-center">
            <span className = "bg-gray-100 text-gray-500 text-[11px] font-medium px-3 py-1 rounded-full uppercase tracking-wide">
                {message.content}
            </span>
        </div>
    );
};

const MeetupProposalCard: React.FC<{
    message: MeetupProposalMessage;
    isOwnMessage: boolean;
}> = ({message, isOwnMessage}) => {
    const { proposedLocation,proposedTime} = message.payload;
    const date = new Date(proposedTime)

    return(
        <div className = {`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} gap-1`}>
            <span className = "text-[11px] text-gray-400 px-1">{message.content}</span>
            <div className = "w-72 max-w-full rounded-xl overflow-hidden shadow-sm bg-[#003366]">
                <div className = "px-4 pt-3 pb-2">
                    <p className= "text-[10px] font-bold tracking-widest text-white/60 uppercase">
                    Meetup Proposal
                    </p>
                    <div className = "mt-2 flex items-center gap-2 text-white">
                        <IconMapPin size = {16} className="shrink-0" />
                        <p className = "text-sm font-semibold">{proposedLocation}</p>
                    </div>
                    <div className = "mt-1 flex items-center gap-2 text-white">
                        <IconCalendar size={16} className="shrink-0" />
                        <p className = "text-sm font-semibold">
                            {date.toLocaleDateString()} . {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                        </p>
                    </div>
                </div>
                <div className = "flex border-t border-white/15">
                <button 
                    type = "button"
                    disabled
                    className = "flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors disabled:cursor-not-allowed"
                    >
                        <IconX size={14} /> Decline
                    </button>
                    <div className = "w-px bg-white/15" />
                    <button
                        type="button"
                        disabled
                        className = "flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors disabled:cursor-not-allowed"
                        >
                            <IconCheck size = {14} /> Accept
                        </button>
                </div>
            </div>
        </div>
    );
};

const MeetupResponseBubble: React.FC<{
    message: MeetupResponseMessage;
}> = ({ message}) => (
    <div className= "flex justify-center">
        <span className = {`text-[11px] font-semibold px-3 py-1 rounded-full ${
            message.payload.accepted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
            {message.content}
        </span>
    </div>
);

function MessageBubble({
    message, currentUserId, onRetry,
} : {
    message: ClientChatMessage;
    currentUserId: string;
    onRetry: (clientId: string, content: string) => void;
}) {
    const isOwnMessage = message.senderId === currentUserId;

    switch(message.messageType) {
        case 'text':
            return (
                <TextMessageBubble
                message={message}
                isOwnMessage={isOwnMessage}
                onRetry={() => message.clientId && onRetry(message.clientId,message.content)}
                />
            );

            case 'system' :
                return <SystemMessageBubble message = {message} />;
            case 'meetup_proposal' :
                return <MeetupProposalCard message={message} isOwnMessage= {isOwnMessage} />;
            case 'meetup_response':
                return <MeetupResponseBubble message={message} />;
            default:
                return <div className="flex justify-center">
                    <span className = "text-[11px] text-gray-400 italic">
                        Unsupported message type
                    </span>
                </div>
    }
}



export default function ChatPage() {
    const navigate = useNavigate();
    const {reservationId}= useParams<{reservationId: string}>();
    const{ user } = useAuthStore();
    const isSeller = window.location.pathname.startsWith('/seller');
    const currentUserId = user?.id ?? 'me';

    const {data: messages =[], isLoading, isError} = useChatMessages(reservationId!);
    useReservationRealtime(reservationId!);
    const {mutate: send, retry} = useSendMessage(reservationId!);

    const [draft, setDraft] = React.useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if(!reservationId || messages.length === 0 ) return;
        const readable = messages.filter((m) => m.status !== 'sending' && m.status !== 'failed');
        if (readable.length === 0 ) return;
        const lastMessage = readable[readable.length - 1];
        connectionManager.markRead(reservationId, lastMessage.messageId).catch(() => {});

    }, [reservationId, messages]);

    const handleSend = () => {
    if (!draft.trim()) return;
    send(draft.trim());
    setDraft('');
    inputRef.current?.focus();
    };
    
    if (!reservationId) return <div>No reservation specified.</div>;

    return (
        <div className = "flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className = "bg-[#003366] px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(isSeller ? '/seller/messages' : '/buyer/messages')} className = "text-white/80 hover:text-white">
                    <IconArrowLeft size = {20} />
                </button>
                <div>
                    <p className = "text-white text-sm font-bold">Chat</p>
                    <p className = "text-white/50 text-[11px]">Reservation {reservationId}</p>
                </div>
            </div>

            <div className = "flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
                {isLoading && <p className="text-center text-xs text-gray-400">Loading messages…</p>}
                {isError && <p className="text-center text-xs text-red-500">Couldn't load messages.</p>}
                {messages.map((msg) => (
                    <MessageBubble key = {msg.clientId ?? msg.messageId} message={msg} currentUserId = {currentUserId} onRetry={retry} />

                ))}
                <div ref = {messagesEndRef} />
            </div>

            <div className = "px-4 pt-2">
                <button
                type="button"
                disabled
                className = "w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[#003366]/20 text-[#003366] text-xs font-bold uppercase tracking-wide hover:bg-[#003366]/5 transition-colors disabled:cursor-not-allowed">
                    <IconCalendarPlus size={14} /> Propose Meetup
                </button>
            </div>

            <div className = "p-4 flex items-center gap-2">
                <input 
                ref={inputRef}
                type="text"
                value={draft}
                onChange = {(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className = "flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-[#003366]/40"
                />
                <button 
                onClick = {handleSend}
                className = "w-9 h-9 rounded-full bg-[#003366] flex items-center justify-center text-white hover:bg-[#002244] transition-colors shrink-0"
                >
                    <IconSend size = {16} />

                </button>

            </div>
        </div>
    );

    
}