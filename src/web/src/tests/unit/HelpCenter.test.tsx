import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, vi, beforeEach, expect, beforeAll } from 'vitest'
import HelpCenter from '../../pages/auth/HelpCenter'


beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

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
        expect(screen.getByText('Find answers, tutorials, and support resources')).toBeInTheDocument()
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


    it('shows the initial greeting by Alex when the chat is opened', () => {
        renderHelpCenter()
        fireEvent.click(screen.getByRole('button', { name: 'Chat with Alex' }))
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

    it('closes the chat panel when the close button is clicked', () => {
        renderHelpCenter()
        fireEvent.click(screen.getByRole('button', { name: 'Chat with Alex' }))
        expect(screen.getByPlaceholderText('Ask Alex anything...')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Close chat' }))
        expect(screen.queryByPlaceholderText('Ask Alex anything...')).not.toBeInTheDocument()
    })


    it('closes the chat panel when clicking the backdrop', () => {
        const { container } = renderHelpCenter()
        fireEvent.click(screen.getByRole('button', { name: 'Chat with Alex' }))
        const backdrop = container.querySelector('.fixed.inset-0') as HTMLElement
        fireEvent.click(backdrop)
        expect(screen.queryByPlaceholderText('Ask Alex anything...')).not.toBeInTheDocument()
    })

    it('does not close the chat panel when clicking inside the modal content', () => {
        renderHelpCenter()
        fireEvent.click(screen.getByRole('button', { name: 'Chat with Alex' }))
        fireEvent.click(screen.getByText('Alex'))
        expect(screen.getByPlaceholderText('Ask Alex anything...')).toBeInTheDocument()
    })

    it('sends a message on Enter and shows the matching assistant reply', async () => {
        renderHelpCenter()
        fireEvent.click(screen.getByRole('button', { name: 'Chat with Alex' }))
        const textbox = screen.getByPlaceholderText('Ask Alex anything...')

        fireEvent.change(textbox, { target: { value: 'When do I get my payout?' } })
        fireEvent.keyDown(textbox, { key: 'Enter' })

        expect(await screen.findByText('When do I get my payout?')).toBeInTheDocument()
        expect(await screen.findByText(/Payouts to sellers usually take about 2-3 business days/)).toBeInTheDocument()
    })

    it('does not send the message on Shift+Enter', () => {
        renderHelpCenter()
        fireEvent.click(screen.getByRole('button', { name: 'Chat with Alex' }))
        const textbox = screen.getByPlaceholderText('Ask Alex anything...') as HTMLTextAreaElement

        fireEvent.change(textbox, { target: { value: 'line one' } })
        fireEvent.keyDown(textbox, { key: 'Enter', shiftKey: true })

        expect(textbox.value).toBe('line one')
    })

    it('does not send an empty or whitespace-only message', () => {
        renderHelpCenter()
        fireEvent.click(screen.getByRole('button', { name: 'Chat with Alex' }))
        const textbox = screen.getByPlaceholderText('Ask Alex anything...')

        fireEvent.change(textbox, { target: { value: '   ' } })
        fireEvent.keyDown(textbox, { key: 'Enter' })

        expect(screen.getAllByText(/Hey! I'm Alex/).length).toBe(1)
    })

    it('shows the fallback reply for an unmatched message', async () => {
        renderHelpCenter()
        fireEvent.click(screen.getByRole('button', { name: 'Chat with Alex' }))
        const textbox = screen.getByPlaceholderText('Ask Alex anything...')

        fireEvent.change(textbox, { target: { value: 'zzz qqq unmatched' } })
        fireEvent.keyDown(textbox, { key: 'Enter' })

        expect(await screen.findByText(/Could you tell me more about what you need/)).toBeInTheDocument()
    })

    it('disables the send button when the input is empty and enables it once text is typed', () => {
        renderHelpCenter()
        fireEvent.click(screen.getByRole('button', { name: 'Chat with Alex' }))
        const sendButton = screen.getByRole('button', { name: 'Send message' })
        const textbox = screen.getByPlaceholderText('Ask Alex anything...')

        expect(sendButton).toBeDisabled()
        fireEvent.change(textbox, { target: { value: 'hello' } })
        expect(sendButton).not.toBeDisabled()
    })

    it('sends a message when the send button is clicked directly', async () => {
        renderHelpCenter()
        fireEvent.click(screen.getByRole('button', { name: 'Chat with Alex' }))
        const textbox = screen.getByPlaceholderText('Ask Alex anything...')
        fireEvent.change(textbox, { target: { value: 'Can I negotiate the price?' } })
        fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

        expect(await screen.findByText('Can I negotiate the price?')).toBeInTheDocument()
        const replies = await screen.findAllByText(/only if the products listed are negotiable/)
        expect(replies.length).toBeGreaterThan(0)
    })

})