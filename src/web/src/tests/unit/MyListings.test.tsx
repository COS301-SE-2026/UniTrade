import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { listingsService } from '../../services/listingsService'

vi.mock('../../services/listingsService', () => ({
    listingsService: {
        getMyListings: vi.fn(),
        deleteListing: vi.fn(),
    },
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router')
    return { ...actual, useNavigate: () => mockNavigate }
})

const mockShowToast = vi.fn()
vi.mock('../../components/layout/useToast', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}))

import MyListings from '../../pages/seller/MyListings'

const mockListings = {
    listings: [
        { id: '1', title: 'Chemistry Textbook', meta: 'CMY127 · Listed 7 May 2026', price: 250, status: 'live' as const, views: 42, imageUrl: '', categoryName: '' },
        { id: '2', title: 'HP Laptop', meta: 'Electronics · Listed 5 May 2026', price: 4500, status: 'pending' as const, views: 25, imageUrl: '',categoryName: '' },
        { id: '3', title: 'Geometry Set', meta: 'Stationery · Listed 4 May 2026', price: 250, status: 'draft' as const, views: 68, imageUrl: '',categoryName: '' },
        { id: '4', title: 'Calculus Textbook', meta: 'WTW114 · Listed 3 May 2026', price: 350, status: 'rejected' as const, views: 89, imageUrl: '',categoryName: '' },
    ],
    total: 4,
}

const renderMyListings = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })
    render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <MyListings />
            </MemoryRouter>
        </QueryClientProvider>
    )
}

describe('MyListings', () => {

    beforeEach(() => {
        vi.mocked(listingsService.getMyListings).mockResolvedValue(mockListings)
    })

    it('the pages appears without crashing or lagging ', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('My Listings')).toBeInTheDocument()
        })
    })

    it('shows the page heading and subtitle', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('My Listings')).toBeInTheDocument()
        })
    })

    it('shows loading state initially', () => {
        renderMyListings()
        expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('shows Total Listings stat card', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Total Listings')).toBeInTheDocument()
        })

    })

    it('shows Live stat card', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getAllByText('Live').length).toBeGreaterThan(0)
        })
    })

    it('shows Pending Review stat card', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getAllByText('Pending Review').length).toBeGreaterThan(0)
        })
    })

    it('shows Drafts stat card', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getAllByText('Drafts').length).toBeGreaterThan(0)
        })
    })

    it('shows all the filter tabs', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /^live/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /^pending/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /^drafts/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /^rejected/i })).toBeInTheDocument()

        })
    })


    it('filters to live listings when Live tab is clicked', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Chemistry Textbook')).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole('button', { name: /^live/i }))
        expect(screen.getByText('Chemistry Textbook')).toBeInTheDocument()
        expect(screen.queryByText('HP Laptop')).not.toBeInTheDocument()
    })

    it('filters to draft listings when Drafts tab is clicked', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Geometry Set')).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole('button', { name: /^drafts/i }))
        expect(screen.getByText('Geometry Set')).toBeInTheDocument()
        expect(screen.queryByText('Chemistry Textbook')).not.toBeInTheDocument()
    })


    it('shows all listing titles', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Chemistry Textbook')).toBeInTheDocument()
            expect(screen.getByText('HP Laptop')).toBeInTheDocument()
            expect(screen.getByText('Geometry Set')).toBeInTheDocument()
            expect(screen.getByText('Calculus Textbook')).toBeInTheDocument()
        })
    })

    it('shows table column headers', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Listing')).toBeInTheDocument()
            expect(screen.getByText('Price')).toBeInTheDocument()
            expect(screen.getByText('Status')).toBeInTheDocument()
            expect(screen.getByText('Actions')).toBeInTheDocument()
        })
    })


    it('shows error message when service fails', async () => {
        vi.mocked(listingsService.getMyListings).mockRejectedValueOnce(new Error('Network error'))
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument()
        })
    })


})

