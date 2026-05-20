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

  

