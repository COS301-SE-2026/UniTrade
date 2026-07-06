import {render, screen, fireEvent} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {describe, it, vi, beforeEach, expect} from 'vitest'
import HelpCenter from '../../pages/auth/HelpCenter'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
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
        expect(screen.getByText('Find answers, tutorials, and support resources')).toBeInTheDocument()
    })

    it('navigates back to the home page when the back button is clicked', () => {
        renderHelpCenter()
        fireEvent.click(screen.getByRole('button', {name:'' }))
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


    it('shows the initial greeting by Alex when the chat is opened', () => {
        renderHelpCenter()
        fireEvent.click(screen.getByRole('button', { name : 'Chat with Alex'}))
        expect(
            screen.getByText("Hey! I'm Alex, your UniTrade support assistant . What would you like to know?")

        ).toBeInTheDocument()
    })


    it('expands an FAQ answer when its question is clicked', () => {
        renderHelpCenter()
        fireEvent.click(screen.getByText('How long does a reservation last?'))
        expect(screen.getByText(/Reservations last 24 hours by default/)).toBeInTheDocument()

    })

    it('does not show the chat panel by default', () => {
        renderHelpCenter()
        expect(screen.queryByPlaceholderText('Ask Alex anything...')).not.toBeInTheDocument()
    })

    it('opens the chat panel when the Alex avatar is clicked', () => {
        renderHelpCenter()
        fireEvent.click(screen.getByRole('button', { name: 'Chat with Alex' }))
        expect(screen.getByPlaceholderText('Ask Alex anything...')).toBeInTheDocument()
    })

})