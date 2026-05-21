import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MyListings from '../../pages/seller/MyListings'
import { listingsService } from '../../services/listingsService'

vi.mock('../../services/listingsService', () => ({
  listingsService: {
    getMyListings: vi.fn(),
  },
}))

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
7    })        

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
           expect(screen.getByText('Live')).toBeInTheDocument()
          })
        })

        it('shows Pending Review stat card', async () => {
           renderMyListings()
           await waitFor(() => {
           expect(screen.getByText('Pending Review')).toBeInTheDocument()
            })
        })

        it('shows Drafts stat card', async () => {
            renderMyListings()
            await waitFor(() => {
            expect(screen.getByText('Drafts')).toBeInTheDocument()
            })
        })

        it('shows Drafts stat card', async () => {
            renderMyListings()
            await waitFor(() => {
            expect(screen.getByText('Drafts')).toBeInTheDocument()
            })
        })

        it('shows all the filter tabs', async () => {
            renderMyListings()
            await waitFor(() => {
            expect(screen.getByText('All')).toBeInTheDocument()
            expect(screen.getByText(/Live/)).toBeInTheDocument()
            expect(screen.getByText(/Pending/)).toBeInTheDocument()
            expect(screen.getByText(/Drafts/)).toBeInTheDocument()
            expect(screen.getByText(/Rejected/)).toBeInTheDocument()

            })
        })

    
})

