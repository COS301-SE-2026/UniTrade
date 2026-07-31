import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import girl from '../../assets/girl.png'
import { authService } from '../../services/authService'
import type { University } from '../../services/authService'
import { getAuthErrorMessage } from '../../utils/authErrors'
import { useAuthStore } from '../../store/useAuthStore'
import { IconEye, IconEyeOff } from "@tabler/icons-react";

interface ApiError {
  message: string
}

const Signup: React.FC = () => {
  const navigate = useNavigate()
  const { setPendingEmail } = useAuthStore()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    university: '',
    degreeProgram: '',
    yearOfStudy: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)


  const [universities, setUniversities] = useState<University[]>([]);
  const [uniLoading, setUniloading] = useState(true);
  const [uniError, setUniError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const data = await authService.getUniversities();
        setUniversities(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not load universities';
        setUniError(message);
      } finally {
        setUniloading(false);
      }
    };

    loadUniversities();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await authService.register(formData)
      // save email so OTP page knows who to verify
      setPendingEmail(formData.email)
      navigate('/verify-otp')
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
        <div className="flex w-full flex-col justify-center px-12 py-12 md:w-3/5 lg:px-20">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 uppercase">Get Started</h1>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-100 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">First Name</label>
                <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required
                  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Last Name</label>
                <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required
                  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Student Email</label>
              <input type="text" inputMode="email" name="email" placeholder="Student Email" value={formData.email} onChange={handleChange} required
                className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">University</label>
              <select
                name="university"
                value={formData.university}
                onChange={handleChange}
                required
                disabled={uniLoading}
                className={`w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1
                 focus:ring-sky-500 transition-all disabled:opacity-60 ${formData.university === ""? "text-gray-400" : "text-gray-900"}`}>
                <option value="">
                  {uniLoading
                    ? 'Loading universities...'
                    : uniError || 'Select University'}
                </option>
                {!uniLoading &&
                  !uniError &&
                  universities.map((uni) => (
                    <option key={uni.universityId} value={uni.name}>
                      {uni.name}
                    </option>
                  ))}
              </select>
              {uniError && (
                <p className="text-xs text-red-500 mt-1">{uniError}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Degree Program</label>
                <input type="text" name="degreeProgram" placeholder="Degree Program" value={formData.degreeProgram} onChange={handleChange}
                  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Year of Study</label>
                <input type="text" name="yearOfStudy" placeholder="Year of Study" value={formData.yearOfStudy} onChange={handleChange} required
                  className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-sky-300 px-4 py-3 pr-11 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all" />
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

            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-[#0F2D5E] py-3 text-sm font-bold tracking-widest text-white transition-colors hover:bg-sky-900 shadow-md disabled:opacity-50">
              {loading ? 'Signing up...' : 'SIGNUP'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Already have an account? <a href="/auth/Login" className="font-bold text-sky-900 hover:underline">Login</a>
          </div>
        </div>
        <div className="hidden relative md:block md:w-1/2">
          <img src={girl} alt="model-student-holding-books" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/80 via-sky-900/40 to-transparent" />
        </div>
      </div>
    </div>
  )
}

export default Signup
