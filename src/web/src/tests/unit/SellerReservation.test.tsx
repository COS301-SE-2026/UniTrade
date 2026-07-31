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
 
    test('renders a reservation card with title, price, counterparty, and status', () => {
        vi.mocked(useReservationsList).mockReturnValue({
            data: [makeReservation()],
            isLoading: false,
            isError: false,
            error: null,
        } as any)
 
        renderReservations()
 
        expect(screen.getByText('Calculus Textbook')).toBeInTheDocument()
        expect(screen.getByText('Langa Vakalisa')).toBeInTheDocument()
        expect(screen.getByText('R250', { selector: 'span' })).toBeInTheDocument()
        expect(screen.getByText('Active')).toBeInTheDocument()
    })
 
    test('summary cards reflect only active reservations', () => {
        vi.mocked(useReservationsList).mockReturnValue({
            data: [
                makeReservation({ reservationId: 'a', reservationStatus: 'active', timerStage: 'awaiting_seller', listing: { title: 'Book A', price: 100, imagePath: null } as any }),
                makeReservation({ reservationId: 'b', reservationStatus: 'active', timerStage: 'coordinating', listing: { title: 'Book B', price: 200, imagePath: null } as any }),
                makeReservation({ reservationId: 'c', reservationStatus: 'completed', timerStage: 'meetup_confirmed', listing: { title: 'Book C', price: 300, imagePath: null } as any }),
            ],
            isLoading: false,
            isError: false,
            error: null,
        } as any)
 
        renderReservations()
 

        expect(screen.getByText('2')).toBeInTheDocument()

        expect(screen.getByText('1')).toBeInTheDocument()

        expect(screen.getByText('R300', { selector: 'p' })).toBeInTheDocument()
    })
 
    test('filters reservations by status', async () => {
        const user = userEvent.setup()
        vi.mocked(useReservationsList).mockReturnValue({
            data: [
                makeReservation({ reservationId: 'a', reservationStatus: 'active', listing: { title: 'Active Item', price: 100, imagePath: null } as any }),
                makeReservation({ reservationId: 'b', reservationStatus: 'completed', timerStage: 'meetup_confirmed', listing: { title: 'Completed Item', price: 200, imagePath: null } as any }),
            ],
            isLoading: false,
            isError: false,
            error: null,
        } as any)
 
        renderReservations()
 
        expect(screen.getByText('Active Item')).toBeInTheDocument()
        expect(screen.getByText('Completed Item')).toBeInTheDocument()
 
        await user.click(screen.getByRole('button', { name: /filter/i }))
        await user.click(screen.getByRole('button', { name: 'Completed' }))
 
        expect(screen.queryByText('Active Item')).not.toBeInTheDocument()
        expect(screen.getByText('Completed Item')).toBeInTheDocument()
    })
 
    test('sorts reservations by price', async () => {
        const user = userEvent.setup()
        vi.mocked(useReservationsList).mockReturnValue({
            data: [
                makeReservation({ reservationId: 'a', listing: { title: 'Expensive Item', price: 500, imagePath: null } as any }),
                makeReservation({ reservationId: 'b', listing: { title: 'Cheap Item', price: 50, imagePath: null } as any }),
            ],
            isLoading: false,
            isError: false,
            error: null,
        } as any)
 
        renderReservations()
 
        await user.click(screen.getByRole('button', { name: /sort by/i }))
        await user.click(screen.getByRole('button', { name: 'Price low' }))
 
        const titles = screen.getAllByText(/Item$/).map((el) => el.textContent)
        expect(titles).toEqual(['Cheap Item', 'Expensive Item'])
    })
 
    test('acknowledging a reservation calls the service and invalidates the query cache', async () => {
        const user = userEvent.setup()
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
 
        vi.mocked(useReservationsList).mockReturnValue({
            data: [makeReservation({ timerStage: 'awaiting_seller' })],
            isLoading: false,
            isError: false,
            error: null,
        } as any)
        vi.mocked(acknowledgeReservatioin).mockResolvedValue({ success: true } as any)
 
        renderReservations(queryClient)
 
        await user.click(screen.getByRole('button', { name: /accept reservation/i }))
 
        await waitFor(() => {
            expect(acknowledgeReservatioin).toHaveBeenCalledWith('res-1')
        })
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reservations', 'seller'] })
    })
 

})
