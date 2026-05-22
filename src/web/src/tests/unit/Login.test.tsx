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
});

  
