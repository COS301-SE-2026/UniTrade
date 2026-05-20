import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BrowseAllListing from './BrowseAllListing'
import { listingsService } from '../../services/listingsService'

vi.mock('../../services/listingsService', () => ({
  listingsService: {
    getBrowseListings: vi.fn(),
  },
}))

const mockListings = {
  listings: [
    { id: '1', image: '', title: 'Biology Textbook', module: 'BIO121', category: 'Textbooks', price: 1200, condition: 'Good' as const },
    { id: '2', image: '', title: 'HP Laptop', module: 'COS101', category: 'Electronics', price: 4500, condition: 'Good' as const },
  ],
  total: 2,
}

const renderBrowseAllListing = () => {
    render(
        <MemoryRouter>
            <BrowseAllListing/>
        </MemoryRouter>
    )

describe('BrowseAllListing', () => {

})}