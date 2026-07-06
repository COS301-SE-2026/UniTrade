import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import OTPVerification from '../../pages/auth/OTP_verification'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/useAuthStore'

const { mockGetAuthErrorMessage } = vi.hoisted(() => ({
  mockGetAuthErrorMessage: vi.fn((msg: string) => `friendly:${msg}`),
}))

vi.mock('../../services/authService', () => ({
  authService: {
    verifyOtp: vi.fn(),
    resendOtp: vi.fn(),
  },
}))

const mockToggle = vi.fn()
vi.mock('../../store/useThemeStore', () => ({
  useThemeStore: () => ({ isDark: false, toggle: mockToggle }),
}))

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('../../utils/authErrors', () => ({
  getAuthErrorMessage: mockGetAuthErrorMessage,
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

const mockClearPendingEmail = vi.fn()

describe('OTPVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthErrorMessage.mockImplementation((msg: string) => `friendly:${msg}`)
    vi.mocked(useAuthStore).mockReturnValue({
      pendingEmail: 'student@up.ac.za',
      clearPendingEmail: mockClearPendingEmail,
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

  it('ignores non-numeric charasters typed into an OTP box', () => {
    renderOTP()
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'a'}})
    expect(inputs[0]).toHaveValue('')
  })

  it('only keeps the last character typed in a box', () => {
    renderOTP()
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '9'}})
    fireEvent.change(inputs[0], { target: { value: '95'}})
    expect(inputs[0]).toHaveValue('5')
  })

  it('auto-focuses the next input after typing a digit', () => {
    renderOTP()
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '1'}})
    expect(inputs[1]).toHaveFocus()
  })

it('does not move focus past the last input', () => {
  renderOTP()
  const inputs = screen.getAllByRole('textbox')
  inputs[5].focus()
  fireEvent.change(inputs[5], { target: { value: '1' } })
  expect(inputs[5]).toHaveFocus()
})

  it('moves focus to the previous input box whne Backspace is use when the current box is empty', () => {
    renderOTP()
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '1'}})
    inputs[1].focus()
    fireEvent.keyDown(inputs[1], { key: 'Backspace'})
    expect(inputs[0]).toHaveFocus()
  })

it('does not move focus on Backspace when current box already has a value', () => {
  renderOTP()
  const inputs = screen.getAllByRole('textbox')
  fireEvent.change(inputs[1], { target: { value: '2' } })
  inputs[1].focus()
  fireEvent.keyDown(inputs[1], { key: 'Backspace' })
  expect(inputs[1]).toHaveFocus()
})

it('fills all boxes when a full 6-digit code is pasted', () => {
  renderOTP()
  const inputs = screen.getAllByRole('textbox')
  fireEvent.paste(inputs[0], {
    clipboardData: { getData: () => '123456'},
  })
  inputs.forEach((input,i) => {
    expect(input).toHaveValue(String(i + 1))
  })
})

it('strips non-digit characters when pasting', () => {
  renderOTP()
  const inputs = screen.getAllByRole('textbox')
  fireEvent.paste(inputs[0], {
    clipboardData: { getData: () => '12-34ab56' },
  })
  inputs.forEach((input, i) => {
    expect(input).toHaveValue(String(i + 1))
  })
})

it('truncates pasted content longer than 6 digits', () => {
  renderOTP()
  const inputs = screen.getAllByRole('textbox')
  fireEvent.paste(inputs[0], {
    clipboardData: { getData: () => '123456789'},
  })
  inputs.forEach((input, i) => {
    expect(input).toHaveValue(String(i + 1))
  })
})

it('handles a partial paste by leaving remaining boxes empty', () => {
  renderOTP()
  const inputs = screen.getAllByRole('textbox')
  fireEvent.paste(inputs[0], {
    clipboardData: { getData: () => '123'},
  })
  expect(inputs[0]).toHaveValue('1')
  expect(inputs[1]).toHaveValue('2')
  expect(inputs[2]).toHaveValue('3')
  expect(inputs[3]).toHaveValue('')
  expect(inputs[4]).toHaveValue('')
  expect(inputs[5]).toHaveValue('')
})

