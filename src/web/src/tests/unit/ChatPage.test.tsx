import { render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe, it, vi, beforeEach, expect, beforeAll} from 'vitest'
import ChatPage from '../../pages/chat/ChatPage'

beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
    return {
        ...actual,
        useNavigate: ()=> mockNavigate,
    }
})

const renderChatPage = () => 
    render(
        <MemoryRouter>
            <ChatPage />
        </MemoryRouter>
    )


    describe('ChatPage', () => {
        beforeEach(() => {
            mockNavigate.mockClear()
        })

        it('page renders without crashing or lagging ', () => {
            renderChatPage()
            expect(screen.getByText('Chat Page')).toBeInTheDocument()
        })

        
    })