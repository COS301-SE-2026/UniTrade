import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { listingsService } from '../../services/listingsService'
import type { BrowseListing } from '../../types/listing'

const { mockCategories } = vi.hoisted(() => ({
  mockCategories: [
    { id: 1, name: 'book' },
    { id: 5, name: 'clothing' },
    { id: 2, name: 'electronics' },
    { id: 4, name: 'furniture' },
    { id: 6, name: 'other' },
    { id: 3, name: 'stationery' },
  ],
}))

vi.mock('../../services/listingsService', () => ({
  listingsService: {
    getBrowseListings: vi.fn(),
    getListingsCategories: vi.fn(),
  },
}))

vi.mock('../../utils/formatters', () => ({
  formatPrice: (price: number) => `R${price}`,
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})
const mockShowToast = vi.fn()
vi.mock('../../components/layout/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));  

import BrowseAllListing from '../../pages/buyer/BrowseAllListing'
import { QueryClient } from '@tanstack/react-query'

const renderComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BrowseAllListing />
      </MemoryRouter>
    </QueryClientProvider>
  )
}
const makeListings = (): BrowseListing[] => [
  {
    id: '1',
    title: 'Calculus Textbook',
    category: 'book',
    condition: 'Good',
    price: 200,
    module: 'WTW 158',
    image: 'calc.jpg',
    courseId: 123,
    metadata: null,
    sellerId: "1",
  },
  {
    id: '2',
    title: 'Arduino Kit',
    category: 'electronics',
    condition: 'Fair',
    price: 450,
    module: 'EIR 271',
    image: 'arduino.jpg',
    courseId: 456,
    metadata: null,
    sellerId: "1",
  },
  {
    id: '3',
    title: 'Lab Goggles',
    category: 'other',
    condition: 'Poor',
    price: 80,
    module: 'CMY 117',
    image: 'goggles.jpg',
    courseId: 789,
    sellerId: "1",
    metadata: null,
  },
  {
    id: '4',
    title: 'Staedtler Pens',
    category: 'stationery',
    condition: 'Good',
    price: 50,
    module: 'General',
    image: 'pens.jpg',
    courseId: 101,
    metadata: null,
    sellerId: "1",
  },
];



