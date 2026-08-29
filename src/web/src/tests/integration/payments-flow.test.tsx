import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import {render, fireEvent, waitFor, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { createTestQueryClient } from '../test-utils'
import { server } from '../mocks/server'
import {
    resetMockListings,
    resetMockReservations,
    resetMockTransactions,
    seedMockListing,
    seedMockReservation,
} from '../mocks/handlers'
import { useAuthStore } from '../../store/useAuthStore'
import MeetupDetails from '../../pages/payment/MeetupDetails'
import PaymentComplete from '../../pages/payment/PaymentComplete'
import EnterPin from '../../pages/payment/EnterPin'
import GeneratePin from '../../pages/payment/GeneratePin'

import { connectionManager as realConnectionManager } from '../../services/realtime/connectionManager'
import type { createMoackConnectionManager } from '../mocks/mockConnectionManager'

const mockConnectionManager = realConnectionManager as unknown as ReturnType<
    typeof createMoackConnectionManager>

vi.mock('../../config', () => ({
    getApiUrl: () => 'http://localhost:5000/api',
}))
 

vi.mock('../../services/realtime/connectionManager', async () => {
    const { createMoackConnectionManager } = await import('../mocks/mockConnectionManager')
    return { connectionManager: createMoackConnectionManager() }
})
 
interface MockMeetup {
    meetupId: number
    agreedLocationName: string
    agreedLatitude: number
    agreedLongitude: number
    agreedTime: string
    checkinWindowOpensAt: string
    checkinWindowClosesAt: string
    checkInWindowOpen: boolean
    buyerCheckedIn: boolean
    sellerCheckedIn: boolean
    paymentUnlocked: boolean
    status: string
}
 
interface MockTransaction {
    reservationId: string
    transactionId: string | null
    transactionStatus: 'none' | 'completed' | string
    pinStatus: 'pending' | 'confirmed' | null
    pin: string | null
    paidAt: string | null
}
 
function renderAt(initialPath: string, queryClient = createTestQueryClient()) {
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[initialPath]}>
                <Routes>
                    <Route path="/payment/meetup" element={<MeetupDetails />} />
                    <Route path="/payment/payment-complete" element={<PaymentComplete />} />
                    <Route path="/payment/buyer-pin" element={<EnterPin />} />
                    <Route path="/payment/generate-pin" element={<GeneratePin />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    )
}
 
function renderMeetupDetails(
    reservationId: string,
    role: 'buyer' | 'seller',
    queryClient = createTestQueryClient(),
) {
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={[
                    { pathname: '/payment/meetup', state: { reservationId, role } },
                ]}
            >
                <Routes>
                    <Route path="/payment/meetup" element={<MeetupDetails />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    )
}
 
function renderGeneratePin(
    reservationId: string,
    pin: string,
    queryClient = createTestQueryClient(),
) {
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={[
                    { pathname: '/payment/generate-pin', state: { reservationId, pin } },
                ]}
            >
                <Routes>
                    <Route path="/payment/generate-pin" element={<GeneratePin />} />
                    <Route path="/payment/payment-complete" element={<PaymentComplete />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    )
}
 
beforeEach(() => {
    resetMockListings()
    resetMockReservations()
    resetMockTransactions()
    vi.clearAllMocks()
 
    useAuthStore.setState({
        user: { id: 'buyer-1', name: 'Test Buyer', initials: 'TB', role: 'student' },
    })
 
    Object.defineProperty(globalThis.navigator, 'geolocation', {
        configurable: true,
        value: {
            getCurrentPosition: vi.fn((success: PositionCallback) => {
                success({ coords: { latitude: -25.75, longitude: 28.23 } } as GeolocationPosition)
            }),
        },
    })
})
 
afterEach(() => {
    useAuthStore.setState({ user: null })
    vi.restoreAllMocks()
})
 
