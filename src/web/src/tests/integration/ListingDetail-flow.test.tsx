
import ListingDetail from '../../pages/buyer/ListingDetail'
import { test,vi } from 'vitest'
import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test-utils'
import { seedMockListing } from '../mocks/handlers'

import { ToastProvider } from '../../components/layout/Toast'

vi.mock('../../config', () => ({
    getApiUrl: () => 'http://localhost:5000/api',
}))

test('reserving your own listing (via direct navigation) shows an error', async () => {
    const listing = seedMockListing({ title: 'Own Listing For Sale', sellerId: 'buyer-1' })
    const user = userEvent.setup()

    render(
        <QueryClientProvider client={createTestQueryClient()}>
            <ToastProvider>
                <MemoryRouter initialEntries={[`/buyer/listings/${listing.listingId}`]}>
                    <Routes>
                        <Route path="/buyer/listings/:id" element={<ListingDetail />} />
                    </Routes>
                </MemoryRouter>
            </ToastProvider>
        </QueryClientProvider>
    )

    await screen.findByRole('heading', { name: 'Own Listing For Sale', level: 1 })
    await user.click(screen.getByRole('button', { name: /reserve this item/i }))

    await screen.findByText(/can't reserve your own listing/i)
})