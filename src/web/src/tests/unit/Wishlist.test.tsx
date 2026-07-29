import {render, screen, fireEvent, findByText} from '@testing-library/react';
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
    expect(screen.getByText('Loading wishlist...')).toBeInTheDocument();
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

describe ('reserving a listing', () => {
    beforeEach(() => {
        mockWishlist({
            listings: [makeListing ({id:'10'})],
            total :150,
        })
    })

    it('navigates to reservation on a successful reserve', async() => {
        vi.mocked(createReservation).mockResolvedValueOnce({success: true} as unknown as ReservationResult);
        renderWishlist();

        fireEvent.click(screen.getByRole('button', { name: /reserve/i }));
        await vi.waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/buyer/reservations');
        })

    })

    it('shows a self-reserve error message', async () =>
    {
        vi.mocked(createReservation).mockResolvedValueOnce({
            success: false,
            error: { code: 'self_reserve'},
        }as unknown as ReservationResult);
        renderWishlist();

        fireEvent.click(screen.getByRole('button', {name: /reserve/i }));

        expect(await screen.findByText('You cant reserve your own listing.')).toBeInTheDocument();
    });

    it('shows an already-reserved error message', async () => {
        vi.mocked(createReservation).mockResolvedValueOnce({
                  success: false,
            error: { code: 'already_reserved'},
        }as unknown as ReservationResult);
        renderWishlist();

        fireEvent.click(screen.getByRole('button', { name: /reserve/i }))

        expect(
            await screen.findByText('Sorry, This Item has already been reserved by someone else'),).toBeInTheDocument();
        })

        it('shows the server-provided message for an unrecognised error code', async() =>{
            vi.mocked(createReservation).mockResolvedValueOnce({
                success: false,
                error: {
                    code: 'weird_error', message: 'Something unexpected happened'},

                }as unknown as ReservationResult);
        renderWishlist();

        fireEvent.click(screen.getByRole('button', { name: /reserve/i }))
        expect(await screen.findByText('Something unexpected happened')).toBeInTheDocument();
            })
        it('falls back to a generic message when no error message is provided', async ()=>{
vi.mocked(createReservation).mockResolvedValueOnce({
  success: false,
                error: {
                    code: 'weird_error'},

                }as unknown as ReservationResult);
        renderWishlist();
 fireEvent.click(screen.getByRole('button', { name: /reserve/i }))
        expect(await screen.findByText('Could not reserve this item.')).toBeInTheDocument();
            })
        });


    it('disables the reservation button and shows "Unavailable" for a non-live listing', () =>{
     mockWishlist({
            listings: [makeListing ({id:'10', status:'reserved'})],
            total :150,
        })
        renderWishlist();
        const reserveButton = screen.getByRole('button', {name: /unavailable/i})
        expect(reserveButton).toBeDisabled();
    })

    describe('removing a listing', () => {
        it('calls removeFromWishlist and updates the cache on success', async() =>{
            mockWishlist({
                listings: [makeListing({
                    id: '10'})],
                    total : 150,
            })
            renderWishlist();

            fireEvent.click(screen.getByRole('button', { name: /remove/i}))
            await vi. waitFor(() => {
               expect(listingsService.removeFromWishlist).toHaveBeenCalledWith('10');
            })
            expect(queryClient.setQueryData).toHaveBeenCalledWith(
                ['wishlist'],
                expect.any(Function),
            );

            const updater = vi.mocked(queryClient.setQueryData).mock.calls[0][1] as (
                old: WishlistResponse | undefined,
            ) => WishlistResponse | undefined;

            const before: WishlistResponse = {
                listings: [makeListing({ id: '10'}), makeListing({ id: '11'})],
                total: 2,
            };
            const after = updater(before);
        expect(after?.listings.map((l) => l.id)).toEqual(['11'])
    expect(after?.total).toBe(1);
expect(updater(undefined)).toBeUndefined();
        })

        it('resets the removing state without removing the item when the request fails', async() => {
            vi.mocked(listingsService.removeFromWishlist).mockRejectedValueOnce(new Error('boom'));
            mockWishlist({
                listings: [makeListing({ id: '10'})],
                total: 150,
            })
            renderWishlist();
            fireEvent.click(screen.getByRole('button', {name: /remove/i}))
            await vi.waitFor(() =>
            {
                expect(screen.getByRole('button', {name: /^remove$/i})).not.toBeDisabled();
            });
            expect(queryClient.setQueryData).not.toHaveBeenCalled();
        })
        })      

    it('navigates to the listing detail page when the image is clicked', () => {
        mockWishlist({
            listings: [makeListing({ id: '10'})],
            total: 150,
        });
        renderWishlist();

        fireEvent.click(screen.getByAltText('Calculus'));
        expect(navigateMock).toHaveBeenCalledWith('/listings/10');
    });

      describe('sorting', () => {
        beforeEach(() => {
            mockWishlist({
                listings: [
                    makeListing({ id: '47', title: 'ListA', price: 300, addedAt: '2026-07-04'}),
                    makeListing({ id: '49', title: 'ListB', price: 100, addedAt: '2026-07-17'}),
                    makeListing({ id: '51', title: 'ListC', price: 200, addedAt: '2026-07-14'}),
                ],
                total: 600,
            })
        })

        function titleOrder() {
            return screen.getAllByText(/^(ListA|ListB|ListC)$/).map((el) => el.textContent);
        }

        it('sorts by price, low to high', () => {
            renderWishlist();
            fireEvent.click(screen.getByText(/sort by/i));
            fireEvent.click(screen.getByText('Price low'));

            expect(titleOrder()).toEqual(['ListB','ListC','ListA']);
        })
        
        it('sorts by price, high to low', () => {
            renderWishlist();
            fireEvent.click(screen.getByText(/sort by/i));
            fireEvent.click(screen.getByText('Price high'));

            expect(titleOrder()).toEqual(['ListA','ListC','ListB']);
        })
        
        it('sorts by date added,most recent first', () => {
            renderWishlist();
            fireEvent.click(screen.getByText(/sort by/i));
            fireEvent.click(screen.getByText('Date added'));

            expect(titleOrder()).toEqual(['ListB','ListC','ListA']);
        })

        it('closes the sort dropdown after selecting an option', () => {
            renderWishlist();
            fireEvent.click(screen.getByText(/sort by/i));
            fireEvent.click(screen.getByText('Price low'));

            expect(screen.queryByText('Price high')).not.toBeInTheDocument();
            
        })
    })

  














