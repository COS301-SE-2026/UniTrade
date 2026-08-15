import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReservationDetails from '../../pages/buyer/ReservationDetails';

import type { Reservation } from '../../types/Reservations';
import type { ListingDetail, MeetupStatusResponse } from '../../types/listing';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockShowToast = vi.fn();
vi.mock('../../components/layout/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const mockGetReservationById = vi.fn();
const mockCancelReservation = vi.fn();
vi.mock('../../services/reservationService', () => ({
  getReservationById: (...args: unknown[]) => mockGetReservationById(...args),
  cancelReservation: (...args: unknown[]) => mockCancelReservation(...args),
}));

const mockGetById = vi.fn();
const mockGetMeetupStatus = vi.fn();
vi.mock('../../services/listingsService', () => ({
  listingsService: {
    getById: (...args: unknown[]) => mockGetById(...args),
    getMeetupStatus: (...args: unknown[]) => mockGetMeetupStatus(...args),
    getReviewsForUser: vi.fn(),
  },
}));

let idCounter = 1;

const makeReservationRecord = (overrides: Partial<Reservation> = {}): Reservation => ({
  reservationId: `res-${idCounter++}`,
  listingId: `listing-${idCounter}`,
  buyerId: 'buyer-1',
  sellerId: 'seller-1',
  reservationStatus: 'active',
  timerStage: 'coordinating',
  expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  sellerAcknowledgedAt: null,
  counterParty: { userId: 'seller-1', name: 'Tafadzwa Musiiwa', initials: 'TM' },
  handoverConfirmedAt: null,
  completedAt: null,
  ...overrides,
});

const makeListingDetail = (overrides: Partial<ListingDetail> = {}): ListingDetail => ({
  id: 'listing-1',
  title: 'Software Engineering',
  description: 'A great book',
  price: 350,
  condition: 'good',
  category: 'Textbooks',
  status: 'sold',
  courseCode: 'CS101',
  courseId: 1,
  images: [],
  views: 10,
  listedAt: new Date().toISOString(),
  sellerId: 'seller-1',
  metadata: null,
  seller: {
    sellerId: 'seller-1',
    firstName: 'Tafadzwa',
    lastName: 'Musiiwa',
    fullName: 'Tafadzwa Musiiwa',
    university: 'University of Pretoria',
    activeListingCount: 5,
  },
  ...overrides,
});

const makeMeetup = (overrides: Partial<MeetupStatusResponse> = {}): MeetupStatusResponse => ({
  meetupId: 1,
  agreedLocationName: 'Library',
  agreedLatitude: 0,
  agreedLongitude: 0,
  agreedTime: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  checkinWindowClosesAt: new Date().toISOString(),
  checkInWindowOpen: true,
  buyerCheckedIn: false,
  sellerCheckedIn: false,
  paymentUnlocked: false,
  status: 'pending',
  checkinWindowOpensAt: new Date().toISOString(),
  buyerCheckedInAt: null,
  sellerCheckedInAt: null,
  ...overrides,
});

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:section/reservations/:reservationId" element={<ReservationDetails />} />
          <Route path="/:section/reservations" element={<ReservationDetails />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  idCounter = 1;
  mockGetById.mockResolvedValue(makeListingDetail());
  mockGetMeetupStatus.mockResolvedValue(makeMeetup());
});

