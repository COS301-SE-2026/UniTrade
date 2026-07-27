import {screen,  render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter} from 'react-router'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Orders from '../../pages/buyer/Orders'
import { listingsService } from '../../services/listingsService'
import type { OrderItem } from '../../types/listing'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async() => {
    const path = await vi.importActual('react-router-dom')
    return{
        ...path,
        useNavigate: () => mockNavigate,
    }
})

vi.mock('../../services/listingsService', () => ({
    listingsService: {
        getCompletedOrders: vi.fn(),
    },
}))

vi.mock('../../utils/formatters', () => ({
    formatPrice: (value: number) => `$${value.toFixed(2)}`,
}))

vi.mock('../../pages/buyer/Reservation', () => ({
    SummaryCard: ({label, value}: {label: string; value: string}) => (
        <div data-tesid = "summary-card">
            <span>
                {label}
            </span>
            <span>
                {value}
            </span>
        </div>
    ),
}))

vi.mock('../../components/auth/Review', () => ({
    ReviewModal: ({
        isOpen,
        onClose,
        revieweeName,
        onSubmitted,
    } : {
        isOpen: boolean
        onClose: () => void
        revieweeName: string
        onSubmitted: () => void
    }) => 
        isOpen ? (
            <div data-testid = "review-modal">
                <p>
                    Reviewing {revieweeName}
                </p>
                <button onClick = {onClose}>
                    Close
                </button>
                <button onClick={onSubmitted}>
                    Submit review
                </button>
            </div>
        ) : null,
}))

vi.mock('../../components/layout/Spinner', () => ({
    LoadingState: ({message} : {message: string}) => (
        <div data-testid = "loading-state">
            {message}
        </div>
    ),
}))

const makeOrder = (overrides: Partial<OrderItem> = {}): OrderItem =>
({
    id: '1',
    title: 'Introduction to computer science',
    price: 300,
    sellerName: 'Zee Shazi',
    sellerInitials: 'ZS',
    condition: 'Good',
    date: '2026-05-05',
    refNum: 'REF-001',
    imageUrl: '',
    transactionId: 'txn-1',
    _createdAtIso: new Date().toISOString(),
    ...overrides,
}) as OrderItem

const renderOrders = () =>
    render (
        <MemoryRouter>
            <Orders />
        </MemoryRouter>
    )

const mockedGetCompletedOrders = vi.mocked(listingsService.getCompletedOrders)

beforeEach(() => {
    vi.clearAllMocks()
})


describe('Orders', () => {
    it('shows the loading the state while fetching the orders', () => {
        mockedGetCompletedOrders.mockReturnValue(new Promise(() => {}))

        renderOrders()

        expect(screen.getByTestId('loading-state')).toHaveTextContent('Fetching orders...')
    })

    it('renders orders once the orders page has been loaded', async() => {
        mockedGetCompletedOrders.mockResolvedValue([makeOrder()])

        renderOrders()

        expect(await screen.findByText('Introduction to computer science')).toBeInTheDocument()
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument()
    })

    it('shows an empty state when there are no orders in the orders page', async() => {
        mockedGetCompletedOrders.mockResolvedValue([])

        renderOrders()

        expect(await screen.findByText('No orders found')).toBeInTheDocument()
        expect(
            screen.getByText('There are no orders available for this category.')
        ).toBeInTheDocument()
    })

    it('filters orders to only this semester', async () => {
        const oldDate = new Date()
        oldDate.setMonth(oldDate.getMonth() - 6)

        mockedGetCompletedOrders.mockResolvedValue([
            makeOrder({ id: '1', title: 'Recent Book', _createdAtIso: new Date().toISOString() }),
            makeOrder({ id: '2', title: 'Old Book', _createdAtIso: oldDate.toISOString() }),
        ])

        const user = userEvent.setup()
        renderOrders()

        await screen.findByText('Recent Book')
        expect(screen.getByText('Old Book')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'This semester' }))

        expect(screen.getByText('Recent Book')).toBeInTheDocument()
        expect(screen.queryByText('Old Book')).not.toBeInTheDocument()
    })

    it('filters orders awaiting review', async () => {
        mockedGetCompletedOrders.mockResolvedValue([
            makeOrder({ 
                id: '1', 
                title: 'Unrated Book', 
                rating: 0 
            }),
            makeOrder({ 
                id: '2', 
                title: 'Rated Book', 
                rating: 4 
            }),
        ])

        const user = userEvent.setup()
        renderOrders()

        await screen.findByText('Unrated Book')
        await user.click(screen.getByRole('button', { name: 'Awaiting review' }))

        expect(screen.getByText('Unrated Book')).toBeInTheDocument()
        expect(screen.queryByText('Rated Book')).not.toBeInTheDocument()
    })

    it('filters orders that have already been reviewed', async() => {
        mockedGetCompletedOrders.mockResolvedValue([
            makeOrder({
                id: '1',
                title: 'Unrated Book',
                rating: 0 

            }),
            makeOrder({
                id: '2',
                title: 'Rated Book',
                rating: 4

            }),

        ])

        const user = userEvent.setup()
        renderOrders()

        await screen.findByText('Unrated Book')
        await user.click(screen.getByRole('button', {name: 'Reviewed'}))

        expect(screen.getByText('Rated Book')).toBeInTheDocument()
        expect(screen.queryByText('Unrated Book')).not.toBeInTheDocument()
    })


})
