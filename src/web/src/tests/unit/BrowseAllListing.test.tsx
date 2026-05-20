import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BrowseAllListing from '../../pages/buyer/BrowseAllListing'
import { listingsService } from '../../services/listingsService'

vi.mock('../../services/listingsService', () => ({
  listingsService: {
    getBrowseListings: vi.fn(),
  },
}))

const mockListings = {
  listings: [
    { id: '1', image: '', title: 'Biology Textbook', module: 'BIO121', category: 'Textbooks' as const, price: 1200, condition: 'Good' as const },
    { id: '2', image: '', title: 'HP Laptop', module: 'COS101', category: 'Electronics' as const, price: 4500, condition: 'Good' as const },
  ],
  total: 2,
}

const renderBrowseAllListing = () => {
    render(
        <MemoryRouter>
            <BrowseAllListing/>
        </MemoryRouter>
    )
  }

describe('BrowseAllListing', () => {
  beforeEach(() => {
    vi.mocked(listingsService.getBrowseListings).mockResolvedValue(mockListings)
  })

  it('shows up without lagging or crashing', async () => {
    renderBrowseAllListing()
    await waitFor(() => {
      expect(screen.getByText('Browse All Listings')).toBeInTheDocument()
    })
  })

  it('shows all category buttons', async () => {
    renderBrowseAllListing()
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument()
      
      const textbookElements = screen.getAllByText('Textbooks')
      expect(textbookElements.length).toBeGreaterThan(0)

      const electronicsElements = screen.getAllByText('Electronics')
      expect(electronicsElements.length).toBeGreaterThan(0)
    })
  })

  it('filters listings when category is clicked', async () => {
  renderBrowseAllListing()
  await waitFor(() => {
    expect(screen.getByText('Biology Textbook')).toBeInTheDocument()
  })

  const buttons = screen.getAllByRole('button', { name: 'Textbooks' })
  fireEvent.click(buttons[0])

  expect(screen.queryByText('HP Laptop')).not.toBeInTheDocument()
  expect(screen.getByText('Biology Textbook')).toBeInTheDocument()
})

  it('shows loading state initially', () => {
    renderBrowseAllListing()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

})