it('calls toggle whne the dark mode button is clicked', () => {
  renderOTP()
  fireEvent.click(screen.getByRole('button', { name: /toggle dark mode/i }))
  expect(mockToggle).toHaveBeenCalledTimes(1)
})

it('does not call verifyOtp if fewer than 6 digits are entered and button is clicked', () => {
  renderOTP()
  fillOtp('123')
  fireEvent.click(screen.getByRole('button', { name: /verify otp/i }))
  expect(authService.verifyOtp).not.toHaveBeenCalled()
})

it('shows "Verifying..." on the button while the request is pending', async () => {
  let resolvePromise: () => void
  vi.mocked(authService.verifyOtp).mockImplementation(
    () => new Promise<void>(resolve => { resolvePromise = resolve})
  )
  renderOTP()
  fillOtp('123456')
  fireEvent.click(screen.getByRole('button', { name: /verify otp/i }))

  expect(await screen.findByRole('button', { name: /verifying/i })).toBeInTheDocument()

  act(() => resolvePromise())
  await waitFor(() => expect(mockNavigate).toHaveBeenCalled())
})

it('shows a friendly error message and resets the OTP boxes on failed verification', async () => {
    vi.mocked(authService.verifyOtp).mockRejectedValue({ message: 'invalid_otp' })
    renderOTP()
    fillOtp('123456')
    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }))

    await waitFor(() => {
      expect(mockGetAuthErrorMessage).toHaveBeenCalledWith('invalid_otp')
      expect(screen.getByText('friendly:invalid_otp')).toBeInTheDocument()
    })

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => expect(input).toHaveValue(''))
    expect(screen.getByRole('button', { name: /verify otp/i })).toBeDisabled()
  })

  it('re-enables the Verify button after a failed request finishes', async () => {
    vi.mocked(authService.verifyOtp).mockRejectedValue({ message: 'invalid_otp' })
    renderOTP()
    fillOtp('123456')
    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify otp/i })).toHaveTextContent('Verify OTP')
    })
  })


  it('does not call resendOtp while the timer is still active', () => {
    renderOTP()
    fireEvent.click(screen.getByRole('button', { name: /resend/i }))
    expect(authService.resendOtp).not.toHaveBeenCalled()
  })

  const advanceCountdown = (seconds: number) => {
  for (let i = 0; i < seconds; i++) {
    act(() => {
      vi.advanceTimersByTime(1000)
    })
  }
}

it('enables Resend once the countdown reaches zero', () => {
  vi.useFakeTimers()
  renderOTP()

  advanceCountdown(60)

  expect(screen.getByRole('button', { name: /resend/i })).not.toBeDisabled()
})

it('calls resendOtp, resets the timer, and clears the OTP boxes when Resend is clicked', async () => {
  vi.useFakeTimers()
  vi.mocked(authService.resendOtp).mockResolvedValue(undefined as any)
  renderOTP()
  fillOtp('123456')

  advanceCountdown(60)

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /resend/i }))
  })

  expect(authService.resendOtp).toHaveBeenCalledWith('student@up.ac.za')

  const inputs = screen.getAllByRole('textbox')
  inputs.forEach(input => expect(input).toHaveValue(''))
  expect(screen.getByRole('button', { name: /resend/i })).toBeDisabled()
})

it('shows a friendly error message when resend fails', async () => {
  vi.useFakeTimers()
  vi.mocked(authService.resendOtp).mockRejectedValue({ message: 'too_many_requests' })
  renderOTP()

  advanceCountdown(60)

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /resend/i }))
  })

  expect(mockGetAuthErrorMessage).toHaveBeenCalledWith('too_many_requests')
  expect(screen.getByText('friendly:too_many_requests')).toBeInTheDocument()
})
})
