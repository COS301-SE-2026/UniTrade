import {render} from '@testing-library/react'
import {screen} from '@testing-library/react'
//import { fireEvent, act} from '@testing-library/react'
import {within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import { beforeEach, describe, expect, it, vi, afterEach} from 'vitest'
import HomePage from '../../pages/auth/HomePage'
import userEvent from '@testing-library/user-event'
import { AlexAvatar } from '../../pages/auth/HomePage'
import { act } from 'react'

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
    it ('renders the badge text', async () => {
        renderHomePage()
        expect(screen.getByText('MADE FOR SA UNIVERSITY STUDENTS')).toBeInTheDocument()
    })
    it ('renders the first page text', async () => {
        renderHomePage()
        expect(screen.getByText('UniTrade is the verified peer-to-peer marketplace for South African students. No shipping, no strangers - just your campus community.')).toBeInTheDocument()
    })

     it ('renders the first page text', async () => {
        renderHomePage()
        expect(screen.getByText('Buy and sell University materials')).toBeInTheDocument()
    })
    it ('renders the first page second text', async () => {
        renderHomePage()
        expect(screen.getByText('on your campus')).toBeInTheDocument()
    })

    it ('renders the University stats with correct number and label', async () => {
        renderHomePage()
        expect(screen.getByText('+5')).toBeInTheDocument()
        expect(screen.getByText('SA UNIVERSITIES')).toBeInTheDocument()
    })

    it ('renders the verification stats with the correct number and label', async () => {
        renderHomePage()
        expect(screen.getByText('100%')).toBeInTheDocument()
        expect(screen.getByText('VERIFIED STUDENTS')).toBeInTheDocument()
    })

    it ('renders the shipping fees stats with the correct number and label', async () => {
        renderHomePage()
        expect(screen.getByText('0')).toBeInTheDocument()
        expect(screen.getByText('SHIPPING FEES')).toBeInTheDocument()
    })

    it ('inlcudes the Alex Avatar alt text on the page', async () => { //another way for checking if the avatar is on the page
        renderHomePage()
        expect(screen.getByAltText(/Alex Avatar/i)).toBeInTheDocument()
    })

    it ('includes the Alex Avatar on the page', async () => { //also another way
        renderHomePage ()
        expect(screen.getByTestId('alex-avatar-wrapper')).toBeInTheDocument()
    })

})

describe ('AlexAvatar', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.clearAllTimers()
        vi.useRealTimers()
    })

    it('shows "AgileBridge + DevNexus" with bouncing dots on initial thinking', () => {
        render(<AlexAvatar />)
        const bubble = screen.getByText(/AgileBridge \+ DevNexus/)
        expect(bubble).toBeInTheDocument()
        expect(bubble.querySelectorAll('.animate-bounce')).toHaveLength(3)
    })

    it ('shows "UniTrade" after transitioning to answer', () => {
        render(<AlexAvatar />)

        act(() => {
            vi.advanceTimersByTime(1800)
        })
        expect(screen.getByText('UniTrade')).toBeInTheDocument()
        expect(screen.queryByText(/AgileBridge/)).not.toBeInTheDocument()
        expect(screen.getByText('UniTrade').querySelectorAll('.animate-bounce')).toHaveLength(0)
    })

    it ('shows "UniTrade" with joy animation after transitioning to joy', () => {
        render(<AlexAvatar />)

        act(() => {
            vi.advanceTimersByTime(3600)
        })

        expect(screen.getByText('UniTrade')).toBeInTheDocument()
        const avatarWrapper = screen.getByAltText('Alex Avatar').parentElement
        expect(avatarWrapper).toHaveClass('animate-joy-bounce')
    })
})