import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BuyerDashboard from '../../pages/buyer/BuyerDashboard'
import { listingsService } from '../../services/listingsService'
import { useAuthStore } from '../../store/useAuthStore'


vi.mock('../../services/listingsService', () => ({
  listingsService: {
    getBrowseListings: vi.fn(),
  },
}))

const mockListings = {
  listings: [
    { 
      id: '1', 
      image: '', 
      title: 'Biology Textbook', 
      module: 'BIO121',
      category: 'Textbooks' as const, 
      price: 1200, 
      condition: 'Good' as const, 
      metadata: null, 
      sellerId: "1",           
      courseId: 1,    
    },
    { 
      id: '2', 
      image: '', 
      title: 'HP Laptop', 
      module: 'COS101',  
      category: 'Electronics' as const, 
      price: 4500, 
      condition: 'Good' as const, 
      metadata: null,
      sellerId: "1",
      courseId: 2,
    },
    { 
      id: '3', 
      image: '', 
      title: 'Lab Coat', 
      module: 'CHM101', 
      category: 'Lab Equipment' as const, 
      price: 350, 
      condition: 'Fair' as const, 
      metadata: null,
      sellerId: "1",
      courseId: 3,
    },
  ],
  total: 3,
};

const renderBuyerDashboard = () =>
  render(
    <MemoryRouter>
      <BuyerDashboard />
    </MemoryRouter>
  )

describe('BuyerDashboard', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: '1', name: 'Tafadzwa Mussiwa', initials: 'TM', role: 'student' }
    })
    vi.mocked(listingsService.getBrowseListings).mockResolvedValue(mockListings)
  })

  it('student dashboard appears up without crashing or lagging', () => {
    renderBuyerDashboard()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('shows the welcome message with the users name', () => {
    renderBuyerDashboard()
    expect(screen.getByText((content, element) => {
      return element?.tagName === 'H1' && content.includes('Tafadzwa')
    })).toBeInTheDocument()
  })

  it('shows all stat cards', () => {
    renderBuyerDashboard()
    expect(screen.getByText('Total Orders')).toBeInTheDocument()
    expect(screen.getByText('Total Spent')).toBeInTheDocument()
    expect(screen.getByText('Pending Collection')).toBeInTheDocument()
    expect(screen.getByText('Wishlist Items')).toBeInTheDocument()
  })

  it('shows suggested for you section', () => {
    renderBuyerDashboard()
    expect(screen.getByText('Suggested For You')).toBeInTheDocument()
  })

  it('shows recent orders section', () => {
    renderBuyerDashboard()
    expect(screen.getByText('Recent Orders')).toBeInTheDocument()
  })

  it('shows products after loading', async () => {
    renderBuyerDashboard()
    await waitFor(() => {
      expect(screen.getByText('Biology Textbook')).toBeInTheDocument()
    })
  })

})


