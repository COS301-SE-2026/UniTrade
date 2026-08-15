import { test, beforeEach, afterEach, vi, expect } from 'vitest'
import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test-utils'
import { resetMockListings, seedMockListing, resetMockReservations } from '../mocks/handlers'
import { useAuthStore } from '../../store/useAuthStore'
import { ToastProvider } from '../../components/layout/Toast'
import BrowseAllListing from '../../pages/buyer/BrowseAllListing'
import Reservations from '../../pages/buyer/Reservation'

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
                        <Route path="/buyer/listings" element={<BrowseAllListing />} />
                        <Route path="/buyer/listings" element={<BrowseAllListing />} />
                        <Route path="/buyer/reservations" element={<Reservations />} />
                    </Routes>
                </MemoryRouter>
            </ToastProvider>
        </QueryClientProvider>
    )
}

beforeEach(() => {
    resetMockListings()
    resetMockReservations()
    useAuthStore.setState({
        user: { id: 'buyer-1', name: 'Test Buyer', initials: 'TB', role: 'student' },
    })
})

afterEach(() => {
    useAuthStore.setState({ user: null })
})

test('browse listings, reserve one, and see it in My Reservations', async () => {
    seedMockListing({
        title: 'Chemistry Textbook - 3rd Ed',
        sellerId: 'seller-2',
    })
    const user = userEvent.setup()

    renderApp('/buyer/listings')

    const reserved = await screen.findByText('Chemistry Textbook - 3rd Ed')
    expect(reserved).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^reserve$/i }))

    await screen.findByRole('heading', { name: /my reservations/i }, { timeout: 3000 })
    await screen.findByText('Chemistry Textbook - 3rd Ed')
})
