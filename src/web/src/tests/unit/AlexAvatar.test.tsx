import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AlexAvatar from '../../pages/auth/AlexAvatar'

describe('AlexAvatar', () => {
    it('pages renders without crashing or lagging', () => {
        render(<AlexAvatar />)
        expect(screen.getByRole('button', {name: 'Chat with Alex'})).toBeInTheDocument()
    })


    it('has the correct accessible role and label', () => {
        render(<AlexAvatar />)
        const avatar = screen.getByRole('button', {name: 'Chat with Alex'})
        expect(avatar).toBeInTheDocument()
    })

    it('is keyboard accessible', () => {
        render(<AlexAvatar />)
        const avatar = screen.getByRole('button', {name: 'Chat with Alex'})
        expect(avatar).toHaveAttribute('tabindex', '0')
    })

    it('hides the thought bubble when isThinking is false', () => {
        render(<AlexAvatar isThinking={false} />)
        expect(screen.queryByText('ASK ME ANYTHING')).not.toBeInTheDocument()
    })

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn()
        render(<AlexAvatar onClick={handleClick} />)
        fireEvent.click(screen.getByRole('button', { name: 'Chat with Alex' }))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

     it('calls onClick when Space key is pressed', () => {
        const handleClick = vi.fn()
        render(<AlexAvatar onClick={handleClick} />)
        fireEvent.click(screen.getByRole('button', { name: 'Chat with Alex' }))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick for other keys', () => {
        const handleClick = vi.fn()
        render(<AlexAvatar onClick={handleClick} />)
        fireEvent.keyDown(screen.getByRole('button', { name: 'Chat with Alex' }), { key: 'Tab' })
        expect(handleClick).not.toHaveBeenCalled()
    })

    it('calls onClick when Enter key is pressed', () => {
        const handleClick = vi.fn()
        render(<AlexAvatar onClick={handleClick} />)
        fireEvent.keyDown(screen.getByRole('button', { name: 'Chat with Alex' }), { key: 'Enter' })
        expect(handleClick).toHaveBeenCalledTimes(1)
    })


    })