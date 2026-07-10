import React, {useState, useRef, useEffect} from 'react';
import { useNavigate} from 'react-router-dom';
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


type ReservationsStatus = 'active' | 'expired' | 'cancelled' | 'completed';
type TimerStage = 'awaiting_seller' | 'awaiting_buyer' | 'co-ordinating';

interface Message {
    messageId: string;
    senderId: string;
    sentAt: string;
    readAt?: string | null;
}

interface TextMessage extends Message {
    messageType : 'text';
    content : string;
}

interface SystemMessageType extends Message {
    messageType: 'system';
    content: string;
}

interface MeetUpProposal{
    location: string;
    proposedDate: string;
    proposedTime: string;
    note?: string;
}

interface MeetUpProposalMessage extends Message {
    messageType: 'meetup_proposal';
    content: string;
    payload: MeetUpProposal;
}

type ChatMessage = TextMessage | SystemMessageType | MeetUpProposalMessage;

interface Reservation {
    reservationId: string;
    otherperson: {
        userId: string;
        name: string;
        initials: string;
    };
    listing: { 
        title: string;
        price: number;
        imagePath: string
    };
    unreadCount: number;
    reservationStatus: ReservationsStatus;
    timerStage: TimerStage;
}

const mockMessages: ChatMessage[] = [
    {
        messageId: 'm1',
        senderId: 'seller-1',
        messageType: 'text',
        content: 'Hi Mahadio, I hope you are doing well , i wanted to ask if you are still interested in the textbook?',
        sentAt: '2024-06-01T10:00:00Z',
        readAt: '2024-06-01T10:05:00Z',
    },
    {
        messageId: 'm2',
        senderId: 'buyer-1',
        messageType: 'text',
        content: 'Yes, I am still intertested!',
        sentAt: '2024-06-01T10:07:00Z',
        readAt: '2024-06-01T10:08:00Z',

    },
    {
        messageId: 'm3',
        senderId: 'seller-1',
        messageType: 'system',
        content: 'Reservation has been created.',
        sentAt: '2024-06-01T10:10:00Z',

    },
    {
        messageId: 'm4',
        senderId: 'seller-1',
        messageType: 'text',
        content: "Great! When would you like to meet up to exchange the textbook?",
        sentAt: '2024-06-01T10:12:00Z',
        readAt: '2024-06-01T10:13:00Z',
    },
    {
        messageId: 'm5',
        senderId: 'buyer-1',
        messageType: 'meetup_proposal',
        content: "I propose we meet at the library on June 5th at 3 PM.",
        sentAt: '2024-06-01T10:15:00Z',
        payload: {
            location: 'Library',
            proposedDate: '2024-06-05',
            proposedTime: '15:00',
            note: 'Please let me know if this works for you.',
        },
    },
    {
        messageId: 'm6',
        senderId: 'seller-1',
        messageType: 'text',
        content: "That works for me!",
        sentAt: '2024-06-01T10:16:00Z',
        readAt: '2024-06-01T10:17:00Z',

    },
    {
        messageId: 'm7',
        senderId: 'buyer-1',
        messageType: 'text',
        content: "Great! See you then.",
        sentAt: '2024-06-01T10:18:00Z',
        readAt: '2024-06-01T10:19:00Z',
    },
];

const mockReservation: Reservation = {
    reservationId: 'r1',
    otherperson: {
        userId: 'seller-1',
        name: 'Sabira Kaire',
        initials: 'SK'
    },
    listing: {
        title: 'Textbook',
        price: 800,
        imagePath: '/book.jpg'
    },
    unreadCount: 0,
    reservationStatus: 'active',
    timerStage: 'co-ordinating'
}

const TextMessageBubble: React.FC<{message: TextMessage; isOwnMessage: boolean}>=({
    message,
    isOwnMessage,
}) => {
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
                    {isOwnMessage &&
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

const SystemMessage: React.FC<{message: SystemMessageType}> = ({message}) => {
    return (
        <div className = "flex justify-center">
            <span className = "bg-gray-100 text-gray-500 text-[11px] font-medium px-3 py-1 rounded-full uppercase tracking-wide">
                {message.content}
            </span>
        </div>
    );
};

const MeetupProposalCard: React.FC<{
    message: MeetUpProposalMessage;
    isOwnMessage: boolean;
}> = ({message, isOwnMessage}) => {
    const { location, proposedDate, proposedTime, note} = message.payload;

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
                        <p className = "text-sm font-semibold">{location}</p>
                    </div>
                    <div className = "mt-1 flex items-center gap-2 text-white">
                        <IconCalendar size={16} className="shrink-0" />
                        <p className = "text-sm font-semibold">
                            {proposedDate} . {proposedTime}
                        </p>
                    </div>
                    {note && <p className = "mt-1 text-xs text-white/70">{note}</p>}
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

const MessageBubble: React.FC<{
    message: ChatMessage;
    currentUserId: string
}> = ({ message, currentUserId }) => {
    const isOwnMessage = message.senderId === currentUserId;

    switch (message.messageType) {
        case 'text':
            return <TextMessageBubble  message={message} isOwnMessage={isOwnMessage} />;
        case 'system':
            return <SystemMessage message={message} />;
        case 'meetup_proposal':
            return <MeetupProposalCard message={message} isOwnMessage={isOwnMessage} />;
        default:
            return (
                <div className="flex justify-center">
                    <span className="text-[11px] text-gray-400 italic">Unsupported message type</span>
                </div>
            );

    }
};



export default function ChatPage() {
    const navigate = useNavigate();
    const [reservation] = useState<Reservation>(mockReservation);
    const{ user } = useAuthStore();
    const currentUserId = user?.id ?? 'buyer-1';

    const [ messages, setMessages] = useState<ChatMessage[]>(mockMessages);
    const [draft, setDraft] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
    if (!draft.trim()) return;
    
    const newMessage: TextMessage = {
      messageId: `m${Date.now()}`,
      senderId: currentUserId,
      messageType: 'text',
      content: draft.trim(),
      sentAt: new Date().toISOString(),
      readAt: null,
    };
    setMessages((prev) => [...prev, newMessage]);
    setDraft('');
};

    return (
        <div className = "flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className = "bg-[#003366] px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className = "text-white/80 hover:text-white">
                    <IconArrowLeft size = {20} />

                </button>
                <div className = "w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {reservation.otherperson.initials}
                </div>
                <div>
                    <p className = "text-white text-sm font-bold">{reservation.otherperson.name}</p>
                    <p className = "text-white/50 text-[11px]">Online</p>
                </div>
            </div>

            <div className = "flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                    <MessageBubble key = {msg.messageId} message={msg} currentUserId = {currentUserId} />

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