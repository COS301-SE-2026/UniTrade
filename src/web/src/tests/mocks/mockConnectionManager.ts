import { vi } from "vitest";

interface MockChatMessage {
    messageId: number;
    reservationId: string;
    senderId: string;
    clientKey: string;
    sentAt: string;
    readtAt: string | null;
    messageType: 'text';
    content: string;
    payload: unknown;
}

export function createMoackConnectionManager() {
    const state: 'Connected' | 'Disconnected' = 'Connected'
    const messageListeners = new Set<(m: MockChatMessage) => void>()

    return {
        connect: vi.fn().mockResolvedValue(undefined),
        joinRoom: vi.fn().mockResolvedValue(undefined),
        leaveRoom: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        getState: vi.fn(() => state),
        onMessageReceived: vi.fn((cb: (m: MockChatMessage) => void) => {
            messageListeners.add(cb)
            return () => messageListeners.delete(cb)
        }),
        onMessagesReceived: vi.fn(() => () => { }),
        onReservationUpdated: vi.fn(() => () => { }),
        onListingChanged: vi.fn(() => () => { }),
        onPinGenerated: vi.fn(() => () => { }),
        onPaymentCompleted: vi.fn(() => () => { }),
        onStateChange: vi.fn(() => () => { }),
        onReconnected: vi.fn(() => () => { }),
        sendMessage: vi.fn(async (reservationId: string, content: string, clientId: string) => ({
            messageId: Date.now(),
            reservationId,
            senderId: 'buyer-1',
            clientKey: clientId,
            sentAt: new Date().toISOString(),
            readtAt: null,
            messageType: 'text' as const,
            content,
            payload: null,
        })),
        markRead: vi.fn().mockResolvedValue(undefined),
        __simulateIncomingMessage(message: MockChatMessage) {
            messageListeners.forEach(cb => cb(message))
        },
    }
}