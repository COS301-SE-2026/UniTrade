import {render, screen,fireEvent, waitFor} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import {QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe,expect,it,vi } from 'vitest';
import MeetupDetails from '../../pages/payment/MeetupDetails';
import {
    getReservationById,
    getTransactionStatus,
    createTransactionRequest
} from '../../services/reservationService';
import { listingsService } from '../../services/listingsService';
import { connectionManager } from '../../services/realtime/connectionManager';
import { getMaxLength } from '@testing-library/user-event/dist/cjs/utils/index.js';
import { queryClient } from '../../lib/queryClient';
import ReservationDetails from '../../pages/buyer/ReservationDetails';
import { field } from 'firebase/firestore/pipelines';
import { executeQuery } from 'firebase/data-connect';

const navigateMock = vi.fn();
vi.mock('react-router', async() => {
const actual = await vi.importActual<typeof import('react-router')>('react-router');
return{
    ...actual,
    useNavigate: () => navigateMock,
}
})

vi.mock('../../services/reservationService', () => ({
    getReservationById: vi.fn(),
    getTransactionStatus : vi.fn(),
    createTransactionRequest: vi.fn()
}))

vi.mock('../../services/listingsService', () => ({
    listingsService: {
        getMeetupStatus: vi.fn(),
        getById: vi.fn()
    }
}))

vi.mock('../../services/realtime/connectionManager', () => ({
    connectionManager: {
        connect: vi.fn().mockResolvedValue(undefined),
        onPaymentCompleted: vi.fn(() => vi.fn ()),
    }
}))

vi.mock('../../components/CheckInModal', () => ({
    default: ({ onClose, reservationId, meetupLocation}:{onClose: () => void; reservationId: string; meetupLocation: string }) => (
        <div data-testid="check-in-modal">
            <span>Checking in for {reservationId} at {meetupLocation}</span>
            <button onClick={onClose}>Close check-in</button>
        </div>
    )
}))

vi.mock('../../components/layout/LocationPicker', () => ({
    default: () => <div data-testid="location-picker" />
}))

function reservationFixture(overrides: Partial<Record<string, unknown>> = {})
{
return{
    reservationId: 'REF441',
    listingId: '1',
    buyerId: '223',
    sellerId: '47',
    reservationStatus: 'active',
    ...overrides,

};
}

function meetupFixture(overrides: Partial<Record<string, unknown >> = {}) {
    const now = Date.now();
    return {
        meetupId: 1,
        agreedLocationName: 'Merensky Library',
        agreedLatitude: -25.75,
        agreedLongitude: 28.23,
        agreedTime: new Date(now + 3600_000).toISOString(),
        checkinWindowOpensAt: new Date(now - 60_000).toISOString(),
        checkinWindowClosesAt: new Date(now+ 60_000).toISOString(),
        checkInWindowOpen: true,
        buyerCheckedIn: false,
        sellerCheckedIn: false,
        paymentUnlocked: false,
        status: 'confirmed',
         createdAt:'2026-07-24T10:00:00.000', 
         buyerCheckedInAt:'2026-07-24T10:00:00.000',
          sellerCheckedInAt:'2026-07-24T10:00:00.000',
        ...overrides,
    };

    }


function listingFixture(overrides: Partial<Record<string, unknown>> = {}) {

    return{
        id: '1',
        title: 'Calculus Theory edition 2',
        price: 250,
        ...overrides,
    }
}

