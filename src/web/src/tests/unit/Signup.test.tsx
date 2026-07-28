import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import Signup from '../../pages/auth/Signup'
import type { University } from '../../services/authService'

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
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

  return {
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
    it('calls authService.register with the correct payload', async () => {
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
    })

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

  describe('University loading', () => {
    it('shows "Loading universities..." before the request is resolved', async () => {
      let resolveUnis: (value: University[]) => void
      vi.mocked(authService.getUniversities).mockImplementationOnce(
        () => new Promise((resolve) => { resolveUnis = resolve })


      )
      renderSignup()

      expect(screen.getByText('Loading universities...')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeDisabled()

      resolveUnis!([
        { universityId: '1', name: 'University of Cape Town', emailDomains: ['uct.ac.za'] }
      ])
      await screen.findByText('University of Cape Town')
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    it('shows an error message when universities fail to load (Error instance)', async () => {
      vi.mocked(authService.getUniversities).mockRejectedValueOnce(
        new Error('Network unreachable')
      )

      renderSignup()

      const matches = await screen.findAllByText('Network unreachable')
      expect(matches).toHaveLength(2)
      expect(screen.getByRole('option', { name: 'Network unreachable' })).toBeInTheDocument()
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    it('shows a fallback error message when a non-Error is thrown', async () => {
      vi.mocked(authService.getUniversities).mockRejectedValueOnce('some string failure')

      renderSignup()

      const matches = await screen.findAllByText('Could not load universities')
      expect(matches.length).toBeGreaterThan(0)
    })

    it('shows a fallback error message when a non-Error is thrown', async () => {
      vi.mocked(authService.getUniversities).mockRejectedValueOnce('some string failure')

      renderSignup()

      const matches = await screen.findAllByText('Could not load universities')
      expect(matches.length).toBeGreaterThan(0)
    })

    it('renders no university <option> elements when loading fails', async () => {
      vi.mocked(authService.getUniversities).mockRejectedValueOnce(new Error('boom'))

      renderSignup()
      await screen.findAllByText('boom')

      const select = screen.getByRole('combobox')
      const options = select.querySelectorAll('option')

      expect(options).toHaveLength(1)
    })
  })

  describe('Form interactions - additional', () => {
    it('updates the optional degreeProgram field', async () => {
      renderSignup()
      const user = userEvent.setup()
      const degreeInput = screen.getByPlaceholderText('Degree Program')

      await user.type(degreeInput, 'Computer Science')
      expect(degreeInput).toHaveValue('Computer Science')
    })

    it('toggle password visibility when the eye icon is clicked', async () => {
      renderSignup()
      const user = userEvent.setup()
      const passWordInput = screen.getByPlaceholderText('Password')
      const toggleButton = screen.getByRole('button', { name: 'Show password' })

      expect(passWordInput).toHaveAttribute('type', 'password')

      await user.click(toggleButton)
      expect(passWordInput).toHaveAttribute('type', 'text')
      expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Hide password' }))
      expect(passWordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Failed submission', () => {
    it('shows a friendly error message when registration fails', async () => {
      vi.mocked(authService.register).mockRejectedValueOnce({ message: 'email_taken' })
      renderSignup()
      await fillRequiredFields()

      fireEvent.submit(screen.getByRole('button', { name: /signup/i }))

      expect(await screen.findByText('Friendly: email_taken')).toBeInTheDocument()
    })

    it('does not save pending email or navigate when registratio  fails', async () => {
      vi.mocked(authService.register).mockRejectedValueOnce({ message: 'email_taken' })
      renderSignup()
      await fillRequiredFields()

      fireEvent.submit(screen.getByRole('button', { name: /signup/i }))

      await screen.findByText('Friendly: email_taken')
      expect(mockSetPendingEmail).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('re-enables the submit button after a failed request', async () => {
      vi.mocked(authService.register).mockRejectedValueOnce({ message: 'server_error' })
      renderSignup()
      await fillRequiredFields()
      const btn = screen.getByRole('button', { name: /signup/i })

      fireEvent.submit(btn)
      await waitFor(() => expect(btn).not.toBeDisabled())
    })

    it('clears a previous error banner on a new submit attempt', async () => {
      vi.mocked(authService.register)
        .mockRejectedValueOnce({ message: 'email_taken' })
        .mockResolvedValueOnce(undefined)

      renderSignup()
      await fillRequiredFields()
      const btn = screen.getByRole('button', { name: /signup/i })

      fireEvent.submit(btn)
      await screen.findByText('Friendly: email_taken')

      fireEvent.submit(btn)

      await waitFor(() => {
        expect(screen.queryByText('Friendly: email_taken')).not.toBeInTheDocument()
        expect(mockNavigate).toHaveBeenCalledWith('/verify-otp')
      })
    })
  })

})




