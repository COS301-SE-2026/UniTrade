import { test, vi, beforeEach, afterEach } from 'vitest'
import { screen, render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test-utils'
//import { createMoackConnectionManager } from '../mocks/mockConnectionManager'
import { resetMockReservations, seedMockReservation, resetMockListings, seedMockListing, resetMockMessages } from '../mocks/handlers'
import { useAuthStore } from '../../store/useAuthStore'
import { ToastProvider } from '../../components/layout/Toast'
import ChatPage from '../../pages/chat/ChatPage'

vi.mock('../../config', () => ({
    getApiUrl: () => 'http://localhost:5000/api',
}))
const { mockConnectionManager } = vi.hoisted(() => {
  return {
    mockConnectionManager: {
      connect: vi.fn().mockResolvedValue(undefined),
      joinRoom: vi.fn().mockResolvedValue(undefined),
      leaveRoom: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      getState: vi.fn(() => 'Connected'),
      onMessageReceived: vi.fn(() => () => {}),
      onMessagesRead: vi.fn(() => () => {}),
      onReservationUpdated: vi.fn(() => () => {}),
      onListingChanged: vi.fn(() => () => {}),
      onPinGenerated: vi.fn(() => () => {}),
      onPaymentCompleted: vi.fn(() => () => {}),
      onStateChange: vi.fn(() => () => {}),
      onReconnected: vi.fn(() => () => {}),
      sendMessage: vi.fn(),
      markRead: vi.fn().mockResolvedValue(undefined),
    },
  }
})

vi.mock('../../services/realtime/connectionManager', () => ({
  connectionManager: mockConnectionManager,
}))

function renderApp(initialRoute: string){
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

beforeEach(() => {
  resetMockListings()
  resetMockReservations()
  resetMockMessages()
  vi.clearAllMocks()
  mockConnectionManager.sendMessage.mockImplementation(
    async (reservationId: string, content: string, clientId: string) => ({
      messageId: Date.now(),
      reservationId,
      senderId: 'buyer-1',
      clientKey: clientId,
      sentAt: new Date().toISOString(),
      readAt: null,
      messageType: 'text' as const,
      content,
      payload: null,
    })
  )
  mockConnectionManager.getState.mockReturnValue('Connected')
  useAuthStore.setState({
    user: { id: 'buyer-1', name: 'Test Buyer', initials: 'TB', role: 'student' },
  })
})

afterEach(() => {
    useAuthStore.setState({ user: null})
})

test('buyer sends a mesage and sees it appear in the chat thread', async () => {
    seedMockListing({listingId: '1', title: 'Chemistry Textbook', sellerId: 'seller-2'})
    seedMockReservation({
        reservationId: '1',
        listingId: '1',
        buyerId: 'buyer-1',
        sellerId: 'seller-2',
        timerStage: 'coordinating',
        reservationStatus: 'active',
    })

    const user = userEvent.setup()
    renderApp('/buyer/messages/1')

    const input = await screen.findByPlaceholderText(/type a message/i)
    await user.type(input, 'Hey, is this still available?')
    await user.click(screen.getByRole('button', { name: /send message/i}))

    await screen.findByText('Hey, is this still available?')
})
