import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { IconSun, IconMoon, IconEye, IconEyeOff } from '@tabler/icons-react'
import { useThemeStore } from '../../store/useThemeStore'
import { authService } from '../../services/authService'
import { getAuthErrorMessage } from '../../utils/authErrors'
import { LoadingState } from '../../components/layout/Spinner'

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
}