describe('ReservationDetails - all load states', () => { //Npte to me(Tafadzwa): this might need tp change now that Didi has done all the animations
  it('shows a loading skeleton while the reservation is being fetched', () => {
    mockGetReservationById.mockReturnValue(new Promise(() => { }));
    const { container } = renderAt('/buyer/reservations/res-1');
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(2);
  });

  it('shows an error when the reservation specified is not avaiable', async () => {
    renderAt('/buyer/reservations');
    expect(await screen.findByText("Couldn't load this reservation")).toBeInTheDocument();
    expect(screen.getByText('No reservation ID provided')).toBeInTheDocument();
  });

  it('shows the returned error message when teh service function getReservationById fails', async () => {
    mockGetReservationById.mockResolvedValue({
      success: false,
      error: { code: 'not_found', status: 404, message: 'Reservation not found' },
    });
    renderAt('/buyer/reservations/res-1');

    expect(await screen.findByText('Reservation not found')).toBeInTheDocument();
    expect(mockGetReservationById).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(mockGetReservationById).toHaveBeenCalledTimes(2));
  });

  it('falls back to a generic message when the error from the APi has no specified message', async () => {
    mockGetReservationById.mockResolvedValue({
      success: false,
      error: { code: 'unknown_error', status: 500 },
    });
    renderAt('/buyer/reservations/res-1');
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('renders successfully even when fetching the listing detail throws', async () => {
    mockGetReservationById.mockResolvedValue({ success: true, data: makeReservationRecord() });
    mockGetById.mockRejectedValue(new Error('network fail'));
    renderAt('/buyer/reservations/res-1');

    expect(await screen.findByText('Untitled listing')).toBeInTheDocument();
    expect(screen.getByText(/condition: good/i)).toBeInTheDocument();
    expect(screen.getByText(/category: textbooks/i)).toBeInTheDocument();
  });
});


describe('ReservationDetails - buyer view', () => {
  it('renders listing, status, seller info, complete payment shen the buyer has successfully checked in', async () => {
    const reservation = makeReservationRecord({ reservationStatus: 'active', timerStage: 'awaiting_buyer' });
    mockGetReservationById.mockResolvedValue({ success: true, data: reservation });
    mockGetById.mockResolvedValue(makeListingDetail({ price: 350 }));
    mockGetMeetupStatus.mockResolvedValue(makeMeetup({ buyerCheckedIn: true, paymentUnlocked: true }));

    renderAt('/buyer/reservations/res-1');

    expect(await screen.findByRole('heading', { name: 'Software Engineering' })).toBeInTheDocument();
    expect(screen.getByText('R 350')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Tafadzwa Musiiwa')).toBeInTheDocument();
    expect(screen.getByText(/university of pretoria student/i)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    const completePaymentBtn = await screen.findByRole('button', { name: /complete payment/i });
    await waitFor(() => expect(completePaymentBtn).toBeEnabled());
  });
  
  /*
    it('navigates correctly from Message Seller, View Listing, Complete Payment, and View Meetup Details', async () => {
      const reservation = makeReservationRecord({
        reservationId: 'res-nav',
        listingId: 'listing-nav',
        timerStage: 'awaiting_buyer',
        counterParty: { userId: 'seller-1', name: 'Tafadzwa Musiiwa', initials: 'TM' },
      });
      mockGetReservationById.mockResolvedValue({ success: true, data: reservation });
      mockGetById.mockResolvedValue(makeListingDetail({ title: 'COS301', price: 200 }));
      mockGetMeetupStatus.mockResolvedValue(makeMeetup({ buyerCheckedIn: true, paymentUnlocked: true, status: 'accepted' }));
  
      renderAt('/buyer/reservations/res-nav');
      await screen.findByRole('heading', { name: 'COS301' });
  
      fireEvent.click(screen.getByRole('button', { name: /message seller/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/buyer/messages/res-nav', {
        state: { counterpartyName: 'Tafadzwa Musiiwa', counterpartyInitials: 'TM' },
      });
  
      fireEvent.click(screen.getByRole('button', { name: /view listing/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/buyer/listings/listing-nav');
  
      await waitFor(() => expect(screen.getByRole('button', { name: /complete payment/i })).toBeEnabled());
      fireEvent.click(screen.getByRole('button', { name: /complete payment/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/payment/meetup', {
        state: {
          reservationId: 'res-nav',
          role: 'buyer',
          counterpartyName: 'Tafadzwa Musiiwa',
          counterpartyInitials: 'TM',
          listingTitle: 'COS301',
          listingPrice: 200,
        },
      });
  
      fireEvent.click(screen.getByRole('button', { name: /view meetup details/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/payment/meetup', {
        state: {
          reservationId: 'res-nav',
          role: 'buyer',
          counterpartyName: 'Tafadzwa Musiiwa',
          listingTitle: 'COS301',
          listingPrice: 200,
        },
      });
    });
  */
  it('disables Cancel for a buyer when the timer stage is coordinating', async () => {
    mockGetReservationById.mockResolvedValue({
      success: true,
      data: makeReservationRecord({ timerStage: 'coordinating' }),
    });
    renderAt('/buyer/reservations/res-1');
    await screen.findByRole('button', { name: /^cancel$/i });
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeDisabled();
  });

  it('enables Cancel for a buyer outside coordinating and successfully cancels the reservation when used', async () => {
    mockGetReservationById.mockResolvedValue({
      success: true,
      data: makeReservationRecord({ reservationId: 'res-cancel', timerStage: 'awaiting_seller' }),
    });
    mockCancelReservation.mockResolvedValue({
      success: true,
      data: { reservationStatus: 'cancelled' },
    });
    renderAt('/buyer/reservations/res-cancel');

    const cancelBtn = await screen.findByRole('button', { name: /^cancel$/i });
    expect(cancelBtn).toBeEnabled();
    fireEvent.click(cancelBtn);

    await waitFor(() => expect(mockCancelReservation).toHaveBeenCalledWith('res-cancel'));
    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Reservation cancelled successfully.');
  });

  it('shows the release_too_early message on that cancel failure', async () => {
    mockGetReservationById.mockResolvedValue({
      success: true,
      data: makeReservationRecord({ timerStage: 'awaiting_seller' }),
    });
    mockCancelReservation.mockResolvedValue({
      success: false,
      error: { code: 'release_too_early', status: 400 },
    });
    renderAt('/buyer/reservations/res-1');

    fireEvent.click(await screen.findByRole('button', { name: /^cancel$/i }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        'error',
        'You can only cancel after 12 hours of buyer silence.',
      ),
    );
  });

  it('shows the server error message on a generic cancel failure or some fallback if an error message is not specified', async () => {
    mockGetReservationById.mockResolvedValue({
      success: true,
      data: makeReservationRecord({ timerStage: 'awaiting_seller' }),
    });
    mockCancelReservation.mockResolvedValue({
      success: false,
      error: { code: 'server_error', status: 500, message: 'Server exploded' },
    });
    renderAt('/buyer/reservations/res-1');

    fireEvent.click(await screen.findByRole('button', { name: /^cancel$/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Server exploded'));
  });
});

describe('ReservationDetails - seller view', () => {
  it('uses seller-specific labels, hides buyer-only sections', async () => {
    mockGetReservationById.mockResolvedValue({
      success: true,
      data: makeReservationRecord({
        reservationId: 'res-seller',
        timerStage: 'awaiting_seller',
        counterParty: { userId: 'buyer-1', name: 'Tafadzwa Musiiwa', initials: 'TM' },
      }),
    });
    renderAt('/seller/reservations/res-seller');

    expect(await screen.findByRole('button', { name: /message buyer/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /complete payment/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Total Sales')).not.toBeInTheDocument();
    expect(screen.getByText('Buyer rating')).toBeInTheDocument();

    const rejectBtn = screen.getByRole('button', { name: /^reject$/i });
    expect(rejectBtn).toBeEnabled();
  });

  it('shows Cancel Reservation label for a seller outside the awaiting_seller stage', async () => {
    mockGetReservationById.mockResolvedValue({
      success: true,
      data: makeReservationRecord({ timerStage: 'coordinating' }),
    });
    renderAt('/seller/reservations/res-1');
    expect(await screen.findByRole('button', { name: /cancel reservation/i })).toBeEnabled();
  });

  it('navigates to seller messages path when Message Buyer is used', async () => {
    mockGetReservationById.mockResolvedValue({
      success: true,
      data: makeReservationRecord({
        reservationId: 'res-seller-msg',
        counterParty: { userId: 'buyer-1', name: 'Tafadzwa Musiiwa', initials: 'TM' },
      }),
    });
    renderAt('/seller/reservations/res-seller-msg');

    fireEvent.click(await screen.findByRole('button', { name: /message buyer/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/seller/messages/res-seller-msg', {
      state: { counterpartyName: 'Tafadzwa Musiiwa', counterpartyInitials: 'TM' },
    });
  });
});

describe('ReservationDetails - status-driven visibility', () => {
  it('hides the countdown block and disables Cancel for a reservation that was cancelled already', async () => {
    mockGetReservationById.mockResolvedValue({
      success: true,
      data: makeReservationRecord({ reservationStatus: 'cancelled' }),
    });
    renderAt('/buyer/reservations/res-1');

    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByText(/expires in/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeDisabled();
  });

  it('hides the countdown block once the meetup is confirmed', async () => {
    mockGetReservationById.mockResolvedValue({
      success: true,
      data: makeReservationRecord({ timerStage: 'meetup_confirmed' }),
    });
    renderAt('/buyer/reservations/res-1');
    await screen.findByText('Active');
    expect(screen.queryByText(/expires in/i)).not.toBeInTheDocument();
  });

  it('shows Expired and disables Complete Payment / View Meetup Details once the reservation has expired', async () => {
    mockGetReservationById.mockResolvedValue({
      success: true,
      data: makeReservationRecord({
        timerStage: 'awaiting_buyer',
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
      }),
    });
    mockGetMeetupStatus.mockResolvedValue(makeMeetup({ buyerCheckedIn: true }));
    renderAt('/buyer/reservations/res-1');

    expect(await screen.findByText('Expired')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete payment/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /view meetup details/i })).toBeDisabled();
  });
});