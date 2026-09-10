import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SellerListingDetail from '../../pages/seller/SellerListingDetail'
import { listingsService } from '../../services/listingsService'
import { ToastProvider } from '../../components/layout/Toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'



vi.mock('../../services/listingsService', () => ({
  listingsService: {
    getSellerListingById: vi.fn(),
    deleteListing: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
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

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false}},
})

const renderDetail = (id = '42') =>
  render(
    <MemoryRouter initialEntries={[`/seller/listings/${id}`]}>
      <QueryClientProvider client = {queryClient}>
      <ToastProvider>
      <Routes>
        <Route path="/seller/listings/:id" element={<SellerListingDetail />} />
      </Routes>
      </ToastProvider>
      </QueryClientProvider>
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



  it('renders error state when the API call fails', async () => {
    vi.mocked(listingsService.getSellerListingById).mockRejectedValue(new Error('API Error'))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/failed to load listing/i)).toBeInTheDocument()
    })
  })

  it('does not fetch listing details when id is missing', () => {
    render(<MemoryRouter initialEntries={['/seller/listings/']}>
      <Routes>
        <Route path="/seller/listings/:id" element={<SellerListingDetail />} />
      </Routes>
    </MemoryRouter>)
    expect(listingsService.getSellerListingById).not.toHaveBeenCalled()
  })

  it('changes main image when thumbnail is clicked', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByAltText('Biology Textbook 3rd Edition')).toBeInTheDocument()
    })
    const thumbnail = screen.getByAltText('thumbnail 2')
    await vi.importActual('@testing-library/react').then(async () => {
      const { fireEvent } = await import('@testing-library/react')
      fireEvent.click(thumbnail)
    })

    const mainImg = screen.getByAltText('Biology Textbook 3rd Edition')
    expect(mainImg).toHaveAttribute('src', 'https://example.com/bio2.jpg')
  })

  it('navigates back to the summary index when clicking the My Listings breadcrum link', async () => {
    const { fireEvent } = await import('@testing-library/react')
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('My Listings')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('My Listings'))
    expect(mockNavigate).toHaveBeenCalledWith('/seller/listings')
  })

  it('navigates to the edit page when edit listing button is clicked', async () => {
    const { fireEvent } = await import('@testing-library/react')
    renderDetail()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit listing/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /edit listing/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/seller/editListing/42')
  })

  it('aborts deletion silently if window popup rejected', async () => {
    const { fireEvent } = await import('@testing-library/react')
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderDetail()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete listing/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete listing/i }))
    expect(confirmSpy).toHaveBeenCalled()
    expect(listingsService.deleteListing).not.toHaveBeenCalled()
  })

  it('deleltes item record and forwards user back on successful deletion confirmation', async () => {
    const { fireEvent } = await import('@testing-library/react')
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(listingsService.deleteListing).mockResolvedValue(undefined)
    renderDetail()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete listing/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete listing/i }))
    expect(confirmSpy).toHaveBeenCalled()
    expect(listingsService.deleteListing).toHaveBeenCalledWith('42')
    await waitFor(() => {

      expect(mockNavigate).toHaveBeenCalledWith('/seller/listings')
    })
  })

  it('displays error message if delete API request fails ', async () => {
    const { fireEvent } = await import('@testing-library/react')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(listingsService.deleteListing).mockRejectedValue(new Error('API Error delete failed'))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete listing/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete listing/i }))
    await waitFor(() => {
      expect(screen.getByText(/failed to delete listing/i)).toBeInTheDocument()
    })
  })
})