import type { ChatMessage } from "./Reservations";

export type MessageStatus = 'sending' | 'sent' | 'failed';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;

export type ClientChatMessage = DistributiveOmit<ChatMessage, 'messageId'> & {
    messageId?: number;
    status?: MessageStatus;
    clientId?: string;
}