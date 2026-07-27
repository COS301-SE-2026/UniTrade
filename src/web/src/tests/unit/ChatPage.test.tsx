import { render, screen, fireEvent, within, waitFor} from '@testing-library/react';
import { MemoryRouter, Routes, Route} from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, it, expect, describe} from 'vitest';
import ChatPage from '../../pages/chat/ChatPage';
import { useSendMessage } from '../../hooks/useSendMessage';
import { beforeEach } from 'vitest';
import { useChatMessages } from '../../hooks/useChatMessages';
import { getReservationById } from '../../services/reservationService';
import { listingsService } from '../../services/listingsService';
import type { MeetupStatusResponse } from '../../types/listing';

type ChatMessagesResult = ReturnType<typeof useChatMessages>;
type SendMessageResult = ReturnType<typeof useSendMessage>;
type ReservationResult = Awaited<ReturnType<typeof getReservationById>>;
type ListingResult = Awaited<ReturnType<typeof listingsService.getById>>;

interface MeetupProposalFormMockProps {
    onSubmit: (values: {
        date: string;
        time: string;
        location: { name: string; lat: number; lng: number };
    }) => void;
    onCancel: () => void;
}

interface CheckInModalMockProps {
    meetupLocation: string;
    onClose: () => void;
}

interface MeetupCardMockProps {
    location: string;
    status: string;
    caption?: string;
    onAccept?: () => void;
    onDecline?: () => void;
    onCheckIn?: () => void;
}

const navigateMock = vi.fn();
vi.mock('react-router', async() => {
    const path = await vi.importActual<typeof import('react-router')>('react-router');
    return {
        ...path,
        useNavigate: () => navigateMock,

    };
} );

vi.mock('../../hooks/useReservationRealtime', () => ({
    useReservationRealtime: vi.fn(),
}));

