import {test, expect, vi, beforeEach} from 'vitest'
import { screen, render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route  } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test-utils'
import {
  resetMockListings, seedMockListing,
  resetMockReservations, seedMockReservation,
  resetMockTransactions, seedMockTransaction,
  resetMockReviews, seedMockReview,
} from '../mocks/handlers'
import { useAuthStore } from '../../store/useAuthStore'
import { ToastProvider } from '../../components/layout/Toast'
import Orders from '../../pages/buyer/Orders'
import OrderDetails from '../../pages/buyer/OrderDetails'

vi.mock('../../config', () => ({
    getApiUrl: () => 'http://localhost:5000/api',
}))

function renderApp(initialRoute: string) {
    const queryClient = createTestQueryClient()
    return render(
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <MemoryRouter initialEntries={[initialRoute]}>
                    <Routes>
                        <Route path="/buyer/orders" element={<Orders />} />
                        <Route path="/buyer/orders/:reservationId" element={<OrderDetails />} />
                    </Routes>
                </MemoryRouter>
            </ToastProvider>
        </QueryClientProvider>
    )
}

beforeEach(() => {
    resetMockListings()
    resetMockReservations()
    resetMockTransactions()
    resetMockReviews()
    useAuthStore.setState({
        user: {
            id: 'buyer-1',
            name: 'Mahadio Tlaka',
            initials: 'MT',
            role: 'student'
        },
    })
})

test('buyer views their completed orders and opens order details', async () => {
    seedMockListing({ listingId: '1', title: 'Chemistry Textbook', sellerId: 'seller-1', condition: 'like_new' })
    seedMockReservation({
        reservationId: '1',
        listingId: '1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        reservationStatus: 'completed',
        counterParty: { 
            userId: 'seller-1', 
            name: 'Zee Shazi', 
            initials: 'ZS' },
        listing: { 
            title: 'Chemistry Textbook', 
            price: 250, 
            imagePath: '' },
    })
    seedMockTransaction({ reservationId: '1', transactionId: 'txn-1' })

    const user = userEvent.setup()
    renderApp('/buyer/orders')

    await screen.findByText('Chemistry Textbook')

    await user.click(screen.getByRole('button', { name: /view details/i }))

    await screen.findByText('Order Timeline')
    expect(screen.getByRole('heading', {
        name: 'Chemistry Textbook',
        level: 4
    })).toBeInTheDocument()
})

test('buyer sees an existing review for a completed order', async () => {
    seedMockListing({ 
        listingId: '1', 
        title: 'Chemistry Textbook', 
        sellerId: 'seller-1', 
        condition: 'like_new' 
    })
    seedMockReservation({
        reservationId: '1',
        listingId: '1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        reservationStatus: 'completed',
        counterParty: { 
            userId: 'seller-1', 
            name: 'Zee Shazi', 
            initials: 'ZS' 
        },
        listing: { 
            title: 'Chemistry Textbook', 
            price: 250, 
            imagePath: '' 
        },
    })
    seedMockTransaction({ reservationId: '1', transactionId: 'txn-1' })
    seedMockReview({
        transactionId: 'txn-1',
        reviewerId: 'buyer-1',
        revieweeId: 'seller-1',
        reviewType: 'buyer_to_seller',
        rating: 4,
        comment: 'Smooth handover, book as described.',
    })

    const user = userEvent.setup()
    renderApp('/buyer/orders')

    await screen.findByText('Chemistry Textbook')
    await user.click(screen.getByRole('button', { name: /view details/i }))

    expect(await screen.findByText('Smooth handover, book as described.')).toBeInTheDocument()
    expect(screen.getByText('4 out of 5 stars')).toBeInTheDocument()
})