describe('BrowseAllListing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // category fetch is non-critical to most tests; default to a resolved value
    // so it doesn't hang or throw unless a test overrides it
    vi.mocked(listingsService.getListingsCategories).mockResolvedValue(mockCategories)
  })

  describe('Loading state', () => {
    it('shows a loading indicator while fetching', () => {
      vi.mocked(listingsService.getBrowseListings).mockImplementation(
        () => new Promise(() => { }) // never resolves
      )
      renderComponent()
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('hides the listing grid while loading', () => {
      vi.mocked(listingsService.getBrowseListings).mockImplementation(
        () => new Promise(() => { })
      )
      renderComponent()
      expect(screen.queryByText('Calculus Textbook')).not.toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    it('shows an error message when the request fails', async () => {
      vi.mocked(listingsService.getBrowseListings).mockRejectedValueOnce(new Error('Network error'))
      renderComponent()
      expect(await screen.findByText('Network error')).toBeInTheDocument()
    })

    it('does not render listings on error', async () => {
      vi.mocked(listingsService.getBrowseListings).mockRejectedValueOnce(new Error('fail'))
      renderComponent()
      await screen.findByText('fail')
      expect(screen.queryByText('Calculus Textbook')).not.toBeInTheDocument()
    })
  })

  describe('Successful render', () => {
    beforeEach(() => {
      vi.mocked(listingsService.getBrowseListings).mockResolvedValue({
        listings: makeListings(),
        total: 4,
      })
    })

    it('renders the page heading', async () => {
      renderComponent()
      expect(await screen.findByRole('heading', { name: /browse all listings/i })).toBeInTheDocument()
    })

    it('displays the total listing count from the API', async () => {
      renderComponent()
      expect(await screen.findByText(/4 listings available/i)).toBeInTheDocument()
    })

    it('renders a card for every listing', async () => {
      renderComponent()
      await screen.findByText('Calculus Textbook')
      expect(screen.getByText('Arduino Kit')).toBeInTheDocument()
      expect(screen.getByText('Lab Goggles')).toBeInTheDocument()
      expect(screen.getByText('Staedtler Pens')).toBeInTheDocument()
    })

    it('formats prices via formatPrice', async () => {
      renderComponent()
      await screen.findByText('R200')
      expect(screen.getByText('R450')).toBeInTheDocument()
    })

    it('renders Reserve and Add to Wishlist buttons for each card', async () => {
      renderComponent()
      await screen.findByText('Calculus Textbook')
      expect(screen.getAllByRole('button', { name: /add to wishlist/i })).toHaveLength(4)
    })

    it('renders condition badges with correct text', async () => {
      renderComponent()
      await screen.findByText('Calculus Textbook')

      const grid = screen.getByRole('img', { name: 'Calculus Textbook' }).closest('.grid') as HTMLElement

      const badges = within(grid).getAllByText(/Good|Fair|Poor/)
      const badgeTexts = badges.map(b => b.textContent)

      expect(badgeTexts.filter(t => t === 'Good')).toHaveLength(2)
      expect(badgeTexts).toContain('Fair')
      expect(badgeTexts).toContain('Poor')
    })

    it('renders all category filter buttons', async () => {
      renderComponent()
      await screen.findByText('Calculus Textbook')
      // category chips load async from getListingsCategories, so wait for one to appear
      await screen.findByRole('button', { name: 'Textbooks' })
      for (const cat of ['All', 'Textbooks', 'Clothing', 'Electronics', 'Furniture','Stationery', 'Other']) {
        expect(screen.getByRole('button', { name: cat })).toBeInTheDocument()
      }
    })

    it('renders the condition and sort dropdowns', async () => {
      renderComponent()
      await screen.findByText('Calculus Textbook')
      expect(screen.getByDisplayValue('All conditions')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Newest')).toBeInTheDocument()
    })
  })

  describe('Category filtering', () => {
    beforeEach(() => {
      vi.mocked(listingsService.getBrowseListings).mockResolvedValue({
        listings: makeListings(),
        total: 4,
      })
    })

    it('"All" is active by default', async () => {
      renderComponent()
      await screen.findByText('Calculus Textbook')
      // all 4 listings visible
      expect(screen.getAllByRole('button', { name: /reserve/i })).toHaveLength(4)
    })

    it('filters to book only', async () => {
      renderComponent()
      await screen.findByText('Calculus Textbook')
      await userEvent.click(await screen.findByRole('button', { name: 'Textbooks' }))
      expect(screen.getByText('Calculus Textbook')).toBeInTheDocument()
      expect(screen.queryByText('Arduino Kit')).not.toBeInTheDocument()
    })

    it('filters to electronics only', async () => {
      renderComponent()
      await screen.findByText('Calculus Textbook')
      await userEvent.click(await screen.findByRole('button', { name: 'Electronics' }))
      expect(screen.getByText('Arduino Kit')).toBeInTheDocument()
      expect(screen.queryByText('Calculus Textbook')).not.toBeInTheDocument()
    })

    it('clicking All after a filter restores all listings', async () => {
      renderComponent()
      await screen.findByText('Calculus Textbook')
      await userEvent.click(await screen.findByRole('button', { name: 'Textbooks' }))
      await userEvent.click(screen.getByRole('button', { name: 'All' }))
      expect(screen.getAllByRole('button', { name: /reserve/i })).toHaveLength(4)
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      vi.mocked(listingsService.getBrowseListings).mockResolvedValue({
        listings: makeListings(),
        total: 4,
      })
    })

    it('navigates to the listing detail page when the image is clicked', async () => {
      renderComponent()
      await screen.findByText('Calculus Textbook')
      await userEvent.click(screen.getByAltText('Calculus Textbook'))
      expect(mockNavigate).toHaveBeenCalledWith('/buyer/listings/1')
    })
  })
})