vi.mock('../../services/realtime/connectionManager', () => ({
    connectionManager: {
        getState: vi.fn(() => 'Connected'),
        onStateChange: vi.fn(() => () => {}),
        markRead: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('../../hooks/useChatMessages', () => ({
    useChatMessages: vi.fn(),
}));

vi.mock('../../hooks/useSendMessage', () => ({
    useSendMessage: vi.fn(),
}));

vi.mock('../../services/reservationService', () => ({
    getReservationById: vi.fn(),
}));

vi.mock('../../store/useAuthStore', () => ({
    useAuthStore: vi.fn(() => ({
        user: {id: 'me'},
    })),
}));

vi.mock('../../services/listingsService', () => ({
    listingsService: {
        getById: vi.fn(),
        proposeMeetup: vi.fn(),
        acceptMeetup: vi.fn(),
        declineMeetup: vi.fn(),
    },
}));

vi.mock('../../components/layout/MeetupProposalForm', () => ({
    default: (props: MeetupProposalFormMockProps) => (
        <div data-testid = "meetup-proposal-form">
            <button
            onClick = {() => 
                props.onSubmit({
                    date: '2026-07-31',
                    time: '10:00',
                    location: {
                        name: 'IT-Building',
                        lat: -25.7,
                        lng: 28.6
                    },
                })
            }
            >
                Submit Proposal
            </button>
            <button onClick = {props.onCancel}>
                Cancel Proposal
            </button>
        </div>
    ),
}));

vi.mock('../../components/CheckInModal', () => ({
    default: (props:CheckInModalMockProps) => (
        <div data-testid="check-in-modal">
            <span>
                {props.meetupLocation}
            </span>
            <button onClick={props.onClose}>
                Close Check-In
            </button>
        </div>
    )
}))

vi.mock('../../components/layout/MeetupCard', () => ({
    default: (props: MeetupCardMockProps) => (
        <div data-testid="meetup-card">
            <span data-testingid="meetup-card-location">
                {props.location}
            </span>
            <span data-testingid="meetup-card-status">
                {props.status}
            </span>
            <span>
                {props.caption}
            </span>
            {props.onAccept && <button onClick={props.onAccept}>
                Accept
            </button>
            }
            {props.onDecline && <button onClick={props.onDecline}>
                Decline
            </button>
            }
            {props.onCheckIn && <button onClick={props.onCheckIn}>
                Check In
            </button>
            }
        </div>
    ),
}));

const defaultReservation: ReservationResult = {
    success: true,
    data: {
        reservationId: '123',
        listingId: 'listing-1',
        reservationStatus: 'active',
        timerStage: null,
        counterParty: {
            name: 'Mahadio Tlaka',
            initials: 'MT',
        },
    },
}as unknown as ReservationResult;

const defaultListing: ListingResult = {
    id: 'listing-1',
    title: 'Test Listing',
    price: 100,
    images: [],
} as unknown as  ListingResult;

const defaultMessages: ChatMessagesResult = {
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
}as unknown as  ChatMessagesResult;

const defaultSend: SendMessageResult = {
    send: vi.fn(),
    retry: vi.fn(),
}as unknown as SendMessageResult;

beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    navigateMock.mockClear();
    window.history.pushState({}, '', '/buyer/messages/123');

    vi.mocked(getReservationById).mockReset().mockResolvedValue(defaultReservation);
    vi.mocked(listingsService.getById).mockReset().mockResolvedValue(defaultListing);
    vi.mocked(listingsService.proposeMeetup).mockReset().mockResolvedValue(undefined as unknown as MeetupStatusResponse);
    vi.mocked(listingsService.acceptMeetup).mockReset().mockResolvedValue(undefined as unknown  as MeetupStatusResponse);
    vi.mocked(listingsService.declineMeetup).mockReset().mockResolvedValue(undefined);
    vi.mocked(useChatMessages).mockReset().mockReturnValue(defaultMessages);
    vi.mocked(useSendMessage).mockReset().mockReturnValue(defaultSend);
});


function renderWithProviders(ui: React.ReactElement, initialEntry = '/buyer/messages/123') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/buyer/messages/:reservationId" element={ui} />
          <Route path="/seller/messages/:reservationId" element={ui} />
          <Route path="/payment/meetup" element={<div>Payment Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

it('page renders without crashing or lagging', async () => {
    renderWithProviders(<ChatPage />);
    await screen.findByPlaceholderText('Type a message...');
})

describe('header and navigation', () => {
    it('renders the other persons name and initials', async () => {
        renderWithProviders(<ChatPage />);
        expect(await screen.findByText('Mahadio Tlaka')).toBeInTheDocument();
        expect(screen.getAllByText('MT').length).toBeGreaterThan(0);
    });

    it('navigates back to the messages list when the back button is clicked ', async () => {
        renderWithProviders(<ChatPage />);
        await screen.findByPlaceholderText('Type a message...');
        const backButton = document.querySelector('button.md\\:hidden') as HTMLButtonElement;
        fireEvent.click(backButton);
        expect(navigateMock).toHaveBeenCalledExactlyOnceWith('/buyer/messages');
    
    });
});

describe('sending messages', () => {
    it('disables the send button when the draft is empty', async() => {
        renderWithProviders(<ChatPage />);
        const input = await screen.findByPlaceholderText('Type a message...');
        const sendButton = input.parentElement!.querySelector('button:last-of-type') as HTMLButtonElement;
        expect(sendButton).toBeDisabled();
    });

    it('must send a message when you click the sending button', async() => {
        const sendMock = vi.fn();
        vi.mocked(useSendMessage).mockReturnValue({
            send: sendMock,
            retry: vi.fn(),
        } as unknown as SendMessageResult);

        renderWithProviders(<ChatPage />);
        const input = await screen.findByPlaceholderText('Type a message...');
        fireEvent.change(input, { target: { value: 'Enter to send' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(sendMock).toHaveBeenCalledWith('Enter to send');
    });
})

describe('loading and the error states', () => {
    it('shows a loading sign while the messages are loading', async() => {
        vi.mocked(useChatMessages).mockReturnValue({
            data: [],
            isLoading: true,
            isError: false,
            refetch: vi.fn(),
        }as unknown as ChatMessagesResult);

        renderWithProviders(<ChatPage />);
        expect(await screen.findByText('Loading messages...')).toBeInTheDocument();
    });

    it('must show the error message when the messages fail to load', async () => {
        vi.mocked(useChatMessages).mockReturnValue({
            data: [],
            isLoading: false,
            isError: true,
            refetch: vi.fn(),
        } as unknown as ChatMessagesResult);

        renderWithProviders(<ChatPage />);
        expect(await screen.findByText('Failed to load messages') ).toBeInTheDocument();
    });
});

describe('reservation meet-up flow within the chatting ', () => {
    it('must show a waiting message for the buyer when waiting for the seller to accept to the reservation', async() => {
        vi.mocked(getReservationById).mockResolvedValue({
            success: true,
            data: {
                reservationId: '123',
                listingId: 'listing-1',
                reservationStatus: 'active',
                timerStage: 'awaiting_seller',
                counterParty: {
                    name: 'Mahadio Tlaka',
                    initials: 'MT'
                },
            },
        }as ReservationResult);

        renderWithProviders(<ChatPage /> , '/buyer/messages/123');
        expect(
            await screen.findByText('Waiting for seller to accept reservation'),

        ).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Type a message...')).not.toBeInTheDocument();
    });

    /*it('must show  an accept prompt for the seller when awaiting seller acceptance', async () => {
        window.history.pushState({}, '', '/seller/messages/123');

        vi.mocked(getReservationById).mockResolvedValue({
            success: true,
            data: {
                reservationId: '123',
                listingId: 'listing-1',
                reservationStatus: 'active',
                timerStage: 'awaiting_seller',
                counterParty: { name: 'Mahadio Tlaka', initials: 'MT' },
            },
        } as ReservationResult);

        renderWithProviders(<ChatPage />, '/seller/messages/123');
        expect(
            await screen.findByText('Accept this reservation to start chatting.'),
        ).toBeInTheDocument();
    });*/

    it('must show the button that says schedule meetup for a reservation that is active', async() => {
        renderWithProviders(<ChatPage />);
        expect(await screen.findByText('SCHEDULE A MEETUP')).toBeInTheDocument();
    });

    it('must no longer show the schedule button and shows confirmation once a meetup is accepted', async () => {
        vi.mocked(useChatMessages).mockReturnValue({
            data: [
                {
                    messageType: 'meetup_response',
                    clientId: 'r1',
                    senderId: 'me',
                    content: 'Meetup accepted',
                    sentAt: new Date().toISOString(),
                    payload: { ProposalMessageId: 1, Accepted: true },
                },
            ],
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as unknown as ChatMessagesResult);

        renderWithProviders(<ChatPage />);
        const confirmedButton = await screen.findByText('Meetup confirmed');
        expect(confirmedButton).toBeDisabled();
    });

});


describe('listing summary card', () => {
    /*it('renders the listing title and price and navigates to the reservation on click', async () => {
        renderWithProviders(<ChatPage />);
        expect(await screen.findByText('Test Listing')).toBeInTheDocument();
        expect(screen.getByText('R 100')).toBeInTheDocument();

        fireEvent.click(screen.getByText('View Reservation'));
        expect(navigateMock).toHaveBeenCalledWith('/buyer/reservations/123');
    });*/

    it('does not render the listing card while the listing is unavailable', async () => {
        vi.mocked(listingsService.getById).mockResolvedValue(undefined as unknown as ListingResult);
        renderWithProviders(<ChatPage />);
        await screen.findByPlaceholderText('Type a message...');
        expect(screen.queryByText('Listing')).not.toBeInTheDocument();
    });
});

describe('the meetup proposal flow', () => {
    it('opens the proposal form and then submits a new meetup', async() => {
        renderWithProviders(<ChatPage />);
        const scheduleButton = await screen.findByText('SCHEDULE A MEETUP');
        fireEvent.click(scheduleButton);

        const form = await screen.findByTestId('meetup-proposal-form');
        fireEvent.click(within(form).getByText('Submit Proposal'));

        await waitFor(() => 
        expect(listingsService.proposeMeetup).toHaveBeenCalledWith(
            '123',
            expect.objectContaining({
                locationName: 'IT-Building',
                lat: -25.7,
                lng: 28.6,
            }),
        ),);
    });


    it('closes the proposal form on cancel', async () => {
        renderWithProviders(<ChatPage />);
        const scheduleButton = await screen.findByText('SCHEDULE A MEETUP');
        fireEvent.click(scheduleButton);

        const form = await screen.findByTestId('meetup-proposal-form');
        fireEvent.click(within(form).getByText('Cancel Proposal'));

        await waitFor(() =>
            expect(screen.queryByTestId('meetup-proposal-form')).not.toBeInTheDocument(),
        );
    });


})