function renderMeetupDetails(state: Record<string, unknown> | null = { reservationId: 'REF441', role: 'buyer'} ){
    const queryClient = new QueryClient({
        defaultOptions: {queries:  {retry: false} },
    })

    return render(
        <QueryClientProvider client = { queryClient}>
            <MemoryRouter initialEntries={[{ pathname: '/payment/meetup' ,state}]}>
            <MeetupDetails />
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    vi.mocked(getReservationById).mockReset().mockResolvedValue({
        success: true,
        data: reservationFixture(),
    } as unknown as Awaited<ReturnType<typeof getReservationById>>);
    vi.mocked(listingsService.getMeetupStatus).mockReset().mockResolvedValue(meetupFixture());
    vi.mocked(listingsService.getById).mockReset().mockResolvedValue(
        listingFixture() as unknown as Awaited<ReturnType<typeof listingsService.getById>>,);
    vi.mocked(getTransactionStatus).mockReset().mockResolvedValue({
        success: true,
        data: {transactionId: null, transactionStatus: 'none', pinStatus: null},
    }as unknown as Awaited<ReturnType<typeof getTransactionStatus>>);
    vi.mocked(createTransactionRequest).mockReset();
    navigateMock.mockClear();
    })

    it('shows a fallback and navigates back when no reservationId is provided', () => {
        renderMeetupDetails(null);
        expect(
            screen.getByText(/We couldn't find the details for this meetup/i),).toBeInTheDocument();
            fireEvent.click(screen.getByRole('button', { name: /Go back/i}));
            expect(navigateMock).toHaveBeenCalledWith(-1);
    
    })

    describe('buyer view', ()=> {
        it('shows the buyer side headers', async () => {
           renderMeetupDetails({reservationId: 'REF441', role: 'buyer',counterpartyName: 'Langa Vakalisa'});
           expect(await screen.findByText('Langa Vakalisa')) .toBeInTheDocument();
           expect(screen.getByText(/Review your transaction before completing payment/i)).toBeInTheDocument();
           expect(screen.getByRole('heading',{name: 'Seller'})).toBeInTheDocument();

        });

        it('shows the check-in button and disables it while outside the check-in window', async() => {
            vi.mocked(listingsService.getMeetupStatus).mockResolvedValue(
                meetupFixture({ checkinWindowOpensAt: new Date(Date.now() + 60_000).toISOString() }),
            );
            renderMeetupDetails();

            const checkInButton = await screen.findByRole('button', { name: /check in at meetup/i});
            expect(checkInButton).toBeDisabled();}
          );

     it('opens CheckInModal and refetched on close', async() => {
        renderMeetupDetails();
        const checkInButton = await screen.findByRole('button', { name: /check in at meetup/i});
        fireEvent.click(checkInButton);

        expect(screen.getByTestId('check-in-modal')).toBeInTheDocument();
        vi.mocked(listingsService.getMeetupStatus).mockClear();

        fireEvent.click(screen.getByRole('button', {name: /close check-in/i}));
        expect(screen.queryByTestId('check-in-modal')).not.toBeInTheDocument();
        await waitFor(() => {
            expect(listingsService.getMeetupStatus).toHaveBeenCalled();
        })

     })

     it('it shows pay button once checked in, disabled until payment is unlocked', async() => {
        vi.mocked(listingsService.getMeetupStatus).mockResolvedValue(
            meetupFixture({ buyerCheckedIn: true, paymentUnlocked: false})
        )
        renderMeetupDetails();
        const payButton = await screen.findByRole('button', { name: /pay r250\.00/i})
        expect(payButton).toBeDisabled();
     })

     it('submits a transaction request when pay is clicked and payment is unlocked', async() => {
        vi.mocked(listingsService.getMeetupStatus).mockResolvedValue(
            meetupFixture({ buyerCheckedIn: true, paymentUnlocked: true})
        );
        vi.mocked(createTransactionRequest).mockResolvedValue({
            success:true,
            data: { sandbox_url: 'https://sandbox.payfast.co.za', fields: {amount: '250.00'}},
        } as unknown as Awaited<ReturnType<typeof createTransactionRequest>>);

        const submitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(()=> {})
        renderMeetupDetails();

        const payButton= await screen.findByRole('button', { name: /pay r250\.00/i});
        fireEvent.click(payButton);
        await waitFor(() => {
            expect(createTransactionRequest).toHaveBeenCalledWith('REF441');
        })

    await waitFor(() => {
        expect(submitSpy).toHaveBeenCalled();
    })
    submitSpy.mockRestore();
        })

        it('Shows R when no pice is available', async ()=>{
            vi.mocked(listingsService.getById).mockResolvedValue(
                listingFixture({ price: undefined}) as unknown as Awaited<ReturnType<typeof listingsService.getById>>,
            );
            renderMeetupDetails({ reservationId: 'REF441', role: 'buyer'});
        
        expect(await screen.findByText('R-')).toBeInTheDocument();

        });
    });

  