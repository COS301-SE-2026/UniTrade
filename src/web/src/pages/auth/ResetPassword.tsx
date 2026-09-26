import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { authService } from '../../services/authService'
import { getAuthErrorMessage } from '../../utils/authErrors'
import { Spinner } from '../../components/layout/Spinner'

interface ApiError {
    message: string
}

type Stage = 'otp' | 'password'

export default function ResetPassword() {
    const navigate = useNavigate()
    const location = useLocation()
    const email = (location.state as {email? : string} | null)?.email

    const [stage, setStage] = useState<Stage>('otp')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])


    useEffect(() => {
    if (!email) navigate('/auth/Login', { replace: true })
  }, [email, navigate])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const isOtpComplete = otp.every((d) => d !== '')

  const handleVerifyOtp = async () => {
    if (!isOtpComplete || !email) return
    setLoading(true)
    setError(null)
    try {
      await authService.verifyResetOtp(email, otp.join(''))
      setStage('password')
    } catch (err: unknown) {
      const error = err as ApiError
      setError(getAuthErrorMessage(error.message))
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await authService.resetPassword(email, otp.join(''), newPassword)
      navigate('/auth/Login', { replace: true })
    } catch (err: unknown) {
      const error = err as ApiError
      setError(getAuthErrorMessage(error.message))
    } finally {
      setLoading(false)
    }
  }

  if (!email) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100 dark:border-white/10">
        <span className="text-base font-bold text-navy-700 dark:text-white">
            UniTrade
        </span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-navy-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
          {stage === 'otp' ? (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-navy-700 dark:text-white tracking-tight">
                    Enter Reset Code
                    </h1>
                <p className="mt-4 text-sm text-gray-500 dark:text-white/50 leading-relaxed">
                  We sent a code to{' '}
                  <span className="font-semibold text-navy-700 dark:text-white">
                    {email}
                </span>
                </p>
              </div>

              <div className="mt-8 space-y-6">
                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                    <p className="text-sm text-red-600 dark:text-red-400 text-center">
                        {error}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-6 gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`w-14 h-14 text-center text-xl font-semibold rounded-2xl border-2 outline-none transition-all dark:bg-navy-700
                        ${digit
                          ? 'border-navy-700 dark:border-white text-navy-700 dark:text-white bg-white'
                          : 'border-[#00aaff] text-navy-700 dark:text-white bg-white'
                        }
                        focus:border-navy-700 dark:focus:border-white focus:ring-1 focus:ring-navy-700 dark:focus:ring-white`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={!isOtpComplete || loading}
                  className={`w-full py-4 rounded-2xl text-white font-bold text-sm tracking-wide transition-all ${isOtpComplete && !loading
                    ? 'bg-navy-700 hover:bg-navy-600 cursor-pointer active:scale-[0.99]'
                    : 'bg-navy-700/40 cursor-not-allowed'
                    }`}
                >
                  {loading && <Spinner size={18} className="!text-white" />}
                  {loading ? 'Verifying ...' : 'Verify Code'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-navy-700 dark:text-white tracking-tight">
                    New Password
                </h1>
                <p className="mt-4 text-sm text-gray-500 dark:text-white/50 leading-relaxed">
                  Choose a new password for your account.
                </p>
              </div>

              <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                    <p className="text-sm text-red-600 dark:text-red-400 text-center">
                        {error}
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="new-password" className="block text-xs font-semibold text-gray-600 dark:text-white/50 uppercase mb-1 ml-1">
                  New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-sky-300 px-4 py-3 pr-11 dark:bg-navy-700 dark:text-white focus:outline-none focus:ring-sky-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-semibold text-gray-600 dark:text-white/50 uppercase mb-1 ml-1">
                  Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-sky-300 px-4 py-3 dark:bg-navy-700 dark:text-white focus:outline-none focus:ring-sky-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#0F2D5E] py-3 text-sm font-bold tracking-widest text-white transition-colors hover:bg-sky-900 shadow-md disabled:opacity-50"
                >
                  {loading && <Spinner size={16} className="!text-white" />}
                  {loading ? 'Resetting...' : 'RESET PASSWORD'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
