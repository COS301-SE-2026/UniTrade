import React, {useState, useRef, useEffect} from 'react';
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


type ReservationsStatus = 'active' | 'expired' | 'cancelled' | 'completed';
type TimerStage = 'awaiting_seller' | 'awaiting_buyer' | 'co-ordinating';
type MessageType = 'text' | 'system' | 'meetup_proposal' | 'meetup_response';

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
        imagePath: '/book,jpg'
    },
    unreadCount: 0,
    reservationStatus: 'active',
    timerStage: 'co-ordinating'
}

const textMessageBubble: React.FC<{message: TextMessage; isOwnMessage: boolean}>=({
    message,
    isOwnMessage,
}) => {
    const time = new Date(message.sentAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className= {`flex  $(isOwnMessage? 'justify-end' " 'justify-start'}`}>
            <div
            className={`max-w-[75%] px-3 py-2 text-sm shadow-sm ${
                isOwnMessage
                ? 'bg-[#003366] text-white rounded 2xl rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded 2xl rounded-bl-sm'

            }`}
            >
                <p className= "whitespace-pre-wrap break-words">{message.content}</p>
                <div
                className = {`mt-1 flex items-center gap-1 text-[10px] ${
                    isOwnMessage ? 'text-white/60 justify-end' : 'text-gray-400 justify-end'

                }`}
                >
                    <span>{time}</span>
                    {isOwnMessage &&
                    (message.readAt ? (
                        <IconCheck size = {13} className= "text-sky-300" />
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

export default function ChatPage() {
    
}