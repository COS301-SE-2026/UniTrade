import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import EditListing from '../../pages/seller/EditListing'


const renderEditListing = () =>
    render(
        <MemoryRouter>
            <EditListing />
        </MemoryRouter>
    )

    describe('EditListing', () => {
        it('shows up without lagging or crashing', () =>{
            renderEditListing();
        })

        it('shows the Edit Listing heading', () => {
            renderEditListing();
            expect(screen.getByText('Edit Listing')).toBeInTheDocument();
        })

        it('shows all 4 steps', () => {
            renderEditListing()
            expect(screen.getByText('Step 1: Basic Information')).toBeInTheDocument()
            expect(screen.getByText('Step 2: Pictures')).toBeInTheDocument()
            expect(screen.getByText('Step 3: Price')).toBeInTheDocument()
            expect(screen.getByText('Step 4: Confirmation')).toBeInTheDocument()
        })

        it('shows the category buttons', () => {
            renderEditListing()
            expect(screen.getByRole('button', { name: /textbook/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /electronics/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /furniture/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /other/i })).toBeInTheDocument()
        })

        it('shows the pre-filled title', () => {
            renderEditListing()
            expect(screen.getAllByDisplayValue('Financial Economics and Statistics 16th Edition')[0]).toBeInTheDocument()
    }) 
})