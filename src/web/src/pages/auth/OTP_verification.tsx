/*import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSun, IconMoon } from '@tabler/icons-react'
import { useThemeStore } from '../../store/useThemeStore'

export default function OTPVerification() {
  const navigate = useNavigate()
  const { isDark, toggle } = useThemeStore()
  const [otp, setOtp] = useState(['','','',''])
  const [timeLeft, setTimeLeft] = useState(59)
  //const [resendActive, setResendActive] = useState(false)
 const resendActive = timeLeft === 0;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
  if (timeLeft === 0) return; // no setState needed
  const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
  return () => clearTimeout(timer);
}, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return 
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    const newOtp = ['', '', '', '']
    pasted.split('').forEach((char, i) => { newOtp[i] = char})
    setOtp(newOtp)
    inputRefs.current[Math.min(pasted.length, 3)]?.focus()
  }

  const handleResend = () => {
    if (!resendActive) return
    setTimeLeft(59)
    //setResendActive(false)
    setOtp(['', '' ,'', ''])
    inputRefs.current[0]?.focus()
  }

  const handleVerify = () => {
    if (otp.join('').length < 4) return
    navigate('/upload-por') //this has to be changed depending on what we choose as the default dashboard
  }

  //Note we don't need the side bar for this page so I am just using a top bar, with the darkmode icon and not the search bar
  const isComplete = otp.every(d => d !== '')

   return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 flex flex-col">

     
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100 dark:border-white/10">
      <span className="text-base font-bold text-navy-700 dark:text-white">UniTrade</span>
      <button 
      onClick={toggle}
      className="text-gray-500 dark:text-white/70 hover:text-navy-700 dark:hover:text-white transition-colors"
      aria-label="Toggle dark mode" >
        {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
        </button>
        </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-navy-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-navy-700 dark:text-white tracking-tight">
              OTP Verification
            </h1>
            <p className="mt-4 text-sm text-gray-500 dark:text-white/50 leading-relaxed">
              Please enter the OTP (One Time Pin) sent to your student email to complete your verification
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`w-14 h-14 text-center text-xl font-semibold rounded-2xl border-2 outline-none transition-all dark:bg-navy-700
                    ${digit
                      ? 'border-navy-700 dark:border-white text-navy-700 dark:text-white bg-white'
                      : 'border-[#00aaff] text-navy-700 dark:text-white bg-white'
                    }
                    focus:border-navy-700 dark:focus:border-white focus:ring-1 focus:ring-navy-700 dark:focus:ring-white`}
                />
              ))}
            </div>

            <div className="flex items-start justify-between text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-gray-500 dark:text-white/50">Remaining Time:</span>
                <span className="text-[#00aaff] font-semibold">
                  00:{String(timeLeft).padStart(2, '0')}s
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-gray-500 dark:text-white/50">Didn't Get Code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!resendActive}
                  className={`font-semibold mt-0.5 transition-colors ${
                    resendActive
                      ? 'text-navy-700 dark:text-white cursor-pointer hover:text-[#00aaff]'
                      : 'text-gray-300 dark:text-white/20 cursor-not-allowed'
                  }`}
                >
                  Resend
                </button>
              </div>
            </div>

           
            <button
              onClick={handleVerify}
              disabled={!isComplete}
              className={`w-full py-4 rounded-2xl text-white font-bold text-sm tracking-wide transition-all ${
                isComplete
                  ? 'bg-navy-700 hover:bg-navy-600 cursor-pointer active:scale-[0.99]'
                  : 'bg-navy-700/40 cursor-not-allowed'
              }`}
            >
              Verify OTP
            </button>

          </div>
        </div>
      </div>
    </div>
   )
}*/

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSun, IconMoon } from '@tabler/icons-react'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { authService } from '../../services/authService'
import { getAuthErrorMessage } from '../../utils/authErrors'

interface ApiError {
  message: string
}

export default function OTPVerification() {
  const navigate = useNavigate()
  const { isDark, toggle } = useThemeStore()
  const { pendingEmail, clearPendingEmail } = useAuthStore()
  const [otp, setOtp] = useState(['', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(59)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const resendActive = timeLeft === 0
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (timeLeft === 0) return
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 3) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    const newOtp = ['', '', '', '']
    pasted.split('').forEach((char, i) => { newOtp[i] = char })
    setOtp(newOtp)
    inputRefs.current[Math.min(pasted.length, 3)]?.focus()
  }

  const handleResend = async () => {
    if (!resendActive || !pendingEmail) return
    try {
      await authService.resendOtp(pendingEmail)
      setTimeLeft(59)
      setOtp(['', '', '', ''])
      setError(null)
      inputRefs.current[0]?.focus()
    } catch (err: unknown) {
      const error = err as ApiError
      setError(getAuthErrorMessage(error.message))
    }
  }

  const handleVerify = async () => {
    if (otp.join('').length < 4 || !pendingEmail) return
    setLoading(true)
    setError(null)
    try {
      await authService.verifyOtp(pendingEmail, otp.join(''))
      clearPendingEmail()
      navigate('/auth/Login')
    } catch (err: unknown) {
      const error = err as ApiError
      setError(getAuthErrorMessage(error.message))
      setOtp(['', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const isComplete = otp.every(d => d !== '')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100 dark:border-white/10">
        <span className="text-base font-bold text-navy-700 dark:text-white">UniTrade</span>
        <button onClick={toggle} className="text-gray-500 dark:text-white/70 hover:text-navy-700 dark:hover:text-white transition-colors" aria-label="Toggle dark mode">
          {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-navy-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-navy-700 dark:text-white tracking-tight">OTP Verification</h1>
            <p className="mt-4 text-sm text-gray-500 dark:text-white/50 leading-relaxed">
              Please enter the OTP sent to{' '}
              <span className="font-semibold text-navy-700 dark:text-white">{pendingEmail}</span>
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`w-14 h-14 text-center text-xl font-semibold rounded-2xl border-2 outline-none transition-all dark:bg-navy-700
                    ${digit
                      ? 'border-navy-700 dark:border-white text-navy-700 dark:text-white bg-white'
                      : 'border-[#00aaff] text-navy-700 dark:text-white bg-white'
                    }
                    focus:border-navy-700 dark:focus:border-white focus:ring-1 focus:ring-navy-700 dark:focus:ring-white`}
                />
              ))}
            </div>

            <div className="flex items-start justify-between text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-gray-500 dark:text-white/50">Remaining Time:</span>
                <span className="text-[#00aaff] font-semibold">
                  00:{String(timeLeft).padStart(2, '0')}s
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-gray-500 dark:text-white/50">Didn't Get Code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!resendActive}
                  className={`font-semibold mt-0.5 transition-colors ${
                    resendActive
                      ? 'text-navy-700 dark:text-white cursor-pointer hover:text-[#00aaff]'
                      : 'text-gray-300 dark:text-white/20 cursor-not-allowed'
                  }`}
                >
                  Resend
                </button>
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={!isComplete || loading}
              className={`w-full py-4 rounded-2xl text-white font-bold text-sm tracking-wide transition-all ${
                isComplete && !loading
                  ? 'bg-navy-700 hover:bg-navy-600 cursor-pointer active:scale-[0.99]'
                  : 'bg-navy-700/40 cursor-not-allowed'
              }`}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}