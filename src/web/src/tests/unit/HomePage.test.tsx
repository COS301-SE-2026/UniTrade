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

})