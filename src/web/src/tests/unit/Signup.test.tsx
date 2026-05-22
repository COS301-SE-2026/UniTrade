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
    firstName: 'Langa',
    lastName: 'Vakalisa',
    email: 'langavaks@gmail.com',
    yearOfStudy: '2',
    password: 'Password100',
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
  
describe('Signup page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  
  describe('Rendering', () => {
    it('renders the heading', () => {
      renderSignup()
      expect(screen.getByRole('heading', { name: /get started/i })).toBeInTheDocument()
    })
 
    it('renders all required form fields', () => {
      renderSignup()
      expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Year of Study')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })
 
    it('renders the optional Degree Program field', () => {
      renderSignup()
      expect(screen.getByPlaceholderText('Degree Program')).toBeInTheDocument()
    })
 
    it('renders all university options', () => {
      renderSignup()
      const select = screen.getByRole('combobox')
      const options = Array.from(select.querySelectorAll('option')).map(o => o.textContent)
      expect(options).toContain('University of Cape Town')
      expect(options).toContain('University of Pretoria')
      expect(options).toContain('University of the Witwatersrand')
    })
 
    it('renders the login link', () => {
      renderSignup()
      expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/auth/Login')
    })
 
    it('does not show an error banner on first render', () => {
      renderSignup()
      expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
    })
  })
 


})




