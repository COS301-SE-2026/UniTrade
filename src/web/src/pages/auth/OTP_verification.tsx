import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSun, IconMoon } from '@tabler/icons-react'
import { useThemeStore } from '../../store/useThemeStore'

export default function OTPVerification() {
  const navigate = useNavigate()
  const { isDark, toggle } = useThemeStore()
  const [otp, setOtp] = useState(['','','',''])
  const [timeLeft, setTimeLeft] = useState(59)
  const [resendActive, setResendActive] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (timeLeft === 0){ setResendActive(true); return}
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft])

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
    setResendActive(false)
    setOtp(['', '' ,'', ''])
    inputRefs.current[0]?.focus()
  }

  const handleVerify = () => {
    if (otp.join('').length < 4) return
    navigate('/upload-por') //this has to be changed depending on what we choose as the default dashboard
  }
}