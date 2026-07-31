import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Reservations, { SummaryCard } from "../../pages/buyer/Reservation";
import type { ReservationListItem } from "../../types/Reservations";


const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockShowToast = vi.fn();
vi.mock('../../components/layout/useToast', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('../../config', () => ({
    getApiUrl: () => 'http://localhost:5000/api',
}));

vi.mock('../../utils/formatters', () => ({
    formatPrice: (n: number) => `R${n}`,
}));

const mockGetReservations = vi.fn();
const mockCancelReservation = vi.fn();
vi.mock('../../services/reservationService', () => ({
    getReservations: (...args: unknown[]) => mockGetReservations(...args),
    cancelReservation: (...args: unknown[]) => mockCancelReservation(...args),
}));

let idCpunter = 1;

const makeReservation = (overrides: Partial<ReservationListItem> = {}): ReservationListItem => {
    const base: ReservationListItem = {
        reservationId: `res-${idCpunter++}`,
        listingId: `listing-${idCpunter}`,
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        reservationStatus: 'active',
        timerStage: 'awaiting_seller',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hrs out
        createdAt: new Date().toISOString(),
        sellerAcknowledgedAt: null,
        handoverConfirmedAt: null,
        completedAt: null,
        counterParty: { userId: 'seller-1', name: 'Jane Seller', initials: 'JS' },
        listing: { title: 'Sample Textbook', price: 100, imagePath: '' },
        unreadCount: 0,
        lastMessagePreview: null,
        lastMessageAt: null,
    };
    return { ...base, ...overrides } as ReservationListItem;
};

const resolveReservations = (items: ReservationListItem[]) =>
    mockGetReservations.mockResolvedValue({ success: true, data: { items, hasMore: false } });

beforeEach(() => {
    vi.clearAllMocks();
    idCpunter = 1;
});

describe('SummaryCard', () => {
    it('renders the correct label, value and icon', () => {
        render(<SummaryCard label="Active reservations" value="3" icon={<span data-testid="icon" />} />);
        expect(screen.getByText('Active reservations')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
});

describe('Reservation pag', () => {
    it('shows a loading indicator when the fetching is happenign', () => {
        mockGetReservations.mockReturnValue(new Promise(() => { }));
        render(<Reservations />)
        expect(screen.getByText(/fetching listings/i)).toBeInTheDocument();
    });

    it('shows an error message and a toast when the fetch fails', async () => {
        mockGetReservations.mockResolvedValue({
            success: false,
            error: { code: 'server_error', status: 500, message: 'Could not load your reservations.' },
        });
        render(<Reservations />);
        expect(await screen.findByText('Could not load your reservations.')).toBeInTheDocument();
        expect(mockShowToast).toHaveBeenCalledWith('error', expect.any(String));
    })

    it('falls back to a default error message when an error message is not given', async () => {
        mockGetReservations.mockResolvedValue({
            success: false,
            error: { code: 'server_error', status: 500 },
        });
        render(<Reservations />);
        expect(await screen.findByText(/could not load your reservations/i)).toBeInTheDocument();
    });

    it('shows the empty state with a hint that there are no reservations to show at all', async () => {
        resolveReservations([]);
        render(<Reservations />);
        expect(await screen.findByText('No reservations found')).toBeInTheDocument();
        expect(screen.getByText(/reserve items from listings to see them here/i)).toBeInTheDocument();
        expect(mockShowToast).toHaveBeenCalledWith('success', expect.any(String));
    });
});

describe('Reservations page - list rendering', () => {
    it('renders status badnged with the correct label for all the known statuses', async () => {
        resolveReservations([
            makeReservation({ reservationStatus: 'active', listing: { title: 'COS301 Textbook', price: 50, imagePath: '' } }),
            makeReservation({ reservationStatus: 'completed', listing: { title: 'COS314 Textbook', price: 60, imagePath: '' } }),
            makeReservation({ reservationStatus: 'cancelled', listing: { title: 'COS330 Textbook', price: 70, imagePath: '' } }),
            makeReservation({ reservationStatus: 'expired', listing: { title: 'COS326 Textbooks', price: 80, imagePath: '' } }),
        ]);
        render(<Reservations />);
        await screen.findByText('COS301 Textbook');

        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Cancelled')).toBeInTheDocument();
        expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('falls back to the Expired badge for a status not known', async () => {
        resolveReservations([
            makeReservation({
                reservationStatus: 'totally_unknown',
                listing: { title: 'COS332', price: 90, imagePath: '' },
            } as unknown as Partial<ReservationListItem>),
        ]);
        render(<Reservations />);
        await screen.findByText('COS332');
        expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('shows a stage tag only for active reservations', async () => {
        resolveReservations([
            makeReservation({ reservationStatus: 'active', timerStage: 'coordinating', listing: { title: 'COS301', price: 10, imagePath: '' } }),
            makeReservation({ reservationStatus: 'completed', timerStage: 'meetup_confirmed', listing: { title: 'COS326', price: 20, imagePath: '' } }),
            makeReservation({
                reservationStatus: 'active',
                timerStage: 'some_unlisted_stage',
                listing: { title: 'CO330', price: 30, imagePath: '' },
            } as unknown as Partial<ReservationListItem>),
        ]);
        render(<Reservations />);
        await screen.findByText('COS301');

        expect(screen.getByText('Coordination pickup')).toBeInTheDocument();
        expect(screen.queryByText('Meetup scheduled')).not.toBeInTheDocument();
        expect(screen.getByText('some_unlisted_stage')).toBeInTheDocument();
    });

    it('shows the unread messages count badge when the amount of unread messages is greater than 0', async () => {
        resolveReservations([
            makeReservation({ unreadCount: 3, listing: { title: 'COS301', price: 10, imagePath: '' } }),
        ]);
        render(<Reservations />);
        await screen.findByText('COS301');
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('disabled the cancel button once the meetup is confirmed', async () => {
        resolveReservations([
            makeReservation({ timerStage: 'meetup_confirmed', listing: { title: 'COS301', price: 10, imagePath: '' } }),
        ]);
        render(<Reservations />);
        await screen.findByText('COS301');
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    })
    it('uses the placeholder image when the image path is empty', async () => {
        resolveReservations([
            makeReservation({ listing: { title: 'COS301', price: 10, imagePath: '' } }),
            makeReservation({ listing: { title: 'COS326', price: 10, imagePath: '/uploads/COS326.jpg' } }),
        ]);
        render(<Reservations />);
        await screen.findByText('COS301');

        const placeHolderImage = screen.getByAltText('COS301') as HTMLImageElement;
        expect(placeHolderImage.src).toContain('/placeholder.png');

        const realImage = screen.getByAltText('COS326') as HTMLImageElement;
        expect(realImage.src).toBe('http://localhost:5000/uploads/COS326.jpg');

    });

})

describe('Reservations page - summary counts', () => {
    it('computes all the summary counts correctly', async () => {
        resolveReservations([
            makeReservation({
                reservationStatus: 'active',
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                listing: { title: 'COS301', price: 100, imagePath: '' },
            }),
            makeReservation({
                reservationStatus: 'active',
                expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
                listing: { title: 'CO314', price: 200, imagePath: '' },
            }),
            makeReservation({
                reservationStatus: 'completed',
                listing: { title: 'COS326', price: 999, imagePath: '' },
            }),
        ]);
        render(<Reservations />);
        await screen.findByText('COS301');

        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('R300')).toBeInTheDocument();
    });
});

describe('Reservations page - sorting', () => {
    const setupThreeItems = () =>
        resolveReservations([
            makeReservation({
                listing: { title: 'COS326', price: 50, imagePath: '' },
                createdAt: new Date(Date.now() - 1000).toISOString(),
            }),
            makeReservation({
                listing: { title: 'COS301', price: 100, imagePath: '' },
                createdAt: new Date(Date.now() - 2000).toISOString(),
            }),
            makeReservation({
                listing: { title: 'COS332', price: 10, imagePath: '' },
                createdAt: new Date().toISOString(),
            }),
        ]);

    it('sorts by date added by default', async () => {
        setupThreeItems();
        render(<Reservations />);
        await screen.findByText('COS326');

        const text = document.body.textContent ?? '';
        expect(text.indexOf('COS332')).toBeLessThan(text.indexOf('COS326'));
        expect(text.indexOf('COS326')).toBeLessThan(text.indexOf('COS301'));
    });

    it('sorts by price low to high when used', async () => {
        setupThreeItems();
        render(<Reservations />);
        await screen.findByText('COS326');

        const sortToggle = screen.getByRole('button', { name: /sort by/i });
        fireEvent.click(sortToggle);
        const dropdown = sortToggle.parentElement as HTMLElement;
        fireEvent.click(within(dropdown).getByRole('button', { name: 'Price low' }));

        const text = document.body.textContent ?? '';
        expect(text.indexOf('COS332')).toBeLessThan(text.indexOf('COS326'));
        expect(text.indexOf('COS326')).toBeLessThan(text.indexOf('COS301'));
    });

    it('sorts by price high to low when used', async () => {
        setupThreeItems();
        render(<Reservations />);
        await screen.findByText('COS326');

        const sortToggle = screen.getByRole('button', { name: /sort by/i });
        fireEvent.click(sortToggle);
        const dropdown = sortToggle.parentElement as HTMLElement;
        fireEvent.click(within(dropdown).getByRole('button', { name: 'Price high' }));

        const text = document.body.textContent ?? '';
        expect(text.indexOf('COS301')).toBeLessThan(text.indexOf('COS326'));
        expect(text.indexOf('COS326')).toBeLessThan(text.indexOf('COS332'));
    });
});

describe('Reservations page - filtering', () => {
    it('filters the list down to the selected status', async () => {
        resolveReservations([
            makeReservation({ reservationStatus: 'active', listing: { title: 'COS301', price: 10, imagePath: '' } }),
            makeReservation({ reservationStatus: 'cancelled', listing: { title: 'COS341', price: 10, imagePath: '' } }),
        ]);
        render(<Reservations />);
        await screen.findByText('COS301');

        const filterToggle = screen.getByRole('button', { name: /filter/i });
        fireEvent.click(filterToggle);
        const dropdown = filterToggle.parentElement as HTMLElement;
        fireEvent.click(within(dropdown).getByRole('button', { name: 'Cancelled' }));

        expect(screen.getByText('COS341')).toBeInTheDocument();
        expect(screen.queryByText('COS301')).not.toBeInTheDocument();
    });

    it('shows a filter-specific empty message when no items match the selected status', async () => {
        resolveReservations([
            makeReservation({ reservationStatus: 'active', listing: { title: 'COS301', price: 10, imagePath: '' } }),
        ]);
        render(<Reservations />);
        await screen.findByText('COS301');

        const filterToggle = screen.getByRole('button', { name: /filter/i });
        fireEvent.click(filterToggle);
        const dropdown = filterToggle.parentElement as HTMLElement;
        fireEvent.click(within(dropdown).getByRole('button', { name: 'Completed' }));

        expect(await screen.findByText('No reservations found')).toBeInTheDocument();
        expect(screen.getByText(/there are no reservations with "completed" status/i)).toBeInTheDocument();
    });
});

describe('Reservations page - cancel flow', () => {
    it('cancels the reservation', async () => {
        mockCancelReservation.mockResolvedValue({ success: true, data: {} });
        resolveReservations([
            makeReservation({ timerStage: 'coordinating', listing: { title: 'COS301', price: 10, imagePath: '' } }),
        ]);
        render(<Reservations />);
        await screen.findByText('COS301');

        fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

        await waitFor(() => expect(mockCancelReservation).toHaveBeenCalled());
        expect(await screen.findByText('Cancelled')).toBeInTheDocument();
        expect(mockShowToast).toHaveBeenCalledWith('success', expect.any(String));
    });

    it('rolls back, shows an error toast when cancelling fails', async () => {
        mockCancelReservation.mockResolvedValue({
            success: false,
            error: { code: 'server_error', status: 500 },
        });
        resolveReservations([
            makeReservation({ timerStage: 'coordinating', listing: { title: 'COS301', price: 10, imagePath: '' } }),
        ]);
        render(<Reservations />);
        await screen.findByText('COS301');

        fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

        await waitFor(() => expect(mockCancelReservation).toHaveBeenCalled());
        expect(await screen.findByText('Active')).toBeInTheDocument();
        expect(mockShowToast).toHaveBeenCalledWith('error', expect.any(String));
    });
});

describe('Reservations page - navigation', () => {
    it('navigates to the reservation detail page when the title is clicked', async () => {
        resolveReservations([
            makeReservation({ reservationId: 'res-42', listing: { title: 'COS301', price: 10, imagePath: '' } }),
        ]);
        render(<Reservations />);
        const title = await screen.findByText('COS301');
        fireEvent.click(title);
        expect(mockNavigate).toHaveBeenCalledWith('/buyer/reservations/res-42');
    });

    it('navigates to messages with counterparty state when Message seller is used', async () => {
        resolveReservations([
            makeReservation({
                reservationId: 'res-99',
                counterParty: { userId: 'buyer-9', name: 'COS301', initials: 'TM' },
                listing: { title: 'Message Item', price: 10, imagePath: '' },
            }),
        ]);
        render(<Reservations />);
        await screen.findByText('Message Item');
        fireEvent.click(screen.getByRole('button', { name: /message seller/i }));

        expect(mockNavigate).toHaveBeenCalledWith('/buyer/messages/res-99', {
            state: { counterparty: 'COS301', counterpartyInitials: 'TM' },
        });
    });
});

