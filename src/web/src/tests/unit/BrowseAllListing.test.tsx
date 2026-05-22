import { render, screen, fireEvent, waitFor,within  } from '@testing-library/react'
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

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})
 
vi.mock('../../services/listingsService', () => ({
  listingsService: {
    getBrowseListings: vi.fn(),
  },
}))
 
vi.mock('../../utils/formatters', () => ({
  formatPrice: (price: number) => `R${price}`,
}))
  

import type { BrowseListing } from '../../types/listing'
import userEvent from '@testing-library/user-event'
 
const makeListings = (): BrowseListing[] => [
  {
    id: '1',
    title: 'Calculus Textbook',
    category: 'Textbooks',
    condition: 'Good',
    price: 200,
    module: 'WTW 158',
    image: 'calc.jpg',
  },
  {
    id: '2',
    title: 'Arduino Kit',
    category: 'Electronics',
    condition: 'Fair',
    price: 450,
    module: 'EIR 271',
    image: 'arduino.jpg',
  },
  {
    id: '3',
    title: 'Lab Goggles',
    category: 'Lab Equipment',
    condition: 'Poor',
    price: 80,
    module: 'CMY 117',
    image: 'goggles.jpg',
  },
  {
    id: '4',
    title: 'Staedtler Pens',
    category: 'Stationary',
    condition: 'Good',
    price: 50,
    module: 'General',
    image: 'pens.jpg',
  },
]
 
const renderComponent = () =>
  render(
    <MemoryRouter>
      <BrowseAllListing />
    </MemoryRouter>
  )
describe('BrowseAllListing', () => {
  beforeEach(() => {
  vi.clearAllMocks()
  })

 
  describe('Loading state', () => {
    it('shows a loading indicator while fetching', () => {
      vi.mocked(listingsService.getBrowseListings).mockImplementation(
        () => new Promise(() => {}) // never resolves
      )
      renderComponent()
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
 
    it('hides the listing grid while loading', () => {
      vi.mocked(listingsService.getBrowseListings).mockImplementation(
        () => new Promise(() => {})
      )
      renderComponent()
      expect(screen.queryByText('Calculus Textbook')).not.toBeInTheDocument()
    })
  })
 
  
  describe('Error state', () => {
    it('shows an error message when the request fails', async () => {
      vi.mocked(listingsService.getBrowseListings).mockRejectedValueOnce(new Error('Network error'))
      renderComponent()
      expect(await screen.findByText(/failed to load listings/i)).toBeInTheDocument()
    })
 
    it('does not render listings on error', async () => {
      vi.mocked(listingsService.getBrowseListings).mockRejectedValueOnce(new Error('fail'))
      renderComponent()
      await screen.findByText(/failed to load listings/i)
      expect(screen.queryByText('Calculus Textbook')).not.toBeInTheDocument()
    })
  })
 
  

})
