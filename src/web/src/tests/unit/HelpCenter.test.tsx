import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, vi, beforeEach, expect} from 'vitest'
import HelpCenter from '../../pages/auth/HelpCenter'

const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
    const actual = await vi.importActual<typeof import('react-router')>('react-router')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

vi.mock('../../assests/logo.png', () => ({
    default: 'logo.png',
}))

const renderHelpCenter = () =>
    render(
        <MemoryRouter>
            <HelpCenter />
        </MemoryRouter>
    )

describe('HelpCenter', () => {
    beforeEach(() => {
        mockNavigate.mockClear()
    })

    it('page renders without crashing or lagging ', () => {
        renderHelpCenter()
        expect(screen.getByText('Help Center')).toBeInTheDocument()
    })

    it('shows the Help Center heading and the title', () => {
        renderHelpCenter()
        expect(screen.getByText('Help Center')).toBeInTheDocument()
        expect(screen.getByText('Browse quick guides and FAQs')).toBeInTheDocument()
    })

    it('navigates back to the home page when the back button is clicked', () => {
        renderHelpCenter()
        fireEvent.click(screen.getByRole('button', { name: '' }))
        expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    it('shows all quick link titles', () => {
        renderHelpCenter()
        expect(screen.getByText('Reserving items')).toBeInTheDocument()
        expect(screen.getByText('Listing a product')).toBeInTheDocument()
        expect(screen.getByText('Payment and Payouts')).toBeInTheDocument()
        expect(screen.getByText('Buyer Protection')).toBeInTheDocument()
        expect(screen.getByText('Reviews and ratings')).toBeInTheDocument()
        expect(screen.getByText('Reporting a problem')).toBeInTheDocument()
    })

    it('updates the search input as the user types', () => {
        renderHelpCenter()
        const searchInput = screen.getByPlaceholderText('Search for help articles...')
        fireEvent.change(searchInput, { target: { value: 'reservation' } })
        expect(searchInput).toHaveValue('reservation')
    })

    it('collapses an FAQ answer when its question is clicked again', () => {
        renderHelpCenter()
        const question = screen.getByText('How long does a reservation last?')
        fireEvent.click(question)
        expect(screen.getByText(/Reservations last 24 hours by default/)).toBeInTheDocument()
        fireEvent.click(question)
        expect(screen.queryByText(/Reservations last 24 hours by default/)).not.toBeInTheDocument()
    })
})