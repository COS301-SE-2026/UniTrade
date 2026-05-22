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

    it('shows the New Listing card', () => {
      renderSellerDashboard()
      expect(screen.getByText('New Listing')).toBeInTheDocument()
    })

    it('shows the correct Total Orders value of 15', () => {
      renderSellerDashboard()
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('shows the correct Total Sales value of R1500', () => {
      renderSellerDashboard()
      expect(screen.getByText('R1500')).toBeInTheDocument()
    })

    it('shows the correct Pending Delivery value of 1', () => {
      renderSellerDashboard()
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('shows +12% this month for both Orders and Sales cards', () => {
      renderSellerDashboard()
      const labels = screen.getAllByText(/\+12% this month/i)
      expect(labels.length).toBeGreaterThanOrEqual(2)
    })

    it('shows Collection soon for Pending Delivery', () => {
      renderSellerDashboard()
      expect(screen.getByText(/collection soon/i)).toBeInTheDocument()
    })

    it('shows the Recent Orders section heading', () => {
      renderSellerDashboard()
      expect(screen.getByText('Recent Orders')).toBeInTheDocument()
    })

    it('shows all table column headers', () => {
      renderSellerDashboard()
      expect(screen.getByText(/order id/i)).toBeInTheDocument()
      expect(screen.getByText(/date/i)).toBeInTheDocument()
      expect(screen.getByText(/customer/i)).toBeInTheDocument()
      expect(screen.getByText(/status/i)).toBeInTheDocument()
    })

    it('shows all 5 order IDs', () => {
      renderSellerDashboard()
      expect(screen.getByText('11001')).toBeInTheDocument()
      expect(screen.getByText('11002')).toBeInTheDocument()
      expect(screen.getByText('11003')).toBeInTheDocument()
      expect(screen.getByText('111004')).toBeInTheDocument()
      expect(screen.getByText('11005')).toBeInTheDocument()
    })

    it('shows all customer names', () => {
      renderSellerDashboard()
      expect(screen.getByText('Sabira')).toBeInTheDocument()
      expect(screen.getByText('Mahadio')).toBeInTheDocument()
      expect(screen.getByText('Tafadzwa')).toBeInTheDocument()
      expect(screen.getByText('Zelemane')).toBeInTheDocument()
      expect(screen.getByText('Langa')).toBeInTheDocument()
    })

    it('shows all order dates', () => {
      renderSellerDashboard()
      expect(screen.getByText('2026-04-22')).toBeInTheDocument()
      expect(screen.getByText('2026-04-20')).toBeInTheDocument()
      expect(screen.getByText('2026-03-11')).toBeInTheDocument()
      expect(screen.getByText('2026-03-07')).toBeInTheDocument()
      expect(screen.getByText('2025-09-26')).toBeInTheDocument()
    })

    it('shows Pending status for order 11001', () => {
      renderSellerDashboard()
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('shows exactly 3 Delivered status badges', () => {
      renderSellerDashboard()
      const delivered = screen.getAllByText('Delivered')
      expect(delivered).toHaveLength(3)
    })

    it('shows Cancelled status for order 11005', () => {
      renderSellerDashboard()
      expect(screen.getByText('Cancelled')).toBeInTheDocument()
    })

    it('shows the Sales Performance section heading', () => {
      renderSellerDashboard()
      expect(screen.getByText('Sales Performance')).toBeInTheDocument()
    })

    it('shows the Last 7 days button', () => {
      renderSellerDashboard()
      expect(screen.getByText(/last 7 days/i)).toBeInTheDocument()
    })

    it('shows all 7 days of the week', () => {
      renderSellerDashboard()
      const days = ['Tuesday', 'Monday', 'Sunday', 'Saturday', 'Friday', 'Thursday', 'Wednesday']
      days.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument()
      })
    })


    it('navigates to /seller/upload when New Listing button is clicked', () => {
      renderSellerDashboard()
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => fireEvent.click(button))
      expect(mockNavigate).toHaveBeenCalledWith('/seller/upload')
    })
})


