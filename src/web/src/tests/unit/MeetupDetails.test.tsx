import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MeetupDetails from '../../pages/payment/MeetupDetails';
import {
  getReservationById,
  getTransactionStatus,
  createTransactionRequest,
} from '../../services/reservationService';
import { listingsService } from '../../services/listingsService';
import { connectionManager } from '../../services/realtime/connectionManager';
import { ToastProvider } from '../../components/layout/Toast';

const navigateMock = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../services/reservationService', () => ({
  getReservationById: vi.fn(),
  getTransactionStatus: vi.fn(),
  createTransactionRequest: vi.fn(),
}));

vi.mock('../../services/listingsService', () => ({
  listingsService: {
    getMeetupStatus: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock('../../services/realtime/connectionManager', () => ({
  connectionManager: {
    connect: vi.fn().mockResolvedValue(undefined),
    joinRoom: vi.fn().mockResolvedValue(undefined),
    onPaymentCompleted: vi.fn(() => vi.fn()),
    onPinGenerated: vi.fn(() => vi.fn()),
    onPinConfirmed: vi.fn(() => vi.fn()),
  },
}));

vi.mock('../../components/CheckInModal', () => ({
  default: ({ onClose, reservationId, meetupLocation }: { onClose: () => void; reservationId: string; meetupLocation: string }) => (
    <div data-testid="check-in-modal">
      <span>Checking in for {reservationId} at {meetupLocation}</span>
      <button onClick={onClose}>Close check-in</button>
    </div>
  ),
}));

vi.mock('../../components/layout/LocationPicker', () => ({
  default: () => <div data-testid="location-picker" />,
}));

function reservationFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    reservationId: 'REF441',
    listingId: '1',
    buyerId: '223',
    sellerId: '47',
    reservationStatus: 'active',
    ...overrides,
  };
}

function meetupFixture(overrides: Partial<Record<string, unknown>> = {}) {
  const now = Date.now();
  return {
    meetupId: 1,
    agreedLocationName: 'Merensky Library',
    agreedLatitude: -25.75,
    agreedLongitude: 28.23,
    agreedTime: new Date(now + 3600_000).toISOString(),
    checkinWindowOpensAt: new Date(now - 60_000).toISOString(),
    checkinWindowClosesAt: new Date(now + 60_000).toISOString(),
    checkInWindowOpen: true,
    buyerCheckedIn: false,
    sellerCheckedIn: false,
    paymentUnlocked: false,
    status: 'confirmed',
    createdAt: '2026-07-24T10:00:00.000',
    buyerCheckedInAt: '2026-07-24T10:00:00.000',
    sellerCheckedInAt: '2026-07-24T10:00:00.000',
    ...overrides,
  };
}

function listingFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: '1',
    title: 'Calculus Theory edition 2',
    price: 250,
    ...overrides,
  };
}

function renderMeetupDetails(state: Record<string, unknown> | null = { reservationId: 'REF441', role: 'buyer' }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[{ pathname: '/payment/meetup', state }]}>
          <MeetupDetails />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.mocked(getReservationById).mockReset().mockResolvedValue({
    success: true,
    data: reservationFixture(),
  } as unknown as Awaited<ReturnType<typeof getReservationById>>);
  vi.mocked(listingsService.getMeetupStatus).mockReset().mockResolvedValue(meetupFixture());
  vi.mocked(listingsService.getById).mockReset().mockResolvedValue(
    listingFixture() as unknown as Awaited<ReturnType<typeof listingsService.getById>>
  );
  vi.mocked(getTransactionStatus).mockReset().mockResolvedValue({
    success: true,
    data: { transactionId: null, transactionStatus: 'none', pinStatus: null },
  } as unknown as Awaited<ReturnType<typeof getTransactionStatus>>);
  vi.mocked(createTransactionRequest).mockReset();
  vi.mocked(connectionManager.connect).mockClear();
  vi.mocked(connectionManager.joinRoom).mockClear();
  vi.mocked(connectionManager.onPaymentCompleted).mockClear();
  vi.mocked(connectionManager.onPinGenerated).mockClear();
  vi.mocked(connectionManager.onPinConfirmed).mockClear();
  navigateMock.mockClear();
});

