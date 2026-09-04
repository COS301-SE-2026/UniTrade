import { useState } from 'react'
import { useNavigate } from 'react-router'
import girl from '../../assets/girl.webp'
import { authService } from '../../services/authService'
import { getAuthErrorMessage } from '../../utils/authErrors'
import { useAuthStore } from '../../store/useAuthStore'
import type { UserRole } from '../../store/useAuthStore'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
//import { useToast } from '../../components/layout/useToast'

interface ApiError {
  message: string
  response?: {
    data?: {
      message?: string
    }
  }
}

type VerificationModalStatus = 'por_pending' | 'under_review'

function getVerificationModalContent(
  status: VerificationModalStatus,
  rejectionReason?: string | null,
): {
  message: string; showProceed: boolean
} {
  if ( status === 'por_pending') {
    const base = 'You have not submitted your proof of registration yet, please press proceed to upload you proof of registration. You will be informed via email of the admin decision. Depending on your status after uploading the proof you can login, but will have partial access to the system.'
  return {
    message: rejectionReason
    ? `An admin has requested that you resubmit your proof of registration. Reason: "${rejectionReason}" please press proceed to go and resubmit your proof of registration.`
    : base,
    showProceed: true
  }
}

return {
  message: 'Your proof of registration is still under review, so when you login you will have partial access to the system. As a buyer you can only browse, add to wishlist, but are not allowed to reserve anything. As a seller you can upload but it will be automatically saved as draft.',
  showProceed: false,
}
}

function VerificationStatusModal({
  status,
  rejectionReason,
  onProceed,
  onClose,
}: Readonly<{
  status: VerificationModalStatus
  rejectionReason?: string | null
  onProceed: () => void
  onClose: () => void
}>) {
  const content = getVerificationModalContent(status, rejectionReason)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Status</h2>
        <p className="text-sm text-gray-600 mb-8">{content.message}</p>
        <div className="flex gap-3">
          {content.showProceed ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full bg-navy-700 text-white font-bold text-sm py-3 hover:bg-sky-900 transition-colors"
              > Cancel
              </button>
              <button
                type="button"
                onClick={onProceed}
                className="flex-1 rounded-full bg-navy-700 text-white font-bold text-sm py-3 hover:bg-sky-900 transition-colors"
              >
                Procceed
              </button>
            </>
          ) : (



            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full bg-navy-700 text-white font-bold text-sm py-3 hover:bg-sky-900 transition-colors"
            >
              Continue
            </button>

          )}
        </div>
      </div>
    </div>
  )
}
const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setUser, setPendingEmail } = useAuthStore()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [verificationModal, setVerificationModal] = useState<VerificationModalStatus | null>(null)
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null)
  const [modalRejectionReason, setModalRejectionReason] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const proceedToDestination = (role: UserRole) => {
    if (role === 'admin') navigate('/admin/disputes')
    else navigate('/buyer/listings')
  }
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {

    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await authService.login({
        Email: formData.email,
        Password: formData.password,
      })

      const me = await authService.getMe()
      const userData = 'user' in me ? me.user : me
      const stdData = 'std' in me ? me.std : undefined

      const needsResubmission = 
      stdData?.verificationRequestStatus === 'under_review' &&
      stdData?.verificationAdminDecision === 'resubmission';
      setUser({
        id: userData.userId,
        name: `${userData.firstName} ${userData.lastName}`,
        initials: `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase(),
        role: userData.userRole as UserRole,
        university: stdData?.university,
      })

      if (stdData?.verificationRequestStatus === 'otp_pending') {
        setPendingEmail(formData.email);
        navigate('/verify-otp');
        return;
      }

      if (stdData?.verificationRequestStatus === 'por_pending'
        ||needsResubmission) {
        setPendingRole(userData.userRole as UserRole);
        setModalRejectionReason(needsResubmission ? (stdData?.verificationRejectionReason ?? null) : null);
        setVerificationModal('por_pending')
        return;
      }

      if(stdData?.verificationRequestStatus === 'under_review') {
        setPendingRole(userData.userRole as UserRole);
        setVerificationModal('under_review');
        return;
      }

      proceedToDestination(userData.userRole as UserRole)

    } catch (err: unknown) {

      const error = err as ApiError
      setError(getAuthErrorMessage(error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    setVerificationModal(null)
    if (pendingRole) proceedToDestination(pendingRole)
  }

  const handleModalProceed = () => {
    setVerificationModal(null)
    navigate('/auth/ProofUpload')
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
              <label htmlFor='email' className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Email Address</label>
              <input id="email" type="text" inputMode='email' name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required
                className="w-full rounded-2xl border border-sky-300 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all" />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-600 uppercase mb-1 ml-1">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"}
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

        <div className="hidden relative md:block md:w-1/2">
          <img src={girl} alt="model-student-holding-books" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/80 via-sky-900/40 to-transparent" />
        </div>
      </div>

      {verificationModal && (
        <VerificationStatusModal
          status={verificationModal}
          onProceed={handleModalProceed}
          rejectionReason={modalRejectionReason}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

export default Login