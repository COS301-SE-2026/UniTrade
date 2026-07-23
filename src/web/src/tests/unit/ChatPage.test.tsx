import { render, screen, fireEvent} from '@testing-library/react';
import { MemoryRouter, Routes, Route} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, it, expect, describe} from 'vitest';
import ChatPage from '../../pages/chat/ChatPage';
import { useSendMessage } from '../../hooks/useSendMessage';
import { beforeEach } from 'vitest';
import { useChatMessages } from '../../hooks/useChatMessages';


const navigateMock = vi.fn();
vi.mock('react-router-dom', async() => {
    const path = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...path,
        useNavigate: () => navigateMock,

    };
} );

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  navigateMock.mockClear();
});

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
    useChatMessages: vi.fn(() => ({
        data: [],
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    })),
}));

vi.mock('../../hooks/useSendMessage', () => ({
    useSendMessage: vi.fn(() => ({
        send: vi.fn(),
        retry: vi.fn()
    })),
}));

vi.mock('../../services/reservationService', () => ({
    getReservationById: vi.fn().mockResolvedValue({
        success: true,
    data: 
    { 
        reservationId: '123', 
        listingId: 'listing-1',
        reservationStatus: 'active',
        timerStage: null,
        counterParty: {
            name: 'Mahadio Tlaka',
            initials: 'MT'
        },
    },
    }),
}));

vi.mock('../../store/useAuthStore', () => ({
    useAuthStore: vi.fn(() => ({
        user: {id: 'me'},
    })),
}));

vi.mock('../../services/listingsService', () => ({
    listingsService: {
        getById: vi.fn().mockResolvedValue({
            id: 'listing-1',
            title: 'Test Listing',
            price: 100,
            images: [],
        }),
        proposeMeetup: vi.fn().mockResolvedValue(undefined),
        acceptMeetup: vi.fn().mockResolvedValue(undefined),
        declineMeetup: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('../../components/layout/MeetupProposalForm', () => ({
    default: (props: any) => (
        <div data-testingid = "meetup-proposal-form">
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
    default: (props:any) => (
        <div data-testingid="check-in-modal">
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
    default: (props: any) => (
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


function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/buyer/messages/123']}>
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
        } as any);

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
        }as any);

        renderWithProviders(<ChatPage />);
        expect(await screen.findByText('Loading messages...')).toBeInTheDocument();
    });

    it('must show the error message when the messages fail to load', async () => {
        vi.mocked(useChatMessages).mockReturnValue({
            data: [],
            isLoading: false,
            isError: true,
            refetch: vi.fn(),
        } as any);

        renderWithProviders(<ChatPage />);
        expect(await screen.findByText('Failed to load messages') ).toBeInTheDocument();
    });
});