it('shows a fallback and navigates back when no reservationId is provided', () => {
  renderMeetupDetails(null);
  expect(
    screen.getByText(/We couldn't find the details for this meetup/i)
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Go back/i }));
  expect(navigateMock).toHaveBeenCalledWith(-1);
});

describe('buyer view', () => {
  it('shows the buyer side headers', async () => {
    renderMeetupDetails({ reservationId: 'REF441', role: 'buyer', counterpartyName: 'Langa Vakalisa' });
    expect(await screen.findByText('Langa Vakalisa')).toBeInTheDocument();
    expect(screen.getByText(/Review your transaction before completing payment/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Seller' })).toBeInTheDocument();
  });

  it('shows the check-in button and disables it while outside the check-in window', async () => {
    vi.mocked(listingsService.getMeetupStatus).mockResolvedValue(
      meetupFixture({ checkinWindowOpensAt: new Date(Date.now() + 60_000).toISOString() })
    );
    renderMeetupDetails();
    const checkInButton = await screen.findByRole('button', { name: /check in at meetup/i });
    expect(checkInButton).toBeDisabled();
  });

  it('opens CheckInModal and refetches on close', async () => {
    renderMeetupDetails();
    const checkInButton = await screen.findByRole('button', { name: /check in at meetup/i });
    fireEvent.click(checkInButton);
    expect(screen.getByTestId('check-in-modal')).toBeInTheDocument();
    vi.mocked(listingsService.getMeetupStatus).mockClear();
    fireEvent.click(screen.getByRole('button', { name: /close check-in/i }));
    expect(screen.queryByTestId('check-in-modal')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(listingsService.getMeetupStatus).toHaveBeenCalled();
    });
  });

  it('shows pay button once checked in, disabled until payment is unlocked', async () => {
    vi.mocked(listingsService.getMeetupStatus).mockResolvedValue(
      meetupFixture({ buyerCheckedIn: true, paymentUnlocked: false })
    );
    renderMeetupDetails();
    const payButton = await screen.findByRole('button', { name: /pay r250\.00/i });
    expect(payButton).toBeDisabled();
  });

  it('submits a transaction request when pay is clicked and payment is unlocked', async () => {
    vi.mocked(listingsService.getMeetupStatus).mockResolvedValue(
      meetupFixture({ buyerCheckedIn: true, paymentUnlocked: true })
    );
    vi.mocked(createTransactionRequest).mockResolvedValue({
      success: true,
      data: { sandbox_url: 'https://sandbox.payfast.co.za', fields: { amount: '250.00' } },
    } as unknown as Awaited<ReturnType<typeof createTransactionRequest>>);

    const submitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => { });
    renderMeetupDetails();
    const payButton = await screen.findByRole('button', { name: /pay r250\.00/i });
    fireEvent.click(payButton);
    await waitFor(() => {
      expect(createTransactionRequest).toHaveBeenCalledWith('REF441');
    });
    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalled();
    });
    submitSpy.mockRestore();
  });

  it('shows R- when no price is available', async () => {
    vi.mocked(listingsService.getById).mockResolvedValue(
      listingFixture({ price: undefined }) as unknown as Awaited<ReturnType<typeof listingsService.getById>>
    );
    renderMeetupDetails({ reservationId: 'REF441', role: 'buyer' });
    expect(await screen.findByText('R-')).toBeInTheDocument();
  });
});

