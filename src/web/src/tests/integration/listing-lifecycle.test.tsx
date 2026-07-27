import { test, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test-utils'
import { resetMockListings, seedMockListing } from '../mocks/handlers'
import { useAuthStore } from '../../store/useAuthStore'
import UploadListing from '../../pages/seller/UploadListing'
import MyListings from '../../pages/seller/MyListings'
import SellerListingDetail from '../../pages/seller/SellerListingDetail'
import EditListing from '../../pages/seller/EditListing'
import { ToastProvider } from '../../components/layout/Toast'


vi.mock('../../config', () => ({
  getApiUrl: () => 'http://localhost:5000/api',
}))

function renderApp(initialRoute: string) {
    const queryClient = createTestQueryClient()
    return render(
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <MemoryRouter initialEntries={[initialRoute]}>
                    <Routes>
                        <Route path="/seller/upload" element={<UploadListing />} />
                        <Route path="/seller/listings" element={<MyListings />} />
                        <Route path="/seller/listings/:id" element={<SellerListingDetail />} />
                        <Route path="/seller/editListing/:id" element={<EditListing />} />
                    </Routes>
                </MemoryRouter>
            </ToastProvider>
        </QueryClientProvider>
    )
}

beforeEach(() => {
    resetMockListings()
    useAuthStore.setState({
        user: { id: 'seller-1', name: 'Test Seller', initials: 'TS', role: 'student' },
    })
})

afterEach(() => {
    useAuthStore.setState({ user: null })
})

test('create a draft, edit its title, then confirm the change persists', async () => {
    const user = userEvent.setup()
    renderApp('/seller/upload')

    await user.type(await screen.findByPlaceholderText('Title'), 'Calculus Textbook')
    await user.click(screen.getByRole('button', { name: /save draft/i }))

    await screen.findByRole('heading', { name: /my listings/i }, { timeout: 10000 })
    expect(screen.getByText('Calculus Textbook')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^edit$/i }))

    const titleInput = await screen.findByTestId('edit-title-input')
    await waitFor(() => expect(titleInput).toHaveValue('Calculus Textbook'))

    await user.clear(titleInput)
    await user.type(titleInput, 'Calculus Textbook - Updated')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await screen.findByRole('heading', { name: /my listings/i }, { timeout: 10000 })
    await screen.findByText('Calculus Textbook - Updated', {}, { timeout: 10000 })
})

test('view a listing then delete it, landing back on MyListings', async () => {
    const listing = seedMockListing({ title: 'Chemistry Textbook - 3rd Ed' })
    const user = userEvent.setup()

    renderApp(`/seller/listings/${listing.listingId}`)
    await screen.findByRole('heading', { name: 'Chemistry Textbook - 3rd Ed', level: 1 })

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: /delete listing/i }))
    await screen.findByRole('heading', { name: /my listings/i }, { timeout: 10000 })

    await waitFor(() => {
        expect(screen.queryByText('Chemistry Textbook - 3rd Ed')).not.toBeInTheDocument()
    })
})

test('delete a listing directly from the MyListings row', async () => {
  seedMockListing({ title: 'Geometry Set - Unopened', listingStatus: 'live' })
  const user = userEvent.setup()

  renderApp('/seller/listings')

  await screen.findByText('Geometry Set - Unopened')

  vi.spyOn(window, 'confirm').mockReturnValue(true)
  await user.click(screen.getByRole('button', { name: /delete listing/i }))  
  await waitFor(() => {
    expect(screen.queryByText('Geometry Set - Unopened')).not.toBeInTheDocument()
  })

  await waitFor(() => {
    expect(screen.getByText(/no listings found/i)).toBeInTheDocument()
  })
})

test('submit a draft listing, moving it to live', async () => {
  seedMockListing({ title: 'Molecular Biology - 6th Ed', listingStatus: 'draft' })
  const user = userEvent.setup()

  renderApp('/seller/listings')

  await screen.findByText('Molecular Biology - 6th Ed')
  await user.click(screen.getByRole('button', { name: /^submit$/i }))

  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /^submit$/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^view$/i })).toBeInTheDocument()
  })

  expect(screen.getByRole('button', { name: /drafts \(0\)/i })).toBeInTheDocument()
})
