import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, } from '@testing-library/react'

import { MemoryRouter } from 'react-router-dom'
import Login from '../../pages/auth/Login'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
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

  
})
