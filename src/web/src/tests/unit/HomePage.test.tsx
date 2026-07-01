import {render} from '@testing-library/react'
import {screen} from '@testing-library/react'
import {within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import { beforeEach, describe, expect, it, vi} from 'vitest'
import HomePage from '../../pages/auth/HomePage'
//import userEvent from '@testing-library/user-event'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})
const renderHomePage = () => 
    render (
        <MemoryRouter>
            <HomePage />
        </MemoryRouter>
    )

describe('HomePage', () => {
    it('home page appears up without crashing or lagging', () => {
        renderHomePage()
    })
})

describe('Navbar', () => {
    beforeEach(() => {
        mockNavigate.mockClear()
    })

    it ('renders logo, title, and Get Started button', () => {
        renderHomePage()
        const nav = screen.getByRole('navigation')
        expect(within(nav).getByAltText('UniTrade Logo')).toBeInTheDocument()
        expect(within(nav).getByText('UniTrade')).toBeInTheDocument()
        expect(
            within(nav).getByRole('button', {name: /get started/i})
        ).toBeInTheDocument()
    })

})