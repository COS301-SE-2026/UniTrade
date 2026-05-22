import { render, screen, fireEvent, waitFor} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EditListing from '../../pages/seller/EditListing'
import { listingsService } from '../../services/listingsService'


vi.mock('../../services/listingsService', () => ({
  listingsService: {
    getById: vi.fn(),
    updateListing: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../assets/bio-textbook.jpg', () => ({ default: 'bio-textbook.jpg' }))


const mockApiListing = {
  title: 'Financial Economics and Statistics 16th Edition',
  description: 'Very good condition, no highlights.',
  price: 500,
  condition: 'good',
  courseCode: 'ECO301',
  images: [{ url: '' }],
}


const renderEditListing = () =>
    render(
        <MemoryRouter initialEntries={['/seller/editListing/1']}>
            <Routes>
                <Route path="/seller/editListing/:id" element={<EditListing />} />
            </Routes>
        </MemoryRouter>
    )

    describe('EditListing', () => {
        beforeEach(() => {
            vi.clearAllMocks()
            vi.mocked(listingsService.getById).mockResolvedValue(mockApiListing as any)
        })

        it('shows up without lagging or crashing', async () =>{
            renderEditListing();
            await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
        })

        it('shows the Edit Listing heading', async () => {
            renderEditListing();
            await waitFor(() => {
                expect(screen.getByText('Edit Listing')).toBeInTheDocument()
            })
        })

        it('shows all 4 steps', async () => {
            renderEditListing()
            await waitFor(() => {
                expect(screen.getByText('Step 1: Basic Information')).toBeInTheDocument()
                expect(screen.getByText('Step 2: Pictures')).toBeInTheDocument()
                expect(screen.getByText('Step 3: Price')).toBeInTheDocument()
                expect(screen.getByText('Step 4: Confirmation')).toBeInTheDocument()
            })
        })

        it('shows the category buttons', async () => {
            renderEditListing()
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /textbook/i })).toBeInTheDocument()
                expect(screen.getByRole('button', { name: /electronics/i })).toBeInTheDocument()
                expect(screen.getByRole('button', { name: /furniture/i })).toBeInTheDocument()
                expect(screen.getByRole('button', { name: /other/i })).toBeInTheDocument()
            })
        })

        it('shows the pre-filled title', async () => {
            renderEditListing()
            await waitFor(() => {
                expect(screen.getAllByDisplayValue('Financial Economics and Statistics 16th Edition')[0]).toBeInTheDocument()
            })
        })

        it('shows the condition buttons', async () => {
            renderEditListing()
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /like new/i })).toBeInTheDocument()
                expect(screen.getByRole('button', { name: /good/i })).toBeInTheDocument()
                expect(screen.getByRole('button', { name: /fair/i })).toBeInTheDocument()
                expect(screen.getByRole('button', { name: /worn/i })).toBeInTheDocument()
            })
        })

        it('shows Save Changes and Cancel Changes buttons', async () => {
            renderEditListing()
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
                expect(screen.getByRole('button', { name: /cancel changes/i })).toBeInTheDocument()
            })
        })

        it('updates title when user is typing', async () => {
            renderEditListing()
            const titleInput = await screen.findByDisplayValue('Financial Economics and Statistics 16th Edition')
            fireEvent.change(titleInput, { target: { value: 'New Title' } })
            expect(screen.getByDisplayValue('New Title')).toBeInTheDocument()
        })

        it('shows pre-filled price of 500', async () => {
            renderEditListing()
            await waitFor(() => {
                expect(screen.getByDisplayValue('500')).toBeInTheDocument()
            })
        })

})