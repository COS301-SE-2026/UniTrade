import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PaymentComplete from "../../pages/payment/PaymentComplete";
import { connectionManager } from "../../services/realtime/connectionManager";
import { getTransactionStatus } from "../../services/reservationService";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from '@tanstack/react-query'
import type { TransactionStatusResponse } from "../../services/reservationService";

const mockNavigate = vi.fn();
const mockSetSearchParams = vi.fn();
let searchParams = new URLSearchParams();

interface PinGeneratedEvent {
    reservationId: string;
}

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [searchParams, mockSetSearchParams],
    };
});

vi.mock('../../services/realtime/connectionManager', () => ({
    connectionManager: {
        connect: vi.fn().mockResolvedValue(undefined),
        onPaymentCompleted: vi.fn().mockReturnValue(vi.fn()),
    },
}));

vi.mock('../../services/reservationService', () => ({
    getTransactionStatus: vi.fn(),
}));

const mockApiError = { code: 'TEST_ERROR', message: 'Test error', status: 400 };
const mockTransactionStatus = (
    overrides: Partial<TransactionStatusResponse> = {}
): TransactionStatusResponse => ({
    transactionId: 'mock-txn-id',
    transactionStatus: 'pending',
    pinStatus: 'pending',
    pin: null,
    paidAt: null,
    ...overrides,
});

describe('PaymentComplete', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        searchParams = new URLSearchParams();
    });

    const renderComponent = (reservationId: string | null = '123') => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        })

        if (reservationId) {
            searchParams.set('reservationId', reservationId);
        } else {
            searchParams.delete('reservationId');
        }
        return render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <PaymentComplete />
                </MemoryRouter>
            </QueryClientProvider>
        );
    };

    it('renders fallback when no reservationId in URL', async () => {
        renderComponent(null);
        expect(screen.getByText(/couldn't find the details/i)).toBeInTheDocument();
        expect(connectionManager.connect).not.toHaveBeenCalled();
        const goToReservationsBtn = screen.getByRole('button', { name: /go to reservations/i });
        expect(goToReservationsBtn).toBeInTheDocument();
        await userEvent.click(goToReservationsBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/buyer/reservations');
    });

    it('connects to the connection manager', () => {
        vi.mocked(connectionManager.connect).mockResolvedValue(undefined);
        vi.mocked(connectionManager.onPaymentCompleted).mockReturnValue(vi.fn());
        vi.mocked(getTransactionStatus).mockResolvedValue({ success: false, error: mockApiError });

        renderComponent('abc');
        expect(connectionManager.connect).toHaveBeenCalledTimes(1);

    })

    it('shows a waiting message when the transaction is still ongoing', async () => {
        vi.mocked(connectionManager.connect).mockResolvedValue(undefined);
        vi.mocked(connectionManager.onPaymentCompleted).mockReturnValue(vi.fn());
        vi.mocked(getTransactionStatus).mockResolvedValue({
            success: true,
            data: mockTransactionStatus({ transactionStatus: 'pending' }),
        });

        renderComponent('txn1');
        expect(screen.getByText(/waiting for payment confirmation/i)).toBeInTheDocument();
        await screen.findByText(/waiting for payment confirmation/i);
    });

    it('navigates to buyer-pin when transaction is completed but pin not confirmed', async () => {
        vi.mocked(connectionManager.connect).mockResolvedValue(undefined);
        vi.mocked(connectionManager.onPaymentCompleted).mockReturnValue(vi.fn());
        vi.mocked(getTransactionStatus).mockResolvedValue({
            success: true,
            data: mockTransactionStatus({ transactionStatus: 'completed', pinStatus: 'pending' }),
        });
        renderComponent('txn2');

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/payment/buyer-pin', { state: { reservationId: 'txn2' } });
        });
    });

    it('ignores WebSocket events for other reservatio IDs', async () => {
        vi.mocked(connectionManager.connect).mockResolvedValue(undefined);
        const listeners: ((event: PinGeneratedEvent) => void)[] = [];

        vi.mocked(connectionManager.onPaymentCompleted).mockImplementation((cb: (event: PinGeneratedEvent) => void) => {
            listeners.push(cb);
            return vi.fn();
        });
        vi.mocked(getTransactionStatus).mockResolvedValue({
            success: true,
            data: mockTransactionStatus({ transactionStatus: 'pending' }),
        });

        renderComponent('txn4');
        act(() => {
            listeners[0]({ reservationId: 'other' });
        });

        expect(screen.getByText(/waiting for payment confirmation/i)).toBeInTheDocument();
    });

    it('successfully unsubscribes from connectioManaager', () => {
        const unsubssribe = vi.fn();
        vi.mocked(connectionManager.connect).mockResolvedValue(undefined);
        vi.mocked(connectionManager.onPaymentCompleted).mockReturnValue(unsubssribe);
        vi.mocked(getTransactionStatus).mockResolvedValue({ success: false, error: mockApiError });

        const { unmount } = renderComponent('txn5');
        unmount();
        expect(unsubssribe).toHaveBeenCalledTimes(1);
    });

    // NOTE(FE): test shows completion screem when pin status is conformed, handles websocker event when payment completes, shows the screen when status is conformed

})