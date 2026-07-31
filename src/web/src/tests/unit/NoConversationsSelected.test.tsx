import { screen,render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import NoConversationsSelected from '../../pages/chat/NoConversationsSelected'

const renderNoCOnversationsSelected = () =>
    render(
        <MemoryRouter>
            <NoConversationsSelected />
        </MemoryRouter>
    )

describe('NoConversationsSelected', () => {
    it('renders the placeholder message', () => {
        renderNoCOnversationsSelected()

        expect(
            screen.getByText('Select a conversation to start chatting')
        ).toBeInTheDocument()
    })
})