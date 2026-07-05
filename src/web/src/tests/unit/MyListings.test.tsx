import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MyListings from '../../pages/seller/MyListings'
import { listingsService } from '../../services/listingsService'

vi.mock('../../services/listingsService', () => ({
  listingsService: {
    getMyListings: vi.fn(),
    deleteListing: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockListings = {
  listings: [
    { id: '1', title: 'Chemistry Textbook', meta: 'CMY127 · Listed 7 May 2026', price: 250, status: 'live' as const, views: 42, imageUrl: '' },
    { id: '2', title: 'HP Laptop', meta: 'Electronics · Listed 5 May 2026', price: 4500, status: 'pending' as const, views: 25, imageUrl: '' },
    { id: '3', title: 'Geometry Set', meta: 'Stationery · Listed 4 May 2026', price: 250, status: 'draft' as const, views: 68, imageUrl: '' },
    { id: '4', title: 'Calculus Textbook', meta: 'WTW114 · Listed 3 May 2026', price: 350, status: 'rejected' as const, views: 89, imageUrl: '' },
  ],
  total: 4,
}

const renderMyListings = () => {
    render(
        <MemoryRouter>
            <MyListings />
        </MemoryRouter>
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
            expect(screen.getByText('Views')).toBeInTheDocument()
            expect(screen.getByText('Actions')).toBeInTheDocument()
            })
        })


         it('shows error message when service fails', async () => {
            vi.mocked(listingsService.getMyListings).mockRejectedValueOnce(new Error('Network error'))
            renderMyListings()
            await waitFor(() => {
            expect(screen.getByText('Failed to load listings')).toBeInTheDocument()
            })
        })

    
})

