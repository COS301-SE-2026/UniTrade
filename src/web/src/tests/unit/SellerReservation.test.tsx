import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Reservations from '../../pages/seller/SellerReservation'
import { useReservationsList } from '../../hooks/useReservationsList'
import { acknowledgeReservatioin, cancelReservation } from '../../services/reservationService'
import type { ReservationListItem } from '../../types/Reservations'
 
vi.mock('../../config', () => ({
    getApiUrl: () => 'http://localhost:5000/api',
}))
 
vi.mock('../../lib/queryKeys', () => ({
    queryKeys: {
        reservations: (role: string) => ['reservations', role],
    },
}))
 
vi.mock('../../components/layout/Spinner', () => ({
    LoadingState: ({ message }: { message: string }) => <div>{message}</div>,
}))
 
vi.mock('../../hooks/useReservationsList', () => ({
    useReservationsList: vi.fn(),
}))
 
vi.mock('../../services/reservationService', () => ({
    acknowledgeReservatioin: vi.fn(),
    cancelReservation: vi.fn(),
}))
 
const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router')>()
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})
 
function makeReservation(overrides: Partial<ReservationListItem> = {}): ReservationListItem {
    return {
        reservationId: 'res-1',
        reservationStatus: 'active',
        timerStage: 'awaiting_seller',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        unreadCount: 0,
        listing: {
            title: 'Calculus Textbook',
            price: 250,
            imagePath: null,
        },
        counterParty: {
            name: 'Langa Vakalisa',
        },
        ...overrides,
    } as ReservationListItem
}
 
function renderReservations(queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
})) {
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <Reservations />
            </MemoryRouter>
        </QueryClientProvider>,
        { container: document.body.appendChild(document.createElement('div')) },
    )
}
 
beforeEach(() => {
    vi.clearAllMocks()
})
 
describe('Reservations page', () => {
    test('shows a loading state while reservations are loading', () => {
        vi.mocked(useReservationsList).mockReturnValue({
            data: [],
            isLoading: true,
            isError: false,
            error: null,
        } as any)
 
        renderReservations()
 
        expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
 
    test('shows an error message when the query fails and there is no data to show', () => {
        vi.mocked(useReservationsList).mockReturnValue({
            data: [],
            isLoading: false,
            isError: true,
            error: new Error('Network request failed'),
        } as any)
 
        renderReservations()
 
        expect(screen.getByText('Network request failed')).toBeInTheDocument()
    })
 

})
