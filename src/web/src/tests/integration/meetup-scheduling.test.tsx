import { vi, test, expect, beforeEach, afterEach } from 'vitest'
import { seedMockListing, seedMockReservation, resetMockListings, resetMockReservations, resetMockMessages } from '../mocks/handlers'
import userEvent from '@testing-library/user-event'
import { fireEvent, waitFor, screen, render } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test-utils'
import { MemoryRouter, Routes, Route } from 'react-router'
import { ToastProvider } from '../../components/layout/Toast'
import { useAuthStore } from '../../store/useAuthStore'
import ChatPage from '../../pages/chat/ChatPage'

vi.mock('../../config', () => ({
    getApiUrl: () => 'http://localhost:5000/api',
}))

vi.mock('../../components/layout/LocationPicker', () => ({
    default: ({ onChange }: { onChange: (coords: { lat: number; lng: number }) => void }) => (
        <button type="button" onClick={() => onChange({ lat: -25.7545, lng: 28.2314 })}>
            Set Location (mock)
        </button>
    ),
}))

const { mockConnectionManager } = vi.hoisted(() => {
    return {
        mockConnectionManager: {
            connect: vi.fn().mockResolvedValue(undefined),
            joinRoom: vi.fn().mockResolvedValue(undefined),
            leaveRoom: vi.fn().mockResolvedValue(undefined),
            disconnect: vi.fn().mockResolvedValue(undefined),
            getState: vi.fn(() => 'Connected'),
            onMessageReceived: vi.fn(() => () => { }),
            onMessagesRead: vi.fn(() => () => { }),
            onReservationUpdated: vi.fn(() => () => { }),
            onListingChanged: vi.fn(() => () => { }),
            onPinGenerated: vi.fn(() => () => { }),
            onPaymentCompleted: vi.fn(() => () => { }),
            onStateChange: vi.fn(() => () => { }),
            onReconnected: vi.fn(() => () => { }),
            sendMessage: vi.fn(),
            markRead: vi.fn().mockResolvedValue(undefined),
        },
    }
})

vi.mock('../../services/realtime/connectionManager', () => ({
    connectionManager: mockConnectionManager,
}))

function renderApp(initialRoute: string) {
    const queryClient = createTestQueryClient()
    return render(
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <MemoryRouter initialEntries={[initialRoute]}>
                    <Routes>
                        <Route path="/buyer/messages/:reservationId" element={<ChatPage />} />
                    </Routes>
                </MemoryRouter>
            </ToastProvider>
        </QueryClientProvider>
    )
}
function getTomorrowLocalDate(): string {
    const d = new Date()
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
beforeEach(() => {
    resetMockListings()
    resetMockReservations()
    resetMockMessages()
    vi.clearAllMocks()
    mockConnectionManager.getState.mockReturnValue('Connected')
    useAuthStore.setState({
        user: { id: 'buyer-1', name: 'Test Buyer', initials: 'TB', role: 'student' },
    })
})

afterEach(() => {
    useAuthStore.setState({ user: null })
})

test('buyer proposes a meetup and sees it as pending', async () => {
    seedMockListing({ listingId: '1', title: 'Chemistry Textbook', sellerId: 'seller-2' })
    seedMockReservation({
        reservationId: '1', listingId: '1', buyerId: 'buyer-1', sellerId: 'seller-2',
        timerStage: 'coordinating', reservationStatus: 'active',
    })

    const user = userEvent.setup()
    renderApp('/buyer/messages/1')

    await user.click(await screen.findByRole('button', { name: /schedule a meetup/i }))

    fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: getTomorrowLocalDate() } })

    await user.click(screen.getByRole('button', { name: /set location \(mock\)/i }))
    await waitFor(() => {
        const locationInput = screen.getByPlaceholderText(/merensky library/i) as HTMLInputElement
        expect(locationInput.value).toContain('Merensky')
    })

    await user.click(screen.getByRole('button', { name: /send proposal/i }))
    await screen.findByText(/waiting for response/i)
})