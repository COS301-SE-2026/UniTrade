import { useState } from 'react'
import { authService } from '../../services/authService'
import { getAuthErrorMessage } from '../../utils/authErrors'

interface ApiError {
  message: string
}

export default function ForgotPasswordModal({
  onClose,
  onSent,
}: Readonly<{
  onClose: () => void
  onSent: (email: string) => void
}>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try 
    {
      await authService.forgotPassword(email)
      onSent(email)
    } catch (err: unknown) {
      const error = err as ApiError
      setError(getAuthErrorMessage(error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Reset your password
        </h2>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Enter your email and we will send you a one-time code.
        </p>

        {error && (
          <div className="rounded-md bg-red-100 p-4 mb-4">
            <p className="text-sm text-red-700">
                {error}
            </p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="reset-email" className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">
              Email Address
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#0F2D5E] py-3 text-sm font-bold tracking-widest text-white transition-colors hover:bg-sky-900 shadow-md disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'SEND RESET CODE'}
          </button>
        </form>
      </div>
    </div>
  )
}