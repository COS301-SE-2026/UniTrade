import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OTPVerification from '../../pages/auth/OTP_verification'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/useAuthStore'

vi.mock('../../services/authService', () => ({
  authService: {
    verifyOtp: vi.fn(),
    resendOtp: vi.fn(),
  },
}))

vi.mock('../../store/useThemeStore', () => ({
  useThemeStore: () => ({ isDark: false, toggle: vi.fn() }),
}))

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const renderOTP = () =>
  render(
    <MemoryRouter>
      <OTPVerification />
    </MemoryRouter>
  )

const fillOtp = (digits: string) => {
  const inputs = screen.getAllByRole('textbox')
  digits.split('').forEach((digit, i) => {
    fireEvent.change(inputs[i], { target: { value: digit } })
  })
}

describe('OTPVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      pendingEmail: 'student@up.ac.za',
      clearPendingEmail: vi.fn(),
    } as any)
  })

  it('page shows up without lagging or crashing ', () => {
    renderOTP()
    expect(screen.getByText('OTP Verification')).toBeInTheDocument()
  })

  it('shows the UniTrade brand in the header', () => {
    renderOTP()
    expect(screen.getByText('UniTrade')).toBeInTheDocument()
  })

  it('shows the pending email address', () => {
    renderOTP()
    expect(screen.getByText('student@up.ac.za')).toBeInTheDocument()
  })

  it('shows 4 OTP input boxes', () => {
    renderOTP()
    expect(screen.getAllByRole('textbox')).toHaveLength(4)
  })

  it('shows the Verify OTP button', () => {
    renderOTP()
    expect(screen.getByRole('button', { name: /verify otp/i })).toBeInTheDocument()
  })

  it('shows the Resend button', () => {
    renderOTP()
    expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument()
  })

  it('shows the remaining time countdown', () => {
    renderOTP()
    expect(screen.getByText(/remaining time/i)).toBeInTheDocument()
    expect(screen.getByText(/00:59s/i)).toBeInTheDocument()
  })

  it('shows the dark mode toggle button', () => {
    renderOTP()
    expect(screen.getByRole('button', { name: /toggle dark mode/i })).toBeInTheDocument()
  })

  it('Verify OTP button is disabled when inputs are empty', () => {
    renderOTP()
    expect(screen.getByRole('button', { name: /verify otp/i })).toBeDisabled()
  })

  it('Resend button is disabled while timer is still running', () => {
    renderOTP()
    expect(screen.getByRole('button', { name: /resend/i })).toBeDisabled()
  })

  it('Verify OTP button becomes enabled after all 4 digits are entered', () => {
    renderOTP()
    fillOtp('1234')
    expect(screen.getByRole('button', { name: /verify otp/i })).not.toBeDisabled()
  })

  it('calls authService.verifyOtp with the correct email and OTP on submit', async () => {
    vi.mocked(authService.verifyOtp).mockResolvedValue(undefined as any)
    renderOTP()
    fillOtp('1234')
    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }))
    await waitFor(() => {
      expect(authService.verifyOtp).toHaveBeenCalledWith('student@up.ac.za', '1234')
    })
  })

})

