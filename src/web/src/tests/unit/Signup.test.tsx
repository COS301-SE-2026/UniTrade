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

vi.mock('../../services/authService', () => {
const mockUniversities = [
  { universityId: '1', name: 'University of Cape Town', emailDomain: 'uct.ac.za' },
  { universityId: '2', name: 'University of Pretoria', emailDomain: 'up.ac.za' },
  { universityId: '3', name: 'University of the Witwatersrand', emailDomain: 'wits.ac.za' },
];
 
return{
  authService: {
    register: vi.fn(),
    getUniversities: vi.fn().mockResolvedValue(mockUniversities),
  },
}
})
 
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
  await screen.findByText('Select University');
  await user.selectOptions(screen.getByRole('combobox'), 'University of Cape Town')
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
 
    it('renders all university options', async () => {
      renderSignup()
      await screen.findByText('University of Cape Town')
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
 
    it('does not show an error banner on first render', async () => {
      renderSignup()
      await screen.findByText('Select University')
      expect(screen.queryByText(/could not load universities/i)).not.toBeInTheDocument()
    })
  })
 
describe('Form interactions', () => {
    it('updates input values as the user types', async () => {
      renderSignup()
      const user = userEvent.setup()
      const firstNameInput = screen.getByPlaceholderText('First Name')
 
      await user.type(firstNameInput, 'Langa')
      expect(firstNameInput).toHaveValue('Langa')
    })
 
    it('updates the university select when an option is chosen', async () => {
      renderSignup()
      const user = userEvent.setup()
      await screen.findByText('University of Cape Town')
      const select = screen.getByRole('combobox')
 
      await user.selectOptions(select, 'University of the Witwatersrand')
      expect(select).toHaveValue('University of the Witwatersrand')
    })
 
    it('shows the password as hidden text', () => {
      renderSignup()
      expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
    })
  })

    describe('Successful submission', () => {
    /*it('calls authService.register with the correct payload', async () => {
      vi.mocked(authService.register).mockResolvedValueOnce(undefined)
      renderSignup()
 
      const fields = await fillRequiredFields()
      fireEvent.submit(screen.getByRole('button', { name: /signup/i }))
 
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: fields.firstName,
            lastName: fields.lastName,
            email: fields.email,
            yearOfStudy: fields.yearOfStudy,
            password: fields.password,
          })
        )
      })
    })*/
 
    it('saves the pending email in the auth store', async () => {
      vi.mocked(authService.register).mockResolvedValueOnce(undefined)
      renderSignup()
      await fillRequiredFields({ email: 'langavaks@gmail.com' })
      fireEvent.submit(screen.getByRole('button', { name: /signup/i }))
 
      await waitFor(() => {
        expect(mockSetPendingEmail).toHaveBeenCalledWith('langavaks@gmail.com')
      })
    })
 
    it('navigates to /verify-otp on success', async () => {
      vi.mocked(authService.register).mockResolvedValueOnce(undefined)
      renderSignup()
      await fillRequiredFields()
      fireEvent.submit(screen.getByRole('button', { name: /signup/i }))
 
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/verify-otp')
      })
    })
 
    it('re-enables the submit button after the request completes', async () => {
      vi.mocked(authService.register).mockResolvedValueOnce(undefined)
      renderSignup()
      await fillRequiredFields()
      const btn = screen.getByRole('button', { name: /signup/i })
 
      fireEvent.submit(btn)
      await waitFor(() => expect(btn).not.toBeDisabled())
    })
  })

describe('Loading state', () => {
    it('disables the submit button while the request is in flight', async () => {
      vi.mocked(authService.register).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 200))
      )
      renderSignup()
      await fillRequiredFields()
      fireEvent.submit(screen.getByRole('button', { name: /signup/i }))
 
      expect(await screen.findByRole('button', { name: /signing up/i })).toBeDisabled()
    })
 
    it('shows "Signing up…" label during the request', async () => {
      vi.mocked(authService.register).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 200))
      )
      renderSignup()
      await fillRequiredFields()
      fireEvent.submit(screen.getByRole('button', { name: /signup/i }))
 
      expect(await screen.findByText(/signing up/i)).toBeInTheDocument()
    })
  })
 

})




