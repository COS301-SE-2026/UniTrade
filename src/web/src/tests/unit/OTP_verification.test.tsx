import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('shows 6 OTP input boxes', () => {
    renderOTP()
    expect(screen.getAllByRole('textbox')).toHaveLength(6)
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
    vi.useFakeTimers()
    renderOTP()
    expect(screen.getByText(/remaining time/i)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(
      screen.getByText((_, el) => el?.textContent === '00:59s')
    ).toBeInTheDocument()
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

  it('Verify OTP button becomes enabled after all 6 digits are entered', () => {
    renderOTP()
    fillOtp('123456')
    expect(screen.getByRole('button', { name: /verify otp/i })).not.toBeDisabled()
  })

  it('calls authService.verifyOtp with the correct email and OTP on submit', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(authService.verifyOtp).mockResolvedValue(undefined as any)
    renderOTP()
    fillOtp('123456')
    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }))
    await waitFor(() => {
      expect(authService.verifyOtp).toHaveBeenCalledWith('student@up.ac.za', '123456')
    })
  })
})
