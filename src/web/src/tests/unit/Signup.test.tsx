import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Signup from '../../pages/auth/Signup'
 
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})
 
const mockSetPendingEmail = vi.fn()
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({ setPendingEmail: mockSetPendingEmail }),
}))
 
vi.mock('../../services/authService', () => ({
  authService: {
    register: vi.fn(),
  },
}))
 
vi.mock('../../utils/authErrors', () => ({
  getAuthErrorMessage: (msg: string) => `Friendly: ${msg}`,
}))

vi.mock('../../assets/girl.png', () => ({ default: 'girl.png' }))
 

import { authService } from '../../services/authService'
 
const renderSignup = () =>
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  )
 
const fillRequiredFields = async (overrides: Record<string, string> = {}) => {
  const user = userEvent.setup()
  const fields: Record<string, string> = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    yearOfStudy: '2',
    password: 'secret123',
    ...overrides,
  }
 
  await user.type(screen.getByPlaceholderText('First Name'), fields.firstName)
  await user.type(screen.getByPlaceholderText('Last Name'), fields.lastName)
  await user.type(screen.getByPlaceholderText('Email'), fields.email)
  await user.selectOptions(screen.getByRole('combobox'), 'UCT')
  await user.type(screen.getByPlaceholderText('Year of Study'), fields.yearOfStudy)
  await user.type(screen.getByPlaceholderText('Password'), fields.password)
 
  return fields
}
 
// ── Tests ─────────────────────────────────────────────────────────────────────
 
describe('Signup page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

})
