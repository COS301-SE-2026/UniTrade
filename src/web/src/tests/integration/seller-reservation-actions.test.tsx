import {test, expect, beforeEach, afterEach, vi} from 'vitest'
import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test-utils'
import { resetMockListings, resetMockReservations, seedMockReservation } from '../mocks/handlers'
import { useAuthStore } from '../../store/useAuthStore'
import { ToastProvider } from '../../components/layout/Toast'
import SellerReservations from '../../pages/seller/SellerReservation'

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
                        <Route path="/seller/reservations" element={<SellerReservations />} />
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
        user: { id: 'seller-1', name: 'Tafadzwa Musiiwa', initials: 'TS', role: 'student'},
    })
})

afterEach(() => {
    useAuthStore.setState({ user: null})
})

test('seller accepting the reservation, moving it from the awaitong_seller state', async () => {
seedMockReservation({ timerStage: 'awaiting_seller'})
const user = userEvent.setup()

renderApp('/seller/reservations')

await screen.findByRole('button', { name: /accept reservation/i})
await user.click(screen.getByRole('button', { name: /accept reservation/i}))

await waitFor(() => {
    expect(screen.queryByRole('button', { name: /accept reservation/i})).not.toBeInTheDocument()
    expect(screen.getByText(/awaiting payment completion/i)).toBeInTheDocument()
})
})

test('seller rejects a reservation', async () => {
    seedMockReservation({ timerStage: 'awaiting_seller'})
    const user = userEvent.setup()

    renderApp('/seller/reservations')

    await screen.findByRole('button', {name: /^reject$/i})
    await user.click(screen.getByRole('button', { name: /^reject$/i}))

    await waitFor(() => {
        expect(screen.queryByRole('button', { name: /^reject$/i})).not.toBeInTheDocument()
    })
})