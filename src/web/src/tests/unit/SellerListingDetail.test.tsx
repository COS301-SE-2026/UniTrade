import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SellerListingDetail from '../../pages/seller/SellerListingDetail'
import { listingsService } from '../../services/listingsService'


vi.mock('../../services/listingsService', () => ({
  listingsService: {
    getSellerListingById: vi.fn(),
    deleteListing: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})


const mockListing = {
  id: '42',
  title: 'Biology Textbook 3rd Edition',
  price: 350,
  condition: 'good',
  description: 'Minor highlights on pages 10-20, otherwise excellent.',
  category: 'Textbook',
  courseCode: 'BIO101',
  listedAt: '2026-05-01T10:00:00Z',
  views: 128,
  tags: ['BIO101', 'Science'],
  images: ['https://example.com/bio1.jpg', 'https://example.com/bio2.jpg'],
  status: 'live' as const,
}


const renderDetail = (id = '42') =>
  render(
    <MemoryRouter initialEntries={[`/seller/listings/${id}`]}>
      <Routes>
        <Route path="/seller/listings/:id" element={<SellerListingDetail />} />
      </Routes>
    </MemoryRouter>
  )

  describe('SellerListingDetail', () => {
    beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(listingsService.getSellerListingById).mockResolvedValue(mockListing as any)
    
  })

    it('page shows up without crashing or lagging ', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getAllByText('Biology Textbook 3rd Edition').length).toBeGreaterThan(0)
    })
  })

  it('shows a loading state initially', () => {
    renderDetail()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows the listing title', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getAllByText('Biology Textbook 3rd Edition').length).toBeGreaterThan(0)
    })
  })

  it('shows the formatted price', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/R\s?350/)).toBeInTheDocument()
    })
  })

  it('shows the listing description', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/minor highlights/i)).toBeInTheDocument()
    })
  })


  it('shows the category detail row', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Textbook')).toBeInTheDocument()
    })
  })


  it('shows the Views detail row', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Views')).toBeInTheDocument()
      expect(screen.getByText('128')).toBeInTheDocument()
    })
  })

  it('shows the Listed On detail row', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Listed On')).toBeInTheDocument()
    })
  })

  it('shows the Edit Listing action button', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit listing/i })).toBeInTheDocument()
    })
  })

  it('shows the Mark As Sold button', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark as sold/i })).toBeInTheDocument()
    })
  })

  it('shows the Save as Draft button', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save as draft/i })).toBeInTheDocument()
    })
  })

  it('renders error state when the API call fails',async () => {
    vi.mocked(listingsService.getSellerListingById).mockRejectedValue(new Error('API Error'))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/failed to load listing/i)).toBeInTheDocument()
    })
  })

  it('does not fetch listing details when id is missing',() => 
  {
    render(<MemoryRouter initialEntries={['/seller/listings/']}>
      <Routes>
        <Route path="/seller/listings/:id" element={<SellerListingDetail />} />
      </Routes>
    </MemoryRouter>)
  expect(listingsService.getSellerListingById).not.toHaveBeenCalled()
  })

  })