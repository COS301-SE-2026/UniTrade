import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, } from '@testing-library/react'

import { MemoryRouter } from 'react-router'
import Login from '../../pages/auth/Login'
import { fireEvent, waitFor } from '@testing-library/react'
import { authService } from '../../services/authService'
import { getAuthErrorMessage } from '../../utils/authErrors'


const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockSetUser = vi.fn()
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({ setUser: mockSetUser }),
}))

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    getMe: vi.fn(),
  },
}))

vi.mock('../../utils/authErrors', () => ({
  getAuthErrorMessage: vi.fn((msg: string) => `Friendly: ${msg}`),
}))

vi.mock('../../assets/girl.png', () => ({ default: 'girl.png' }))

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )




describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })


  describe('Rendering', () => {
    it('renders the heading and subtitle', () => {
      renderLogin()
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      expect(screen.getByText('Enter your credentials to access your account')).toBeInTheDocument()
    })

    it('renders email and password inputs', () => {
      renderLogin()
      expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })

    it('renders password input as type password', () => {
      renderLogin()
      expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
    })

    it('renders the LOGIN submit button', () => {
      renderLogin()
      expect(screen.getByRole('button', { name: 'LOGIN' })).toBeInTheDocument()
    })

    it('renders Remember Me checkbox', () => {
      renderLogin()
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
      expect(screen.getByText('Remember Me')).toBeInTheDocument()
    })

    it('renders Forgot Password link', () => {
      renderLogin()
      expect(screen.getByRole('link', { name: 'Forgot Password' })).toBeInTheDocument()
    })

    it('renders Sign Up link pointing to /auth/Signup', () => {
      renderLogin()
      expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/auth/Signup')
    })


    it('submit button is enabled on initial render', () => {
      renderLogin()
      expect(screen.getByRole('button', { name: 'LOGIN' })).not.toBeDisabled()
    })
  })
  it('upadtes email and password fileds when changes', () => {
    renderLogin()
    const emailInput = screen.getByPlaceholderText('Email Address') as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement

    fireEvent.change(emailInput, { target: { name: 'email', value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { name: 'password', value: 'secret123' } })
    expect(emailInput.value).toBe('test@example.com')
    expect(passwordInput.value).toBe('secret123')
  })

  it('toggles password visibility whne the eye icon is clicked on', () => {
    renderLogin()
    const passWordInput = screen.getByPlaceholderText('Password') as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: 'Show password' })

    expect(passWordInput).toHaveAttribute('type', 'password')

    fireEvent.click(toggleButton)
    expect(passWordInput).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(passWordInput).toHaveAttribute('type', 'password')
  })

  it('toggles the Remember me checkbox', () => {
    renderLogin()
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(false)

    fireEvent.click(checkbox)
    expect(checkbox.checked).toBe(true)
  })

  it('shows loading state and disables the button while its submitting', async () => {
    let resolveLogin: () => void
    vi.mocked(authService.login).mockImplementation(
      () => new Promise<void>((resolve) => { resolveLogin = resolve })
    )
    vi.mocked(authService.getMe).mockResolvedValue({
      user: {
        userId: '1',
        firstName: 'Tafadzwa',
        lastName: 'Musiiwa',
        email: 'Tafadzwa@example.com',
        userRole: 'student',
        //university: 'UP'
      },
      std: { 
        verificationStatus: 'verified',
        degreeProgram: 'BSc Computer Science',
      yearOfStudy: 2,
    university: 'UP' }
    })

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('Email Address'), {
      target: { name: 'email', value: 'Tafadzwa@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { name: 'password', value: 'password1' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }))

    expect(screen.getByRole('button', { name: 'Logging in...' })).toBeDisabled()

    resolveLogin!()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'LOGIN' })).not.toBeDisabled())
  })

  it('logs in as admin and naviagtes to the admin dashboard', async () => {
    vi.mocked(authService.login).mockResolvedValue(undefined)
    vi.mocked(authService.getMe).mockResolvedValue({
      user: {
        userId: '1',
        firstName: 'Zelamene',
        lastName: 'Shazi',
        email: 'zelamene@example.com',
        userRole: 'admin',
        //university: 'UCT'
      },
      std: { 
        verificationStatus: 'verified',
        degreeProgram: 'BSc Computer Science',
      yearOfStudy: 2,
    university: 'UCT'}
    })

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('Email Address'), {
      target: { name: 'email', value: 'zelamene@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { name: 'password', value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }))

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith({
        id: '1',
        name: 'Zelamene Shazi',
        initials: 'ZS',
        role: 'admin',
        university: 'UCT'
      })
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard')
    })
  })

  it('logs in as a non-admin and naviages to the buyers listungs', async () => {
    vi.mocked(authService.login).mockResolvedValue(undefined)
    vi.mocked(authService.getMe).mockResolvedValue({
      user: {
        userId: '2',
        firstName: 'Tafadzwa',
        lastName: 'Musiiwa',
        email: 'tafadzwa@example.com',
        userRole: 'student',
        //university: 'UP'
      },
      std: { 
        verificationStatus: 'verified',
      degreeProgram: 'BSc Computer Science',
    yearOfStudy: 2,
    university: 'UP'
   }
    })

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('Email Address'), {
      target: { name: 'email', value: 'tafadzwa@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { name: 'password', value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/buyer/listings')
    })
  })

  it('shows a friendly message when the login fails', async () => {
    vi.mocked(authService.login).mockRejectedValue({ message: 'invalid_credentials' })

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('Email Address'), {
      target: { name: 'email', value: 'wrong@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { name: 'password', value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }))

    await waitFor(() => {
      expect(getAuthErrorMessage).toHaveBeenCalledWith('invalid_credentials')
      expect(screen.getByText('Friendly: invalid_credentials')).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'LOGIN' })).not.toBeDisabled()
  })

  it('shows a friendly message when getMe fails after a successful login', async () => {
    vi.mocked(authService.login).mockResolvedValue(undefined)
    vi.mocked(authService.getMe).mockRejectedValue({ message: 'unauthenticated' })

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('Email Address'), {
      target: { name: 'email', value: 'tafadzwa@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { name: 'password', value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }))

    await waitFor(() => {
      expect(getAuthErrorMessage).toHaveBeenCalledWith('unauthenticated')
      expect(screen.getByText('Friendly: unauthenticated')).toBeInTheDocument()
    })
    expect(mockSetUser).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('clears the prevois error on a new submit attempt', async () => {
    vi.mocked(authService.login)
      .mockRejectedValueOnce({ message: 'invalid_credentials' })
      .mockResolvedValueOnce(undefined)
    vi.mocked(authService.getMe).mockResolvedValue({
      user: {
        userId: '3',
        firstName: 'Tafadzwa',
        lastName: 'Musiiwa',
        email: 'tafadzwa@example.com',
        userRole: 'student',
        //university: undefined,
      },
      std: { verificationStatus: 'verified',
        degreeProgram: 'BSc Computer Science',
    yearOfStudy: 2,
    university: 'UP'

       }
    })

    renderLogin()
    const emailInput = screen.getByPlaceholderText('Email Address')
    const passwordInput = screen.getByPlaceholderText('Password')
    const submitButton = screen.getByRole('button', { name: 'LOGIN' })

    fireEvent.change(emailInput, { target: { name: 'email', value: 'tafadzwa@example.com' } })
    fireEvent.change(passwordInput, { target: { name: 'password', value: 'wrongpass' } })
    fireEvent.click(submitButton)
    await waitFor(() => screen.getByText('Friendly: invalid_credentials'))

    fireEvent.change(passwordInput, { target: { name: 'password', value: 'password1' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText('Friendly: invalid_credentials')).not.toBeInTheDocument()
      expect(mockNavigate).toHaveBeenCalledWith('/buyer/listings')
    })
  })
})