describe('MyListings - actions', () => {
    beforeEach(() => {
        vi.mocked(listingsService.getMyListings).mockResolvedValue(mockListings)
        mockNavigate.mockClear()
    })

    it('navigates to upload page when new listing is clicked', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Chemistry Textbook')).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole('button', { name: /new listing/i }))
        expect(mockNavigate).toHaveBeenCalledWith('/seller/upload')
    })

    it('naviagtes to the listing detail page whe  view is clicked', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Chemistry Textbook')).toBeInTheDocument()
        })
        const viewButtons = screen.getAllByRole('button', { name: /^view$/i })
        fireEvent.click(viewButtons[0])
        expect(mockNavigate).toHaveBeenCalledWith('/seller/listings/1')
    })

    it('navigates to edit page when Edit is clicked', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('HP Laptop')).toBeInTheDocument()
        })
        const editButtons = screen.getAllByRole('button', { name: /^edit$/i })
        fireEvent.click(editButtons[1])
        expect(mockNavigate).toHaveBeenCalledWith('/seller/editListing/2')
    })

    it('renders Submit and Edit for draft listings, and naviagtes when edit is clicked', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Geometry Set')).toBeInTheDocument()
        })
        expect(screen.getByRole('button', { name: /^submit$/i })).toBeInTheDocument()
        const editButtons = screen.getAllByRole('button', { name: /^edit$/i })
        fireEvent.click(editButtons[2])
        expect(mockNavigate).toHaveBeenCalledWith('/seller/editListing/3')
    })

    it('renders Resubmit and Edit for rejected listings, and navigates on Edit', async () => {
        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Calculus Textbook')).toBeInTheDocument()
        })
        expect(screen.getByRole('button', { name: /^resubmit$/i })).toBeInTheDocument()
        const editButtons = screen.getAllByRole('button', { name: /^edit$/i })
        fireEvent.click(editButtons[3])
        expect(mockNavigate).toHaveBeenCalledWith('/seller/editListing/4')
    })

    it('deletes a listing when confirmed', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        vi.mocked(listingsService.deleteListing).mockResolvedValue(undefined)

        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Chemistry Textbook')).toBeInTheDocument()
        })

        const deleteButtons = screen.getAllByLabelText('Delete listing')
        fireEvent.click(deleteButtons[0])

        await waitFor(() => {
            expect(listingsService.deleteListing).toHaveBeenCalledWith('1')
        })
        await waitFor(() => {
            expect(screen.queryByText('Chemistry Textbook')).not.toBeInTheDocument()
        })
        expect(screen.getByText('3')).toBeInTheDocument() // total decremented from 4 to 3

        vi.restoreAllMocks()
    })



    it('shows an error when deleting a listing fails', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        vi.mocked(listingsService.deleteListing).mockRejectedValue(new Error('fail'))

        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Chemistry Textbook')).toBeInTheDocument()
        })

        const deleteButtons = await screen.findAllByRole('button', { name: /delete listing/i })
        fireEvent.click(deleteButtons[0])

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith('error', 'Failed to delete Listing')
        })

        vi.restoreAllMocks()
    })

    it('shows "No listings found" when a filter has no matches', async () => {
        const listingsWithNoRejected = {
            listings: mockListings.listings.filter((l) => l.status !== 'rejected'),
            total: 3,
        }
        vi.mocked(listingsService.getMyListings).mockResolvedValue(listingsWithNoRejected)

        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Chemistry Textbook')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByRole('button', { name: /^rejected/i }))
        expect(screen.getByText('No listings found.')).toBeInTheDocument()
    })

    it('paginates when there are more than PAGE_SIZE listings', async () => {
        const manyListings = {
            listings: Array.from({ length: 8 }, (_, i) => ({
                id: String(i + 1),
                title: `Listing ${i + 1}`,
                meta: 'Category · Listed today',
                price: 100,
                status: 'live' as const,
                views: i,
                imageUrl: '',
                categoryName: '',
            })),
            total: 8,
        }
        vi.mocked(listingsService.getMyListings).mockResolvedValue(manyListings)

        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Listing 1')).toBeInTheDocument()
        })
        expect(screen.getByText('Listing 6')).toBeInTheDocument()
        expect(screen.queryByText('Listing 7')).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: '2' }))

        expect(screen.getByText('Listing 7')).toBeInTheDocument()
        expect(screen.getByText('Listing 8')).toBeInTheDocument()
        expect(screen.queryByText('Listing 1')).not.toBeInTheDocument()
    })

    it('resets to page 1 when switching filter tabs', async () => {
        const manyListings = {
            listings: Array.from({ length: 8 }, (_, i) => ({
                id: String(i + 1),
                title: `Listing ${i + 1}`,
                meta: 'Category · Listed today',
                price: 100,
                status: 'live' as const,
                views: i,
                imageUrl: '',
                categoryName: ''
            })),
            total: 8,
        }
        vi.mocked(listingsService.getMyListings).mockResolvedValue(manyListings)

        renderMyListings()
        await waitFor(() => {
            expect(screen.getByText('Listing 1')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByRole('button', { name: '2' }))
        expect(screen.getByText('Listing 7')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: /^all$/i }))
        expect(screen.getByText('Listing 1')).toBeInTheDocument()
    })
})

