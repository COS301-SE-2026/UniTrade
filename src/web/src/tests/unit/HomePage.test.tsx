import {render , screen } from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import { describe, it, expect} from 'vitest'
import HomePage from '../../pages/auth/HomePage'

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

    it('shows the UniTrade logo in the navbar', () => {
        renderHomePage()
        expect(screen.getByText('UniTrade')).toBeInTheDocument()
    } )

    it('shows the login button in the navbar', () => {
        renderHomePage()
        expect(screen.getByText('LOGIN')).toBeInTheDocument()

    })

    it('shows the signup button in the navbar', () => {
        renderHomePage()
        expect(screen.getByText('SignUp')).toBeInTheDocument()
    })

    it('shows the text over the image', () =>{
        renderHomePage()
        expect(screen.getByText(/university materials made accessible/i)).toBeInTheDocument()
    })

    it('shows the what we offer section', () => {
        renderHomePage()
        expect(screen.getByText(/what we offer/i)).toBeInTheDocument()
    })

    it('shows the footer section', () => {
        renderHomePage()
        expect(screen.getByText(/Contact Info/i)).toBeInTheDocument()
        expect(screen.getByText(/Support/i)).toBeInTheDocument()
        expect(screen.getByText(/Social Media/i)).toBeInTheDocument()
    })

    it('shows the get the app section', () => {
        renderHomePage()
        expect(screen.getByText('GET THE APP')).toBeInTheDocument()
    })



})