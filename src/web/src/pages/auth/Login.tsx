import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import girl from '../../assets/girl.png'
import { authService } from '../../services/authService'
import { getAuthErrorMessage } from '../../utils/authErrors'
import { useAuthStore } from '../../store/useAuthStore'
import type { UserRole } from '../../store/useAuthStore'
import { IconEye, IconEyeOff } from '@tabler/icons-react'

interface ApiError {
  message: string
  response?: {
    data?: {
      message?: string
    }
  }
}

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await authService.login({
        Email: formData.email,
        Password: formData.password,
      })

      const me = await authService.getMe()


      setUser({
        id: me.user.userId,
        name: `${me.user.firstName} ${me.user.lastName}`,
        initials: `${me.user.firstName[0]}${me.user.lastName[0]}`.toUpperCase(),
        role: me.user.userRole as UserRole,
        university: me.std.university,
      })
      if (me.user.userRole === 'admin') navigate('/admin/dashboard')
      else navigate('/buyer/listings')

    } catch (err: unknown) {
      const error = err as ApiError
      setError(getAuthErrorMessage(error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">


        <div className="flex w-full flex-col justify-center px-12 py-16 md:w-1/2 lg:px-20">
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 uppercase">Welcome Back!</h1>
            <p className="mt-2 text-sm text-gray-500">Enter your credentials to access your account</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-100 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Email Address</label>
              <input type="text" inputMode='email' name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required
                className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-sky-300 px-4 py-3 pr-11 focus:outline-none focus:ring-sky-500 transition-all" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"} >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 cursor-pointer text-gray-600">
                <input type="checkbox" className="h-4 w-4 rounded-full border-sky-300 text-sky-600 focus:ring-sky-500" />
                <span>Remember Me</span>
              </label>
              <a href="#" className="font-bold text-sky-900 hover:underline">Forgot Password</a>
            </div>

            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-[#0F2D5E] py-3 text-sm font-bold tracking-widest text-white transition-colors hover:bg-sky-900 shadow-md disabled:opacity-50">
              {loading ? 'Logging in...' : 'LOGIN'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/auth/Signup" className="font-bold text-sky-900 hover:underline">Sign Up</a>
          </div>
        </div>

        {/* Right side */}
        <div className="hidden relative md:block md:w-1/2">
          <img src={girl} alt="model-student-holding-books" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/80 via-sky-900/40 to-transparent" />
        </div>
      </div>
    </div>
  )
}

export default Login