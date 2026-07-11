import type { ChatMessage } from "./Reservations";

export type MessageStatus = 'sending' | 'sent' | 'failed';

export type ClientChatMessage = ChatMessage & { 
    status? : MessageStatus;
    clientId?: string;
}