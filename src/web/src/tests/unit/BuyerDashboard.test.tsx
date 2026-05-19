import {render , screen } from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import { describe, it, expect, vi, beforeEach} from 'vitest'
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
    { id: '1', image: '', title: 'Biology Textbook', module: 'BIO121', category: 'Textbooks', price: 1200, condition: 'Good' as const },
    { id: '2', image: '', title: 'HP Laptop', module: 'COS101', category: 'Electronics', price: 4500, condition: 'Good' as const },
    { id: '3', image: '', title: 'Lab Coat', module: 'CHM101', category: 'Lab Equipment', price: 350, condition: 'Fair' as const },
  ],
  total: 3,
}

const renderBuyerDashboard = () =>
    render (
        <MemoryRouter>
        <BuyerDashboard />
        </MemoryRouter>
    )

describe('BuyerDashboard', () => {
    
})


