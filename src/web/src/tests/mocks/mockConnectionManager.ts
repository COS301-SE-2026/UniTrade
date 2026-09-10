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
    const pinGeneratedListeners = new Set<(e: { reservationId: string; pin: string }) => void>()
    const paymentCompletedListeners = new Set<(e: { reservationId: string }) => void>()
    const pinConfirmedListeners = new Set<(e: { reservationId: string }) => void>()
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
        onMessagesRead: vi.fn(() => () => { }),
        onMessagesReceived: vi.fn(() => () => { }),
        onReservationUpdated: vi.fn(() => () => { }),
        onListingChanged: vi.fn(() => () => { }),
        onPinGenerated: vi.fn((cb: (e: { reservationId: string; pin: string }) => void) => {
            pinGeneratedListeners.add(cb)
            return () => pinGeneratedListeners.delete(cb)
        }),
        onPaymentCompleted: vi.fn((cb: (e: { reservationId: string }) => void) => {
            paymentCompletedListeners.add(cb)
            return () => paymentCompletedListeners.delete(cb)
        }),
        onPinConfirmed: vi.fn((cb: (e: { reservationId: string }) => void) => {
            pinConfirmedListeners.add(cb)
            return () => pinConfirmedListeners.delete(cb)
        }),
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
        __simulatePinGenerated(e: { reservationId: string; pin: string }) {
            pinGeneratedListeners.forEach(cb => cb(e))
        },
        __simulatePaymentCompleted(e: { reservationId: string }) {
            paymentCompletedListeners.forEach(cb => cb(e))
        },
        __simulatePinConfirmed(e: { reservationId: string }) {
            pinConfirmedListeners.forEach(cb => cb(e))
        },
    }
}
   