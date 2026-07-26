import {render, screen, fireEvent} from '@testing-library/react';
import Wishlist from '../../pages/buyer/Wishlist';
import { useWishlist } from '../../hooks/useWishlist';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { listingsService } from '../../services/listingsService';
import { createReservation } from '../../services/reservationService';
import type React from 'react';
import type { WishlistListing, WishlistResponse } from '../../types/listing';
import { queryClient } from '../../lib/queryClient';

type WishLIstHookResult = ReturnType<typeof useWishlist>;
type ReservationResult = Awaited<ReturnType<typeof createReservation>>;

interface SummaryCardMockProps {
    label: string;
    value: string;
    icon?: React.ReactNode;

}


const navigateMock = vi.fn();
vi.mock('react-router', async () => {
    const path = await vi.importActual<typeof import ('react-router')>('react-router');
    return {
        ...path,
        useNavigate: () => navigateMock,
    };
});

vi.mock('../../hooks/useWishlist', () => ({
    useWishlist: vi.fn(),
}));

vi.mock('../../services/listingsService', () => ({
    listingsService: {
        removeFromWishlist: vi.fn(),
    },
}));

vi.mock('../../services/reservationService', () => ({
    createReservation: vi.fn(),
}));

vi.mock('../../utils/formatters', () => ({
    formatPrice: (price: number) => `R${price}`,
}));

vi.mock('../../lib/queryClient', () => ({
    queryClient: {
        setQueryData: vi.fn(),
    },
}));

vi.mock('./Reservation', () => ({
    SummaryCard: (props: SummaryCardMockProps) => (
        <div data-testid = "summary-card">
            <span>
                {props.label}
            </span>
            <span>
                {props.value}
            </span>
        </div>
    ),
}));

function makeListing(overrides: Partial<WishlistListing> ={}): WishlistListing{
    return {
        id: '10',
        title: 'Calculus ',
        image: 'https://example.com/img.jpg',
        condition: 'Good',
        category: 'Textbooks',
        price: 150,
        addedAt: '2026-07-24T10:00:00.000Z',
        status: 'live',
        sellerName: 'Sabira Kaire',
        ...overrides,
    } as unknown as WishlistListing;
}

const defaultWishlistState = {
    data: {
        listings: [],
        total: 0
    } as WishlistResponse,
    isLoading: false,
    error: null,
} as unknown as WishLIstHookResult;

beforeEach(() => {
    vi.mocked(useWishlist).mockReset().mockReturnValue(defaultWishlistState);
    vi.mocked(listingsService.removeFromWishlist).mockReset().mockResolvedValue(undefined);
    vi.mocked(createReservation).mockReset().mockResolvedValue({success: true} as unknown as ReservationResult);
    vi.mocked(queryClient.setQueryData).mockReset();
    navigateMock.mockClear();
});

function renderWishlist() {
    return render(
        <MemoryRouter>
            <Wishlist />
        </MemoryRouter>,
    );
}

function mockWishlist(
    data: {
        listings: WishlistListing[];
        total: number
} | undefined, 
  isLoading = false,
  error: Error | string | null = null) {
    vi.mocked(useWishlist).mockReturnValue({
        data,
        isLoading,
        error,
    } as unknown as WishLIstHookResult);
  }

it('shows a loading message when waiting for the wishlist to load', () => {
    mockWishlist(undefined, true, null);

    renderWishlist();
    expect(screen.getByText('Loading your wishlist....')).toBeInTheDocument();
});

it('shows an empty state when there are no listings in your wishlist ', () => {
    renderWishlist();
    expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
});

it('shows an error message when the wishlist page fails to load your wishlist', () => {
    mockWishlist(undefined, false, new Error('Network unavailable'));

    renderWishlist();
    expect(screen.getByText('Network unavailable')).toBeInTheDocument();
})

it('shows "Unknown seller" when no seller name is provided', () => {
    mockWishlist({
        listings: [makeListing({sellerName: undefined})],
        total: 150,
    });

    renderWishlist();
    expect(screen.getByText('Unknown seller')).toBeInTheDocument();
})

describe('filtering by the condition of the listing', () => {
    beforeEach(() => {
        mockWishlist({
            listings: [
                makeListing(
                    {
                        id: '1',
                        title: 'Good Item',
                        condition: 'Good'
                    }
                ),
                makeListing(
                    { 
                        id: '2', 
                        title: 'Fair Item', 
                        condition: 'Fair' 
                    }
                ),
                makeListing(
                    { 
                        id: '3', 
                        title: 'Poor Item', 
                        condition: 'Poor' 
                    }
                ),
            ],
            total: 450,
        });
    });

    it('shows all the listings conditions ', () => {
        renderWishlist();
        expect(screen.getByText('Good Item')).toBeInTheDocument();
        expect(screen.getByText('Fair Item')).toBeInTheDocument();
        expect(screen.getByText('Poor Item')).toBeInTheDocument();
    });

    it('filters down to only the selected condition', () => {
        renderWishlist();
        fireEvent.click(screen.getByText('Filter'));
        
        const fairOption = screen.getAllByText('Fair').find((el) => el.tagName === 'BUTTON')!;
        fireEvent.click(fairOption);

        expect(screen.queryByText('Good Item')).not.toBeInTheDocument();
        expect(screen.getByText('Fair Item')).toBeInTheDocument();
        expect(screen.queryByText('Poor Item')).not.toBeInTheDocument();
    });


})





