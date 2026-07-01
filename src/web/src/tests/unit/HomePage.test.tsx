import {render} from '@testing-library/react'
import {screen} from '@testing-library/react'
import {within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import { beforeEach, describe, expect, it, vi} from 'vitest'
import HomePage from '../../pages/auth/HomePage'
import userEvent from '@testing-library/user-event'
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

    it ('renders desktop navigation links with correct hrefs', () => {
        renderHomePage()
        const nav = screen.getByRole('navigation')

        const expectedLinks = [
            { name: 'The Problem', href: '#problem'},
            { name: 'The Solution', href: '#solution'},
            { name: 'How it works', href: '#how-it-works'},
        ]

        expectedLinks.forEach(({ name, href}) => {
            const links = within(nav).getAllByRole('link', {name})
            expect(links[0]).toHaveAttribute('href', href)
        })
    })

    it('navigates to /auth/Signup when Get Started is clicked', async () => {
        const user = userEvent.setup()
        renderHomePage()
        const nav = screen.getByRole('navigation')
        await user.click(within(nav).getByRole('button', {name: /get started/i}))

        expect(mockNavigate).toHaveBeenCalledWith('/auth/Signup')
    })
    it ('toggles the mobile menu open and closed on hamburger click', async () => {
        const user = userEvent.setup()
        renderHomePage()

        expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()

        const toggle = screen.getByTestId('mobile-menu-toggle')
        await user.click(toggle)

        expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
        await user.click(toggle)
        expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
    })
    
    it ('closes the mobile menu when a link is clicked', async () => {
        const user = userEvent.setup()
        renderHomePage()

        await user.click(screen.getByTestId('mobile-menu-toggle'))
        const mobileMenu = screen.getByTestId('mobile-menu')

        await user.click(within(mobileMenu).getByText('The Problem'))
        expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
    })
})

describe('Firstpage', () => {
    beforeEach(() => {
        mockNavigate.mockClear()
    })

    it ('Navigate to /auth/SignUp when SignUp button is clicked', async () => {
        const user = userEvent.setup()
        renderHomePage()
        const signUpbuton = screen.getByRole('button', {
            name: /signup/i
        })
        await user.click(signUpbuton)
        expect(mockNavigate).toHaveBeenCalledWith('/auth/Signup')
    })

    it ('Navigate to /auth/Login when the login button is clicked', async() => {
        const user = userEvent.setup()
        renderHomePage()
        const loginbuton = screen.getByRole('button', {
            name: /login/i
        })
        await user.click(loginbuton)
        expect(mockNavigate).toHaveBeenCalledWith('/auth/Login')
    })
})