test('buyer and seller check in, buyer pays, buyer enters PIN, seller sees confirmation', async () => {
    const listing = seedMockListing({ title: 'Calculus Textbook', price: 250, sellerId: 'seller-1' })
    const reservation = seedMockReservation({
        listingId: listing.listingId,
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
    })
    const reservationId = reservation.reservationId
    const now = Date.now()
 
    const meetup: MockMeetup = {
        meetupId: 1,
        agreedLocationName: 'Merensky Library',
        agreedLatitude: -25.75,
        agreedLongitude: 28.23,
        agreedTime: new Date(now + 3600_000).toISOString(),
        checkinWindowOpensAt: new Date(now - 60_000).toISOString(),
        checkinWindowClosesAt: new Date(now + 3600_000).toISOString(),
        checkInWindowOpen: true,
        buyerCheckedIn: false,
        sellerCheckedIn: false,
        paymentUnlocked: false,
        status: 'confirmed',
    }
 
    const transaction: MockTransaction = {
        reservationId,
        transactionId: null,
        transactionStatus: 'none',
        pinStatus: null,
        pin: null,
        paidAt: null,
    }
 
    server.use(
        http.get(`http://localhost:5000/api/reservations/${reservationId}/meetup`, () =>
            HttpResponse.json(meetup),
        ),
        http.post(`http://localhost:5000/api/reservations/${reservationId}/meetup/check-in`, () => {
            if (!meetup.buyerCheckedIn) {
                meetup.buyerCheckedIn = true
            } else if (!meetup.sellerCheckedIn) {
                meetup.sellerCheckedIn = true
                meetup.paymentUnlocked = true
            }
            return HttpResponse.json(meetup)
        }),
        http.post(`http://localhost:5000/api/reservations/${reservationId}/Transaction-request`, () =>
            HttpResponse.json({
                sandbox_url: 'https://sandbox.payfast.co.za/eng/process',
                fields: { amount: '250.00', item_name: 'Calculus Textbook' },
            }),
        ),
        http.get(`http://localhost:5000/api/reservations/${reservationId}/transaction-status`, () =>
            HttpResponse.json(transaction),
        ),
        http.get(`http://localhost:5000/api/reservations/${reservationId}/pending-pin`, () => {
            if (transaction.pinStatus !== 'pending' || !transaction.pin) {
                return HttpResponse.json({ code: 'pin_not_pending' }, { status: 400 })
            }
            return HttpResponse.json({ pin: transaction.pin })
        }),
        http.post(`http://localhost:5000/api/reservations/${reservationId}/verify-pin`, async ({ request }) => {
            const body = (await request.json()) as { pin: string }
            if (body.pin !== transaction.pin) {
                return HttpResponse.json({ code: 'invalid_pin' }, { status: 400 })
            }
            transaction.pinStatus = 'confirmed'
            return new HttpResponse(null, { status: 200 })
        }),
    )
 
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
 
    const buyerMount1 = renderMeetupDetails(reservationId, 'buyer', queryClient)
    await within(buyerMount1.container).findByRole('heading', { name: /seller/i })
    await user.click(within(buyerMount1.container).getByRole('button', { name: /check in at meetup/i }))
    await within(buyerMount1.container).findByText(/checked in/i)
    await user.click(within(buyerMount1.container).getByRole('button', { name: /done/i }))
    await waitFor(() => expect(meetup.buyerCheckedIn).toBe(true))
    buyerMount1.unmount()
 
    const sellerMount1 = renderMeetupDetails(reservationId, 'seller', queryClient)
    await within(sellerMount1.container).findByRole('heading', { name: /buyer/i })
    await user.click(within(sellerMount1.container).getByRole('button', { name: /check in at meetup/i }))
    await within(sellerMount1.container).findByText(/checked in/i)
    await user.click(within(sellerMount1.container).getByRole('button', { name: /done/i }))
    await waitFor(() => {
        expect(meetup.sellerCheckedIn).toBe(true)
        expect(meetup.paymentUnlocked).toBe(true)
    })
    sellerMount1.unmount()
 
    const submitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
    const buyerMount2 = renderMeetupDetails(reservationId, 'buyer', queryClient)
    const payButton = await within(buyerMount2.container).findByRole('button', { name: /pay r250\.00/i })
    await waitFor(() => expect(payButton).not.toBeDisabled())
    fireEvent.click(payButton)
    await waitFor(() => expect(submitSpy).toHaveBeenCalled())
    submitSpy.mockRestore()
    buyerMount2.unmount()
 
    transaction.transactionId = `T-${reservationId}`
    transaction.transactionStatus = 'completed'
    transaction.pinStatus = 'pending'
    transaction.pin = '482913'
    transaction.paidAt = new Date().toISOString()
 
    const buyerPaymentComplete = renderAt(
        `/payment/payment-complete?reservationId=${reservationId}&role=buyer`,
        queryClient,
    )
    await waitFor(() => {
        expect(mockConnectionManager.onPaymentCompleted).toHaveBeenCalled()
    })
 
    await within(buyerPaymentComplete.container).findByRole('heading', { name: /pin verification/i })
 
const digitInputs = within(buyerPaymentComplete.container).getAllByRole('textbox')
    for (const [i, char] of '000000'.split('').entries()) {
        fireEvent.change(digitInputs[i], { target: { value: char } })
    }
    await user.click(within(buyerPaymentComplete.container).getByRole('button', { name: /verify pin/i }))
    expect(
        await within(buyerPaymentComplete.container).findByText('Incorrect PIN. Please try again.'),
    ).toBeInTheDocument()
 
const digitInputsRetry = within(buyerPaymentComplete.container).getAllByRole('textbox')
    for (const [i, char] of '482913'.split('').entries()) {
        fireEvent.change(digitInputsRetry[i], { target: { value: char } })
    }
    await user.click(within(buyerPaymentComplete.container).getByRole('button', { name: /verify pin/i }))
 
    await waitFor(() => expect(transaction.pinStatus).toBe('confirmed'))
 
    await within(buyerPaymentComplete.container).findByRole('heading', { name: /transaction complete!/i })
    expect(
        within(buyerPaymentComplete.container).getByText(
            /you've confirmed receipt\. thanks for using unitrade\./i,
        ),
    ).toBeInTheDocument()
    buyerPaymentComplete.unmount()
 
const sellerGeneratePinMount = renderGeneratePin(reservationId, '482913')
 await within(sellerGeneratePinMount.container).findByRole('heading', { name: /transaction pin/i })
    expect(within(sellerGeneratePinMount.container).getByText('4')).toBeInTheDocument() // first digit rendered
 

    await waitFor(() => expect(mockConnectionManager.onPinConfirmed).toHaveBeenCalled())
    act(() => {
        mockConnectionManager.__simulatePinConfirmed({ reservationId })
    })
 await within(sellerGeneratePinMount.container).findByRole('heading', { name: /transaction complete!/i })
    expect(
        within(sellerGeneratePinMount.container).getByText(
            /the buyer has entered the pin\. the sale is complete\./i,
        ),
    ).toBeInTheDocument()
 
    sellerGeneratePinMount.unmount()
})