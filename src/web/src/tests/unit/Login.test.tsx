import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, beforeEach, vi, it } from 'vitest'
import { useNavigate } from 'react-router-dom'
import Login from '../../pages/auth/Login'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/useAuthStore'
import { getAuthErrorMessage } from '../../utils/authErrors'

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}))

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    getMe: vi.fn(),
  },
}))

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('../../utils/authErrors', () => ({
  getAuthErrorMessage: vi.fn((msg) => msg),
}))

vi.mock('../../assets/girl.png', () => ({ default: 'girl-mock-path.png' }))

describe('Login Component', () => {
  const mockNavigate = vi.fn()
  const mockSetUser = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(useAuthStore).mockReturnValue({ setUser: mockSetUser })
  })
    test('should render the Login form and buttons correctly', () => {
    render(<Login />)

    expect(screen.getByRole('heading', { name: /welcome back!/i })).toBeInTheDocument()
    expect(screen.getByText('Enter your credentials to access your account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })


    test('should track user typing ', () => {
    render(<Login />)

    const emailInput = screen.getByPlaceholderText('Email Address') as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement

    fireEvent.change(emailInput, { target: { value: 'langavaks@gmail.com', name: 'email' } })
    fireEvent.change(passwordInput, { target: { value: 'Password100', name: 'password' } })

    expect(emailInput.value).toBe('langavaks@gmail.com')
    expect(passwordInput.value).toBe('Password100')
  })

    test('should handle successful login and navigate to admin', async () => {
    const mockUserPayload = {
      user: {
        userId: '23526964',
        firstName: 'Langa',
        lastName: 'Vakalisa',
        userRole: 'admin',
        university: 'University of Pretoria',
        email: 'langavaks@gmail.com',
      },
      std: {
        verificationStatus: 'verified',
      },
    }


        vi.mocked(authService.login).mockResolvedValue(undefined)
    vi.mocked(authService.getMe).mockResolvedValue(mockUserPayload)

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'langavaks@gmail.com', name: 'email' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'adminpass', name: 'password' } })
    
    const loginButton = screen.getByRole('button', { name: /login/i })
    fireEvent.click(loginButton)

    expect(screen.getByRole('button', { name: /logging in\.\.\./i })).toBeDisabled()

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        Email: 'langavaks@gmail.com',
        Password: 'adminpass',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard')
    })

    expect(mockSetUser).toHaveBeenCalledWith({
      id: '23526964',
      name: 'Langa Vakalisa',
      initials: 'LV',
      role: 'admin',
      university: 'University of Pretoria',
    })
  })


    test('should handle successful login and navigate to buyerlistings', async () => {
    const mockUserPayload = {
      user: {
        userId: '23526964',
        firstName: 'Langa',
        lastName: 'Vakalisa',
        userRole: 'buyer',
        university: 'University of Pretoria',
        email: 'langavaks@gmail.com',
      },
      std: {
        verificationStatus: 'verified',
      },
    }

    vi.mocked(authService.login).mockResolvedValue(undefined)
    vi.mocked(authService.getMe).mockResolvedValue(mockUserPayload)

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'langavaks@gmail', name: 'email' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Password100', name: 'password' } })
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/buyer/listings')
    })
    
    expect(mockSetUser).toHaveBeenCalledWith({
      id: '23526964',
      name: 'Langa Vakalisa',
      initials: 'LV',
      role: 'buyer',
      university: 'University of Pretoria',
    })
  })

    test('should handle failed login and display error message', async () => {
    const apiErrorReason = 'Invalid credentials'
    const transformedErrorMessage = 'Invalid email or password'
    
    vi.mocked(authService.login).mockRejectedValue(new Error(apiErrorReason))
    vi.mocked(getAuthErrorMessage).mockReturnValue(transformedErrorMessage)

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'langavaks@gmail.com', name: 'email' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'notpassword', name: 'password' } })
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    const errorAlert = await screen.findByText(transformedErrorMessage)
    expect(errorAlert).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).not.toBeDisabled()
  })

});

  
