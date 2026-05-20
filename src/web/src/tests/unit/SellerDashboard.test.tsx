import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import SellerDashboard from '../../pages/seller/SellerDashboard'


const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderSellerDashboard = () =>
  render(
    <MemoryRouter>
      <SellerDashboard />
    </MemoryRouter>
  )

  describe('SellerDashboard', () => {

    it('the seller dashboard appears up without lagging or crashing', () => {
        renderSellerDashboard()
    })

    it('shows the welcome message with the users name', () => {
        renderSellerDashboard()
        expect(screen.getByText(/welcome back tafadzwa/i)).toBeInTheDocument()
    })

    it('shows the Total Orders card', () => {
        renderSellerDashboard()
        expect(screen.getByText('Total Orders')).toBeInTheDocument()
    })

    it('shows the Total Sales card', () => {
        renderSellerDashboard()
        expect(screen.getByText('Total Sales')).toBeInTheDocument()
    })

    it('shows the Pending Delivery card', () => {
        renderSellerDashboard()
        expect(screen.getByText('Pending Delivery')).toBeInTheDocument()
    })
})