describe('seller view', () => {
  const sellerState = { reservationId: 'REF441', role: 'seller', counterpartyName: 'Sabira Karie' };

  it('shows the seller side headers', async () => {
    renderMeetupDetails(sellerState);
    expect(await screen.findByText('Sabira Karie')).toBeInTheDocument();
    expect(screen.getByText(/Review your meetup details and confirm the transaction/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Buyer' })).toBeInTheDocument();
  });

  it('shows the check-in button before seller checks in', async () => {
    renderMeetupDetails(sellerState);
    const checkInButton = await screen.findByRole('button', { name: /check in at meetup/i });
    expect(checkInButton).toBeInTheDocument();
  });

  it('renders "Show PIN to Buyer" button and navigates to generate-pin page', async () => {
    vi.mocked(listingsService.getMeetupStatus).mockResolvedValue(meetupFixture({ sellerCheckedIn: true }));
    vi.mocked(getTransactionStatus).mockResolvedValue({
      success: true,
      data: { transactionId: '44', transactionStatus: 'completed', pinStatus: 'pending', pin: '123456' },
    } as unknown as Awaited<ReturnType<typeof getTransactionStatus>>);

    renderMeetupDetails(sellerState);
    const pinButton = await screen.findByRole('button', { name: /Show PIN to Buyer/i });
    fireEvent.click(pinButton);
    expect(navigateMock).toHaveBeenCalledWith('/payment/generate-pin', {
      state: { pin: '123456', reservationId: 'REF441' },
    });
  });

  it('shows transaction complete once the pin is confirmed', async () => {
    vi.mocked(listingsService.getMeetupStatus).mockResolvedValue(meetupFixture({ sellerCheckedIn: true }));
    vi.mocked(getTransactionStatus).mockResolvedValue({
      success: true,
      data: { transactionId: '47', transactionStatus: 'completed', pinStatus: 'confirmed' },
    } as unknown as Awaited<ReturnType<typeof getTransactionStatus>>);
    renderMeetupDetails(sellerState);
    expect(await screen.findByText('Transaction complete.')).toBeInTheDocument();
  });

  it('shows the waiting message once checked in but before payment', async () => {
    vi.mocked(listingsService.getMeetupStatus).mockResolvedValue(meetupFixture({ sellerCheckedIn: true }));
    renderMeetupDetails(sellerState);
    expect(await screen.findByText(/Waiting for the buyer to complete payment/i)).toBeInTheDocument();
  });

  it('subscribes to payment-completed events and refetches transaction statuses on match', async () => {
    let capturedHandler: ((e: { reservationId: string }) => void) | undefined;
    vi.mocked(connectionManager.onPaymentCompleted).mockImplementation((cb) => {
      capturedHandler = cb;
      return vi.fn();
    });

    renderMeetupDetails(sellerState);
    await waitFor(() => expect(connectionManager.connect).toHaveBeenCalled());
    expect(connectionManager.joinRoom).toHaveBeenCalledWith('REF441'); // fixed method name

    vi.mocked(getTransactionStatus).mockClear();
    capturedHandler?.({ reservationId: 'REF441' });
    await waitFor(() => {
      expect(getTransactionStatus).toHaveBeenCalledWith('REF441');
    });
  });
});

describe('meetup time formatting', () => {
  it('shows message when no time is available', async () => {
    vi.mocked(listingsService.getMeetupStatus).mockResolvedValue(
      meetupFixture({ agreedTime: undefined }) as unknown as Awaited<ReturnType<typeof listingsService.getMeetupStatus>>
    );
    renderMeetupDetails();
    expect(await screen.findByText('Time to be confirmed')).toBeInTheDocument();
  });

  it('shows invalid date for malformed non-empty time', async () => {
    vi.mocked(listingsService.getMeetupStatus).mockResolvedValue(
      meetupFixture({ agreedTime: 'somefake' }) as unknown as Awaited<ReturnType<typeof listingsService.getMeetupStatus>>
    );
    renderMeetupDetails();
    expect(await screen.findByText('Invalid Date')).toBeInTheDocument();
  });
});

it('renders the map when coordinates are available, and a fallback message when they are not', async () => {
  renderMeetupDetails();
  expect(await screen.findByTestId('location-picker')).toBeInTheDocument();
});

it('shows the map-unavailable message for no coordinates provided', async () => {
  vi.mocked(listingsService.getMeetupStatus).mockResolvedValue(
    meetupFixture({ agreedLatitude: undefined, agreedLongitude: undefined }) as unknown as Awaited<
      ReturnType<typeof listingsService.getMeetupStatus>
    >
  );
  renderMeetupDetails({ reservationId: 'REF441', role: 'buyer' });
  expect(await screen.findByText(/Map preview not available/i)).toBeInTheDocument();
});